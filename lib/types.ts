// TypeScript types mirroring the §6 data model in evo-parking-architecture.md.
// Trimmed to the fields the prototype actually renders — server-side fields
// like driver_id, trip_id, gps_signal_quality are omitted from the client view
// where they don't drive UI.

export type LotStatus = "open" | "partial" | "closed";

export type TrustTier =
  | "gps_estimated"
  | "driver_report"
  | "community_verified"
  | "evo_verified";

export interface OperatingHours {
  // Day-of-week index (0 = Sunday) → "HH:MM" open/close, or null if 24h/closed.
  [day: number]: { open: string; close: string } | "24h" | "closed";
}

export interface ParkingStructure {
  id: string;
  name: string;
  operator: string;
  address: string;
  entranceLat: number;
  entranceLng: number;
  groundElevationM: number;
  floorHeightM: number;
  totalFloors: number;
  hasRooftop: boolean;
  hours: OperatingHours;
  barrierFreeEntry: boolean;
  verifiedAt: string | null;
  // Per-floor trust state (one row per floor per structure, per §6.2).
  floorTrust: Record<number, FloorTrustState>;
  // Step-by-step access instructions for §5.1 ("max 3 steps").
  accessSteps: string[];
  // True for underground-only lots (§8/§11 — GPS unavailable, community-only).
  underground?: boolean;
}

export interface FloorTrustState {
  floor: number;
  trustTier: TrustTier;
  isClosed: boolean;
}

export type FuelType = "gas" | "ev";

export interface EvoCar {
  id: string;
  plate: string;
  model: string;
  fuelType: FuelType;
  fuelPct: number;
  // Surface lat/lng. For in-structure cars this is the structure entrance.
  lat: number;
  lng: number;
  // Null for street-parked cars (§3: parking layer is invisible for those).
  structureId: string | null;
  // Reported floor for cars inside a structure; null otherwise.
  floor: number | null;
  // Section/stall hint from §5.3 ("Section C · Stall approx. 3C-14").
  stallHint: string | null;
}

export interface NearbyAlternative {
  id: string;
  plate: string;
  model: string;
  walkingMinutes: number;
  // Filter rule from §5.2: "street parking OR lots with closing time > 2 hours".
  context: "street" | "long_open_lot";
}
