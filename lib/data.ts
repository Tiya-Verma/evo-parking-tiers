// Seed data — three real Vancouver parking structures plus a mix of cars.
// Coordinates are accurate to the parkade entrances for realism in a pitch demo.

import type { EvoCar, NearbyAlternative, ParkingStructure } from "./types";

// Demo clock — pinned to a deterministic Friday evening so the §5.2 closing
// alert reliably fires for Pacific Centre. Real production clock would use
// `new Date()`; the prototype uses this constant everywhere it needs "now".
export const DEMO_NOW = new Date("2026-05-22T22:47:00-07:00");

const open24 = { open: "00:00", close: "24:00" };

export const STRUCTURES: Record<string, ParkingStructure> = {
  pacific_centre: {
    id: "pacific_centre",
    name: "Pacific Centre Parkade",
    operator: "Impark",
    address: "700 W Georgia St, Vancouver",
    entranceLat: 49.2826,
    entranceLng: -123.1187,
    groundElevationM: 14.0,
    floorHeightM: 3.2,
    totalFloors: 4,
    hasRooftop: true,
    hours: {
      0: { open: "08:00", close: "22:00" },
      1: { open: "06:00", close: "23:00" },
      2: { open: "06:00", close: "23:00" },
      3: { open: "06:00", close: "23:00" },
      4: { open: "06:00", close: "23:00" },
      5: { open: "06:00", close: "23:00" },
      6: { open: "08:00", close: "23:00" },
    },
    barrierFreeEntry: false,
    verifiedAt: "2026-04-12T00:00:00Z",
    floorTrust: {
      1: { floor: 1, trustTier: "evo_verified", isClosed: false },
      2: { floor: 2, trustTier: "community_verified", isClosed: false },
      3: { floor: 3, trustTier: "community_verified", isClosed: false },
      4: { floor: 4, trustTier: "driver_report", isClosed: true },
    },
    accessSteps: [
      "Enter via Howe St between Georgia and Dunsmuir",
      "Take the elevator from P-floor lobby to Level 3",
      "Walk past Section B toward the south wall",
    ],
  },
  robson: {
    id: "robson",
    name: "Robson Parkade",
    operator: "City of Vancouver",
    address: "777 Robson St, Vancouver",
    entranceLat: 49.2826,
    entranceLng: -123.1209,
    groundElevationM: 12.5,
    floorHeightM: 3.0,
    totalFloors: 5,
    hasRooftop: true,
    hours: open24 as never, // placeholder; only used to render "Open 24h" label
    barrierFreeEntry: true,
    verifiedAt: "2026-05-01T00:00:00Z",
    floorTrust: {
      1: { floor: 1, trustTier: "evo_verified", isClosed: false },
      2: { floor: 2, trustTier: "community_verified", isClosed: false },
      3: { floor: 3, trustTier: "driver_report", isClosed: false },
      4: { floor: 4, trustTier: "gps_estimated", isClosed: false },
      5: { floor: 5, trustTier: "gps_estimated", isClosed: false },
    },
    accessSteps: [
      "Enter via Smithe St ramp",
      "Take spiral ramp to Level 2",
      "Section A is on your right after the elevator bank",
    ],
  },
  yaletown_underground: {
    id: "yaletown_underground",
    name: "Mainland St Underground",
    operator: "REEF",
    address: "1101 Mainland St, Vancouver",
    entranceLat: 49.2748,
    entranceLng: -123.1218,
    groundElevationM: 4.0,
    floorHeightM: 3.2,
    totalFloors: 2,
    hasRooftop: false,
    underground: true,
    hours: {
      0: { open: "07:00", close: "23:00" },
      1: { open: "07:00", close: "23:00" },
      2: { open: "07:00", close: "23:00" },
      3: { open: "07:00", close: "23:00" },
      4: { open: "07:00", close: "23:00" },
      5: { open: "07:00", close: "23:00" },
      6: { open: "08:00", close: "23:00" },
    },
    barrierFreeEntry: false,
    verifiedAt: "2026-03-18T00:00:00Z",
    floorTrust: {
      // Underground floors all start as community-reported per §8.
      [-1]: { floor: -1, trustTier: "community_verified", isClosed: false },
      [-2]: { floor: -2, trustTier: "driver_report", isClosed: false },
    },
    accessSteps: [
      "Enter via Mainland St ramp opposite the brewery",
      "Take elevator down to P-2",
      "Section C — barrier-free row, no curb",
    ],
  },
  ubc_north_parkade: {
    id: "ubc_north_parkade",
    name: "UBC North Parkade",
    operator: "UBC Parking Services",
    address: "6115 Student Union Blvd, UBC",
    entranceLat: 49.2685,
    entranceLng: -123.2503,
    groundElevationM: 90.0,
    floorHeightM: 3.0,
    totalFloors: 4,
    hasRooftop: false,
    hours: {
      0: { open: "07:00", close: "23:00" },
      1: { open: "06:00", close: "23:00" },
      2: { open: "06:00", close: "23:00" },
      3: { open: "06:00", close: "23:00" },
      4: { open: "06:00", close: "23:00" },
      5: { open: "06:00", close: "23:00" },
      6: { open: "07:00", close: "23:00" },
    },
    barrierFreeEntry: true,
    verifiedAt: "2026-04-30T00:00:00Z",
    floorTrust: {
      1: { floor: 1, trustTier: "evo_verified", isClosed: false },
      2: { floor: 2, trustTier: "community_verified", isClosed: false },
      3: { floor: 3, trustTier: "driver_report", isClosed: false },
      4: { floor: 4, trustTier: "gps_estimated", isClosed: false },
    },
    accessSteps: [
      "Enter via Student Union Blvd ramp",
      "Take ramp to Level 2",
      "Section B is on your right after the ramp",
    ],
  },
};

