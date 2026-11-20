import { Container } from "@/components/atoms";
import { FeatureCard, SectionHeader } from "@/components/molecules";
import type { FeatureGridProps } from "@/lib/cms/types";

export function FeatureGrid({ eyebrow, title, subtitle, items = [] }: FeatureGridProps) {
  return (
    <section id="programs" aria-label="Programs" className="scroll-mt-24 py-28">
      <Container>
        <SectionHeader eyebrow={eyebrow} title={title} subtitle={subtitle} />
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => (
            <FeatureCard key={`${item.title}-${index}`} {...item} />
          ))}
        </div>
      </Container>
    </section>
  );
}
