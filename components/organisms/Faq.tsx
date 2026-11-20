import { Container } from "@/components/atoms";
import { FaqItem, SectionHeader } from "@/components/molecules";
import type { FaqProps } from "@/lib/cms/types";

export function Faq({ eyebrow, title, subtitle, items = [] }: FaqProps) {
  return (
    <section id="faq" aria-label="FAQ" className="scroll-mt-24 py-28">
      <Container className="max-w-3xl">
        <SectionHeader eyebrow={eyebrow} title={title} subtitle={subtitle} />
        <div className="mt-14 space-y-4">
          {items.map((item, index) => (
            <FaqItem key={`${item.question}-${index}`} {...item} />
          ))}
        </div>
      </Container>
    </section>
  );
}
