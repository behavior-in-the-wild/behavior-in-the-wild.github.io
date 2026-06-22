---
name: bitw-seo-audit
description: Audit and fix SEO, meta-tag, and structured-data completeness for the behavior-in-the-wild.github.io academic website. Also the canonical reference for everything needed when adding a new page. Use when adding new pages, reviewing PRs, or running a full site health check.
metadata:
  author: Yaman Kumar
  version: 4.0.0
  tags: [seo, structured-data, json-ld, academic, bitw]
compatibility:
  agents: [claude-code]
  requirements:
    - behavior-in-the-wild.github.io repo checked out locally
    - Python 3
---

# BITW SEO Audit & New Page Guide

Canonical reference for the `behavior-in-the-wild.github.io` academic research site — both the automated audit tool and the human checklist for adding new pages.

## Quick Start (audit)

```bash
# Audit only — report all issues
python3 scripts/audit.py --repo ~/git/behavior-in-the-wild.github.io

# Audit + auto-fix all fixable JSON-LD issues
python3 scripts/audit.py --repo ~/git/behavior-in-the-wild.github.io --fix
```

---

## Site Structure

**Repo:** `behavior-in-the-wild/behavior-in-the-wild.github.io` (deploying org repo). PRs go here from the `yamanksingla` fork — never directly to org main.

**File naming:** preserve the original paper abbreviation casing (e.g. `LCBM.html`, `SDR-Bench.html`, `memorability.html`). No spaces; use hyphens for multi-word slugs.

**Page types and their schema.org `@type`:**

| Page | `@type` | og:type | Citation tags? |
|---|---|---|---|
| `index.html` | `WebSite` | website | No |
| Paper pages (most) | `ScholarlyArticle` | article | Yes |
| Benchmark/dataset pages | `Dataset` | article | Yes |
| Dual paper+dataset | `["ScholarlyArticle","Dataset"]` | article | Yes |
| `PersuasionArena.html` | `SoftwareApplication` | website | No |
| `the-culture-repository.html` | `Dataset` | website | No |
| Redirect pages (`cultural-alignment.html`, `transsuasion.html`) | — | — | Skip entirely |

**Publisher — per venue rule:**

| Paper type | `publisher` value |
|---|---|
| Published at a known conference (ICLR, AAAI, WACV, CVPR, NeurIPS, EMNLP, EACL, ECCV) | Use the actual academic publisher for that venue (see CONF_MAP in `audit.py`) |
| Preprint with arXiv ID | `{"@type": "Organization", "name": "arXiv", "url": "https://arxiv.org"}` |
| Preprint/tool with no venue and no arXiv | `{"@type": "Organization", "name": "Behavior In The Wild Research Group", "url": "https://behavior-in-the-wild.github.io"}` |

