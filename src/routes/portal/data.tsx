import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Database, Search } from "lucide-react";
import { Panel, PortalHeading, usePortal } from "@/lib/portal";
import { ADMIN_TABLES, anyTable, formatValue, humanize, recordTitle } from "@/lib/admin-tables";
import { RecordEditor } from "@/components/portal/RecordEditor";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/portal/data")({ component: DataExplorer });

const HIDDEN = new Set(["id", "created_by", "updated_at", "old_data", "new_data"]);
const LIMIT = 500;

function DataExplorer() {
  const { isAdmin } = usePortal();
  const [table, setTable] = useState(ADMIN_TABLES[0].name);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["portal", "admin-data", table],
    enabled: isAdmin,
    queryFn: async () => {
      let res = await anyTable(table).select("*").order("created_at", { ascending: false }).limit(LIMIT);
      // Some tables (e.g. settings) have no created_at column
      if (res.error) res = await anyTable(table).select("*").limit(LIMIT);
      if (res.error) throw res.error;
      return (res.data ?? []) as Record<string, unknown>[];
    },
  });

  const rows = useMemo(() => {
    const all = data ?? [];
    const needle = q.trim().toLowerCase();
    if (!needle) return all;
    return all.filter((r) => Object.values(r).some((v) => v !== null && String(typeof v === "object" ? JSON.stringify(v) : v).toLowerCase().includes(needle)));
  }, [data, q]);

  const columns = useMemo(() => {
    const first = (data ?? [])[0];
    return first ? Object.keys(first).filter((k) => !HIDDEN.has(k)).slice(0, 7) : [];
  }, [data]);

  if (!isAdmin) {
    return <Panel className="p-8 text-center text-sm text-muted-foreground">Only administrators can browse and edit all records.</Panel>;
  }

  return (
    <div>
      <PortalHeading
        title="Data Manager"
        subtitle="Browse every record in the system. Click any row to edit it — every change is logged with who, when and what changed."
      />

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <Panel className="h-fit p-2">
          <div className="px-2 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Tables</div>
          <nav className="max-h-[70vh] space-y-0.5 overflow-y-auto">
            {ADMIN_TABLES.map((t) => (
              <button
                key={t.name}
                onClick={() => {
                  setTable(t.name);
                  setQ("");
                }}
                className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-start text-sm transition ${
                  table === t.name ? "bg-[color:var(--brand-red)] text-white" : "hover:bg-muted"
                }`}
              >
                <Database className="h-3.5 w-3.5 shrink-0 opacity-70" />
                {t.label}
              </button>
            ))}
          </nav>
        </Panel>

        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="relative min-w-[240px] flex-1">
              <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search any field…" className="ps-9" />
            </div>
            <span className="text-xs text-muted-foreground">
              {rows.length} record{rows.length === 1 ? "" : "s"}
              {(data?.length ?? 0) >= LIMIT ? ` (latest ${LIMIT} loaded)` : ""}
            </span>
          </div>

          <Panel className="overflow-x-auto">
            {error ? (
              <p className="p-6 text-sm text-destructive">{(error as Error).message}</p>
            ) : isLoading ? (
              <p className="p-8 text-center text-sm text-muted-foreground">Loading…</p>
            ) : (
              <table className="w-full min-w-[720px] text-sm">
                <thead className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Record</th>
                    {columns.map((c) => (
                      <th key={c} className="px-4 py-3">
                        {humanize(c)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map((r) => (
                    <tr
                      key={String(r.id)}
                      onClick={() => setEditing(String(r.id))}
                      className="cursor-pointer transition hover:bg-[color:var(--brand-red)]/5"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === "Enter" && setEditing(String(r.id))}
                    >
                      <td className="px-4 py-2.5 font-medium">{recordTitle(table, r)}</td>
                      {columns.map((c) => (
                        <td key={c} className="max-w-[220px] truncate px-4 py-2.5 text-muted-foreground">
                          {formatValue(r[c])}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length + 1} className="px-4 py-10 text-center text-muted-foreground">
                        No records.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            )}
          </Panel>
        </div>
      </div>

      <RecordEditor table={table} id={editing} open={!!editing} onOpenChange={(o) => !o && setEditing(null)} />
    </div>
  );
}
