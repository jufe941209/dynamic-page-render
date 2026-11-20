import type { StatEntry } from "@/lib/cms/types";

/** One term/value pair. Must be rendered inside a <dl>. */
export function StatItem({ value, label }: StatEntry) {
  return (
    // DOM order is dt → dd (valid markup); flex-col-reverse shows the number first.
    <div className="group flex flex-col-reverse bg-ink-900 px-6 py-10 text-center transition-colors duration-500 hover:bg-ink-800">
      <dt className="mt-3 text-xs font-semibold uppercase tracking-[0.25em] text-zinc-400">{label}</dt>
      <dd className="text-gradient font-display text-5xl font-bold tracking-tight transition-transform duration-500 group-hover:scale-110 sm:text-6xl">
        {value}
      </dd>
    </div>
  );
}
