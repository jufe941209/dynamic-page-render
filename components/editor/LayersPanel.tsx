"use client";

import { useState, type DragEvent } from "react";
import { BLOCK_LABELS, isKnownBlockType } from "@/lib/cms/blockTypes";
import { cn } from "@/lib/cn";
import { isCmsBlock } from "@/lib/cms/types";
import { startDrag, type DragItem } from "./dnd";

type LayersPanelProps = {
  blocks: unknown[];
  selected: number | null;
  drag: DragItem | null;
  onDragChange: (item: DragItem | null) => void;
  /** Drop at an insertion index (0 … blocks.length). */
  onDropAt: (index: number) => void;
  onSelect: (index: number) => void;
  onSelectPage: () => void;
  onMove: (index: number, direction: -1 | 1) => void;
  onDuplicate: (index: number) => void;
  onRemove: (index: number) => void;
};

type LayerMeta = { icon: string; label: string; summary: string; status: "ok" | "unknown" | "invalid" };

function describe(block: unknown): LayerMeta {
  if (!isCmsBlock(block)) {
    return { icon: "✕", label: "Malformed block", summary: "Fix it in the JSON tab", status: "invalid" };
  }
  const props = block.props ?? {};
  const summary = [props.title, props.eyebrow, props.name].find((v) => typeof v === "string" && v) as
    | string
    | undefined;
  if (!isKnownBlockType(block.type)) {
    return { icon: "⚠", label: block.type, summary: "No component registered", status: "unknown" };
  }
  return {
    icon: BLOCK_LABELS[block.type].icon,
    label: BLOCK_LABELS[block.type].label,
    summary: summary ?? block.id ?? "—",
    status: "ok",
  };
}

const iconButton =
  "flex h-6 w-6 items-center justify-center rounded-md text-[0.7rem] text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-zinc-900 disabled:pointer-events-none disabled:opacity-30";

function DropLine({ active }: { active: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "mx-1 rounded-full transition-all duration-150",
        active ? "my-1 h-1 bg-brand-500 shadow-[0_0_12px_rgb(208_255_42)]" : "h-0",
      )}
    />
  );
}

/** Ordered list of page sections. Sortable by drag & drop, with keyboard-friendly buttons too. */
export function LayersPanel(props: LayersPanelProps) {
  const { blocks, selected, drag, onDragChange, onDropAt } = props;
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  function handleOver(event: DragEvent, index: number) {
    if (!drag) return;
    event.preventDefault();
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    setDropIndex(event.clientY > rect.top + rect.height / 2 ? index + 1 : index);
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    if (drag && dropIndex !== null) onDropAt(dropIndex);
    setDropIndex(null);
    onDragChange(null);
  }

  return (
    <section aria-labelledby="layers-heading" className="flex min-h-0 flex-col">
      <h2 id="layers-heading" className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
        Page layers
      </h2>

      <button
        type="button"
        onClick={props.onSelectPage}
        aria-current={selected === null || undefined}
        className={cn(
          "mb-2 flex items-center gap-2.5 rounded-xl border px-2.5 py-2 text-left text-sm font-semibold transition-all",
          selected === null ? "border-ink-950 bg-white shadow-md ring-1 ring-ink-950" : "border-zinc-200 bg-white hover:border-zinc-300",
        )}
      >
        <span aria-hidden="true" className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700">
          ⚙
        </span>
        Page settings
      </button>

      <ol
        aria-label="Page sections"
        onDragOver={(event) => {
          if (!drag) return;
          event.preventDefault();
          if (event.target === event.currentTarget) setDropIndex(blocks.length);
        }}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDropIndex(null);
        }}
        onDrop={handleDrop}
        className={cn(
          "min-h-16 rounded-xl p-1 transition-colors",
          drag ? "bg-brand-400/10 ring-2 ring-dashed ring-brand-500/50" : "bg-zinc-100/70",
        )}
      >
        {blocks.length === 0 && (
          <li className="p-4 text-center text-xs text-zinc-500">Drop a section here to start.</li>
        )}
        {blocks.map((block, index) => {
          const meta = describe(block);
          const isSelected = index === selected;
          const isDragged = drag?.kind === "move" && drag.from === index;
          return (
            <li key={index} onDragOver={(event) => handleOver(event, index)}>
              <DropLine active={dropIndex === index} />
              <div
                draggable
                onDragStart={(event) => {
                  startDrag(event, String(index), "move");
                  onDragChange({ kind: "move", from: index });
                }}
                onDragEnd={() => {
                  setDropIndex(null);
                  onDragChange(null);
                }}
                className={cn(
                  "group flex cursor-grab items-center gap-1.5 rounded-xl border p-1 transition-all active:cursor-grabbing",
                  isSelected ? "border-ink-950 bg-white shadow-md ring-1 ring-ink-950" : "border-transparent bg-white/70 hover:border-zinc-200 hover:bg-white",
                  isDragged && "opacity-40",
                )}
              >
                <span aria-hidden="true" className="pl-1 text-xs text-zinc-300 group-hover:text-zinc-500">
                  ⠿
                </span>
                <button
                  type="button"
                  onClick={() => props.onSelect(index)}
                  aria-current={isSelected || undefined}
                  className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg p-1 text-left"
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                      meta.status === "ok" && "bg-ink-950 text-brand-400",
                      meta.status === "unknown" && "bg-amber-100 text-amber-700",
                      meta.status === "invalid" && "bg-red-100 text-red-700",
                    )}
                  >
                    {meta.icon}
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-zinc-900">
                      <span className="truncate">{meta.label}</span>
                      {meta.status === "unknown" && (
                        <span className="rounded bg-amber-100 px-1 py-0.5 text-[0.55rem] font-bold uppercase text-amber-700">Unknown</span>
                      )}
                      {meta.status === "invalid" && (
                        <span className="rounded bg-red-100 px-1 py-0.5 text-[0.55rem] font-bold uppercase text-red-700">Invalid</span>
                      )}
                    </span>
                    <span className="block truncate text-[0.7rem] text-zinc-500">{meta.summary}</span>
                  </span>
                </button>
                <div className="flex shrink-0 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                  <button type="button" className={iconButton} onClick={() => props.onMove(index, -1)} disabled={index === 0} aria-label={`Move section ${index} up`}>↑</button>
                  <button type="button" className={iconButton} onClick={() => props.onMove(index, 1)} disabled={index === blocks.length - 1} aria-label={`Move section ${index} down`}>↓</button>
                  <button type="button" className={iconButton} onClick={() => props.onDuplicate(index)} aria-label={`Duplicate section ${index}`}>⧉</button>
                  <button type="button" className={cn(iconButton, "hover:bg-red-100 hover:text-red-700")} onClick={() => props.onRemove(index)} aria-label={`Delete section ${index}`}>✕</button>
                </div>
              </div>
              {index === blocks.length - 1 && <DropLine active={dropIndex === blocks.length} />}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
