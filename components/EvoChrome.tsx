"use client";

// Static brand chrome that frames the real Evo app: top Evo/Evo Return
// segmented pill flanked by compass and overflow icons, a vertical stack of
// floating utility buttons on the right, and a 4-tab bottom navigation. None
// of these are interactive in the prototype — they exist so the prototype
// reads as a faithful reproduction of the Evo app shell.

import {
  Compass,
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
} from "lucide-react";

export function EvoTopBar() {
  return (
    <div className="absolute top-14 left-2 right-2 z-30 flex items-center gap-2 sm:top-14">
      <ChromeCircle ariaLabel="Compass">
        <Compass className="w-4 h-4 text-evo-ink" />
        <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-red-500" />
      </ChromeCircle>

      <div className="flex-1 rounded-full bg-evo-canvas shadow-card ring-1 ring-evo-line p-1 flex">
        <div className="flex-1 py-1.5 text-center text-[13px] font-semibold rounded-full bg-evo-lime text-white">
          Evo
        </div>
        <div className="flex-1 py-1.5 text-center text-[13px] font-semibold text-evo-ink">
          Evo Return
        </div>
      </div>

      <ChromeCircle ariaLabel="More">
        <MoreHorizontal className="w-4 h-4 text-evo-ink" />
      </ChromeCircle>
    </div>
  );
}

interface SideButtonsProps {
  theme: "dark" | "light";
  onToggleTheme: () => void;
}

export function EvoSideButtons({ theme, onToggleTheme }: SideButtonsProps) {
  return (
    <div className="absolute right-2 top-[120px] z-20 flex flex-col gap-2">
      <ChromeCircle ariaLabel="Filters">
        <SlidersHorizontal className="w-4 h-4 text-evo-ink" />
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-evo-lime ring-2 ring-evo-canvas" />
      </ChromeCircle>
      <ChromeCircle ariaLabel="Locate me">
        <Navigation className="w-4 h-4 text-evo-ink" />
      </ChromeCircle>
      <ChromeCircle ariaLabel="Scan QR">
        <QrCode className="w-4 h-4 text-evo-ink" />
      </ChromeCircle>
      {/* Demo-only: theme toggle. Sits at the bottom of the floating stack so
          it visually reads as a 4th utility button rather than dev chrome. */}
      <ChromeCircle
        ariaLabel={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        onClick={onToggleTheme}
      >
        {theme === "dark" ? (
          <Sun className="w-4 h-4 text-evo-lime" />
        ) : (
          <Moon className="w-4 h-4 text-evo-lime" />
        )}
      </ChromeCircle>
    </div>
  );
}

export function EvoTabBar() {
  return (
    <div className="absolute bottom-0 inset-x-0 z-10 bg-evo-canvas border-t border-evo-line pt-1.5 pb-2 flex justify-around">
      <TabItem icon={<Search className="w-5 h-5" />} label="Find a ride" active />
      <TabItem icon={<Calendar className="w-5 h-5" />} label="My bookings" />
      <TabItem icon={<Star className="w-5 h-5" />} label="Evo Extras" />
      <TabItem icon={<Menu className="w-5 h-5" />} label="Menu" />
    </div>
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
      onClick={onClick}
      className="relative shrink-0 w-10 h-10 rounded-full bg-evo-canvas shadow-card ring-1 ring-evo-line flex items-center justify-center hover:bg-evo-surface transition"
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
      className={`flex flex-col items-center gap-0.5 px-2 py-1 transition ${
        active ? "text-evo-lime" : "text-evo-mute"
      }`}
    >
      <span>{icon}</span>
      <span className="text-[10px] font-semibold">{label}</span>
    </button>
  );
}
