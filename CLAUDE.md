# Luscii Matrix — Self-Assessment Tool

Vanilla HTML/CSS/JS self-assessment tool for Luscii's Matrix Reloaded framework.
No build step. No dependencies (except Chart.js CDN). Open index.html to run.

## Quick Start

Open `index.html` in any browser. No server needed.
For development: `python3 -m http.server 8000` then visit localhost:8000.

## Architecture

4 static files, no framework:

- `index.html` — 7 screen sections (landing, profile, level, assessment, results, history, journal)
- `style.css` — Responsive, 720px max-width, blue-green palette
- `app.js` — All logic: navigation, scoring, Chart.js radar, narrative, evidence journal, localStorage
- `matrix-data.js` — Pure data: 8 profiles, 4 levels, 4 dimensions, 448 behavioral statements

Screens managed via CSS class toggle (`.screen.active`). No routing.

## Key Patterns

- DOM construction uses `el()` helper and `textContent` — no innerHTML (XSS prevention)
- localStorage keys prefixed `lm_`: `lm_profile`, `lm_level`, `lm_history`, `lm_in_progress`, `lm_evidence`
- Statement data keyed as `{profileId}_{levelId}_{dimensionId}` in MATRIX_DATA.statements
- Growth suggestions keyed as `{profileId}_{dimensionId}_{low|medium|high}`
- Score = average of 1-5 ratings, rounded to 1 decimal

## Data Model

Assessment object: `{ id, profileId, levelId, date, scores, ratings, notes }`
Evidence object in `lm_evidence`: `{ "{profileId}_{levelId}_{dimId}_{stmtIndex}": [{ id, date, text }] }`
Profiles: go-getter, skilled-worker, organiser, expert, connector, luminary, navigator, chess-player
Not all profiles have all 4 levels (Go-getter, Luminary, Navigator, Chess Player skip Junior).

## BMAD Artifacts

Design docs in `~/.claude/bmad/projects/luscii-matrix/output/`:
- `scope/requirements.md` — Functional requirements
- `prioritize/PRD.md` — Product requirements, user stories, release plan
- `ux/ux-design.md` — Wireframes, interaction patterns, visual design
- `arch/architecture.md` — ADRs, component architecture, data model
- `qa/test-report-*.md` — QA verification reports (latest: 2026-02-24)

## Code Style

- ES5-compatible: `var`, `function`, no arrow functions, no template literals
- Loop closures use IIFEs: `(function(x) { ... })(val)`
- All DOM creation via `el(tag, attrs, children)` — never use innerHTML
- Data attributes (`data-*`) for DOM element lookup where needed

## Gotchas

- Chart.js loaded via CDN — app won't render charts offline
- `narrativeTemplates` in matrix-data.js is currently unused (narrative built inline in app.js)
- Dimension descriptions are generic across profiles; behavioral statements are profile-calibrated
- `notion-export/` and `notion-export-new/` contain source Notion pages — reference material, not runtime dependencies
