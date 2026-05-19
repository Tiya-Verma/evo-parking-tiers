import { ReactNode } from "react";

type Tone = "ok" | "warn" | "danger" | "neutral";

const TONE_STYLES: Record<Tone, string> = {
  ok:      "bg-trust-evo/15        text-trust-evo         ring-trust-evo/30",
  warn:    "bg-trust-unverified/15 text-trust-unverified  ring-trust-unverified/40",
  danger:  "bg-red-500/15          text-red-300           ring-red-400/40",
  neutral: "bg-evo-surface2        text-evo-text/90       ring-evo-line",
};

export function StatusPill({
  tone = "neutral",
  icon,
  children,
}: {
  tone?: Tone;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full ring-1 px-2.5 py-1 text-xs font-medium whitespace-nowrap ${TONE_STYLES[tone]}`}
    >
      {icon}
      {children}
    </span>
  );
}
