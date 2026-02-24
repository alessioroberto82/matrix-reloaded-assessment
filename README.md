# Matrix Reloaded Assessment

A self-assessment tool for role-based growth frameworks. Rate yourself on behavioral statements across four learning dimensions, visualize your scores, track progress over time, and collect evidence examples for your assessment conversations.

Built as a vanilla HTML/CSS/JS app. No build step, no dependencies (except Chart.js via CDN). Open `index.html` to run.

## Features

- **Profile & level selection** — Choose your role profile and growth level
- **Self-assessment** — Rate behavioral statements (1-5) across 4 dimensions: Mastery, Autonomy, Impact, Ownership
- **Radar chart visualization** — See your scores at a glance with a baseline comparison
- **Narrative summary** — Auto-generated text highlighting strengths, growth areas, and level readiness
- **Growth suggestions** — Actionable suggestions calibrated to your scores
- **Assessment history** — Save and compare assessments over time
- **Evidence Journal** — Collect concrete work examples for each behavioral statement, accessible anytime (not just during assessment)

## Setup

1. Clone this repository
2. Copy `matrix-data.example.js` to `matrix-data.js`
3. Populate `matrix-data.js` with your organisation's profiles, behavioral statements, and growth suggestions (see the example file for the expected structure)
4. Open `index.html` in any browser

No server required. For development with live reload: `python3 -m http.server 8000`

## Data structure

The app expects a `matrix-data.js` file (not included — see `matrix-data.example.js`) containing:

| Section | Key format | Description |
|---------|-----------|-------------|
| `profiles` | `{profileId}` | Role profiles with metadata |
| `levels` | `junior`, `medior`, `core`, `master` | Growth level definitions |
| `dimensions` | `mastery`, `autonomy`, `impact`, `ownership` | Learning dimensions |
| `statements` | `{profileId}_{levelId}_{dimensionId}` | Arrays of 4 behavioral "I" statements |
| `growthSuggestions` | `{profileId}_{dimensionId}_{low\|medium\|high}` | Arrays of 2 suggestions per score range |
| `scoreLabels` | `strong`, `solid`, `developing`, `emerging` | Score interpretation thresholds |
| `levelExpectations` | `{levelId}` | Narrative text per level |
| `progressionTimeline` | `{profileId}` | Typical years per level |

All data stays in the browser (localStorage). Nothing is sent to any server.

## For Luscii colleagues

This tool implements the [Matrix Reloaded](https://www.notion.so/luscii/) framework. Ask your team lead for the `matrix-data.js` file with Luscii's behavioral statements and growth suggestions.

## Credits

- Framework: Matrix Reloaded by [Luscii](https://luscii.com), adapted from the [Baarda model](https://baarda.nl)
- Built with [Chart.js](https://www.chartjs.org/) for radar chart visualization
