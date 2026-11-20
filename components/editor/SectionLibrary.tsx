"use client";

import { BLOCK_LABELS, KNOWN_BLOCK_TYPES } from "@/lib/cms/blockTypes";
import { cn } from "@/lib/cn";
import { startDrag, type DragItem } from "./dnd";

/** Unregistered type offered on purpose, to demo the PageBuilder fallback. */
export const DEMO_UNKNOWN_TYPE = "slider";

type SectionLibraryProps = {
  onAdd: (type: string) => void;
  onDragChange: (item: DragItem | null) => void;
};

const tiles = [
  ...KNOWN_BLOCK_TYPES.map((type) => ({ type, ...BLOCK_LABELS[type], demo: false })),
  { type: DEMO_UNKNOWN_TYPE, label: "Slider", icon: "⚠", description: "Unregistered (demo)", demo: true },
];

/** Palette of sections: drag one onto the layers or the preview, or click to insert. */
export function SectionLibrary({ onAdd, onDragChange }: SectionLibraryProps) {
  return (
    <section aria-labelledby="library-heading">
      <h2 id="library-heading" className="mb-1 text-xs font-semibold uppercase tracking-wider text-zinc-500">
        Add sections
      </h2>
      <p className="mb-3 text-xs text-zinc-400">Drag onto the page or click to insert.</p>
      <ul className="grid grid-cols-2 gap-2">
        {tiles.map((tile) => (
          <li key={tile.type}>
            <button
              type="button"
              draggable
              onClick={() => onAdd(tile.type)}
              onDragStart={(event) => {
                startDrag(event, tile.type, "copy");
                onDragChange({ kind: "new", blockType: tile.type });
              }}
              onDragEnd={() => onDragChange(null)}
              aria-label={`Add ${tile.label} section`}
              className={cn(
                "group flex w-full cursor-grab flex-col items-start gap-2 rounded-xl border p-2.5 text-left transition-all active:cursor-grabbing",
                "hover:-translate-y-0.5 hover:shadow-md",
                tile.demo
                  ? "border-dashed border-amber-300 bg-amber-50/60 hover:border-amber-500"
                  : "border-zinc-200 bg-white hover:border-ink-950",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold transition-transform group-hover:scale-110",
                  tile.demo ? "bg-amber-100 text-amber-700" : "bg-ink-950 text-brand-400",
                )}
              >
                {tile.icon}
              </span>
              <span>
                <span className="block text-xs font-semibold text-zinc-900">{tile.label}</span>
                <span className="block text-[0.65rem] leading-tight text-zinc-500">{tile.description}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
