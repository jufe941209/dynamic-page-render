import { Container } from "@/components/atoms";
import { SectionHeader, TestimonialCard } from "@/components/molecules";
import type { TestimonialsProps } from "@/lib/cms/types";

export function Testimonials({ eyebrow, title, items = [] }: TestimonialsProps) {
  return (
    <section aria-label="Testimonials" className="py-28">
      <Container>
        <SectionHeader eyebrow={eyebrow} title={title} />
        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => (
            <TestimonialCard key={`${item.author}-${index}`} {...item} />
          ))}
        </div>
      </Container>
    </section>
  );
}
