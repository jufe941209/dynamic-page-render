import { Container } from "@/components/atoms";
import type { SiteConfig } from "@/lib/cms/types";

export function SiteFooter({ site }: { site?: SiteConfig }) {
  return (
    <footer className="border-t border-white/10 py-10">
      <Container className="flex flex-col items-center justify-between gap-4 text-sm text-zinc-500 sm:flex-row">
        <p className="font-display text-lg font-bold uppercase tracking-wider text-white">
          {site?.name ?? "Site"}
          <span className="text-brand-400">.</span>
        </p>
        {site?.footerNote && <p>{site.footerNote}</p>}
      </Container>
    </footer>
  );
}
