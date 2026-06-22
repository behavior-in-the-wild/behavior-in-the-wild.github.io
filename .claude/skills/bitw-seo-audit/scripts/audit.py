#!/usr/bin/env python3
"""
BITW SEO & Structured-Data Audit + Auto-Fix
Usage:
  python3 audit.py [--repo PATH] [--fix]
"""

import argparse
import glob
import json
import os
import re
import sys

BASE_URL = "https://behavior-in-the-wild.github.io"
LICENSE_URL = "https://creativecommons.org/licenses/by/4.0/"
PUBLISHER = {
    "@type": "Organization",
    "name": "Behavior In The Wild Research Group",
    "url": BASE_URL,
}
DATACATALOG = {
    "@type": "DataCatalog",
    "name": "Behavior In The Wild",
    "url": BASE_URL,
}

SKIP_PAGES = {"cultural-alignment.html", "transsuasion.html"}
SKIP_PATTERN = re.compile(r"^google[0-9a-f]+\.html$")

# Highwire citation tags not expected on these pages
NO_CITATION_PAGES = {"index.html", "PersuasionArena.html", "the-culture-repository.html"}

# og:type should be "website" (not "article") for these
OG_WEBSITE_PAGES = {"index.html", "PersuasionArena.html", "the-culture-repository.html"}


def is_skip(fname):
    return fname in SKIP_PAGES or bool(SKIP_PATTERN.match(fname))


def slug(fname):
    return fname.replace(".html", "")


def get_meta(content, name):
    pat = r'<meta\s+name=["\']' + re.escape(name) + r'["\'][^>]+content=["\']([^"\']+)["\']'
    m = re.search(pat, content, re.I)
    return m.group(1).strip() if m else None


def check_meta(content, fname):
    issues = []

    if not re.search(r'<html[^>]+lang=["\']en["\']', content, re.I):
        issues.append('missing lang=en on <html>')

    m = re.search(r'<title>(.*?)</title>', content, re.S | re.I)
    if not m or not m.group(1).strip():
        issues.append('missing or empty <title>')

    if not re.search(r'<meta\s+name=["\']description["\']', content, re.I):
        issues.append('missing <meta name="description">')

    m = re.search(r'<link\s+rel=["\']canonical["\'][^>]+href=["\']([^"\']+)["\']', content, re.I)
    if not m:
        issues.append('missing <link rel="canonical">')
    else:
        expected = f"{BASE_URL}/" if fname == "index.html" else f"{BASE_URL}/{slug(fname)}"
        if m.group(1).rstrip("/") != expected.rstrip("/"):
            issues.append(f'canonical mismatch: got {m.group(1)!r}, expected {expected!r}')

    for prop in ("og:title", "og:description", "og:url", "og:image", "og:type"):
        if not re.search(r'<meta\s+property=["\']' + re.escape(prop) + r'["\']', content, re.I):
            issues.append(f'missing <meta property="{prop}">')

    m = re.search(r'<meta\s+property=["\']og:type["\'][^>]+content=["\']([^"\']+)["\']', content, re.I)
    if m:
        expected_type = "website" if fname in OG_WEBSITE_PAGES else "article"
        if m.group(1) != expected_type:
            issues.append(f'og:type={m.group(1)!r} should be {expected_type!r}')

    for name in ("twitter:card", "twitter:title", "twitter:description"):
        if not re.search(r'<meta\s+name=["\']' + re.escape(name) + r'["\']', content, re.I):
            issues.append(f'missing <meta name="{name}">')

    if fname not in NO_CITATION_PAGES:
        for tag in ("citation_title", "citation_author", "citation_publication_date"):
            if not get_meta(content, tag):
                issues.append(f'missing Highwire <meta name="{tag}">')

    return issues


def parse_jsonld_blocks(content):
    raw_blocks = re.findall(
        r'<script\s+type=["\']application/ld\+json["\']>(.*?)</script>',
        content, re.DOTALL | re.I
    )
    parsed = []
    for raw in raw_blocks:
        try:
            parsed.append((raw, json.loads(raw.strip())))
        except json.JSONDecodeError:
            parsed.append((raw, None))
    return parsed


