"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { CheckCircle2, Navigation2 } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { CarDetailSheet } from "@/components/CarDetailSheet";
import { ClosingAlert } from "@/components/ClosingAlert";
import { NavOverlay } from "@/components/NavOverlay";
import { EndTripReport } from "@/components/EndTripReport";
import { CueCallout } from "@/components/CueCallout";
import { EvoTopBar, EvoSideButtons, EvoTabBar } from "@/components/EvoChrome";
import { CARS, getStructure, minutesUntilClose } from "@/lib/data";
import { CueContext, cueRing, type CueId } from "@/lib/cue";
import { stepsFor } from "@/lib/demo-script";
import type { Stage } from "./types";
import type { Map as MapHandle } from "maplibre-gl";

// MapLibre touches `window` on import — load it client-only.
const Map = dynamic(() => import("@/components/Map").then((m) => m.Map), { ssr: false });

const FEATURED_CAR_ID = "EVO-7KLP"; // the demo flow centers on this car

// Where "Back" in the guide rewinds to, one stage at a time.
const PREVIOUS_STAGE: Partial<Record<Stage, Stage>> = {
  detail: "map",
  closing: "detail",
  navigating: "detail",
  arrived: "navigating",
  endtrip: "arrived",
};

export default function Page() {
  const [selectedCarId, setSelectedCarId] = useState<string | null>(FEATURED_CAR_ID);
  const [stage, setStage] = useState<Stage>("map");
  const [toast, setToast] = useState<string | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">("light");

  // Guided-demo state. `stepIndex` is the position *within* the current
  // stage's step group — the stage itself is the coarse progress, so the demo
  // re-syncs automatically whenever the user drives the app directly.
  const [stepIndex, setStepIndex] = useState(0);
  // Once off, the demo stays off for the rest of the session — it is only
  // turned back on by an explicit tap on the guide button, or a page reload.
  // Reaching the end of the flow counts as finishing it.
  const [demoOff, setDemoOff] = useState(false);

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
  const inStructure = Boolean(selectedStructure);

  const steps = useMemo(() => stepsFor(stage, inStructure), [stage, inStructure]);

  // A stage change restarts its step group. `pendingStep` lets "Back" land on
  // the *last* step of the stage it rewinds into rather than the first.
  const pendingStep = useRef<number | null>(null);
  useEffect(() => {
    const target = pendingStep.current;
    pendingStep.current = null;
    setStepIndex(target === -1 ? Math.max(0, steps.length - 1) : (target ?? 0));
  }, [stage, inStructure, steps.length]);

  const step = steps[Math.min(stepIndex, steps.length - 1)];
  const activeCue: CueId | null = demoOff ? null : (step?.cue ?? null);

  // Called by a control whose tap doesn't move the app to another stage, so
  // the demo would otherwise have no way to know the step was completed.
  const advance = useCallback(
    (from: CueId) => {
      if (from !== step?.cue) return;
      setStepIndex((i) => Math.min(i + 1, steps.length - 1));
    },
    [step?.cue, steps.length],
  );

  const cueValue = useMemo(() => ({ cue: activeCue, advance }), [activeCue, advance]);

  // The callout positions itself against this element, and re-measures on the
  // map's render event so it tracks a pinned marker exactly.
  const viewportRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<MapHandle | null>(null);

  function restartDemo() {
    pendingStep.current = 0;
    setSelectedCarId(FEATURED_CAR_ID);
    setStage("map");
    setStepIndex(0);
    setDemoOff(false);
  }

  function selectCar(id: string) {
    setSelectedCarId(id);
    setStage("detail");
  }

  function reserve() {
    if (!selectedStructure) {
      // Street-parked: nothing for the parking layer to add — drop the user
      // back to the map with a confirmation toast. The real app would hand
      // off to Apple/Google Maps here.
      setStage("map");
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

  // The floating utility stack hides whenever a sheet owns the lower screen,
  // so it never lands on top of sheet content.
  const chromeVisible = stage === "map" || stage === "navigating";

  // Camera focus is the lot entrance when navigating/arrived.
  const focusLat = stage === "arrived" || stage === "navigating" ? selectedStructure?.entranceLat : undefined;
  const focusLng = stage === "arrived" || stage === "navigating" ? selectedStructure?.entranceLng : undefined;

  return (
    <PhoneFrame>
      <CueContext.Provider value={cueValue}>
        <div ref={viewportRef} className="absolute inset-0 bg-evo-canvas">
          <Map
            cars={CARS}
            selectedCarId={selectedCarId}
            onSelectCar={selectCar}
            focusLat={focusLat}
            focusLng={focusLng}
            theme={theme}
            cueCarId={activeCue === "car-pin" ? FEATURED_CAR_ID : null}
            onReady={setMapInstance}
          />

          {/* Real Evo app chrome — top segmented control, floating utility
              buttons, bottom tab bar. Laid out as a flow column so a banner
              appearing between them pushes the stack down rather than landing
              on top of it, and inset below the guide card. */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-30 flex flex-col gap-2 px-gutter"
            style={{ paddingTop: "var(--safe-top)" }}
          >
            <EvoTopBar />

            {/* Stage 4: Phase 1 maps handoff — represented as a banner since
                real handoff opens Apple/Google Maps. We surface what was
                passed across. */}
            {stage === "navigating" && selectedStructure && (
              <div className="fade-in pointer-events-auto rounded-2xl bg-evo-canvas/90 p-3 shadow-card backdrop-blur-xl">
                <div className="flex items-center gap-1.5 text-caption2 font-semibold uppercase tracking-widest text-evo-limeDark">
                  <Navigation2 className="h-3 w-3" aria-hidden />
                  Routing to lot entrance
                </div>
                <div className="mt-0.5 text-subhead font-medium text-evo-text">
                  {selectedStructure.name}
                </div>
                <p className="mt-0.5 text-caption2 text-evo-mute">
                  Maps opened with entrance coords ({selectedStructure.entranceLat.toFixed(4)},{" "}
                  {selectedStructure.entranceLng.toFixed(4)}) — not the street centroid.
                </p>
                <button
                  type="button"
                  data-cue="simulate-arrival"
                  onClick={() => setStage("arrived")}
                  className={`mt-2.5 min-h-tap w-full rounded-xl bg-evo-lime text-footnote font-bold text-evo-onAccent transition hover:bg-evo-limeDark ${cueRing(activeCue === "simulate-arrival")}`}
                >
                  Simulate arrival at lot
                </button>
              </div>
            )}

            {chromeVisible && (
              <EvoSideButtons
                theme={theme}
                onToggleTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
                  guideHidden={demoOff}
                onToggleGuide={() => (demoOff ? restartDemo() : setDemoOff(true))}
              />
            )}
          </div>

          {/* Tab bar hides when a full-bleed modal sheet is up so the sheet can
              sit flush at the bottom edge. */}
          {(stage === "map" || stage === "detail" || stage === "navigating") && <EvoTabBar />}

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

          {/* Stage 2: car detail sheet */}
          {stage === "detail" && selectedCar && (
            <CarDetailSheet car={selectedCar} onClose={() => setStage("map")} onReserve={reserve} />
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
                setDemoOff(true);
              }}
              onDismiss={() => {
                setStage("map");
                // §5.4 lets the driver skip the report; either way they have
                // now been through the whole flow, so the tour is done.
                setDemoOff(true);
              }}
            />
          )}

          {/* Transient toast, pinned under the top bar. */}
          {toast && (
            <div
              className="fade-in pointer-events-none absolute inset-x-0 z-40 flex justify-center"
              style={{ top: "var(--content-top)" }}
            >
              <div className="flex items-center gap-1.5 rounded-full bg-evo-lime px-3 py-1.5 text-caption1 font-semibold text-evo-onAccent shadow-card">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                {toast}
              </div>
            </div>
          )}

          {/* Guided demo: a small pointer anchored to the control to tap next. */}
          {activeCue && step && (
            <CueCallout
              cue={activeCue}
              text={step.text}
              placement={step.placement}
              containerRef={viewportRef}
              renderSource={mapInstance}
              onDismiss={() => setDemoOff(true)}
            />
          )}
        </div>
      </CueContext.Provider>
    </PhoneFrame>
  );
}
