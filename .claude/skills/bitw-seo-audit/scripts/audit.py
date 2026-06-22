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
BITW_ORG = {"@type": "Organization", "name": "Behavior In The Wild Research Group",
            "url": BASE_URL}
ARXIV_ORG = {"@type": "Organization", "name": "arXiv", "url": "https://arxiv.org"}
DATACATALOG = {"@type": "DataCatalog", "name": "Behavior In The Wild", "url": BASE_URL}

SKIP_PAGES = {"cultural-alignment.html", "transsuasion.html"}
SKIP_PATTERN = re.compile(r"^google[0-9a-f]+\.html$")
NO_CITATION_PAGES = {"index.html", "PersuasionArena.html", "the-culture-repository.html"}
OG_WEBSITE_PAGES = {"index.html", "PersuasionArena.html", "the-culture-repository.html"}

# Venue fragment → (abbreviation, publisher name)
CONF_MAP = {
    "International Conference on Learning Representations": {
        "abbrev": "ICLR",
        "publisher": "International Conference on Learning Representations",
        "publisher_url": "https://iclr.cc",
    },
    "AAAI Conference on Artificial Intelligence": {
        "abbrev": "AAAI",
        "publisher": "AAAI Press",
        "publisher_url": "https://aaai.org",
    },
    "IEEE/CVF Winter Conference on Applications of Computer Vision": {
        "abbrev": "WACV",
        "publisher": "IEEE",
        "publisher_url": "https://ieeexplore.ieee.org",
    },
    "IEEE/CVF Conference on Computer Vision and Pattern Recognition": {
        "abbrev": "CVPR",
        "publisher": "IEEE",
        "publisher_url": "https://ieeexplore.ieee.org",
    },
    "Advances in Neural Information Processing Systems": {
        "abbrev": "NeurIPS",
        "publisher": "Neural Information Processing Systems Foundation",
        "publisher_url": "https://nips.cc",
    },
    "Conference on Empirical Methods in Natural Language Processing": {
        "abbrev": "EMNLP",
        "publisher": "Association for Computational Linguistics",
        "publisher_url": "https://aclanthology.org",
    },
    "European Chapter of the Association for Computational Linguistics": {
        "abbrev": "EACL",
        "publisher": "Association for Computational Linguistics",
        "publisher_url": "https://aclanthology.org",
    },
    "European Conference on Computer Vision": {
        "abbrev": "ECCV",
        "publisher": "Springer Nature",
        "publisher_url": "https://www.springer.com",
    },
}


def is_skip(fname):
    return fname in SKIP_PAGES or bool(SKIP_PATTERN.match(fname))


def slug(fname):
    return fname.replace(".html", "")


def get_meta(content, name):
    pat = r'<meta\s+name=["\']' + re.escape(name) + r'["\'][^>]+content=["\']([^"\']+)["\']'
    m = re.search(pat, content, re.I)
    return m.group(1).strip() if m else None


def get_prop(content, prop):
    pat = r'<meta\s+property=["\']' + re.escape(prop) + r'["\'][^>]+content=["\']([^"\']+)["\']'
    m = re.search(pat, content, re.I)
    return m.group(1).strip() if m else None


def match_conf(conf_title):
    if not conf_title:
        return None, None, None
    for key, val in CONF_MAP.items():
        if key.lower() in conf_title.lower():
            return val["abbrev"], val["publisher"], val["publisher_url"]
    return None, None, None


def build_proceedings(conf_title, abbrev, year):
    if not abbrev or f"({abbrev})" in conf_title or abbrev in conf_title:
        return f"Proceedings of the {conf_title} {year}"
    return f"Proceedings of the {conf_title} ({abbrev}) {year}"


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


