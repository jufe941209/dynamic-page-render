import type { ComponentType } from "react";
import {
  CtaBanner,
  Faq,
  FeatureGrid,
  Hero,
  Pricing,
  Stats,
  Testimonials,
} from "@/components/organisms";
import type { KnownBlockType } from "@/lib/cms/blockTypes";

/**
 * A block component receives whatever props the CMS sent. Each organism is
 * typed with its own props; `defineBlock` erases that type at the registry
 * boundary, which is exactly where CMS data stops being trusted.
 */
export type BlockComponent = ComponentType<Record<string, unknown>>;
export type BlockRegistry = Readonly<Record<string, BlockComponent>>;

function defineBlock<P extends object>(component: ComponentType<P>): BlockComponent {
  return component as unknown as BlockComponent;
}

/**
 * Maps CMS `type` strings to components.
 * `satisfies` makes the compiler fail if a type in KNOWN_BLOCK_TYPES has no component.
 */
export const blockRegistry: BlockRegistry = Object.freeze({
  hero: defineBlock(Hero),
  stats: defineBlock(Stats),
  featureGrid: defineBlock(FeatureGrid),
  pricing: defineBlock(Pricing),
  testimonials: defineBlock(Testimonials),
  faq: defineBlock(Faq),
  ctaBanner: defineBlock(CtaBanner),
} satisfies Record<KnownBlockType, BlockComponent>);

/**
 * Own-property lookup only. A plain `registry[type]` would resolve
 * `"toString"`, `"constructor"` or `"__proto__"` to Object.prototype members
 * and try to render them as components.
 */
export function resolveBlock(type: string, registry: BlockRegistry): BlockComponent | undefined {
  return Object.hasOwn(registry, type) ? registry[type] : undefined;
}
