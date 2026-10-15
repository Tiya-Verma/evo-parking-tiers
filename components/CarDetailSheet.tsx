"use client";

import { Fuel, Zap, Footprints } from "lucide-react";
import { EvoCar } from "@/lib/types";
import { getStructure } from "@/lib/data";
import { ParkingPanel } from "./ParkingPanel";
import { cueRing, useCue } from "@/lib/cue";

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
// chip, a photo of the actual car, fuel / walking / price stats, and a
// prominent BOOK NOW action.
//
// The sheet is non-modal — the map stays live behind it — so it sits above the
// tab bar rather than over it, and is dismissed by its grabber.
export function CarDetailSheet({ car, onClose, onReserve }: Props) {
  const structure = getStructure(car.structureId);
  const bookCued = useCue("book-now");
  const walkMinutes = 1;
  const walkMeters = 146;
  const pricePerMin = "$0.49/min";

  return (
    // The wrapper spans exactly the band the sheet may occupy — from the first
    // free y-coordinate below the chrome down to the top of the tab bar — and
    // pins the sheet to its bottom. That gives `max-h-full` a definite box to
    // resolve against, so the sheet can never grow up under the top bar or the
    // guided-demo card.
    <div
      className="pointer-events-none absolute inset-x-0 z-30 flex flex-col justify-end"
      style={{ top: "var(--content-top)", bottom: "var(--tabbar-h)" }}
    >
      <div className="sheet-rise pointer-events-auto relative max-h-full overflow-y-auto rounded-t-3xl bg-evo-canvas shadow-sheet">
        {/* Grabber — the standard iOS sheet-dismiss affordance. The bar is
            36×5pt but `.sheet-grabber` gives it a 44pt touch target without
            spending that much vertical layout. */}
        <div className="sticky top-0 z-10 flex justify-center bg-evo-canvas pb-1 pt-2.5">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close car details"
            className="sheet-grabber h-[5px] w-9 rounded-full bg-evo-line"
          />
        </div>

        <div className="px-gutter pb-5 pt-1">
          {/* Header row: model + plate on the left, car photo on the right */}
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-title2 font-bold leading-tight text-evo-text">
                {shortModel(car.model)}
              </h2>
              <div className="mt-1.5 inline-block rounded-md bg-evo-surface px-2 py-0.5 text-caption2 font-medium text-evo-mute">
                {car.plate.replace("EVO · ", "")}
              </div>
            </div>
            <img
              src="/car-image.png"
              alt={car.model}
              className="h-16 w-28 shrink-0 object-contain"
            />
          </div>

          {/* Stats row — fuel | walking | price pill */}
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-footnote">
            <span className="inline-flex items-center gap-1">
              {car.fuelType === "ev" ? (
                <Zap className="h-3.5 w-3.5 text-evo-limeDark" aria-hidden />
              ) : (
                <Fuel className="h-3.5 w-3.5 text-evo-limeDark" aria-hidden />
              )}
              <span className="font-semibold text-evo-text">{car.fuelPct}%</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <Footprints className="h-3.5 w-3.5 text-evo-limeDark" aria-hidden />
              <span className="font-semibold text-evo-text">
                {walkMeters} m · {walkMinutes} min
              </span>
            </span>
            <span className="ml-auto rounded-full bg-evo-lime/15 px-2 py-0.5 text-caption2 font-bold text-evo-limeDark">
              {pricePerMin}
            </span>
          </div>

          {/* The parking layer — §3 mandates this stays invisible for street cars */}
          {structure && <ParkingPanel structure={structure} car={car} />}

          <button
            type="button"
            data-cue="book-now"
            onClick={onReserve}
            className={`mt-4 min-h-tap w-full rounded-2xl bg-evo-lime py-3.5 text-footnote font-bold tracking-wide text-evo-onAccent transition hover:bg-evo-limeDark active:scale-[0.99] ${cueRing(bookCued)}`}
          >
            BOOK NOW
          </button>
          <p className="mt-1.5 text-center text-caption2 text-evo-mute">
            30-min hold · No charge until you unlock
          </p>
        </div>
      </div>
    </div>
  );
}
