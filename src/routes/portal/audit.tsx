import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Fragment, useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Panel, PortalHeading, usePortal } from "@/lib/portal";
import { today } from "@/lib/ledger";
import { ADMIN_TABLES, formatValue, humanize, recordTitle, tableLabel, type AuditEntry } from "@/lib/admin-tables";
import { AuditTimeline, RecordEditor } from "@/components/portal/RecordEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/portal/audit")({ component: AuditLog });

const daysAgo = (d: number) => new Date(Date.now() - d * 86400000).toISOString().slice(0, 10);
const LIMIT = 500;

function AuditLog() {
  const { isAdmin } = usePortal();
  const [from, setFrom] = useState(daysAgo(7));
  const [to, setTo] = useState(today());
  const [table, setTable] = useState("");
  const [action, setAction] = useState("");
  const [user, setUser] = useState("");
  const [q, setQ] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [editing, setEditing] = useState<{ table: string; id: string } | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["portal", "audit", from, to, table, action],
    enabled: isAdmin,
    queryFn: async () => {
      let query = supabase
        .from("audit_log")
        .select("*")
        .gte("changed_at", `${from}T00:00:00`)
        .lte("changed_at", `${to}T23:59:59.999`)
        .order("changed_at", { ascending: false })
        .limit(LIMIT);
      if (table) query = query.eq("table_name", table);
      if (action) query = query.eq("action", action);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as AuditEntry[];
    },
  });

  const users = useMemo(() => Array.from(new Set((data ?? []).map((e) => e.changed_by_name ?? "Unknown"))).sort(), [data]);
  const entries = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (data ?? []).filter((e) => {
      if (user && (e.changed_by_name ?? "Unknown") !== user) return false;
      if (!needle) return true;
      return JSON.stringify([e.record_id, e.new_data, e.old_data]).toLowerCase().includes(needle);
    });
  }, [data, user, q]);

  if (!isAdmin) {
    return <Panel className="p-8 text-center text-sm text-muted-foreground">Only administrators can view the audit log.</Panel>;
  }

  const summary = (e: AuditEntry) => {
    if (e.action !== "UPDATE") return e.action === "INSERT" ? "Record created" : "Record deleted";
    const f = e.changed_fields;
    if (f.length === 1) return `${humanize(f[0])}: ${formatValue(e.old_data?.[f[0]])} → ${formatValue(e.new_data?.[f[0]])}`;
    return `${f.length} fields: ${f.map(humanize).join(", ")}`;
  };

  return (
    <div>
      <PortalHeading
        title="Audit Log"
        subtitle="Every create, edit and delete across the portal — who did it, when, and the exact before/after values."
      />

      <Panel className="mb-6 flex flex-wrap items-end gap-4 p-4">
        <div className="space-y-1.5">
          <Label htmlFor="a-from">From</Label>
          <Input id="a-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="a-to">To</Label>
          <Input id="a-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="a-table">Area</Label>
          <select id="a-table" value={table} onChange={(e) => setTable(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">All</option>
            {ADMIN_TABLES.map((t) => (
              <option key={t.name} value={t.name}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="a-action">Action</Label>
          <select id="a-action" value={action} onChange={(e) => setAction(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">All</option>
            <option value="INSERT">Created</option>
            <option value="UPDATE">Edited</option>
            <option value="DELETE">Deleted</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="a-user">User</Label>
          <select id="a-user" value={user} onChange={(e) => setUser(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">Everyone</option>
            {users.map((u) => (
              <option key={u}>{u}</option>
            ))}
          </select>
        </div>
        <div className="min-w-[200px] flex-1 space-y-1.5">
          <Label htmlFor="a-q">Search</Label>
          <Input id="a-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Invoice no, name, amount…" />
        </div>
      </Panel>

      <Panel className="overflow-x-auto">
        {error ? (
          <p className="p-6 text-sm text-destructive">
            {(error as Error).message.includes("audit_log")
              ? "The audit log table isn't set up yet — apply the latest database migration (supabase/migrations/20260930120000_audit_log.sql)."
              : (error as Error).message}
          </p>
        ) : isLoading ? (
          <p className="p-8 text-center text-sm text-muted-foreground">Loading…</p>
        ) : (
          <table className="w-full min-w-[820px] text-sm">
            <thead className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Area</th>
                <th className="px-4 py-3">Record</th>
                <th className="px-4 py-3">Change</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {entries.map((e) => (
                <Fragment key={e.id}>
                  <tr
                    className="cursor-pointer align-top hover:bg-muted/40"
                    onClick={() => setExpanded(expanded === e.id ? null : e.id)}
                  >
                    <td className="whitespace-nowrap px-4 py-2.5 text-muted-foreground">
                      {new Date(e.changed_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
                    </td>
                    <td className="px-4 py-2.5 font-medium">{e.changed_by_name ?? "Unknown"}</td>
                    <td className="px-4 py-2.5">{tableLabel(e.table_name)}</td>
                    <td className="px-4 py-2.5">{recordTitle(e.table_name, e.new_data ?? e.old_data)}</td>
                    <td className="max-w-[340px] truncate px-4 py-2.5 text-muted-foreground">
                      <span
                        className={`me-2 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          e.action === "INSERT" ? "bg-emerald-100 text-emerald-800" : e.action === "UPDATE" ? "bg-blue-100 text-blue-800" : "bg-red-100 text-red-800"
                        }`}
                      >
                        {e.action === "INSERT" ? "Created" : e.action === "UPDATE" ? "Edited" : "Deleted"}
                      </span>
                      {summary(e)}
                    </td>
                    <td className="px-4 py-2.5 text-end">
                      {e.action !== "DELETE" && e.record_id ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(ev) => {
                            ev.stopPropagation();
                            setEditing({ table: e.table_name, id: e.record_id! });
                          }}
                        >
                          <ExternalLink className="me-1.5 h-3.5 w-3.5" /> Open
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                  {expanded === e.id ? (
                    <tr>
                      <td colSpan={6} className="bg-muted/20 px-6 py-4">
                        <AuditTimeline entries={[e]} />
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              ))}
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    No activity for these filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        )}
      </Panel>
      {(data?.length ?? 0) >= LIMIT ? (
        <p className="mt-3 text-xs text-muted-foreground">Showing the latest {LIMIT} changes — narrow the dates or filters to see older ones.</p>
      ) : null}

      <RecordEditor
        table={editing?.table ?? ""}
        id={editing?.id ?? null}
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
      />
    </div>
  );
}
