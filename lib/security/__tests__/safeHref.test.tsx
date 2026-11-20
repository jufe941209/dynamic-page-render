import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageBuilder } from "@/components/page-builder";
import { BLOCKED_HREF, safeHref } from "../safeHref";

describe("safeHref (CMS link sanitizer)", () => {
  it.each([
    "#pricing",
    "/editor",
    "/programs?level=pro#top",
    "https://example.com/path",
    "http://example.com",
    "mailto:coach@example.com",
    "tel:+573001234567",
  ])("keeps safe link %s", (href) => {
    expect(safeHref(href)).toBe(href);
  });

  it.each([
    ["javascript: URL", "javascript:alert(document.cookie)"],
    ["mixed-case javascript", "JaVaScRiPt:alert(1)"],
    ["tab-obfuscated javascript", "java\tscript:alert(1)"],
    ["leading whitespace", "   javascript:alert(1)"],
    ["data: URL", "data:text/html,<script>alert(1)</script>"],
    ["vbscript: URL", "vbscript:msgbox(1)"],
    ["file: URL", "file:///etc/passwd"],
    ["protocol-relative URL", "//evil.example"],
    ["backslash trick", "/\\evil.example"],
    ["bare relative text", "pricing"],
    ["empty string", ""],
  ])("blocks %s", (_label, href) => {
    expect(safeHref(href)).toBe(BLOCKED_HREF);
  });

  it.each([undefined, null, 42, {}, ["#a"]])("blocks non-string value %s", (href) => {
    expect(safeHref(href)).toBe(BLOCKED_HREF);
  });
});

describe("PageBuilder with hostile CMS content", () => {
  it("neutralizes a javascript: CTA coming from the CMS", () => {
    render(
      <PageBuilder
        blocks={[
          {
            type: "hero",
            props: {
              title: "Hi",
              primaryCta: { label: "Click me", href: "javascript:alert(document.cookie)" },
              secondaryCta: { label: "Docs", href: "https://example.com" },
            },
          },
        ]}
      />,
    );
    expect(screen.getByRole("link", { name: /click me/i })).toHaveAttribute("href", "#");
    const external = screen.getByRole("link", { name: /docs/i });
    expect(external).toHaveAttribute("href", "https://example.com");
    expect(external).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders CMS text as text, never as HTML (no markup injection)", () => {
    render(
      <PageBuilder
        blocks={[{ type: "hero", props: { title: '<img src=x onerror="alert(1)">' } }]}
      />,
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent('<img src=x onerror="alert(1)">');
    expect(document.querySelector("img")).toBeNull();
  });
});
