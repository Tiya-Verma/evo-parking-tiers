-- Evo Parking Navigation — PostgreSQL schema for §6 entities.
-- Source of truth: evo-parking-architecture.md §6 (entities) and §10 (constraints).
--
-- External references (driver_id, trip_id, vehicle_id) point at tables owned by
-- the rest of the Evo platform and are intentionally not declared as foreign keys
-- here. They are typed as UUID and indexed so queries from this schema stay fast.
--
-- Conventions:
--   - timestamptz everywhere; UTC at rest, zone applied at display
--   - double precision for GPS coords/altitudes (GPS needs >=7 decimal places)
--   - gen_random_uuid() from pgcrypto for primary keys
--   - PostGIS used only for geofence and clustering queries; canonical lat/lng
--     and boundary_geojson columns are preserved per §6 field list.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS postgis;

-- §6.1 enum values.
CREATE TYPE lot_status AS ENUM ('open', 'partial', 'closed');
CREATE TYPE trust_tier AS ENUM (
    'gps_estimated',
    'driver_report',
    'community_verified',
    'evo_verified'
);
CREATE TYPE gps_signal_quality AS ENUM ('good', 'degraded', 'lost');


-- =============================================================================
-- parking_structure  (§6.1)
-- =============================================================================
CREATE TABLE parking_structure (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                TEXT        NOT NULL,
    operator            TEXT        NOT NULL,
    address             TEXT        NOT NULL,
    entrance_lat        DOUBLE PRECISION NOT NULL,
    entrance_lng        DOUBLE PRECISION NOT NULL,
    boundary_geojson    JSONB       NOT NULL,
    ground_elevation_m  DOUBLE PRECISION NOT NULL,
    floor_height_m      DOUBLE PRECISION NOT NULL DEFAULT 3.2,  -- §6.1 default
    total_floors        INTEGER     NOT NULL CHECK (total_floors > 0),
    has_rooftop         BOOLEAN     NOT NULL DEFAULT FALSE,
    hours_json          JSONB       NOT NULL,
    barrier_free_entry  BOOLEAN     NOT NULL DEFAULT FALSE,
    verified_at         TIMESTAMPTZ,

    CONSTRAINT entrance_lat_valid CHECK (entrance_lat BETWEEN -90 AND 90),
    CONSTRAINT entrance_lng_valid CHECK (entrance_lng BETWEEN -180 AND 180)
);

-- Derived geometry columns for spatial queries. Kept in sync via trigger so the
-- §6 JSON column stays canonical. boundary stored as geography(POLYGON) for
-- distance-correct geofence containment per §4 (~50m geofence) and §9.3 cluster
-- detection.
ALTER TABLE parking_structure
    ADD COLUMN entrance_point geography(POINT, 4326)
        GENERATED ALWAYS AS (
            ST_SetSRID(ST_MakePoint(entrance_lng, entrance_lat), 4326)::geography
        ) STORED,
    ADD COLUMN boundary geography(POLYGON, 4326);

CREATE OR REPLACE FUNCTION parking_structure_sync_boundary()
RETURNS TRIGGER AS $$
BEGIN
    NEW.boundary := ST_SetSRID(ST_GeomFromGeoJSON(NEW.boundary_geojson::text), 4326)::geography;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER parking_structure_boundary_sync
    BEFORE INSERT OR UPDATE OF boundary_geojson ON parking_structure
    FOR EACH ROW EXECUTE FUNCTION parking_structure_sync_boundary();

CREATE INDEX parking_structure_entrance_gix ON parking_structure USING GIST (entrance_point);
CREATE INDEX parking_structure_boundary_gix ON parking_structure USING GIST (boundary);


-- =============================================================================
-- parking_report  (§6.1, constraint from §10)
-- =============================================================================
CREATE TABLE parking_report (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    structure_id        UUID        NOT NULL REFERENCES parking_structure(id) ON DELETE RESTRICT,
    driver_id           UUID        NOT NULL,  -- FK → external Evo driver
    reported_floor      INTEGER     NOT NULL,
    lot_status          lot_status  NOT NULL,
    barrier_free        BOOLEAN     NOT NULL,
    elevator_working    BOOLEAN     NOT NULL,
    gps_altitude_m      DOUBLE PRECISION NOT NULL,
    gps_floor_estimate  INTEGER,
    driver_correction   BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    trip_id             UUID        NOT NULL,  -- FK → external Evo trip

    -- §10: "Each driver can submit at most 1 report per trip
    -- (enforced via trip_id unique constraint on parking_report)"
    CONSTRAINT parking_report_trip_id_key UNIQUE (trip_id)
);

