// Demo-only state machine for the prototype. Stages map to §4 flow steps.
export type Stage =
  | "map"          // 1. browsing the map
  | "detail"       // 2. tapped a car, car detail sheet visible (§5.1)
  | "closing"      // 3. reservation triggered closing alert (§5.2)
  | "navigating"   // 4. routing to the lot (Phase 1 maps handoff in §5.3)
  | "arrived"      // 5. inside the geofence — in-lot guidance (§5.3 Phase 2)
  | "endtrip";     // 6. end-trip community report (§5.4)
