---
name: bitw-seo-audit
description: Audit and fix SEO, meta-tag, and structured-data completeness for the behavior-in-the-wild.github.io academic website. Checks all best practices established for the site. Use when adding new pages, reviewing PRs, or running a full site health check.
metadata:
  author: Yaman Kumar
  version: 2.0.0
  tags: [seo, structured-data, json-ld, academic, bitw]
compatibility:
  agents: [claude-code]
  requirements:
    - behavior-in-the-wild.github.io repo checked out locally
    - Python 3
---

# BITW SEO Audit

Canonical skill for auditing and fixing SEO and structured-data completeness across the `behavior-in-the-wild.github.io` academic research site.

## Quick Start

```bash
# Audit only — report all issues
python3 scripts/audit.py --repo ~/git/behavior-in-the-wild.github.io

# Audit + auto-fix all fixable JSON-LD issues
python3 scripts/audit.py --repo ~/git/behavior-in-the-wild.github.io --fix
```

## Site Structure

**Repository:** `behavior-in-the-wild/behavior-in-the-wild.github.io` (deploying org repo). PRs go here, not to the `yamanksingla` fork's main.

**Page types and their schema.org `@type`:**

| Page | @type | Notes |
|---|---|---|
| `index.html` | `WebSite` | Homepage. og:type = website. No citation tags. |
| Paper pages (most) | `ScholarlyArticle` | Highwire citation tags required. og:type = article. |
| Benchmark/dataset pages | `Dataset` | `creator` (not `author`) required. isPartOf = DataCatalog. |
| Dual paper+dataset pages | `["ScholarlyArticle","Dataset"]` | Both `author` and `creator` required. isPartOf = DataCatalog (serves Google Dataset Search). |
| `PersuasionArena.html` | `SoftwareApplication` | Tool, not a paper. No citation tags. og:type = website. |
| `the-culture-repository.html` | `Dataset` | Cultural dataset. og:type = website. |
| Redirect pages | — | `cultural-alignment.html`, `transsuasion.html` — skip entirely. |

**Publisher (all pages):** `{"@type": "Organization", "name": "Behavior In The Wild Research Group", "url": "https://behavior-in-the-wild.github.io"}`. This is the entity making the published representation available — do NOT change this to a conference or journal name.

**Canonical URL format:** `https://behavior-in-the-wild.github.io/{PageNameNoExtension}` (case-preserved, no trailing slash). Exception: `index.html` → `https://behavior-in-the-wild.github.io/`.

**OG image fallback:** `https://behavior-in-the-wild.github.io/images/Human-Behavior.png`

**SEO keyword strategy:** Every title and meta description must pair "Behavior in the Wild" with AI/LLM/agentic qualifiers to avoid ambiguous n-gram matches (human behavior, in the wild) that attract unrelated traffic.

## What Is Checked

### Every content page

| # | Check | Rule |
|---|---|---|
| 1 | `<html lang="en">` | Must be present |
| 2 | `<title>` | Present and non-empty |
| 3 | `<meta name="description">` | Present; should contain AI/LLM keywords |
| 4 | `<link rel="canonical">` | Must match expected URL pattern |
| 5 | og:title, og:description, og:url, og:image | All four required |
| 6 | twitter:card, twitter:title, twitter:description | All three required |
| 7 | `og:type` | `article` for papers; `website` for home/tool/dataset-only |
| 8 | JSON-LD present | At least one `<script type="application/ld+json">` block |
| 9 | JSON-LD `license` | `"https://creativecommons.org/licenses/by/4.0/"` on every non-WebSite block |
| 10 | JSON-LD `isPartOf` | See rules below |
| 11 | JSON-LD `author` | Required on ScholarlyArticle |
| 12 | JSON-LD `creator` | Required on Dataset |
| 13 | JSON-LD `publisher` | Must be "Behavior In The Wild Research Group" |
| 14 | JSON-LD `sameAs` | Required when `citation_arxiv_id` Highwire tag is present; value = `https://arxiv.org/abs/{id}` |

### Paper/benchmark pages only (not index, PersuasionArena, the-culture-repository)

| # | Check | Rule |
|---|---|---|
| 15 | `citation_title` | Google Scholar Highwire tag required |
| 16 | `citation_author` | At least one Highwire author tag |
| 17 | `citation_publication_date` | Highwire date tag required |

## JSON-LD `isPartOf` Rules (critical)

| Page type | Highwire venue present? | `isPartOf` value |
|---|---|---|
| `ScholarlyArticle` (pure) | Yes | `{"@type": "Periodical", "name": "<citation_conference_title or citation_journal_title>"}` |
| `ScholarlyArticle` (pure) | No (preprint) | **Absent** — do not invent a venue |
| `Dataset` (pure or dual-type) | — | `{"@type": "DataCatalog", "name": "Behavior In The Wild", "url": "https://behavior-in-the-wild.github.io"}` |
| `SoftwareApplication` | — | **Absent** |

**Why Periodical improves SEO:** linking to the conference as a `Periodical` creates backlinks in Google Scholar and improves domain authority signals. The venue name must come from the actual `citation_conference_title` tag — never invent or shorten it.

**Why DataCatalog for dual-type:** Google Dataset Search indexes `Dataset` pages. DataCatalog in `isPartOf` ensures the benchmark appears in Dataset Search results alongside Google Scholar.

## What Is Auto-Fixed (`--fix` flag)

- Missing `license` → inserts CC BY 4.0
- `isPartOf: Website` on ScholarlyArticle → replaced with `Periodical` (from Highwire venue tag) or removed (preprint)
- `isPartOf: Website` on Dataset → replaced with `DataCatalog`
- Missing `creator` on Dataset/dual-type → copied from `author`
- Missing `sameAs` when `citation_arxiv_id` present → adds `https://arxiv.org/abs/{id}`

**Not auto-fixed** (require per-page content):
- Missing/thin meta description, title, OG/Twitter tags
- Missing Highwire citation tags
- Wrong og:type
- Missing lang="en"

## Workflow for New Pages

1. Create the HTML page following existing page structure (copy a similar page as template).
2. Add Highwire `citation_*` tags (title, author×N, publication_date, conference_title if published, arxiv_id if available).
3. Run `python3 scripts/audit.py --fix` to auto-apply JSON-LD fixes.
4. Review `git diff` — check that `isPartOf` has the correct type and conference name, `sameAs` points to the right arXiv URL.
5. Add the paper to `index.html` contributions list with venue tag and behavior tag.
6. Update `sitemap.xml` lastmod for the new page.
7. Open PR against `behavior-in-the-wild:main`.

## Trigger Phrases

Should trigger:
- "audit the BITW website"
- "check SEO on behavior-in-the-wild"
- "make sure all pages have uniform optimizations"
- "new page added to BITW, check it"
- "run the SEO health check on the site"
- "fix structured data issues on the academic site"
- "does this new page follow all the BITW best practices?"

Should NOT trigger:
- "review this PR for bugs"
- "update the homepage copy"
- "add a new paper page"
- "fix merge conflicts"
