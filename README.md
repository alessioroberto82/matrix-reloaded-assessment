# Matrix Reloaded Assessment

A self-assessment tool for Luscii's Matrix Reloaded role-based growth framework. Rate yourself on behavioral statements using Yes / Not yet / ?, visualize your scores, track progress over time, and collect evidence notes inline with each statement.

Built as a vanilla HTML/CSS/JS app. No build step, no dependencies (except Chart.js via CDN). Open `index.html` to run.

## Features

- **Profile & level selection** — Choose your role profile and growth level
- **Profile assessment** — Rate behavioral statements (Yes / Not yet / ?) across 4 dimensions: Mastery, Autonomy, Impact, Ownership
- **Culture Score assessment** — Separate assessment for 5 culture dimensions + master statements
- **Inline comments** — Add notes and evidence per statement (replaces the old Evidence Journal)
- **Radar chart visualization** — See your scores at a glance with a 100% baseline comparison
- **Narrative summary** — Auto-generated text highlighting strengths, growth areas, and comments
- **Growth suggestions** — Actionable suggestions calibrated to your scores
- **Assessment history** — Save, review (with comments), and compare assessments over time

## Setup

1. Clone this repository
2. Open `index.html` in any browser

No server required. For development with live reload: `python3 -m http.server 8000`

All data stays in the browser (localStorage). Nothing is sent to any server.

## Data structure

The app uses `matrix-data.js` containing:

| Section | Description |
|---------|-------------|
| `profiles` | 8 role profiles with metadata (expert, connector, navigator, etc.) |
| `levels` | 4 growth levels: junior, medior, core, master |
| `dimensions` | 4 learning dimensions: mastery, autonomy, impact, ownership |
| `statements` | Behavioral statements keyed as `{profileId}_{levelId}_{dimensionId}` |
| `cultureScore` | 5 culture dimensions × 3 statements + 5 master statements |
| `growthSuggestions` | Suggestions per dimension and score range |
| `scoreLabels` | Score interpretation thresholds (strong, developing, emerging) |
| `levelExpectations` | Narrative text per level |

Source of truth: the official Luscii Matrix Reloaded Excel assessment.

## For Luscii colleagues

This tool implements the [Matrix Reloaded](https://www.notion.so/luscii/) framework. The behavioral statements match the official Excel assessment exactly.

## How it was built

This tool was designed and built in a single weekend using [Claude Code](https://claude.ai/claude-code) and the [BMAD-METHOD](https://github.com/bmad-method) framework. See [DEVELOPMENT.md](DEVELOPMENT.md) for the full case study.

## Credits

- Framework: Matrix Reloaded by [Luscii](https://luscii.com), adapted from the [Baarda model](https://baarda.nl)
- Built with [Chart.js](https://www.chartjs.org/) for radar chart visualization
