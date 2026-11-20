import { Heading, Text } from "@/components/atoms";
import { cn } from "@/lib/cn";

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
};

export function SectionHeader({ eyebrow, title, subtitle, align = "center" }: SectionHeaderProps) {
  return (
    <header className={cn("reveal max-w-2xl", align === "center" && "mx-auto text-center")}>
      {eyebrow && (
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-brand-400">
          <span aria-hidden="true">— </span>
          {eyebrow}
        </p>
      )}
      <Heading level={2}>{title}</Heading>
      {subtitle && (
        <Text size="lg" className="mt-5">
          {subtitle}
        </Text>
      )}
    </header>
  );
}
