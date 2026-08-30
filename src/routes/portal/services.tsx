import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AED, Panel, PortalHeading } from "@/lib/portal";
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

export const Route = createFileRoute("/portal/services")({ component: ServicesAdmin });

type Service = {
  id: string;
  code: string | null;
  name: string;
  name_ar: string | null;
  category: string | null;
  govt_bank: string | null;
  service_fee: number;
  govt_fee: number;
  active: boolean;
};

const empty = {
  code: "",
  name: "",
  name_ar: "",
  category: "",
  govt_bank: "",
  service_fee: "0",
  govt_fee: "0",
  active: true,
};

const PAGE = 25;

function ServicesAdmin() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState({ ...empty });
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [page, setPage] = useState(0);

  const { data: services = [], isLoading } = useQuery({
    queryKey: ["portal", "services"],
    queryFn: async () => {
      const rows: Service[] = [];
      // paginate through the full catalogue (PostgREST caps a single request at 1000 rows)
      for (let from = 0; ; from += 1000) {
        const { data, error } = await supabase
          .from("services")
          .select("id, code, name, name_ar, category, govt_bank, service_fee, govt_fee, active")
          .order("category")
          .order("name")
          .range(from, from + 999);
        if (error) throw error;
        rows.push(...((data ?? []) as Service[]));
        if (!data || data.length < 1000) break;
      }
      return rows;
    },
  });

  const categories = useMemo(
    () => Array.from(new Set(services.map((s) => s.category ?? "Uncategorised"))).sort(),
    [services],
  );

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return services.filter((s) => {
      if (cat !== "all" && (s.category ?? "Uncategorised") !== cat) return false;
      if (!term) return true;
      return (
        s.name.toLowerCase().includes(term) ||
        (s.code ?? "").toLowerCase().includes(term) ||
        (s.name_ar ?? "").includes(term) ||
        (s.category ?? "").toLowerCase().includes(term)
      );
    });
  }, [services, q, cat]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const current = Math.min(page, pages - 1);
  const rows = filtered.slice(current * PAGE, current * PAGE + PAGE);

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        code: form.code.trim() || null,
        name: form.name.trim(),
        name_ar: form.name_ar.trim() || null,
        category: form.category.trim() || null,
        govt_bank: form.govt_bank.trim() || null,
        service_fee: Number(form.service_fee) || 0,
        govt_fee: Number(form.govt_fee) || 0,
        active: form.active,
      } as never;
      if (editing) {
        const { error } = await supabase.from("services").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("services").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Service updated" : "Service added");
      setOpen(false);
      setEditing(null);
      setForm({ ...empty });
      void qc.invalidateQueries({ queryKey: ["portal"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("services").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Service deleted");
      void qc.invalidateQueries({ queryKey: ["portal"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <PortalHeading
        title="Service Catalogue"
        subtitle={`${services.length.toLocaleString()} services across ${categories.length} departments — service fees and government fees used when building invoices.`}
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setForm({ ...empty });
              setOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> New service
          </Button>
        }
      />

      <Panel className="mb-4 flex flex-wrap items-center gap-3 p-4">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by code, English or Arabic name…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(0);
            }}
          />
        </div>
        <select
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          value={cat}
          onChange={(e) => {
            setCat(e.target.value);
            setPage(0);
          }}
        >
          <option value="all">All departments</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <span className="text-xs text-muted-foreground">
          {isLoading ? "Loading…" : `${filtered.length.toLocaleString()} match`}
        </span>
      </Panel>

      <Panel className="overflow-x-auto">
        <table className="w-full min-w-[880px] text-sm">
          <thead className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Service</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3 text-right">Service fee</th>
              <th className="px-4 py-3 text-right">Govt. fee</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((s) => (
              <tr key={s.id} className={s.active ? "" : "opacity-60"}>
                <td className="px-4 py-3 font-mono text-xs">{s.code ?? "—"}</td>
                <td className="px-4 py-3">
                  <div className="font-medium">{s.name}</div>
                  {s.name_ar ? <div className="arabic text-xs">{s.name_ar}</div> : null}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{s.category ?? "—"}</td>
                <td className="px-4 py-3 text-right">{AED(s.service_fee)}</td>
                <td className="px-4 py-3 text-right">{AED(s.govt_fee)}</td>
                <td className="px-4 py-3 text-right font-semibold">
                  {AED(Number(s.service_fee) + Number(s.govt_fee))}
                </td>
                <td className="px-4 py-3">{s.active ? "Yes" : "No"}</td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditing(s);
                        setForm({
                          code: s.code ?? "",
                          name: s.name,
                          name_ar: s.name_ar ?? "",
                          category: s.category ?? "",
                          govt_bank: s.govt_bank ?? "",
                          service_fee: String(s.service_fee),
                          govt_fee: String(s.govt_fee),
                          active: s.active,
                        });
                        setOpen(true);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (confirm(`Delete "${s.name}"?`)) remove.mutate(s.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && !isLoading ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                  No services match your search.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </Panel>

      <div className="mt-4 flex items-center justify-between gap-3 text-sm">
        <span className="text-muted-foreground">
          Page {current + 1} of {pages}
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={current === 0} onClick={() => setPage(current - 1)}>
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={current >= pages - 1}
            onClick={() => setPage(current + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit service" : "New service"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="scode">Service code</Label>
              <Input id="scode" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat">Department / category</Label>
              <Input id="cat" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="sname">Name *</Label>
              <Input id="sname" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="sname_ar">Name (Arabic)</Label>
              <Input
                id="sname_ar"
                value={form.name_ar}
                onChange={(e) => setForm({ ...form, name_ar: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fee">Service fee</Label>
              <Input
                id="fee"
                value={form.service_fee}
                onChange={(e) => setForm({ ...form, service_fee: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gfee2">Government fee</Label>
              <Input id="gfee2" value={form.govt_fee} onChange={(e) => setForm({ ...form, govt_fee: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gbank">Government payment account</Label>
              <Input
                id="gbank"
                value={form.govt_bank}
                onChange={(e) => setForm({ ...form, govt_bank: e.target.value })}
              />
            </div>
            <label className="flex items-center gap-2 self-end text-sm">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
              />
              Active
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button disabled={!form.name || save.isPending} onClick={() => save.mutate()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
