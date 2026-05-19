# Evo Parking Navigation — Project Architecture

> **Purpose:** This document is the single source of truth for the Evo Parking Navigation feature. It covers the problem space, existing app flow, proposed feature layer, data model, trust pipeline, edge case handling, and implementation notes. Written for use with Claude Code.

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Existing Evo App Navigation Flow](#2-existing-evo-app-navigation-flow)
3. [Feature Overview](#3-feature-overview)
4. [New Navigation Flow with Parking Layer](#4-new-navigation-flow-with-parking-layer)
5. [UI Touchpoints](#5-ui-touchpoints)
6. [Data Model](#6-data-model)
7. [Trust Pipeline](#7-trust-pipeline)
8. [GPS Floor Detection](#8-gps-floor-detection)
9. [Edge Cases](#9-edge-cases)
10. [Driver Incentive Model](#10-driver-incentive-model)
11. [Constraints and Open Questions](#11-constraints-and-open-questions)

---

## 1. Problem Statement

The Evo car-share app displays available cars on a map, including cars parked inside multi-level parking structures. When a user taps on one of these cars, the app provides only a street address — no information about:

- Whether the parking lot is currently **open or closed**
- Which **floor or level** the car is parked on
- Whether the lot has a **rooftop** section that may be inaccessible
- How to **access the lot** (entrance location, barrier-free entry, elevator availability)

This forces users to navigate to a parking structure only to discover the lot is closed, the car is on an inaccessible rooftop level, or they cannot find the vehicle.

**User impact:** Wasted trips, failed bookings, poor experience, erosion of trust in the app.

---

## 2. Existing Evo App Navigation Flow

The current app flow is linear. Each step is a distinct state.

```
Map view
  │
  ▼
Tap car  ──────────────────────────────▶  Car detail card
                                          (plate, car type, fuel %)
  │
  ▼
Reserve  ──────────────────────────────▶  30-min hold timer starts
  │
  ▼
Navigate ──────────────────────────────▶  Hands off to Apple Maps / Google Maps
                                          with street address only
  │
  ▼
Arrive at car
  │
  ▼
Unlock & drive
  │
  ▼
End trip
```

### What the existing detail card shows

| Field | Value |
|---|---|
| License plate | e.g. EVO · 7KLP |
| Car model | e.g. 2023 Honda Fit |
| Fuel / charge | e.g. 82% |
| Location | Street address |
| Reserve button | Starts 30-min hold |

### What it does not show

- Lot open/closed status
- Operating hours for the lot
- Floor or level of the car
- Entrance location or access instructions
- Whether any levels are restricted

---

## 3. Feature Overview

The parking layer adds contextual information to the existing flow **without adding new screens**. Information surfaces at the points where it is most useful:

| Trigger | What appears | User benefit |
|---|---|---|
| Tap car (in structure) | Lot status, floor, access steps | Know before walking over |
| Reserve (lot closing soon) | Closing time alert + alternatives | Avoid being locked out |
| Navigate | Two-phase nav: lot entrance first, then level guide | No wandering inside the structure |
| End trip (in structure) | Community report prompt | Earns reward, improves data |

The parking layer is **invisible for street-parked cars**. It activates only when a car is detected inside a known parking structure.

---

## 4. New Navigation Flow with Parking Layer

```
Map view
  │
  ▼
Tap car ──── [car in structure?] ──YES──▶  Car detail card
                                           + Parking info panel
                │                            - Lot open/closed badge
                │                            - Floor level (e.g. P3 of 4)
                │                            - Closing time warning (if applicable)
                │                            - Access instructions
                NO
                │
                ▼
           Car detail card (unchanged — no extra UI for street-parked cars)
  │
  ▼
Reserve ─── [lot closing within 30 min?] ──YES──▶  Closing alert modal
                                                     - Warning banner
                                                     - Switch car option (fee waived)
                                                     - Nearby alternatives list
                │
                NO
                │
                ▼
           Reserve confirmed (unchanged)
  │
  ▼
Navigate ──────────────────────────────▶  Phase 1: Route to lot entrance
                                           (Maps handoff with entrance coords,
                                            not just street address)
                                           Phase 2: On arrival at lot,
                                           Evo app regains focus
                                           - Level indicator
                                           - Section/stall hint
                                           - "Tap horn to locate" CTA
  │
  ▼
Unlock & drive (unchanged)
  │
  ▼
End trip ─── [car parked in structure?] ──YES──▶  Community report prompt
                                                   - GPS pre-fills floor guess
                                                   - Driver confirms or corrects
                                                   - Toggle: barrier-free, elevator
                                                   - Submit → earn 5 min free driving
                │
                NO
                │
                ▼
           End trip (unchanged)
```

---

## 5. UI Touchpoints

### 5.1 Car Detail Card — Parking Info Panel

Appears below the existing car info when the car is inside a known structure. Three status pills in a horizontal row:

```
[ ● Lot open ]   [ ⬆ Level 3 of 4 ]   [ ⏱ Closes 11 pm ]
```

Below the pills, a collapsible panel shows:
- Parking structure name and address
- Entrance location (street name)
- Operating hours
- A floor-level strip (visual bar showing P1–P4 with the car's level highlighted and any closed levels greyed out)
- Step-by-step access instructions (numbered, max 3 steps)

**Trust badge** is displayed alongside the floor level:
- `Unverified` — GPS estimated only (amber)
- `Community` — single driver confirmed (blue)
- `Verified ✓` — three or more reports agree (teal)
- `Evo verified` — ops team confirmed (green)

---

### 5.2 Reserve — Closing Alert

Fires when: `lot_closing_time - now <= 30 minutes` AND the user taps Reserve.

```
⚠️  Lot closing in 13 minutes
    Pacific Centre Parkade closes at 11 pm.
    Your reserved car may be inaccessible after that.

    [ Switch car — fee waived ]    [ I'll make it in time ]
```

If the user taps "Switch car":
- Current reservation is cancelled with no fee
- Nearby alternatives are shown filtered to: street parking OR lots with closing time > 2 hours from now

---

### 5.3 Navigate — Two-Phase

Phase 1 — Maps handoff uses the **entrance coordinates** of the lot, not the street address centroid. Entrance coordinates are stored per structure in the database.

Phase 2 — Triggered when device GPS enters the lot boundary (geofence radius ~50m). Evo app surface comes to the foreground:

```
You're at the lot
↑ Take ramp or elevator to P3
  Section C · Stall approx. 3C-14
  [ Tap horn to locate ]
```

The stall approximation is derived from the car's last GPS fix before engine off, mapped against a stored lot grid if available.

---

### 5.4 End Trip — Community Report Prompt

Appears only when end-trip GPS places the car inside a known structure boundary.

```
Help other drivers
Pacific Centre Parkade · 700 W Georgia St

[GPS pre-fill shown: Level 3 detected · Signal good]

Confirm floor:   [ P1 ]  [ P2 ]  [P3 ✓]  [ P4/Roof ]

Lot status now:  [ Open ✓ ]  [ Partial ]  [ Closed ]

Barrier-free entry  [toggle]
Elevator working    [toggle]

[ Submit — earn 5 min free driving ]
```

The prompt is dismissible. Dismissal after two consecutive dismissals suppresses the prompt for 30 days for that driver.

---

## 6. Data Model

### 6.1 Entities

#### `parking_structure`

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `name` | string | e.g. "Pacific Centre Parkade" |
| `operator` | string | e.g. "Impark", "REEF", "City of Vancouver" |
| `address` | string | Street address |
| `entrance_lat` | float | Latitude of primary vehicle entrance |
| `entrance_lng` | float | Longitude of primary vehicle entrance |
| `boundary_geojson` | JSON | Polygon defining the lot boundary (for geofencing) |
| `ground_elevation_m` | float | Baseline GPS altitude at ground level (for floor detection) |
| `floor_height_m` | float | Approximate height per floor (default 3.2m) |
| `total_floors` | int | Total number of levels |
| `has_rooftop` | boolean | Whether rooftop level exists |
| `hours_json` | JSON | Operating hours per day of week |
| `barrier_free_entry` | boolean | No ticket/card needed |
| `verified_at` | timestamp | When Evo ops last confirmed this record |

#### `parking_report`

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `structure_id` | UUID | FK → `parking_structure` |
| `driver_id` | UUID | FK → Evo driver account |
| `reported_floor` | int | Floor number as confirmed by driver |
| `lot_status` | enum | `open`, `partial`, `closed` |
| `barrier_free` | boolean | Reported entry status |
| `elevator_working` | boolean | Reported elevator status |
| `gps_altitude_m` | float | Raw GPS altitude at time of report |
| `gps_floor_estimate` | int | System-calculated floor from GPS |
| `driver_correction` | boolean | Whether driver changed the GPS estimate |
| `created_at` | timestamp | Report timestamp |
| `trip_id` | UUID | FK → the Evo trip that generated this report |

#### `floor_trust_state`

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `structure_id` | UUID | FK → `parking_structure` |
| `floor` | int | Floor number |
| `trust_tier` | enum | `gps_estimated`, `driver_report`, `community_verified`, `evo_verified` |
| `confirmed_floor` | int | The agreed-upon floor number |
| `report_count` | int | Number of matching reports at this tier |
| `last_report_at` | timestamp | Most recent contributing report |
| `ops_verified_at` | timestamp | When Evo ops last reviewed (nullable) |
| `is_closed` | boolean | Whether this floor is currently closed |

#### `evo_vehicle_park_event`

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `vehicle_id` | UUID | FK → Evo vehicle |
| `trip_id` | UUID | FK → Evo trip |
| `structure_id` | UUID | FK → `parking_structure` (nullable if not in structure) |
| `gps_lat` | float | GPS latitude at park |
| `gps_lng` | float | GPS longitude at park |
| `gps_altitude_m` | float | GPS altitude at park |
| `gps_floor_estimate` | int | Calculated floor (nullable if GPS unreliable) |
| `gps_signal_quality` | enum | `good`, `degraded`, `lost` |
| `parked_at` | timestamp | Timestamp of engine off |

---

### 6.2 Key Relationships

```
parking_structure
    │
    ├──< parking_report (many reports per structure)
    │
    ├──< floor_trust_state (one per floor per structure)
    │
    └──< evo_vehicle_park_event (many events per structure)

parking_report
    └── trip_id → evo_vehicle_park_event (one report per trip)
```

---

## 7. Trust Pipeline

### Trust Tiers (ordered lowest → highest)

| Tier | Label in app | Trigger condition | Badge color |
|---|---|---|---|
| `gps_estimated` | Unverified | Car's GPS altitude parsed to floor on park | Amber |
| `driver_report` | Community | Single driver confirms or corrects floor | Blue |
| `community_verified` | Verified ✓ | 3 or more reports agree on same floor | Teal |
| `evo_verified` | Evo verified | Evo ops team manually reviews and confirms | Green |

### Upgrade Logic

```
gps_estimated
    │
    └── any driver submits report for this structure/floor
        │
        ▼
    driver_report
        │
        └── report_count >= 3 AND majority agree on same floor
            │
            ▼
        community_verified
            │
            └── Evo ops team reviews via internal dashboard
                │
                ▼
            evo_verified
```

### Conflict Resolution

When reports disagree on floor:
1. Weight by recency — reports older than 90 days count as 0.5
2. Weight by GPS signal quality — `good` = 1.0, `degraded` = 0.7, `lost` = 0.3
3. If weighted majority floor != GPS estimate, flag for ops review rather than auto-promote
4. Display the most common recent floor with `Unverified` badge until resolved

### Downgrade Path

If a lot undergoes structural changes (confirmed by ops):
1. Ops sets `floor_trust_state.trust_tier = 'gps_estimated'` for affected floors
2. `ops_verified_at` is nulled
3. Community report prompt re-activates for that structure
4. Old reports older than the change date are excluded from future consensus

---

## 8. GPS Floor Detection

### Algorithm

```
floor_estimate = round((gps_altitude_m - structure.ground_elevation_m) / structure.floor_height_m) + 1
```

Example:
- Structure ground elevation: 14.0m ASL
- Car GPS altitude: 23.4m
- Floor height: 3.2m
- Calculation: `round((23.4 - 14.0) / 3.2) + 1 = round(2.9375) + 1 = 3 + 1 = 4`
- Result: P4

### Signal Quality Classification

| Condition | Quality | Floor estimate used? |
|---|---|---|
| Altitude variance < 2m over 10s | `good` | Yes |
| Altitude variance 2–5m | `degraded` | Yes, with lower weight |
| No GPS fix OR variance > 5m | `lost` | No — show "floor unknown" |

### Known Limitations

- Underground structures (P-1, P-2 etc.) lose GPS signal. Floor detection is unreliable below ground level. For underground lots: rely entirely on community reports. Show `Unverified` badge with note "Underground — GPS unavailable."
- Open-air rooftop lots perform best. GPS is clearest at elevation.
- Initial `ground_elevation_m` per structure must be calibrated from a known park event or surveyed manually by ops.

---

## 9. Edge Cases

### 9.1 Lot Closes During Active Reservation

**Trigger:** `lot_closing_time - now <= 30 min` fires after a reservation has already been made.

**Behaviour:**
- Push notification sent: "Heads up — your lot closes in 30 min"
- Reservation screen shows warning banner (amber)
- "Switch car" option offered with fee waived
- If user ignores and lot closes before they arrive: reservation is not automatically cancelled — user is responsible

**System rule:** Evo does not cancel reservations on behalf of users due to lot closure. The alert is advisory only.

---

### 9.2 GPS Floor Estimate Conflicts with Driver Report

**Scenario:** GPS says P3, driver reports P2.

**Behaviour:**
- Driver report takes precedence for display
- GPS estimate is stored in `gps_floor_estimate` for future calibration
- `driver_correction = true` is flagged on the report
- After 3 consistent driver corrections that differ from GPS, the `ground_elevation_m` or `floor_height_m` for the structure is flagged for ops recalibration

---

### 9.3 New Parking Structure Not in Database

**Trigger:** Car parks inside a boundary not matching any known `parking_structure`.

**Behaviour:**
- End trip community prompt is suppressed (no structure to report against)
- Park event is logged with `structure_id = null`
- If 5 or more park events cluster in the same GPS polygon, the system flags the location for ops to review and add as a new structure

---

### 9.4 Lot Partially Open (Some Floors Closed)

**Trigger:** A driver reports a specific floor as closed.

**Behaviour:**
- `floor_trust_state.is_closed = true` for that floor (single report, not verified)
- In the floor level strip UI, the closed floor is greyed out with a lock icon
- Displayed with `Community` badge (one report — not yet verified)
- After 2 or more reports agree a floor is closed, it is shown with `Verified ✓`

---

### 9.5 Car at Ground Level (P1) — GPS Ambiguity

GPS altitude at ground level is often indistinguishable from street level. P1 may read as 0 floors above ground.

**Behaviour:**
- Floor estimate returns P1 if altitude >= ground and < ground + floor_height
- Displayed as "Ground level" rather than "P1" in UI to reduce confusion

---

## 10. Driver Incentive Model

### Report Reward

- **5 minutes of free driving credit** per accepted community report
- "Accepted" means: report is not flagged as spam and does not conflict with a strong existing consensus
- Reward is applied to the driver's account within 24 hours of report submission
- Maximum 3 rewards per driver per calendar day (to prevent farming)

### Anti-Gaming Rules

- Reports submitted within 60 seconds of end trip are accepted (genuine)
- Reports submitted more than 10 minutes after end trip are rejected (driver has left the scene)
- Drivers who consistently report floors that conflict with consensus are flagged and their reports are downweighted
- Each driver can submit at most 1 report per trip (enforced via `trip_id` unique constraint on `parking_report`)

---

## 11. Constraints and Open Questions

### Technical Constraints

- GPS altitude accuracy: ±5m typical on iOS/Android. Floor height of 3.2m means adjacent floors can be confused. Mitigated by weighting and community confirmation.
- Underground GPS: no reliable altitude data below grade. Community-only data for underground lots.
- Lot boundary geofencing: requires accurate polygons per structure. Initial dataset needs to be populated manually or sourced from a parking operator API (Impark, REEF, City of Vancouver Open Data).
- Phase 2 navigation (within-lot level guide) requires the Evo app to regain foreground focus after Maps. iOS background-to-foreground app transitions require a deep link or push notification trigger.

### Parking Operator Data

Evo does not currently have API access to real-time lot status from operators. Two paths:

1. **Community-driven only** (this project): hours are stored in the database from manual entry or open data sources. Real-time open/closed is community-reported.
2. **Operator API integration** (future): Impark and REEF both have partner APIs. Evo could negotiate access for real-time occupancy and closure data.

### Open Questions

| Question | Status |
|---|---|
| How does Phase 2 nav (app foreground regain) work on iOS 17+? | Needs iOS eng spike |
| What is the minimum GPS altitude variance threshold for `good` signal quality? | Needs field testing |
| Who owns the ops dashboard for reviewing flagged structures and conflicts? | Needs product owner assignment |
| What is the SLA for ops to respond to a structure flagged for review? | Not defined |
| Should the closing alert fire at 30 min or earlier (e.g. 45 min) to account for transit time? | UX research needed |
| How should underground-only lots (all levels below grade) be handled at launch? | Recommendation: show "GPS unavailable · community data only" banner |

---

*Last updated: May 2026. Maintained by product / engineering. Contact: [project owner TBD]*
