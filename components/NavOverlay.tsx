"use client";

import { ArrowUp, Volume2, MapPin } from "lucide-react";
import { EvoCar, ParkingStructure } from "@/lib/types";
import { cueRing, useCue } from "@/lib/cue";

interface Props {
  structure: ParkingStructure;
  car: EvoCar;
  onHorn: () => void;
  onArrive: () => void;
}

// §5.3 Phase 2 — triggered when device GPS enters the lot boundary (~50m
// geofence). Evo app surfaces in-lot guidance over the map.
export function NavOverlay({ structure, car, onHorn, onArrive }: Props) {
  const atCarCued = useCue("at-car");
  const floor = car.floor ?? 1;
  const isRoof = structure.hasRooftop && floor === structure.totalFloors;
  const label = isRoof ? "the roof" : `P${floor}`;

  return (
    <div
      className="absolute inset-x-0 bottom-0 z-30 px-3"
      style={{ paddingBottom: "calc(var(--safe-bottom) + 8px)" }}
    >
      <div className="sheet-rise rounded-3xl bg-evo-canvas/95 p-4 shadow-sheet backdrop-blur-xl">
        <div className="flex items-center gap-1.5 text-caption2 font-semibold uppercase tracking-widest text-evo-limeDark">
          <MapPin className="h-3 w-3" aria-hidden />
          You&apos;re at the lot
        </div>
        <div className="mt-1.5 flex items-start gap-3">
          <div className="mt-0.5 shrink-0 rounded-2xl bg-evo-lime/15 p-3">
            <ArrowUp className="h-6 w-6 text-evo-limeDark" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-title3 font-semibold text-evo-text">
              Take ramp or elevator to {label}
            </h2>
            {car.stallHint && <p className="mt-1 text-subhead text-evo-text">{car.stallHint}</p>}
            <p className="mt-1 text-caption1 text-evo-mute">{structure.name}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onHorn}
            className="flex min-h-tap items-center justify-center gap-2 rounded-2xl bg-evo-surface2 py-3 text-footnote font-medium text-evo-text transition hover:bg-evo-surface"
          >
            <Volume2 className="h-4 w-4 text-evo-limeDark" aria-hidden />
            Tap horn
          </button>
          <button
            type="button"
            data-cue="at-car"
            onClick={onArrive}
            className={`min-h-tap rounded-2xl bg-evo-lime py-3 text-footnote font-bold text-evo-onAccent transition hover:bg-evo-limeDark ${cueRing(atCarCued)}`}
          >
            I&apos;m at the car
          </button>
        </div>
      </div>
    </div>
  );
}