// Demo cars. Coordinates roughly match real downtown Vancouver streets.
// `id: "EVO-7KLP"` is the headlining car for the demo flow.
export const CARS: EvoCar[] = [
  {
    id: "EVO-7KLP",
    plate: "EVO · 7KLP",
    model: "2024 Toyota Prius Prime",
    fuelType: "gas",
    fuelPct: 82,
    lat: 49.2826,
    lng: -123.1187,
    structureId: "pacific_centre",
    floor: 3,
    stallHint: "Section C · Stall approx. 3C-14",
  },
  {
    id: "EVO-2QRT",
    plate: "EVO · 2QRT",
    model: "2024 Kia Niro EV",
    fuelType: "ev",
    fuelPct: 64,
    lat: 49.2826,
    lng: -123.1209,
    structureId: "robson",
    floor: 2,
    stallHint: "Section A · near elevator",
  },
  {
    id: "EVO-9MNX",
    plate: "EVO · 9MNX",
    model: "2023 Honda Fit",
    fuelType: "gas",
    fuelPct: 47,
    lat: 49.2748,
    lng: -123.1218,
    structureId: "yaletown_underground",
    floor: -2,
    stallHint: "Section C · barrier-free row",
  },
  {
    id: "EVO-4FGH",
    plate: "EVO · 4FGH",
    model: "2024 Toyota Prius Prime",
    fuelType: "gas",
    fuelPct: 91,
    lat: 49.2789,
    lng: -123.1224,
    structureId: null,
    floor: null,
    stallHint: null,
  },
  {
    id: "EVO-5BCV",
    plate: "EVO · 5BCV",
    model: "2023 Honda Fit",
    fuelType: "gas",
    fuelPct: 38,
    lat: 49.2855,
    lng: -123.1166,
    structureId: null,
    floor: null,
    stallHint: null,
  },
  {
    id: "EVO-8LPK",
    plate: "EVO · 8LPK",
    model: "2024 Kia Niro EV",
    fuelType: "ev",
    fuelPct: 73,
    lat: 49.2812,
    lng: -123.1245,
    structureId: null,
    floor: null,
    stallHint: null,
  },
  // UBC area — mix of structure-parked cars and street parking near campus.
  {
    id: "EVO-3UBC",
    plate: "EVO · 3UBC",
    model: "2024 Toyota Corolla",
    fuelType: "gas",
    fuelPct: 78,
    lat: 49.2685,
    lng: -123.2503,
    structureId: "ubc_north_parkade",
    floor: 2,
    stallHint: "Section B · near Student Union elevator",
  },
  {
    id: "EVO-6WSB",
    plate: "EVO · 6WSB",
    model: "2024 Kia Niro EV",
    fuelType: "ev",
    fuelPct: 55,
    lat: 49.2681,
    lng: -123.2496,
    structureId: "ubc_north_parkade",
    floor: 1,
    stallHint: "Section A · EV stall row 1",
  },
  {
    id: "EVO-1MDR",
    plate: "EVO · 1MDR",
    model: "2024 Toyota Corolla",
    fuelType: "gas",
    fuelPct: 62,
    lat: 49.2627,
    lng: -123.2542,
    structureId: null,
    floor: null,
    stallHint: null,
  },
  {
    id: "EVO-2WMM",
    plate: "EVO · 2WMM",
    model: "2023 Honda Fit",
    fuelType: "gas",
    fuelPct: 41,
    lat: 49.2648,
    lng: -123.2475,
    structureId: null,
    floor: null,
    stallHint: null,
  },
  {
    id: "EVO-7UEL",
    plate: "EVO · 7UEL",
    model: "2024 Toyota Corolla",
    fuelType: "gas",
    fuelPct: 87,
    lat: 49.2671,
    lng: -123.2418,
    structureId: null,
    floor: null,
    stallHint: null,
  },
];

