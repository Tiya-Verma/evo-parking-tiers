"use client";

import { AlertTriangle, ArrowRightLeft, Clock } from "lucide-react";
import { ParkingStructure, NearbyAlternative } from "@/lib/types";
import { formatCloseTime, minutesUntilClose, NEARBY_ALTERNATIVES } from "@/lib/data";
import { cueRing, useCue } from "@/lib/cue";

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
  const keepCued = useCue("keep-reservation");

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="closing-alert-title"
      className="fade-in absolute inset-0 z-40 flex items-end bg-black/60 backdrop-blur-sm"
    >
      <button
        type="button"
        aria-label="Dismiss"
        onClick={onDismiss}
        className="absolute inset-0 cursor-default"
      />
      <div
        className="sheet-rise relative w-full overflow-y-auto rounded-t-3xl bg-evo-canvas px-gutter pt-2.5 shadow-sheet"
        style={{
          paddingBottom: "calc(var(--safe-bottom) + 12px)",
          maxHeight: "var(--sheet-max-modal)",
        }}
      >
        <div className="mx-auto h-[5px] w-9 rounded-full bg-evo-line" />
        <div className="flex items-start gap-3 pt-4">
          <div className="mt-0.5 rounded-full bg-tone-warn/15 p-2">
            <AlertTriangle className="h-5 w-5 text-tone-warn" aria-hidden />
          </div>
          <div className="flex-1">
            <h2 id="closing-alert-title" className="text-headline text-evo-text">
              Lot closing in {minutesLeft} minutes
            </h2>
            <p className="mt-1 text-subhead text-evo-mute">
              {structure.name} closes at {formatCloseTime(structure)}. Your reserved car may be
              inaccessible after that.
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <h3 className="px-1 text-caption2 font-semibold uppercase tracking-widest text-evo-limeDark">
            Switch to a nearby car — fee waived
          </h3>
          {NEARBY_ALTERNATIVES.map((alt) => (
            <button
              key={alt.id}
              type="button"
              onClick={() => onSwitch(alt)}
              className="flex min-h-tap w-full items-center justify-between gap-3 rounded-xl bg-evo-surface2 px-3 py-3 text-left transition hover:bg-evo-surface"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="shrink-0 rounded-full bg-evo-lime/15 p-1.5">
                  <ArrowRightLeft className="h-4 w-4 text-evo-limeDark" aria-hidden />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-subhead font-medium text-evo-text">{alt.plate}</div>
                  <div className="truncate text-caption2 text-evo-mute">
                    {alt.model} · {alt.context === "street" ? "Street parking" : "Open >2h"}
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1 text-caption1 text-evo-mute">
                <Clock className="h-3 w-3" aria-hidden />
                {alt.walkingMinutes} min walk
              </div>
            </button>
          ))}
        </div>

        <button
          type="button"
          data-cue="keep-reservation"
          onClick={onProceed}
          className={`mt-3 min-h-tap w-full rounded-xl text-footnote font-medium text-evo-mute transition hover:text-evo-text ${cueRing(keepCued)}`}
        >
          I&apos;ll make it in time — keep reservation
        </button>
      </div>
    </div>
  );
}
