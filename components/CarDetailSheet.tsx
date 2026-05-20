"use client";

import { ChevronUp, Fuel, Zap, Footprints } from "lucide-react";
import { EvoCar } from "@/lib/types";
import { getStructure } from "@/lib/data";
import { ParkingPanel } from "./ParkingPanel";

interface Props {
  car: EvoCar;
  onClose: () => void;
  onReserve: () => void;
}

// Strip "2024 Toyota " → "Corolla" so the header matches the real Evo app,
// which shows just the model series.
function shortModel(model: string): string {
  return model.replace(/^\d{4}\s+/, "").replace(/^(Toyota|Honda|Kia|Hyundai|Nissan|Mazda)\s+/, "");
}

// Mirrors the real Evo app's car detail card: bold model name, license plate
// chip, an illustrated side-view of the actual car, fuel / walking / price
// stats, and a prominent BOOK NOW action.
export function CarDetailSheet({ car, onClose, onReserve }: Props) {
  const structure = getStructure(car.structureId);
  const walkMinutes = 1;
  const walkMeters = 146;
  const pricePerMin = "$0.49/min";

  return (
    <div className="absolute inset-x-0 bottom-14 z-20">
      {/* Tap-outside dismiss layer */}
      <button
        type="button"
        aria-label="Dismiss"
        onClick={onClose}
        className="absolute inset-x-0 -top-[200px] h-[200px] cursor-default"
      />
      {/* Collapse chevron — rendered as a sibling of the scrolling sheet so
          the sheet's overflow-y-auto doesn't clip it off the top edge. */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Collapse"
        className="absolute left-1/2 -translate-x-1/2 -top-4 z-30 w-8 h-8 rounded-full bg-evo-canvas ring-1 ring-evo-line shadow-card flex items-center justify-center"
      >
        <ChevronUp className="w-4 h-4 text-evo-mute" />
      </button>
      <div className="relative bg-evo-canvas ring-1 ring-evo-line rounded-t-3xl shadow-sheet sheet-rise max-h-[68%] overflow-y-auto">
        <div className="px-4 pt-4 pb-4">
          {/* Header row: model + plate on the left, car illustration on the right */}
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-bold leading-tight text-evo-text truncate">
                {shortModel(car.model)}
              </h2>
              <div className="mt-1.5 inline-block px-2 py-0.5 rounded ring-1 ring-evo-line text-[11px] font-medium text-evo-text/85">
                {car.plate.replace("EVO · ", "")}
              </div>
            </div>
            {/* Real Evo fleet photo from /public — replaces the earlier SVG
                illustration so the popup matches the real app exactly. */}
            <img
              src="/car-image.png"
              alt={car.model}
              className="w-32 h-20 object-contain shrink-0"
            />
          </div>

          {/* Stats row — fuel | walking | price pill */}
          <div className="mt-3 flex items-center gap-3 text-[13px]">
            <span className="inline-flex items-center gap-1">
              {car.fuelType === "ev" ? (
                <Zap className="w-3.5 h-3.5 text-evo-lime" />
              ) : (
                <Fuel className="w-3.5 h-3.5 text-evo-lime" />
              )}
              <span className="font-semibold text-evo-text">{car.fuelPct}%</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <Footprints className="w-3.5 h-3.5 text-evo-lime" />
              <span className="font-semibold text-evo-text">
                {walkMeters} m · {walkMinutes} min
              </span>
            </span>
            <span className="ml-auto rounded-full bg-evo-lime/15 text-evo-limeDark px-2 py-0.5 text-[11px] font-bold">
              {pricePerMin}
            </span>
          </div>

          {/* Divider between car info and the parking layer */}
          {structure && <div className="mt-3 border-t border-evo-line" />}

          {/* The parking layer — §3 mandates this stays invisible for street cars */}
          {structure && <ParkingPanel structure={structure} car={car} />}

          <button
            type="button"
            onClick={onReserve}
            className="mt-4 w-full rounded-2xl bg-evo-lime text-white font-bold py-3.5 text-sm tracking-wide hover:bg-evo-limeDark transition active:scale-[0.99] shadow-card"
          >
            BOOK NOW
          </button>
          <p className="text-[10px] text-evo-mute text-center mt-1.5">
            30-min hold · No charge until you unlock
          </p>
        </div>
      </div>
    </div>
  );
}

