// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

const writeFile = vi.fn().mockResolvedValue(undefined);
vi.mock("node:fs/promises", () => ({ writeFile, default: { writeFile } }));

const { GET, PUT } = await import("../route");

const validPage = { slug: "home", title: "Home", blocks: [{ type: "hero", props: { title: "Hi" } }] };

function put(body: string, headers: Record<string, string> = {}) {
  return PUT(
    new Request("http://localhost:3000/api/page", {
      method: "PUT",
      headers: { host: "localhost:3000", "content-type": "application/json", ...headers },
      body,
    }),
  );
}

describe("/api/page", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    writeFile.mockClear();
  });

  it("GET returns the CMS page", async () => {
    const response = await GET();
    const page = await response.json();
    expect(response.status).toBe(200);
    expect(page).toMatchObject({ slug: "home", blocks: expect.any(Array) });
  });

  it("PUT is forbidden outside development", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const response = await put(JSON.stringify(validPage));
    expect(response.status).toBe(403);
    expect(writeFile).not.toHaveBeenCalled();
  });

  describe("in development", () => {
    it("writes valid pages to data/data.json", async () => {
      vi.stubEnv("NODE_ENV", "development");
      const response = await put(JSON.stringify(validPage));
      expect(response.status).toBe(200);
      expect(writeFile).toHaveBeenCalledWith(
        expect.stringMatching(/data[\\/]data\.json$/),
        `${JSON.stringify(validPage, null, 2)}\n`,
        "utf8",
      );
    });

    it("rejects invalid JSON", async () => {
      vi.stubEnv("NODE_ENV", "development");
      expect((await put("{ nope")).status).toBe(400);
    });

    it("rejects pages that fail validation, with the issues", async () => {
      vi.stubEnv("NODE_ENV", "development");
      const response = await put(JSON.stringify({ title: "No slug", blocks: [null] }));
      expect(response.status).toBe(422);
      expect((await response.json()).issues.length).toBeGreaterThan(0);
      expect(writeFile).not.toHaveBeenCalled();
    });

    it("rejects cross-origin writes", async () => {
      vi.stubEnv("NODE_ENV", "development");
      const response = await put(JSON.stringify(validPage), { origin: "https://evil.example" });
      expect(response.status).toBe(403);
    });

    it("still allows unknown block types (warning only)", async () => {
      vi.stubEnv("NODE_ENV", "development");
      const response = await put(JSON.stringify({ ...validPage, blocks: [{ type: "slider" }] }));
      expect(response.status).toBe(200);
      expect((await response.json()).issues[0].level).toBe("warning");
    });
  });
});
