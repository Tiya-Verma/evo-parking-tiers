"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { CheckCircle2 } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { CarDetailSheet } from "@/components/CarDetailSheet";
import { ClosingAlert } from "@/components/ClosingAlert";
import { NavOverlay } from "@/components/NavOverlay";
import { EndTripReport } from "@/components/EndTripReport";
import { DemoHud } from "@/components/DemoHud";
import { CARS, getStructure, minutesUntilClose } from "@/lib/data";
import type { Stage } from "./types";

// MapLibre touches `window` on import — load it client-only.
const Map = dynamic(() => import("@/components/Map").then((m) => m.Map), { ssr: false });

const FEATURED_CAR_ID = "EVO-7KLP"; // the demo flow centers on this car

export default function Page() {
  const [selectedCarId, setSelectedCarId] = useState<string | null>(FEATURED_CAR_ID);
  const [stage, setStage] = useState<Stage>("map");
  const [toast, setToast] = useState<string | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // Drive theme tokens via a `data-theme` attribute on <html>; globals.css
  // maps that attribute to the CSS-variable palette consumed by Tailwind.
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const selectedCar = useMemo(
    () => CARS.find((c) => c.id === selectedCarId) ?? null,
    [selectedCarId],
  );
  const selectedStructure = selectedCar ? getStructure(selectedCar.structureId) : null;

  // Drive the demo from a single source — clicking the HUD jumps state.
  function jumpTo(next: Stage) {
    setStage(next);
    if (next !== "map" && !selectedCarId) setSelectedCarId(FEATURED_CAR_ID);
  }

  function selectCar(id: string) {
    setSelectedCarId(id);
    setStage("detail");
  }

  function reserve() {
    if (!selectedStructure) {
      // Street-parked: no closing alert, jump straight to navigating.
      setStage("navigating");
      flashToast("Reserved — 30 min hold");
      return;
    }
    const minutesLeft = minutesUntilClose(selectedStructure);
    if (minutesLeft !== Infinity && minutesLeft <= 30) {
      setStage("closing");
    } else {
      setStage("navigating");
      flashToast("Reserved — 30 min hold");
    }
  }

  function flashToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  // Camera focus is the lot entrance when navigating/arrived.
  const focusLat = stage === "arrived" || stage === "navigating" ? selectedStructure?.entranceLat : undefined;
  const focusLng = stage === "arrived" || stage === "navigating" ? selectedStructure?.entranceLng : undefined;

  return (
    <PhoneFrame>
      <div className="absolute inset-0 bg-evo-canvas">
        <Map
          cars={CARS}
          selectedCarId={selectedCarId}
          onSelectCar={selectCar}
          focusLat={focusLat}
          focusLng={focusLng}
          theme={theme}
        />

        <DemoHud
          stage={stage}
          setStage={jumpTo}
          theme={theme}
          onToggleTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
        />

        {/* Stage 4: Phase 1 maps handoff — represented as a slim banner since
            real handoff opens Apple/Google Maps. We surface what was passed. */}
        {stage === "navigating" && selectedStructure && (
          <div className="absolute top-14 inset-x-3 z-30 rounded-2xl bg-evo-canvas/95 backdrop-blur-md ring-1 ring-evo-line shadow-card p-3 fade-in">
            <div className="text-[10px] uppercase tracking-widest text-evo-lime font-semibold">
              Routing to lot entrance
            </div>
            <div className="text-sm font-medium mt-0.5">{selectedStructure.name}</div>
            <div className="text-[11px] text-evo-mute mt-0.5">
              Maps opened with entrance coords ({selectedStructure.entranceLat.toFixed(4)},{" "}
              {selectedStructure.entranceLng.toFixed(4)}) — not the street centroid.
            </div>
            <button
              type="button"
              onClick={() => setStage("arrived")}
              className="mt-2 w-full rounded-xl bg-evo-lime text-evo-ink text-xs font-semibold py-2 hover:bg-evo-limeDark transition"
            >
              Simulate arrival at lot
            </button>
          </div>
        )}

        {/* Stage 5: Phase 2 in-lot guidance */}
        {stage === "arrived" && selectedStructure && selectedCar && (
          <NavOverlay
            structure={selectedStructure}
            car={selectedCar}
            onHorn={() => flashToast("Horn sounded at vehicle")}
            onArrive={() => {
              flashToast("Unlocked — trip started");
              setStage("endtrip");
            }}
          />
        )}

        {/* Stage 2: car detail sheet (always renders when stage === detail) */}
        {stage === "detail" && selectedCar && (
          <CarDetailSheet
            car={selectedCar}
            onClose={() => setStage("map")}
            onReserve={reserve}
          />
        )}

        {/* Stage 3: closing alert (§5.2) */}
        {stage === "closing" && selectedStructure && (
          <ClosingAlert
            structure={selectedStructure}
            onSwitch={(alt) => {
              setSelectedCarId(alt.id);
              setStage("detail");
              flashToast("Reservation switched — fee waived");
            }}
            onProceed={() => {
              setStage("navigating");
              flashToast("Reservation kept — alert is advisory only");
            }}
            onDismiss={() => setStage("detail")}
          />
        )}

        {/* Stage 6: end-trip community report (§5.4) */}
        {stage === "endtrip" && selectedStructure && selectedCar && (
          <EndTripReport
            structure={selectedStructure}
            gpsFloorEstimate={selectedCar.floor ?? 1}
            onSubmit={() => {
              flashToast("Report submitted — 5 min credit on the way");
              setStage("map");
            }}
            onDismiss={() => setStage("map")}
          />
        )}

        {/* Transient toast */}
        {toast && (
          <div className="absolute top-[68px] left-1/2 -translate-x-1/2 z-50 fade-in">
            <div className="rounded-full bg-evo-lime text-evo-ink text-xs font-semibold px-3 py-1.5 shadow-lg flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {toast}
            </div>
          </div>
        )}
      </div>
    </PhoneFrame>
  );
}
