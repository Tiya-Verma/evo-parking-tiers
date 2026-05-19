"use client";

import { ReactNode } from "react";

// Phone-frame chrome around the prototype. On desktop it renders an iPhone-ish
// 390×844 viewport so the demo reads as "an app, not a webpage". On phones
// (≤640px) the frame collapses to full-screen.
export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="phone-frame-bg min-h-screen w-full flex items-center justify-center py-6 sm:py-10 transition-colors">
      <div
        className="relative bg-evo-canvas text-evo-text overflow-hidden transition-colors
          w-full h-[100dvh] sm:h-[844px] sm:w-[390px]
          sm:rounded-[44px] sm:border sm:border-evo-line/70
          sm:shadow-[0_30px_90px_-20px_rgba(0,0,0,0.45)]"
      >
        {/* Status bar (visible on desktop frame only) */}
        <div className="hidden sm:flex absolute top-0 inset-x-0 h-11 px-7 items-center justify-between text-[13px] font-medium tracking-wide z-30 pointer-events-none">
          <span>9:41</span>
          <div className="absolute left-1/2 -translate-x-1/2 top-2 w-[110px] h-[26px] bg-black rounded-full" />
          <div className="flex items-center gap-1.5 opacity-90">
            <SignalIcon />
            <WifiIcon />
            <BatteryIcon />
          </div>
        </div>

        {/* App content area */}
        <div className="absolute inset-0 sm:top-11 overflow-hidden">{children}</div>

        {/* Home indicator */}
        <div className="hidden sm:block absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 rounded-full bg-evo-text/80 z-30" />
      </div>
    </div>
  );
}

function SignalIcon() {
  return (
    <svg width="18" height="11" viewBox="0 0 18 11" fill="currentColor">
      <rect x="0" y="7" width="3" height="4" rx="0.5" />
      <rect x="5" y="5" width="3" height="6" rx="0.5" />
      <rect x="10" y="2.5" width="3" height="8.5" rx="0.5" />
      <rect x="15" y="0" width="3" height="11" rx="0.5" />
    </svg>
  );
}
function WifiIcon() {
  return (
    <svg width="16" height="11" viewBox="0 0 16 11" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M1 4.2 A12 12 0 0 1 15 4.2" />
      <path d="M3.5 6.6 A8 8 0 0 1 12.5 6.6" />
      <path d="M6 9 A4 4 0 0 1 10 9" />
      <circle cx="8" cy="10.2" r="0.7" fill="currentColor" />
    </svg>
  );
}
function BatteryIcon() {
  return (
    <svg width="26" height="12" viewBox="0 0 26 12" fill="none">
      <rect x="0.5" y="0.5" width="22" height="11" rx="3" stroke="currentColor" />
      <rect x="2" y="2" width="18" height="8" rx="1.5" fill="currentColor" />
      <rect x="23.5" y="3.5" width="2" height="5" rx="1" fill="currentColor" />
    </svg>
  );
}
