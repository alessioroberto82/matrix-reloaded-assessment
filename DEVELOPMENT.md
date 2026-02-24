# How this tool was built

This document describes how the Matrix Reloaded Assessment tool was designed and built in a single weekend using [Claude Code](https://claude.ai/claude-code) and the [BMAD-METHOD](https://github.com/bmad-method) framework. The entire process — from requirements to a deployed public repo — took two sessions across two days.

## What is BMAD?

BMAD (Business-Manager-Architect-Developer) is an AI-powered development workflow that structures software projects into distinct roles: Scope Clarifier, Prioritizer, Experience Designer, Architecture Owner, Implementer, and Quality Guardian. Each role produces a specific artifact that feeds into the next phase.

Claude Code executes each role as a skill, maintaining context and producing real output documents.

## The workflow

### Session 1: From idea to working app (23 Feb 2026)

**Duration**: ~5 hours (including all BMAD phases + implementation)

#### Phase 1: Scope Clarifier

Started with: *"I need a self-assessment tool for Luscii's Matrix Reloaded framework."*

The Scope Clarifier asked structured questions about the framework (8 profiles, 4 levels, 4 dimensions), identified the single-user constraint, and produced a requirements document with 6 functional requirements and acceptance criteria.

Key output: the realization that not all profiles have all 4 levels (Go-getter, Luminary, Navigator, Chess Player skip Junior), which needed special handling.

#### Phase 2: Prioritizer

Took the requirements and produced a PRD with:
- 4 user story epics mapped to functional requirements
- A MoSCoW prioritization matrix
- A release plan: v1 (MVP), v1.1 (enhancements), v2 (future)

Key decision: "complete an assessment in under 10 minutes" as the primary success metric.

#### Phase 3: Experience Designer

Designed wireframes for 6 screens with a linear wizard flow. Defined the visual direction: blue-green palette (#1a5c5c primary), 720px max-width, warm but professional aesthetic.

Key decisions:
- No navigation menu — linear flow with back arrows
- Auto-save every rating (no explicit save button during assessment)
- Profile cards ordered left-to-right by problem-solving complexity

#### Phase 4: Architecture Owner

Produced 4 Architecture Decision Records:

| ADR | Decision | Rationale |
|-----|----------|-----------|
| ADR-001 | Vanilla HTML/CSS/JS | No build step, no dependencies, maximum simplicity |
| ADR-002 | Chart.js via CDN | Radar chart capability without bundling |
| ADR-003 | localStorage | Privacy-first, no server, instant persistence |
| ADR-004 | CSS class toggle | `.screen.active` for navigation, no routing library |

The architecture specified a 4-file structure: `index.html`, `style.css`, `app.js`, `matrix-data.js`.

#### Phase 5: Implementer

Claude Code wrote all 4 files following the architecture exactly:
- 112 statement sets (448 behavioral statements) across all profile/level/dimension combinations
- Safe DOM construction via an `el()` helper — no innerHTML anywhere (XSS prevention)
- Rule-based narrative generation considering strongest/weakest dimensions and natural development order
- Full assessment history with radar chart comparison

#### Phase 6: Quality Guardian

Verified all 24 acceptance criteria. Found and fixed 4 issues during QA:
- **P1**: Missing baseline indicator on radar chart → added 3.5 "Expected" dashed line
- **P1**: No focus management on screen change → added focus to first heading
- **P2**: Missing `addedValue` field display in profile detail
- **P2**: Empty growth suggestions when all scores > 4.5

Final verdict: **PASS** (21 pass, 2 partial, 1 deferred to v1.1).

### Session 2: New feature + publish (24 Feb 2026)

#### Evidence Journal feature

Started from a user need: *"The person who follows my assessment strongly suggested bringing concrete examples for each behavioral statement. How can I organize this?"*

After discussing three options (use existing notes field, add per-statement examples in-app, external Notion document), chose option 2: an Evidence Journal screen integrated into the web app.

**Design**: New screen accessible from landing page. Select profile/level, browse statements grouped by dimension accordion, add/edit/delete examples per statement. During assessment, collected examples appear under each statement with an expand/collapse toggle.

**QA found 3 issues**, all fixed:
- P1: Dead parameter in `renderJournalAddForm` → removed
- P2: Fragile DOM queries in edit flow → replaced with `data-*` attribute selectors
- P3: No visual feedback on save → added CSS flash animation

#### CLAUDE.md maintenance

Ran a CLAUDE.md quality audit (scored B initially → B+ after updates). Added:
- Code style section documenting ES5 conventions and `el()` pattern
- Evidence Journal documentation
- Notion export directories noted as reference material

#### Publishing to GitHub

Scoped a separate requirements document for publishing. Key decisions:
- `matrix-data.js` excluded via `.gitignore` (proprietary Luscii content)
- `matrix-data.example.js` created as a template with the full data structure and placeholder content
- README with setup instructions, data structure docs, and credits
- Public repo at [alessioroberto82/matrix-reloaded-assessment](https://github.com/alessioroberto82/matrix-reloaded-assessment)

## BMAD artifacts produced

All design documents are stored outside the project directory (zero repo footprint):

```
~/.claude/bmad/projects/luscii-matrix/output/
  scope/
    requirements.md          — Functional requirements (6 FRs with acceptance criteria)
    requirements-publish.md  — GitHub publishing requirements
  prioritize/
    PRD.md                   — Product requirements, user stories, release plan
  ux/
    ux-design.md             — Wireframes, interaction patterns, visual design
  arch/
    architecture.md          — ADRs, component architecture, data model
  impl/
    implementation-notes-2026-02-23.md
  qa/
    test-report-2026-02-23.md — Initial QA (24 criteria, 4 fixes)
    test-report-2026-02-24.md — Evidence Journal QA (23 tests, 3 fixes)
```

## What worked well

- **Structured phases prevent rabbit holes.** The Scope Clarifier forces you to define what you're building before touching code. The Architecture Owner makes technology decisions explicit.
- **QA as a separate role catches real bugs.** Both sessions found P1 issues that would have shipped otherwise (missing radar baseline, dead parameters, fragile DOM queries).
- **Zero-footprint design docs.** BMAD stores all artifacts in `~/.claude/bmad/`, keeping the repo clean. Only code goes in git.
- **Evidence Journal came from a real conversation.** The feature wasn't planned — it emerged from discussing the assessment process, was designed in 5 minutes, implemented in one pass, and QA'd immediately.

## Tools used

- [Claude Code](https://claude.ai/claude-code) (Claude Opus 4.6) — all coding, design, and QA
- [BMAD-METHOD](https://github.com/bmad-method) — workflow orchestration plugin for Claude Code
- [Chart.js](https://www.chartjs.org/) — radar chart visualization
- [GitHub CLI](https://cli.github.com/) — repo creation and push
