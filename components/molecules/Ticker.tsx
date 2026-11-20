/**
 * Infinite marquee band. The list is rendered twice and translated by -50%,
 * so the loop is seamless; the duplicate is hidden from assistive tech.
 */
export function Ticker({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  const loop = [...items, ...items];

  return (
    <div className="relative -left-[5%] w-[110%] -rotate-2 overflow-hidden border-y-2 border-ink-950 bg-brand-400 py-4 shadow-[0_20px_60px_-20px_rgb(208_255_42/0.5)]">
      <ul className="flex w-max animate-marquee gap-10 hover:[animation-play-state:paused]">
        {loop.map((item, index) => (
          <li
            key={`${item}-${index}`}
            aria-hidden={index >= items.length || undefined}
            className="flex items-center gap-10 font-display text-2xl font-bold uppercase tracking-wide text-ink-950 sm:text-3xl"
          >
            {item}
            <span aria-hidden="true" className="text-accent-500">
              ✦
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
