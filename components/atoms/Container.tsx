import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Horizontal page gutter + max width shared by every section. */
export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8", className)}>{children}</div>
  );
}
