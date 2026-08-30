import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AED, Panel, PortalHeading, usePortal } from "@/lib/portal";
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

export const Route = createFileRoute("/portal/accounts")({ component: AccountsPage });

type Account = {
  id: string;
  code: string;
  name: string;
  type: string;
  parent_code: string | null;
  opening_balance: number;
  active: boolean;
};

const TYPES = ["asset", "liability", "equity", "income", "expense"] as const;
const empty = { code: "", name: "", type: "asset", parent_code: "", opening_balance: "0" };

function AccountsPage() {
  const { isAdmin } = usePortal();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [form, setForm] = useState({ ...empty });

  const { data } = useQuery({
    queryKey: ["portal", "accounts"],
    queryFn: async () => {
      const [acc, inv, rec] = await Promise.all([
        supabase.from("accounts").select("*").order("code"),
        supabase.from("invoices").select("total, vat_amount, govt_fees, subtotal, status"),
        supabase.from("receipts").select("amount"),
      ]);
      if (acc.error) throw acc.error;
      return { accounts: acc.data as Account[], invoices: inv.data ?? [], receipts: rec.data ?? [] };
    },
  });

  const accounts = data?.accounts ?? [];
  const live = (data?.invoices ?? []).filter((i) => i.status !== "cancelled");
  const revenue = live.reduce((s, i) => s + Number(i.subtotal), 0);
  const govt = live.reduce((s, i) => s + Number(i.govt_fees), 0);
  const vat = live.reduce((s, i) => s + Number(i.vat_amount), 0);
  const collected = (data?.receipts ?? []).reduce((s, r) => s + Number(r.amount), 0);
  const billed = live.reduce((s, i) => s + Number(i.total), 0);

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        code: form.code,
        name: form.name,
        type: form.type,
        parent_code: form.parent_code || null,
        opening_balance: Number(form.opening_balance) || 0,
      } as never;
      if (editing) {
        const { error } = await supabase.from("accounts").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("accounts").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Account updated" : "Account added");
      setOpen(false);
      setEditing(null);
      setForm({ ...empty });
      void qc.invalidateQueries({ queryKey: ["portal"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("accounts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Account deleted");
      void qc.invalidateQueries({ queryKey: ["portal"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const kpis = [
    { label: "Service revenue (billed)", value: AED(revenue) },
    { label: "Government fees recovered", value: AED(govt) },
    { label: "VAT payable", value: AED(vat) },
    { label: "Cash collected", value: AED(collected) },
    { label: "Accounts receivable", value: AED(Math.max(billed - collected, 0)) },
  ];

  return (
    <div>
      <PortalHeading
        title="Chart of Accounts"
        subtitle="Ledger structure plus live figures derived from invoices and receipts."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setForm({ ...empty });
              setOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> New account
          </Button>
        }
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {kpis.map((k) => (
          <Panel key={k.label} className="p-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {k.label}
            </div>
            <div className="mt-2 text-lg font-semibold">{k.value}</div>
          </Panel>
        ))}
      </div>

      {TYPES.map((type) => {
        const rows = accounts.filter((a) => a.type === type);
        if (rows.length === 0) return null;
        return (
          <Panel key={type} className="mb-6 overflow-x-auto">
            <div className="border-b border-border px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {type}
            </div>
            <table className="w-full min-w-[640px] text-sm">
              <tbody className="divide-y divide-border">
                {rows.map((a) => (
                  <tr key={a.id}>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{a.code}</td>
                    <td className={`px-4 py-3 ${a.parent_code ? "pl-8" : "font-medium"}`}>{a.name}</td>
                    <td className="px-4 py-3 text-right">{AED(a.opening_balance)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditing(a);
                            setForm({
                              code: a.code,
                              name: a.name,
                              type: a.type,
                              parent_code: a.parent_code ?? "",
                              opening_balance: String(a.opening_balance),
                            });
                            setOpen(true);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        {isAdmin ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (confirm(`Delete account ${a.code} — ${a.name}?`)) remove.mutate(a.id);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        );
      })}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit account" : "New account"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="code">Code *</Label>
              <Input id="code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="aname">Name *</Label>
              <Input id="aname" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="parent">Parent code</Label>
              <Input
                id="parent"
                value={form.parent_code}
                onChange={(e) => setForm({ ...form, parent_code: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ob">Opening balance</Label>
              <Input
                id="ob"
                value={form.opening_balance}
                onChange={(e) => setForm({ ...form, opening_balance: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button disabled={!form.code || !form.name || save.isPending} onClick={() => save.mutate()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
