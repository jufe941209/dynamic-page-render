# Dynamic Page Renderer: Velocity Sports Club

A Next.js (App Router) landing page that is assembled at runtime from a mocked **Headless CMS** response,
plus a **CMS-style visual editor** for changing that JSON with a live preview.

A `PageBuilder` reads an array of `{ type, props }` blocks and renders the matching component.
Unknown or broken blocks never crash the page.

> 📹 **Demo video:** [`docs/demo.mp4`](docs/demo.mp4)
> 🤖 **AI Prompt Log:** [`PROMPT_LOG.md`](PROMPT_LOG.md)

---

## Requirements checklist

| Requirement | Where |
| --- | --- |
| Hardcoded `data.json` mimicking a Headless CMS | [`data/data.json`](data/data.json) |
| `PageBuilder` that iterates the array and renders the right component | [`components/page-builder/PageBuilder.tsx`](components/page-builder/PageBuilder.tsx) |
| AI-generated unit tests for an **Unknown Component Type** (app must not crash) | [`components/page-builder/__tests__/PageBuilder.test.tsx`](components/page-builder/__tests__/PageBuilder.test.tsx) |
| Dockerfile + docker compose | [`Dockerfile`](Dockerfile), [`docker-compose.yml`](docker-compose.yml) |
| Prompt Log | [`PROMPT_LOG.md`](PROMPT_LOG.md) |
| Video of the local environment | [`docs/demo.mp4`](docs/demo.mp4) |

**Beyond the brief:** a visual editor at `/editor` (block list, JSON editing, live responsive preview,
validation, publish), a mock CMS API at `/api/page`, Atomic Design, and 78 tests.

## Quick start

```bash
# Local (Node 20.9+)
npm ci
npm run dev                 # site:   http://localhost:3000
                            # editor: http://localhost:3000/editor

# Quality gates
npm test                    # 78 tests (Vitest + Testing Library)
npm run typecheck
npm run lint

# Docker (the test suite runs during the image build)
docker compose up --build   # http://localhost:3000
```

## Routes

| Route | What it is |
| --- | --- |
| `/` | The public page, statically rendered from `data/data.json` |
| `/editor` | Visual CMS editor |
| `/preview` | Live preview rendered inside the editor's iframe |
| `GET /api/page` | Mock Headless CMS delivery API (returns the page JSON) |
| `PUT /api/page` | Publishes a validated page to `data/data.json` (development only) |

## The editor (`/editor`)

A small visual CMS in the spirit of Storyblok, Webflow and WordPress' block editor, with three panes:
**library + layers | live preview | inspector**.

- **Drag & drop:** drag a section from the library onto the layers list (precise drop line) or straight
  onto the live preview, or click a tile to insert it. Drag layers to reorder them. Keyboard-accessible
  ↑ ↓ buttons are kept as a fallback. Native HTML5 DnD, no library.
- **Visual forms:** every text, link, number and toggle of a section is editable in the inspector. The
  form is generated from the block's data merged with its template, so optional fields that don't
  exist yet still appear. Nested lists (plans, features, FAQs, nav links…) support add, duplicate,
  reorder and remove, which is how you create new cards inside a section.
- **Click-to-edit:** clicking a section in the preview selects it in the editor, and the selected
  section is outlined and scrolled into view.
- **JSON mode:** per section or for the whole document, with line numbers, live parse errors and a
  Format button. Invalid JSON never reaches the draft, so the preview keeps the last valid version.
- **Page settings:** title, slug, SEO description, brand name, navigation links and footer.
- **Live preview:** an iframe that renders the *same* `PageShell` + `PageBuilder` as the public page,
  fed over `postMessage` (same-origin checked). The Desktop, Tablet and Mobile toggles trigger real
  responsive breakpoints.
- **Validation:** errors (broken contract) block publishing, while warnings (e.g. the unknown `slider`)
  don't. Click an issue to jump to its block.
- **Publish:** `PUT /api/page` validates on the server, checks the origin and size, and writes
  `data/data.json`. Next.js hot-reloads the public page instantly.
- **Production-safe:** in a production build (Docker) the content is read-only, because the brief
  requires hardcoded data and a container should be immutable. The editor still works as a playground
  with **Download JSON** and **Copy JSON**.

## How the renderer works

