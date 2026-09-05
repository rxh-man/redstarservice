import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, ListChecks, Plus, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Panel, PortalHeading, StatusBadge, fmtDate, usePortal } from "@/lib/portal";
import { ExpiryDate } from "@/lib/expiry";
import { startWorkflow } from "@/lib/workflow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/portal/companies/$id")({ component: CompanyDetail });

type Employee = {
  id: string;
  company_id: string;
  name: string;
  nationality: string | null;
  designation: string | null;
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

function CompanyDetail() {
  const { id } = Route.useParams();
  const { session, isAccountant } = usePortal();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [empOpen, setEmpOpen] = useState(false);
  const [emp, setEmp] = useState({ ...emptyEmp });
  const [wfOpen, setWfOpen] = useState(false);
  const [wf, setWf] = useState({ template_id: "", employee_id: "" });

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

  const addEmployee = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("company_employees").insert({
        company_id: id,
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
        created_by: session?.user.id ?? null,
      } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Employee saved");
      setEmpOpen(false);
      setEmp({ ...emptyEmp });
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
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEmpOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" /> Add employee
            </Button>
            <Button onClick={() => setWfOpen(true)}>
              <ListChecks className="mr-2 h-4 w-4" /> Start workflow
            </Button>
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
        <table className="w-full min-w-[900px] text-sm">
          <thead className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">Passport</th>
              <th className="px-4 py-3">Visa</th>
              <th className="px-4 py-3">Emirates ID</th>
              <th className="px-4 py-3">Labour card</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {employees.map((e) => (
              <tr key={e.id}>
                <td className="px-4 py-3">
                  <div className="font-medium">{e.name}</div>
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
              </tr>
            ))}
            {employees.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
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

      <Dialog open={empOpen} onOpenChange={setEmpOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add employee</DialogTitle>
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
            <Button variant="outline" onClick={() => setEmpOpen(false)}>
              Cancel
            </Button>
            <Button disabled={!emp.name.trim() || addEmployee.isPending} onClick={() => addEmployee.mutate()}>
              Save employee
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
      {isAccountant ? null : null}
    </div>
  );
}
