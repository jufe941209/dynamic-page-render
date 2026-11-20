import { PageBuilder } from "@/components/page-builder";
import type { CmsPage } from "@/lib/cms/types";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

type PageShellProps = {
  page: Pick<CmsPage, "site" | "blocks">;
  showEditLink?: boolean;
  /** Editor preview only: makes sections selectable. */
  instrument?: boolean;
};

/**
 * Page template: site chrome (header/footer) + CMS-driven body.
 * Shared by the public page and the editor's live preview, so both always match.
 */
export function PageShell({ page, showEditLink = true, instrument = false }: PageShellProps) {
  return (
    <>
      <SiteHeader site={page.site} showEditLink={showEditLink} />
      <main id="top" className="flex-1 overflow-x-clip">
        <PageBuilder blocks={page.blocks} instrument={instrument} />
      </main>
      <SiteFooter site={page.site} />
    </>
  );
}
