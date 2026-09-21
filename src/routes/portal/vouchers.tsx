import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Trash2, Printer, CheckCircle2, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AED, Panel, PortalHeading, StatusBadge, fmtDate, usePortal } from "@/lib/portal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/portal/vouchers")({
  head: () => ({
    meta: [
      { title: "Payment Vouchers — Red Star Services ERP" },
      { name: "description", content: "Record and approve supplier, government and staff payment vouchers." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Payment Vouchers — Red Star Services ERP" },
      { property: "og:description", content: "Cash and bank payment vouchers with approval and printing." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: VouchersPage;
});

type Voucher = {
  id: string;
  voucher_no: string;
  voucher_date: string;
  payee: string;
  payee_type: string;
  account_code: string | null;
  amount: number;
  method: string;
  reference: string | null;
  description: string | null;
  status: string;
};

const PAYEE_TYPES = ["supplier", "government", "staff", "customer refund", "other"];
const METHODS = ["cash", "bank", "cheque", "card", "online"];

const empty = {
  voucher_date: new Date().toISOString().slice(0, 10),
  payee: "",
  payee_type: "supplier",
  account_code: "",
  amount: "",
  method: "cash",
  reference: "",
  description: "",
};

function VouchersPage() {
  const { isAdmin, session } = usePortal();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Voucher | null>(null);
  const [form, setForm] = useState({ ...empty });

  const { data } = useQuery({
    queryKey: ["portal", "vouchers"],
    queryFn: async () => {
      const [vou, acc] = await Promise.all([
        supabase.from("payment_vouchers").select("*").order("voucher_date", { ascending: false }),
        supabase.from("accounts").select("code, name").eq("active", true).order("code"),
      ]);
      if (vou.error) throw vou.error;
      return { vouchers: (vou.data ?? []) as Voucher[], accounts: acc.data ?? [] };
    },
  });

  const vouchers = data?.vouchers ?? [];
  const accounts = data?.accounts ?? [];
  const filtered = vouchers.filter((v) =>
    `${v.voucher_no} ${v.payee} ${v.payee_type} ${v.method} ${v.status}`.toLowerCase().includes(q.toLowerCase()),
  );
  const approved = vouchers.filter((v) => v.status === "approved" || v.status === "paid");

  const save = useMutation({
    mutationFn: async () => {
      const amount = Number(form.amount);
      if (!form.payee.trim()) throw new Error("Enter who is being paid.");
      if (!amount || amount <= 0) throw new Error("Enter an amount greater than zero.");
      const payload = {
        voucher_date: form.voucher_date,
        payee: form.payee.trim(),
        payee_type: form.payee_type,
        account_code: form.account_code || null,
        amount,
        method: form.method,
        reference: form.reference || null,
        description: form.description || null,
      };
      if (editing) {
        const { error } = await supabase.from("payment_vouchers").update(payload as never).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("payment_vouchers")
          .insert({ ...payload, voucher_no: "", created_by: session?.user.id ?? null } as never);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Voucher updated" : "Voucher created");
      setOpen(false);
      setEditing(null);
      setForm({ ...empty });
      void qc.invalidateQueries({ queryKey: ["portal"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const mark = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("payment_vouchers").update({ status } as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Voucher updated");
      void qc.invalidateQueries({ queryKey: ["portal"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("payment_vouchers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Voucher deleted");
      void qc.invalidateQueries({ queryKey: ["portal"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <PortalHeading
        title="Payment Vouchers"
        subtitle="Money going out — suppliers, government fees, staff reimbursements and refunds."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setForm({ ...empty });
              setOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> New voucher
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Vouchers recorded", value: String(vouchers.length) },
          { label: "Approved / paid value", value: AED(approved.reduce((s, v) => s + Number(v.amount), 0)) },
          {
            label: "Awaiting approval",
            value: AED(
              vouchers.filter((v) => v.status === "draft").reduce((s, v) => s + Number(v.amount), 0),
            ),
          },
        ].map((k) => (
          <Panel key={k.label} className="p-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {k.label}
            </div>
            <div className="mt-2 text-lg font-semibold">{k.value}</div>
          </Panel>
        ))}
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search voucher no, payee, method…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <Panel className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Voucher</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Paid to</th>
              <th className="px-4 py-3">Account</th>
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((v) => (
              <tr key={v.id} className="hover:bg-muted/40">
                <td className="px-4 py-3 font-medium">{v.voucher_no}</td>
                <td className="px-4 py-3 text-muted-foreground">{fmtDate(v.voucher_date)}</td>
                <td className="px-4 py-3">
                  {v.payee}
                  <span className="block text-xs capitalize text-muted-foreground">{v.payee_type}</span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{v.account_code ?? "—"}</td>
                <td className="px-4 py-3 capitalize">{v.method}</td>
                <td className="px-4 py-3 text-right font-semibold">{AED(v.amount)}</td>
                <td className="px-4 py-3">
                  <StatusBadge value={v.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditing(v);
                        setForm({
                          voucher_date: v.voucher_date,
                          payee: v.payee,
                          payee_type: v.payee_type,
                          account_code: v.account_code ?? "",
                          amount: String(v.amount),
                          method: v.method,
                          reference: v.reference ?? "",
                          description: v.description ?? "",
                        });
                        setOpen(true);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    {v.status !== "paid" ? (
                      <Button size="sm" variant="outline" onClick={() => mark.mutate({ id: v.id, status: "paid" })}>
                        <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Mark paid
                      </Button>
                    ) : null}
                    <Button size="sm" variant="outline" onClick={() => window.print()}>
                      <Printer className="h-3.5 w-3.5" />
                    </Button>
                    {isAdmin ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (confirm(`Delete voucher ${v.voucher_no}?`)) remove.mutate(v.id);
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
                <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                  No payment vouchers yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </Panel>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${editing.voucher_no}` : "New payment voucher"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="vdate">Date</Label>
              <Input
                id="vdate"
                type="date"
                value={form.voucher_date}
                onChange={(e) => setForm({ ...form, voucher_date: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vpayee">Paid to *</Label>
              <Input id="vpayee" value={form.payee} onChange={(e) => setForm({ ...form, payee: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vtype">Payee type</Label>
              <select
                id="vtype"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.payee_type}
                onChange={(e) => setForm({ ...form, payee_type: e.target.value })}
              >
                {PAYEE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vacc">Expense account</Label>
              <select
                id="vacc"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.account_code}
                onChange={(e) => setForm({ ...form, account_code: e.target.value })}
              >
                <option value="">— none —</option>
                {accounts.map((a) => (
                  <option key={a.code} value={a.code}>
                    {a.code} — {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vamount">Amount (AED) *</Label>
              <Input
                id="vamount"
                inputMode="decimal"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vmethod">Method</Label>
              <select
                id="vmethod"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.method}
                onChange={(e) => setForm({ ...form, method: e.target.value })}
              >
                {METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vref">Reference</Label>
              <Input
                id="vref"
                value={form.reference}
                onChange={(e) => setForm({ ...form, reference: e.target.value })}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="vdesc">Description</Label>
              <Input
                id="vdesc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button disabled={save.isPending} onClick={() => save.mutate()}>
              Save voucher
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
