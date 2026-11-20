import { Container } from "@/components/atoms";
import { StatItem } from "@/components/molecules";
import type { StatsProps } from "@/lib/cms/types";

export function Stats({ items = [] }: StatsProps) {
  if (items.length === 0) return null;

  return (
    <section aria-label="Stats" className="py-24">
      <Container>
        <dl className="reveal grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 lg:grid-cols-4">
          {items.map((stat, index) => (
            <StatItem key={`${stat.label}-${index}`} {...stat} />
          ))}
        </dl>
      </Container>
    </section>
  );
}
