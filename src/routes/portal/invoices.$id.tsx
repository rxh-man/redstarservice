import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Plus, Printer, Trash2, BadgeCheck } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/red-star-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { AED, Panel, StatusBadge, fmtDate, usePortal } from "@/lib/portal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/portal/invoices/$id")({ component: InvoiceDetail });

function InvoiceDetail() {
  const { id } = Route.useParams();
  const { isAdmin, isAccountant, session } = usePortal();
  const qc = useQueryClient();
  const [itemOpen, setItemOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const emptyItem = {
    service_id: "" as string,
    description: "",
    description_ar: "",
    qty: "1",
    unit_price: "0",
    govt_fee: "0",
    taxable: true,
  };
  const [item, setItem] = useState({ ...emptyItem });

  const [pay, setPay] = useState({ amount: "", method: "cash", reference: "", received_on: new Date().toISOString().slice(0, 10) });

  const [svcQuery, setSvcQuery] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["portal", "invoice", id],
    queryFn: async () => {
      const [inv, items, receipts, settings] = await Promise.all([
        supabase.from("invoices").select("*").eq("id", id).single(),
        supabase.from("invoice_items").select("*").eq("invoice_id", id).order("sort_order"),
        supabase.from("receipts").select("*").eq("invoice_id", id).order("received_on"),
        supabase.from("settings").select("*").maybeSingle(),
      ]);
      if (inv.error) throw inv.error;
      const services: {
        id: string;
        code: string | null;
        name: string;
        name_ar: string | null;
        category: string | null;
        service_fee: number;
        govt_fee: number;
      }[] = [];
      for (let from = 0; ; from += 1000) {
        const { data: chunk } = await supabase
          .from("services")
          .select("id, code, name, name_ar, category, service_fee, govt_fee")
          .eq("active", true)
          .order("name")
          .range(from, from + 999);
        services.push(...((chunk ?? []) as typeof services));
        if (!chunk || chunk.length < 1000) break;
      }
      let customer = null;
      if (inv.data.customer_id) {
        const { data: c } = await supabase.from("customers").select("*").eq("id", inv.data.customer_id).maybeSingle();
        customer = c;
      }
      return {
        invoice: inv.data,
        items: items.data ?? [],
        receipts: receipts.data ?? [],
        settings: settings.data,
        services,
        customer,
      };
    },
  });


  const addItem = useMutation({
    mutationFn: async () => {
      const qty = Number(item.qty);
      if (!Number.isFinite(qty) || qty <= 0) throw new Error("Quantity must be greater than zero");
      const fee = Number(item.unit_price);
      const govt = Number(item.govt_fee);
      if (!Number.isFinite(fee) || fee < 0) throw new Error("Service fee must be a positive amount");
      if (!Number.isFinite(govt) || govt < 0) throw new Error("Government fee must be a positive amount");
      const { error } = await supabase.from("invoice_items").insert({
        invoice_id: id,
        service_id: item.service_id || null,
        description: item.description.trim(),
        description_ar: item.description_ar.trim() || null,
        qty,
        unit_price: fee,
        govt_fee: govt,
        taxable: item.taxable,
        sort_order: (data?.items.length ?? 0) + 1,
      } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      setItemOpen(false);
      setItem({ ...emptyItem });
      setSvcQuery("");
      void qc.invalidateQueries({ queryKey: ["portal"] });
      toast.success("Line item added");
    },
    onError: (e: Error) => toast.error(e.message),
  });


  const delItem = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase.from("invoice_items").delete().eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["portal"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const addPayment = useMutation({
    mutationFn: async () => {
      const amount = Number(pay.amount);
      const due = Math.round((Number(data?.invoice.total ?? 0) - Number(data?.invoice.paid_amount ?? 0)) * 100) / 100;
      if (!Number.isFinite(amount) || amount <= 0) throw new Error("Enter a payment amount greater than zero");
      if (amount > due + 0.01) throw new Error(`Payment cannot exceed the outstanding balance of ${AED(due)}`);
      const { error } = await supabase.from("receipts").insert({
        receipt_no: "",
        invoice_id: id,
        customer_id: data?.invoice.customer_id ?? null,
        amount,
        method: pay.method,
        reference: pay.reference || null,
        received_on: pay.received_on,
        created_by: session?.user.id ?? null,
      } as never);
      if (error) throw error;
    },

    onSuccess: () => {
      setPayOpen(false);
      setPay({ amount: "", method: "cash", reference: "", received_on: new Date().toISOString().slice(0, 10) });
      void qc.invalidateQueries({ queryKey: ["portal"] });
      toast.success("Receipt recorded");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setStatus = useMutation({
    mutationFn: async (status: string) => {
      const { error } = await supabase.from("invoices").update({ status } as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["portal"] });
      toast.success("Invoice updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading || !data) return <p className="text-sm text-muted-foreground">Loading invoice…</p>;

  const inv = data.invoice;
  const balance = Math.round((Number(inv.total) - Number(inv.paid_amount)) * 100) / 100;
  const locked = inv.status === "cancelled" || inv.status === "paid";
  const canCollect = inv.status !== "cancelled" && balance > 0;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Button variant="outline" size="sm" asChild>
          <Link to="/portal/invoices">
            <ArrowLeft className="mr-2 h-4 w-4" /> All invoices
          </Link>
        </Button>
        <div className="flex flex-wrap gap-2">
          {isAccountant ? (
            <>
              <Button
                size="sm"
                variant="outline"
                disabled={locked}
                title={locked ? "Paid and cancelled invoices are locked" : undefined}
                onClick={() => setItemOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" /> Line item
              </Button>
              <Button size="sm" variant="outline" disabled={!canCollect} onClick={() => setPayOpen(true)}>
                <BadgeCheck className="mr-2 h-4 w-4" /> Record payment
              </Button>
              {inv.status === "draft" ? (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={data.items.length === 0}
                  title={data.items.length === 0 ? "Add at least one line item first" : undefined}
                  onClick={() => setStatus.mutate("sent")}
                >
                  Mark as sent
                </Button>
              ) : null}
              {inv.status !== "cancelled" && isAdmin ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (Number(inv.paid_amount) > 0) {
                      toast.error("Delete the receipts on this invoice before cancelling it.");
                      return;
                    }
                    if (confirm(`Cancel invoice ${inv.invoice_no}?`)) setStatus.mutate("cancelled");
                  }}
                >
                  Cancel invoice
                </Button>
              ) : null}
            </>
          ) : null}
          <Button size="sm" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" /> Print / PDF
          </Button>
        </div>
      </div>

      {locked ? (
        <p className="mb-4 rounded-lg border border-border bg-muted px-4 py-2 text-xs text-muted-foreground print:hidden">
          This invoice is {inv.status} and locked for editing. Line items can no longer be changed.
        </p>
      ) : null}


      <Panel className="p-6 md:p-10 print:border-0 print:shadow-none">
        <div className="flex flex-wrap items-start justify-between gap-6 border-b border-border pb-6">
          <div className="flex items-center gap-4">
            <img src={logo} alt="Red Star Services" className="h-16 w-auto object-contain" />
            <div>
              <div className="text-lg font-semibold">{data.settings?.company_name ?? "Red Star Services"}</div>
              <div className="text-xs text-muted-foreground">{data.settings?.address}</div>
              <div className="text-xs text-muted-foreground">
                {data.settings?.phone} · {data.settings?.email}
              </div>
              <div className="text-xs text-muted-foreground">TRN: {data.settings?.trn}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--brand-red)]">
              Tax Invoice
            </div>
            <div className="mt-1 text-xl font-semibold">{inv.invoice_no}</div>
            <div className="mt-1 text-xs text-muted-foreground">Issued {fmtDate(inv.issue_date)}</div>
            <div className="text-xs text-muted-foreground">Due {fmtDate(inv.due_date)}</div>
            <div className="mt-2">
              <StatusBadge value={inv.status} />
            </div>
          </div>
        </div>

        <div className="grid gap-6 py-6 sm:grid-cols-2">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Billed to</div>
            <div className="mt-2 font-medium">{data.customer?.name ?? "—"}</div>
            {data.customer?.name_ar ? <div className="arabic text-sm">{data.customer.name_ar}</div> : null}
            <div className="text-sm text-muted-foreground">{data.customer?.company}</div>
            <div className="text-sm text-muted-foreground">{data.customer?.phone}</div>
            <div className="text-sm text-muted-foreground">{data.customer?.email}</div>
            {data.customer?.trn ? (
              <div className="text-sm text-muted-foreground">TRN: {data.customer.trn}</div>
            ) : null}
          </div>
          <div className="sm:text-right">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Amount due</div>
            <div className="mt-2 text-3xl font-semibold tracking-tight">{AED(balance)}</div>
            <div className="text-xs text-muted-foreground">Paid {AED(inv.paid_amount)} of {AED(inv.total)}</div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-y border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-2 py-3">Description</th>
                <th className="px-2 py-3 text-right">Qty</th>
                <th className="px-2 py-3 text-right">Service fee</th>
                <th className="px-2 py-3 text-right">Govt. fee</th>
                <th className="px-2 py-3 text-right">Amount</th>
                <th className="w-10 print:hidden" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.items.map((it) => (
                <tr key={it.id}>
                  <td className="px-2 py-3">
                    <div className="font-medium">{it.description}</div>
                    {it.description_ar ? <div className="arabic text-xs">{it.description_ar}</div> : null}
                    {!it.taxable ? (
                      <div className="text-[11px] text-muted-foreground">VAT exempt</div>
                    ) : null}
                  </td>
                  <td className="px-2 py-3 text-right">{Number(it.qty)}</td>
                  <td className="px-2 py-3 text-right">{AED(it.unit_price)}</td>
                  <td className="px-2 py-3 text-right">{AED(it.govt_fee)}</td>
                  <td className="px-2 py-3 text-right font-semibold">
                    {AED(Number(it.qty) * Number(it.unit_price) + Number(it.govt_fee))}
                  </td>
                  <td className="px-2 py-3 text-right print:hidden">
                    {isAccountant ? (
                      <button onClick={() => delItem.mutate(it.id)} aria-label="Remove line">
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
              {data.items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-2 py-8 text-center text-muted-foreground">
                    No line items yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex justify-end">
          <dl className="w-full max-w-xs space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Service subtotal</dt>
              <dd>{AED(inv.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Government fees</dt>
              <dd>{AED(inv.govt_fees)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">VAT ({Number(inv.vat_rate)}%)</dt>
              <dd>{AED(inv.vat_amount)}</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
              <dt>Total</dt>
              <dd>{AED(inv.total)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Paid</dt>
              <dd>{AED(inv.paid_amount)}</dd>
            </div>
            <div className="flex justify-between font-semibold text-[color:var(--brand-red)]">
              <dt>Balance</dt>
              <dd>{AED(balance)}</dd>
            </div>
          </dl>
        </div>

        {data.receipts.length > 0 ? (
          <div className="mt-8 border-t border-border pt-6">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Payments received
            </div>
            <ul className="mt-3 space-y-2 text-sm">
              {data.receipts.map((r) => (
                <li key={r.id} className="flex flex-wrap justify-between gap-2">
                  <span>
                    {r.receipt_no} · {fmtDate(r.received_on)} · {r.method.replace("_", " ")}
                    {r.reference ? ` · ${r.reference}` : ""}
                  </span>
                  <span className="font-semibold">{AED(r.amount)}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <p className="mt-8 border-t border-border pt-4 text-xs text-muted-foreground">
          {data.settings?.footer_note}
        </p>
      </Panel>

      <Dialog open={itemOpen} onOpenChange={setItemOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add line item</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="svc">Search the service catalogue ({data.services.length.toLocaleString()} services)</Label>
              <Input
                id="svc"
                placeholder="Type a service code or name, e.g. 110021 or Emirates ID…"
                value={svcQuery}
                onChange={(e) => setSvcQuery(e.target.value)}
              />
              {svcQuery.trim().length >= 2 ? (
                <div className="max-h-56 overflow-y-auto rounded-md border border-border">
                  {data.services
                    .filter((s) => {
                      const t = svcQuery.trim().toLowerCase();
                      return (
                        s.name.toLowerCase().includes(t) ||
                        (s.code ?? "").toLowerCase().includes(t) ||
                        (s.name_ar ?? "").includes(svcQuery.trim())
                      );
                    })
                    .slice(0, 40)
                    .map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        className={`flex w-full items-start justify-between gap-3 border-b border-border px-3 py-2 text-left text-xs last:border-0 hover:bg-muted ${
                          item.service_id === s.id ? "bg-muted" : ""
                        }`}
                        onClick={() => {
                          setItem({
                            service_id: s.id,
                            description: s.name,
                            description_ar: s.name_ar ?? "",
                            qty: "1",
                            unit_price: String(s.service_fee),
                            govt_fee: String(s.govt_fee),
                            taxable: true,
                          });
                          setSvcQuery("");
                        }}
                      >
                        <span className="min-w-0">
                          <span className="block font-medium">{s.name}</span>
                          <span className="block text-muted-foreground">
                            {s.code} · {s.category ?? "—"}
                          </span>
                        </span>
                        <span className="whitespace-nowrap text-muted-foreground">
                          {AED(s.service_fee)} + {AED(s.govt_fee)}
                        </span>
                      </button>
                    ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Type at least 2 characters, or leave blank and enter a custom line below.
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="desc_ar">Description (Arabic)</Label>
              <Input
                id="desc_ar"
                className="arabic"
                value={item.description_ar}
                onChange={(e) => setItem({ ...item, description_ar: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="desc">Description</Label>
              <Textarea
                id="desc"
                value={item.description}
                onChange={(e) => setItem({ ...item, description: e.target.value })}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="qty">Qty</Label>
                <Input id="qty" value={item.qty} onChange={(e) => setItem({ ...item, qty: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="price">Service fee</Label>
                <Input
                  id="price"
                  value={item.unit_price}
                  onChange={(e) => setItem({ ...item, unit_price: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="gfee">Govt. fee</Label>
                <Input
                  id="gfee"
                  value={item.govt_fee}
                  onChange={(e) => setItem({ ...item, govt_fee: e.target.value })}
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={item.taxable}
                onChange={(e) => setItem({ ...item, taxable: e.target.checked })}
              />
              Service fee is subject to 5% VAT
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setItemOpen(false)}>
              Cancel
            </Button>
            <Button disabled={!item.description || addItem.isPending} onClick={() => addItem.mutate()}>
              Add item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record payment / issue receipt</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="amt">Amount (AED)</Label>
              <Input id="amt" value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value })} placeholder={String(balance)} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="method">Method</Label>
                <select
                  id="method"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={pay.method}
                  onChange={(e) => setPay({ ...pay, method: e.target.value })}
                >
                  {["cash", "card", "bank_transfer", "cheque", "online"].map((m) => (
                    <option key={m} value={m}>
                      {m.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="recdate">Received on</Label>
                <Input
                  id="recdate"
                  type="date"
                  value={pay.received_on}
                  onChange={(e) => setPay({ ...pay, received_on: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ref">Reference</Label>
              <Input id="ref" value={pay.reference} onChange={(e) => setPay({ ...pay, reference: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayOpen(false)}>
              Cancel
            </Button>
            <Button disabled={!pay.amount || addPayment.isPending} onClick={() => addPayment.mutate()}>
              Save receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