```
data/data.json ─► lib/cms/getPage.ts ─► app/page.tsx ─► <PageShell> ─► <PageBuilder blocks={…} />
                                                                            │
                                                     for each block ────────┤
                                                                            ▼
                         isCmsBlock? ──no──► <BlockFallback reason="invalid" />
                              │yes
                    resolveBlock(type) ──not found──► <BlockFallback reason="unknown" />
                              │found
                <BlockErrorBoundary> <Component {...props} /> </BlockErrorBoundary>
                              │throws
                              └──────────────► <BlockFallback reason="error" />
```

**Resilience guarantees**

1. **Unknown type** (e.g. `"slider"`): skipped, logged with `console.warn`, and the rest of the page renders.
2. **Malformed entry** (`null`, missing or non-string `type`, non-object `props`): skipped the same way.
3. **Crashing component:** contained by a per-block error boundary.
4. **Prototype-safe lookup:** `Object.hasOwn` stops `"toString"` or `"__proto__"` from resolving to `Object.prototype`.
5. **Dev vs prod:** in development an amber notice marks the broken slot. In production nothing is rendered.

## Project structure (Atomic Design)

```
app/
  page.tsx                # public page
  editor/  preview/       # CMS editor + iframe preview
  api/page/route.ts       # mock CMS API (GET / PUT)
components/
  atoms/                  # ButtonLink, Heading, Text, Badge, GradientText, Container
  molecules/              # SectionHeader, FeatureCard, PricingCard, TestimonialCard, FaqItem, StatItem, Ticker
  organisms/              # CMS blocks: Hero, Stats, FeatureGrid, Pricing, Testimonials, Faq, CtaBanner
  templates/              # PageShell, SiteHeader, SiteFooter (site chrome)
  page-builder/           # rendering engine: PageBuilder, registry, BlockErrorBoundary, BlockFallback
  editor/                 # PageEditor, SectionLibrary, LayersPanel, Inspector, fields/, JsonEditor, LivePreview, editorReducer
data/data.json            # mocked Headless CMS response
lib/cms/                  # contract: types, blockTypes, validate, blockTemplates, getPage
```

### Adding a new block type

1. Add the type to `KNOWN_BLOCK_TYPES` in `lib/cms/blockTypes.ts`.
2. **TypeScript now fails** until you register a component in `registry.ts` and a starter template in
   `blockTemplates.ts`, so the three can't drift apart.
3. Build the organism in `components/organisms/` from existing atoms and molecules.

The `PageBuilder` and the editor need no changes.

## Visual design

Dark athletic theme with neon lime (`brand`) and orange (`accent`) tokens defined in `app/globals.css`
(Tailwind v4 `@theme`), plus the condensed Oswald display face. Effects are CSS-only:

- floating glow blobs and a faded grid behind the hero
- staggered fade-up entrance and an animated gradient headline
- an infinite marquee ticker (pauses on hover)
- glassmorphism cards with hover lift and glow, and a gradient-bordered featured plan
- **scroll-driven reveal** via `animation-timeline: view()`, a progressive enhancement with zero JS

All motion is disabled under `prefers-reduced-motion`.

## Design decisions

- **Server Components by default.** The public page ships almost no JS. Client components are limited
  to the error boundary and the editor.
- **One source of truth for block types** (`blockTypes.ts`), shared by the renderer, the editor and the
  API without bundling React into the API route.
- **CMS data is `unknown` until validated**: the type guard sits at the render boundary and
  `validatePage` at the publish boundary.
- **Injectable registry:** tests don't depend on organism markup.
- **The preview is the real renderer.** The editor's iframe uses the same `PageShell`, so the preview
  can't diverge from production.
- **Standalone Docker image:** multi-stage, non-root user, healthcheck, and tests as a build gate.

## Testing

| Suite | Covers |
| --- | --- |
| `PageBuilder.test.tsx` | Unknown types (the AI Twist), malformed entries, crashing blocks, prod vs dev, prototype keys, full `data.json` |
| `validate.test.ts` | CMS contract validation, templates are valid |
| `editorReducer.test.ts` | Add, insert-at (DnD), move-to, duplicate, remove, update, reset, and immutability |
| `PageEditor.test.tsx` | Form editing, adding items, switches, page settings, drag & drop (library → layers, library → preview, reorder), JSON errors, publish, read-only |
| `route.test.ts` | API: dev-only writes, 400/403/422, same-origin check |

## Tech stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript (strict) · Tailwind CSS v4 ·
Vitest + React Testing Library · Docker