def check_jsonld(blocks, fname, content):
    issues = []
    if not blocks:
        issues.append("no JSON-LD block found")
        return issues

    conf_title = get_meta(content, "citation_conference_title") or \
                 get_meta(content, "citation_journal_title")
    arxiv_id = get_meta(content, "citation_arxiv_id")
    year = get_meta(content, "citation_publication_date") or "2025"
    abbrev, expected_publisher, _ = match_conf(conf_title)

    for _, d in blocks:
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

        # headline on ScholarlyArticle
        if is_scholarly and "headline" not in d:
            issues.append(f"JSON-LD ({t}): missing 'headline' (should equal 'name')")

        # image
        if is_scholarly and "image" not in d:
            issues.append(f"JSON-LD ({t}): missing 'image'")

        # publisher
        pub = d.get("publisher", {})
        pub_name = pub.get("name", "") if isinstance(pub, dict) else ""
        if "publisher" not in d:
            issues.append(f"JSON-LD ({t}): missing 'publisher'")
        elif is_scholarly:
            if conf_title and expected_publisher:
                if pub_name != expected_publisher:
                    issues.append(f"JSON-LD ({t}): publisher should be {expected_publisher!r} for this venue, got {pub_name!r}")
            elif arxiv_id:
                if pub_name != "arXiv":
                    issues.append(f"JSON-LD ({t}): preprint with arXiv should use publisher='arXiv', got {pub_name!r}")
            else:
                if pub_name != "Behavior In The Wild Research Group":
                    issues.append(f"JSON-LD ({t}): preprint without arXiv should use BITW publisher, got {pub_name!r}")

        # sameAs
        if arxiv_id and is_scholarly:
            expected_same = f"https://arxiv.org/abs/{arxiv_id}"
            if d.get("sameAs") != expected_same:
                issues.append(f"JSON-LD ({t}): missing sameAs={expected_same!r}")

        # isPartOf
        ip = d.get("isPartOf")
        ip_type = ip.get("@type", "") if isinstance(ip, dict) else ""

        if is_scholarly and not is_dataset:
            if conf_title:
                if not ip:
                    issues.append(f"JSON-LD ({t}): published paper missing isPartOf CreativeWork")
                elif ip_type != "CreativeWork":
                    issues.append(f"JSON-LD ({t}): isPartOf @type={ip_type!r} should be 'CreativeWork' for proceedings")
                else:
                    expected_proc = build_proceedings(conf_title, abbrev, year)
                    if ip.get("name") != expected_proc:
                        issues.append(f"JSON-LD ({t}): isPartOf name mismatch:\n    got:      {ip.get('name')!r}\n    expected: {expected_proc!r}")
            else:
                if ip:
                    issues.append(f"JSON-LD ({t}): preprint should have no isPartOf")
        elif is_dataset:
            if not ip:
                issues.append(f"JSON-LD ({t}): Dataset missing isPartOf DataCatalog")
            elif ip_type != "DataCatalog":
                issues.append(f"JSON-LD ({t}): Dataset isPartOf should be DataCatalog, got {ip_type!r}")
        elif is_software:
            if ip:
                issues.append(f"JSON-LD ({t}): SoftwareApplication should not have isPartOf")

        # publication event on published scholarly
        if is_scholarly and conf_title and "publication" not in d:
            issues.append(f"JSON-LD ({t}): published paper missing 'publication' PublicationEvent")

        # author/creator
        if is_scholarly and "author" not in d:
            issues.append(f"JSON-LD ({t}): ScholarlyArticle missing 'author'")
        if is_dataset and "creator" not in d:
            issues.append(f"JSON-LD ({t}): Dataset missing 'creator'")

    return issues


def audit_file(path, fix=False):
    fname = os.path.basename(path)
    with open(path) as fh:
        content = fh.read()

    blocks = []
    for raw in re.findall(r'<script\s+type=["\']application/ld\+json["\']>(.*?)</script>',
                           content, re.DOTALL | re.I):
        try:
            blocks.append((raw, json.loads(raw.strip())))
        except json.JSONDecodeError:
            blocks.append((raw, None))

    meta_issues = check_meta(content, fname)
    jsonld_issues = check_jsonld(blocks, fname, content)
    return meta_issues + jsonld_issues, False  # fix path not updated here (use fix_schema_full.py)


def main():
    parser = argparse.ArgumentParser(description="BITW SEO & JSON-LD audit")
    parser.add_argument("--repo", default=os.path.expanduser("~/git/behavior-in-the-wild.github.io"))
    parser.add_argument("--fix", action="store_true",
                        help="Run fix_schema_full.py for auto-fixable JSON-LD issues")
    args = parser.parse_args()

    if args.fix:
        script = os.path.join(os.path.dirname(__file__), "fix_schema.py")
        if os.path.exists(script):
            os.system(f"python3 {script} --repo {args.repo}")
        else:
            print("fix_schema.py not found; run it manually", file=sys.stderr)

    html_files = sorted(glob.glob(os.path.join(args.repo, "*.html")))
    if not html_files:
        print(f"No HTML files found in {args.repo}", file=sys.stderr)
        sys.exit(1)

    total = 0
    print(f"\n{'PAGE':<55} ISSUES")
    print("-" * 85)

    for path in html_files:
        fname = os.path.basename(path)
        if is_skip(fname):
            print(f"{fname:<55} (redirect — skipped)")
            continue
        issues, _ = audit_file(path)
        if not issues:
            print(f"{fname:<55} OK")
        else:
            for i, issue in enumerate(issues):
                prefix = f"{fname:<55}" if i == 0 else " " * 55
                print(f"{prefix} [ISSUE] {issue}")
            total += len(issues)

    print("-" * 85)
    if total == 0:
        print("All pages pass.")
    else:
        print(f"\n{total} issue(s) found.")
        if not args.fix:
            print("Re-run with --fix to auto-fix JSON-LD issues.")
    sys.exit(0 if total == 0 else 1)


if __name__ == "__main__":
    main()
