import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2, CheckCircle2, Eye, X } from "lucide-react";
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

export const Route = createFileRoute("/portal/journals")({
  head: () => ({
    meta: [
      { title: "Journal Vouchers — Red Star Services ERP" },
      { name: "description", content: "Create and post double-entry journal vouchers for Red Star Services." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Journal Vouchers — Red Star Services ERP" },
      { property: "og:description", content: "Double-entry journals with balanced debit and credit control." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: JournalsPage,
});

type Entry = {
  id: string;
  entry_no: string;
  entry_date: string;
  reference: string | null;
  memo: string | null;
  status: string;
  total_debit: number;
  total_credit: number;
};

type LineForm = { account_code: string; description: string; debit: string; credit: string };

const emptyLine = (): LineForm => ({ account_code: "", description: "", debit: "", credit: "" });

function JournalsPage() {
  const { isAdmin, session } = usePortal();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [viewId, setViewId] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);
  const [entryDate, setEntryDate] = useState(today);
  const [reference, setReference] = useState("");
  const [memo, setMemo] = useState("");
  const [lines, setLines] = useState<LineForm[]>([emptyLine(), emptyLine()]);

  const { data } = useQuery({
    queryKey: ["portal", "journals"],
    queryFn: async () => {
      const [ent, acc] = await Promise.all([
        supabase
          .from("journal_entries")
          .select("id, entry_no, entry_date, reference, memo, status, total_debit, total_credit")
          .order("entry_date", { ascending: false }),
        supabase.from("accounts").select("code, name").eq("active", true).order("code"),
      ]);
      if (ent.error) throw ent.error;
      return { entries: (ent.data ?? []) as Entry[], accounts: acc.data ?? [] };
    },
  });

  const entries = data?.entries ?? [];
  const accounts = data?.accounts ?? [];

  const { data: viewLines } = useQuery({
    queryKey: ["portal", "journal-lines", viewId],
    enabled: !!viewId,
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("journal_lines")
        .select("id, account_code, description, debit, credit")
        .eq("entry_id", viewId ?? "")
        .order("sort_order");
      if (error) throw error;
      return rows ?? [];
    },
  });

  const totalDebit = lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
  const balanced = Math.abs(totalDebit - totalCredit) < 0.005 && totalDebit > 0;

  function resetForm() {
    setEntryDate(today);
    setReference("");
    setMemo("");
    setLines([emptyLine(), emptyLine()]);
  }

  const create = useMutation({
    mutationFn: async (post: boolean) => {
      const usable = lines.filter(
        (l) => l.account_code && ((Number(l.debit) || 0) > 0 || (Number(l.credit) || 0) > 0),
      );
      if (usable.length < 2) throw new Error("Add at least two lines — one debit and one credit.");
      const { data: created, error } = await supabase
        .from("journal_entries")
        .insert({
          entry_no: "",
          entry_date: entryDate,
          reference: reference || null,
          memo: memo || null,
          created_by: session?.user.id ?? null,
        } as never)
        .select("id")
        .single();
      if (error) throw error;
      const entryId = created.id as string;
      const { error: lineError } = await supabase.from("journal_lines").insert(
        usable.map((l, idx) => ({
          entry_id: entryId,
          account_code: l.account_code,
          description: l.description || null,
          debit: Number(l.debit) || 0,
          credit: Number(l.credit) || 0,
          sort_order: idx,
        })) as never,
      );
      if (lineError) throw lineError;
      if (post) {
        const { error: postError } = await supabase
          .from("journal_entries")
          .update({ status: "posted" } as never)
          .eq("id", entryId);
        if (postError) throw postError;
      }
    },
    onSuccess: () => {
      toast.success("Journal saved");
      setOpen(false);
      resetForm();
      void qc.invalidateQueries({ queryKey: ["portal"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const post = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("journal_entries").update({ status: "posted" } as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Journal posted");
      void qc.invalidateQueries({ queryKey: ["portal"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("journal_entries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Journal deleted");
      void qc.invalidateQueries({ queryKey: ["portal"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const posted = entries.filter((e) => e.status === "posted");
  const viewing = entries.find((e) => e.id === viewId) ?? null;

  return (
    <div>
      <PortalHeading
        title="Journal Vouchers"
        subtitle="Manual double-entry adjustments. A journal can only be posted when debits equal credits."
        actions={
          <Button
            onClick={() => {
              resetForm();
              setOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> New journal
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Journals recorded", value: String(entries.length) },
          { label: "Posted journals", value: String(posted.length) },
          { label: "Posted value", value: AED(posted.reduce((s, e) => s + Number(e.total_debit), 0)) },
        ].map((k) => (
          <Panel key={k.label} className="p-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {k.label}
            </div>
            <div className="mt-2 text-lg font-semibold">{k.value}</div>
          </Panel>
        ))}
      </div>

      <Panel className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Journal</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Memo</th>
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3 text-right">Debit</th>
              <th className="px-4 py-3 text-right">Credit</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {entries.map((e) => (
              <tr key={e.id} className="hover:bg-muted/40">
                <td className="px-4 py-3 font-medium">{e.entry_no}</td>
                <td className="px-4 py-3 text-muted-foreground">{fmtDate(e.entry_date)}</td>
                <td className="px-4 py-3">{e.memo ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{e.reference ?? "—"}</td>
                <td className="px-4 py-3 text-right">{AED(e.total_debit)}</td>
                <td className="px-4 py-3 text-right">{AED(e.total_credit)}</td>
                <td className="px-4 py-3">
                  <StatusBadge value={e.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setViewId(e.id)}>
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    {e.status !== "posted" ? (
                      <Button size="sm" variant="outline" onClick={() => post.mutate(e.id)}>
                        <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Post
                      </Button>
                    ) : null}
                    {isAdmin ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (confirm(`Delete journal ${e.entry_no}?`)) remove.mutate(e.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
            {entries.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                  No journals recorded yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </Panel>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>New journal voucher</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="jdate">Date</Label>
                <Input id="jdate" type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="jref">Reference</Label>
                <Input id="jref" value={reference} onChange={(e) => setReference(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="jmemo">Memo</Label>
                <Input id="jmemo" value={memo} onChange={(e) => setMemo(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              {lines.map((l, idx) => (
                <div key={idx} className="grid items-end gap-2 sm:grid-cols-[1.3fr_1.4fr_0.8fr_0.8fr_auto]">
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm"
                    value={l.account_code}
                    onChange={(e) => {
                      const next = [...lines];
                      next[idx] = { ...l, account_code: e.target.value };
                      setLines(next);
                    }}
                  >
                    <option value="">— account —</option>
                    {accounts.map((a) => (
                      <option key={a.code} value={a.code}>
                        {a.code} — {a.name}
                      </option>
                    ))}
                  </select>
                  <Input
                    placeholder="Narration"
                    value={l.description}
                    onChange={(e) => {
                      const next = [...lines];
                      next[idx] = { ...l, description: e.target.value };
                      setLines(next);
                    }}
                  />
                  <Input
                    placeholder="Debit"
                    inputMode="decimal"
                    value={l.debit}
                    onChange={(e) => {
                      const next = [...lines];
                      next[idx] = { ...l, debit: e.target.value, credit: e.target.value ? "" : l.credit };
                      setLines(next);
                    }}
                  />
                  <Input
                    placeholder="Credit"
                    inputMode="decimal"
                    value={l.credit}
                    onChange={(e) => {
                      const next = [...lines];
                      next[idx] = { ...l, credit: e.target.value, debit: e.target.value ? "" : l.debit };
                      setLines(next);
                    }}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={lines.length <= 2}
                    onClick={() => setLines(lines.filter((_, i) => i !== idx))}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => setLines([...lines, emptyLine()])}>
                <Plus className="mr-2 h-3.5 w-3.5" /> Add line
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3 text-sm">
              <span>
                Debit total <strong>{AED(totalDebit)}</strong> · Credit total <strong>{AED(totalCredit)}</strong>
              </span>
              <span className={balanced ? "font-semibold text-emerald-700" : "font-semibold text-destructive"}>
                {balanced ? "Balanced" : `Difference ${AED(Math.abs(totalDebit - totalCredit))}`}
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="outline" disabled={create.isPending} onClick={() => create.mutate(false)}>
              Save as draft
            </Button>
            <Button disabled={!balanced || create.isPending} onClick={() => create.mutate(true)}>
              Save &amp; post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewId} onOpenChange={(v) => setViewId(v ? viewId : null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{viewing?.entry_no ?? "Journal"}</DialogTitle>
          </DialogHeader>
          <div className="text-sm">
            <p className="mb-3 text-muted-foreground">
              {fmtDate(viewing?.entry_date)} · {viewing?.memo ?? "No memo"}
            </p>
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="py-2">Account</th>
                  <th className="py-2">Narration</th>
                  <th className="py-2 text-right">Debit</th>
                  <th className="py-2 text-right">Credit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(viewLines ?? []).map((l) => (
                  <tr key={l.id}>
                    <td className="py-2 font-mono text-xs">{l.account_code}</td>
                    <td className="py-2">{l.description ?? "—"}</td>
                    <td className="py-2 text-right">{Number(l.debit) ? AED(l.debit) : "—"}</td>
                    <td className="py-2 text-right">{Number(l.credit) ? AED(l.credit) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewId(null)}>
              Close
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
