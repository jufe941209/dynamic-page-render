import type { CmsBlock, CmsPage } from "@/lib/cms/types";

export type EditorState = {
  page: CmsPage;
  /** Index of the selected block, or `null` when page settings are selected. */
  selected: number | null;
  /**
   * Bumped on structural changes (add/remove/move/reset). Used as part of the
   * JSON editors' React `key` so their text buffer re-initialises.
   */
  revision: number;
};

export type EditorAction =
  | { type: "select"; index: number }
  | { type: "selectPage" }
  | { type: "add"; block: CmsBlock }
  | { type: "insertAt"; block: CmsBlock; index: number }
  | { type: "remove"; index: number }
  | { type: "move"; index: number; direction: -1 | 1 }
  | { type: "moveTo"; from: number; to: number }
  | { type: "duplicate"; index: number; id: string }
  | { type: "updateBlock"; index: number; value: unknown }
  | { type: "replacePage"; page: CmsPage }
  | { type: "reset"; page: CmsPage };

export function initEditorState(page: CmsPage): EditorState {
  return { page, selected: page.blocks.length > 0 ? 0 : null, revision: 0 };
}

const clampSelection = (index: number | null, length: number): number | null =>
  length === 0 ? null : Math.min(Math.max(index ?? 0, 0), length - 1);

const inRange = (index: number, length: number) => index >= 0 && index < length;

function withBlocks(state: EditorState, blocks: unknown[], selected: number | null): EditorState {
  return {
    page: { ...state.page, blocks },
    selected: clampSelection(selected, blocks.length),
    revision: state.revision + 1,
  };
}

function insert(blocks: unknown[], index: number, block: unknown): unknown[] {
  const at = Math.min(Math.max(index, 0), blocks.length);
  return [...blocks.slice(0, at), block, ...blocks.slice(at)];
}

/** Pure reducer: every edit to the draft page goes through here. */
export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  const { blocks } = state.page;

  switch (action.type) {
    case "select":
      return inRange(action.index, blocks.length) ? { ...state, selected: action.index } : state;

    case "selectPage":
      return { ...state, selected: null };

    case "add": {
      const at = state.selected === null ? blocks.length : state.selected + 1;
      return withBlocks(state, insert(blocks, at, action.block), at);
    }

    case "insertAt": {
      const at = Math.min(Math.max(action.index, 0), blocks.length);
      return withBlocks(state, insert(blocks, at, action.block), at);
    }

    case "remove": {
      if (!inRange(action.index, blocks.length)) return state;
      const next = blocks.filter((_, i) => i !== action.index);
      return withBlocks(state, next, action.index);
    }

    case "move": {
      const target = action.index + action.direction;
      if (!inRange(action.index, blocks.length) || !inRange(target, blocks.length)) return state;
      return editorReducer(state, { type: "moveTo", from: action.index, to: target });
    }

    case "moveTo": {
      const { from, to } = action;
      if (!inRange(from, blocks.length) || !inRange(to, blocks.length) || from === to) return state;
      const next = [...blocks];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return withBlocks(state, next, to);
    }

    case "duplicate": {
      if (!inRange(action.index, blocks.length)) return state;
      const source = blocks[action.index];
      const copy =
        typeof source === "object" && source !== null && !Array.isArray(source)
          ? { ...structuredClone(source), id: action.id }
          : structuredClone(source);
      return withBlocks(state, insert(blocks, action.index + 1, copy), action.index + 1);
    }

    case "updateBlock": {
      if (!inRange(action.index, blocks.length)) return state;
      const next = blocks.map((block, i) => (i === action.index ? action.value : block));
      // No revision bump: the user is typing in that block's editor.
      return { ...state, page: { ...state.page, blocks: next } };
    }

    case "replacePage":
      return {
        ...state,
        page: action.page,
        selected:
          state.selected === null ? null : clampSelection(state.selected, action.page.blocks.length),
      };

    case "reset":
      return { ...initEditorState(action.page), revision: state.revision + 1 };
  }
}
