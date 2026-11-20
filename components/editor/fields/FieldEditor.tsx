"use client";

import { useId, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Schema-light visual form. Renders an editable field for every key of a value,
 * merged with a "shape" (the block template) so optional fields that are not
 * present yet still appear. Field widgets are inferred from the data:
 *
 *   string → input / textarea   number → number input   boolean → switch
 *   string[] → editable list    object[] → collapsible item cards
 *   object → nested group
 */

type Json = unknown;
type FieldProps = {
  name: string;
  value: Json;
  shape?: Json;
  onChange: (value: Json) => void;
  depth?: number;
};

const LONG_TEXT_KEYS = /description|subtitle|quote|answer|footernote/i;
const SUMMARY_KEYS = ["title", "name", "question", "author", "label", "value", "quote"];

const inputClass =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none transition-all placeholder:text-zinc-400 hover:border-zinc-300 focus:border-ink-950 focus:ring-4 focus:ring-brand-400/30";

const smallButton =
  "inline-flex h-7 w-7 items-center justify-center rounded-md text-xs text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 disabled:pointer-events-none disabled:opacity-30";

export const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** "primaryCta" → "Primary CTA" */
export function humanize(key: string): string {
  const words = key.replace(/([a-z0-9])([A-Z])/g, "$1 $2").split(/[\s_-]+/);
  return words
    .map((word) => (/^(cta|faq|url|id)$/i.test(word) ? word.toUpperCase() : word[0].toUpperCase() + word.slice(1)))
    .join(" ");
}

/** Builds an empty value with the same structure as `sample`. */
function blankFrom(sample: Json): Json {
  if (typeof sample === "string") return "";
  if (typeof sample === "number") return 0;
  if (typeof sample === "boolean") return false;
  if (Array.isArray(sample)) return [];
  if (isPlainObject(sample)) {
    return Object.fromEntries(Object.entries(sample).map(([k, v]) => [k, blankFrom(v)]));
  }
  return "";
}

function summarize(item: Json, fallback: string): string {
  if (typeof item === "string") return item || fallback;
  if (isPlainObject(item)) {
    for (const key of SUMMARY_KEYS) {
      if (typeof item[key] === "string" && item[key]) return item[key] as string;
    }
  }
  return fallback;
}

function singular(name: string): string {
  if (/ies$/i.test(name)) return name.replace(/ies$/i, "y");
  return name.replace(/s$/i, "");
}

function FieldLabel({ htmlFor, children, hint }: { htmlFor?: string; children: ReactNode; hint?: string }) {
  return (
    <div className="mb-1.5 flex items-baseline justify-between gap-2">
      <label htmlFor={htmlFor} className="text-xs font-semibold text-zinc-700">
        {children}
      </label>
      {hint && <span className="text-[0.65rem] text-zinc-400">{hint}</span>}
    </div>
  );
}

/** Dispatches to the right widget for a single key. */
export function Field({ name, value, shape, onChange, depth = 0 }: FieldProps) {
  const id = useId();
  const sample = value !== undefined ? value : shape;
  const label = humanize(name);

  if (typeof sample === "boolean") {
    const checked = value === true;
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2.5">
        <span id={`${id}-label`} className="text-xs font-semibold text-zinc-700">
          {label}
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          aria-labelledby={`${id}-label`}
          onClick={() => onChange(!checked)}
          className={cn(
            "relative h-6 w-11 rounded-full transition-colors",
            checked ? "bg-ink-950" : "bg-zinc-300",
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 h-5 w-5 rounded-full shadow transition-all",
              checked ? "left-[22px] bg-brand-400" : "left-0.5 bg-white",
            )}
          />
        </button>
      </div>
    );
  }

  if (typeof sample === "number") {
    const isRating = name === "rating";
    return (
      <div>
        <FieldLabel htmlFor={id} hint={isRating ? "0 – 5" : undefined}>
          {label}
        </FieldLabel>
        <input
          id={id}
          type="number"
          min={isRating ? 0 : undefined}
          max={isRating ? 5 : undefined}
          value={typeof value === "number" ? value : ""}
          onChange={(event) => onChange(event.target.value === "" ? 0 : Number(event.target.value))}
          className={inputClass}
        />
      </div>
    );
  }

  if (Array.isArray(sample)) {
    const items = Array.isArray(value) ? value : [];
    const itemShape = (Array.isArray(shape) ? shape[0] : undefined) ?? items[0];
    return isPlainObject(itemShape) ? (
      <ObjectList name={name} items={items} itemShape={itemShape} onChange={onChange} depth={depth} />
    ) : (
      <StringList name={name} items={items} onChange={onChange} />
    );
  }

  if (isPlainObject(sample)) {
    return (
      <fieldset className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-3">
        <legend className="px-1 text-xs font-semibold text-zinc-700">{label}</legend>
        <ObjectFields
          value={isPlainObject(value) ? value : {}}
          shape={isPlainObject(shape) ? shape : undefined}
          onChange={onChange}
          depth={depth + 1}
        />
      </fieldset>
    );
  }

  if (typeof sample === "string" || sample === undefined) {
    const text = typeof value === "string" ? value : "";
    const isLong = LONG_TEXT_KEYS.test(name);
    const hint = name === "href" ? "#section or https://…" : name === "icon" ? "emoji" : undefined;
    return (
      <div>
        <FieldLabel htmlFor={id} hint={hint}>
          {label}
        </FieldLabel>
        {isLong ? (
          <textarea
            id={id}
            rows={3}
            value={text}
            onChange={(event) => onChange(event.target.value)}
            className={cn(inputClass, "resize-y leading-6")}
          />
        ) : (
          <input
            id={id}
            type="text"
            value={text}
            placeholder={typeof shape === "string" && shape ? shape : undefined}
            onChange={(event) => onChange(event.target.value)}
            className={inputClass}
          />
        )}
      </div>
    );
  }

  return (
    <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
      <strong>{label}</strong> has a value the form can&apos;t edit. Use the JSON tab.
    </p>
  );
}

