"use client";

import { ReactNode } from "react";
import { demoClock } from "@/lib/data";

// Phone-frame chrome around the prototype. On desktop (≥640px) it renders a
// realistic iPhone-15-Pro-style device — titanium chassis, side buttons, and a
// multi-layer atmospheric shadow — so the running app reads as "a phone, not a
// webpage". On actual mobile devices the chassis collapses and the app fills
// the viewport.
//
// The screen carries `.app-viewport`, which owns `--safe-top` / `--safe-bottom`
// (globals.css). On a real device those resolve to the OS safe-area insets; in
// the desktop mock they resolve to the equivalents for the status bar and home
// indicator this component draws itself.
export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="phone-frame-bg flex min-h-screen w-full items-center justify-center py-6 transition-colors sm:py-12">
      {/* Chassis — only visible as a phone body on desktop. On mobile this
          wrapper passes through (no padding / background / shadow / buttons). */}
      <div
        className="relative h-[100dvh] w-full
          sm:h-auto sm:w-auto sm:rounded-[56px] sm:p-[6px]
          sm:bg-[linear-gradient(145deg,_#3a3d44_0%,_#1d1f24_45%,_#2a2d33_100%)]
          sm:shadow-[0_60px_120px_-30px_rgba(0,0,0,0.55),0_20px_50px_-20px_rgba(0,0,0,0.4),inset_0_0_0_1px_rgba(255,255,255,0.06)]"
      >
        {/* Polished outer rim highlight (desktop only) */}
        <div className="pointer-events-none absolute inset-0 hidden rounded-[56px] ring-1 ring-black/40 sm:block" />

        {/* Side buttons — sit slightly outside the chassis to read as
            machined titanium. Positions approximate iPhone 15 Pro. */}
        <span className="absolute -left-[3px] top-[118px] hidden h-[28px] w-[3px] rounded-l-sm bg-gradient-to-r from-zinc-500 to-zinc-700 sm:block" />
        <span className="absolute -left-[3px] top-[176px] hidden h-[56px] w-[3px] rounded-l-sm bg-gradient-to-r from-zinc-500 to-zinc-700 sm:block" />
        <span className="absolute -left-[3px] top-[244px] hidden h-[56px] w-[3px] rounded-l-sm bg-gradient-to-r from-zinc-500 to-zinc-700 sm:block" />
        <span className="absolute -right-[3px] top-[188px] hidden h-[92px] w-[3px] rounded-r-sm bg-gradient-to-l from-zinc-500 to-zinc-700 sm:block" />

        {/* Screen */}
        <div
          className="app-viewport relative h-[100dvh] w-full overflow-hidden bg-evo-canvas
            text-evo-text transition-colors sm:h-[844px] sm:w-[390px] sm:rounded-[50px]"
        >
          {/* Status bar (desktop frame only — on a real device the OS draws it).
              Transparent: the map runs underneath it, as in the real app.
              48pt tall so the Dynamic Island sits wholly inside it.
              Foreground is `evo-text`, which flips with the theme; `evo-ink` is
              constant-dark and would disappear against a dark canvas. */}
          <div className="pointer-events-none absolute inset-x-0 top-0 z-30 hidden h-12 items-center justify-between px-7 text-footnote font-semibold tracking-wide text-evo-text sm:flex">
            <span className="tabular-nums">{demoClock()}</span>
            {/* Dynamic Island: 125×36pt, 11pt from the top edge. */}
            <div className="absolute left-1/2 top-[11px] h-[36px] w-[125px] -translate-x-1/2 rounded-full bg-black" />
            <div className="flex items-center gap-1.5 opacity-90">
              <SignalIcon />
              <WifiIcon />
              <BatteryIcon />
            </div>
          </div>

          {/* App content area */}
          <div className="absolute inset-0 overflow-hidden">{children}</div>

          {/* Home indicator: 140×5pt, 8pt from the bottom edge. `--safe-bottom`
              keeps app content clear of this band. */}
          <div className="absolute bottom-2 left-1/2 z-30 hidden h-[5px] w-[140px] -translate-x-1/2 rounded-full bg-evo-text/70 sm:block" />
        </div>
      </div>
    </div>
  );
}

function SignalIcon() {
  return (
    <svg width="18" height="11" viewBox="0 0 18 11" fill="currentColor" aria-hidden>
      <rect x="0" y="7" width="3" height="4" rx="0.5" />
      <rect x="5" y="5" width="3" height="6" rx="0.5" />
      <rect x="10" y="2.5" width="3" height="8.5" rx="0.5" />
      <rect x="15" y="0" width="3" height="11" rx="0.5" />
    </svg>
  );
}
function WifiIcon() {
  return (
    <svg width="16" height="11" viewBox="0 0 16 11" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
      <path d="M1 4.2 A12 12 0 0 1 15 4.2" />
      <path d="M3.5 6.6 A8 8 0 0 1 12.5 6.6" />
      <path d="M6 9 A4 4 0 0 1 10 9" />
      <circle cx="8" cy="10.2" r="0.7" fill="currentColor" />
    </svg>
  );
}
function BatteryIcon() {
  return (
    <svg width="26" height="12" viewBox="0 0 26 12" fill="none" aria-hidden>
      <rect x="0.5" y="0.5" width="22" height="11" rx="3" stroke="currentColor" />
      <rect x="2" y="2" width="18" height="8" rx="1.5" fill="currentColor" />
      <rect x="23.5" y="3.5" width="2" height="5" rx="1" fill="currentColor" />
    </svg>
  );
}
