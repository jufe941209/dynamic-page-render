import { Badge, ButtonLink, Container, GradientText, Heading, Text } from "@/components/atoms";
import { Ticker } from "@/components/molecules";
import type { HeroProps } from "@/lib/cms/types";

export function Hero({
  eyebrow,
  title,
  highlight,
  subtitle,
  primaryCta,
  secondaryCta,
  ticker = [],
}: HeroProps) {
  return (
    <section aria-label="Hero" className="relative isolate overflow-hidden pt-36 sm:pt-44">
      {/* Background: grid + two floating glow blobs */}
      <div aria-hidden="true" className="bg-grid absolute inset-0 -z-10" />
      <div
        aria-hidden="true"
        className="absolute -left-40 top-0 -z-10 h-[32rem] w-[32rem] animate-float rounded-full bg-brand-400/20 blur-[120px]"
      />
      <div
        aria-hidden="true"
        className="absolute -right-40 top-48 -z-10 h-[28rem] w-[28rem] animate-float rounded-full bg-accent-500/20 blur-[120px] [animation-delay:-7s]"
      />

      <Container className="pb-24 text-center">
        {eyebrow && (
          <div className="animate-fade-up">
            <Badge live>{eyebrow}</Badge>
          </div>
        )}
        <Heading level={1} className="mx-auto mt-8 max-w-5xl animate-fade-up [animation-delay:120ms]">
          {title}
          {highlight && (
            <>
              <br />
              <GradientText>{highlight}</GradientText>
            </>
          )}
        </Heading>
        {subtitle && (
          <Text size="lg" className="mx-auto mt-8 max-w-2xl animate-fade-up [animation-delay:240ms]">
            {subtitle}
          </Text>
        )}
        {(primaryCta || secondaryCta) && (
          <div className="mt-12 flex animate-fade-up flex-wrap items-center justify-center gap-4 [animation-delay:360ms]">
            {primaryCta && (
              <ButtonLink href={primaryCta.href} withArrow pulse>
                {primaryCta.label}
              </ButtonLink>
            )}
            {secondaryCta && (
              <ButtonLink href={secondaryCta.href} variant="ghost">
                {secondaryCta.label}
              </ButtonLink>
            )}
          </div>
        )}
      </Container>

      <Ticker items={ticker} />
    </section>
  );
}
