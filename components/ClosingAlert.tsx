"use client";

import { AlertTriangle, ArrowRightLeft, Clock } from "lucide-react";
import { ParkingStructure, NearbyAlternative } from "@/lib/types";
import { formatCloseTime, minutesUntilClose, NEARBY_ALTERNATIVES } from "@/lib/data";

interface Props {
  structure: ParkingStructure;
  onSwitch: (alt: NearbyAlternative) => void;
  onProceed: () => void;
  onDismiss: () => void;
}

// §5.2: fires when lot_closing - now <= 30 min and the user taps Reserve.
// §9.1 reminds us: this is advisory only — Evo does not auto-cancel reservations.
export function ClosingAlert({ structure, onSwitch, onProceed, onDismiss }: Props) {
  const minutesLeft = Math.max(0, minutesUntilClose(structure));

  return (
    <div className="absolute inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-end fade-in">
      <button
        type="button"
        aria-label="Dismiss"
        onClick={onDismiss}
        className="absolute inset-0 cursor-default"
      />
      <div className="relative w-full bg-evo-canvas ring-1 ring-evo-line rounded-t-3xl p-5 sheet-rise shadow-sheet">
        <div className="absolute left-1/2 -translate-x-1/2 top-2 w-10 h-1 rounded-full bg-evo-line" />
        <div className="flex items-start gap-3 pt-2">
          <div className="rounded-full bg-trust-unverified/15 ring-1 ring-trust-unverified/40 p-2 mt-0.5">
            <AlertTriangle className="w-5 h-5 text-trust-unverified" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-base">Lot closing in {minutesLeft} minutes</div>
            <p className="text-sm text-evo-text/85 mt-1 leading-snug">
              {structure.name} closes at {formatCloseTime(structure)}. Your reserved car may
              be inaccessible after that.
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="text-[11px] uppercase tracking-widest text-evo-lime font-semibold px-1">
            Switch to a nearby car — fee waived
          </div>
          {NEARBY_ALTERNATIVES.map((alt) => (
            <button
              key={alt.id}
              type="button"
              onClick={() => onSwitch(alt)}
              className="w-full flex items-center justify-between rounded-xl bg-evo-surface2 ring-1 ring-evo-line hover:ring-evo-lime/60 transition px-3 py-3 text-left"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-evo-lime/15 ring-1 ring-evo-lime/30 p-1.5">
                  <ArrowRightLeft className="w-4 h-4 text-evo-lime" />
                </div>
                <div>
                  <div className="text-sm font-medium">{alt.plate}</div>
                  <div className="text-[11px] text-evo-mute">
                    {alt.model} · {alt.context === "street" ? "Street parking" : "Open >2h"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-evo-mute">
                <Clock className="w-3 h-3" />
                {alt.walkingMinutes} min walk
              </div>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onProceed}
          className="mt-4 w-full text-sm text-evo-mute py-2 hover:text-evo-text transition"
        >
          I'll make it in time — keep reservation
        </button>
      </div>
    </div>
  );
}
