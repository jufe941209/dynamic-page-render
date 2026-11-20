import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import pageData from "@/data/data.json";
import type { CmsPage } from "@/lib/cms/types";
import { PageEditor } from "../PageEditor";

const initialPage = pageData as CmsPage;
const PRICING_INDEX = initialPage.blocks.findIndex((b) => (b as { type: string }).type === "pricing");

/** jsdom has no DataTransfer; the editor only needs setData + effectAllowed. */
const dataTransfer = () => ({ setData: vi.fn(), effectAllowed: "" });

function renderEditor(canPublish = true) {
  return render(<PageEditor initialPage={initialPage} canPublish={canPublish} />);
}

const sections = () =>
  within(screen.getByRole("list", { name: "Page sections" })).getAllByRole("listitem");
const inspector = () => screen.getByRole("complementary", { name: "Inspector" });

/** Publishes and returns the page body sent to PUT /api/page. */
async function publishAndCapture(): Promise<CmsPage> {
  const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ ok: true }));
  fireEvent.click(screen.getByRole("button", { name: /^publish/i }));
  await screen.findByText("Published");
  return JSON.parse(fetchMock.mock.calls[0][1]!.body as string) as CmsPage;
}

describe("PageEditor", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("layers & validation", () => {
    it("lists every section from data.json and flags the unknown one", () => {
      renderEditor();
      expect(sections()).toHaveLength(initialPage.blocks.length);
      expect(screen.getByRole("list", { name: "Page sections" })).toHaveTextContent("Unknown");
      expect(screen.getByRole("region", { name: "Validation" })).toHaveTextContent(/unknown type "slider"/i);
    });

    it("starts clean, with nothing to publish", () => {
      renderEditor();
      expect(screen.getByText("Published")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /^publish/i })).toBeDisabled();
    });
  });

  describe("visual form editing", () => {
    it("edits the hero title through a text field", async () => {
      renderEditor();
      const title = within(inspector()).getByLabelText("Title");
      expect(title).toHaveValue("Train like a pro.");

      fireEvent.change(title, { target: { value: "Run faster." } });
      expect(screen.getByText("Unsaved changes")).toBeInTheDocument();

      const sent = await publishAndCapture();
      expect((sent.blocks[0] as { props: { title: string } }).props.title).toBe("Run faster.");
    });

    it("adds a pricing plan with the 'Add plan' button", async () => {
      renderEditor();
      fireEvent.click(within(sections()[PRICING_INDEX]).getByRole("button", { name: /pricing/i }));
      fireEvent.click(within(inspector()).getByRole("button", { name: /add plan/i }));

      const sent = await publishAndCapture();
      const plans = (sent.blocks[PRICING_INDEX] as { props: { plans: unknown[] } }).props.plans;
      expect(plans).toHaveLength(4);
    });

    it("toggles a boolean with an accessible switch", () => {
      renderEditor();
      fireEvent.click(within(sections()[PRICING_INDEX]).getByRole("button", { name: /pricing/i }));
      fireEvent.click(within(inspector()).getByRole("button", { name: "Pro" }));
      const toggle = within(inspector()).getByRole("switch", { name: "Highlighted" });
      expect(toggle).toHaveAttribute("aria-checked", "true");
      fireEvent.click(toggle);
      expect(toggle).toHaveAttribute("aria-checked", "false");
    });

    it("edits page settings (site name)", async () => {
      renderEditor();
      fireEvent.click(screen.getByRole("button", { name: /page settings/i }));
      fireEvent.change(within(inspector()).getByLabelText("Name"), { target: { value: "Apex" } });
      const sent = await publishAndCapture();
      expect(sent.site?.name).toBe("Apex");
    });
  });

  describe("JSON mode", () => {
    it("shows a parse error for invalid JSON without crashing, and keeps the draft clean", () => {
      renderEditor();
      fireEvent.click(within(inspector()).getByRole("tab", { name: "JSON" }));
      const editor = within(inspector()).getByLabelText(/section #0 json/i);
      fireEvent.change(editor, { target: { value: '{ "type": "hero", ' } });

      expect(editor).toHaveAttribute("aria-invalid", "true");
      expect(within(inspector()).getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText("Published")).toBeInTheDocument();
    });

    it("blocks publishing while there are validation errors", () => {
      renderEditor();
      fireEvent.click(within(inspector()).getByRole("tab", { name: "JSON" }));
      fireEvent.change(within(inspector()).getByLabelText(/section #0 json/i), {
        target: { value: '{ "props": {} }' },
      });
      expect(screen.getByRole("region", { name: "Validation" })).toHaveTextContent(/malformed/i);
      expect(screen.getByRole("button", { name: /^publish/i })).toBeDisabled();
    });
  });

  describe("adding & arranging sections", () => {
    it("adds a section by clicking a library tile", () => {
      renderEditor();
      fireEvent.click(screen.getByRole("button", { name: "Add Stats section" }));
      expect(sections()).toHaveLength(initialPage.blocks.length + 1);
    });

    it("adds a section by dragging a library tile onto the layers", () => {
      renderEditor();
      fireEvent.dragStart(screen.getByRole("button", { name: "Add FAQ section" }), { dataTransfer: dataTransfer() });
      fireEvent.dragOver(sections()[0], { dataTransfer: dataTransfer() });
      fireEvent.drop(screen.getByRole("list", { name: "Page sections" }), { dataTransfer: dataTransfer() });

      expect(sections()).toHaveLength(initialPage.blocks.length + 1);
      expect(sections()[0]).toHaveTextContent("FAQ");
    });

    it("adds a section by dropping it on the live preview", () => {
      renderEditor();
      fireEvent.dragStart(screen.getByRole("button", { name: "Add Hero section" }), { dataTransfer: dataTransfer() });
      const dropzone = screen.getByTestId("preview-dropzone");
      fireEvent.dragOver(dropzone, { dataTransfer: dataTransfer() });
      fireEvent.drop(dropzone, { dataTransfer: dataTransfer() });
      expect(sections()).toHaveLength(initialPage.blocks.length + 1);
    });

    it("reorders sections by dragging a layer", () => {
      renderEditor();
      const firstLabel = sections()[0].textContent;
      const handle = sections()[0].querySelector("[draggable]")!;
      fireEvent.dragStart(handle, { dataTransfer: dataTransfer() });
      fireEvent.dragOver(sections()[2], { dataTransfer: dataTransfer() });
      fireEvent.drop(screen.getByRole("list", { name: "Page sections" }), { dataTransfer: dataTransfer() });
      expect(sections()[1].textContent).toBe(firstLabel);
    });
  });

  it("explains that publishing is unavailable in read-only builds", () => {
    renderEditor(false);
    expect(screen.getByText(/read-only build/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^publish/i })).toBeDisabled();
  });
});
