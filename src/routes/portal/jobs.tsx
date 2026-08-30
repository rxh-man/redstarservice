import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Panel, PortalHeading, StatusBadge, fmtDate, usePortal } from "@/lib/portal";
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

export const Route = createFileRoute("/portal/jobs")({ component: JobsPage });

const STATUSES = ["new", "in_progress", "ready", "submitted", "completed", "rejected"] as const;
const PRIORITIES = ["low", "normal", "high", "urgent"] as const;

type Job = {
  id: string;
  customer_id: string | null;
  service_id: string | null;
  title: string;
  details: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  created_at: string;
};

const empty = { customer_id: "", service_id: "", title: "", details: "", priority: "normal", due_date: "" };

function JobsPage() {
  const { isAdmin, session } = usePortal();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...empty });
  const [filter, setFilter] = useState<string>("open");

  const { data } = useQuery({
    queryKey: ["portal", "jobs"],
    queryFn: async () => {
      const [jobs, cust, svc] = await Promise.all([
        supabase.from("typing_jobs").select("*").order("created_at", { ascending: false }),
        supabase.from("customers").select("id, name").order("name"),
        supabase.from("services").select("id, name").eq("active", true).order("name"),
      ]);
      if (jobs.error) throw jobs.error;
      return { jobs: jobs.data as Job[], customers: cust.data ?? [], services: svc.data ?? [] };
    },
  });

  const jobs = data?.jobs ?? [];
  const nameOf = (id: string | null) => data?.customers.find((c) => c.id === id)?.name ?? "—";
  const svcOf = (id: string | null) => data?.services.find((s) => s.id === id)?.name ?? "—";

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("typing_jobs").insert({
        customer_id: form.customer_id || null,
        service_id: form.service_id || null,
        title: form.title,
        details: form.details || null,
        priority: form.priority,
        due_date: form.due_date || null,
        created_by: session?.user.id ?? null,
      } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Job added to the queue");
      setOpen(false);
      setForm({ ...empty });
      void qc.invalidateQueries({ queryKey: ["portal"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("typing_jobs").update({ status } as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["portal"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("typing_jobs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Job deleted");
      void qc.invalidateQueries({ queryKey: ["portal"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const visible = jobs.filter((j) =>
    filter === "all" ? true : filter === "open" ? !["completed", "rejected"].includes(j.status) : j.status === filter,
  );

  return (
    <div>
      <PortalHeading
        title="Typing Jobs"
        subtitle="Work queue for typists: every application from intake to government submission."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> New job
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {["open", "all", ...STATUSES].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold capitalize transition ${
              filter === f
                ? "border-transparent bg-[color:var(--brand-red)] text-[color:var(--primary-foreground)]"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.replace("_", " ")}
          </button>
        ))}
      </div>

      <Panel className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Job</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Service</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Due</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {visible.map((j) => (
              <tr key={j.id}>
                <td className="px-4 py-3">
                  <div className="font-medium">{j.title}</div>
                  {j.details ? (
                    <div className="max-w-sm truncate text-xs text-muted-foreground">{j.details}</div>
                  ) : null}
                </td>
                <td className="px-4 py-3">{nameOf(j.customer_id)}</td>
                <td className="px-4 py-3">{svcOf(j.service_id)}</td>
                <td className="px-4 py-3 capitalize">{j.priority}</td>
                <td className="px-4 py-3 text-muted-foreground">{fmtDate(j.due_date)}</td>
                <td className="px-4 py-3">
                  <StatusBadge value={j.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex items-center gap-2">
                    <select
                      className="h-8 rounded-md border border-input bg-background px-2 text-xs capitalize"
                      value={j.status}
                      onChange={(e) => setStatus.mutate({ id: j.id, status: e.target.value })}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s.replace("_", " ")}
                        </option>
                      ))}
                    </select>
                    {isAdmin ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (confirm(`Delete job "${j.title}"?`)) remove.mutate(j.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
            {visible.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                  Nothing in this view.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </Panel>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New typing job</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="title">Job title *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="New employment visa — Ahmed K."
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="jcust">Customer</Label>
                <select
                  id="jcust"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={form.customer_id}
                  onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
                >
                  <option value="">— none —</option>
                  {(data?.customers ?? []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="jsvc">Service</Label>
                <select
                  id="jsvc"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={form.service_id}
                  onChange={(e) => setForm({ ...form, service_id: e.target.value })}
                >
                  <option value="">— none —</option>
                  {(data?.services ?? []).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prio">Priority</Label>
                <select
                  id="prio"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="jdue">Due date</Label>
                <Input
                  id="jdue"
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="jdetails">Details / documents received</Label>
              <Textarea
                id="jdetails"
                value={form.details}
                onChange={(e) => setForm({ ...form, details: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button disabled={!form.title || create.isPending} onClick={() => create.mutate()}>
              Add job
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
