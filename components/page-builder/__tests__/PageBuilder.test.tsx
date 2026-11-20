import { render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest";
import pageData from "@/data/data.json";
import { PageBuilder } from "../PageBuilder";
import { blockRegistry, resolveBlock, type BlockRegistry } from "../registry";

/** Minimal registry so tests don't depend on the real organisms' markup. */
function Stub({ label }: { label?: string }) {
  return <section data-testid="stub">{label ?? "stub"}</section>;
}

function Exploding(): never {
  throw new Error("Boom: unexpected props shape");
}

const testRegistry = {
  stub: Stub,
  exploding: Exploding,
} as unknown as BlockRegistry;

describe("PageBuilder", () => {
  let warnSpy: MockInstance<typeof console.warn>;
  let errorSpy: MockInstance<typeof console.error>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe("happy path", () => {
    it("renders known blocks in the order the CMS sent them", () => {
      render(
        <PageBuilder
          registry={testRegistry}
          blocks={[
            { type: "stub", props: { label: "first" } },
            { type: "stub", props: { label: "second" } },
          ]}
        />,
      );

      const rendered = screen.getAllByTestId("stub").map((el) => el.textContent);
      expect(rendered).toEqual(["first", "second"]);
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it("renders a block that has no `props` key", () => {
      render(<PageBuilder registry={testRegistry} blocks={[{ type: "stub" }]} />);
      expect(screen.getByTestId("stub")).toHaveTextContent("stub");
    });

    it("renders nothing for an empty page", () => {
      const { container } = render(<PageBuilder registry={testRegistry} blocks={[]} />);
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe('unknown component type (e.g. "slider")', () => {
    const blocks = [
      { id: "a", type: "stub", props: { label: "before" } },
      { id: "b", type: "slider", props: { slides: [] } },
      { id: "c", type: "stub", props: { label: "after" } },
    ];

    it("does not crash", () => {
      expect(() => render(<PageBuilder registry={testRegistry} blocks={blocks} />)).not.toThrow();
    });

    it("still renders every known block around it", () => {
      render(<PageBuilder registry={testRegistry} blocks={blocks} />);
      expect(screen.getAllByTestId("stub").map((el) => el.textContent)).toEqual([
        "before",
        "after",
      ]);
    });

    it("shows a development placeholder that names the missing type", () => {
      render(<PageBuilder registry={testRegistry} blocks={blocks} />);
      const fallback = screen.getByTestId("block-fallback");
      expect(fallback).toHaveAttribute("data-reason", "unknown");
      expect(fallback).toHaveAttribute("data-block-type", "slider");
      expect(within(fallback).getByText(/unknown block type "slider"/i)).toBeInTheDocument();
    });

    it("logs a warning so the problem is observable", () => {
      render(<PageBuilder registry={testRegistry} blocks={blocks} />);
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Unknown block type "slider"'));
    });

    it("renders nothing for the unknown block in production", () => {
      vi.stubEnv("NODE_ENV", "production");
      render(<PageBuilder registry={testRegistry} blocks={blocks} />);
      expect(screen.queryByTestId("block-fallback")).not.toBeInTheDocument();
      expect(screen.getAllByTestId("stub")).toHaveLength(2);
    });

    it("handles several unknown types on the same page", () => {
      render(
        <PageBuilder
          registry={testRegistry}
          blocks={[{ type: "slider" }, { type: "carousel" }, { type: "map" }]}
        />,
      );
      expect(screen.getAllByTestId("block-fallback")).toHaveLength(3);
    });

    it("treats type matching as case-sensitive", () => {
      render(<PageBuilder registry={testRegistry} blocks={[{ type: "STUB" }]} />);
      expect(screen.queryByTestId("stub")).not.toBeInTheDocument();
      expect(screen.getByTestId("block-fallback")).toHaveAttribute("data-reason", "unknown");
    });

    it.each(["toString", "constructor", "__proto__", "hasOwnProperty"])(
      'does not resolve inherited Object property "%s" as a component',
      (type) => {
        expect(resolveBlock(type, testRegistry)).toBeUndefined();
        expect(() =>
          render(<PageBuilder registry={testRegistry} blocks={[{ type }]} />),
        ).not.toThrow();
        expect(screen.getByTestId("block-fallback")).toHaveAttribute("data-reason", "unknown");
      },
    );
  });

  describe("malformed CMS entries", () => {
    it.each([
      ["null", null],
      ["a string", "hero"],
      ["a number", 42],
      ["an array", [{ type: "stub" }]],
      ["an object without type", { props: {} }],
      ["a non-string type", { type: 123 }],
      ["an empty type", { type: "   " }],
      ["props that are not an object", { type: "stub", props: "oops" }],
    ])("skips %s without crashing and keeps rendering the rest", (_label, bad) => {
      render(
        <PageBuilder registry={testRegistry} blocks={[bad, { type: "stub", props: { label: "ok" } }]} />,
      );
      expect(screen.getByTestId("block-fallback")).toHaveAttribute("data-reason", "invalid");
      expect(screen.getByTestId("stub")).toHaveTextContent("ok");
    });

    it.each([
      ["undefined", undefined],
      ["null", null],
      ["an object", { type: "stub" }],
      ["a string", "blocks"],
    ])("renders nothing when `blocks` is %s", (_label, blocks) => {
      const { container } = render(<PageBuilder registry={testRegistry} blocks={blocks} />);
      expect(container).toBeEmptyDOMElement();
      expect(warnSpy).toHaveBeenCalled();
    });
  });

  describe("runtime errors inside a registered block", () => {
    it("contains the crash to that block and renders the others", () => {
      render(
        <PageBuilder
          registry={testRegistry}
          blocks={[
            { type: "stub", props: { label: "before" } },
            { type: "exploding" },
            { type: "stub", props: { label: "after" } },
          ]}
        />,
      );

      expect(screen.getAllByTestId("stub")).toHaveLength(2);
      expect(screen.getByTestId("block-fallback")).toHaveAttribute("data-reason", "error");
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Block "exploding"'),
        expect.any(Error),
        expect.anything(),
      );
    });
  });

  describe("recovery", () => {
    function Flaky({ fail }: { fail?: boolean }) {
      if (fail) throw new Error("bad props");
      return <section data-testid="flaky">recovered</section>;
    }
    const flakyRegistry = { flaky: Flaky } as unknown as BlockRegistry;

    it("re-renders a crashed block once its props are fixed (e.g. from the editor)", () => {
      const { rerender } = render(
        <PageBuilder registry={flakyRegistry} blocks={[{ type: "flaky", props: { fail: true } }]} />,
      );
      expect(screen.getByTestId("block-fallback")).toHaveAttribute("data-reason", "error");

      rerender(<PageBuilder registry={flakyRegistry} blocks={[{ type: "flaky", props: { fail: false } }]} />);
      expect(screen.getByTestId("flaky")).toHaveTextContent("recovered");
    });

    it("wraps blocks with their index only when instrumented for the editor", () => {
      const { container, rerender } = render(
        <PageBuilder registry={testRegistry} blocks={[{ type: "stub" }, { type: "slider" }]} />,
      );
      expect(container.querySelector("[data-block-index]")).toBeNull();

      rerender(<PageBuilder registry={testRegistry} blocks={[{ type: "stub" }, { type: "slider" }]} instrument />);
      expect(
        [...container.querySelectorAll("[data-block-index]")].map((el) => el.getAttribute("data-block-index")),
      ).toEqual(["0", "1"]);
    });
  });

  describe("integration with the real registry and data.json", () => {
    it("registers every block type used by the shipped data.json (contract test)", () => {
      const missing = pageData.blocks
        .map((block) => block.type)
        .filter((type) => !resolveBlock(type, blockRegistry));
      expect(missing).toEqual([]);
    });

    it("renders the full mocked CMS page without crashing or fallbacks", () => {
      render(<PageBuilder blocks={pageData.blocks} />);

      expect(
        screen.getByRole("heading", { level: 1, name: /train like a pro/i }),
      ).toBeInTheDocument();
      for (const region of ["Hero", "Stats", "Programs", "Pricing", "Testimonials", "FAQ", "Call to action"]) {
        expect(screen.getByRole("region", { name: region })).toBeInTheDocument();
      }
      expect(screen.getByRole("article", { name: "Pro plan" })).toHaveTextContent("Most popular");
      expect(screen.queryByTestId("block-fallback")).not.toBeInTheDocument();
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('survives the real CMS page when it asks for an unregistered "slider"', () => {
      const withSlider = [...pageData.blocks];
      withSlider.splice(3, 0, { id: "blk_slider_01", type: "slider", props: { slides: [] } } as never);
      render(<PageBuilder blocks={withSlider} />);

      expect(
        screen.getByRole("heading", { level: 1, name: /train like a pro/i }),
      ).toBeInTheDocument();
      for (const region of ["Hero", "Stats", "Programs", "Pricing", "Testimonials", "FAQ", "Call to action"]) {
        expect(screen.getByRole("region", { name: region })).toBeInTheDocument();
      }
      expect(screen.getByRole("article", { name: "Pro plan" })).toHaveTextContent("Most popular");

      const fallback = screen.getByTestId("block-fallback");
      expect(fallback).toHaveAttribute("data-block-type", "slider");
    });

    it("tolerates a real block receiving empty props", () => {
      expect(() =>
        render(
          <PageBuilder
            blocks={[
              { type: "hero", props: { title: "Empty" } },
              { type: "stats" },
              { type: "featureGrid", props: { title: "Empty" } },
              { type: "pricing", props: { title: "Empty" } },
              { type: "testimonials", props: { title: "Empty", items: [{ quote: "q", author: "A" }] } },
              { type: "faq", props: { title: "Empty" } },
              { type: "ctaBanner", props: { title: "Empty" } },
            ]}
          />,
        ),
      ).not.toThrow();
      expect(screen.queryByTestId("block-fallback")).not.toBeInTheDocument();
    });
  });
});
