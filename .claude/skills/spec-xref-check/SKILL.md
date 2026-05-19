---
name: spec-xref-check
description: Verify cross-reference integrity in evo-parking-architecture.md — table-of-contents anchor links, §N section references, and entity field names cited outside §6. Use before committing edits that renumber, split, rename, or remove sections, or any time you suspect refs have drifted. User-invocable via /spec-xref-check.
disable-model-invocation: true
---

# Spec cross-reference check

This skill audits `evo-parking-architecture.md` for broken internal references. It's the one repetitive task this repo has today: the spec is heavily cross-linked by section number, and renumbering one section silently breaks pointers from elsewhere.

## How to run it

Run the bundled script from the repo root:

```bash
python3 .claude/skills/spec-xref-check/check.py
```

The script exits 0 if clean, 1 if any broken references are found. Output groups findings by category:

1. **TOC anchor mismatches** — links in the Table of Contents at the top of the doc whose `#anchor` does not resolve to a real `##` heading.
2. **Dangling `§N` / `§N.M` refs** — section-number citations in prose that point to a section number that doesn't exist.
3. **Unknown entity field citations** — `parking_structure.foo`, `parking_report.foo`, etc. used outside §6 where `foo` is not defined in the §6 entity tables.

## What to do with findings

- **TOC mismatch** → either the heading was renamed (update the TOC) or the TOC entry is stale (remove or fix it).
- **Dangling §N** → the cited section was renumbered, merged, or deleted. Update the citing prose to point to the new location, or drop the citation if it no longer applies.
- **Unknown field citation** → either the field was renamed in §6 (update the citing reference) or the citing reference is a typo (fix the typo). Do **not** add the field to §6 just to silence the warning — that's how data-model drift sneaks in.

## When NOT to run

- After purely additive edits that don't touch existing section numbers or entity field names (e.g. adding a new edge case to §9 without renumbering). The check is cheap, but it's noise in that case.
- Before the doc has been edited at all — running it on the as-written spec from May 2026 should always be clean. A failure on unedited content is a bug in the script, not in the spec.

## Extending the script

The script intentionally checks only three categories because they're the high-signal ones for this doc. If a fourth pattern starts mattering (e.g. trust-tier name consistency between §7 and §5.1), add a separate check function in `check.py` and call it from `main()` — don't overload the existing checks.
