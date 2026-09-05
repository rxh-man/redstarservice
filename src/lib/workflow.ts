import { supabase } from "@/integrations/supabase/client";

export const STEP_STATUSES = [
  "in_progress",
  "waiting_approval",
  "completed",
  "on_hold",
  "rejected",
] as const;

export const stepStatusLabel: Record<string, string> = {
  locked: "Locked",
  in_progress: "In Progress",
  waiting_approval: "Waiting for Approval",
  completed: "Completed",
  on_hold: "On Hold",
  rejected: "Rejected",
};

export type WorkflowStep = {
  id: string;
  workflow_id: string;
  sequence_no: number;
  name: string;
  description: string | null;
  requirement: string;
  status: string;
  assigned_typist: string | null;
  notes: string | null;
  completed_at: string | null;
};

/** Creates a workflow for an employee and copies the template steps into it. */
export async function startWorkflow(input: {
  templateId: string;
  companyId: string;
  employeeId: string | null;
  title: string;
  typistId: string | null;
  userId: string | null;
}): Promise<string> {
  const { data: steps, error: stepsErr } = await supabase
    .from("workflow_template_steps")
    .select("sequence_no, name, name_ar, description, requirement")
    .eq("template_id", input.templateId)
    .order("sequence_no");
  if (stepsErr) throw stepsErr;
  if (!steps || steps.length === 0) throw new Error("This workflow template has no steps yet.");

  const { data: wf, error: wfErr } = await supabase
    .from("workflows")
    .insert({
      template_id: input.templateId,
      company_id: input.companyId,
      employee_id: input.employeeId || null,
      title: input.title,
      assigned_typist: input.typistId || null,
      created_by: input.userId,
    } as never)
    .select("id")
    .single();
  if (wfErr) throw wfErr;
  const workflowId = (wf as { id: string }).id;

  const { error: insErr } = await supabase.from("workflow_steps").insert(
    steps.map((s, i) => ({
      workflow_id: workflowId,
      sequence_no: s.sequence_no,
      name: s.name,
      name_ar: s.name_ar,
      description: s.description,
      requirement: s.requirement,
      status: i === 0 ? "in_progress" : "locked",
      assigned_typist: input.typistId || null,
    })) as never,
  );
  if (insErr) throw insErr;

  return workflowId;
}
