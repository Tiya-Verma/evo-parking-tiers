import { TrustTier } from "@/lib/types";
import { ShieldCheck, Users, AlertCircle, BadgeCheck } from "lucide-react";

// Mapping defined in §7. Update both sides together if the spec changes —
// the spec-coherence-reviewer subagent enforces this invariant.
const TIERS: Record<TrustTier, { label: string; color: string; ring: string; Icon: typeof ShieldCheck }> = {
  gps_estimated:        { label: "Unverified",  color: "text-trust-unverified", ring: "ring-trust-unverified/50", Icon: AlertCircle },
  driver_report:        { label: "Community",   color: "text-trust-community",  ring: "ring-trust-community/50",  Icon: Users },
  community_verified:   { label: "Verified",    color: "text-trust-verified",   ring: "ring-trust-verified/50",   Icon: ShieldCheck },
  evo_verified:         { label: "Evo verified",color: "text-trust-evo",        ring: "ring-trust-evo/50",        Icon: BadgeCheck },
};

export function TrustBadge({ tier, size = "sm" }: { tier: TrustTier; size?: "sm" | "xs" }) {
  const t = TIERS[tier];
  const padding = size === "xs" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-[11px]";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-evo-surface2 ring-1 ${t.ring} ${t.color} ${padding} font-medium`}
    >
      <t.Icon className={size === "xs" ? "w-2.5 h-2.5" : "w-3 h-3"} />
      {t.label}
    </span>
  );
}
