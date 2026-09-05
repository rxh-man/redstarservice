import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BellRing } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Panel, fmtDate } from "@/lib/portal";
import { daysUntil } from "@/lib/expiry";

type Alert = {
  key: string;
  label: string;
  what: string;
  date: string;
  days: number;
  companyId: string;
};

/** Lists company and employee documents expiring within the next 60 days (or already expired). */
export function ExpiryAlerts({ windowDays = 60 }: { windowDays?: number }) {
  const { data } = useQuery({
    queryKey: ["portal", "expiry-alerts"],
    queryFn: async () => {
      const [companies, employees] = await Promise.all([
        supabase.from("companies").select("id, name, license_expiry, establishment_card_expiry"),
        supabase
          .from("company_employees")
          .select("id, company_id, name, passport_expiry, visa_expiry, emirates_id_expiry, labour_card_expiry"),
      ]);
      return {
        companies: (companies.data ?? []) as {
          id: string;
          name: string;
          license_expiry: string | null;
          establishment_card_expiry: string | null;
        }[],
        employees: (employees.data ?? []) as {
          id: string;
          company_id: string;
          name: string;
          passport_expiry: string | null;
          visa_expiry: string | null;
          emirates_id_expiry: string | null;
          labour_card_expiry: string | null;
        }[],
      };
    },
  });

  const alerts: Alert[] = [];
  const push = (key: string, label: string, what: string, date: string | null, companyId: string) => {
    const days = daysUntil(date);
    if (date && days !== null && days <= windowDays) alerts.push({ key, label, what, date, days, companyId });
  };

  for (const c of data?.companies ?? []) {
    push(`${c.id}-tl`, c.name, "Trade licence", c.license_expiry, c.id);
    push(`${c.id}-ec`, c.name, "Establishment card", c.establishment_card_expiry, c.id);
  }
  for (const e of data?.employees ?? []) {
    push(`${e.id}-p`, e.name, "Passport", e.passport_expiry, e.company_id);
    push(`${e.id}-v`, e.name, "Visa", e.visa_expiry, e.company_id);
    push(`${e.id}-i`, e.name, "Emirates ID", e.emirates_id_expiry, e.company_id);
    push(`${e.id}-l`, e.name, "Labour card", e.labour_card_expiry, e.company_id);
  }
  alerts.sort((a, b) => a.days - b.days);

  if (alerts.length === 0) return null;

  return (
    <Panel className="border-amber-300/70 bg-amber-50/70 p-5">
      <div className="flex items-center gap-2">
        <BellRing className="h-4 w-4 text-amber-700" />
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-800">
          Expiry alerts ({alerts.length})
        </h2>
      </div>
      <ul className="mt-3 divide-y divide-amber-200/70">
        {alerts.slice(0, 12).map((a) => (
          <li key={a.key} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
            <Link to="/portal/companies/$id" params={{ id: a.companyId }} className="font-medium hover:underline">
              {a.label}
            </Link>
            <span className="text-muted-foreground">
              {a.what} · {fmtDate(a.date)}
            </span>
            <span className={a.days < 0 ? "font-semibold text-red-700" : "font-semibold text-amber-800"}>
              {a.days < 0 ? `expired ${Math.abs(a.days)}d ago` : `in ${a.days} days`}
            </span>
          </li>
        ))}
      </ul>
      {alerts.length > 12 ? (
        <Link to="/portal/employees" className="mt-3 inline-block text-xs font-semibold hover:underline">
          View all expiring documents →
        </Link>
      ) : null}
    </Panel>
  );
}
