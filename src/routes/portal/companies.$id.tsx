import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, ListChecks, Pencil, Plus, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Panel, PortalHeading, StatusBadge, fmtDate, usePortal } from "@/lib/portal";
import { ExpiryDate } from "@/lib/expiry";
import { startWorkflow } from "@/lib/workflow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/portal/companies/$id")({ component: CompanyDetail });

type Employee = {
  id: string;
  company_id: string;
  name: string;
  nationality: string | null;
  designation: string | null;
  phone: string | null;
  passport_no: string | null;
  passport_expiry: string | null;
  visa_no: string | null;
  visa_expiry: string | null;
  emirates_id_no: string | null;
  emirates_id_expiry: string | null;
  labour_card_no: string | null;
  labour_card_expiry: string | null;
  status: string;
};

const emptyEmp = {
  name: "",
  nationality: "",
  designation: "",
  phone: "",
  passport_no: "",
  passport_expiry: "",
  visa_no: "",
  visa_expiry: "",
  emirates_id_no: "",
  emirates_id_expiry: "",
  labour_card_no: "",
  labour_card_expiry: "",
};

const emptyCompany = {
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

function CompanyDetail() {
  const { id } = Route.useParams();
  const { session, isAccountant, isAdmin } = usePortal();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [empOpen, setEmpOpen] = useState(false);
  const [empId, setEmpId] = useState<string | null>(null);
  const [emp, setEmp] = useState({ ...emptyEmp });
  const [wfOpen, setWfOpen] = useState(false);
  const [wf, setWf] = useState({ template_id: "", employee_id: "" });
  const [coOpen, setCoOpen] = useState(false);
  const [co, setCo] = useState({ ...emptyCompany });

  const { data } = useQuery({
    queryKey: ["portal", "company", id],
    queryFn: async () => {
      const [company, employees, workflows, templates, steps, staff] = await Promise.all([
        supabase.from("companies").select("*").eq("id", id).maybeSingle(),
        supabase.from("company_employees").select("*").eq("company_id", id).order("name"),
        supabase.from("workflows").select("*").eq("company_id", id).order("created_at", { ascending: false }),
        supabase.from("workflow_templates").select("id, name").eq("active", true).order("name"),
        supabase.from("workflow_steps").select("id, workflow_id, status"),
        supabase.from("profiles").select("id, full_name"),
      ]);
      if (company.error) throw company.error;
      return {
        company: company.data as Record<string, string | boolean | null> | null,
        employees: (employees.data ?? []) as Employee[],
        workflows: (workflows.data ?? []) as {
          id: string;
          workflow_no: string;
          title: string;
          status: string;
          employee_id: string | null;
          created_at: string;
        }[],
        templates: (templates.data ?? []) as { id: string; name: string }[],
        steps: (steps.data ?? []) as { id: string; workflow_id: string; status: string }[],
        staff: (staff.data ?? []) as { id: string; full_name: string }[],
      };
    },
  });

  const company = data?.company;
  const employees = data?.employees ?? [];

  const openNewEmp = () => {
    setEmpId(null);
    setEmp({ ...emptyEmp });
    setEmpOpen(true);
  };

  const openEditEmp = (row: Employee) => {
    setEmpId(row.id);
    setEmp({
      name: row.name ?? "",
      nationality: row.nationality ?? "",
      designation: row.designation ?? "",
      phone: row.phone ?? "",
      passport_no: row.passport_no ?? "",
      passport_expiry: row.passport_expiry ?? "",
      visa_no: row.visa_no ?? "",
      visa_expiry: row.visa_expiry ?? "",
      emirates_id_no: row.emirates_id_no ?? "",
      emirates_id_expiry: row.emirates_id_expiry ?? "",
      labour_card_no: row.labour_card_no ?? "",
      labour_card_expiry: row.labour_card_expiry ?? "",
    });
    setEmpOpen(true);
  };

  const openEditCompany = () => {
    if (!company) return;
    setCo({
      name: (company["name"] as string) ?? "",
      name_ar: (company["name_ar"] as string) ?? "",
      trade_license_no: (company["trade_license_no"] as string) ?? "",
      license_expiry: (company["license_expiry"] as string) ?? "",
      establishment_card_no: (company["establishment_card_no"] as string) ?? "",
      establishment_card_expiry: (company["establishment_card_expiry"] as string) ?? "",
      trn: (company["trn"] as string) ?? "",
      phone: (company["phone"] as string) ?? "",
      email: (company["email"] as string) ?? "",
      address: (company["address"] as string) ?? "",
      notes: (company["notes"] as string) ?? "",
      assigned_typist: (company["assigned_typist"] as string) ?? "",
    });
    setCoOpen(true);
  };

  const saveCompany = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("companies")
        .update({
          name: co.name.trim(),
          name_ar: co.name_ar || null,
          trade_license_no: co.trade_license_no || null,
          license_expiry: co.license_expiry || null,
          establishment_card_no: co.establishment_card_no || null,
          establishment_card_expiry: co.establishment_card_expiry || null,
          trn: co.trn || null,
          phone: co.phone || null,
          email: co.email || null,
          address: co.address || null,
          notes: co.notes || null,
          assigned_typist: co.assigned_typist || null,
        } as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Company updated");
      setCoOpen(false);
      void qc.invalidateQueries({ queryKey: ["portal"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeCompany = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("companies").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Company deleted");
      void qc.invalidateQueries({ queryKey: ["portal"] });
      navigate({ to: "/portal/companies" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveEmployee = useMutation({
    mutationFn: async () => {
      const payload = {
        name: emp.name.trim(),
        nationality: emp.nationality || null,
        designation: emp.designation || null,
        phone: emp.phone || null,
        passport_no: emp.passport_no || null,
        passport_expiry: emp.passport_expiry || null,
        visa_no: emp.visa_no || null,
        visa_expiry: emp.visa_expiry || null,
        emirates_id_no: emp.emirates_id_no || null,
        emirates_id_expiry: emp.emirates_id_expiry || null,
        labour_card_no: emp.labour_card_no || null,
        labour_card_expiry: emp.labour_card_expiry || null,
      };
      if (empId) {
        const { error } = await supabase.from("company_employees").update(payload as never).eq("id", empId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("company_employees").insert({
          ...payload,
          company_id: id,
          created_by: session?.user.id ?? null,
        } as never);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(empId ? "Employee updated" : "Employee saved");
      setEmpOpen(false);
      setEmpId(null);
      setEmp({ ...emptyEmp });
      void qc.invalidateQueries({ queryKey: ["portal"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeEmployee = useMutation({
    mutationFn: async (rowId: string) => {
      const { error } = await supabase.from("company_employees").delete().eq("id", rowId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Employee removed");
      setEmpOpen(false);
      void qc.invalidateQueries({ queryKey: ["portal"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const begin = useMutation({
    mutationFn: async () => {
      const tpl = data?.templates.find((t) => t.id === wf.template_id);
      const person = employees.find((e) => e.id === wf.employee_id);
      return startWorkflow({
        templateId: wf.template_id,
        companyId: id,
        employeeId: wf.employee_id || null,
        title: person ? `${tpl?.name ?? "Workflow"} — ${person.name}` : tpl?.name ?? "Workflow",
        typistId: (company?.["assigned_typist"] as string | null) ?? null,
        userId: session?.user.id ?? null,
      });
    },
    onSuccess: (wfId) => {
      toast.success("Workflow started");
      setWfOpen(false);
      setWf({ template_id: "", employee_id: "" });
      void qc.invalidateQueries({ queryKey: ["portal"] });
      navigate({ to: "/portal/workflows/$id", params: { id: wfId } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const progress = (workflowId: string) => {
    const rows = (data?.steps ?? []).filter((s) => s.workflow_id === workflowId);
    return `${rows.filter((s) => s.status === "completed").length} of ${rows.length}`;
  };
  const empName = (eid: string | null) => employees.find((e) => e.id === eid)?.name ?? "—";

  if (!company) {
    return (
      <div>
        <Link to="/portal/companies" className="text-sm text-muted-foreground hover:underline">
          ← Back to companies
        </Link>
        <p className="mt-6 text-muted-foreground">Company not found or not assigned to you.</p>
      </div>
    );
  }

  const facts: [string, React.ReactNode][] = [
    ["Trade licence", (company["trade_license_no"] as string) || "—"],
    ["Licence expiry", <ExpiryDate date={company["license_expiry"] as string | null} />],
    ["Establishment card", (company["establishment_card_no"] as string) || "—"],
    ["Est. card expiry", <ExpiryDate date={company["establishment_card_expiry"] as string | null} />],
    ["TRN", (company["trn"] as string) || "—"],
    ["Phone", (company["phone"] as string) || "—"],
    ["Email", (company["email"] as string) || "—"],
    [
      "Assigned typist",
      (data?.staff.find((s) => s.id === company["assigned_typist"])?.full_name as string) || "Unassigned",
    ],
  ];

  return (
    <div>
      <Link
        to="/portal/companies"
        className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:underline"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Companies
      </Link>

      <PortalHeading
        title={company["name"] as string}
        subtitle={(company["address"] as string) || undefined}
        actions={
          <div className="flex flex-wrap gap-2">
            {isAccountant ? (
              <Button variant="outline" onClick={openEditCompany}>
                <Pencil className="mr-2 h-4 w-4" /> Edit company
              </Button>
            ) : null}
            <Button variant="outline" onClick={openNewEmp}>
              <UserPlus className="mr-2 h-4 w-4" /> Add employee
            </Button>
            <Button onClick={() => setWfOpen(true)}>
              <ListChecks className="mr-2 h-4 w-4" /> Start workflow
            </Button>
            {isAdmin ? (
              <Button
                variant="outline"
                className="text-red-700"
                onClick={() => {
                  if (confirm("Delete this company with all its employees and workflows?")) removeCompany.mutate();
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </Button>
            ) : null}
          </div>
        }
      />

      <Panel className="p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {facts.map(([label, value]) => (
            <div key={label}>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {label}
              </div>
              <div className="mt-1 text-sm">{value}</div>
            </div>
          ))}
        </div>
      </Panel>

      <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        Employees ({employees.length})
      </h2>
      <Panel className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-sm">
          <thead className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">Passport</th>
              <th className="px-4 py-3">Visa</th>
              <th className="px-4 py-3">Emirates ID</th>
              <th className="px-4 py-3">Labour card</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {employees.map((e) => (
              <tr key={e.id} className="hover:bg-muted/40">
                <td className="px-4 py-3">
                  <button className="text-left font-medium hover:underline" onClick={() => openEditEmp(e)}>
                    {e.name}
                  </button>
                  <div className="text-xs text-muted-foreground">
                    {[e.designation, e.nationality].filter(Boolean).join(" · ") || "—"}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <ExpiryDate date={e.passport_expiry} />
                </td>
                <td className="px-4 py-3">
                  <ExpiryDate date={e.visa_expiry} />
                </td>
                <td className="px-4 py-3">
                  <ExpiryDate date={e.emirates_id_expiry} />
                </td>
                <td className="px-4 py-3">
                  <ExpiryDate date={e.labour_card_expiry} />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEditEmp(e)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {isAdmin ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-700"
                        onClick={() => {
                          if (confirm(`Remove ${e.name}?`)) removeEmployee.mutate(e.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
            {employees.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  No employees added yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </Panel>

      <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        Workflows
      </h2>
      <Panel className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Workflow</th>
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">Progress</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Started</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(data?.workflows ?? []).map((w) => (
              <tr key={w.id} className="hover:bg-muted/40">
                <td className="px-4 py-3">
                  <Link to="/portal/workflows/$id" params={{ id: w.id }} className="font-medium hover:underline">
                    {w.workflow_no}
                  </Link>
                </td>
                <td className="px-4 py-3">{w.title}</td>
                <td className="px-4 py-3 text-muted-foreground">{empName(w.employee_id)}</td>
                <td className="px-4 py-3">{progress(w.id)}</td>
                <td className="px-4 py-3">
                  <StatusBadge value={w.status} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">{fmtDate(w.created_at)}</td>
              </tr>
            ))}
            {(data?.workflows ?? []).length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  No workflows started for this company.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </Panel>

      <Dialog open={coOpen} onOpenChange={setCoOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit company</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="ecname">Company name *</Label>
              <Input id="ecname" value={co.name} onChange={(e) => setCo({ ...co, name: e.target.value })} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="ecnamear">Name (Arabic)</Label>
              <Input id="ecnamear" dir="rtl" value={co.name_ar} onChange={(e) => setCo({ ...co, name_ar: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ectl">Trade licence no.</Label>
              <Input id="ectl" value={co.trade_license_no} onChange={(e) => setCo({ ...co, trade_license_no: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ectle">Licence expiry</Label>
              <Input id="ectle" type="date" value={co.license_expiry} onChange={(e) => setCo({ ...co, license_expiry: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ecec">Establishment card no.</Label>
              <Input id="ecec" value={co.establishment_card_no} onChange={(e) => setCo({ ...co, establishment_card_no: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ecece">Est. card expiry</Label>
              <Input id="ecece" type="date" value={co.establishment_card_expiry} onChange={(e) => setCo({ ...co, establishment_card_expiry: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ectrn">TRN</Label>
              <Input id="ectrn" value={co.trn} onChange={(e) => setCo({ ...co, trn: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ecphone">Phone</Label>
              <Input id="ecphone" value={co.phone} onChange={(e) => setCo({ ...co, phone: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ecemail">Email</Label>
              <Input id="ecemail" type="email" value={co.email} onChange={(e) => setCo({ ...co, email: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ectyp">Assigned typist</Label>
              <select
                id="ectyp"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={co.assigned_typist}
                onChange={(e) => setCo({ ...co, assigned_typist: e.target.value })}
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
              <Label htmlFor="ecaddr">Address</Label>
              <Input id="ecaddr" value={co.address} onChange={(e) => setCo({ ...co, address: e.target.value })} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="ecnotes">Notes</Label>
              <Textarea id="ecnotes" value={co.notes} onChange={(e) => setCo({ ...co, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCoOpen(false)}>
              Cancel
            </Button>
            <Button disabled={!co.name.trim() || saveCompany.isPending} onClick={() => saveCompany.mutate()}>
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={empOpen} onOpenChange={setEmpOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{empId ? "Edit employee" : "Add employee"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="ename">Full name *</Label>
              <Input id="ename" value={emp.name} onChange={(e) => setEmp({ ...emp, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="enat">Nationality</Label>
              <Input id="enat" value={emp.nationality} onChange={(e) => setEmp({ ...emp, nationality: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edes">Designation</Label>
              <Input id="edes" value={emp.designation} onChange={(e) => setEmp({ ...emp, designation: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ephone">Phone</Label>
              <Input id="ephone" value={emp.phone} onChange={(e) => setEmp({ ...emp, phone: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="epn">Passport no.</Label>
              <Input id="epn" value={emp.passport_no} onChange={(e) => setEmp({ ...emp, passport_no: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="epe">Passport expiry</Label>
              <Input id="epe" type="date" value={emp.passport_expiry} onChange={(e) => setEmp({ ...emp, passport_expiry: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="evn">Visa no.</Label>
              <Input id="evn" value={emp.visa_no} onChange={(e) => setEmp({ ...emp, visa_no: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="eve">Visa expiry</Label>
              <Input id="eve" type="date" value={emp.visa_expiry} onChange={(e) => setEmp({ ...emp, visa_expiry: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="eid">Emirates ID no.</Label>
              <Input id="eid" value={emp.emirates_id_no} onChange={(e) => setEmp({ ...emp, emirates_id_no: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="eide">Emirates ID expiry</Label>
              <Input id="eide" type="date" value={emp.emirates_id_expiry} onChange={(e) => setEmp({ ...emp, emirates_id_expiry: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="elc">Labour card no.</Label>
              <Input id="elc" value={emp.labour_card_no} onChange={(e) => setEmp({ ...emp, labour_card_no: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="elce">Labour card expiry</Label>
              <Input id="elce" type="date" value={emp.labour_card_expiry} onChange={(e) => setEmp({ ...emp, labour_card_expiry: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            {empId && isAdmin ? (
              <Button
                variant="outline"
                className="mr-auto text-red-700"
                onClick={() => {
                  if (confirm(`Remove ${emp.name}?`)) removeEmployee.mutate(empId);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Remove
              </Button>
            ) : null}
            <Button variant="outline" onClick={() => setEmpOpen(false)}>
              Cancel
            </Button>
            <Button disabled={!emp.name.trim() || saveEmployee.isPending} onClick={() => saveEmployee.mutate()}>
              {empId ? "Save changes" : "Save employee"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={wfOpen} onOpenChange={setWfOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start a workflow</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="wtpl">Workflow *</Label>
              <select
                id="wtpl"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={wf.template_id}
                onChange={(e) => setWf({ ...wf, template_id: e.target.value })}
              >
                <option value="">— select —</option>
                {(data?.templates ?? []).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wemp">Employee</Label>
              <select
                id="wemp"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={wf.employee_id}
                onChange={(e) => setWf({ ...wf, employee_id: e.target.value })}
              >
                <option value="">— none —</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-muted-foreground">
              Steps are created automatically and unlock one at a time as each is completed.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWfOpen(false)}>
              Cancel
            </Button>
            <Button disabled={!wf.template_id || begin.isPending} onClick={() => begin.mutate()}>
              <Plus className="mr-2 h-4 w-4" /> Start
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
