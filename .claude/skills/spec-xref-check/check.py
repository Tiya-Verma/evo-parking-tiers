#!/usr/bin/env python3
"""Audit cross-reference integrity in evo-parking-architecture.md.

Checks three categories:
  1. Table-of-contents anchor links → real ## headings
  2. Inline §N / §N.M citations → real ## / ### headings
  3. Entity field citations (e.g. parking_structure.foo) outside §6 → §6 tables

Exit code: 0 if clean, 1 if any broken references found.
"""

from __future__ import annotations

import re
import sys
from dataclasses import dataclass, field
from pathlib import Path

SPEC_FILENAME = "evo-parking-architecture.md"
ENTITY_NAMES = (
    "parking_structure",
    "parking_report",
    "floor_trust_state",
    "evo_vehicle_park_event",
)


@dataclass
class SpecIndex:
    # Map of "1" → "Problem Statement", "5.1" → "Car Detail Card — Parking Info Panel"
    sections: dict[str, str] = field(default_factory=dict)
    # GitHub-style anchor slugs derived from headings, e.g. "1-problem-statement"
    anchors: set[str] = field(default_factory=set)
    # Map of entity name → set of field names declared in §6 tables
    entity_fields: dict[str, set[str]] = field(default_factory=dict)


def slugify(heading: str) -> str:
    """Approximate GitHub's anchor-slug algorithm for markdown headings."""
    slug = heading.lower()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"\s+", "-", slug).strip("-")
    return slug


def build_index(text: str) -> SpecIndex:
    idx = SpecIndex()

    # Section headings: "## 1. Problem Statement" and "### 5.1 Car Detail Card"
    h2 = re.compile(r"^##\s+(\d+)\.\s+(.+?)\s*$", re.MULTILINE)
    h3 = re.compile(r"^###\s+(\d+\.\d+)\s+(.+?)\s*$", re.MULTILINE)

    for m in h2.finditer(text):
        num, title = m.group(1), m.group(2)
        idx.sections[num] = title
        idx.anchors.add(slugify(f"{num} {title}"))
    for m in h3.finditer(text):
        num, title = m.group(1), m.group(2)
        idx.sections[num] = title
        idx.anchors.add(slugify(f"{num} {title}"))

    # Entity field tables under "#### `entity_name`" blocks in §6.
    # Capture the entity name, then collect first-column values from the
    # following markdown table until a blank line + non-table line.
    entity_block = re.compile(
        r"^####\s+`(" + "|".join(ENTITY_NAMES) + r")`\s*\n(.*?)(?=^####|^##|\Z)",
        re.MULTILINE | re.DOTALL,
    )
    table_row = re.compile(r"^\|\s*`([a-z_][a-z0-9_]*)`\s*\|", re.MULTILINE)
    for m in entity_block.finditer(text):
        entity = m.group(1)
        block = m.group(2)
        idx.entity_fields[entity] = {r.group(1) for r in table_row.finditer(block)}

    return idx


def check_toc(text: str, idx: SpecIndex) -> list[str]:
    """TOC entries look like: 1. [Problem Statement](#1-problem-statement)."""
    findings: list[str] = []
    toc_link = re.compile(r"^\s*\d+\.\s+\[(?P<title>[^\]]+)\]\(#(?P<anchor>[^)]+)\)", re.MULTILINE)
    # The TOC sits before "---\n\n## 1." — bound the search to that prefix.
    first_section = re.search(r"^##\s+1\.", text, re.MULTILINE)
    toc_region = text[: first_section.start()] if first_section else text

    for m in toc_link.finditer(toc_region):
        anchor = m.group("anchor")
        if anchor not in idx.anchors:
            findings.append(
                f"TOC link '{m.group('title')}' → #{anchor} does not match any heading."
            )
    return findings


def check_section_refs(text: str, idx: SpecIndex) -> list[str]:
    """Find §N and §N.M citations and verify each section number exists."""
    findings: list[str] = []
    ref = re.compile(r"§(\d+(?:\.\d+)?)")
    seen: set[tuple[int, str]] = set()
    for m in ref.finditer(text):
        num = m.group(1)
        if num in idx.sections:
            continue
        # Deduplicate by (line_number, num) so a single bad ref reported once.
        line_no = text.count("\n", 0, m.start()) + 1
        key = (line_no, num)
        if key in seen:
            continue
        seen.add(key)
        findings.append(f"line {line_no}: §{num} does not match any section heading.")
    return findings


def check_entity_field_refs(text: str, idx: SpecIndex) -> list[str]:
    """Verify `entity.field` citations resolve to a declared field in §6.

    Skip the §6 region itself so the data-model tables don't self-reference.
    """
    findings: list[str] = []
    section_6_start = re.search(r"^##\s+6\.", text, re.MULTILINE)
    section_7_start = re.search(r"^##\s+7\.", text, re.MULTILINE)
    if not section_6_start or not section_7_start:
        return findings  # spec restructured; defer to §N check above

    pre_6 = text[: section_6_start.start()]
    post_6 = text[section_7_start.start() :]
    seen: set[tuple[int, str]] = set()

    pattern = re.compile(
        r"`?\b(" + "|".join(ENTITY_NAMES) + r")\.([a-z_][a-z0-9_]*)`?"
    )

    for label, segment, offset in (
        ("before §6", pre_6, 0),
        ("after §6", post_6, section_7_start.start()),
    ):
        for m in pattern.finditer(segment):
            entity, fieldname = m.group(1), m.group(2)
            declared = idx.entity_fields.get(entity, set())
            if fieldname in declared:
                continue
            absolute_pos = offset + m.start()
            line_no = text.count("\n", 0, absolute_pos) + 1
            key = (line_no, f"{entity}.{fieldname}")
            if key in seen:
                continue
            seen.add(key)
            findings.append(
                f"line {line_no} ({label}): `{entity}.{fieldname}` is not a "
                f"declared field on {entity} in §6."
            )
    return findings


def main() -> int:
    repo_root = Path(__file__).resolve().parents[3]
    spec_path = repo_root / SPEC_FILENAME
    if not spec_path.exists():
        print(f"error: {spec_path} not found", file=sys.stderr)
        return 1

    text = spec_path.read_text(encoding="utf-8")
    idx = build_index(text)

    if not idx.sections:
        print("error: no section headings detected — spec format may have changed", file=sys.stderr)
        return 1

    categories = [
        ("Table-of-contents anchor mismatches", check_toc(text, idx)),
        ("Dangling §N / §N.M references", check_section_refs(text, idx)),
        ("Unknown entity field citations", check_entity_field_refs(text, idx)),
    ]

    total = sum(len(f) for _, f in categories)
    if total == 0:
        print(f"spec-xref-check: clean ({len(idx.sections)} sections indexed).")
        return 0

    for title, findings in categories:
        if not findings:
            continue
        print(f"\n{title} ({len(findings)}):")
        for f in findings:
            print(f"  - {f}")
    print(f"\nspec-xref-check: {total} issue(s) found.")
    return 1


if __name__ == "__main__":
    sys.exit(main())
