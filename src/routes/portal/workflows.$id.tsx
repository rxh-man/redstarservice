import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, ChevronRight, Lock, Paperclip, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Panel, PortalHeading, fmtDate, usePortal } from "@/lib/portal";
import { STEP_STATUSES, stepStatusLabel, type WorkflowStep } from "@/lib/workflow";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export const Route = createFileRoute("/portal/workflows/$id")({ component: WorkflowDetail });

const statusTone: Record<string, string> = {
  locked: "bg-muted text-muted-foreground",
  in_progress: "bg-blue-100 text-blue-800",
  waiting_approval: "bg-indigo-100 text-indigo-800",
  completed: "bg-emerald-100 text-emerald-800",
  on_hold: "bg-amber-100 text-amber-800",
  rejected: "bg-red-100 text-red-800",
};

function StepStatus({ value }: { value: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusTone[value] ?? "bg-muted"}`}
    >
      {value === "locked" ? <Lock className="h-3 w-3" /> : null}
      {stepStatusLabel[value] ?? value}
    </span>
  );
}

type Doc = { id: string; step_id: string; file_path: string; file_name: string };

function WorkflowDetail() {
  const { id } = Route.useParams();
  const { session } = usePortal();
  const qc = useQueryClient();
  const [openStep, setOpenStep] = useState<string | null>(null);
  const [draft, setDraft] = useState({ status: "", notes: "", assigned_typist: "" });
  const [uploading, setUploading] = useState(false);

  const { data } = useQuery({
    queryKey: ["portal", "workflow", id],
    queryFn: async () => {
      const wf = await supabase.from("workflows").select("*").eq("id", id).maybeSingle();
      if (wf.error) throw wf.error;
      const [steps, staff, company, employees] = await Promise.all([
        supabase.from("workflow_steps").select("*").eq("workflow_id", id).order("sequence_no"),
        supabase.from("profiles").select("id, full_name").order("full_name"),
        supabase
          .from("companies")
          .select("id, name")
          .eq("id", (wf.data as { company_id: string } | null)?.company_id ?? "")
          .maybeSingle(),
        supabase.from("company_employees").select("id, name"),
      ]);
      const stepIds = ((steps.data ?? []) as WorkflowStep[]).map((s) => s.id);
      const docs = stepIds.length
        ? await supabase.from("workflow_step_documents").select("*").in("step_id", stepIds)
        : { data: [] as Doc[] };
      return {
        workflow: wf.data as {
          id: string;
          workflow_no: string;
          title: string;
          status: string;
          company_id: string;
          employee_id: string | null;
        } | null,
        steps: (steps.data ?? []) as WorkflowStep[],
        staff: (staff.data ?? []) as { id: string; full_name: string }[],
        company: company.data as { id: string; name: string } | null,
        employees: (employees.data ?? []) as { id: string; name: string }[],
        docs: (docs.data ?? []) as Doc[],
      };
    },
  });

  const steps = data?.steps ?? [];
  const step = steps.find((s) => s.id === openStep) ?? null;
  const done = steps.filter((s) => s.status === "completed").length;
  const stepDocs = (sid: string) => (data?.docs ?? []).filter((d) => d.step_id === sid);
  const staffName = (uid: string | null) =>
    uid ? data?.staff.find((s) => s.id === uid)?.full_name || "Assigned" : "Unassigned";

  useEffect(() => {
    if (step) {
      setDraft({
        status: step.status === "locked" ? "in_progress" : step.status,
        notes: step.notes ?? "",
        assigned_typist: step.assigned_typist ?? "",
      });
    }
  }, [openStep, step?.status, step?.notes, step?.assigned_typist, step]);

  const save = useMutation({
    mutationFn: async (status?: string) => {
      if (!step) return;
      const { error } = await supabase
        .from("workflow_steps")
        .update({
          status: status ?? draft.status,
          notes: draft.notes || null,
          assigned_typist: draft.assigned_typist || null,
        } as never)
        .eq("id", step.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Step updated");
      setOpenStep(null);
      void qc.invalidateQueries({ queryKey: ["portal"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function upload(file: File) {
    if (!step) return;
    const ok = ["application/pdf", "image/png", "image/jpeg"];
    if (!ok.includes(file.type)) {
      toast.error("Only PDF, PNG or JPG files are supported.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File must be 10MB or smaller.");
      return;
    }
    setUploading(true);
    const path = `${id}/${step.id}/${Date.now()}-${file.name.replace(/[^\w.\-]+/g, "_")}`;
    const up = await supabase.storage.from("documents").upload(path, file, { upsert: false });
    if (up.error) {
      setUploading(false);
      toast.error(up.error.message);
      return;
    }
    const { error } = await supabase.from("workflow_step_documents").insert({
      step_id: step.id,
      file_path: path,
      file_name: file.name,
      mime_type: file.type,
      size_bytes: file.size,
      uploaded_by: session?.user.id ?? null,
    } as never);
    setUploading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Document attached");
    void qc.invalidateQueries({ queryKey: ["portal"] });
  }

  const removeDoc = useMutation({
    mutationFn: async (doc: Doc) => {
      await supabase.storage.from("documents").remove([doc.file_path]);
      const { error } = await supabase.from("workflow_step_documents").delete().eq("id", doc.id);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["portal"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  async function openDoc(doc: Doc) {
    const { data: signed } = await supabase.storage.from("documents").createSignedUrl(doc.file_path, 600);
    if (signed?.signedUrl) window.open(signed.signedUrl, "_blank", "noopener");
  }

  if (!data?.workflow) {
    return (
      <div>
        <Link to="/portal/workflows" className="text-sm text-muted-foreground hover:underline">
          ← Back to workflows
        </Link>
        <p className="mt-6 text-muted-foreground">Workflow not found.</p>
      </div>
    );
  }

  const wf = data.workflow;
  const employeeName = data.employees.find((e) => e.id === wf.employee_id)?.name;

  return (
    <div>
      <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/portal/workflows" className="inline-flex items-center gap-1.5 hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" /> Workflows
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        {data.company ? (
          <Link to="/portal/companies/$id" params={{ id: data.company.id }} className="hover:underline">
            {data.company.name}
          </Link>
        ) : null}
      </div>

      <PortalHeading
        title={wf.title}
        subtitle={`${wf.workflow_no}${employeeName ? ` · ${employeeName}` : ""}`}
        actions={
          <span className="text-sm font-semibold text-[color:var(--brand-red)]">
            {done} of {steps.length} steps completed
          </span>
        }
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {steps.map((s) => (
          <button
            key={s.id}
            onClick={() => setOpenStep(s.id)}
            title={s.name}
            className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold transition ${
              s.status === "completed"
                ? "bg-emerald-600 text-white"
                : s.status === "locked"
                  ? "bg-muted text-muted-foreground"
                  : "bg-[color:var(--brand-red)] text-[color:var(--primary-foreground)]"
            }`}
          >
            {s.sequence_no}
          </button>
        ))}
      </div>

      <Panel className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-sm">
          <thead className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Step</th>
              <th className="px-4 py-3">Workflow service</th>
              <th className="px-4 py-3">Requirement</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Assigned typist</th>
              <th className="px-4 py-3">Documents</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {steps.map((s) => {
              const active = s.status !== "locked" && s.status !== "completed";
              return (
                <tr
                  key={s.id}
                  className={`cursor-pointer hover:bg-muted/40 ${active ? "bg-muted/30" : ""}`}
                  onClick={() => setOpenStep(s.id)}
                >
                  <td className="px-4 py-3 font-semibold">{String(s.sequence_no).padStart(2, "0")}</td>
                  <td className="px-4 py-3">
                    <div className={`font-medium ${s.status === "locked" ? "text-muted-foreground" : ""}`}>
                      {s.name}
                    </div>
                    {s.description ? (
                      <div className="max-w-md text-xs text-muted-foreground">{s.description}</div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-muted px-2 py-0.5 text-[11px] font-semibold capitalize">
                      {s.requirement}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StepStatus value={s.status} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{staffName(s.assigned_typist)}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {stepDocs(s.id).length ? `${stepDocs(s.id).length} attached` : "Pending"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {s.status !== "locked" && s.status !== "completed" ? (
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenStep(s.id);
                        }}
                      >
                        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Open
                      </Button>
                    ) : (
                      <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Panel>

      <Sheet open={!!openStep} onOpenChange={(o) => !o && setOpenStep(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {step ? (
            <>
              <SheetHeader>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {wf.title}
                </p>
                <SheetTitle>
                  Step {step.sequence_no}: {step.name}
                </SheetTitle>
              </SheetHeader>

              <div className="mt-5 space-y-5">
                {step.description ? (
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                ) : null}

                {step.status === "locked" ? (
                  <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
                    This step is locked until the earlier steps are completed.
                  </div>
                ) : null}

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="sstatus">Task status</Label>
                    <select
                      id="sstatus"
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      value={draft.status}
                      onChange={(e) => setDraft({ ...draft, status: e.target.value })}
                    >
                      {STEP_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {stepStatusLabel[s]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="styp">Assigned typist</Label>
                    <select
                      id="styp"
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      value={draft.assigned_typist}
                      onChange={(e) => setDraft({ ...draft, assigned_typist: e.target.value })}
                    >
                      <option value="">— unassigned —</option>
                      {data.staff.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.full_name || s.id}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="snotes">Notes / instructions</Label>
                  <Textarea
                    id="snotes"
                    rows={4}
                    placeholder="Add notes or instructions…"
                    value={draft.notes}
                    onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                  />
                  <p className="text-[11px] text-muted-foreground">Leave blank if no special notes are required.</p>
                </div>

                <div className="space-y-2">
                  <Label>Attached documents ({stepDocs(step.id).length})</Label>
                  <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 px-4 py-6 text-center">
                    <UploadCloud className="h-6 w-6 text-[color:var(--brand-red)]" />
                    <span className="text-sm font-medium">
                      {uploading ? "Uploading…" : "Click to browse and attach a file"}
                    </span>
                    <span className="text-[11px] text-muted-foreground">PDF, PNG, JPG supported (up to 10MB)</span>
                    <input
                      type="file"
                      className="hidden"
                      accept="application/pdf,image/png,image/jpeg"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) void upload(f);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  <div className="divide-y divide-border">
                    {stepDocs(step.id).map((d) => (
                      <div key={d.id} className="flex items-center justify-between gap-2 py-2">
                        <button
                          onClick={() => void openDoc(d)}
                          className="inline-flex min-w-0 items-center gap-2 text-sm hover:underline"
                        >
                          <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <span className="truncate">{d.file_name}</span>
                        </button>
                        <Button size="sm" variant="outline" onClick={() => removeDoc.mutate(d)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    {stepDocs(step.id).length === 0 ? (
                      <p className="py-2 text-center text-xs italic text-muted-foreground">
                        No documents attached yet for this step.
                      </p>
                    ) : null}
                  </div>
                </div>

                {step.completed_at ? (
                  <p className="text-xs text-muted-foreground">Completed on {fmtDate(step.completed_at)}</p>
                ) : null}

                <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
                  <Button variant="outline" onClick={() => setOpenStep(null)}>
                    Cancel
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={save.isPending || step.status === "completed"}
                    onClick={() => save.mutate("completed")}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Mark as completed
                  </Button>
                  <Button disabled={save.isPending} onClick={() => save.mutate(undefined)}>
                    Save changes
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
