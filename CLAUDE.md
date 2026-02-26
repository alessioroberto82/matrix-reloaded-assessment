# Luscii Matrix — Self-Assessment Tool (v2)

Vanilla HTML/CSS/JS self-assessment tool for Luscii's Matrix Reloaded framework.
No build step. No dependencies (except Chart.js CDN). Open index.html to run.
Source of truth: official Luscii Matrix Reloaded Excel assessment.

## Quick Start

Open `index.html` in any browser. No server needed.
For development: `python3 -m http.server 8000` then visit localhost:8000.

## Architecture

4 static files, no framework:

- `index.html` — 6 screen sections (landing, profile, level, assessment, results, history)
- `style.css` — Responsive, 720px max-width, blue-green palette
- `app.js` — All logic: navigation, scoring, Chart.js radar, narrative, inline comments, localStorage
- `matrix-data.js` — Pure data: 8 profiles, 4 levels, 4 dimensions, 400 behavioral statements + culture score

Screens managed via CSS class toggle (`.screen.active`). No routing.

## Key Patterns

- DOM construction uses `el()` helper and `textContent` — no innerHTML (XSS prevention)
- localStorage keys prefixed `lm2_`: `lm2_profile`, `lm2_level`, `lm2_history`, `lm2_in_progress`
- Statement data keyed as `{profileId}_{levelId}_{dimensionId}` in MATRIX_DATA.statements
- Rating system: Yes / Not yet / ? (string values: "yes", "not_yet", "unknown")
- Score = percentage of "Yes" answers (0-100%)
- Two assessment types: "profile" (4 dimensions) and "culture" (5 dimensions + master)

## Data Model

Assessment object: `{ id, type, profileId, levelId, date, scores, total, ratings, comments }`
- `type`: "profile" or "culture"
- `ratings`: `{ "mastery_0": "yes", "mastery_1": "not_yet", ... }`
- `comments`: `{ "mastery_0": "Example text...", ... }` (inline per-statement)
- `scores`: `{ mastery: 80, autonomy: 60, ..., total: 70 }` (percentages)

Culture Score: 5 dimensions x 3 statements + 5 master statements = 20 statements
Profile: 4 dimensions x 5 statements = 20 statements per profile-level

Profiles: go-getter, skilled-worker, organiser, expert, connector, luminary, navigator, chess-player
Go-getter and Skilled Worker have metadata but NO statements (not in Excel source).
Not all profiles have all 4 levels (Go-getter skips Junior; Luminary, Navigator, Chess Player skip Junior).

## BMAD Artifacts

Design docs in `~/.claude/bmad/projects/luscii-matrix/output/`:
- `scope/requirements.md` — Functional requirements (v2)
- `prioritize/PRD.md` — Product requirements, user stories, release plan
- `ux/ux-design.md` — Wireframes, interaction patterns, visual design
- `arch/architecture.md` — ADRs, component architecture, data model (v2)
- `impl/implementation-notes-*.md` — Implementation notes per session
- `qa/test-report-*.md` — QA verification reports

## Code Style

- ES5-compatible: `var`, `function`, no arrow functions, no template literals
- Loop closures use IIFEs: `(function(x) { ... })(val)`
- All DOM creation via `el(tag, attrs, children)` — never use innerHTML
- Data attributes (`data-*`) for DOM element lookup where needed

## Gotchas

- Chart.js loaded via CDN — app won't render charts offline
- `notion-export/` and `notion-export-new/` contain source Notion pages — reference material, not runtime dependencies
- Go-getter and Skilled Worker profiles show in selector but have no assessment data
- v1 data (lm_ prefix) is not migrated to v2 (lm2_ prefix) — by design
- Comparison only allowed between same-type assessments (profile vs profile, culture vs culture)
