---
name: bitw-seo-audit
description: Audit and fix SEO, meta-tag, and structured-data completeness for the behavior-in-the-wild.github.io academic website. Checks all best practices established for the site. Use when adding new pages, reviewing PRs, or running a full site health check.
metadata:
  author: Yaman Kumar
  version: 1.0.0
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
python3 scripts/audit.py --repo /path/to/behavior-in-the-wild.github.io

# Audit + auto-fix all fixable JSON-LD issues
python3 scripts/audit.py --repo /path/to/behavior-in-the-wild.github.io --fix
```

Default repo path (if omitted): `~/git/behavior-in-the-wild.github.io`

## What Is Checked

### Every content page (skip: cultural-alignment.html, transsuasion.html, google*.html)

| # | Check | Rule |
|---|---|---|
| 1 | `<html lang="en">` | Must be present on every page |
| 2 | `<title>` | Must be present and non-empty |
| 3 | `<meta name="description">` | Must be present; should contain AI/LLM/behavior keywords (not auto-fixed) |
| 4 | `<link rel="canonical">` | Must point to `https://behavior-in-the-wild.github.io/{slug}` (no .html, no trailing slash) |
| 5 | OG tags | og:title, og:description, og:url, og:image all required |
| 6 | Twitter card tags | twitter:card, twitter:title, twitter:description all required |
| 7 | `og:type` | `article` for paper/dataset pages; `website` for home, PersuasionArena, the-culture-repository |
| 8 | JSON-LD present | At least one `<script type="application/ld+json">` block |
| 9 | JSON-LD `license` | `"license": "https://creativecommons.org/licenses/by/4.0/"` on every non-WebSite block |
| 10 | JSON-LD `isPartOf` | Must be **absent** for ScholarlyArticle and SoftwareApplication; must be `{"@type":"DataCatalog",...}` for Dataset |
| 11 | JSON-LD `author` | Required on ScholarlyArticle blocks |
| 12 | JSON-LD `creator` | Required on Dataset blocks |

### Paper/benchmark pages only (not index.html, PersuasionArena, the-culture-repository)

| # | Check | Rule |
|---|---|---|
| 13 | `citation_title` | Google Scholar Highwire tag required |
| 14 | `citation_author` | At least one Highwire author tag required |
| 15 | `citation_publication_date` | Highwire date tag required |

## What Is Auto-Fixed (--fix flag)

The following issues are fixed automatically without needing human input:

- **Missing `license`** in JSON-LD → inserts `"https://creativecommons.org/licenses/by/4.0/"` before `publisher`
- **`isPartOf: {Website}`** on ScholarlyArticle/SoftwareApplication → removed
- **`isPartOf: {Website}`** on Dataset → changed to `{"@type": "DataCatalog", ...}`
- **Missing `creator`** on Dataset/mixed blocks that already have `author` → copied from `author`

The following issues are **reported but NOT auto-fixed** (require per-page knowledge):

- Missing or thin `<title>` / `<meta description>` / OG tags / Twitter tags
- Missing Highwire citation tags
- Wrong `og:type` value
- Missing `lang="en"`
- Missing canonical link

## Best-Practice Rules (non-negotiable)

1. **License** — all paper/dataset/tool pages use CC BY 4.0.
2. **`isPartOf` on ScholarlyArticle** — these are conference papers, not journal articles. There is no valid `Periodical` parent. Remove it entirely.
3. **`isPartOf` on Dataset** — must point to `{"@type": "DataCatalog", "name": "Behavior In The Wild", "url": "https://behavior-in-the-wild.github.io"}`.
4. **Dual-type `["ScholarlyArticle", "Dataset"]`** — must carry both `author` (for Scholar) and `creator` (for Dataset).
5. **PersuasionArena** — SoftwareApplication, not a paper. No Highwire tags. og:type = website.
6. **the-culture-repository** — Dataset only (no ScholarlyArticle). og:type = website.
7. **Redirect pages** — cultural-alignment.html, transsuasion.html — skip entirely.
8. **Canonical format** — `https://behavior-in-the-wild.github.io/{PageNameNoExtension}` (case-preserved, no trailing slash).
9. **SEO keyword framing** — titles and descriptions must pair "Behavior in the Wild" with AI/LLM qualifiers to avoid ambiguous n-gram matches for unrelated queries.
10. **sitemap.xml** — update `<lastmod>` for any page touched. The automated sitemap bot usually handles this on merge.

## Workflow

1. Run `audit.py` to get the issue report.
2. If `--fix` was used, review `git diff` to confirm changes before committing.
3. For issues that need human content (meta descriptions, titles), draft per-page fixes following rule 9 above.
4. Commit fixes and open/update the PR against `behavior-in-the-wild:main` from the `yamanksingla` fork.
5. After merging, re-run audit on the deployed site to confirm zero issues.

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
