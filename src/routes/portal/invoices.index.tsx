import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2, Search } from "lucide-react";
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

export const Route = createFileRoute("/portal/invoices/")({ component: InvoicesPage });

function InvoicesPage() {
  const { isAdmin, isAccountant, session } = usePortal();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState("");

  const { data } = useQuery({
    queryKey: ["portal", "invoices"],
    queryFn: async () => {
      const [inv, cust] = await Promise.all([
        supabase
          .from("invoices")
          .select("id, invoice_no, customer_id, issue_date, due_date, status, total, paid_amount")
          .order("issue_date", { ascending: false }),
        supabase.from("customers").select("id, name").order("name"),
      ]);
      if (inv.error) throw inv.error;
      return { invoices: inv.data, customers: cust.data ?? [] };
    },
  });

  const invoices = data?.invoices ?? [];
  const customers = data?.customers ?? [];
  const nameOf = (id: string | null) => customers.find((c) => c.id === id)?.name ?? "—";

  const create = useMutation({
    mutationFn: async () => {
      const { data: created, error } = await supabase
        .from("invoices")
        .insert({
          invoice_no: "",
          customer_id: customerId || null,
          issue_date: issueDate,
          due_date: dueDate || null,
          created_by: session?.user.id ?? null,
        } as never)
        .select("id")
        .single();
      if (error) throw error;
      return created.id as string;
    },
    onSuccess: (id) => {
      setOpen(false);
      void qc.invalidateQueries({ queryKey: ["portal"] });
      toast.success("Invoice created — add line items");
      navigate({ to: "/portal/invoices/$id", params: { id } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("invoices").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Invoice deleted");
      void qc.invalidateQueries({ queryKey: ["portal"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = invoices.filter((i) =>
    `${i.invoice_no} ${nameOf(i.customer_id)} ${i.status}`.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div>
      <PortalHeading
        title="Invoices"
        subtitle="Tax invoices with service fees, government fees and 5% VAT."
        actions={
          isAccountant ? (
            <Button onClick={() => setOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> New invoice
            </Button>
          ) : null
        }
      />

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search invoice no, customer, status…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <Panel className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Invoice</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Issued</th>
              <th className="px-4 py-3">Due</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-right">Balance</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((i) => (
              <tr key={i.id} className="hover:bg-muted/40">
                <td className="px-4 py-3 font-medium">
                  <Link to="/portal/invoices/$id" params={{ id: i.id }} className="hover:text-[color:var(--brand-red)]">
                    {i.invoice_no}
                  </Link>
                </td>
                <td className="px-4 py-3">{nameOf(i.customer_id)}</td>
                <td className="px-4 py-3 text-muted-foreground">{fmtDate(i.issue_date)}</td>
                <td className="px-4 py-3 text-muted-foreground">{fmtDate(i.due_date)}</td>
                <td className="px-4 py-3 text-right font-semibold">{AED(i.total)}</td>
                <td className="px-4 py-3 text-right">{AED(Number(i.total) - Number(i.paid_amount))}</td>
                <td className="px-4 py-3">
                  <StatusBadge value={i.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-2">
                    <Button size="sm" variant="outline" asChild>
                      <Link to="/portal/invoices/$id" params={{ id: i.id }}>
                        Open
                      </Link>
                    </Button>
                    {isAdmin ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (confirm(`Delete invoice ${i.invoice_no}?`)) remove.mutate(i.id);
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
                  No invoices yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </Panel>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New invoice</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="cust">Customer</Label>
              <select
                id="cust"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
              >
                <option value="">— select customer —</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="issue">Issue date</Label>
                <Input id="issue" type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="due">Due date</Label>
                <Input id="due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button disabled={!customerId || create.isPending} onClick={() => create.mutate()}>
              Create invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
