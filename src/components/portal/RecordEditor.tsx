import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { History, Loader2, PencilLine, RotateCcw, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePortal } from "@/lib/portal";
import {
  anyTable,
  formatValue,
  humanize,
  recordTitle,
  tableLabel,
  type AuditEntry,
} from "@/lib/admin-tables";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

type Row = Record<string, unknown>;

const READ_ONLY = new Set(["id", "created_at", "updated_at", "created_by"]);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

type Kind = "boolean" | "number" | "date" | "json" | "longtext" | "text";

function kindOf(key: string, v: unknown): Kind {
  if (typeof v === "boolean") return "boolean";
  if (typeof v === "number") return "number";
  if (v !== null && typeof v === "object") return "json";
  if (typeof v === "string") {
    if (DATE_RE.test(v)) return "date";
    if (v.length > 80 || /notes|description|details|memo|address|reply/.test(key)) return "longtext";
  }
  return "text";
}

/** Turn an input's string back into the column's type. Empty inputs become null. */
function parse(kind: Kind, raw: string): unknown {
  if (kind === "number") return raw.trim() === "" ? null : Number(raw);
  if (kind === "json") return raw.trim() === "" ? null : JSON.parse(raw);
  if (kind === "date" || kind === "text" || kind === "longtext") return raw === "" ? null : raw;
  return raw;
}

const toDraft = (kind: Kind, v: unknown) =>
  v === null || v === undefined ? "" : kind === "json" ? JSON.stringify(v, null, 2) : String(v);

