import { Container } from "@/components/atoms";
import { PricingCard, SectionHeader } from "@/components/molecules";
import type { PricingProps } from "@/lib/cms/types";

export function Pricing({ eyebrow, title, subtitle, plans = [] }: PricingProps) {
  return (
    <section id="pricing" aria-label="Pricing" className="relative isolate scroll-mt-24 py-28">
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 -z-10 h-[36rem] w-[60rem] max-w-full -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-400/10 blur-[140px]"
      />
      <Container>
        <SectionHeader eyebrow={eyebrow} title={title} subtitle={subtitle} />
        <div className="mt-20 grid items-center gap-8 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <PricingCard key={`${plan.name}-${index}`} {...plan} />
          ))}
        </div>
      </Container>
    </section>
  );
}
