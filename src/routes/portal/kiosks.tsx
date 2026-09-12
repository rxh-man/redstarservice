import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Loader2, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AED, fmtDate, Panel, PortalHeading, StatusBadge, usePortal } from "@/lib/portal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/portal/kiosks")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Kiosk Vendors — Red Star Services ERP" },
      {
        name: "description",
        content: "Manage kiosk vendor tenancies, rent schedules and vendor requests.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Kiosk Vendors — Red Star Services ERP" },
      { property: "og:description", content: "Kiosk tenancy and request management." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: KiosksPage,
});

type Vendor = {
  id: string;
  code: string;
  name: string;
  business_type: string | null;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  kiosk_no: string | null;
  rent_amount: number | null;
  rent_start_date: string | null;
  next_payment_date: string | null;
  payment_cycle: string;
  notes: string | null;
  active: boolean;
};

type Request = {
  id: string;
  vendor_id: string;
  category: string;
  subject: string;
  details: string | null;
  status: string;
  staff_reply: string | null;
  created_at: string;
};

const STATUSES = ["new", "in_progress", "completed", "rejected"];

function KiosksPage() {
  const { isAccountant } = usePortal();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState<Vendor | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const [{ data: v }, { data: r }] = await Promise.all([
      supabase.from("kiosk_vendors").select("*").order("code"),
      supabase
        .from("kiosk_requests")
        .select("id, vendor_id, category, subject, details, status, staff_reply, created_at")
        .order("created_at", { ascending: false }),
    ]);
    setVendors((v as Vendor[]) ?? []);
    setRequests((r as Request[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveVendor(e: React.FormEvent) {
    e.preventDefault();
    if (!edit) return;
    setSaving(true);
    const { error } = await supabase
      .from("kiosk_vendors")
      .update({
        name: edit.name,
        business_type: edit.business_type,
        contact_person: edit.contact_person,
        phone: edit.phone,
        email: edit.email,
        kiosk_no: edit.kiosk_no,
        rent_amount: Number(edit.rent_amount ?? 0),
        rent_start_date: edit.rent_start_date || null,
        next_payment_date: edit.next_payment_date || null,
        payment_cycle: edit.payment_cycle,
        notes: edit.notes,
        active: edit.active,
      })
      .eq("id", edit.id);
    setSaving(false);
    if (error) {
      toast.error("Could not save the kiosk vendor.");
      return;
    }
    toast.success("Kiosk vendor updated.");
    setEdit(null);
    void load();
  }

  async function updateRequest(id: string, patch: { status?: string; staff_reply?: string }) {
    const { error } = await supabase.from("kiosk_requests").update(patch).eq("id", id);
    if (error) {
      toast.error("Could not update the request.");
      return;
    }
    void load();
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <PortalHeading
        title="Kiosk Vendors"
        subtitle="Tenancy dates, rent schedule and vendor requests for the in-centre kiosks."
      />

      <Panel className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Vendor</th>
              <th className="px-4 py-3">Kiosk</th>
              <th className="px-4 py-3">Rent start</th>
              <th className="px-4 py-3">Next payment</th>
              <th className="px-4 py-3">Rent</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {vendors.map((v) => (
              <tr key={v.id} className="border-b border-border/60">
                <td className="px-4 py-3">
                  <div className="font-medium">{v.name}</div>
                  <div className="text-xs text-muted-foreground">{v.business_type ?? "—"}</div>
                </td>
                <td className="px-4 py-3">{v.kiosk_no ?? "—"}</td>
                <td className="px-4 py-3">{fmtDate(v.rent_start_date)}</td>
                <td className="px-4 py-3">{fmtDate(v.next_payment_date)}</td>
                <td className="px-4 py-3">{AED(v.rent_amount)}</td>
                <td className="px-4 py-3">
                  {isAccountant ? (
                    <button aria-label="Edit vendor" onClick={() => setEdit({ ...v })}>
                      <Pencil className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
            {vendors.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                  No kiosk vendors yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </Panel>

      <h2 className="mt-8 mb-3 text-base font-semibold">Vendor requests</h2>
      <div className="space-y-3">
        {requests.length === 0 ? (
          <Panel className="p-6 text-sm text-muted-foreground">No requests raised yet.</Panel>
        ) : (
          requests.map((r) => {
            const vendor = vendors.find((v) => v.id === r.vendor_id);
            return (
              <Panel key={r.id} className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold">{r.subject}</div>
                    <div className="text-xs text-muted-foreground">
                      {vendor?.name ?? "—"} · {r.category} · {fmtDate(r.created_at)}
                    </div>
                  </div>
                  <StatusBadge value={r.status} />
                </div>
                {r.details ? <p className="mt-2 text-sm">{r.details}</p> : null}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <select
                    className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                    value={r.status}
                    onChange={(e) => void updateRequest(r.id, { status: e.target.value })}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                  <Input
                    className="max-w-sm"
                    placeholder="Reply to the vendor"
                    defaultValue={r.staff_reply ?? ""}
                    onBlur={(e) => {
                      if (e.target.value !== (r.staff_reply ?? "")) {
                        void updateRequest(r.id, { staff_reply: e.target.value });
                      }
                    }}
                  />
                </div>
              </Panel>
            );
          })
        )}
      </div>

      {edit ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
          <form
            onSubmit={saveVendor}
            className="mt-10 w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-lift"
          >
            <h2 className="text-lg font-semibold">Edit kiosk vendor</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Vendor name</Label>
                <Input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Business type</Label>
                <Input
                  value={edit.business_type ?? ""}
                  onChange={(e) => setEdit({ ...edit, business_type: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Kiosk no.</Label>
                <Input
                  value={edit.kiosk_no ?? ""}
                  onChange={(e) => setEdit({ ...edit, kiosk_no: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Rent amount (AED)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={edit.rent_amount ?? 0}
                  onChange={(e) => setEdit({ ...edit, rent_amount: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Rent start date</Label>
                <Input
                  type="date"
                  value={edit.rent_start_date ?? ""}
                  onChange={(e) => setEdit({ ...edit, rent_start_date: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Next payment date</Label>
                <Input
                  type="date"
                  value={edit.next_payment_date ?? ""}
                  onChange={(e) => setEdit({ ...edit, next_payment_date: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Payment cycle</Label>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={edit.payment_cycle}
                  onChange={(e) => setEdit({ ...edit, payment_cycle: e.target.value })}
                >
                  {["monthly", "quarterly", "half-yearly", "yearly"].map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Contact person</Label>
                <Input
                  value={edit.contact_person ?? ""}
                  onChange={(e) => setEdit({ ...edit, contact_person: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input value={edit.phone ?? ""} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input value={edit.email ?? ""} onChange={(e) => setEdit({ ...edit, email: e.target.value })} />
              </div>
            </div>
            <div className="mt-4 space-y-1.5">
              <Label>Notes</Label>
              <Textarea
                rows={3}
                value={edit.notes ?? ""}
                onChange={(e) => setEdit({ ...edit, notes: e.target.value })}
              />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEdit(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