// Alternatives shown when the §5.2 "Switch car" path is taken.
export const NEARBY_ALTERNATIVES: NearbyAlternative[] = [
  { id: "EVO-4FGH", plate: "EVO · 4FGH", model: "Prius Prime", walkingMinutes: 4, context: "street" },
  { id: "EVO-8LPK", plate: "EVO · 8LPK", model: "Niro EV", walkingMinutes: 6, context: "street" },
  { id: "EVO-2QRT", plate: "EVO · 2QRT", model: "Niro EV", walkingMinutes: 8, context: "long_open_lot" },
];

export function getStructure(id: string | null): ParkingStructure | null {
  if (!id) return null;
  return STRUCTURES[id] ?? null;
}

// Minutes until the structure closes today, using DEMO_NOW.
// Returns Infinity for 24-hour lots and negative numbers if already closed.
export function minutesUntilClose(structure: ParkingStructure): number {
  if (structure.hours === (open24 as never)) return Infinity;
  const day = DEMO_NOW.getDay();
  const today = (structure.hours as Record<number, { open: string; close: string } | "24h" | "closed">)[day];
  if (!today || today === "closed") return -1;
  if (today === "24h") return Infinity;
  const [hh, mm] = today.close.split(":").map(Number);
  const close = new Date(DEMO_NOW);
  close.setHours(hh, mm, 0, 0);
  return Math.round((close.getTime() - DEMO_NOW.getTime()) / 60000);
}

export function formatCloseTime(structure: ParkingStructure): string {
  const day = DEMO_NOW.getDay();
  const today = (structure.hours as Record<number, { open: string; close: string } | "24h" | "closed">)[day];
  if (!today || today === "24h") return "Open 24h";
  if (today === "closed") return "Closed today";
  const [hh, mm] = today.close.split(":").map(Number);
  const ampm = hh >= 12 ? "pm" : "am";
  const h12 = ((hh + 11) % 12) + 1;
  return mm === 0 ? `${h12} ${ampm}` : `${h12}:${String(mm).padStart(2, "0")} ${ampm}`;
}
