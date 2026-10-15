"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Accessibility } from "lucide-react";
import { ParkingStructure, EvoCar } from "@/lib/types";
import { TrustBadge } from "./ui/TrustBadge";
import { FloorStrip } from "./FloorStrip";
import { formatCloseTime, minutesUntilClose } from "@/lib/data";
import { cueRing, useCue, useCueAdvance } from "@/lib/cue";

/**
 * §5.1 in full: lot status, the car's level and its trust tier, then
 * collapsible lot details — floor strip, access steps, entry type.
 *
 * Styled as an Apple grouped-inset list: one container fill, hairline
 * separators between rows, and no nested outlines. Status is carried by a
 * coloured dot and text rather than a row of ringed pills, which is what made
 * the panel read as busy.
 */
export function ParkingPanel({ structure, car }: { structure: ParkingStructure; car: EvoCar }) {
  // Collapsed by default: the summary rows carry the decision-making facts and
  // the details are progressive disclosure.
  const [open, setOpen] = useState(false);
  const detailsCued = useCue("lot-details");
  const advance = useCueAdvance();

  const minutesLeft = minutesUntilClose(structure);
  const closingSoon = minutesLeft !== Infinity && minutesLeft > 0 && minutesLeft <= 60;
  const isClosed = minutesLeft !== Infinity && minutesLeft <= 0;
  const floor = car.floor ?? 1;
  const floorTrust = structure.floorTrust[floor];
  const isRoof = structure.hasRooftop && floor === structure.totalFloors;

  const statusLabel = isClosed ? "Lot closed" : closingSoon ? "Closing soon" : "Lot open";
  const statusTone = isClosed ? "text-tone-danger" : closingSoon ? "text-tone-warn" : "text-tone-ok";
  const statusDot = isClosed ? "bg-tone-danger" : closingSoon ? "bg-tone-warn" : "bg-tone-ok";
  const hoursLabel = minutesLeft === Infinity ? "Open 24h" : `Closes ${formatCloseTime(structure)}`;

  function toggle() {
    setOpen((o) => {
      if (!o) advance("lot-details");
      return !o;
    });
  }

  return (
    <section
      aria-label="Parking details"
      className="mt-3 rounded-2xl bg-evo-surface"
    >
      <div className="space-y-1 p-3">
        <div className="flex items-baseline gap-2">
          <span className={`h-2 w-2 shrink-0 translate-y-[-1px] rounded-full ${statusDot}`} />
          <span className={`text-subhead font-semibold ${statusTone}`}>{statusLabel}</span>
          <span className="ml-auto text-footnote text-evo-mute">{hoursLabel}</span>
        </div>
        <div className="flex items-center gap-2 pl-4">
          <span className="text-footnote text-evo-text">
            Level {isRoof ? "Roof" : floor} of {structure.totalFloors}
          </span>
          <TrustBadge tier={floorTrust ? floorTrust.trustTier : "gps_estimated"} />
          {structure.underground && (
            <span className="text-caption2 text-evo-mute">GPS unavailable</span>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        data-cue="lot-details"
        className={`flex min-h-tap w-full items-center justify-between border-t border-evo-line px-3 text-footnote text-evo-mute transition hover:text-evo-text ${cueRing(detailsCued)}`}
      >
        <span>{open ? "Hide lot details" : "Lot details & access"}</span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {open && (
        // Spacing and type hierarchy carry the grouping here — these blocks
        // are a single card's content, not peer rows, so they get no rules
        // between them. The only hairline in the card is the one above the
        // disclosure control.
        <div className="fade-in space-y-4 px-3 pb-4 pt-3">
          <div>
            <div className="text-subhead font-semibold text-evo-text">{structure.name}</div>
            <div className="text-footnote text-evo-mute">
              {structure.address} · {structure.operator}
            </div>
          </div>

          <FloorStrip structure={structure} currentFloor={floor} />

          {/* §5.1 caps access directions at three steps. */}
          <ol className="space-y-1.5 text-footnote">
            {structure.accessSteps.slice(0, 3).map((step, i) => (
              <li key={i} className="flex gap-2.5">
                <span className="w-3 shrink-0 text-right font-semibold tabular-nums text-evo-limeDark">
                  {i + 1}
                </span>
                <span className="text-evo-text">{step}</span>
              </li>
            ))}
          </ol>

          <div className="flex items-center gap-1.5 text-footnote text-evo-mute">
            <Accessibility className="h-4 w-4" aria-hidden />
            {structure.barrierFreeEntry ? "Barrier-free entry" : "Ticket / card entry"}
          </div>
        </div>
      )}
    </section>
  );
}
