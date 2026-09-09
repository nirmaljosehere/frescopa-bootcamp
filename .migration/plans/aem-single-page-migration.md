# Full Site Migration to AEM Edge Delivery Services

## Overview
Migrate a complete website to AEM Edge Delivery Services (EDS), including page content/blocks, navigation/header, footer, and design/styling matched closely to the original. The approach begins with a full site scope analysis (URL discovery → template cataloging → block cataloging → scope report), then proceeds through design extraction, infrastructure generation, content import, and validation.

## Required Input (confirm before execution)
- **Source website URL / base domain**: _not yet provided_ — must be supplied (e.g. `https://www.example.com`). Execution cannot begin without this.
- **URL discovery method**: sitemap.xml (preferred) or crawl fallback.

## Approach
1. **Site scope analysis** — Discover all URLs, sample pages, group them into page templates, catalog the blocks needed, and produce a migration scope report. This tells us how many distinct page types exist and what work each requires.
2. **Design system extraction** — Pull design tokens (colors, typography, spacing) and global styles from the original site to match it closely.
3. **Per-template infrastructure** — For each template: analyze a representative page, define block variants, generate import parsers/transformers, and create block CSS/JS.
4. **Navigation & footer** — Instrument the header/nav and footer separately using screenshot-driven analysis.
5. **Content import** — Run the bundled import script to generate page content for all in-scope URLs.
6. **Validation & QA** — Visually compare migrated pages/blocks against the original and iterate on styling until closely matched.

## Checklist

### Phase 0 — Prerequisites
- [ ] Confirm the source website URL / base domain
- [ ] Confirm URL discovery method (sitemap vs. crawl)
- [ ] Verify local dev server and project setup are ready

### Phase 1 — Site Scope Analysis
- [ ] Discover all site URLs (sitemap.xml or crawl)
- [ ] Sample and analyze representative pages
- [ ] Group pages into page templates
- [ ] Catalog blocks required across templates
- [ ] Produce migration scope report (page types, block inventory, effort)
- [ ] Review scope report with user and confirm template/page selection

### Phase 2 — Design System
- [ ] Extract design tokens (colors, typography, spacing) from original
- [ ] Apply global styles to match original closely
- [ ] Verify global design renders correctly in preview

### Phase 3 — Page Templates & Block Infrastructure
- [ ] For each template: analyze a representative page's structure
- [ ] Identify/define block variants (reuse existing where ≥70% similar)
- [ ] Generate import parsers per block variant
- [ ] Generate import transformers (cleanup, sections, media)
- [ ] Create/style block CSS & JS for new variants

### Phase 4 — Navigation & Footer
- [ ] Instrument site header/navigation (desktop + mobile + megamenu if present)
- [ ] Migrate and instrument the footer
- [ ] Validate nav and footer structure/appearance against original

### Phase 5 — Content Import
- [ ] Bundle the project import script
- [ ] Run bulk import for in-scope URLs (per template)
- [ ] Verify imported content files generated correctly

### Phase 6 — Validation & QA
- [ ] Visually compare migrated pages against original
- [ ] Critique and fix block-level styling differences
- [ ] Iterate page/block styling until closely matched
- [ ] Run linting (`npm run lint`) and fix issues
- [ ] Spot-check rendering in preview across templates

### Phase 7 — Wrap-up
- [ ] Summarize migrated templates, blocks, and known gaps
- [ ] Confirm next steps (PR, publishing) with user

## Notes
- Execution requires **Execute mode** — this plan is read-only until then.
- The single most important blocker is the **source URL**, which still needs to be provided before any work can start.
