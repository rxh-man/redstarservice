import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Building2, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Panel, PortalHeading, usePortal } from "@/lib/portal";
import { ExpiryDate } from "@/lib/expiry";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/portal/companies/")({ component: CompaniesPage });

export type CompanyRow = {
  id: string;
  name: string;
  name_ar: string | null;
  trade_license_no: string | null;
  license_expiry: string | null;
  establishment_card_no: string | null;
  establishment_card_expiry: string | null;
  trn: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  assigned_typist: string | null;
  active: boolean;
};

const empty = {
  name: "",
  name_ar: "",
  trade_license_no: "",
  license_expiry: "",
  establishment_card_no: "",
  establishment_card_expiry: "",
  trn: "",
  phone: "",
  email: "",
  address: "",
  notes: "",
  assigned_typist: "",
};

function CompaniesPage() {
  const { isAccountant, session } = usePortal();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...empty });
  const [q, setQ] = useState("");

  const { data } = useQuery({
    queryKey: ["portal", "companies"],
    queryFn: async () => {
      const [companies, staff, employees] = await Promise.all([
        supabase.from("companies").select("*").order("name"),
        supabase.from("profiles").select("id, full_name").order("full_name"),
        supabase.from("company_employees").select("id, company_id"),
      ]);
      if (companies.error) throw companies.error;
      return {
        companies: (companies.data ?? []) as CompanyRow[],
        staff: (staff.data ?? []) as { id: string; full_name: string }[],
        employees: (employees.data ?? []) as { id: string; company_id: string }[],
      };
    },
  });

  const companies = data?.companies ?? [];
  const staffName = (id: string | null) =>
    id ? data?.staff.find((s) => s.id === id)?.full_name || "Assigned" : "Unassigned";
  const employeeCount = (id: string) => (data?.employees ?? []).filter((e) => e.company_id === id).length;

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("companies").insert({
        name: form.name.trim(),
        name_ar: form.name_ar || null,
        trade_license_no: form.trade_license_no || null,
        license_expiry: form.license_expiry || null,
        establishment_card_no: form.establishment_card_no || null,
        establishment_card_expiry: form.establishment_card_expiry || null,
        trn: form.trn || null,
        phone: form.phone || null,
        email: form.email || null,
        address: form.address || null,
        notes: form.notes || null,
        assigned_typist: form.assigned_typist || null,
        created_by: session?.user.id ?? null,
      } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Company saved");
      setOpen(false);
      setForm({ ...empty });
      void qc.invalidateQueries({ queryKey: ["portal"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const needle = q.trim().toLowerCase();
  const visible = companies.filter(
    (c) =>
      !needle ||
      c.name.toLowerCase().includes(needle) ||
      (c.trade_license_no ?? "").toLowerCase().includes(needle) ||
      (c.name_ar ?? "").includes(q.trim()),
  );

  return (
    <div>
      <PortalHeading
        title="Companies"
        subtitle="Corporate accounts with trade licence and establishment card tracking."
        actions={
          isAccountant ? (
            <Button onClick={() => setOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> New company
            </Button>
          ) : null
        }
      />

      <div className="mb-4 flex max-w-sm items-center gap-2 rounded-md border border-input bg-background px-3">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          className="h-10 w-full bg-transparent text-sm outline-none"
          placeholder="Search name or trade licence…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <Panel className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Trade licence</th>
              <th className="px-4 py-3">Licence expiry</th>
              <th className="px-4 py-3">Est. card expiry</th>
              <th className="px-4 py-3">Employees</th>
              <th className="px-4 py-3">Typist</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {visible.map((c) => (
              <tr key={c.id} className="hover:bg-muted/40">
                <td className="px-4 py-3">
                  <Link to="/portal/companies/$id" params={{ id: c.id }} className="font-medium hover:underline">
                    {c.name}
                  </Link>
                  {c.name_ar ? <div className="text-xs text-muted-foreground">{c.name_ar}</div> : null}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{c.trade_license_no ?? "—"}</td>
                <td className="px-4 py-3">
                  <ExpiryDate date={c.license_expiry} />
                </td>
                <td className="px-4 py-3">
                  <ExpiryDate date={c.establishment_card_expiry} />
                </td>
                <td className="px-4 py-3">{employeeCount(c.id)}</td>
                <td className="px-4 py-3 text-muted-foreground">{staffName(c.assigned_typist)}</td>
              </tr>
            ))}
            {visible.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  <Building2 className="mx-auto mb-3 h-6 w-6 opacity-50" />
                  No companies yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </Panel>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New company</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="cname">Company name *</Label>
              <Input id="cname" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="cnamear">Name (Arabic)</Label>
              <Input id="cnamear" dir="rtl" value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ctl">Trade licence no.</Label>
              <Input id="ctl" value={form.trade_license_no} onChange={(e) => setForm({ ...form, trade_license_no: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ctle">Licence expiry</Label>
              <Input id="ctle" type="date" value={form.license_expiry} onChange={(e) => setForm({ ...form, license_expiry: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cec">Establishment card no.</Label>
              <Input id="cec" value={form.establishment_card_no} onChange={(e) => setForm({ ...form, establishment_card_no: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cece">Est. card expiry</Label>
              <Input id="cece" type="date" value={form.establishment_card_expiry} onChange={(e) => setForm({ ...form, establishment_card_expiry: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ctrn">TRN</Label>
              <Input id="ctrn" value={form.trn} onChange={(e) => setForm({ ...form, trn: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cphone">Phone</Label>
              <Input id="cphone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cemail">Email</Label>
              <Input id="cemail" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ctyp">Assigned typist</Label>
              <select
                id="ctyp"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.assigned_typist}
                onChange={(e) => setForm({ ...form, assigned_typist: e.target.value })}
              >
                <option value="">— unassigned —</option>
                {(data?.staff ?? []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.full_name || s.id}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="caddr">Address</Label>
              <Input id="caddr" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="cnotes">Notes</Label>
              <Textarea id="cnotes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button disabled={!form.name.trim() || create.isPending} onClick={() => create.mutate()}>
              Save company
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
