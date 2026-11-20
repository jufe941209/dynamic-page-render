"use client";

import { useEffect, useState } from "react";
import { PageShell } from "@/components/templates";
import {
  PREVIEW_READY,
  PREVIEW_SELECT,
  PREVIEW_UPDATE,
  isPreviewMessage,
  type PreviewUpdateMessage,
} from "./previewProtocol";

type PreviewState = Omit<PreviewUpdateMessage, "type">;

/** Hover/selection outlines for sections; only exists inside the editor preview. */
const PREVIEW_STYLES = `
  [data-block-index] { position: relative; cursor: pointer; }
  [data-block-index]::after {
    content: ""; position: absolute; inset: 0; pointer-events: none; z-index: 40;
    border: 2px dashed transparent; transition: border-color .2s, box-shadow .2s;
  }
  [data-block-index]:hover::after { border-color: rgb(208 255 42 / .45); }
  [data-block-index][data-selected]::after {
    border: 2px solid #d0ff2a; box-shadow: inset 0 0 0 4px rgb(208 255 42 / .15);
  }
  [data-block-index][data-selected]::before {
    content: attr(data-label); position: absolute; top: 8px; left: 8px; z-index: 41;
    background: #d0ff2a; color: #07080a; font: 700 11px/1 system-ui, sans-serif;
    letter-spacing: .08em; text-transform: uppercase; padding: 6px 8px; border-radius: 6px;
  }
`;

/**
 * Runs inside the editor's iframe. Renders exactly what the public page renders
 * (same PageShell + PageBuilder), but fed by the editor's unsaved draft.
 * Clicking a section selects it in the editor.
 */
export function LivePreview() {
  const [state, setState] = useState<PreviewState | null>(null);
  const selected = state?.selected ?? null;

  // Receive drafts from the editor and announce readiness.
  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      if (isPreviewMessage<PreviewUpdateMessage>(event.data, PREVIEW_UPDATE)) {
        setState({ page: event.data.page, selected: event.data.selected });
      }
    }
    window.addEventListener("message", onMessage);
    if (window.parent !== window) {
      window.parent.postMessage({ type: PREVIEW_READY }, window.location.origin);
    }
    return () => window.removeEventListener("message", onMessage);
  }, []);

  // Click a section → tell the editor to select it.
  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = (event.target as HTMLElement | null)?.closest<HTMLElement>("[data-block-index]");
      if (!target || window.parent === window) return;
      event.preventDefault();
      window.parent.postMessage(
        { type: PREVIEW_SELECT, index: Number(target.dataset.blockIndex) },
        window.location.origin,
      );
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  // Reflect the editor's selection: outline it and scroll it into view.
  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>("[data-block-index]");
    sections.forEach((section) => {
      const isSelected = Number(section.dataset.blockIndex) === selected;
      section.toggleAttribute("data-selected", isSelected);
      section.dataset.label = `#${section.dataset.blockIndex} · editing`;
    });
    const current = selected === null ? null : document.querySelector(`[data-block-index="${selected}"]`);
    current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selected, state]);

  if (!state) {
    return (
      <div className="flex flex-1 items-center justify-center p-10 text-center text-sm text-zinc-500">
        Waiting for the editor… Open <a className="ml-1 text-brand-400 underline" href="/editor">/editor</a>.
      </div>
    );
  }

  return (
    <>
      <style>{PREVIEW_STYLES}</style>
      <PageShell page={state.page} showEditLink={false} instrument />
    </>
  );
}
