"use client";

import { X, Fuel, Zap } from "lucide-react";
import { EvoCar } from "@/lib/types";
import { getStructure } from "@/lib/data";
import { ParkingPanel } from "./ParkingPanel";

interface Props {
  car: EvoCar;
  onClose: () => void;
  onReserve: () => void;
}

export function CarDetailSheet({ car, onClose, onReserve }: Props) {
  const structure = getStructure(car.structureId);

  return (
    <div className="absolute inset-x-0 bottom-0 z-20">
      {/* Tap-outside dismiss layer */}
      <button
        type="button"
        aria-label="Dismiss"
        onClick={onClose}
        className="absolute inset-x-0 -top-[200px] h-[200px] cursor-default"
      />
      <div className="relative bg-evo-canvas ring-1 ring-evo-line rounded-t-3xl shadow-sheet sheet-rise max-h-[78%] overflow-y-auto">
        <div className="sticky top-0 bg-evo-canvas/95 backdrop-blur-sm pt-4 pb-2 px-4 flex items-center justify-between border-b border-evo-line/60 z-10">
          <div className="absolute left-1/2 -translate-x-1/2 top-1.5 w-10 h-1 rounded-full bg-evo-line" />
          <div>
            <div className="text-[10px] uppercase tracking-widest text-evo-lime font-semibold">Available</div>
            <div className="text-lg font-semibold leading-tight mt-0.5">{car.plate}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 hover:bg-evo-surface2 text-evo-mute hover:text-evo-text transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 pb-4 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm">{car.model}</div>
              <div className="text-xs text-evo-mute mt-0.5">
                {structure ? structure.name : "Street parking"}
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              {car.fuelType === "ev" ? (
                <Zap className="w-4 h-4 text-evo-lime" />
              ) : (
                <Fuel className="w-4 h-4 text-evo-lime" />
              )}
              <span className="font-medium">{car.fuelPct}%</span>
            </div>
          </div>

          {/* The parking layer — §3 mandates this stays invisible for street cars */}
          {structure && <ParkingPanel structure={structure} car={car} />}

          <button
            type="button"
            onClick={onReserve}
            className="mt-4 w-full rounded-2xl bg-evo-lime text-evo-ink font-bold py-3.5 text-sm hover:bg-evo-limeDark transition active:scale-[0.99]"
          >
            Reserve
          </button>
          <p className="text-[11px] text-evo-mute text-center mt-2">
            30-min hold · No charge until you unlock
          </p>
        </div>
      </div>
    </div>
  );
}
