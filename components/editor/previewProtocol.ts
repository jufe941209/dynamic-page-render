import type { CmsPage } from "@/lib/cms/types";

/**
 * postMessage contract between the editor (parent window) and the live
 * preview (iframe). Both sides only accept messages from their own origin.
 */
export const PREVIEW_READY = "velocity:preview-ready";
export const PREVIEW_UPDATE = "velocity:preview-update";
export const PREVIEW_SELECT = "velocity:preview-select";

export type PreviewReadyMessage = { type: typeof PREVIEW_READY };

/** Editor → preview: the draft to render and which section is selected. */
export type PreviewUpdateMessage = {
  type: typeof PREVIEW_UPDATE;
  page: Pick<CmsPage, "site" | "blocks">;
  selected: number | null;
};

/** Preview → editor: the user clicked a section. */
export type PreviewSelectMessage = { type: typeof PREVIEW_SELECT; index: number };

export function isPreviewMessage<T extends { type: string }>(data: unknown, type: T["type"]): data is T {
  return typeof data === "object" && data !== null && (data as { type?: unknown }).type === type;
}
