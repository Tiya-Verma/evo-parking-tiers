# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository status

This repository contains a **Next.js (App Router) prototype** implementing the Evo Parking Navigation feature. Source code lives in `app/`, `components/`, and `lib/`, with a database schema in `schema.sql`. The design document `evo-parking-architecture.md` remains the authoritative spec — treat it as the source of truth when the implementation diverges or for any unbuilt functionality.

## What the project is

The Evo Parking Navigation feature is a contextual layer added to the existing Evo car-share app. When a shared vehicle is parked inside a multi-level parking structure (rather than on the street), the layer surfaces lot status, floor level, access instructions, and a closing-time warning so users don't make wasted trips to inaccessible cars.

A guiding constraint: the parking layer **adds no new screens**. It enriches the existing tap-car → reserve → navigate → end-trip flow in place, and is invisible for street-parked cars.

## Architectural pillars

When implementing or extending the feature, four subsystems carry most of the design weight. Understanding how they interact matters more than any single entity:

1. **Trust pipeline** (§7 of the architecture doc) — every piece of parking data has a trust tier: `gps_estimated` → `driver_report` → `community_verified` → `evo_verified`. Tier drives a badge color in the UI and gates auto-promotion. Conflicting reports are resolved by recency × GPS signal quality weighting, with auto-promotion blocked if the weighted majority disagrees with the GPS estimate (those cases go to ops review). Structural changes trigger an explicit downgrade path that nulls `ops_verified_at` and re-activates community prompts.

2. **GPS floor detection** (§8) — floors are estimated from `(gps_altitude - structure.ground_elevation) / structure.floor_height`. This is unreliable underground (no GPS below grade — fall back to community-only data) and ambiguous at P1 (display as "Ground level"). The `ground_elevation_m` per structure must be calibrated; persistent driver corrections that diverge from the GPS estimate flag a structure for ops recalibration.

3. **Data model** (§6) — four entities, all keyed off `parking_structure`:
   - `parking_structure` — the lot itself, including boundary GeoJSON for geofencing and entrance coords (separate from the street-address centroid; the entrance coords are what the Navigate handoff uses).
   - `parking_report` — driver-submitted, one per trip (enforced via unique `trip_id` constraint).
   - `floor_trust_state` — one row per floor per structure; holds the current trust tier and `is_closed` flag.
   - `evo_vehicle_park_event` — every engine-off event, used both to drive end-trip prompts and to detect clusters of un-modeled structures (5+ park events in an unknown polygon flags a new-structure candidate for ops).

4. **Two-phase navigation** (§5.3) — Phase 1 hands off to Apple/Google Maps using the lot's **entrance coordinates**, not the street address. Phase 2 fires on geofence entry (~50m radius) and brings the Evo app back to the foreground to show level/section guidance. The iOS foreground-regain mechanism is explicitly called out as an open question (§11).

## Cross-cutting rules from the spec

These show up in multiple sections and are easy to get wrong:

- **Reservation responsibility:** the closing-lot alert is advisory only. Evo does **not** auto-cancel reservations when a lot closes. (§9.1)
- **Report acceptance window:** reports within 60s of end trip are accepted; >10min are rejected. Max 3 rewarded reports per driver per day. (§10)
- **Prompt suppression:** two consecutive dismissals of the end-trip prompt suppress it for that driver for 30 days. (§5.4)
- **Switch-car fee waiver:** when the closing alert offers a swap, the cancellation fee is waived and alternatives are filtered to street parking or lots closing >2 hours from now. (§5.2)

## Working with the architecture doc

- The doc uses ASCII flow diagrams and tables — preserve that style when editing. Don't convert to Mermaid or other formats unless asked.
- Section numbering is referenced cross-sectionally (e.g. §9 edge cases cite §6 entities). If you renumber sections, update internal references.
- The "Open Questions" table in §11 is the live punch list. New unresolved decisions belong there, not scattered as TODOs.
