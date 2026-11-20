import pageData from "@/data/data.json";
import type { CmsPage } from "./types";

/**
 * Data-access layer for the (mocked) Headless CMS.
 *
 * Today it returns the hardcoded `data/data.json`. Swapping it for a real CMS
 * (Contentful, Sanity, Strapi…) only means replacing this body with a `fetch`;
 * the page and the PageBuilder do not change.
 */
export async function getPage(): Promise<CmsPage> {
  return pageData as CmsPage;
}
