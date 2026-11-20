import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type BadgeProps = {
  children: ReactNode;
  /** Shows a pulsing "live" dot. */
  live?: boolean;
  className?: string;
};

export function Badge({ children, live = false, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-brand-400/30 bg-brand-400/10 px-3.5 py-1.5",
        "text-xs font-semibold uppercase tracking-[0.2em] text-brand-300 backdrop-blur",
        className,
      )}
    >
      {live && (
        <span aria-hidden="true" className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-400" />
        </span>
      )}
      {children}
    </span>
  );
}
