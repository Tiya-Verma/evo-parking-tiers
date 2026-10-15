import type { Stage } from "@/app/types";
import type { CueId } from "./cue";

/**
 * Script for the guided demo.
 *
 * Every step is a short imperative anchored to one control — no explanatory
 * panels. The demo advances when the user actually performs the tap, either
 * because it moves the app to the next `Stage` or, for taps that don't
 * (expanding the lot details), because the control calls `advance()`.
 *
 * Steps are grouped by stage so the demo re-syncs if the user taps ahead or
 * backs out of a sheet.
 */
export interface DemoStep {
  cue: CueId;
  /** Shown in the callout. Keep it to a few words. */
  text: string;
  /**
   * Which side of the target the callout sits on. Defaults to above, falling
   * back to below when there isn't room. Set it explicitly where the content
   * immediately above the target is the thing the step is pointing out.
   */
  placement?: "above" | "below";
}

const MAP: DemoStep[] = [{ cue: "car-pin", text: "Tap this car" }];

const DETAIL_STRUCTURE: DemoStep[] = [
  // Sits below so it doesn't cover the status and level rows it refers to.
  { cue: "lot-details", text: "See the lot details", placement: "below" },
  { cue: "book-now", text: "Book it" },
];

// §3: street-parked cars get no parking layer, so there is nothing to expand.
const DETAIL_STREET: DemoStep[] = [{ cue: "book-now", text: "Street car — just book it" }];

const CLOSING: DemoStep[] = [{ cue: "keep-reservation", text: "Keep your reservation" }];
const NAVIGATING: DemoStep[] = [{ cue: "simulate-arrival", text: "Drive to the lot" }];
const ARRIVED: DemoStep[] = [{ cue: "at-car", text: "You're at the car" }];
const ENDTRIP: DemoStep[] = [{ cue: "submit-report", text: "Share what you saw" }];

export function stepsFor(stage: Stage, inStructure: boolean): DemoStep[] {
  switch (stage) {
    case "map":
      return MAP;
    case "detail":
      return inStructure ? DETAIL_STRUCTURE : DETAIL_STREET;
    case "closing":
      return CLOSING;
    case "navigating":
      return NAVIGATING;
    case "arrived":
      return ARRIVED;
    case "endtrip":
      return ENDTRIP;
  }
}
