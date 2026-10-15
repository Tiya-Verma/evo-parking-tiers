"use client";

import { createContext, useContext } from "react";

// Every control the guided demo can point at, in the order the demo visits
// them. Each step is a real tap the user performs — there are no
// read-and-continue steps — so this doubles as the progress scale.
export type CueId =
  | "car-pin"
  | "lot-details"
  | "book-now"
  | "keep-reservation"
  | "simulate-arrival"
  | "at-car"
  | "submit-report";

interface CueState {
  cue: CueId | null;
  /** Called by a control whose tap doesn't change `Stage` (so the demo would
      otherwise have no way to know the step was completed). */
  advance: (from: CueId) => void;
}

export const CueContext = createContext<CueState>({ cue: null, advance: () => {} });

/** True when the guided demo is currently pointing at this control. */
export function useCue(id: CueId): boolean {
  return useContext(CueContext).cue === id;
}

export function useCueAdvance(): (from: CueId) => void {
  return useContext(CueContext).advance;
}

/**
 * Pulsing-ring class for the control the demo is pointing at. Each cueable
 * control also carries a literal `data-cue` attribute, which is how the
 * floating callout finds and measures it — including the map pin, which lives
 * outside the React tree.
 */
export function cueRing(active: boolean): string {
  return active ? "cue-active" : "";
}
