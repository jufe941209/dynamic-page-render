/**
 * Single source of truth for the block types this site supports.
 *
 * Kept free of React imports so it can be shared by the renderer registry,
 * the editor (client) and the API route (server) without bundling components.
 * The registry and the editor templates are typed against this list, so the
 * compiler fails if a type is added here but not implemented there.
 */
export const KNOWN_BLOCK_TYPES = [
  "hero",
  "stats",
  "featureGrid",
  "pricing",
  "testimonials",
  "faq",
  "ctaBanner",
] as const;

export type KnownBlockType = (typeof KNOWN_BLOCK_TYPES)[number];

export const BLOCK_LABELS: Record<KnownBlockType, { label: string; icon: string; description: string }> = {
  hero: { label: "Hero", icon: "★", description: "Big headline + CTAs" },
  stats: { label: "Stats", icon: "#", description: "Key numbers band" },
  featureGrid: { label: "Feature grid", icon: "▦", description: "Cards with icons" },
  pricing: { label: "Pricing", icon: "$", description: "Plans & prices" },
  testimonials: { label: "Testimonials", icon: "❝", description: "Quotes & ratings" },
  faq: { label: "FAQ", icon: "?", description: "Questions accordion" },
  ctaBanner: { label: "CTA banner", icon: "➜", description: "Final call to action" },
};

export function isKnownBlockType(type: string): type is KnownBlockType {
  return (KNOWN_BLOCK_TYPES as readonly string[]).includes(type);
}
