import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FileText, Users, Receipt, Keyboard, TrendingUp, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AED, Panel, PortalHeading, StatusBadge, fmtDate, usePortal } from "@/lib/portal";
import { ExpiryAlerts } from "@/components/portal/ExpiryAlerts";

export const Route = createFileRoute("/portal/")({ component: Dashboard });

function Dashboard() {
  const { fullName } = usePortal();

  const { data } = useQuery({
    queryKey: ["portal", "dashboard"],
    queryFn: async () => {
      const [invoices, customers, receipts, jobs] = await Promise.all([
        supabase.from("invoices").select("id, invoice_no, total, paid_amount, status, issue_date, customer_id"),
        supabase.from("customers").select("id, name"),
        supabase.from("receipts").select("id, amount, received_on"),
        supabase.from("typing_jobs").select("id, title, status, priority, due_date"),
      ]);
      return {
        invoices: invoices.data ?? [],
        customers: customers.data ?? [],
        receipts: receipts.data ?? [],
        jobs: jobs.data ?? [],
      };
    },
  });

  const invoices = data?.invoices ?? [];
  const billed = invoices
    .filter((i) => i.status !== "cancelled")
    .reduce((s, i) => s + Number(i.total), 0);
  const collected = (data?.receipts ?? []).reduce((s, r) => s + Number(r.amount), 0);
  const outstanding = Math.max(billed - collected, 0);
  const openJobs = (data?.jobs ?? []).filter((j) => !["completed", "rejected"].includes(j.status));
  const customerName = (id: string | null) =>
    (data?.customers ?? []).find((c) => c.id === id)?.name ?? "—";

  const cards = [
    { label: "Total billed", value: AED(billed), icon: TrendingUp, to: "/portal/invoices" },
    { label: "Collected", value: AED(collected), icon: Receipt, to: "/portal/receipts" },
    { label: "Outstanding", value: AED(outstanding), icon: AlertCircle, to: "/portal/invoices" },
    { label: "Customers", value: String((data?.customers ?? []).length), icon: Users, to: "/portal/customers" },
    { label: "Invoices", value: String(invoices.length), icon: FileText, to: "/portal/invoices" },
    { label: "Open jobs", value: String(openJobs.length), icon: Keyboard, to: "/portal/jobs" },
  ];

  return (
    <div>
      <PortalHeading
        title={`Welcome${fullName ? `, ${fullName.split(" ")[0]}` : ""}`}
        subtitle="Live snapshot of transactions, collections and the typing queue."
      />

      <div className="mb-6">
        <ExpiryAlerts />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.label} to={c.to}>
            <Panel className="card-lift h-full p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {c.label}
                </span>
                <c.icon className="h-4 w-4 text-[color:var(--brand-red)]" />
              </div>
              <div className="mt-3 text-2xl font-semibold tracking-tight">{c.value}</div>
            </Panel>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Panel className="p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Recent invoices
          </h2>
          <div className="mt-4 divide-y divide-border">
            {invoices
              .slice()
              .sort((a, b) => (a.issue_date < b.issue_date ? 1 : -1))
              .slice(0, 6)
              .map((i) => (
                <Link
                  key={i.id}
                  to="/portal/invoices/$id"
                  params={{ id: i.id }}
                  className="flex items-center justify-between gap-3 py-3 text-sm hover:text-[color:var(--brand-red)]"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium">{i.invoice_no}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {customerName(i.customer_id)} · {fmtDate(i.issue_date)}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 whitespace-nowrap">
                    <StatusBadge value={i.status} />
                    <span className="font-semibold">{AED(i.total)}</span>
                  </div>
                </Link>
              ))}
            {invoices.length === 0 ? (
              <p className="py-6 text-sm text-muted-foreground">No invoices yet.</p>
            ) : null}
          </div>
        </Panel>

        <Panel className="p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Typing queue
          </h2>
          <div className="mt-4 divide-y divide-border">
            {openJobs.slice(0, 6).map((j) => (
              <div key={j.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <div className="min-w-0">
                  <div className="truncate font-medium">{j.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {j.priority} priority · due {fmtDate(j.due_date)}
                  </div>
                </div>
                <StatusBadge value={j.status} />
              </div>
            ))}
            {openJobs.length === 0 ? (
              <p className="py-6 text-sm text-muted-foreground">Nothing pending. Queue is clear.</p>
            ) : null}
          </div>
        </Panel>
      </div>
    </div>
  );
}
