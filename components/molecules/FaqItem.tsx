import type { FaqEntry } from "@/lib/cms/types";

/**
 * Native <details>/<summary> disclosure: accessible and keyboard-friendly
 * out of the box, and ships zero client-side JavaScript.
 */
export function FaqItem({ question, answer }: FaqEntry) {
  return (
    <details className="reveal group rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-5 transition-colors duration-300 open:border-brand-400/40 open:bg-white/[0.05] hover:border-white/20">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold text-white [&::-webkit-details-marker]:hidden">
        {question}
        <span
          aria-hidden="true"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 text-brand-400 transition-all duration-300 group-open:rotate-45 group-open:border-brand-400 group-open:bg-brand-400 group-open:text-ink-950"
        >
          +
        </span>
      </summary>
      <p className="mt-4 leading-7 text-zinc-400">{answer}</p>
    </details>
  );
}
