import { ButtonLink } from "@/components/atoms";
import type { SiteConfig } from "@/lib/cms/types";

type SiteHeaderProps = {
  site?: SiteConfig;
  /** Hidden inside the editor's live preview. */
  showEditLink?: boolean;
};

export function SiteHeader({ site, showEditLink = true }: SiteHeaderProps) {
  const name = site?.name ?? "Site";
  const nav = site?.nav ?? [];

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 rounded-full border border-white/10 bg-ink-950/60 py-2.5 pl-5 pr-2.5 shadow-2xl shadow-black/40 backdrop-blur-xl">
        <a
          href="#top"
          className="group flex items-center gap-2.5 font-display text-xl font-bold uppercase tracking-wider text-white"
        >
          <span
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-400 text-sm text-ink-950 transition-transform duration-500 group-hover:rotate-[360deg]"
          >
            ⚡
          </span>
          {name}
        </a>

        {nav.length > 0 && (
          <nav aria-label="Main" className="hidden md:block">
            <ul className="flex items-center gap-8 text-sm font-medium text-zinc-300">
              {nav.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="relative transition-colors hover:text-white after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:bg-brand-400 after:transition-all after:duration-300 hover:after:w-full"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}

        {showEditLink ? (
          <ButtonLink href="/editor" variant="ghost" className="px-4 py-2 text-xs">
            <span aria-hidden="true">✎</span> Edit page
          </ButtonLink>
        ) : (
          <span className="rounded-full bg-brand-400/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-brand-300">
            Preview
          </span>
        )}
      </div>
    </header>
  );
}
