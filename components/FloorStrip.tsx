import { ParkingStructure } from "@/lib/types";
import { Lock } from "lucide-react";

// §5.1: a visual bar showing each floor with the car's level highlighted and
// any closed levels greyed-out. Handles underground lots (negative floor
// numbers, e.g. P-1, P-2) and rooftop labelling.
export function FloorStrip({ structure, currentFloor }: { structure: ParkingStructure; currentFloor: number }) {
  const floors = Object.values(structure.floorTrust).sort((a, b) => a.floor - b.floor);
  return (
    <div className="flex gap-1.5">
      {floors.map((f) => {
        const isCurrent = f.floor === currentFloor;
        const isRoof = structure.hasRooftop && f.floor === structure.totalFloors;
        const label = labelFor(f.floor, isRoof);
        return (
          <div
            key={f.floor}
            className={[
              "flex-1 min-w-0 rounded-md py-2 px-1 text-center ring-1 transition",
              f.isClosed
                ? "bg-evo-surface text-evo-mute ring-evo-line"
                : isCurrent
                  ? "bg-evo-lime text-evo-ink ring-evo-lime font-bold"
                  : "bg-evo-surface2 text-evo-text/85 ring-evo-line",
            ].join(" ")}
            aria-current={isCurrent ? "true" : undefined}
          >
            <div className="text-[11px] leading-tight">{label}</div>
            {f.isClosed && (
              <Lock className="w-3 h-3 mx-auto mt-1 opacity-70" aria-label="Closed" />
            )}
          </div>
        );
      })}
    </div>
  );
}

function labelFor(floor: number, isRoof: boolean): string {
  if (isRoof) return "Roof";
  if (floor < 0) return `P${floor}`;
  if (floor === 1) return "P1";
  return `P${floor}`;
}
