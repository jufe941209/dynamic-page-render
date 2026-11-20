/**
 * Links come from the CMS, i.e. from untrusted content editors. A value like
 * `javascript:alert(document.cookie)` in an `href` is a stored-XSS vector.
 *
 * Allow-list approach (never a block-list): only in-page anchors, same-site
 * paths and a few known-safe protocols survive. Everything else becomes "#".
 * React 19 also blocks `javascript:` URLs; this is defense in depth and covers
 * other schemes (`data:`, `vbscript:`, `file:`…) and protocol-relative URLs.
 */
const SAFE_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"]);

export const BLOCKED_HREF = "#";

export function safeHref(href: unknown): string {
  if (typeof href !== "string") return BLOCKED_HREF;
  const value = href.trim();
  if (value === "") return BLOCKED_HREF;

  // In-page anchors ("#pricing") and same-site paths ("/editor"), but not
  // protocol-relative URLs ("//evil.example") or backslash tricks ("/\evil").
  if (value.startsWith("#")) return value;
  if (value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\")) return value;

  // Absolute URLs: the WHATWG parser normalizes obfuscation such as
  // "java\tscript:" or "JaVaScRiPt:" before we read the protocol.
  try {
    return SAFE_PROTOCOLS.has(new URL(value).protocol) ? value : BLOCKED_HREF;
  } catch {
    return BLOCKED_HREF;
  }
}

/** External http(s) links should not get access to `window.opener` nor leak the referrer. */
export function isExternalHref(href: string): boolean {
  return /^https?:\/\//i.test(href);
}
