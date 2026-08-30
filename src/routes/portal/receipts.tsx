import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Printer, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/red-star-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { AED, Panel, PortalHeading, fmtDate, usePortal } from "@/lib/portal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/portal/receipts")({ component: ReceiptsPage });

type Receipt = {
  id: string;
  receipt_no: string;
  invoice_id: string | null;
  customer_id: string | null;
  amount: number;
  method: string;
  reference: string | null;
  received_on: string;
  notes: string | null;
};

function ReceiptsPage() {
  const { isAdmin } = usePortal();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [show, setShow] = useState<Receipt | null>(null);

  const { data } = useQuery({
    queryKey: ["portal", "receipts"],
    queryFn: async () => {
      const [rec, cust, inv, settings] = await Promise.all([
        supabase.from("receipts").select("*").order("received_on", { ascending: false }),
        supabase.from("customers").select("id, name"),
        supabase.from("invoices").select("id, invoice_no"),
        supabase.from("settings").select("*").maybeSingle(),
      ]);
      if (rec.error) throw rec.error;
      return {
        receipts: rec.data as Receipt[],
        customers: cust.data ?? [],
        invoices: inv.data ?? [],
        settings: settings.data,
      };
    },
  });

  const receipts = data?.receipts ?? [];
  const nameOf = (id: string | null) => data?.customers.find((c) => c.id === id)?.name ?? "—";
  const invNo = (id: string | null) => data?.invoices.find((i) => i.id === id)?.invoice_no ?? "—";

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("receipts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Receipt deleted");
      void qc.invalidateQueries({ queryKey: ["portal"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = receipts.filter((r) =>
    `${r.receipt_no} ${nameOf(r.customer_id)} ${invNo(r.invoice_id)} ${r.method}`
      .toLowerCase()
      .includes(q.toLowerCase()),
  );
  const total = filtered.reduce((s, r) => s + Number(r.amount), 0);

  return (
    <div>
      <PortalHeading
        title="Receipts"
        subtitle="Every payment collected against an invoice. Receipts are numbered automatically."
      />

      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search receipt, customer, invoice…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="text-sm text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{AED(total)}</span> collected
        </div>
      </div>

      <Panel className="overflow-x-auto">
        <table className="w-full min-w-[780px] text-sm">
          <thead className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Receipt</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Invoice</th>
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3 font-medium">{r.receipt_no}</td>
                <td className="px-4 py-3 text-muted-foreground">{fmtDate(r.received_on)}</td>
                <td className="px-4 py-3">{nameOf(r.customer_id)}</td>
                <td className="px-4 py-3">
                  {r.invoice_id ? (
                    <Link to="/portal/invoices/$id" params={{ id: r.invoice_id }} className="hover:text-[color:var(--brand-red)]">
                      {invNo(r.invoice_id)}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3 capitalize">{r.method.replace("_", " ")}</td>
                <td className="px-4 py-3 text-right font-semibold">{AED(r.amount)}</td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setShow(r)}>
                      <Printer className="h-3.5 w-3.5" />
                    </Button>
                    {isAdmin ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (confirm(`Delete receipt ${r.receipt_no}?`)) remove.mutate(r.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                  No receipts recorded yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </Panel>

      <Dialog open={!!show} onOpenChange={(o) => !o && setShow(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Payment receipt</DialogTitle>
          </DialogHeader>
          {show ? (
            <div className="rounded-xl border border-border p-5">
              <div className="flex items-center gap-3 border-b border-border pb-4">
                <img src={logo} alt="Red Star Services" className="h-12 w-auto object-contain" />
                <div>
                  <div className="font-semibold">{data?.settings?.company_name ?? "Red Star Services"}</div>
                  <div className="text-[11px] text-muted-foreground">{data?.settings?.address}</div>
                </div>
              </div>
              <dl className="mt-4 space-y-2 text-sm">
                <Row label="Receipt no" value={show.receipt_no} />
                <Row label="Date" value={fmtDate(show.received_on)} />
                <Row label="Received from" value={nameOf(show.customer_id)} />
                <Row label="Against invoice" value={invNo(show.invoice_id)} />
                <Row label="Method" value={show.method.replace("_", " ")} />
                {show.reference ? <Row label="Reference" value={show.reference} /> : null}
                <div className="flex justify-between border-t border-border pt-3 text-base font-semibold">
                  <dt>Amount received</dt>
                  <dd>{AED(show.amount)}</dd>
                </div>
              </dl>
              <Button className="mt-5 w-full" onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" /> Print receipt
              </Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium capitalize">{value}</dd>
    </div>
  );
}