def check_jsonld(blocks, fname, content):
    issues = []
    if not blocks:
        issues.append("no JSON-LD block found")
        return issues

    venue = get_meta(content, "citation_conference_title") or get_meta(content, "citation_journal_title")
    arxiv_id = get_meta(content, "citation_arxiv_id")

    for raw, d in blocks:
        if d is None:
            issues.append("JSON-LD parse error")
            continue

        t = d.get("@type", "")
        types = t if isinstance(t, list) else [t]

        if all(x in ("WebSite", "SearchAction", "Organization", "Person") for x in types):
            continue

        is_scholarly = "ScholarlyArticle" in types
        is_dataset = "Dataset" in types
        is_software = "SoftwareApplication" in types

        # license
        if "license" not in d:
            issues.append(f"JSON-LD ({t}): missing 'license'")

        # publisher
        pub = d.get("publisher", {})
        if isinstance(pub, dict) and pub.get("name") != "Behavior In The Wild Research Group":
            issues.append(f"JSON-LD ({t}): publisher name should be 'Behavior In The Wild Research Group', got {pub.get('name')!r}")
        elif "publisher" not in d:
            issues.append(f"JSON-LD ({t}): missing 'publisher'")

        # sameAs — required when arxiv_id is present
        if arxiv_id and is_scholarly:
            expected_same = f"https://arxiv.org/abs/{arxiv_id}"
            if d.get("sameAs") != expected_same:
                issues.append(f"JSON-LD ({t}): missing sameAs={expected_same!r} (arxiv_id found in Highwire tags)")

        # isPartOf rules
        ip = d.get("isPartOf")
        ip_type = ip.get("@type", "") if isinstance(ip, dict) else ""

        if is_scholarly and not is_dataset:
            if venue:
                # Published paper: must have isPartOf Periodical with correct name
                if not ip:
                    issues.append(f"JSON-LD ({t}): published paper missing isPartOf Periodical (venue: {venue!r})")
                elif ip_type != "Periodical":
                    issues.append(f"JSON-LD ({t}): isPartOf @type={ip_type!r} should be 'Periodical' for published paper")
                elif ip.get("name") != venue:
                    issues.append(f"JSON-LD ({t}): isPartOf name mismatch: got {ip.get('name')!r}, expected {venue!r}")
            else:
                # Preprint: isPartOf must be absent
                if ip:
                    issues.append(f"JSON-LD ({t}): preprint should not have isPartOf (no venue in Highwire tags)")

        elif is_dataset or is_software:
            if is_software:
                if ip:
                    issues.append(f"JSON-LD ({t}): SoftwareApplication should not have isPartOf")
            elif is_dataset:
                if not ip:
                    issues.append(f"JSON-LD ({t}): Dataset missing isPartOf DataCatalog")
                elif ip_type != "DataCatalog":
                    issues.append(f"JSON-LD ({t}): Dataset isPartOf @type={ip_type!r} should be 'DataCatalog'")

        # author on ScholarlyArticle
        if is_scholarly and "author" not in d:
            issues.append(f"JSON-LD ({t}): ScholarlyArticle missing 'author'")

        # creator on Dataset
        if is_dataset and "creator" not in d:
            issues.append(f"JSON-LD ({t}): Dataset missing 'creator'")

    return issues


