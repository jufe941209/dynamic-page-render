import { describe, expect, it } from "vitest";
import pageData from "@/data/data.json";
import { BLOCK_TEMPLATES } from "../blockTemplates";
import { KNOWN_BLOCK_TYPES } from "../blockTypes";
import { validatePage } from "../validate";

const base = { slug: "home", title: "Home", blocks: [] as unknown[] };

describe("validatePage", () => {
  it("accepts the shipped data.json with zero errors and zero warnings", () => {
    expect(validatePage(pageData, KNOWN_BLOCK_TYPES)).toEqual({ valid: true, issues: [] });
  });

  it.each([null, [], "page", 1])("rejects a non-object root (%s)", (value) => {
    expect(validatePage(value, KNOWN_BLOCK_TYPES).valid).toBe(false);
  });

  it("requires slug, title and a blocks array", () => {
    const result = validatePage({ slug: " ", blocks: {} }, KNOWN_BLOCK_TYPES);
    expect(result.valid).toBe(false);
    const messages = result.issues.map((issue) => issue.message).join(" ");
    expect(messages).toMatch(/slug/);
    expect(messages).toMatch(/title/);
    expect(messages).toMatch(/blocks/);
  });

  it("requires site.name when site is present", () => {
    expect(validatePage({ ...base, site: {} }, KNOWN_BLOCK_TYPES).valid).toBe(false);
    expect(validatePage({ ...base, site: { name: "Velocity" } }, KNOWN_BLOCK_TYPES).valid).toBe(true);
  });

  it("flags malformed blocks as errors pointing at their index", () => {
    const result = validatePage({ ...base, blocks: [{ type: "hero" }, { props: {} }] }, KNOWN_BLOCK_TYPES);
    expect(result.valid).toBe(false);
    expect(result.issues).toEqual([expect.objectContaining({ level: "error", blockIndex: 1 })]);
  });

  it("treats unknown types as warnings, not errors (the renderer tolerates them)", () => {
    const result = validatePage({ ...base, blocks: [{ type: "slider" }] }, KNOWN_BLOCK_TYPES);
    expect(result.valid).toBe(true);
    expect(result.issues[0]).toMatchObject({ level: "warning", blockIndex: 0 });
  });

  it("warns about duplicate block ids", () => {
    const result = validatePage(
      { ...base, blocks: [{ id: "a", type: "hero" }, { id: "a", type: "faq" }] },
      KNOWN_BLOCK_TYPES,
    );
    expect(result.issues).toEqual([expect.objectContaining({ level: "warning", blockIndex: 1 })]);
  });

  it("does not treat Object.prototype keys as known types", () => {
    const result = validatePage({ ...base, blocks: [{ type: "toString" }] }, KNOWN_BLOCK_TYPES);
    expect(result.issues[0]).toMatchObject({ level: "warning" });
  });
});

describe("BLOCK_TEMPLATES", () => {
  it("provides a template that validates for every known block type", () => {
    const blocks = KNOWN_BLOCK_TYPES.map((type) => ({ type, props: BLOCK_TEMPLATES[type] }));
    const result = validatePage({ ...base, blocks }, KNOWN_BLOCK_TYPES);
    expect(result).toEqual({ valid: true, issues: [] });
  });
});
