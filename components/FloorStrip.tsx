import { ParkingStructure } from "@/lib/types";
import { Lock } from "lucide-react";

// §5.1: a visual bar showing each floor with the car's level highlighted and
// any closed levels greyed-out. Handles underground lots (negative floor
// numbers, e.g. P-1, P-2) and rooftop labelling.
//
// Built as one iOS-style segmented track — a single container fill with
// unoutlined segments — rather than a row of individually outlined chips.
export function FloorStrip({
  structure,
  currentFloor,
}: {
  structure: ParkingStructure;
  currentFloor: number;
}) {
  const floors = Object.values(structure.floorTrust).sort((a, b) => a.floor - b.floor);
  return (
    <ul className="flex gap-1 rounded-xl bg-evo-surface2 p-1" aria-label="Levels">
      {floors.map((f) => {
        const isCurrent = f.floor === currentFloor;
        const isRoof = structure.hasRooftop && f.floor === structure.totalFloors;
        return (
          <li
            key={f.floor}
            aria-current={isCurrent ? "true" : undefined}
            className={[
              "flex h-9 min-w-0 flex-1 items-center justify-center gap-1 rounded-lg px-1 text-caption1 transition",
              isCurrent
                ? "bg-evo-lime font-bold text-evo-onAccent shadow-sm"
                : f.isClosed
                  ? "text-evo-mute/60"
                  : "text-evo-text",
            ].join(" ")}
          >
            <span className="truncate">{isRoof ? "Roof" : `P${f.floor}`}</span>
            {f.isClosed && <Lock className="h-3 w-3 shrink-0" aria-label="Closed" />}
          </li>
        );
      })}
    </ul>
  );
}
