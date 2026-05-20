"use client";

import { useState } from "react";
import { Gift, Signal } from "lucide-react";
import { ParkingStructure, LotStatus } from "@/lib/types";

interface Props {
  structure: ParkingStructure;
  gpsFloorEstimate: number;
  onSubmit: (report: {
    floor: number;
    status: LotStatus;
    barrierFree: boolean;
    elevatorWorking: boolean;
  }) => void;
  onDismiss: () => void;
}

// §5.4 community report. Only shown when end-trip GPS places the car inside a
// known structure boundary. GPS pre-fill is reflected in the initial state.
export function EndTripReport({ structure, gpsFloorEstimate, onSubmit, onDismiss }: Props) {
  const [floor, setFloor] = useState(gpsFloorEstimate);
  const [status, setStatus] = useState<LotStatus>("open");
  const [barrierFree, setBarrierFree] = useState(structure.barrierFreeEntry);
  const [elevatorWorking, setElevatorWorking] = useState(true);

  const floors = Object.values(structure.floorTrust).sort((a, b) => a.floor - b.floor);

  return (
    <div className="absolute inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-end fade-in">
      <button
        type="button"
        aria-label="Dismiss"
        onClick={onDismiss}
        className="absolute inset-0 cursor-default"
      />
      <div className="relative w-full bg-evo-canvas ring-1 ring-evo-line rounded-t-3xl p-5 pt-6 sheet-rise shadow-sheet max-h-[88%] overflow-y-auto">
        <div className="absolute left-1/2 -translate-x-1/2 top-2 w-10 h-1 rounded-full bg-evo-line" />
        <div className="text-[10px] uppercase tracking-widest text-evo-lime font-semibold">Help other drivers</div>
        <div className="mt-1 font-semibold text-base">{structure.name}</div>
        <div className="text-xs text-evo-mute">{structure.address}</div>

        <div className="mt-4 rounded-xl bg-evo-surface2 ring-1 ring-evo-line p-3 flex items-center gap-2">
          <Signal className="w-4 h-4 text-evo-lime" />
          <div className="text-xs text-evo-text/85">
            GPS pre-fill: {labelFor(gpsFloorEstimate, structure)} · Signal{" "}
            {structure.underground ? "unavailable" : "good"}
          </div>
        </div>

        <div className="mt-4">
          <div className="text-xs text-evo-mute mb-1.5 font-medium">Confirm floor</div>
          <div className="flex gap-1.5 flex-wrap">
            {floors.map((f) => {
              const isRoof = structure.hasRooftop && f.floor === structure.totalFloors;
              const label = labelFor(f.floor, structure, isRoof);
              const active = f.floor === floor;
              return (
                <button
                  key={f.floor}
                  type="button"
                  onClick={() => setFloor(f.floor)}
                  className={[
                    "rounded-xl px-3 py-2 text-sm ring-1 transition",
                    active
                      ? "bg-evo-lime text-evo-ink ring-evo-lime font-bold"
                      : "bg-evo-surface2 text-evo-text/90 ring-evo-line hover:ring-evo-lime/50",
                  ].join(" ")}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4">
          <div className="text-xs text-evo-mute mb-1.5 font-medium">Lot status now</div>
          <div className="grid grid-cols-3 gap-1.5">
            {(["open", "partial", "closed"] as LotStatus[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={[
                  "rounded-xl py-2 text-sm capitalize ring-1 transition",
                  status === s
                    ? "bg-evo-lime text-evo-ink ring-evo-lime font-bold"
                    : "bg-evo-surface2 text-evo-text/90 ring-evo-line hover:ring-evo-lime/50",
                ].join(" ")}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <Toggle label="Barrier-free entry" value={barrierFree} onChange={setBarrierFree} />
          <Toggle label="Elevator working" value={elevatorWorking} onChange={setElevatorWorking} />
        </div>

        <button
          type="button"
          onClick={() => onSubmit({ floor, status, barrierFree, elevatorWorking })}
          className="mt-5 w-full rounded-2xl bg-evo-lime text-white font-bold py-4 text-sm hover:bg-evo-limeDark transition shadow-card flex items-center justify-center gap-2"
        >
          <Gift className="w-4 h-4" />
          Submit — earn 5 min free driving
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="mt-2 w-full text-xs text-evo-mute py-2 hover:text-evo-text transition"
        >
          Not now
        </button>
      </div>
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="w-full flex items-center justify-between rounded-xl bg-evo-surface2 ring-1 ring-evo-line px-3 py-3 hover:ring-evo-lime/50 transition"
    >
      <span className="text-sm">{label}</span>
      <span
        className={[
          "relative w-10 h-6 rounded-full transition",
          value ? "bg-evo-lime" : "bg-evo-line",
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-card transition",
            value ? "left-[20px]" : "left-0.5",
          ].join(" ")}
        />
      </span>
    </button>
  );
}

function labelFor(floor: number, structure: ParkingStructure, isRoofOverride?: boolean): string {
  const isRoof = isRoofOverride ?? (structure.hasRooftop && floor === structure.totalFloors);
  if (isRoof) return `P${floor}/Roof`;
  if (floor < 0) return `P${floor}`;
  return `P${floor}`;
}
