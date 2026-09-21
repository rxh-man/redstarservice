import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Trash2, CheckCircle2, Printer } from "lucide-react";
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

export const Route = createFileRoute("/portal/payroll")({
  head: () => ({
    meta: [
      { title: "Staff Salaries — Red Star Services ERP" },
      { name: "description", content: "Salary structures and monthly salary payments for Red Star Services staff." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Staff Salaries — Red Star Services ERP" },
      { property: "og:description", content: "Basic pay, allowances, deductions and monthly salary runs." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PayrollPage,
});

type Salary = {
  id: string;
  profile_id: string | null;
  staff_name: string;
  designation: string | null;
  basic_salary: number;
  allowances: number;
  effective_from: string;
  bank_account: string | null;
  notes: string | null;
  active: boolean;
};

type Payment = {
  id: string;
  payment_no: string;
  salary_id: string | null;
  staff_name: string;
  period_month: string;
  basic_salary: number;
  allowances: number;
  deductions: number;
  net_pay: number;
  method: string;
  reference: string | null;
  paid_on: string | null;
  status: string;
  notes: string | null;
};

const METHODS = ["bank", "cash", "cheque", "wps"];
const today = () => new Date().toISOString().slice(0, 10);
const monthStart = () => `${new Date().toISOString().slice(0, 7)}-01`;

const emptySalary = {
  profile_id: "",
  staff_name: "",
  designation: "",
  basic_salary: "",
  allowances: "0",
  effective_from: today(),
  bank_account: "",
  notes: "",
};

const emptyPayment = {
  salary_id: "",
  staff_name: "",
  period_month: monthStart(),
  basic_salary: "",
  allowances: "0",
  deductions: "0",
  method: "bank",
  reference: "",
  paid_on: "",
  status: "pending",
  notes: "",
};

function PayrollPage() {
  const { isAdmin, session } = usePortal();
  const qc = useQueryClient();
  const [salaryOpen, setSalaryOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [editingSalary, setEditingSalary] = useState<Salary | null>(null);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [sForm, setSForm] = useState({ ...emptySalary });
  const [pForm, setPForm] = useState({ ...emptyPayment });

  const { data } = useQuery({
    queryKey: ["portal", "payroll"],
    queryFn: async () => {
      const [sal, pay, prof] = await Promise.all([
        supabase.from("staff_salaries").select("*").order("staff_name"),
        supabase.from("salary_payments").select("*").order("period_month", { ascending: false }),
        supabase.from("profiles").select("id, full_name, job_title").order("full_name"),
      ]);
      if (sal.error) throw sal.error;
      if (pay.error) throw pay.error;
      return {
        salaries: (sal.data ?? []) as Salary[],
        payments: (pay.data ?? []) as Payment[],
        profiles: prof.data ?? [],
      };
    },
  });

  const salaries = data?.salaries ?? [];
  const payments = data?.payments ?? [];
  const profiles = data?.profiles ?? [];

  const monthlyCost = salaries
    .filter((s) => s.active)
    .reduce((s, r) => s + Number(r.basic_salary) + Number(r.allowances), 0);
  const thisMonth = payments.filter((p) => p.period_month.slice(0, 7) === new Date().toISOString().slice(0, 7));
  const pending = payments.filter((p) => p.status !== "paid");

  const saveSalary = useMutation({
    mutationFn: async () => {
      if (!sForm.staff_name.trim()) throw new Error("Enter the staff member's name.");
      const payload = {
        profile_id: sForm.profile_id || null,
        staff_name: sForm.staff_name.trim(),
        designation: sForm.designation || null,
        basic_salary: Number(sForm.basic_salary) || 0,
        allowances: Number(sForm.allowances) || 0,
        effective_from: sForm.effective_from || today(),
        bank_account: sForm.bank_account || null,
        notes: sForm.notes || null,
      };
      if (editingSalary) {
        const { error } = await supabase.from("staff_salaries").update(payload as never).eq("id", editingSalary.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("staff_salaries").insert(payload as never);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingSalary ? "Salary updated" : "Salary added");
      setSalaryOpen(false);
      setEditingSalary(null);
      setSForm({ ...emptySalary });
      void qc.invalidateQueries({ queryKey: ["portal"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeSalary = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("staff_salaries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Salary record removed");
      void qc.invalidateQueries({ queryKey: ["portal"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const savePayment = useMutation({
    mutationFn: async () => {
      if (!pForm.staff_name.trim()) throw new Error("Select or enter the staff member.");
      const payload = {
        salary_id: pForm.salary_id || null,
        staff_name: pForm.staff_name.trim(),
        period_month: pForm.period_month,
        basic_salary: Number(pForm.basic_salary) || 0,
        allowances: Number(pForm.allowances) || 0,
        deductions: Number(pForm.deductions) || 0,
        method: pForm.method,
        reference: pForm.reference || null,
        paid_on: pForm.paid_on || null,
        status: pForm.status,
        notes: pForm.notes || null,
      };
      if (editingPayment) {
        const { error } = await supabase
          .from("salary_payments")
          .update(payload as never)
          .eq("id", editingPayment.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("salary_payments")
          .insert({ ...payload, payment_no: "", created_by: session?.user.id ?? null } as never);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingPayment ? "Salary payment updated" : "Salary payment recorded");
      setPayOpen(false);
      setEditingPayment(null);
      setPForm({ ...emptyPayment });
      void qc.invalidateQueries({ queryKey: ["portal"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const markPaid = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("salary_payments")
        .update({ status: "paid", paid_on: today() } as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Marked as paid");
      void qc.invalidateQueries({ queryKey: ["portal"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removePayment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("salary_payments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Salary payment deleted");
      void qc.invalidateQueries({ queryKey: ["portal"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const net =
    (Number(pForm.basic_salary) || 0) + (Number(pForm.allowances) || 0) - (Number(pForm.deductions) || 0);

  return (
    <div>
      <PortalHeading
        title="Staff Salaries"
        subtitle="Salary structures per staff member and the monthly salary run with deductions and net pay."
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setEditingSalary(null);
                setSForm({ ...emptySalary });
                setSalaryOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> Salary structure
            </Button>
            <Button
              onClick={() => {
                setEditingPayment(null);
                setPForm({ ...emptyPayment });
                setPayOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> Pay salary
            </Button>
          </>
        }
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Active staff on payroll", value: String(salaries.filter((s) => s.active).length) },
          { label: "Monthly payroll cost", value: AED(monthlyCost) },
          { label: "Paid this month", value: AED(thisMonth.filter((p) => p.status === "paid").reduce((s, p) => s + Number(p.net_pay), 0)) },
          { label: "Pending salary payments", value: AED(pending.reduce((s, p) => s + Number(p.net_pay), 0)) },
        ].map((k) => (
          <Panel key={k.label} className="p-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {k.label}
            </div>
            <div className="mt-2 text-lg font-semibold">{k.value}</div>
          </Panel>
        ))}
      </div>

      <Panel className="mb-8 overflow-x-auto">
        <div className="border-b border-border px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Salary structures
        </div>
        <table className="w-full min-w-[780px] text-sm">
          <thead className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Staff</th>
              <th className="px-4 py-3">Designation</th>
              <th className="px-4 py-3 text-right">Basic</th>
              <th className="px-4 py-3 text-right">Allowances</th>
              <th className="px-4 py-3 text-right">Gross</th>
              <th className="px-4 py-3">Effective</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {salaries.map((s) => (
              <tr key={s.id} className="hover:bg-muted/40">
                <td className="px-4 py-3 font-medium">{s.staff_name}</td>
                <td className="px-4 py-3 text-muted-foreground">{s.designation ?? "—"}</td>
                <td className="px-4 py-3 text-right">{AED(s.basic_salary)}</td>
                <td className="px-4 py-3 text-right">{AED(s.allowances)}</td>
                <td className="px-4 py-3 text-right font-semibold">
                  {AED(Number(s.basic_salary) + Number(s.allowances))}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{fmtDate(s.effective_from)}</td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingSalary(s);
                        setSForm({
                          profile_id: s.profile_id ?? "",
                          staff_name: s.staff_name,
                          designation: s.designation ?? "",
                          basic_salary: String(s.basic_salary),
                          allowances: String(s.allowances),
                          effective_from: s.effective_from,
                          bank_account: s.bank_account ?? "",
                          notes: s.notes ?? "",
                        });
                        setSalaryOpen(true);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        setEditingPayment(null);
                        setPForm({
                          ...emptyPayment,
                          salary_id: s.id,
                          staff_name: s.staff_name,
                          basic_salary: String(s.basic_salary),
                          allowances: String(s.allowances),
                        });
                        setPayOpen(true);
                      }}
                    >
                      Pay
                    </Button>
                    {isAdmin ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (confirm(`Remove salary record for ${s.staff_name}?`)) removeSalary.mutate(s.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
            {salaries.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                  No salary structures added yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </Panel>

      <Panel className="overflow-x-auto">
        <div className="border-b border-border px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Salary payments
        </div>
        <table className="w-full min-w-[900px] text-sm">
          <thead className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Payslip</th>
              <th className="px-4 py-3">Staff</th>
              <th className="px-4 py-3">Month</th>
              <th className="px-4 py-3 text-right">Basic</th>
              <th className="px-4 py-3 text-right">Allowances</th>
              <th className="px-4 py-3 text-right">Deductions</th>
              <th className="px-4 py-3 text-right">Net pay</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {payments.map((p) => (
              <tr key={p.id} className="hover:bg-muted/40">
                <td className="px-4 py-3 font-medium">{p.payment_no}</td>
                <td className="px-4 py-3">{p.staff_name}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(p.period_month).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
                </td>
                <td className="px-4 py-3 text-right">{AED(p.basic_salary)}</td>
                <td className="px-4 py-3 text-right">{AED(p.allowances)}</td>
                <td className="px-4 py-3 text-right">{AED(p.deductions)}</td>
                <td className="px-4 py-3 text-right font-semibold">{AED(p.net_pay)}</td>
                <td className="px-4 py-3">
                  <StatusBadge value={p.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingPayment(p);
                        setPForm({
                          salary_id: p.salary_id ?? "",
                          staff_name: p.staff_name,
                          period_month: p.period_month,
                          basic_salary: String(p.basic_salary),
                          allowances: String(p.allowances),
                          deductions: String(p.deductions),
                          method: p.method,
                          reference: p.reference ?? "",
                          paid_on: p.paid_on ?? "",
                          status: p.status,
                          notes: p.notes ?? "",
                        });
                        setPayOpen(true);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    {p.status !== "paid" ? (
                      <Button size="sm" variant="outline" onClick={() => markPaid.mutate(p.id)}>
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
                          if (confirm(`Delete salary payment ${p.payment_no}?`)) removePayment.mutate(p.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
            {payments.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">
                  No salary payments recorded yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </Panel>

      <Dialog open={salaryOpen} onOpenChange={setSalaryOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingSalary ? "Edit salary structure" : "New salary structure"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="sprofile">Link to portal user</Label>
              <select
                id="sprofile"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={sForm.profile_id}
                onChange={(e) => {
                  const p = profiles.find((x) => x.id === e.target.value);
                  setSForm({
                    ...sForm,
                    profile_id: e.target.value,
                    staff_name: p?.full_name || sForm.staff_name,
                    designation: p?.job_title ?? sForm.designation,
                  });
                }}
              >
                <option value="">— not linked —</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sname">Staff name *</Label>
              <Input
                id="sname"
                value={sForm.staff_name}
                onChange={(e) => setSForm({ ...sForm, staff_name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sdesig">Designation</Label>
              <Input
                id="sdesig"
                value={sForm.designation}
                onChange={(e) => setSForm({ ...sForm, designation: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sbasic">Basic salary (AED)</Label>
              <Input
                id="sbasic"
                inputMode="decimal"
                value={sForm.basic_salary}
                onChange={(e) => setSForm({ ...sForm, basic_salary: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sallow">Allowances (AED)</Label>
              <Input
                id="sallow"
                inputMode="decimal"
                value={sForm.allowances}
                onChange={(e) => setSForm({ ...sForm, allowances: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="seff">Effective from</Label>
              <Input
                id="seff"
                type="date"
                value={sForm.effective_from}
                onChange={(e) => setSForm({ ...sForm, effective_from: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sbank">Bank / IBAN</Label>
              <Input
                id="sbank"
                value={sForm.bank_account}
                onChange={(e) => setSForm({ ...sForm, bank_account: e.target.value })}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="snotes">Notes</Label>
              <Input
                id="snotes"
                value={sForm.notes}
                onChange={(e) => setSForm({ ...sForm, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSalaryOpen(false)}>
              Cancel
            </Button>
            <Button disabled={saveSalary.isPending} onClick={() => saveSalary.mutate()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingPayment ? `Edit ${editingPayment.payment_no}` : "Pay salary"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="pstaff">Staff member</Label>
              <select
                id="pstaff"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={pForm.salary_id}
                onChange={(e) => {
                  const s = salaries.find((x) => x.id === e.target.value);
                  setPForm({
                    ...pForm,
                    salary_id: e.target.value,
                    staff_name: s?.staff_name ?? pForm.staff_name,
                    basic_salary: s ? String(s.basic_salary) : pForm.basic_salary,
                    allowances: s ? String(s.allowances) : pForm.allowances,
                  });
                }}
              >
                <option value="">— enter manually —</option>
                {salaries.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.staff_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pname">Name *</Label>
              <Input
                id="pname"
                value={pForm.staff_name}
                onChange={(e) => setPForm({ ...pForm, staff_name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pmonth">Salary month</Label>
              <Input
                id="pmonth"
                type="date"
                value={pForm.period_month}
                onChange={(e) => setPForm({ ...pForm, period_month: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pbasic">Basic (AED)</Label>
              <Input
                id="pbasic"
                inputMode="decimal"
                value={pForm.basic_salary}
                onChange={(e) => setPForm({ ...pForm, basic_salary: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pallow">Allowances (AED)</Label>
              <Input
                id="pallow"
                inputMode="decimal"
                value={pForm.allowances}
                onChange={(e) => setPForm({ ...pForm, allowances: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pded">Deductions (AED)</Label>
              <Input
                id="pded"
                inputMode="decimal"
                value={pForm.deductions}
                onChange={(e) => setPForm({ ...pForm, deductions: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pmethod">Method</Label>
              <select
                id="pmethod"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={pForm.method}
                onChange={(e) => setPForm({ ...pForm, method: e.target.value })}
              >
                {METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pref">Reference</Label>
              <Input
                id="pref"
                value={pForm.reference}
                onChange={(e) => setPForm({ ...pForm, reference: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pstatus">Status</Label>
              <select
                id="pstatus"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={pForm.status}
                onChange={(e) => setPForm({ ...pForm, status: e.target.value })}
              >
                <option value="pending">pending</option>
                <option value="paid">paid</option>
              </select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="pnotes">Notes</Label>
              <Input
                id="pnotes"
                value={pForm.notes}
                onChange={(e) => setPForm({ ...pForm, notes: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2 rounded-xl border border-border p-3 text-sm">
              Net pay <strong>{AED(net)}</strong>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayOpen(false)}>
              Cancel
            </Button>
            <Button disabled={savePayment.isPending} onClick={() => savePayment.mutate()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
