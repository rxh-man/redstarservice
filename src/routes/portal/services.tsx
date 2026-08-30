import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
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
  name: string;
  name_ar: string | null;
  category: string | null;
  service_fee: number;
  govt_fee: number;
  active: boolean;
};

const empty = { name: "", name_ar: "", category: "", service_fee: "0", govt_fee: "0", active: true };

function ServicesAdmin() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState({ ...empty });

  const { data: services = [] } = useQuery({
    queryKey: ["portal", "services"],
    queryFn: async () => {
      const { data, error } = await supabase.from("services").select("*").order("category").order("name");
      if (error) throw error;
      return data as Service[];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        name_ar: form.name_ar || null,
        category: form.category || null,
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
        subtitle="Default service fees and government fees used when building invoices."
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

      <Panel className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Service</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3 text-right">Service fee</th>
              <th className="px-4 py-3 text-right">Govt. fee</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {services.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-3">
                  <div className="font-medium">{s.name}</div>
                  {s.name_ar ? <div className="arabic text-xs">{s.name_ar}</div> : null}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{s.category ?? "—"}</td>
                <td className="px-4 py-3 text-right">{AED(s.service_fee)}</td>
                <td className="px-4 py-3 text-right">{AED(s.govt_fee)}</td>
                <td className="px-4 py-3">{s.active ? "Yes" : "No"}</td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditing(s);
                        setForm({
                          name: s.name,
                          name_ar: s.name_ar ?? "",
                          category: s.category ?? "",
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
          </tbody>
        </table>
      </Panel>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit service" : "New service"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
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
              <Label htmlFor="cat">Category</Label>
              <Input id="cat" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
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
