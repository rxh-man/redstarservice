import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Printer } from "lucide-react";
import logo from "@/assets/red-star-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { AED, Panel, PortalHeading, fmtDate } from "@/lib/portal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/portal/reports")({ component: Reports });

const today = () => new Date().toISOString().slice(0, 10);
const monthStart = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
};

const METHODS = ["cash", "card", "bank_transfer", "cheque", "online"] as const;

type Row = { label: string; count: number; service: number; govt: number; vat: number; total: number };

function Reports() {
  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(today());

  const { data, isLoading } = useQuery({
    queryKey: ["portal", "reports", from, to],
    queryFn: async () => {
      const [invoices, receipts, settings] = await Promise.all([
        supabase
          .from("invoices")
          .select("id, invoice_no, issue_date, status, subtotal, govt_fees, vat_amount, total, paid_amount, customer_id")
          .gte("issue_date", from)
          .lte("issue_date", to),
        supabase.from("receipts").select("id, amount, method, received_on").gte("received_on", from).lte("received_on", to),
        supabase.from("settings").select("company_name, company_name_ar, trn, address, phone, email").maybeSingle(),
      ]);
      if (invoices.error) throw invoices.error;
      if (receipts.error) throw receipts.error;

      const ids = (invoices.data ?? []).map((i) => i.id);
      let items: {
        invoice_id: string;
        qty: number;
        unit_price: number;
        govt_fee: number;
        taxable: boolean;
        services: { category: string | null } | null;
      }[] = [];
      for (let i = 0; i < ids.length; i += 200) {
        const { data: chunk, error } = await supabase
          .from("invoice_items")
          .select("invoice_id, qty, unit_price, govt_fee, taxable, services(category)")
          .in("invoice_id", ids.slice(i, i + 200));
        if (error) throw error;
        items = items.concat((chunk ?? []) as typeof items);
      }

      const { data: customers } = await supabase.from("customers").select("id, name");

      return {
        invoices: invoices.data ?? [],
        receipts: receipts.data ?? [],
        items,
        customers: customers ?? [],
        settings: settings.data,
      };
    },
  });

  const invoices = (data?.invoices ?? []).filter((i) => i.status !== "cancelled");
  const cancelledIds = new Set((data?.invoices ?? []).filter((i) => i.status === "cancelled").map((i) => i.id));
  const receipts = data?.receipts ?? [];

  const byDepartment = new Map<string, Row>();
  for (const it of data?.items ?? []) {
    if (cancelledIds.has(it.invoice_id)) continue;
    const label = it.services?.category ?? "Other / Center services";
    const service = Number(it.qty) * Number(it.unit_price);
    const govt = Number(it.govt_fee);
    const vat = it.taxable ? Math.round(service * 5) / 100 : 0;
    const row = byDepartment.get(label) ?? { label, count: 0, service: 0, govt: 0, vat: 0, total: 0 };
    row.count += 1;
    row.service += service;
    row.govt += govt;
    row.vat += vat;
    row.total += service + govt + vat;
    byDepartment.set(label, row);
  }
  const departments = Array.from(byDepartment.values()).sort((a, b) => b.total - a.total);

  const billed = invoices.reduce((s, i) => s + Number(i.total), 0);
  const collected = receipts.reduce((s, r) => s + Number(r.amount), 0);
  const govtFees = invoices.reduce((s, i) => s + Number(i.govt_fees), 0);
  const serviceCharge = invoices.reduce((s, i) => s + Number(i.subtotal), 0);
  const vat = invoices.reduce((s, i) => s + Number(i.vat_amount), 0);
  const outstanding = invoices.reduce((s, i) => s + (Number(i.total) - Number(i.paid_amount)), 0);

  const byMethod = METHODS.map((m) => ({
    method: m,
    count: receipts.filter((r) => r.method === m).length,
    amount: receipts.filter((r) => r.method === m).reduce((s, r) => s + Number(r.amount), 0),
  }));
  const otherMethods = receipts.filter((r) => !METHODS.includes(r.method as (typeof METHODS)[number]));

  const customerName = (id: string | null) => (data?.customers ?? []).find((c) => c.id === id)?.name ?? "—";
  const unpaid = invoices
    .filter((i) => Number(i.total) - Number(i.paid_amount) > 0.009)
    .sort((a, b) => Number(b.total) - Number(b.paid_amount) - (Number(a.total) - Number(a.paid_amount)));

  const kpis = [
    { label: "No. of transactions", value: invoices.length.toLocaleString() },
    { label: "Service charge", value: AED(serviceCharge) },
    { label: "Government fees", value: AED(govtFees) },
    { label: "VAT", value: AED(vat) },
    { label: "Total invoiced", value: AED(billed) },
    { label: "Total collected", value: AED(collected) },
    { label: "Outstanding", value: AED(outstanding) },
    { label: "Receipts issued", value: receipts.length.toLocaleString() },
  ];

  return (
    <div>
      <PortalHeading
        title="Reports & Analysis"
        subtitle="Department-wise sales, collection breakdown and receivables for any date range."
        actions={
          <Button size="sm" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" /> Print / PDF
          </Button>
        }
      />

      <Panel className="mb-6 flex flex-wrap items-end gap-4 p-4 print:hidden">
        <div className="space-y-1.5">
          <Label htmlFor="from">From</Label>
          <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="to">To</Label>
          <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setFrom(today());
              setTo(today());
            }}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setFrom(monthStart());
              setTo(today());
            }}
          >
            This month
          </Button>
        </div>
        {isLoading ? <span className="text-xs text-muted-foreground">Loading…</span> : null}
      </Panel>

      <div className="mb-6 hidden items-center gap-4 border-b border-border pb-4 print:flex">
        <img src={logo} alt="Red Star Services" className="h-14 w-auto object-contain" />
        <div>
          <div className="font-semibold">{data?.settings?.company_name ?? "Red Star Services"}</div>
          <div className="text-xs text-muted-foreground">
            {data?.settings?.address} · {data?.settings?.phone}
          </div>
          <div className="text-xs text-muted-foreground">TRN: {data?.settings?.trn}</div>
        </div>
        <div className="ml-auto text-right text-xs text-muted-foreground">
          Reporting period
          <div className="text-sm font-semibold text-foreground">
            {fmtDate(from)} — {fmtDate(to)}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <Panel key={k.label} className="p-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {k.label}
            </div>
            <div className="mt-2 text-xl font-semibold tracking-tight">{k.value}</div>
          </Panel>
        ))}
      </div>

      <Panel className="mt-8 overflow-x-auto">
        <div className="border-b border-border px-4 py-3 text-sm font-semibold">
          Sales by department <span className="arabic text-xs text-muted-foreground">مبيعات الإدارات</span>
        </div>
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3 text-right">No. of trans.</th>
              <th className="px-4 py-3 text-right">Service charge</th>
              <th className="px-4 py-3 text-right">Govt. fees</th>
              <th className="px-4 py-3 text-right">VAT</th>
              <th className="px-4 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {departments.map((r) => (
              <tr key={r.label}>
                <td className="px-4 py-3">{r.label}</td>
                <td className="px-4 py-3 text-right">{r.count}</td>
                <td className="px-4 py-3 text-right">{AED(r.service)}</td>
                <td className="px-4 py-3 text-right">{AED(r.govt)}</td>
                <td className="px-4 py-3 text-right">{AED(r.vat)}</td>
                <td className="px-4 py-3 text-right font-semibold">{AED(r.total)}</td>
              </tr>
            ))}
            {departments.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No transactions in this period.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </Panel>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Panel>
          <div className="border-b border-border px-4 py-3 text-sm font-semibold">
            Collection breakdown <span className="arabic text-xs text-muted-foreground">تفاصيل التحصيل</span>
          </div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-border">
              {byMethod.map((m) => (
                <tr key={m.method}>
                  <td className="px-4 py-3 capitalize">{m.method.replace("_", " ")}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{m.count}</td>
                  <td className="px-4 py-3 text-right font-medium">{AED(m.amount)}</td>
                </tr>
              ))}
              {otherMethods.length > 0 ? (
                <tr>
                  <td className="px-4 py-3">Other</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{otherMethods.length}</td>
                  <td className="px-4 py-3 text-right font-medium">
                    {AED(otherMethods.reduce((s, r) => s + Number(r.amount), 0))}
                  </td>
                </tr>
              ) : null}
              <tr className="border-t-2 border-border">
                <td className="px-4 py-3 font-semibold">Net total</td>
                <td className="px-4 py-3" />
                <td className="px-4 py-3 text-right font-semibold">{AED(collected)}</td>
              </tr>
            </tbody>
          </table>
        </Panel>

        <Panel>
          <div className="border-b border-border px-4 py-3 text-sm font-semibold">
            Outstanding receivables <span className="arabic text-xs text-muted-foreground">المبالغ المستحقة</span>
          </div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-border">
              {unpaid.slice(0, 12).map((i) => (
                <tr key={i.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium">{i.invoice_no}</div>
                    <div className="text-xs text-muted-foreground">
                      {customerName(i.customer_id)} · {fmtDate(i.issue_date)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {AED(Number(i.total) - Number(i.paid_amount))}
                  </td>
                </tr>
              ))}
              {unpaid.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-muted-foreground">
                    Nothing outstanding in this period.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </Panel>
      </div>
    </div>
  );
}
