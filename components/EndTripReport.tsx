"use client";

import { useState } from "react";
import { Gift, Signal } from "lucide-react";
import { ParkingStructure, LotStatus } from "@/lib/types";
import { cueRing, useCue } from "@/lib/cue";

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
  const submitCued = useCue("submit-report");

  const floors = Object.values(structure.floorTrust).sort((a, b) => a.floor - b.floor);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="end-trip-title"
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
        <div className="sticky top-0 z-10 -mx-gutter mb-2 flex justify-center bg-evo-canvas px-gutter pb-2">
          <span className="h-[5px] w-9 rounded-full bg-evo-line" />
        </div>

        <p className="text-caption2 font-semibold uppercase tracking-widest text-evo-limeDark">
          Help other drivers
        </p>
        <h2 id="end-trip-title" className="mt-1 text-headline text-evo-text">
          {structure.name}
        </h2>
        <p className="text-caption1 text-evo-mute">{structure.address}</p>

        <div className="mt-4 flex items-center gap-2 rounded-xl bg-evo-surface2 p-3">
          <Signal className="h-4 w-4 shrink-0 text-evo-limeDark" aria-hidden />
          <p className="text-caption1 text-evo-text">
            GPS pre-fill: {labelFor(gpsFloorEstimate, structure)} · Signal{" "}
            {structure.underground ? "unavailable" : "good"}
          </p>
        </div>

        <fieldset className="mt-4">
          <legend className="mb-1.5 text-caption1 font-medium text-evo-mute">Confirm floor</legend>
          <div className="flex flex-wrap gap-1.5">
            {floors.map((f) => {
              const isRoof = structure.hasRooftop && f.floor === structure.totalFloors;
              const label = labelFor(f.floor, structure, isRoof);
              const active = f.floor === floor;
              return (
                <Chip key={f.floor} active={active} onClick={() => setFloor(f.floor)}>
                  {label}
                </Chip>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="mt-4">
          <legend className="mb-1.5 text-caption1 font-medium text-evo-mute">Lot status now</legend>
          <div className="grid grid-cols-3 gap-1.5">
            {(["open", "partial", "closed"] as LotStatus[]).map((s) => (
              <Chip key={s} active={status === s} onClick={() => setStatus(s)}>
                <span className="capitalize">{s}</span>
              </Chip>
            ))}
          </div>
        </fieldset>

        <div className="mt-4 space-y-2">
          <Toggle label="Barrier-free entry" value={barrierFree} onChange={setBarrierFree} />
          <Toggle label="Elevator working" value={elevatorWorking} onChange={setElevatorWorking} />
        </div>

        {/* §10: max 3 rewarded reports per driver per day. */}
        <button
          type="button"
          data-cue="submit-report"
          onClick={() => onSubmit({ floor, status, barrierFree, elevatorWorking })}
          className={`mt-5 flex min-h-tap w-full items-center justify-center gap-2 rounded-2xl bg-evo-lime py-4 text-footnote font-bold text-evo-onAccent transition hover:bg-evo-limeDark ${cueRing(submitCued)}`}
        >
          <Gift className="h-4 w-4" aria-hidden />
          Submit — earn 5 min free driving
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="mt-1 min-h-tap w-full rounded-xl text-footnote text-evo-mute transition hover:text-evo-text"
        >
          Not now
        </button>
      </div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={[
        "min-h-tap min-w-tap rounded-xl px-3 text-subhead transition",
        active
          ? "bg-evo-lime font-bold text-evo-onAccent"
          : "bg-evo-surface2 text-evo-text hover:bg-evo-surface",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className="flex min-h-tap w-full items-center justify-between rounded-xl bg-evo-surface2 px-3 py-2 transition hover:bg-evo-surface"
    >
      <span className="text-subhead text-evo-text">{label}</span>
      {/* iOS switch proportions: 51×31pt track, 27pt knob. */}
      <span
        className={[
          "relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors",
          value ? "bg-evo-lime" : "bg-evo-line",
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-[2px] h-[27px] w-[27px] rounded-full bg-white shadow-card transition-all",
            value ? "left-[22px]" : "left-[2px]",
          ].join(" ")}
        />
      </span>
    </button>
  );
}

function labelFor(floor: number, structure: ParkingStructure, isRoofOverride?: boolean): string {
  const isRoof = isRoofOverride ?? (structure.hasRooftop && floor === structure.totalFloors);
  if (isRoof) return `P${floor}/Roof`;
  return `P${floor}`;
}