-- Consensus and conflict-resolution queries from §7 read recent reports for a
-- given structure and floor; this index covers them in one pass.
CREATE INDEX parking_report_structure_floor_recent_idx
    ON parking_report (structure_id, reported_floor, created_at DESC);

-- Anti-gaming queries from §10 ("max 3 rewards per driver per calendar day",
-- "drivers who consistently report floors that conflict with consensus").
CREATE INDEX parking_report_driver_created_idx
    ON parking_report (driver_id, created_at DESC);

-- §9.2 recalibration trigger: "after 3 consistent driver corrections that differ
-- from GPS". Partial index keeps it cheap by skipping the common case.
CREATE INDEX parking_report_corrections_idx
    ON parking_report (structure_id, created_at DESC)
    WHERE driver_correction = TRUE;


-- =============================================================================
-- floor_trust_state  (§6.1)
-- =============================================================================
CREATE TABLE floor_trust_state (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    structure_id        UUID        NOT NULL REFERENCES parking_structure(id) ON DELETE CASCADE,
    floor               INTEGER     NOT NULL,
    trust_tier          trust_tier  NOT NULL DEFAULT 'gps_estimated',
    confirmed_floor     INTEGER     NOT NULL,
    report_count        INTEGER     NOT NULL DEFAULT 0 CHECK (report_count >= 0),
    last_report_at      TIMESTAMPTZ,
    ops_verified_at     TIMESTAMPTZ,
    is_closed           BOOLEAN     NOT NULL DEFAULT FALSE,

    -- §6.2 relationship diagram: one floor_trust_state per floor per structure.
    CONSTRAINT floor_trust_state_structure_floor_key UNIQUE (structure_id, floor)
);

-- Hot read path for §5.1 (rendering the floor-level strip): all floors for a
-- given structure in floor order. The UNIQUE index above already covers point
-- lookups, so no additional index needed for that pattern.


-- =============================================================================
-- evo_vehicle_park_event  (§6.1)
-- =============================================================================
CREATE TABLE evo_vehicle_park_event (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id          UUID        NOT NULL,  -- FK → external Evo vehicle
    trip_id             UUID        NOT NULL,  -- FK → external Evo trip
    structure_id        UUID            REFERENCES parking_structure(id) ON DELETE SET NULL,
    gps_lat             DOUBLE PRECISION NOT NULL,
    gps_lng             DOUBLE PRECISION NOT NULL,
    gps_altitude_m      DOUBLE PRECISION NOT NULL,
    gps_floor_estimate  INTEGER,                          -- nullable per §6.1
    gps_signal_quality  gps_signal_quality NOT NULL,
    parked_at           TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT park_event_lat_valid CHECK (gps_lat BETWEEN -90 AND 90),
    CONSTRAINT park_event_lng_valid CHECK (gps_lng BETWEEN -180 AND 180)
);

-- Derived point column to support the unknown-structure clustering check in §9.3
-- ("5 or more park events cluster in the same GPS polygon").
ALTER TABLE evo_vehicle_park_event
    ADD COLUMN gps_point geography(POINT, 4326)
        GENERATED ALWAYS AS (
            ST_SetSRID(ST_MakePoint(gps_lng, gps_lat), 4326)::geography
        ) STORED;

-- §6.2: many park events per structure. Includes parked_at for the common
-- "recent park events for this lot" sort.
CREATE INDEX park_event_structure_parked_idx
    ON evo_vehicle_park_event (structure_id, parked_at DESC);

-- §6.2: park_event ←→ parking_report join via trip_id.
CREATE INDEX park_event_trip_idx
    ON evo_vehicle_park_event (trip_id);

CREATE INDEX park_event_vehicle_parked_idx
    ON evo_vehicle_park_event (vehicle_id, parked_at DESC);

-- §9.3 clustering: only park events with no known structure are candidates,
-- so a partial GIST index keeps the index small and the cluster query fast.
CREATE INDEX park_event_unknown_structure_gix
    ON evo_vehicle_park_event USING GIST (gps_point)
    WHERE structure_id IS NULL;


COMMIT;
