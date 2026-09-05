import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ListChecks } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Panel, PortalHeading, StatusBadge, fmtDate } from "@/lib/portal";

export const Route = createFileRoute("/portal/workflows/")({ component: WorkflowsPage });

function WorkflowsPage() {
  const [filter, setFilter] = useState<"active" | "completed" | "all">("active");

  const { data } = useQuery({
    queryKey: ["portal", "workflows"],
    queryFn: async () => {
      const [workflows, steps, companies, employees, staff] = await Promise.all([
        supabase.from("workflows").select("*").order("created_at", { ascending: false }),
        supabase.from("workflow_steps").select("id, workflow_id, status, sequence_no, name"),
        supabase.from("companies").select("id, name"),
        supabase.from("company_employees").select("id, name"),
        supabase.from("profiles").select("id, full_name"),
      ]);
      if (workflows.error) throw workflows.error;
      return {
        workflows: (workflows.data ?? []) as {
          id: string;
          workflow_no: string;
          title: string;
          status: string;
          company_id: string;
          employee_id: string | null;
          assigned_typist: string | null;
          created_at: string;
        }[],
        steps: (steps.data ?? []) as { workflow_id: string; status: string; sequence_no: number; name: string }[],
        companies: (companies.data ?? []) as { id: string; name: string }[],
        employees: (employees.data ?? []) as { id: string; name: string }[],
        staff: (staff.data ?? []) as { id: string; full_name: string }[],
      };
    },
  });

  const rows = (data?.workflows ?? []).filter((w) =>
    filter === "all" ? true : filter === "active" ? w.status === "active" : w.status !== "active",
  );

  const stepsOf = (id: string) => (data?.steps ?? []).filter((s) => s.workflow_id === id);
  const currentStep = (id: string) => {
    const open = stepsOf(id)
      .filter((s) => s.status !== "completed")
      .sort((a, b) => a.sequence_no - b.sequence_no)[0];
    return open ? `${String(open.sequence_no).padStart(2, "0")} · ${open.name}` : "All steps done";
  };

  return (
    <div>
      <PortalHeading
        title="Workflows"
        subtitle="Step-by-step visa and labour processes, tracked from first step to completion."
      />

      <div className="mb-4 flex gap-2">
        {(["active", "completed", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold capitalize transition ${
              filter === f
                ? "border-transparent bg-[color:var(--brand-red)] text-[color:var(--primary-foreground)]"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <Panel className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-sm">
          <thead className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">Workflow</th>
              <th className="px-4 py-3">Current step</th>
              <th className="px-4 py-3">Progress</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Started</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((w) => {
              const all = stepsOf(w.id);
              const done = all.filter((s) => s.status === "completed").length;
              return (
                <tr key={w.id} className="hover:bg-muted/40">
                  <td className="px-4 py-3">
                    <Link to="/portal/workflows/$id" params={{ id: w.id }} className="font-medium hover:underline">
                      {w.workflow_no}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {(data?.companies ?? []).find((c) => c.id === w.company_id)?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {(data?.employees ?? []).find((e) => e.id === w.employee_id)?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3">{w.title}</td>
                  <td className="px-4 py-3 text-muted-foreground">{currentStep(w.id)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {done} of {all.length}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge value={w.status} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{fmtDate(w.created_at)}</td>
                </tr>
              );
            })}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                  <ListChecks className="mx-auto mb-3 h-6 w-6 opacity-50" />
                  Nothing here. Start a workflow from a company page.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
