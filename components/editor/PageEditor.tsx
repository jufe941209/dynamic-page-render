"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { createBlock, createBlockId } from "@/lib/cms/blockTemplates";
import { BLOCK_LABELS, KNOWN_BLOCK_TYPES, isKnownBlockType } from "@/lib/cms/blockTypes";
import { cn } from "@/lib/cn";
import type { CmsPage } from "@/lib/cms/types";
import { validatePage } from "@/lib/cms/validate";
import type { DragItem } from "./dnd";
import { editorReducer, initEditorState } from "./editorReducer";
import { BlockInspector, PageInspector } from "./Inspector";
import { IssuesPanel } from "./IssuesPanel";
import { LayersPanel } from "./LayersPanel";
import {
  PREVIEW_READY,
  PREVIEW_SELECT,
  PREVIEW_UPDATE,
  isPreviewMessage,
  type PreviewSelectMessage,
} from "./previewProtocol";
import { SectionLibrary } from "./SectionLibrary";

type PageEditorProps = {
  initialPage: CmsPage;
  /** True only in development, where publishing writes data/data.json. */
  canPublish: boolean;
};

type Device = "desktop" | "tablet" | "mobile";
type PublishState =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved" }
  | { kind: "error"; message: string };

const DEVICES: Record<Device, { label: string; icon: string; width: string }> = {
  desktop: { label: "Desktop", icon: "🖥", width: "100%" },
  tablet: { label: "Tablet", icon: "▭", width: "820px" },
  mobile: { label: "Mobile", icon: "📱", width: "390px" },
};

function postToPreview(frame: HTMLIFrameElement | null, page: CmsPage, selected: number | null) {
  frame?.contentWindow?.postMessage(
    { type: PREVIEW_UPDATE, page: { site: page.site, blocks: page.blocks }, selected },
    window.location.origin,
  );
}

const toolbarButton =
  "rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40";

