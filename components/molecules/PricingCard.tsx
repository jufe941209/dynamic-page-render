import { ButtonLink, Heading, Text } from "@/components/atoms";
import { cn } from "@/lib/cn";
import type { PricingPlan } from "@/lib/cms/types";

export function PricingCard({
  name,
  price,
  period,
  description,
  features = [],
  cta,
  highlighted = false,
}: PricingPlan) {
  return (
    // 1px gradient "border" wrapper: lime/orange for the featured plan.
    <div
      className={cn(
        "reveal relative rounded-[2rem] p-px transition-transform duration-500 hover:-translate-y-2",
        highlighted
          ? "bg-linear-to-b from-brand-400 via-brand-400/40 to-accent-500/70 shadow-[0_0_90px_-20px_rgb(208_255_42/0.55)] lg:scale-105"
          : "bg-white/10",
      )}
    >
      <article
        aria-label={`${name} plan`}
        className="relative flex h-full flex-col rounded-[calc(2rem-1px)] bg-ink-900 p-8"
      >
        {highlighted && (
          <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-brand-400 px-4 py-1 text-[0.7rem] font-bold uppercase tracking-widest text-ink-950 shadow-lg shadow-brand-400/30">
            Most popular
          </span>
        )}
        <Heading level={3} className="font-display text-2xl uppercase tracking-wide">
          {name}
        </Heading>
        {description && (
          <Text size="sm" className="mt-2">
            {description}
          </Text>
        )}
        <p className="mt-8 flex items-baseline gap-1">
          <span
            className={cn(
              "font-display text-6xl font-bold tracking-tight",
              highlighted ? "text-gradient" : "text-white",
            )}
          >
            {price}
          </span>
          {period && <span className="text-sm font-semibold text-zinc-500">{period}</span>}
        </p>
        <ul className="mt-8 flex-1 space-y-3.5 text-sm text-zinc-300">
          {features.map((feature, index) => (
            <li key={`${feature}-${index}`} className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[0.65rem] font-bold",
                  highlighted ? "bg-brand-400 text-ink-950" : "bg-white/10 text-brand-400",
                )}
              >
                ✓
              </span>
              {feature}
            </li>
          ))}
        </ul>
        {cta && (
          <ButtonLink
            href={cta.href}
            variant={highlighted ? "primary" : "ghost"}
            withArrow
            className="mt-10 w-full"
          >
            {cta.label}
          </ButtonLink>
        )}
      </article>
    </div>
  );
}
