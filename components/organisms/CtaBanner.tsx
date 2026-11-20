import { ButtonLink, Container } from "@/components/atoms";
import type { CtaBannerProps } from "@/lib/cms/types";

export function CtaBanner({ title, description, cta }: CtaBannerProps) {
  return (
    <section id="join" aria-label="Call to action" className="scroll-mt-24 py-28">
      <Container>
        <div className="reveal relative isolate overflow-hidden rounded-[2.5rem] bg-linear-to-br from-brand-400 via-brand-300 to-accent-400 px-6 py-20 text-center sm:px-16 sm:py-24">
          <div aria-hidden="true" className="bg-stripes absolute inset-0 -z-10" />
          <div
            aria-hidden="true"
            className="absolute -right-24 -top-24 -z-10 h-80 w-80 animate-float rounded-full bg-white/40 blur-3xl"
          />
          <h2 className="mx-auto max-w-3xl font-display text-4xl font-bold uppercase leading-none tracking-tight text-ink-950 sm:text-6xl">
            {title}
          </h2>
          {description && (
            <p className="mx-auto mt-6 max-w-xl text-lg font-medium text-ink-900/80">{description}</p>
          )}
          {cta && (
            <ButtonLink href={cta.href} variant="dark" withArrow className="mt-10 px-8 py-4">
              {cta.label}
            </ButtonLink>
          )}
        </div>
      </Container>
    </section>
  );
}