export function PageEditor({ initialPage, canPublish }: PageEditorProps) {
  const [state, dispatch] = useReducer(editorReducer, initialPage, initEditorState);
  const [published, setPublished] = useState(initialPage);
  const [device, setDevice] = useState<Device>("desktop");
  const [drag, setDrag] = useState<DragItem | null>(null);
  const [previewDropActive, setPreviewDropActive] = useState(false);
  const [publishState, setPublishState] = useState<PublishState>({ kind: "idle" });
  const [toast, setToast] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const latest = useRef({ page: state.page, selected: state.selected });

  const { page, selected, revision } = state;
  const validation = useMemo(() => validatePage(page, KNOWN_BLOCK_TYPES), [page]);
  const isDirty = useMemo(() => JSON.stringify(page) !== JSON.stringify(published), [page, published]);

  // --- Live preview bridge -------------------------------------------------
  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      if (event.source !== iframeRef.current?.contentWindow) return;
      if (isPreviewMessage(event.data, PREVIEW_READY)) {
        postToPreview(iframeRef.current, latest.current.page, latest.current.selected);
      }
      if (isPreviewMessage<PreviewSelectMessage>(event.data, PREVIEW_SELECT)) {
        dispatch({ type: "select", index: event.data.index });
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    latest.current = { page, selected };
    postToPreview(iframeRef.current, page, selected);
  }, [page, selected]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  // --- Actions -------------------------------------------------------------
  function labelOf(type: string) {
    return isKnownBlockType(type) ? BLOCK_LABELS[type].label : type;
  }

  function addSection(type: string) {
    dispatch({ type: "add", block: createBlock(type) });
    setToast(`${labelOf(type)} section added`);
  }

  function dropAt(index: number) {
    if (!drag) return;
    if (drag.kind === "new") {
      dispatch({ type: "insertAt", block: createBlock(drag.blockType), index });
      setToast(`${labelOf(drag.blockType)} section added`);
    } else {
      const to = index > drag.from ? index - 1 : index;
      dispatch({ type: "moveTo", from: drag.from, to });
    }
    setDrag(null);
  }

  function downloadJson() {
    const blob = new Blob([`${JSON.stringify(page, null, 2)}\n`], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "data.json";
    link.click();
    URL.revokeObjectURL(url);
    setToast("data.json downloaded");
  }

  async function copyJson() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(page, null, 2));
      setToast("JSON copied to clipboard");
    } catch {
      setToast("Clipboard is not available in this browser");
    }
  }

  async function publish() {
    setPublishState({ kind: "saving" });
    try {
      const response = await fetch("/api/page", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(page),
      });
      const result = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? `Request failed (${response.status})`);
      setPublished(page);
      setPublishState({ kind: "saved" });
      setToast("Published! data/data.json updated");
    } catch (cause) {
      setPublishState({ kind: "error", message: cause instanceof Error ? cause.message : "Publish failed" });
    }
  }

  const publishDisabled = !canPublish || !validation.valid || !isDirty || publishState.kind === "saving";
  const publishHint = !canPublish
    ? "Publishing writes data/data.json and is only enabled in development (npm run dev)."
    : !validation.valid
      ? "Fix the validation errors first."
      : !isDirty
        ? "No changes to publish."
        : "Write the draft to data/data.json";

  // --- Render ----------------------------------------------------------------
  return (
    <div className="flex h-dvh flex-col bg-zinc-100 text-zinc-900">
      {/* Top bar */}
      <header className="flex flex-wrap items-center gap-3 border-b border-zinc-200 bg-white px-4 py-2.5 lg:flex-nowrap">
        <div className="flex min-w-0 items-center gap-3">
          <span aria-hidden="true" className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-950 text-sm text-brand-400">
            ⚡
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold leading-tight">{page.site?.name ?? "Site"} CMS</p>
            <p className="truncate text-xs text-zinc-500">
              Pages / <span className="font-mono">{page.slug || "untitled"}</span>
            </p>
          </div>
          <span
            className={cn(
              "ml-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
              isDirty ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800",
            )}
          >
            <span aria-hidden="true" className={cn("h-1.5 w-1.5 rounded-full", isDirty ? "bg-amber-500" : "bg-emerald-500")} />
            {isDirty ? "Unsaved changes" : "Published"}
          </span>
        </div>

        <div role="group" aria-label="Preview device" className="mx-auto flex rounded-lg bg-zinc-100 p-1">
          {(Object.keys(DEVICES) as Device[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setDevice(key)}
              aria-pressed={device === key}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all",
                device === key ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900",
              )}
            >
              <span aria-hidden="true">{DEVICES[key].icon}</span>
              <span className="hidden sm:inline">{DEVICES[key].label}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a href="/" target="_blank" rel="noreferrer" className="rounded-lg px-3 py-2 text-xs font-semibold text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900">
            View site ↗
          </a>
          <button
            type="button"
            onClick={() => {
              dispatch({ type: "reset", page: published });
              setPublishState({ kind: "idle" });
            }}
            disabled={!isDirty}
            className={toolbarButton}
          >
            Discard
          </button>
          <button type="button" onClick={copyJson} className={toolbarButton}>
            Copy JSON
          </button>
          <button type="button" onClick={downloadJson} className={toolbarButton}>
            Download
          </button>
          <button
            type="button"
            onClick={publish}
            disabled={publishDisabled}
            title={publishHint}
            className="inline-flex items-center gap-2 rounded-lg bg-ink-950 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-ink-800 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span aria-hidden="true" className={cn("h-2 w-2 rounded-full bg-brand-400", publishState.kind === "saving" && "animate-ping")} />
            {publishState.kind === "saving" ? "Publishing…" : "Publish"}
          </button>
        </div>
      </header>

      {publishState.kind === "error" && (
        <p role="alert" className="border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          <strong>Publish failed:</strong> {publishState.message}
        </p>
      )}
      {!canPublish && (
        <p className="border-b border-sky-200 bg-sky-50 px-4 py-2 text-xs text-sky-800">
          <strong>Read-only build.</strong> Edits update the live preview. To persist them, download the JSON
          and replace <code className="font-mono">data/data.json</code>, or run <code className="font-mono">npm run dev</code> to publish directly.
        </p>
      )}

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Left: library + layers + validation */}
        <aside className="flex min-h-0 flex-col border-zinc-200 bg-white lg:w-[300px] lg:shrink-0 lg:border-r">
          <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-4">
            <SectionLibrary onAdd={addSection} onDragChange={setDrag} />
            <LayersPanel
              blocks={page.blocks}
              selected={selected}
              drag={drag}
              onDragChange={setDrag}
              onDropAt={dropAt}
              onSelect={(index) => dispatch({ type: "select", index })}
              onSelectPage={() => dispatch({ type: "selectPage" })}
              onMove={(index, direction) => dispatch({ type: "move", index, direction })}
              onDuplicate={(index) => dispatch({ type: "duplicate", index, id: createBlockId("copy") })}
              onRemove={(index) => dispatch({ type: "remove", index })}
            />
          </div>
          <IssuesPanel
            issues={validation.issues}
            onJumpToBlock={(index) => dispatch({ type: "select", index })}
          />
        </aside>

        {/* Center: live preview */}
        <section
          aria-label="Live preview"
          className="relative flex min-h-[60vh] flex-1 flex-col overflow-auto bg-[radial-gradient(circle,rgb(0_0_0/0.07)_1px,transparent_1px)] [background-size:18px_18px] p-4 lg:p-6"
        >
          <div
            className="relative mx-auto flex w-full flex-1 flex-col overflow-hidden rounded-2xl border border-zinc-300 bg-ink-950 shadow-2xl shadow-zinc-400/40 transition-[max-width] duration-500 ease-out"
            style={{ maxWidth: DEVICES[device].width }}
          >
            <div className="flex items-center gap-3 border-b border-white/10 bg-ink-900 px-4 py-2.5">
              <span aria-hidden="true" className="flex gap-1.5">
                <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
                <span className="h-3 w-3 rounded-full bg-[#28c840]" />
              </span>
              <span className="mx-auto flex min-w-0 items-center gap-2 truncate rounded-md bg-white/5 px-3 py-1 font-mono text-xs text-zinc-400">
                <span aria-hidden="true" className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-400" />
                live preview · /{page.slug} · click a section to edit it
              </span>
            </div>
            <iframe ref={iframeRef} src="/preview" title="Live page preview" className="w-full flex-1 bg-ink-950" />

            {/* Drop zone over the iframe (iframes swallow drag events otherwise) */}
            {drag?.kind === "new" && (
              <div
                data-testid="preview-dropzone"
                onDragOver={(event) => {
                  event.preventDefault();
                  setPreviewDropActive(true);
                }}
                onDragLeave={() => setPreviewDropActive(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setPreviewDropActive(false);
                  dropAt(selected === null ? page.blocks.length : selected + 1);
                }}
                className={cn(
                  "absolute inset-0 top-11 z-10 flex items-center justify-center border-4 border-dashed backdrop-blur-[2px] transition-colors",
                  previewDropActive ? "border-brand-400 bg-brand-400/20" : "border-brand-400/50 bg-ink-950/40",
                )}
              >
                <p className="rounded-full bg-ink-950 px-5 py-3 text-sm font-semibold text-white shadow-2xl">
                  <span className="text-brand-400">＋</span> Drop to add <strong>{labelOf(drag.blockType)}</strong>{" "}
                  {selected === null ? "at the end" : `after section #${selected}`}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Right: inspector */}
        <aside aria-label="Inspector" className="flex min-h-0 flex-col border-zinc-200 bg-white lg:w-[380px] lg:shrink-0 lg:border-l">
          {selected === null ? (
            <PageInspector page={page} revision={revision} onChange={(next) => dispatch({ type: "replacePage", page: next })} />
          ) : (
            <BlockInspector
              key={`${selected}-${revision}`}
              block={page.blocks[selected]}
              index={selected}
              revision={revision}
              onChange={(value) => dispatch({ type: "updateBlock", index: selected, value })}
              onDuplicate={() => dispatch({ type: "duplicate", index: selected, id: createBlockId("copy") })}
              onRemove={() => dispatch({ type: "remove", index: selected })}
            />
          )}
        </aside>
      </div>

      {toast && (
        <div role="status" className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 animate-fade-up items-center gap-3 rounded-full bg-ink-950 px-5 py-3 text-sm font-medium text-white shadow-2xl">
          <span aria-hidden="true" className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-400 text-xs text-ink-950">
            ✓
          </span>
          {toast}
          {publishState.kind === "saved" && (
            <a href="/" target="_blank" rel="noreferrer" className="font-semibold text-brand-400 hover:underline">
              View live ↗
            </a>
          )}
        </div>
      )}
    </div>
  );
}
