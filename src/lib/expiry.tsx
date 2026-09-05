import { fmtDate } from "@/lib/portal";

export function daysUntil(date: string | null | undefined): number | null {
  if (!date) return null;
  const target = new Date(`${date}T00:00:00`).getTime();
  if (Number.isNaN(target)) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target - today.getTime()) / 86_400_000);
}

export function expiryTone(days: number | null): "none" | "expired" | "critical" | "soon" | "ok" {
  if (days === null) return "none";
  if (days < 0) return "expired";
  if (days <= 30) return "critical";
  if (days <= 90) return "soon";
  return "ok";
}

const dotClass: Record<string, string> = {
  expired: "bg-red-600",
  critical: "bg-red-500",
  soon: "bg-amber-500",
  ok: "bg-emerald-500",
  none: "bg-muted-foreground/40",
};

const textClass: Record<string, string> = {
  expired: "text-red-700 font-semibold",
  critical: "text-red-700 font-semibold",
  soon: "text-amber-700 font-medium",
  ok: "",
  none: "text-muted-foreground",
};

/** A date with a small colour dot: red when expired or within 30 days, amber within 90. */
export function ExpiryDate({ date }: { date: string | null | undefined }) {
  const days = daysUntil(date);
  const tone = expiryTone(days);
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      <span className={`h-2 w-2 shrink-0 rounded-full ${dotClass[tone]}`} />
      <span className={textClass[tone]}>{fmtDate(date)}</span>
      {days !== null && days < 0 ? (
        <span className="text-[11px] text-red-700">expired</span>
      ) : days !== null && days <= 90 ? (
        <span className="text-[11px] text-muted-foreground">{days}d</span>
      ) : null}
    </span>
  );
}
