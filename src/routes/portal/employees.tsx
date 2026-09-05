import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, UsersRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Panel, PortalHeading } from "@/lib/portal";
import { ExpiryDate, daysUntil } from "@/lib/expiry";

export const Route = createFileRoute("/portal/employees")({ component: EmployeesPage });

type Employee = {
  id: string;
  company_id: string;
  name: string;
  nationality: string | null;
  designation: string | null;
  passport_expiry: string | null;
  visa_expiry: string | null;
  emirates_id_expiry: string | null;
  labour_card_expiry: string | null;
  status: string;
};

function EmployeesPage() {
  const [q, setQ] = useState("");
  const [only, setOnly] = useState(false);

  const { data } = useQuery({
    queryKey: ["portal", "employees"],
    queryFn: async () => {
      const [employees, companies] = await Promise.all([
        supabase.from("company_employees").select("*").order("name"),
        supabase.from("companies").select("id, name"),
      ]);
      if (employees.error) throw employees.error;
      return {
        employees: (employees.data ?? []) as Employee[],
        companies: (companies.data ?? []) as { id: string; name: string }[],
      };
    },
  });

  const companyName = (cid: string) => data?.companies.find((c) => c.id === cid)?.name ?? "—";
  const needle = q.trim().toLowerCase();

  const soonest = (e: Employee) => {
    const values = [e.passport_expiry, e.visa_expiry, e.emirates_id_expiry, e.labour_card_expiry]
      .map(daysUntil)
      .filter((d): d is number => d !== null);
    return values.length ? Math.min(...values) : null;
  };

  const rows = (data?.employees ?? []).filter((e) => {
    if (needle && !e.name.toLowerCase().includes(needle) && !companyName(e.company_id).toLowerCase().includes(needle))
      return false;
    if (only) {
      const d = soonest(e);
      return d !== null && d <= 90;
    }
    return true;
  });

  return (
    <div>
      <PortalHeading
        title="Employees"
        subtitle="Every sponsored employee with passport, visa, Emirates ID and labour card expiry tracking."
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex w-full max-w-sm items-center gap-2 rounded-md border border-input bg-background px-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            className="h-10 w-full bg-transparent text-sm outline-none"
            placeholder="Search employee or company…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" checked={only} onChange={(e) => setOnly(e.target.checked)} />
          Expiring within 90 days only
        </label>
      </div>

      <Panel className="overflow-x-auto">
        <table className="w-full min-w-[1000px] text-sm">
          <thead className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Passport</th>
              <th className="px-4 py-3">Visa</th>
              <th className="px-4 py-3">Emirates ID</th>
              <th className="px-4 py-3">Labour card</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((e) => (
              <tr key={e.id} className="hover:bg-muted/40">
                <td className="px-4 py-3">
                  <Link
                    to="/portal/companies/$id"
                    params={{ id: e.company_id }}
                    className="font-medium hover:underline"
                    title="Open the company page to edit this employee"
                  >
                    {e.name}
                  </Link>
                  <div className="text-xs text-muted-foreground">
                    {[e.designation, e.nationality].filter(Boolean).join(" · ") || "—"}
                  </div>
                </td>

                <td className="px-4 py-3">
                  <Link to="/portal/companies/$id" params={{ id: e.company_id }} className="hover:underline">
                    {companyName(e.company_id)}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <ExpiryDate date={e.passport_expiry} />
                </td>
                <td className="px-4 py-3">
                  <ExpiryDate date={e.visa_expiry} />
                </td>
                <td className="px-4 py-3">
                  <ExpiryDate date={e.emirates_id_expiry} />
                </td>
                <td className="px-4 py-3">
                  <ExpiryDate date={e.labour_card_expiry} />
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  <UsersRound className="mx-auto mb-3 h-6 w-6 opacity-50" />
                  No employees found. Add them from a company page.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
