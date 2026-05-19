"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Clock, Layers, CircleDot, Accessibility } from "lucide-react";
import { ParkingStructure, EvoCar } from "@/lib/types";
import { TrustBadge } from "./ui/TrustBadge";
import { StatusPill } from "./ui/StatusPill";
import { FloorStrip } from "./FloorStrip";
import { formatCloseTime, minutesUntilClose } from "@/lib/data";

// §5.1 in full: status pills + collapsible details + floor strip + access steps.
export function ParkingPanel({ structure, car }: { structure: ParkingStructure; car: EvoCar }) {
  const [open, setOpen] = useState(true);
  const minutesLeft = minutesUntilClose(structure);
  const closingSoon = minutesLeft !== Infinity && minutesLeft > 0 && minutesLeft <= 60;
  const isClosed = minutesLeft !== Infinity && minutesLeft <= 0;
  const floor = car.floor ?? 1;
  const floorTrust = structure.floorTrust[floor];
  const floorLabel = floorLabelFor(floor, structure.hasRooftop && floor === structure.totalFloors);

  return (
    <div className="mt-3 rounded-2xl bg-evo-surface ring-1 ring-evo-line overflow-hidden">
      <div className="p-3 space-y-3">
        {/* Status pills row */}
        <div className="flex flex-wrap gap-1.5">
          <StatusPill
            tone={isClosed ? "danger" : closingSoon ? "warn" : "ok"}
            icon={<CircleDot className="w-3 h-3" />}
          >
            {isClosed ? "Lot closed" : closingSoon ? `Closing soon` : "Lot open"}
          </StatusPill>

          <StatusPill tone="neutral" icon={<Layers className="w-3 h-3" />}>
            {`Level ${floorLabel} of ${structure.totalFloors}`}
          </StatusPill>

          {!isClosed && minutesLeft !== Infinity && (
            <StatusPill tone={closingSoon ? "warn" : "neutral"} icon={<Clock className="w-3 h-3" />}>
              Closes {formatCloseTime(structure)}
            </StatusPill>
          )}

          {minutesLeft === Infinity && (
            <StatusPill tone="neutral" icon={<Clock className="w-3 h-3" />}>Open 24h</StatusPill>
          )}
        </div>

        {/* Trust badge sits next to floor info per §5.1 */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-evo-mute">Floor info:</span>
          {floorTrust ? (
            <TrustBadge tier={floorTrust.trustTier} />
          ) : (
            <TrustBadge tier="gps_estimated" />
          )}
          {structure.underground && (
            <span className="text-[10px] text-evo-mute">Underground · GPS unavailable</span>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center justify-between text-xs text-evo-mute hover:text-evo-text transition pt-1"
        >
          <span>{open ? "Hide details" : "Lot details & access"}</span>
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {open && (
          <div className="space-y-3 pt-1 fade-in">
            <div>
              <div className="text-sm font-medium">{structure.name}</div>
              <div className="text-xs text-evo-mute">{structure.address}</div>
              <div className="text-xs text-evo-mute mt-0.5">Operator: {structure.operator}</div>
            </div>

            <FloorStrip structure={structure} currentFloor={floor} />

            <ol className="space-y-1.5">
              {structure.accessSteps.slice(0, 3).map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-xs">
                  <span className="mt-0.5 inline-flex w-4 h-4 items-center justify-center rounded-full bg-evo-lime text-evo-ink text-[10px] font-bold">
                    {i + 1}
                  </span>
                  <span className="text-evo-text/90 leading-snug">{step}</span>
                </li>
              ))}
            </ol>

            <div className="flex items-center gap-3 text-[11px] text-evo-mute pt-1 border-t border-evo-line/60">
              <span className="inline-flex items-center gap-1">
                <Accessibility className="w-3 h-3" />
                {structure.barrierFreeEntry ? "Barrier-free entry" : "Ticket / card entry"}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function floorLabelFor(floor: number, isRoof: boolean) {
  if (isRoof) return "Roof";
  if (floor < 0) return `P${floor}`;
  return String(floor);
}
