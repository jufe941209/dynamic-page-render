import type { Testimonial } from "@/lib/cms/types";

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function TestimonialCard({ quote, author, role, rating }: Testimonial) {
  const stars = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));

  return (
    <figure className="reveal group relative flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-8 transition-all duration-500 hover:-translate-y-1 hover:border-accent-400/40">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-6 right-4 font-display text-[10rem] leading-none text-white/[0.04] transition-colors duration-500 group-hover:text-accent-400/10"
      >
        &rdquo;
      </span>
      {stars > 0 && (
        <div role="img" aria-label={`${stars} out of 5 stars`} className="text-lg tracking-[0.2em]">
          <span className="text-brand-400">{"★".repeat(stars)}</span>
          <span className="text-white/15">{"★".repeat(5 - stars)}</span>
        </div>
      )}
      <blockquote className="mt-5 flex-1 text-lg leading-8 text-zinc-200">&ldquo;{quote}&rdquo;</blockquote>
      <figcaption className="mt-8 flex items-center gap-4">
        <span
          aria-hidden="true"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-linear-to-br from-brand-400 to-accent-500 text-sm font-bold text-ink-950"
        >
          {initialsOf(author)}
        </span>
        <span>
          <span className="block font-semibold text-white">{author}</span>
          {role && <span className="block text-sm text-zinc-500">{role}</span>}
        </span>
      </figcaption>
    </figure>
  );
}
