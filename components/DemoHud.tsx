"use client";

// Lightweight overlay shown only in the prototype to let pitch-meeting viewers
// jump between flow states without hunting for the trigger. The real Evo app
// would never ship this.
import { Moon, Sun } from "lucide-react";
import { Stage } from "@/app/types";

const STAGES: { id: Stage; label: string }[] = [
  { id: "map", label: "1. Map" },
  { id: "detail", label: "2. Tap car" },
  { id: "closing", label: "3. Closing alert" },
  { id: "navigating", label: "4. Navigate" },
  { id: "arrived", label: "5. At the lot" },
  { id: "endtrip", label: "6. End trip" },
];

interface Props {
  stage: Stage;
  setStage: (s: Stage) => void;
  theme: "dark" | "light";
  onToggleTheme: () => void;
}

export function DemoHud({ stage, setStage, theme, onToggleTheme }: Props) {
  return (
    <div className="absolute top-2 left-2 right-2 z-50 sm:top-3 sm:left-3 sm:right-3 flex items-center gap-2">
      {/* Scrollable stage strip — chips overflow horizontally on small frames. */}
      <div className="flex-1 min-w-0 rounded-2xl bg-evo-canvas/90 backdrop-blur-md ring-1 ring-evo-line px-2.5 py-1.5 flex items-center gap-1 overflow-x-auto">
        <span className="text-[9px] uppercase tracking-widest text-evo-mute pr-1.5 whitespace-nowrap shrink-0 font-semibold">
          Demo
        </span>
        {STAGES.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setStage(s.id)}
            className={[
              "whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-semibold transition",
              stage === s.id
                ? "bg-evo-lime text-evo-ink"
                : "text-evo-mute hover:text-evo-text",
            ].join(" ")}
          >
            {s.label}
          </button>
        ))}
      </div>
      {/* Theme toggle is pinned outside the scroll container so it stays
          visible regardless of how far the stage chips overflow. */}
      <button
        type="button"
        onClick={onToggleTheme}
        aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        className="shrink-0 rounded-full bg-evo-canvas/90 backdrop-blur-md ring-1 ring-evo-line p-2 text-evo-text hover:bg-evo-surface2 transition"
      >
        {theme === "dark" ? (
          <Sun className="w-4 h-4 text-evo-lime" />
        ) : (
          <Moon className="w-4 h-4 text-evo-lime" />
        )}
      </button>
    </div>
  );
}
