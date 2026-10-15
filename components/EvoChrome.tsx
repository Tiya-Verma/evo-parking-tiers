"use client";

// Brand chrome that frames the real Evo app: top Evo/Evo Return segmented
// control flanked by compass and overflow buttons, a vertical stack of
// floating utility buttons on the right, and a 4-tab bottom navigation.
//
// Layout notes (Apple HIG):
// - Every control is at least 44×44pt.
// - The top bar and side stack are laid out by the parent as a flow column,
//   not absolutely positioned, so a banner appearing between them pushes the
//   stack down instead of overlapping it.
// - The tab bar reserves `--safe-bottom` beneath its labels so they clear the
//   home indicator, and carries 16pt side margins so the outer labels stay
//   clear of the display's rounded corners.

import {
  MoreHorizontal,
  SlidersHorizontal,
  Navigation,
  QrCode,
  Search,
  Calendar,
  Star,
  Menu,
  Sun,
  Moon,
  HelpCircle,
} from "lucide-react";

export function EvoTopBar() {
  return (
    // Matches the real app: the segmented control is centred at its natural
    // width (not stretched edge to edge) with the overflow button floating at
    // the right margin. There is no left-hand button.
    <div className="pointer-events-auto relative flex items-center justify-center">
      <div
        role="tablist"
        aria-label="Map mode"
        className="flex h-11 w-56 items-stretch rounded-full bg-evo-canvas p-1 shadow-card"
      >
        <button
          type="button"
          role="tab"
          aria-selected
          className="flex-1 rounded-full bg-evo-lime text-footnote font-semibold text-evo-onAccent"
        >
          Evo
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={false}
          className="flex-1 rounded-full text-footnote font-semibold text-evo-text"
        >
          Evo Return
        </button>
      </div>

      <div className="absolute right-0">
        <ChromeCircle ariaLabel="More">
          <MoreHorizontal className="h-[18px] w-[18px] text-evo-text" />
        </ChromeCircle>
      </div>
    </div>
  );
}

interface SideButtonsProps {
  theme: "dark" | "light";
  onToggleTheme: () => void;
  guideHidden: boolean;
  onToggleGuide: () => void;
}

export function EvoSideButtons({
  theme,
  onToggleTheme,
  guideHidden,
  onToggleGuide,
}: SideButtonsProps) {
  return (
    <div className="pointer-events-auto mt-3 flex flex-col gap-2.5 self-end">
      <ChromeCircle ariaLabel="Filters">
        <SlidersHorizontal className="h-[18px] w-[18px] text-evo-text" />
        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-evo-lime ring-2 ring-evo-canvas" />
      </ChromeCircle>
      <ChromeCircle ariaLabel="Locate me">
        <Navigation className="h-[18px] w-[18px] text-evo-text" />
      </ChromeCircle>
      <ChromeCircle ariaLabel="Scan QR">
        <QrCode className="h-[18px] w-[18px] text-evo-text" />
      </ChromeCircle>
      {/* Demo-only controls. They sit at the bottom of the floating stack so
          they read as further utility buttons rather than dev chrome. */}
      <ChromeCircle
        ariaLabel={guideHidden ? "Show guided demo" : "Hide guided demo"}
        onClick={onToggleGuide}
      >
        <HelpCircle
          className={`h-[18px] w-[18px] ${guideHidden ? "text-evo-mute" : "text-evo-lime"}`}
        />
      </ChromeCircle>
      <ChromeCircle
        ariaLabel={theme === "dark" ? "Switch to light appearance" : "Switch to dark appearance"}
        onClick={onToggleTheme}
      >
        {theme === "dark" ? (
          <Sun className="h-[18px] w-[18px] text-evo-lime" />
        ) : (
          <Moon className="h-[18px] w-[18px] text-evo-lime" />
        )}
      </ChromeCircle>
    </div>
  );
}

export function EvoTabBar() {
  return (
    <nav
      aria-label="Main"
      className="absolute inset-x-0 bottom-0 z-10 border-t border-evo-line bg-evo-canvas/92 backdrop-blur-xl"
      style={{ paddingBottom: "var(--safe-bottom)" }}
    >
      <div className="flex h-[54px] items-stretch px-gutter">
        <TabItem icon={<Search className="h-6 w-6" />} label="Find a ride" active />
        <TabItem icon={<Calendar className="h-6 w-6" />} label="My bookings" />
        <TabItem icon={<Star className="h-6 w-6" />} label="Evo Extras" />
        <TabItem icon={<Menu className="h-6 w-6" />} label="Menu" />
      </div>
    </nav>
  );
}

function ChromeCircle({
  children,
  ariaLabel,
  onClick,
}: {
  children: React.ReactNode;
  ariaLabel: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      title={ariaLabel}
      onClick={onClick}
      className="relative flex h-tap w-tap shrink-0 items-center justify-center rounded-full bg-evo-canvas shadow-card transition hover:bg-evo-surface"
    >
      {children}
    </button>
  );
}

function TabItem({
  icon,
  label,
  active = false,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      aria-current={active ? "page" : undefined}
      className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-[3px] transition ${
        active ? "text-evo-limeDark" : "text-evo-mute"
      }`}
    >
      <span aria-hidden>{icon}</span>
      <span className="w-full truncate px-0.5 text-center text-caption2 font-medium">{label}</span>
    </button>
  );
}
