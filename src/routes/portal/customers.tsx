import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Panel, PortalHeading, fmtDate, usePortal } from "@/lib/portal";
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

export const Route = createFileRoute("/portal/customers")({ component: CustomersPage });

type Customer = {
  id: string;
  name: string;
  name_ar: string | null;
  company: string | null;
  trn: string | null;
  email: string | null;
  phone: string | null;
  emirates_id: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
};

const empty = {
  name: "",
  name_ar: "",
  company: "",
  trn: "",
  email: "",
  phone: "",
  emirates_id: "",
  address: "",
  notes: "",
};

function CustomersPage() {
  const { isAdmin } = usePortal();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState({ ...empty });

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["portal", "customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Customer[];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const clean = Object.fromEntries(
        Object.entries(form).map(([k, v]) => [k, v === "" ? null : v]),
      ) as Record<string, string | null>;
      const payload = { ...clean, name: form.name } as never;
      if (editing) {
        const { error } = await supabase.from("customers").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("customers").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Customer updated" : "Customer added");
      setOpen(false);
      setEditing(null);
      setForm({ ...empty });
      void qc.invalidateQueries({ queryKey: ["portal"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("customers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Customer deleted");
      void qc.invalidateQueries({ queryKey: ["portal"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = customers.filter((c) =>
    [c.name, c.company, c.phone, c.email, c.trn].join(" ").toLowerCase().includes(q.toLowerCase()),
  );

  function startEdit(c: Customer) {
    setEditing(c);
    setForm({
      name: c.name ?? "",
      name_ar: c.name_ar ?? "",
      company: c.company ?? "",
      trn: c.trn ?? "",
      email: c.email ?? "",
      phone: c.phone ?? "",
      emirates_id: c.emirates_id ?? "",
      address: c.address ?? "",
      notes: c.notes ?? "",
    });
    setOpen(true);
  }

  return (
    <div>
      <PortalHeading
        title="Customers"
        subtitle="Client register used across invoices, receipts and typing jobs."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setForm({ ...empty });
              setOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> New customer
          </Button>
        }
      />

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search name, company, phone, TRN…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <Panel className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Company / TRN</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Added</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-3">
                  <div className="font-medium">{c.name}</div>
                  {c.name_ar ? <div className="arabic text-xs">{c.name_ar}</div> : null}
                </td>
                <td className="px-4 py-3">
                  <div>{c.company ?? "—"}</div>
                  <div className="text-xs text-muted-foreground">{c.trn ?? ""}</div>
                </td>
                <td className="px-4 py-3">
                  <div>{c.phone ?? "—"}</div>
                  <div className="text-xs text-muted-foreground">{c.email ?? ""}</div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{fmtDate(c.created_at)}</td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => startEdit(c)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    {isAdmin ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (confirm(`Delete ${c.name}? This cannot be undone.`)) remove.mutate(c.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
            {!isLoading && filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                  No customers found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </Panel>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit customer" : "New customer"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                ["name", "Full name *"],
                ["name_ar", "Name (Arabic)"],
                ["company", "Company"],
                ["trn", "TRN"],
                ["phone", "Phone"],
                ["email", "Email"],
                ["emirates_id", "Emirates ID"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="space-y-1.5">
                <Label htmlFor={key}>{label}</Label>
                <Input
                  id={key}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              </div>
            ))}
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button disabled={!form.name || save.isPending} onClick={() => save.mutate()}>
              {editing ? "Save changes" : "Add customer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
