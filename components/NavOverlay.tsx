"use client";

import { ArrowUp, Volume2, MapPin } from "lucide-react";
import { EvoCar, ParkingStructure } from "@/lib/types";

interface Props {
  structure: ParkingStructure;
  car: EvoCar;
  onHorn: () => void;
  onArrive: () => void;
}

// §5.3 Phase 2 — triggered when device GPS enters the lot boundary (~50m
// geofence). Evo app surfaces in-lot guidance over the map.
export function NavOverlay({ structure, car, onHorn, onArrive }: Props) {
  const floor = car.floor ?? 1;
  const isRoof = structure.hasRooftop && floor === structure.totalFloors;
  const label = isRoof ? "Roof" : floor < 0 ? `P${floor}` : `P${floor}`;

  return (
    <div className="absolute inset-x-0 bottom-0 z-30 p-3">
      <div className="rounded-3xl bg-evo-canvas/95 backdrop-blur-md ring-1 ring-evo-line p-4 sheet-rise shadow-sheet">
        <div className="flex items-center gap-2 text-[11px] text-evo-lime uppercase tracking-widest font-semibold">
          <MapPin className="w-3 h-3" />
          You're at the lot
        </div>
        <div className="mt-1 flex items-start gap-3">
          <div className="rounded-2xl bg-evo-lime/15 ring-1 ring-evo-lime/40 p-3 mt-0.5">
            <ArrowUp className="w-6 h-6 text-evo-lime" />
          </div>
          <div className="flex-1">
            <div className="text-lg font-semibold leading-tight">
              Take ramp or elevator to {label}
            </div>
            {car.stallHint && (
              <div className="text-sm text-evo-text/85 mt-1">{car.stallHint}</div>
            )}
            <div className="text-xs text-evo-mute mt-1">{structure.name}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-4">
          <button
            type="button"
            onClick={onHorn}
            className="rounded-2xl bg-evo-surface2 ring-1 ring-evo-line py-3 text-sm font-medium hover:ring-evo-lime/60 transition flex items-center justify-center gap-2"
          >
            <Volume2 className="w-4 h-4 text-evo-lime" />
            Tap horn
          </button>
          <button
            type="button"
            onClick={onArrive}
            className="rounded-2xl bg-evo-lime text-evo-ink font-bold py-3 text-sm hover:bg-evo-limeDark transition"
          >
            I'm at the car
          </button>
        </div>
      </div>
    </div>
  );
}