Conference→publisher mapping:
- ICLR → "International Conference on Learning Representations" (https://iclr.cc)
- AAAI → "AAAI Press" (https://aaai.org)
- WACV / CVPR → "IEEE" (https://ieeexplore.ieee.org)
- NeurIPS → "Neural Information Processing Systems Foundation" (https://nips.cc)
- EMNLP / EACL → "Association for Computational Linguistics" (https://aclanthology.org)
- ECCV → "Springer Nature" (https://www.springer.com)

Add new venues to `CONF_MAP` in both `scripts/audit.py` and `scripts/fix_schema.py` (or `/tmp/fix_schema_full.py`).

**Canonical URL format:** `https://behavior-in-the-wild.github.io/{PageNameNoExtension}` (case-preserved, no trailing slash). Exception: `index.html` → `https://behavior-in-the-wild.github.io/`.

**Contact email:** `behavior-in-the-wild@googlegroups.com` — include on every paper page.

---

## Adding a New Page — Complete Checklist

### 1. File setup
- Copy the most structurally similar existing page as a template.
- Place at repo root: `{Slug}.html`
- Place paper-specific images in `images/{slug}/` (lowercase slug for the directory).
- Use `images/Human-Behavior.png` as og/twitter image fallback if no paper teaser exists.

### 2. `<head>` — required elements in order

```html
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="...AI/LLM/behavior keywords...">
  <meta name="keywords" content="...">

  <title>Full Paper Title — Behavior in the Wild</title>
  <link rel="canonical" href="https://behavior-in-the-wild.github.io/{Slug}">
  <link rel="icon" href="https://cdn-icons-png.flaticon.com/512/954/954591.png">

  <!-- Open Graph -->
  <meta property="og:type" content="article">   <!-- or "website" for non-paper pages -->
  <meta property="og:title" content="...">
  <meta property="og:description" content="...">
  <meta property="og:url" content="https://behavior-in-the-wild.github.io/{Slug}">
  <meta property="og:image" content="https://behavior-in-the-wild.github.io/images/{slug}/teaser.png">
  <!-- ↑ use paper teaser if available; fallback: images/Human-Behavior.png -->

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="...">
  <meta name="twitter:description" content="...">
  <meta name="twitter:image" content="...same as og:image...">

  <!-- JSON-LD (see section below) -->
  <script type="application/ld+json">...</script>

  <!-- Google Scholar / Highwire citation tags (paper pages only) -->
  <meta name="citation_title" content="Full Paper Title">
  <meta name="citation_author" content="Last, First">   <!-- one tag per author -->
  <meta name="citation_publication_date" content="YYYY">
  <meta name="citation_conference_title" content="Full Conference Name">  <!-- if published -->
  <meta name="citation_arxiv_id" content="XXXX.XXXXX">    <!-- if on arXiv -->
  <meta name="citation_pdf_url" content="https://arxiv.org/pdf/XXXX.XXXXX">
</head>
```

**SEO rule:** every `<title>` and `<meta name="description">` must contain AI/LLM/agentic qualifiers alongside "Behavior in the Wild" to prevent ambiguous n-gram matches (human behavior, in the wild) from attracting unrelated traffic.

### 3. Page body — section order

```
<nav class="site-nav">
  <a href="./index.html">← Behavior in the Wild</a>
</nav>

<div class="page">
  <h1>Full Paper Title</h1>

  <div class="authors">
    <a href="https://author-homepage.com/">Author Name<sup>*</sup></a>, ...
  </div>
  <div class="equal-contrib">* Equal Contribution</div>   <!-- omit if not applicable -->

  <div class="affiliation">
    <img src="images/adobe-logo.png" alt="Adobe">
    <a href="https://adobe.mdsr.live/" target="_blank">Media and Data Science Research (MDSR) Lab, Adobe</a>
  </div>

  <p class="venue">ICLR 2025</p>   <!-- abbreviated venue + year, shown in red -->

  <p>Get in touch at <a href="mailto:behavior-in-the-wild@googlegroups.com">behavior-in-the-wild@googlegroups.com</a></p>

  <div class="paper-links">
    <a href="https://arxiv.org/abs/...">Paper</a>
    <a href="https://github.com/behavior-in-the-wild/...">Code</a>
    <a href="https://huggingface.co/datasets/behavior-in-the-wild/...">Dataset</a>  <!-- if applicable -->
    <a href="https://...demo...">Demo</a>  <!-- if applicable -->
  </div>

  <!-- ... content sections (Abstract, Method, Results, etc.) ... -->

  <h2 id="BibTeX">BibTeX</h2>
  <pre>@inproceedings{...}</pre>

  <hr>
  <footer>...</footer>
</div>
```

**Author links:** all authors must have clickable `<a href>` links to their personal/academic pages. Use Google Scholar or personal homepage — not LinkedIn where avoidable (LinkedIn URLs change; personal sites are stable).

**Affiliation logos:** the `<div class="affiliation">` block may include logo `<img>` tags but they are optional and can be omitted for cleaner pages. The text link to the lab is required.

**BibTeX:** required on every paper page — Google Scholar scrapes it. Use `<h2 id="BibTeX">` exactly so anchor links work.

### 4. JSON-LD block

Minimum complete example for a published `ScholarlyArticle`:

```json
{
  "@context": "https://schema.org",
  "@type": "ScholarlyArticle",
  "headline": "Full Paper Title",
  "name": "Full Paper Title",
  "url": "https://behavior-in-the-wild.github.io/{Slug}",
  "image": "https://behavior-in-the-wild.github.io/images/{slug}/teaser.png",
  "description": "One-sentence abstract with AI/LLM keywords.",
  "datePublished": "2025",
  "author": [
    { "@type": "Person", "name": "Author Name", "url": "https://author-homepage.com/" }
  ],
  "keywords": ["keyword1", "keyword2"],
  "isPartOf": {
    "@type": "CreativeWork",
    "name": "Proceedings of the International Conference on Learning Representations (ICLR) 2025"
  },
  "publication": {
    "@type": "PublicationEvent",
    "name": "International Conference on Learning Representations (ICLR) 2025",
    "startDate": "2025"
  },
  "sameAs": "https://arxiv.org/abs/XXXX.XXXXX",
  "license": "https://creativecommons.org/licenses/by/4.0/",
  "publisher": {
    "@type": "Organization",
    "name": "International Conference on Learning Representations",
    "url": "https://iclr.cc"
  }
}
```

**Field rules:**
- `headline` = same value as `name` (required by Google for Article types)
- `image` = paper teaser URL; use og:image fallback if no teaser
- `author[].url` = personal/academic homepage per author (improves entity disambiguation in Scholar)
- `isPartOf` for published paper: `{"@type": "CreativeWork", "name": "Proceedings of {Full Conference Name} {Year}"}` — `CreativeWork` is correct for proceedings (one-time publication), not `Periodical` (which implies a recurring journal)
- `isPartOf` for preprint: **absent** — never invent a venue
- `isPartOf` for Dataset: `{"@type": "DataCatalog", "name": "Behavior In The Wild", "url": "https://behavior-in-the-wild.github.io"}`
- `publication`: `PublicationEvent` captures the actual conference event for semantic search; use the same full name as `isPartOf`
- `sameAs`: arXiv canonical URL — required when arXiv ID is known; signals authoritative source to Google
- `license`: always CC BY 4.0
- `publisher`: per-venue (see Publisher rule above) — actual academic publisher for conference papers, arXiv for preprints with arXiv ID, BITW Research Group for everything else

For **Dataset** pages, replace `author` with `creator`. For **dual-type** `["ScholarlyArticle","Dataset"]`, include both `author` and `creator` (same people), and use `DataCatalog` for `isPartOf` (Google Dataset Search requires it).

### 5. Add to `index.html` contributions list

Entry format (newest papers go at the top):
```html
<li>
  <a href="./{Slug}.html">Full Paper Title</a>
  <span class="venue-year">— {VenueAbbr} {Year}</span>
  <span class="award">· {Award Name} 🏆</span>   <!-- omit if no award -->
  <span class="tag tag-{type}">{Tag Label}</span>
  <!-- add multiple tags if the paper fits more than one -->
</li>
```

**Available behavior tags:**

| CSS class | Label | Color | Use when... |
|---|---|---|---|
| `tag-explain` | Explaining Behavior | blue (#5a7099) | Paper analyzes/models why humans behave a certain way |
| `tag-predict` | Predicting Behavior | green (#5f8a62) | Paper predicts human responses, memorability, preferences |
| `tag-optimize` | Interventions to Optimize Behavior | brown (#a8765f) | Paper generates/optimizes content to influence behavior |
| `tag-understand` | Using Behavior To Understand Other Modalities Better | purple (#8a6fb0) | Behavior signal improves a non-behavior task (VLM, NLP, etc.) |
| `tag-learn` | Learning from Human Digital Traces | olive (#7a6a3f) | Learning from implicit behavior signals (clicks, gaze, engagement) |

**Venue abbreviation format:** use the widely recognized short form — ICLR, AAAI, NeurIPS, WACV, EMNLP, EACL, ECCV, CVPR, etc. Preprints → "Preprint". PhD thesis → "PhD Thesis".

### 6. `sitemap.xml`
The automated sitemap bot (`create-pull-request/sitemap` branch) usually updates this on merge. If adding manually, add an entry:
```xml
<url>
  <loc>https://behavior-in-the-wild.github.io/{Slug}</loc>
  <lastmod>{YYYY-MM-DD}</lastmod>
</url>
```
Update `<lastmod>` to today's date for any page you touch.

### 7. PR
- Branch off `upstream/main`; PR target is `behavior-in-the-wild:main` (the org repo) from the `yamanksingla` fork
- Run the audit script before opening: `python3 .claude/skills/bitw-seo-audit/scripts/audit.py --fix`
- Review `git diff` — verify `isPartOf` name matches the exact conference from the Highwire tag, `sameAs` URL is correct

---

## Automated Audit — What Is Checked

### Every content page

| # | Check | Rule |
|---|---|---|
| 1 | `<html lang="en">` | Must be present |
| 2 | `<title>` | Present and non-empty |
| 3 | `<meta name="description">` | Present; should contain AI/LLM keywords |
| 4 | `<link rel="canonical">` | Must match `https://behavior-in-the-wild.github.io/{Slug}` |
| 5 | og:title, og:description, og:url, og:image | All four required |
| 6 | twitter:card, twitter:title, twitter:description | All three required |
| 7 | `og:type` | `article` for papers; `website` for home/tool/dataset-only pages |
| 8 | JSON-LD present | At least one `<script type="application/ld+json">` block |
| 9 | JSON-LD `license` | CC BY 4.0 on every non-WebSite block |
| 10 | JSON-LD `headline` | Required on ScholarlyArticle (same value as `name`) |
| 11 | JSON-LD `image` | Required on ScholarlyArticle |
| 12 | JSON-LD `isPartOf` | `CreativeWork` for published paper, `DataCatalog` for Dataset, absent for preprints |
| 13 | JSON-LD `publication` | `PublicationEvent` required on published ScholarlyArticle |
| 14 | JSON-LD `author` | Required on ScholarlyArticle |
| 15 | JSON-LD `creator` | Required on Dataset |
| 16 | JSON-LD `publisher` | Per-venue: conference publisher, arXiv for arXiv preprints, BITW for others |
| 17 | JSON-LD `sameAs` | Required when `citation_arxiv_id` Highwire tag is present |

### Paper/benchmark pages only

| # | Check | Rule |
|---|---|---|
| 15 | `citation_title` | Highwire tag required |
| 16 | `citation_author` | At least one Highwire author tag |
| 17 | `citation_publication_date` | Highwire date tag required |

## What Is Auto-Fixed (`--fix` / `fix_schema_full.py`)

- Missing `license` → inserts CC BY 4.0
- `isPartOf: Periodical/Website` on ScholarlyArticle → replaced with `CreativeWork` (from Highwire venue tag) or removed (preprint)
- `isPartOf` on Dataset → replaced with `DataCatalog`
- Missing `headline` on ScholarlyArticle → set to `name` value
- Missing `image` → set from `og:image` meta tag
- Missing `author[].url` → matched from `<div class="authors">` link tags in page body
- Missing `publication: PublicationEvent` on published ScholarlyArticle → added
- Wrong `publisher` → replaced with per-venue publisher (CONF_MAP lookup)
- Missing `sameAs` when `citation_arxiv_id` present → adds arXiv URL
- Missing `creator` on Dataset/dual-type → copied from `author`

**Not auto-fixed** (require per-page content knowledge):
- Missing/thin meta description, title, OG/Twitter tags, twitter:image
- Missing Highwire citation tags or `citation_pdf_url`
- Author URL mismatches (name in JSON-LD differs from HTML body link text)
- Wrong `og:type`, missing `lang="en"`, missing BibTeX section

---

## Trigger Phrases

Should trigger:
- "audit the BITW website"
- "check SEO on behavior-in-the-wild"
- "make sure all pages have uniform optimizations"
- "new page added to BITW, check it"
- "what do I need to do to add a new page to BITW?"
- "run the SEO health check on the site"
- "fix structured data issues on the academic site"
- "does this new page follow all the BITW best practices?"

Should NOT trigger:
- "review this PR for bugs"
- "update the homepage copy"
- "fix merge conflicts"
