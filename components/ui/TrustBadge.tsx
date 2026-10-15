import { TrustTier } from "@/lib/types";
import { ShieldCheck, Users, AlertCircle, BadgeCheck } from "lucide-react";

// Mapping defined in §7. Update both sides together if the spec changes —
// the spec-coherence-reviewer subagent enforces this invariant.
//
// Tier colour is reinforced by a distinct glyph and label, so the badge never
// relies on hue alone to carry meaning. The tint fill does the containing, so
// there is no outline — nested rings are what make a dense panel look busy.
const TIERS: Record<TrustTier, { label: string; className: string; Icon: typeof ShieldCheck }> = {
  gps_estimated:      { label: "Unverified",   className: "bg-trust-unverified/15 text-trust-unverified", Icon: AlertCircle },
  driver_report:      { label: "Community",    className: "bg-trust-community/15  text-trust-community",  Icon: Users },
  community_verified: { label: "Verified",     className: "bg-trust-verified/15   text-trust-verified",   Icon: ShieldCheck },
  evo_verified:       { label: "Evo verified", className: "bg-trust-evo/15        text-trust-evo",        Icon: BadgeCheck },
};

export function TrustBadge({ tier }: { tier: TrustTier }) {
  const t = TIERS[tier];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-caption2 font-semibold ${t.className}`}
    >
      <t.Icon className="h-3 w-3" aria-hidden />
      {t.label}
    </span>
  );
}
