# SITW — Signals in the Wild (static site)

A polished, multi-page, data-driven site for the **Signals in the Wild** benchmark:
AI and humans mine public signals *before* a company reports and predict its
segment-revenue surprise. Vanilla HTML/CSS/JS — no frameworks, no external
CDNs/fonts/images. Works fully offline.

## Pages
- `index.html` — hero, aggregate leaderboard, summary tiles, company strip, Next-Quarter Arena teaser.
- `leaderboard.html` — full sortable leaderboard (click column headers to sort).
- `companies.html` — grid of company cards → `company.html?c=TICKER`.
- `company.html` — per-company episodes, signals, and each model's prediction.
- `model.html` — per-model episode predictions, accuracy, skill, calibration.
- `about.html` — what SITW is, the causal ladder, authors and contact.

## Preview locally
The pages fetch JSON, so open them over HTTP (not `file://`):

```bash
cd site
python3 -m http.server 8000
# then open http://localhost:8000/
```

## Data
`data/*.json` is derived from the repo's `data/pilot_episodes.json` and
`data/pilot_results.json`:
- `leaderboard.json` — ranked rows: gpt-4o-mini in three conditions (Tier-A
  open-web mining, Tier-C feed-assisted, signal-blind), plus the Naive
  (always-beat) and Human (analyst-consensus) baselines.
- `companies.json` — per-company sector, quarters, episodes (consensus / actual /
  label / signals / model predictions / mining detail where available).
- `models.json` — per-model per-episode predictions and aggregate accuracy /
  skill / calibration (Brier), plus mining queries + cited URLs.
- `summary.json` — headline counts.

Tier-A open-web mining (`mining_results.json`) is included when present: three
episodes (DAL / IBM / CMG Q2) with the model's own Google SERP queries
(BrightData, `cd_max <= cutoff_T`) and cited sources, surfaced on the model and
company pages under "What the model searched". To regenerate the JSON after the
source data changes, re-run the generator (reads `../data/pilot_episodes.json`,
`../data/pilot_results.json`, and `../data/mining_results.json` if present).

Notes on metrics:
- **Accuracy** = surprise-direction hit rate (beat / inline / miss vs. consensus).
- **Skill** = accuracy minus the analyst-consensus baseline, in percentage points.
- **Brier** = mean squared error of stated confidence (binary correct/incorrect);
  baselines report no confidence.
- Numbers come only from the source JSON — no model figures are fabricated.

## Deploy to GitHub Pages
1. Commit the `site/` folder to the repo.
2. In the repo's **Settings → Pages**, set the source to the branch and folder:
   either the repo root, or move `site/` contents to `/docs` and select `/docs`.
   Simplest: push `site/` as the site root of a `gh-pages` branch, or use a
   GitHub Action that publishes the `site/` directory.
3. GitHub Pages serves over HTTPS, so the `fetch()` calls work the same as the
   local HTTP server. No build step is required.

## Security notes
- All dynamic text is inserted via `textContent` / DOM APIs — never `innerHTML`
  with data — so JSON content cannot inject markup.
- Each page ships a strict `Content-Security-Policy` meta tag
  (`script-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'`).
- Query params (`?c=`, `?m=`) are allowlist-sanitized and used only as lookup keys.
- No secrets, no external network calls.