export function RecordEditor({
  table,
  id,
  open,
  onOpenChange,
}: {
  table: string;
  id: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { isAdmin } = usePortal();
  const qc = useQueryClient();

  const record = useQuery({
    queryKey: ["portal", "admin-record", table, id],
    enabled: open && !!id,
    queryFn: async () => {
      const { data, error } = await anyTable(table).select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data as Row | null;
    },
  });

  const history = useQuery({
    queryKey: ["portal", "admin-history", table, id],
    enabled: open && !!id && isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_log")
        .select("*")
        .eq("table_name", table)
        .eq("record_id", String(id))
        .order("changed_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as unknown as AuditEntry[];
    },
  });

  const row = record.data;
  const kinds = useMemo(() => {
    const out: Record<string, Kind> = {};
    if (row) for (const [k, v] of Object.entries(row)) out[k] = kindOf(k, v);
    return out;
  }, [row]);

  const [draft, setDraft] = useState<Record<string, string | boolean>>({});
  useEffect(() => {
    if (!row) return;
    const d: Record<string, string | boolean> = {};
    for (const [k, v] of Object.entries(row)) d[k] = kinds[k] === "boolean" ? Boolean(v) : toDraft(kinds[k], v);
    setDraft(d);
  }, [row, kinds]);

  const changes = useMemo(() => {
    if (!row) return {} as Row;
    const out: Row = {};
    for (const [k, v] of Object.entries(draft)) {
      if (READ_ONLY.has(k)) continue;
      const kind = kinds[k];
      const original = kind === "boolean" ? Boolean(row[k]) : toDraft(kind, row[k]);
      if (v !== original) out[k] = v;
    }
    return out;
  }, [draft, row, kinds]);

  const save = useMutation({
    mutationFn: async (patch: Row) => {
      const payload: Row = {};
      for (const [k, v] of Object.entries(patch)) {
        try {
          payload[k] = typeof v === "boolean" ? v : parse(kinds[k], String(v));
        } catch {
          throw new Error(`${humanize(k)} is not valid JSON`);
        }
        if (typeof payload[k] === "number" && Number.isNaN(payload[k])) throw new Error(`${humanize(k)} must be a number`);
      }
      const { error } = await anyTable(table).update(payload).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Changes saved and logged");
      qc.invalidateQueries({ queryKey: ["portal"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const revert = (field: string, value: unknown) => {
    if (!window.confirm(`Restore "${humanize(field)}" to ${formatValue(value)}?`)) return;
    save.mutate({ [field]: kinds[field] === "boolean" ? Boolean(value) : toDraft(kinds[field] ?? "text", value) });
  };

  const dirty = Object.keys(changes).length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="pe-8">{recordTitle(table, row)}</SheetTitle>
          <SheetDescription>
            {tableLabel(table)} · <span className="font-mono text-[11px]">{id}</span>
          </SheetDescription>
        </SheetHeader>

        {record.isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : record.error ? (
          <p className="mt-6 text-sm text-destructive">{(record.error as Error).message}</p>
        ) : !row ? (
          <p className="mt-6 text-sm text-muted-foreground">This record no longer exists (it may have been deleted).</p>
        ) : (
          <Tabs defaultValue="edit" className="mt-5">
            <TabsList className="w-full">
              <TabsTrigger value="edit" className="flex-1">
                <PencilLine className="me-1.5 h-3.5 w-3.5" /> {isAdmin ? "Edit" : "Details"}
              </TabsTrigger>
              {isAdmin ? (
                <TabsTrigger value="history" className="flex-1">
                  <History className="me-1.5 h-3.5 w-3.5" /> History ({history.data?.length ?? 0})
                </TabsTrigger>
              ) : null}
            </TabsList>

            <TabsContent value="edit" className="mt-4 space-y-4">
              {Object.keys(row).map((k) => {
                const kind = kinds[k];
                const ro = READ_ONLY.has(k) || !isAdmin;
                const changed = k in changes;
                const labelEl = (
                  <Label htmlFor={`f-${k}`} className={changed ? "text-[color:var(--brand-red)]" : undefined}>
                    {humanize(k)} {changed ? "•" : ""}
                  </Label>
                );
                if (kind === "boolean") {
                  return (
                    <div key={k} className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
                      {labelEl}
                      <Switch
                        id={`f-${k}`}
                        disabled={ro}
                        checked={Boolean(draft[k])}
                        onCheckedChange={(v) => setDraft((d) => ({ ...d, [k]: v }))}
                      />
                    </div>
                  );
                }
                const value = String(draft[k] ?? "");
                const set = (v: string) => setDraft((d) => ({ ...d, [k]: v }));
                return (
                  <div key={k} className="space-y-1.5">
                    {labelEl}
                    {kind === "longtext" || kind === "json" ? (
                      <Textarea
                        id={`f-${k}`}
                        readOnly={ro}
                        rows={kind === "json" ? 6 : 3}
                        className={kind === "json" ? "font-mono text-xs" : undefined}
                        value={value}
                        onChange={(e) => set(e.target.value)}
                      />
                    ) : (
                      <Input
                        id={`f-${k}`}
                        readOnly={ro}
                        type={kind === "number" ? "number" : kind === "date" ? "date" : "text"}
                        step={kind === "number" ? "any" : undefined}
                        className={ro ? "bg-muted/50 text-muted-foreground" : undefined}
                        value={value}
                        onChange={(e) => set(e.target.value)}
                      />
                    )}
                  </div>
                );
              })}

              {isAdmin ? (
                <div className="sticky bottom-0 -mx-6 flex items-center justify-between gap-3 border-t border-border bg-background px-6 py-4">
                  <span className="text-xs text-muted-foreground">
                    {dirty ? `${dirty} field${dirty > 1 ? "s" : ""} changed` : "No changes"}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!dirty || save.isPending}
                      onClick={() => {
                        const d: Record<string, string | boolean> = {};
                        for (const [k, v] of Object.entries(row)) d[k] = kinds[k] === "boolean" ? Boolean(v) : toDraft(kinds[k], v);
                        setDraft(d);
                      }}
                    >
                      Discard
                    </Button>
                    <Button size="sm" disabled={!dirty || save.isPending} onClick={() => save.mutate(changes)}>
                      {save.isPending ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Save className="me-2 h-4 w-4" />}
                      Save changes
                    </Button>
                  </div>
                </div>
              ) : null}
            </TabsContent>

            {isAdmin ? (
              <TabsContent value="history" className="mt-4">
                <AuditTimeline entries={history.data ?? []} loading={history.isLoading} error={history.error as Error | null} onRevert={revert} />
              </TabsContent>
            ) : null}
          </Tabs>
        )}
      </SheetContent>
    </Sheet>
  );
}

const ACTION_TONE: Record<AuditEntry["action"], string> = {
  INSERT: "bg-emerald-100 text-emerald-800",
  UPDATE: "bg-blue-100 text-blue-800",
  DELETE: "bg-red-100 text-red-800",
};
const ACTION_LABEL: Record<AuditEntry["action"], string> = { INSERT: "Created", UPDATE: "Edited", DELETE: "Deleted" };

export function AuditTimeline({
  entries,
  loading,
  error,
  onRevert,
}: {
  entries: AuditEntry[];
  loading?: boolean;
  error?: Error | null;
  onRevert?: (field: string, value: unknown) => void;
}) {
  if (loading) return <p className="py-8 text-center text-sm text-muted-foreground">Loading history…</p>;
  if (error)
    return (
      <p className="text-sm text-destructive">
        {error.message.includes("audit_log")
          ? "The audit log table isn't set up yet — apply the latest database migration."
          : error.message}
      </p>
    );
  if (entries.length === 0)
    return <p className="py-8 text-center text-sm text-muted-foreground">No changes recorded since audit logging was enabled.</p>;

  return (
    <ol className="relative space-y-4 border-s border-border ps-5">
      {entries.map((e) => (
        <li key={e.id} className="relative">
          <span className="absolute -start-[25px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-[color:var(--brand-red)]" />
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className={`rounded-full px-2 py-0.5 font-semibold ${ACTION_TONE[e.action]}`}>{ACTION_LABEL[e.action]}</span>
            <span className="font-medium text-foreground">{e.changed_by_name ?? "Unknown"}</span>
            <span className="text-muted-foreground">
              {new Date(e.changed_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
            </span>
          </div>
          {e.action === "UPDATE" ? (
            <div className="mt-2 overflow-hidden rounded-lg border border-border">
              <table className="w-full text-xs">
                <tbody className="divide-y divide-border">
                  {e.changed_fields.map((f) => (
                    <tr key={f} className="align-top">
                      <td className="w-1/4 bg-muted/40 px-2.5 py-2 font-medium">{humanize(f)}</td>
                      <td className="px-2.5 py-2">
                        <span className="break-all text-red-700 line-through decoration-red-300">{formatValue(e.old_data?.[f])}</span>
                        <span className="mx-1.5 text-muted-foreground">→</span>
                        <span className="break-all text-emerald-800">{formatValue(e.new_data?.[f])}</span>
                      </td>
                      {onRevert ? (
                        <td className="w-8 px-1.5 py-1.5">
                          <button
                            type="button"
                            title="Restore previous value"
                            onClick={() => onRevert(f, e.old_data?.[f] ?? null)}
                            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <details className="mt-1.5 text-xs">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                {e.action === "INSERT" ? "Values at creation" : "Values before deletion"}
              </summary>
              <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 rounded-lg border border-border p-2.5">
                {Object.entries((e.action === "INSERT" ? e.new_data : e.old_data) ?? {}).map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="text-muted-foreground">{humanize(k)}</dt>
                    <dd className="break-all">{formatValue(v)}</dd>
                  </div>
                ))}
              </dl>
            </details>
          )}
        </li>
      ))}
    </ol>
  );
}

/** Small admin-only button that opens the editor + history for one record. Drop it next to any record. */
export function AdminEditButton({ table, id, label = "Edit / history" }: { table: string; id: string; label?: string }) {
  const { isAdmin } = usePortal();
  const [open, setOpen] = useState(false);
  if (!isAdmin) return null;
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="print:hidden">
        <History className="me-2 h-4 w-4" /> {label}
      </Button>
      <RecordEditor table={table} id={id} open={open} onOpenChange={setOpen} />
    </>
  );
}
