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
DATACATALOG = {
    "@type": "DataCatalog",
    "name": "Behavior In The Wild",
    "url": BASE_URL,
}

# Pages that are plain redirects — skip entirely
SKIP_PAGES = {
    "cultural-alignment.html",
    "transsuasion.html",
}
SKIP_PATTERN = re.compile(r"^google[0-9a-f]+\.html$")

# Pages where Highwire citation tags are NOT expected
NO_CITATION_TAGS = {
    "index.html",
    "PersuasionArena.html",
    "the-culture-repository.html",
}

# og:type should be "website" (not "article") for these
OG_WEBSITE_PAGES = {
    "index.html",
    "PersuasionArena.html",
    "the-culture-repository.html",
}


def is_skip(fname):
    return fname in SKIP_PAGES or bool(SKIP_PATTERN.match(fname))


def slug(fname):
    return fname.replace(".html", "")


def check_meta(content, fname):
    issues = []

    # 1. lang="en"
    if not re.search(r'<html[^>]+lang=["\']en["\']', content, re.I):
        issues.append("missing lang=en on <html>")

    # 2. <title>
    m = re.search(r"<title>(.*?)</title>", content, re.S | re.I)
    if not m or not m.group(1).strip():
        issues.append("missing or empty <title>")

    # 3. meta description
    if not re.search(r'<meta\s+name=["\']description["\']', content, re.I):
        issues.append("missing <meta name=\"description\">")

    # 4. canonical
    m = re.search(r'<link\s+rel=["\']canonical["\'][^>]+href=["\']([^"\']+)["\']', content, re.I)
    if not m:
        issues.append("missing <link rel=\"canonical\">")
    else:
        # index.html maps to the root URL, all others map to /{slug}
        if fname == "index.html":
            expected = f"{BASE_URL}/"
        else:
            expected = f"{BASE_URL}/{slug(fname)}"
        if m.group(1).rstrip("/") != expected.rstrip("/"):
            issues.append(f"canonical mismatch: got {m.group(1)!r}, expected {expected!r}")

    # 5. OG tags
    for prop in ("og:title", "og:description", "og:url", "og:image", "og:type"):
        if not re.search(rf'<meta\s+property=["\']og:{prop.split(":")[1]}["\']', content, re.I):
            issues.append(f"missing <meta property=\"{prop}\">")

    # 7. og:type value
    m = re.search(r'<meta\s+property=["\']og:type["\'][^>]+content=["\']([^"\']+)["\']', content, re.I)
    if m:
        expected_type = "website" if fname in OG_WEBSITE_PAGES else "article"
        if m.group(1) != expected_type:
            issues.append(f"og:type={m.group(1)!r} should be {expected_type!r}")

    # 6. Twitter card tags
    for name in ("twitter:card", "twitter:title", "twitter:description"):
        if not re.search(rf'<meta\s+name=["\']twitter:{name.split(":")[1]}["\']', content, re.I):
            issues.append(f"missing <meta name=\"{name}\">")

    # 8. Highwire citation tags (paper pages only)
    if fname not in NO_CITATION_TAGS:
        for tag in ("citation_title", "citation_author", "citation_publication_date"):
            if not re.search(rf'<meta\s+name=["\']{tag}["\']', content, re.I):
                issues.append(f"missing Highwire <meta name=\"{tag}\">")

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


def check_jsonld(blocks, fname):
    issues = []
    if not blocks:
        issues.append("no JSON-LD block found")
        return issues

    for raw, d in blocks:
        if d is None:
            issues.append("JSON-LD parse error")
            continue

        t = d.get("@type", "")
        types = t if isinstance(t, list) else [t]

        # Skip WebSite/SearchAction blocks
        if all(x in ("WebSite", "SearchAction", "Organization", "Person") for x in types):
            continue

        # 9. license
        if "license" not in d:
            issues.append(f"JSON-LD ({t}): missing 'license'")

        # 10. isPartOf rules
        is_scholarly = "ScholarlyArticle" in types
        is_software = "SoftwareApplication" in types
        is_dataset = "Dataset" in types

        if "isPartOf" in d:
            ip = d["isPartOf"]
            ip_type = ip.get("@type", "") if isinstance(ip, dict) else ""
            if (is_scholarly or is_software) and not is_dataset:
                issues.append(f"JSON-LD ({t}): isPartOf should be absent for ScholarlyArticle/SoftwareApplication")
            elif is_dataset and ip_type != "DataCatalog":
                issues.append(f"JSON-LD ({t}): isPartOf @type={ip_type!r} should be 'DataCatalog'")
        elif is_dataset and "isPartOf" not in d:
            issues.append(f"JSON-LD ({t}): Dataset missing isPartOf DataCatalog")

        # 11. author on ScholarlyArticle
        if is_scholarly and "author" not in d:
            issues.append(f"JSON-LD ({t}): ScholarlyArticle missing 'author'")

        # 12. creator on Dataset
        if is_dataset and "creator" not in d:
            issues.append(f"JSON-LD ({t}): Dataset missing 'creator'")

    return issues


