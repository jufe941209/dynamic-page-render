/**
 * Types that describe the (mocked) Headless CMS contract.
 *
 * The CMS is treated as an untrusted, loosely-typed source: a block is only
 * guaranteed to be *something*. `isCmsBlock` narrows it to the minimum shape the
 * PageBuilder needs (`{ type: string }`), and every block component is written
 * defensively so partially-filled props never crash the page.
 */

export type Cta = {
  label: string;
  href: string;
};

export type HeroProps = {
  eyebrow?: string;
  title: string;
  /** Second line of the headline, rendered with the animated gradient. */
  highlight?: string;
  subtitle?: string;
  primaryCta?: Cta;
  secondaryCta?: Cta;
  /** Words scrolling in the marquee band under the hero. */
  ticker?: string[];
};

export type StatEntry = {
  value: string;
  label: string;
};

export type StatsProps = {
  items?: StatEntry[];
};

export type FeatureItem = {
  icon?: string;
  title: string;
  description: string;
  tag?: string;
};

export type FeatureGridProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  items?: FeatureItem[];
};

export type PricingPlan = {
  name: string;
  price: string;
  period?: string;
  description?: string;
  features?: string[];
  cta?: Cta;
  highlighted?: boolean;
};

export type PricingProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  plans?: PricingPlan[];
};

export type Testimonial = {
  quote: string;
  author: string;
  role?: string;
  rating?: number;
};

export type TestimonialsProps = {
  eyebrow?: string;
  title: string;
  items?: Testimonial[];
};

export type FaqEntry = {
  question: string;
  answer: string;
};

export type FaqProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  items?: FaqEntry[];
};

export type CtaBannerProps = {
  title: string;
  description?: string;
  cta?: Cta;
};

export type NavLink = {
  label: string;
  href: string;
};

/** Site-wide settings (navigation, branding) delivered alongside the page. */
export type SiteConfig = {
  name: string;
  nav?: NavLink[];
  footerNote?: string;
};

/** Raw block as delivered by the CMS. `props` is intentionally loose. */
export type CmsBlock = {
  id?: string;
  type: string;
  props?: Record<string, unknown>;
};

export type CmsPage = {
  slug: string;
  title: string;
  description?: string;
  site?: SiteConfig;
  blocks: unknown[];
};

export function isCmsBlock(value: unknown): value is CmsBlock {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.type !== "string" || candidate.type.trim() === "") {
    return false;
  }
  return (
    candidate.props === undefined ||
    (typeof candidate.props === "object" &&
      candidate.props !== null &&
      !Array.isArray(candidate.props))
  );
}
