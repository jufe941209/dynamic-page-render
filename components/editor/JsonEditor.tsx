"use client";

import { useRef, useState, type UIEvent } from "react";
import { cn } from "@/lib/cn";

type JsonEditorProps = {
  id: string;
  label: string;
  initialValue: unknown;
  /** Called only with values that parse and pass `validate`. */
  onValidChange: (value: unknown) => void;
  /** Extra structural check. Return an error message, or null when OK. */
  validate?: (value: unknown) => string | null;
  className?: string;
};

/**
 * Lightweight JSON code editor: line numbers, live parse errors, one-click format.
 * Invalid input never reaches the page state, so the preview keeps showing the
 * last valid version while the user types.
 */
export function JsonEditor({ id, label, initialValue, onValidChange, validate, className }: JsonEditorProps) {
  const [text, setText] = useState(() => JSON.stringify(initialValue, null, 2) ?? "");
  const [error, setError] = useState<string | null>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const errorId = `${id}-status`;
  const lineCount = text.split("\n").length;

  function apply(next: string) {
    setText(next);
    let parsed: unknown;
    try {
      parsed = JSON.parse(next);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Invalid JSON");
      return;
    }
    const structuralError = validate?.(parsed) ?? null;
    setError(structuralError);
    if (!structuralError) onValidChange(parsed);
  }

  function format() {
    try {
      setText(JSON.stringify(JSON.parse(text), null, 2));
    } catch {
      // Nothing to format while the JSON is invalid; the error is already shown.
    }
  }

  function syncGutter(event: UIEvent<HTMLTextAreaElement>) {
    if (gutterRef.current) gutterRef.current.scrollTop = event.currentTarget.scrollTop;
  }

  return (
    <div className={cn("flex min-h-0 flex-col", className)}>
      <div className="flex items-center justify-between gap-2 pb-2">
        <label htmlFor={id} className="truncate text-xs font-semibold uppercase tracking-wider text-zinc-500">
          {label}
        </label>
        <button
          type="button"
          onClick={format}
          disabled={error !== null}
          className="rounded-md px-2 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Format
        </button>
      </div>

      <div
        className={cn(
          "flex min-h-0 flex-1 overflow-hidden rounded-xl border bg-ink-900 font-mono text-[13px] leading-6 shadow-inner transition-colors",
          error ? "border-red-400 ring-2 ring-red-400/20" : "border-ink-700 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-400/30",
        )}
      >
        <div
          ref={gutterRef}
          aria-hidden="true"
          className="select-none overflow-hidden border-r border-ink-700 bg-ink-950/60 px-3 py-3 text-right text-zinc-600"
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
        <textarea
          id={id}
          value={text}
          onChange={(event) => apply(event.target.value)}
          onScroll={syncGutter}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          aria-invalid={error !== null}
          aria-describedby={errorId}
          className="min-h-0 flex-1 resize-none bg-transparent px-4 py-3 text-zinc-100 caret-brand-400 outline-none selection:bg-brand-400/30"
        />
      </div>

      <p
        id={errorId}
        role={error ? "alert" : "status"}
        className={cn(
          "mt-2 flex items-center gap-1.5 text-xs font-medium",
          error ? "text-red-600" : "text-emerald-600",
        )}
      >
        <span aria-hidden="true">{error ? "✕" : "✓"}</span>
        {error ?? "Valid JSON. Preview is live."}
      </p>
    </div>
  );
}
