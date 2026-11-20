# AI Prompt Log

**Project:** Dynamic Page Renderer (Next.js App Router)
**AI tool:** Claude Code (Anthropic), used inside VS Code as an agentic pair-programmer
**Approach:** I acted as tech lead. I set the context, constraints and acceptance criteria, then reviewed,
verified and corrected the AI's output at each step. The AI never got a vague "build it" instruction.

> Prompts are listed in the order they were issued. Some were originally written in Spanish and are
> shown here translated and lightly edited for clarity; intent and content are unchanged.

---

## Security logic at a glance

Security was a requirement in every phase, not a final pass. My rule for the AI was: **treat everything
that comes from the CMS, the network or another window as untrusted, and prove each defense with a
test.** Where each control was introduced:

| Control | Introduced in | Proven by |
| --- | --- | --- |
| CMS payload typed `unknown` + `isCmsBlock` type guard | Prompt 3 | malformed-entry tests |
| `Object.hasOwn` registry lookup (no prototype keys as components) | Prompt 5 | `toString` / `__proto__` / `constructor` tests |
| Per-block error boundary (one bad block can't take the page down) | Prompt 5 | crash-isolation and recovery tests |
| Non-root, minimal, multi-stage Docker image, with tests as a build gate | Prompt 9 | CI Docker job |
| `postMessage` target origin + `event.origin`/`event.source` checks | Prompt 11 | — |
| Publish API: dev-only, same-origin, size limit, server-side validation | Prompt 12 | `route.test.ts` (400/403/422) |
| Allow-list link sanitizer, external `rel=noopener`, no raw HTML anywhere | Prompt 16 | `safeHref.test.tsx` (XSS payloads) |
| Security headers (CSP `frame-ancestors`, nosniff…), no `X-Powered-By` | Prompt 16 | CI smoke test |

---

## How I structured the work

| Phase | Goal | Prompts |
| --- | --- | --- |
| 1. Context & planning | Ground the AI in the real codebase before it writes anything | 1–2 |
| 2. Data contract | Design the CMS payload and its types | 3 |
| 3. Architecture | Atomic Design and reusable components | 4 |
| 4. Core logic | The `PageBuilder` and its resilience guarantees | 5 |
| 5. The AI Twist | Generate the unit test suite | 6 |
| 6. Verification & fixes | Run quality gates, catch AI or tooling mistakes | 7–8 |
| 7. Containerization | Production Docker image | 9 |
| 8. Product polish | Sports re-theme, visual design and motion | 10 |
| 9. Going beyond | CMS editor with live preview and a publish API | 11–12 |
| 10. User feedback loop | Fix a dev-only styling bug, upgrade the editor, clean content, triage a hydration warning | 13–15 |
| 11. Security review | Threat-model the app and close the gaps found | 16 |
| 12. Documentation | README and this log | 17 |

---

## Phase 1 — Context & planning

### Prompt 1 — Codebase reconnaissance
> You are a senior frontend engineer joining this repo. Before writing any code:
> 1. Inspect `package.json`, `next.config.ts`, `tsconfig.json` and the test setup, and summarize the stack and versions.
> 2. This Next.js version may differ from your training data. Read the relevant guides in
>    `node_modules/next/dist/docs/` (standalone output, Docker deployment, Vitest testing, route handlers)
>    and flag anything that changed.
> 3. Do not modify files yet.

**Why:** LLMs default to the framework version they were trained on. Making the AI read the installed
docs first prevented outdated APIs.

**Outcome:** The AI found Next.js 16.4 + React 19, Tailwind v4, Vitest already wired, and
`output: "standalone"` already set. It also flagged from the docs that **only synchronous Server
Components can be unit-tested with Vitest**, which led to the decision to keep `PageBuilder` synchronous.

### Prompt 2 — Requirements to acceptance criteria
> Here is the assignment: [pasted brief]. Turn it into a checklist of verifiable acceptance criteria
> and propose a folder structure. Treat the CMS as an untrusted source. Unknown types, malformed entries
> and component crashes must each be handled. Wait for my approval before implementing.

**Outcome:** A 6-item checklist (now in the README) and a plan with resilience at three levels:
validation, registry lookup, error boundary.

---

## Phase 2 — Data contract

### Prompt 3 — Mock CMS payload and types
> Create `data/data.json` that looks like a real Headless CMS response (Contentful or Storyblok style):
> page metadata plus a `blocks` array of `{ id, type, props }`.
> - Include realistic content for several block types (hero, features, pricing with a highlighted tier,
>   testimonials, CTA).
> - **Deliberately include a `slider` block that has no component**, so the unknown-type path is visible in the demo.
> - In `lib/cms/types.ts`, define a props type per block and an `isCmsBlock` type guard. Block props from
>   the CMS must be typed as untrusted at the boundary, not blindly cast.

**Review notes:** I checked that the type guard rejects arrays (`typeof [] === "object"`), whitespace-only
types and non-object `props`. All three were handled.

---

## Phase 3 — Architecture

### Prompt 4 — Atomic Design refactor *(mid-task course correction)*
> Before going further, organize the components with **Atomic Design** so everything is reusable:
> - `atoms/`: primitive UI with no domain knowledge (Button, Heading, Text, Badge, Container)
> - `molecules/`: small compositions (SectionHeader, PricingCard, FeatureCard, TestimonialCard, FaqItem)
> - `organisms/`: the CMS blocks, built only from atoms and molecules
> - `page-builder/`: the rendering engine, kept apart from the UI
>
> Expose each layer through an `index.ts` barrel. Use a tiny `cn()` helper instead of adding a dependency.
> Also add an **FAQ** block. Implement it with native `<details>/<summary>` so it is accessible and needs no client JS.

**Why:** The first pass put each block in a single file. That works, but it duplicates headings,
buttons and cards across sections. Atomic Design makes "add a new block" a composition exercise.

---

## Phase 4 — Core logic

### Prompt 5 — The PageBuilder
> Implement `components/page-builder/`:
> - `registry.ts`: a frozen `type → component` map. Lookup **must use `Object.hasOwn`**, because a plain
>   `registry[type]` would resolve `"toString"` or `"constructor"` to Object.prototype and crash.
> - `PageBuilder.tsx`: accepts `blocks: unknown` and an optional injectable `registry`. For each entry:
>   validate → resolve → render inside a per-block error boundary. Must never throw because of its input.
> - `BlockErrorBoundary.tsx`: a client class component that isolates crashes per block.
> - `BlockFallback.tsx`: a visible placeholder in development, `null` in production. Log with `console.warn`.
> - Keys: use the CMS `id` with the index as a suffix, so duplicated ids from the CMS can't collide.
>
> Keep `PageBuilder` a synchronous Server Component. Explain any trade-off you make.

**Review notes:** I confirmed that the error boundary is the only `"use client"` file in the render path.

---

## Phase 5 — The AI Twist: test generation

### Prompt 6 — Unit test suite
> Generate a Vitest + React Testing Library suite for `PageBuilder`. The focus is the
> **"Unknown Component Type"** scenario: if the JSON asks for a `slider` and no such component exists, the app must not crash.
>
> Cover at least:
> 1. Rendering does not throw.
> 2. Known blocks before and after the unknown one still render, in order.
> 3. A development placeholder names the missing type.
> 4. A warning is logged.
> 5. In **production** (`vi.stubEnv("NODE_ENV", "production")`) nothing is rendered for it.
> 6. Several unknown types on one page.
> 7. Case sensitivity (`"STUB"` ≠ `"stub"`).
> 8. Prototype keys (`toString`, `constructor`, `__proto__`, `hasOwnProperty`).
>
> Also cover malformed entries (table-driven with `it.each`), a non-array `blocks`, a component that
> throws (error boundary), and an integration test that renders the real `data.json`.
>
> Rules: use an injected stub registry so the tests don't depend on organism markup, query by role or
> test-id rather than CSS classes, spy on and silence `console.warn/error`, and restore all mocks
> and env stubs after each test.

**Outcome:** 30 tests, all passing.

**Review notes:** I added the assertion *"every type in data.json is registered except `slider`"*.
It works as a contract test: if someone adds a block to the CMS without registering it, CI fails.

---

## Phase 6 — Verification & fixes

### Prompt 7 — Run all quality gates
> Run `vitest run`, `tsc --noEmit`, `eslint .` and `next build`. Report every warning, not only errors,
> and fix the root cause rather than suppressing it.

**Issues the AI surfaced and fixed:**
1. **Deprecation:** Vitest warned that `vite-tsconfig-paths` is superseded by native `resolve.tsconfigPaths`.
   The plugin was removed and the config migrated.
2. **Silent styling bug:** `next build` passed but warned `Unknown at rule: @theme`. On inspection, the
   generated CSS was only about 4 KB and contained no utilities. **Tailwind was never wired up** in the
   scaffold (`@tailwindcss/turbopack` was installed but not registered). The AI registered the loader
   and verified the production CSS. *(This fix later turned out to be incomplete in dev mode; see Prompt 13.)*

**Lesson:** a green build is not proof. Treating warnings as signals caught a bug that would have
shipped an unstyled page.

### Prompt 8 — Runtime smoke test
> Start the app and verify over HTTP that every block renders, the `slider` placeholder appears in dev,
> and the `<title>` comes from the CMS metadata.

---

## Phase 7 — Containerization

### Prompt 9 — Production Docker image
> Write a multi-stage `Dockerfile` for Next.js `output: "standalone"`:
> `deps` (npm ci, cached on the lockfile) → `builder` (**run the test suite, then build**; failing tests
> must fail the image) → `runner` (only `.next/standalone`, `.next/static`, `public`).
> Run as a non-root user, add a `HEALTHCHECK`, and disable telemetry.
> Add `docker-compose.yml` exposing port 3000 and a `.dockerignore`.

---

## Phase 8 — Product polish

### Prompt 10 — Sports re-theme and visual design
> The brief doesn't mandate a theme, so make the page memorable: re-theme it as a **high-performance
> sports club**. Requirements:
> - **Design tokens** in Tailwind v4 `@theme`: neon-lime `brand`, orange `accent`, dark `ink` surfaces.
>   No hard-coded colors scattered through the components.
> - A condensed display font (Oswald via `next/font`) for headlines.
> - **CSS-only motion:** floating glow blobs, a faded grid, staggered fade-up, an animated gradient
>   headline, an infinite marquee ticker, glass cards with hover lift and glow, and a gradient-bordered
>   featured plan. Add a scroll-driven reveal with `animation-timeline: view()` as progressive enhancement.
> - **Accessibility is non-negotiable:** honor `prefers-reduced-motion`, mark decorative elements
>   `aria-hidden`, hide the marquee's duplicated items from screen readers, use valid `dl/dt/dd` for stats.
> - Add a `stats` block and site chrome (header and footer) driven by a new `site` object in the JSON,
>   and add a `templates/` layer to the Atomic Design hierarchy.
> - Update the tests to the new content and keep them green.

**Review notes:** I caught that the first version of `StatItem` put `<dd>` before `<dt>`. The AI fixed
the DOM order and used `flex-col-reverse` to keep the visual order.

---

## Phase 9 — Going beyond the brief

### Prompt 11 — CMS editor with live preview
> Content editors should be able to change the page without touching code, like Contentful, Storyblok
> or WordPress' block editor. Build `/editor`:
> - **Block list:** select, reorder, duplicate, delete, and add from typed templates. Badge unknown and invalid blocks.
> - **JSON editor** per block and for the whole document: line numbers, live parse errors, Format.
>   Invalid text must never reach the draft state.
> - **Live preview in an iframe** that reuses the exact same `PageShell`/`PageBuilder` as production,
>   fed over `postMessage` with origin checks, plus Desktop, Tablet and Mobile toggles that hit real breakpoints.
> - **Validation panel:** errors block publishing, warnings don't. Clicking an issue jumps to the block.
> - Manage state in a **pure reducer** so it can be unit-tested.
> - Constraint: the brief requires *hardcoded* JSON. Don't introduce a database. Publishing must write
>   `data/data.json` itself.

### Prompt 12 — Publish API and safety
> Add `app/api/page/route.ts`: `GET` returns the page (a mock CMS delivery API) and `PUT` validates on the
> server and writes `data/data.json`. Harden it: **development only** (403 in production, since containers
> are immutable), same-origin check, payload size limit, 400 for bad JSON, 422 with the issues for
> invalid pages. Make block types a single source of truth (`KNOWN_BLOCK_TYPES`) and type the
> registry and templates against it with `satisfies`, so adding a type without implementing it is a
> **compile error**. Add tests for the validator, the reducer, the editor UI and the route handler.

**Outcome:** 65 tests across 5 suites, all passing. Typecheck, lint and build are clean.

---

## Phase 10 — User feedback loop

### Prompt 13 — "The page has no colors" (bug report from manual QA)
> When I open the site with `npm run dev`, nothing has colors or backgrounds: buttons and text are
> invisible. Find the root cause. Don't guess. Compare what the dev server serves with what the
> production build emits.

**Root cause the AI found:** the production CSS was correct (~59 KB with every utility), but the dev
server's CSS contained utilities from the *first* design (`bg-indigo-600`) and none of the current ones.
The scaffold used the `@tailwindcss/turbopack` loader. In dev, Turbopack cached its output and never
re-scanned the components when classes changed. The installed Next.js docs recommend
`@tailwindcss/postcss`, so the AI switched to that (`postcss.config.mjs`) and removed the loader.

**Lesson:** "it builds" is not "it works". Manual QA in dev mode caught what CI-style checks couldn't,
and the fix came from the framework's own docs rather than from a workaround.

### Prompt 14 — Make the editor truly visual
> Editors shouldn't need to touch JSON. Upgrade `/editor` to a three-pane visual builder:
> - **Library of sections** you can **drag & drop** onto the layers list (with a precise drop indicator)
>   or directly onto the live preview. Clicking a tile also works.
> - **Drag to reorder** layers. Keep keyboard-accessible ↑ ↓ buttons as a fallback.
> - **Inspector with auto-generated forms**: infer widgets from the data (text, textarea, number,
>   switch, string list, list of cards, nested group). Merge with the block template so optional
>   fields appear even when missing. Lists must support add, duplicate, reorder and remove, because
>   that's how editors "create components" inside a section.
> - **Click a section in the preview to select it**, outline the selection, and scroll it into view.
> - **Page settings** form (SEO, brand, navigation) and a JSON tab for power users.
> - Use native HTML5 DnD (no new dependency), and cover drag & drop in tests by mocking `dataTransfer`.
>
> Also: the error boundary must **recover** when the editor fixes a crashing block's props, and list keys
> inside sections must stay unique when items are duplicated.

**Outcome:** 76 tests passing, including drag & drop (library → layers, library → preview,
reordering), form editing, adding items, and error-boundary recovery.

### Prompt 15 — Clean content, zero validation issues, and a hydration warning
> While testing the editor I published a messy page (duplicated sections, template text, two sliders).
> Restore the curated content, and make the shipped page produce **zero** validation warnings. The
> unknown-component requirement must still be proven, so move that demo out of the production data and
> into tests and the editor. Also triage this dev overlay error: *"A tree hydrated but some attributes …
> didn't match: `cz-shortcut-listen="true"` on `<body>`"*.

**Outcome:**
- `data.json` restored. A new contract test asserts it validates with `{ valid: true, issues: [] }`
  and renders with no fallbacks or warnings.
- The unknown `slider` is still covered: a test injects it into the real page, and the editor's
  **Slider (demo)** tile adds it live (flagged as a warning, never a crash).
- **Hydration triage:** the attribute comes from the ColorZilla browser extension, not from the app.
  The fix is `suppressHydrationWarning` on `<body>` only, which silences attribute mismatches on that
  single element without hiding real hydration bugs elsewhere.
- Bonus catch: Tailwind was scanning this Markdown log and emitting a stray class mentioned in prose,
  so docs are now excluded with `@source not "../*.md"`.

---

## Phase 11 — Security review

### Prompt 16 — Threat model and hardening
> Act as an application security reviewer. Treat the CMS, the browser and other windows as untrusted.
> 1. **Threat-model** this app (renderer, editor, preview iframe, publish API, Docker image) and list
>    each threat with its current mitigation, or "missing".
> 2. Close every gap you find. Prefer **allow-lists over block-lists**, and apply each control in **one
>    central place** (e.g. an atom) so no component can forget it.
> 3. For every fix, write a test that uses a **real attack payload**, not just the happy path.
> 4. Grep the codebase for `dangerouslySetInnerHTML`, `eval` and `new Function` and report the count.
> 5. Don't break the editor's same-origin iframe.

**Gaps the AI found and closed:**
- **Stored XSS via CMS links.** `href` values from the CMS were rendered as-is. React 19 blocks
  `javascript:` URLs, but not `data:`, `vbscript:` or protocol-relative `//evil.example`. Added an
  allow-list `safeHref` (anchors, same-site paths, `http(s)`, `mailto`, `tel`) that uses the WHATWG URL
  parser, so obfuscations like `java\tscript:` and `JaVaScRiPt:` are normalized before the check. It's
  applied once in the `ButtonLink` atom and in the nav. External links get `rel="noopener noreferrer"`.
- **Missing security headers.** Added CSP `frame-ancestors 'self'` (blocks clickjacking but keeps
  the editor's own iframe working), `X-Frame-Options`, `nosniff`, `Referrer-Policy` and
  `Permissions-Policy`, and removed `X-Powered-By`.
- **Verified as already safe:** CMS text is only rendered through React escaping, and the count of
  `dangerouslySetInnerHTML`/`eval`/`new Function` is **0**. The publish API is dev-only, same-origin
  and size-limited. The container runs as non-root.

**Review notes:** I asked for the XSS tests to use real payloads (`javascript:alert(document.cookie)`,
`data:text/html,<script>…`, `<img onerror>` in text). The CI smoke test now also asserts the headers
on the **running container**, not just in unit tests.

**Outcome:** 103 tests passing. CI verifies the headers and the read-only API against the Docker container.

---

## Phase 12 — Documentation

### Prompt 17 — README and this log
> Write a README for a reviewer who has 5 minutes: a requirements checklist linking to files, routes,
> quick start, the editor, a flow diagram of the resilience logic, the structure, how to add a block,
> and the design decisions with their trade-offs. Then compile this prompt log in English, in
> chronological order and grouped by phase, with the *why* and the review notes for each prompt.

---

## Takeaways on working with AI

- **Context first, code second.** Making the AI read the installed framework docs avoided outdated APIs.
- **Specify acceptance criteria, not implementations.** The test prompt listed the scenarios to cover
  and left the code to the AI, which produced better tests than "write tests for this".
- **Encode non-obvious requirements explicitly.** Examples: `Object.hasOwn`, dev vs prod behaviour,
  `postMessage` origin checks, reduced motion. The AI handles these reliably once they're stated.
- **Verify everything.** The most valuable catch, Tailwind not being wired, came from asking the AI to
  investigate a warning instead of declaring success on a passing build.
- **Let the type system enforce architecture.** `satisfies Record<KnownBlockType, …>` turns "remember
  to register the block" into a compile error.
- **Course-correct early.** The Atomic Design refactor and the re-theme were cheap because the
  contracts and tests were already in place.
