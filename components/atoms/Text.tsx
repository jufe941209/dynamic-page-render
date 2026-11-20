import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type TextProps = {
  size?: "sm" | "base" | "lg";
  className?: string;
  children: ReactNode;
};

const sizes = { sm: "text-sm", base: "text-base leading-7", lg: "text-lg leading-8" } as const;

export function Text({ size = "base", className, children }: TextProps) {
  return <p className={cn("text-zinc-400", sizes[size], className)}>{children}</p>;
}