def fix_jsonld_block(d):
    t = d.get("@type", "")
    types = t if isinstance(t, list) else [t]

    if all(x in ("WebSite", "SearchAction", "Organization", "Person") for x in types):
        return d

    is_scholarly = "ScholarlyArticle" in types
    is_software = "SoftwareApplication" in types
    is_dataset = "Dataset" in types

    out = {}
    author_val = None

    for k, v in d.items():
        if k == "author":
            out[k] = v
            author_val = v
            # Add creator after author for dual-type pages
            if is_dataset and "creator" not in d:
                out["creator"] = v
        elif k == "isPartOf":
            if (is_scholarly or is_software) and not is_dataset:
                continue  # remove
            elif is_dataset:
                new_ip = dict(v) if isinstance(v, dict) else {}
                new_ip.update(DATACATALOG)
                out[k] = new_ip
        elif k == "publisher":
            if "license" not in out:
                out["license"] = LICENSE_URL
            out[k] = v
        else:
            out[k] = v

    # Ensure creator exists on Dataset (in case author wasn't present to trigger it)
    if is_dataset and "creator" not in out and author_val:
        out["creator"] = author_val

    # Ensure isPartOf exists for pure Dataset (no ScholarlyArticle)
    if is_dataset and not is_scholarly and "isPartOf" not in out:
        out["isPartOf"] = DATACATALOG

    # Ensure license exists
    if "license" not in out:
        out["license"] = LICENSE_URL

    return out


def fix_content(content):
    def replacer(m):
        raw = m.group(1)
        try:
            d = json.loads(raw.strip())
        except json.JSONDecodeError:
            return m.group(0)
        d2 = fix_jsonld_block(d)
        new_json = json.dumps(d2, indent=2, ensure_ascii=False)
        return f'<script type="application/ld+json">\n{new_json}\n</script>'

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
    jsonld_issues = check_jsonld(jsonld_blocks, fname)
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
    parser.add_argument("--repo", default=os.path.expanduser("~/git/behavior-in-the-wild.github.io"),
                        help="Path to repo root")
    parser.add_argument("--fix", action="store_true", help="Auto-fix JSON-LD issues")
    args = parser.parse_args()

    html_files = sorted(glob.glob(os.path.join(args.repo, "*.html")))
    if not html_files:
        print(f"No HTML files found in {args.repo}", file=sys.stderr)
        sys.exit(1)

    total_issues = 0
    fixed_files = []

    print(f"\n{'PAGE':<55} {'ISSUES'}")
    print("-" * 80)

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
                marker = "FIXED" if (fixed and "JSON-LD" in issue) else "ISSUE"
                print(f"{prefix} [{marker}] {issue}")
            total_issues += len(issues)
            if fixed:
                fixed_files.append(fname)

    print("-" * 80)
    if total_issues == 0:
        print("All pages pass. No issues found.")
    else:
        print(f"\n{total_issues} issue(s) found across {len([f for f in html_files if not is_skip(os.path.basename(f))])} pages.")
        if fixed_files:
            print(f"Auto-fixed JSON-LD in: {', '.join(fixed_files)}")
        unfixable = total_issues - sum(1 for _ in fixed_files)
        if unfixable > 0 and not args.fix:
            print("Re-run with --fix to auto-fix JSON-LD issues.")

    sys.exit(0 if total_issues == 0 else 1)


if __name__ == "__main__":
    main()
