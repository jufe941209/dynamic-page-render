import { describe, expect, it } from "vitest";
import type { CmsPage } from "@/lib/cms/types";
import { editorReducer, initEditorState } from "../editorReducer";

const page: CmsPage = {
  slug: "home",
  title: "Home",
  blocks: [
    { id: "a", type: "hero" },
    { id: "b", type: "faq" },
    { id: "c", type: "ctaBanner" },
  ],
};

const ids = (state: ReturnType<typeof initEditorState>) =>
  state.page.blocks.map((block) => (block as { id: string }).id);

describe("editorReducer", () => {
  it("selects the first block initially, or nothing for an empty page", () => {
    expect(initEditorState(page).selected).toBe(0);
    expect(initEditorState({ ...page, blocks: [] }).selected).toBeNull();
  });

  it("adds a block right after the selection and selects it", () => {
    const state = editorReducer({ ...initEditorState(page), selected: 0 }, {
      type: "add",
      block: { id: "new", type: "stats" },
    });
    expect(ids(state)).toEqual(["a", "new", "b", "c"]);
    expect(state.selected).toBe(1);
    expect(state.revision).toBe(1);
  });

  it("moves blocks and keeps the moved block selected", () => {
    const state = editorReducer(initEditorState(page), { type: "move", index: 0, direction: 1 });
    expect(ids(state)).toEqual(["b", "a", "c"]);
    expect(state.selected).toBe(1);
  });

  it("ignores moves past either end", () => {
    const initial = initEditorState(page);
    expect(editorReducer(initial, { type: "move", index: 0, direction: -1 })).toBe(initial);
    expect(editorReducer(initial, { type: "move", index: 2, direction: 1 })).toBe(initial);
  });

  it("duplicates a block with a fresh id, without sharing references", () => {
    const state = editorReducer(initEditorState(page), { type: "duplicate", index: 1, id: "b2" });
    expect(ids(state)).toEqual(["a", "b", "b2", "c"]);
    expect(state.page.blocks[2]).not.toBe(state.page.blocks[1]);
  });

  it("removes a block and keeps a valid selection", () => {
    let state = editorReducer({ ...initEditorState(page), selected: 2 }, { type: "remove", index: 2 });
    expect(ids(state)).toEqual(["a", "b"]);
    expect(state.selected).toBe(1);
    state = editorReducer(state, { type: "remove", index: 0 });
    state = editorReducer(state, { type: "remove", index: 0 });
    expect(state.selected).toBeNull();
  });

  it("updates a block in place without bumping the revision (user is typing)", () => {
    const initial = initEditorState(page);
    const state = editorReducer(initial, { type: "updateBlock", index: 1, value: { type: "slider" } });
    expect(state.page.blocks[1]).toEqual({ type: "slider" });
    expect(state.revision).toBe(initial.revision);
    expect(initial.page.blocks[1]).toEqual({ id: "b", type: "faq" }); // immutability
  });

  it("inserts a block at an exact index (drag & drop) and selects it", () => {
    const state = editorReducer(initEditorState(page), {
      type: "insertAt",
      block: { id: "new", type: "stats" },
      index: 0,
    });
    expect(ids(state)).toEqual(["new", "a", "b", "c"]);
    expect(state.selected).toBe(0);
  });

  it("clamps out-of-range insert indexes to the end", () => {
    const state = editorReducer(initEditorState(page), {
      type: "insertAt",
      block: { id: "new", type: "stats" },
      index: 99,
    });
    expect(ids(state)).toEqual(["a", "b", "c", "new"]);
  });

  it("moves a block to any position (drag to reorder)", () => {
    const state = editorReducer(initEditorState(page), { type: "moveTo", from: 0, to: 2 });
    expect(ids(state)).toEqual(["b", "c", "a"]);
    expect(state.selected).toBe(2);
  });

  it("selects page settings and keeps that selection when the page is replaced", () => {
    let state = editorReducer(initEditorState(page), { type: "selectPage" });
    expect(state.selected).toBeNull();
    state = editorReducer(state, { type: "replacePage", page: { ...page, title: "New" } });
    expect(state.selected).toBeNull();
  });

  it("resets to the published page", () => {
    const edited = editorReducer(initEditorState(page), { type: "remove", index: 0 });
    const state = editorReducer(edited, { type: "reset", page });
    expect(state.page).toBe(page);
    expect(state.revision).toBeGreaterThan(edited.revision);
  });
});