def fix_block(d, venue, arxiv_id):
    types = d.get("@type", "")
    typelist = types if isinstance(types, list) else [types]
    is_scholarly = "ScholarlyArticle" in typelist
    is_dataset = "Dataset" in typelist
    is_software = "SoftwareApplication" in typelist

    out = {}
    for k, v in d.items():
        if k == "author":
            out[k] = v
            if is_dataset and "creator" not in d:
                out["creator"] = v
        elif k == "isPartOf":
            if is_scholarly and not is_dataset:
                if venue:
                    out[k] = {"@type": "Periodical", "name": venue}
                # else preprint: omit
            elif is_software:
                pass  # remove
            elif is_dataset:
                if isinstance(v, dict) and v.get("@type") == "DataCatalog":
                    out[k] = v
                else:
                    out[k] = DATACATALOG
        elif k == "publisher":
            if arxiv_id and is_scholarly and "sameAs" not in d:
                out["sameAs"] = "https://arxiv.org/abs/" + arxiv_id
            out[k] = v
        else:
            out[k] = v

    # Add isPartOf for published scholarly-only if absent
    if is_scholarly and not is_dataset and "isPartOf" not in out and venue:
        out["isPartOf"] = {"@type": "Periodical", "name": venue}

    # Add DataCatalog for Dataset-only if absent
    if is_dataset and not is_scholarly and "isPartOf" not in out:
        out["isPartOf"] = DATACATALOG

    # Ensure license
    if "license" not in out:
        out["license"] = LICENSE_URL

    # Ensure sameAs if arxiv and no publisher triggered it
    if arxiv_id and is_scholarly and "sameAs" not in out:
        out["sameAs"] = "https://arxiv.org/abs/" + arxiv_id

    return out


def fix_content(content):
    venue = get_meta(content, "citation_conference_title") or get_meta(content, "citation_journal_title")
    arxiv_id = get_meta(content, "citation_arxiv_id")

    def replacer(m):
        raw = m.group(1)
        try:
            d = json.loads(raw.strip())
        except json.JSONDecodeError:
            return m.group(0)
        t = d.get("@type", "")
        tl = t if isinstance(t, list) else [t]
        if all(x in ("WebSite", "SearchAction", "Organization", "Person") for x in tl):
            return m.group(0)
        d2 = fix_block(d, venue, arxiv_id)
        return '<script type="application/ld+json">\n' + json.dumps(d2, indent=2, ensure_ascii=False) + "\n</script>"

    return re.sub(
        r'<script\s+type=["\']application/ld\+json["\']>(.*?)</script>',
        replacer, content, flags=re.DOTALL | re.I
    )


def audit_file(path, fix=False):
    fname = os.path.basename(path)
    with open(path) as fh:
        content = fh.read()

    meta_issues = check_meta(content, fname)
    jsonld_blocks = parse_jsonld_blocks(content)
    jsonld_issues = check_jsonld(jsonld_blocks, fname, content)
    all_issues = meta_issues + jsonld_issues

    fixed = False
    if fix and jsonld_issues:
        new_content = fix_content(content)
        if new_content != content:
            with open(path, "w") as fh:
                fh.write(new_content)
            fixed = True

    return all_issues, fixed


def main():
    parser = argparse.ArgumentParser(description="BITW SEO & JSON-LD audit")
    parser.add_argument("--repo", default=os.path.expanduser("~/git/behavior-in-the-wild.github.io"))
    parser.add_argument("--fix", action="store_true", help="Auto-fix JSON-LD issues")
    args = parser.parse_args()

    html_files = sorted(glob.glob(os.path.join(args.repo, "*.html")))
    if not html_files:
        print(f"No HTML files found in {args.repo}", file=sys.stderr)
        sys.exit(1)

    total_issues = 0
    fixed_files = []

    print(f"\n{'PAGE':<55} {'ISSUES'}")
    print("-" * 85)

    for path in html_files:
        fname = os.path.basename(path)
        if is_skip(fname):
            print(f"{fname:<55} (redirect — skipped)")
            continue

        issues, fixed = audit_file(path, fix=args.fix)

        if not issues:
            print(f"{fname:<55} OK")
        else:
            for i, issue in enumerate(issues):
                prefix = f"{fname:<55}" if i == 0 else " " * 55
                marker = "FIXED" if fixed else "ISSUE"
                print(f"{prefix} [{marker}] {issue}")
            total_issues += len(issues)
            if fixed:
                fixed_files.append(fname)

    print("-" * 85)
    if total_issues == 0:
        print("All pages pass. No issues found.")
    else:
        print(f"\n{total_issues} issue(s) across {len([f for f in html_files if not is_skip(os.path.basename(f))])} pages.")
        if fixed_files:
            print(f"Auto-fixed: {', '.join(fixed_files)}")
        if not args.fix:
            print("Re-run with --fix to auto-fix JSON-LD issues.")

    sys.exit(0 if total_issues == 0 else 1)


if __name__ == "__main__":
    main()
