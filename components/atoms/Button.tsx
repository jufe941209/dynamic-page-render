import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";
import { isExternalHref, safeHref } from "@/lib/security/safeHref";

type ButtonVariant = "primary" | "ghost" | "dark";

type ButtonLinkProps = ComponentPropsWithoutRef<"a"> & {
  variant?: ButtonVariant;
  /** Adds an arrow that slides on hover. */
  withArrow?: boolean;
  /** Soft pulsing glow, for the single most important CTA on screen. */
  pulse?: boolean;
};

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-400 text-ink-950 hover:bg-brand-300 hover:shadow-[0_12px_40px_-10px_rgb(208_255_42/0.7)]",
  ghost:
    "bg-white/5 text-white ring-1 ring-inset ring-white/15 backdrop-blur hover:bg-white/10 hover:ring-white/30",
  dark: "bg-ink-950 text-white hover:bg-ink-800 hover:shadow-[0_12px_40px_-10px_rgb(7_8_10/0.8)]",
};

/**
 * Call-to-action rendered as a link (CMS CTAs are always navigations).
 * The href is sanitized here, once, so no organism can forget to do it.
 */
export function ButtonLink({
  variant = "primary",
  withArrow = false,
  pulse = false,
  className,
  children,
  href,
  ...rest
}: ButtonLinkProps) {
  const safe = safeHref(href);

  return (
    <a
      href={safe}
      {...(isExternalHref(safe) ? { rel: "noopener noreferrer" } : {})}
      className={cn(
        "group inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold uppercase tracking-wide",
        "transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]",
        "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-400",
        variants[variant],
        pulse && "animate-glow",
        className,
      )}
      {...rest}
    >
      {children}
      {withArrow && (
        <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">
          →
        </span>
      )}
    </a>
  );
}
