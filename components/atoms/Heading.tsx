import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type HeadingLevel = 1 | 2 | 3;

const sizes: Record<HeadingLevel, string> = {
  1: "font-display text-5xl font-bold uppercase leading-[0.95] tracking-tight sm:text-7xl lg:text-8xl",
  2: "font-display text-4xl font-bold uppercase leading-none tracking-tight sm:text-5xl",
  3: "text-lg font-semibold",
};

type HeadingProps = {
  level?: HeadingLevel;
  className?: string;
  children: ReactNode;
};

/** Semantic heading whose visual size follows its level. */
export function Heading({ level = 2, className, children }: HeadingProps) {
  const Tag = `h${level}` as const;
  return <Tag className={cn("text-white", sizes[level], className)}>{children}</Tag>;
}