/** Renders one field per key of `shape` ∪ `value`, preserving key order. */
export function ObjectFields({
  value,
  shape,
  onChange,
  depth = 0,
}: {
  value: Record<string, unknown>;
  shape?: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
  depth?: number;
}) {
  const keys = [...new Set([...Object.keys(shape ?? {}), ...Object.keys(value)])];
  return (
    <div className="space-y-4">
      {keys.map((key) => (
        <Field
          key={key}
          name={key}
          value={value[key]}
          shape={shape?.[key]}
          depth={depth}
          onChange={(next) => onChange({ ...value, [key]: next })}
        />
      ))}
    </div>
  );
}

function move<T>(list: T[], from: number, to: number): T[] {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function StringList({ name, items, onChange }: { name: string; items: unknown[]; onChange: (v: Json) => void }) {
  const baseId = useId();
  return (
    <div>
      <FieldLabel hint={`${items.length} item${items.length === 1 ? "" : "s"}`}>{humanize(name)}</FieldLabel>
      <ul className="space-y-1.5">
        {items.map((item, index) => (
          <li key={index} className="group flex items-center gap-1">
            <label htmlFor={`${baseId}-${index}`} className="sr-only">
              {`${humanize(singular(name))} ${index + 1}`}
            </label>
            <input
              id={`${baseId}-${index}`}
              type="text"
              value={typeof item === "string" ? item : String(item ?? "")}
              onChange={(event) => onChange(items.map((v, i) => (i === index ? event.target.value : v)))}
              className={inputClass}
            />
            <button type="button" className={smallButton} disabled={index === 0} onClick={() => onChange(move(items, index, index - 1))} aria-label={`Move ${humanize(singular(name))} ${index + 1} up`}>
              ↑
            </button>
            <button type="button" className={cn(smallButton, "hover:bg-red-50 hover:text-red-600")} onClick={() => onChange(items.filter((_, i) => i !== index))} aria-label={`Remove ${humanize(singular(name))} ${index + 1}`}>
              ✕
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => onChange([...items, ""])}
        className="mt-2 w-full rounded-lg border border-dashed border-zinc-300 py-1.5 text-xs font-semibold text-zinc-600 transition-colors hover:border-ink-950 hover:bg-white hover:text-zinc-900"
      >
        ＋ Add {humanize(singular(name)).toLowerCase()}
      </button>
    </div>
  );
}

function ObjectList({
  name,
  items,
  itemShape,
  onChange,
  depth,
}: {
  name: string;
  items: unknown[];
  itemShape: Record<string, unknown>;
  onChange: (v: Json) => void;
  depth: number;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const itemLabel = humanize(singular(name));

  function update(index: number, next: unknown) {
    onChange(items.map((item, i) => (i === index ? next : item)));
  }

  function add() {
    // New items start from the template's sample content (or a blank copy of an existing item).
    onChange([...items, structuredClone(itemShape)]);
    setOpen(items.length);
  }

  return (
    <div>
      <FieldLabel hint={`${items.length} item${items.length === 1 ? "" : "s"}`}>{humanize(name)}</FieldLabel>
      <ul className="space-y-2">
        {items.map((item, index) => {
          const isOpen = open === index;
          return (
            <li key={index} className={cn("rounded-xl border bg-white transition-shadow", isOpen ? "border-ink-950 shadow-md" : "border-zinc-200")}>
              <div className="flex items-center gap-1 p-1.5">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : index)}
                  className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1 text-left text-sm font-medium text-zinc-800 hover:bg-zinc-50"
                >
                  <span aria-hidden="true" className={cn("text-[0.6rem] text-zinc-400 transition-transform", isOpen && "rotate-90")}>
                    ▶
                  </span>
                  <span className="truncate">{summarize(item, `${itemLabel} ${index + 1}`)}</span>
                </button>
                <button type="button" className={smallButton} disabled={index === 0} onClick={() => { onChange(move(items, index, index - 1)); setOpen(null); }} aria-label={`Move ${itemLabel} ${index + 1} up`}>
                  ↑
                </button>
                <button type="button" className={smallButton} disabled={index === items.length - 1} onClick={() => { onChange(move(items, index, index + 1)); setOpen(null); }} aria-label={`Move ${itemLabel} ${index + 1} down`}>
                  ↓
                </button>
                <button type="button" className={smallButton} onClick={() => onChange([...items.slice(0, index + 1), structuredClone(item), ...items.slice(index + 1)])} aria-label={`Duplicate ${itemLabel} ${index + 1}`}>
                  ⧉
                </button>
                <button type="button" className={cn(smallButton, "hover:bg-red-50 hover:text-red-600")} onClick={() => { onChange(items.filter((_, i) => i !== index)); setOpen(null); }} aria-label={`Remove ${itemLabel} ${index + 1}`}>
                  ✕
                </button>
              </div>
              {isOpen && (
                <div className="border-t border-zinc-100 p-3">
                  <ObjectFields
                    value={isPlainObject(item) ? item : {}}
                    shape={isPlainObject(itemShape) ? (blankFrom(itemShape) as Record<string, unknown>) : undefined}
                    onChange={(next) => update(index, next)}
                    depth={depth + 1}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        onClick={add}
        className="mt-2 w-full rounded-lg border border-dashed border-zinc-300 py-2 text-xs font-semibold text-zinc-600 transition-colors hover:border-ink-950 hover:bg-white hover:text-zinc-900"
      >
        ＋ Add {itemLabel.toLowerCase()}
      </button>
    </div>
  );
}
