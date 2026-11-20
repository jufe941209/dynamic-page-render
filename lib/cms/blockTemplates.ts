import type { KnownBlockType } from "./blockTypes";
import type { CmsBlock } from "./types";

/**
 * Starter content for each block type. It does double duty:
 *  1. it is what gets inserted when an editor adds a new section, and
 *  2. it is the *field schema* for the visual form: every key listed here is
 *     shown as an editable field, even when an existing block omits it.
 *     The first element of each array is the shape used for "Add item".
 *
 * Typed against `KnownBlockType`, so every supported block must have one.
 */
export const BLOCK_TEMPLATES: Record<KnownBlockType, Record<string, unknown>> = {
  hero: {
    eyebrow: "New season",
    title: "Your headline here.",
    highlight: "Make it bold.",
    subtitle: "A short sentence that explains the value.",
    primaryCta: { label: "Get started", href: "#pricing" },
    secondaryCta: { label: "Learn more", href: "#programs" },
    ticker: ["Speed", "Power", "Focus"],
  },
  stats: {
    items: [
      { value: "100+", label: "New metric" },
      { value: "24/7", label: "Another metric" },
    ],
  },
  featureGrid: {
    eyebrow: "Features",
    title: "Section title",
    subtitle: "One line that frames the section.",
    items: [{ icon: "⚡", title: "New feature", description: "Describe the benefit.", tag: "New" }],
  },
  pricing: {
    eyebrow: "Pricing",
    title: "Plans",
    subtitle: "Pick the plan that fits you.",
    plans: [
      {
        name: "New plan",
        price: "$0",
        period: "/month",
        description: "Who this plan is for.",
        features: ["One feature"],
        cta: { label: "Choose", href: "#join" },
        highlighted: false,
      },
    ],
  },
  testimonials: {
    eyebrow: "Reviews",
    title: "What people say",
    items: [{ quote: "Amazing experience.", author: "New Athlete", role: "Member", rating: 5 }],
  },
  faq: {
    eyebrow: "FAQ",
    title: "Questions",
    subtitle: "Everything you need to know.",
    items: [{ question: "New question?", answer: "The answer goes here." }],
  },
  ctaBanner: {
    title: "Ready to start?",
    description: "One line that pushes to action.",
    cta: { label: "Join now", href: "#pricing" },
  },
};

/** Field schema for page-level settings (everything except `blocks`). */
export const PAGE_SETTINGS_SHAPE: Record<string, unknown> = {
  title: "",
  slug: "",
  description: "",
  site: {
    name: "",
    nav: [{ label: "New link", href: "#" }],
    footerNote: "",
  },
};

export function templateFor(type: string): Record<string, unknown> | undefined {
  return Object.hasOwn(BLOCK_TEMPLATES, type)
    ? BLOCK_TEMPLATES[type as KnownBlockType]
    : undefined;
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 8);
}

export function createBlockId(type: string): string {
  return `blk_${type}_${randomSuffix()}`;
}

/** Builds a new block. `type` may be unknown on purpose (to demo the fallback). */
export function createBlock(type: string): CmsBlock {
  const template = templateFor(type);
  return {
    id: createBlockId(type),
    type,
    props: template ? structuredClone(template) : {},
  };
}
