import { Heading, Text } from "@/components/atoms";
import type { FeatureItem } from "@/lib/cms/types";

export function FeatureCard({ icon, title, description, tag }: FeatureItem) {
  return (
    <article className="reveal group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-7 transition-all duration-500 hover:-translate-y-1.5 hover:border-brand-400/40 hover:bg-white/[0.06]">
      {/* Glow that blooms on hover */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-brand-400/0 blur-3xl transition-colors duration-500 group-hover:bg-brand-400/20"
      />
      <div className="flex items-start justify-between gap-4">
        {icon && (
          <span
            aria-hidden="true"
            className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-brand-400 to-accent-400 text-2xl shadow-lg shadow-brand-400/20 transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110"
          >
            {icon}
          </span>
        )}
        {tag && (
          <span className="rounded-full border border-white/10 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-widest text-zinc-400">
            {tag}
          </span>
        )}
      </div>
      <Heading level={3} className="text-xl">
        {title}
      </Heading>
      <Text className="mt-2">{description}</Text>
    </article>
  );
}
