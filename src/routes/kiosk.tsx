import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  Loader2,
  LogOut,
  CalendarClock,
  Wallet,
  Store,
  Plus,
  CheckCircle2,
  Wifi,
  Zap,
  Droplets,
  Armchair,
  ShieldCheck,
} from "lucide-react";
import logo from "@/assets/red-star-logo.png";
import tripluxAsset from "@/assets/triplux-logo.jpg.asset.json";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AED, fmtDate, Panel, PortalHeading, StatusBadge } from "@/lib/portal";
import { toast } from "sonner";

export const Route = createFileRoute("/kiosk")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Kiosk Vendor Portal — Red Star Services" },
      {
        name: "description",
        content:
          "Secure portal for Red Star Services kiosk vendors: tenancy dates, next rent due date, included facilities and service requests.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Kiosk Vendor Portal — Red Star Services" },
      { property: "og:description", content: "Kiosk vendor tenancy and requests portal." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: KioskPortal,
});

type Vendor = {
  id: string;
  code: string;
  name: string;
  business_type: string | null;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  trade_license_no: string | null;
  license_expiry: string | null;
  kiosk_no: string | null;
  rent_amount: number | null;
  rent_start_date: string | null;
  next_payment_date: string | null;
  payment_cycle: string;
  notes: string | null;
};

type Request = {
  id: string;
  category: string;
  subject: string;
  details: string | null;
  status: string;
  staff_reply: string | null;
  created_at: string;
};

const USERNAME_MAP: Record<string, string> = {
  "express umrah": "expressumrah@redstarservice.ae",
  expressumrah: "expressumrah@redstarservice.ae",
  triplex: "triplex@redstarservice.ae",
  triplux: "triplex@redstarservice.ae",
};

function resolveEmail(input: string) {
  const raw = input.trim();
  if (raw.includes("@")) return raw;
  return USERNAME_MAP[raw.toLowerCase()] ?? raw;
}

function KioskPortal() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [greet, setGreet] = useState(false);

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setSession(data.session ?? null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next ?? null);
      if (event === "SIGNED_IN") setGreet(true);
      if (event === "SIGNED_OUT") setGreet(false);
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session) return <KioskLogin />;

  return <KioskDashboard session={session} greet={greet} onGreetDone={() => setGreet(false)} />;
}

function KioskLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({
      email: resolveEmail(username),
      password,
    });
    if (err) setError("Those details did not match a kiosk vendor account.");
    setBusy(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-hero px-4 py-16">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-3xl border border-white/10 bg-card p-8 shadow-lift"
      >
        <img src={logo} alt="Red Star Services" className="mx-auto h-16 w-auto object-contain" />
        <h1 className="mt-5 text-center text-xl font-semibold tracking-tight">Kiosk Vendor Portal</h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          Tenancy details, rent schedule &amp; requests
        </p>

        <div className="mt-7 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="username">Vendor name</Label>
            <Input
              id="username"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Express Umrah"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
          </Button>
        </div>

        <p className="mt-6 text-center text-[11px] leading-relaxed text-muted-foreground">
          Registered kiosk vendors of Red Star Services only. All activity is logged against your account.
        </p>
      </form>
    </div>
  );
}

function Greeting({ name, onDone }: { name: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-5 z-[100] flex justify-center px-4">
      <div className="flex items-center gap-3 rounded-full border border-border bg-card/95 px-4 py-2.5 shadow-lift backdrop-blur animate-in fade-in slide-in-from-top-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary ring-2 ring-primary/30">
          {name.charAt(0).toUpperCase()}
        </span>
        <div className="leading-tight">
          <p className="text-sm font-semibold">Hi {name}</p>
          <p className="text-[11px] text-muted-foreground">Welcome to your Red Star kiosk portal</p>
        </div>
      </div>
    </div>
  );
}

const INCLUSIONS = [
  { icon: Store, label: "Dedicated kiosk & office space" },
  { icon: Zap, label: "Electricity (DEWA/SEWA) included" },
  { icon: Droplets, label: "Water supply included" },
  { icon: Wifi, label: "High-speed Wi-Fi included" },
  { icon: Armchair, label: "Desk, chair & storage included" },
  { icon: ShieldCheck, label: "Cleaning, reception & security included" },
];

const CATEGORIES = [
  "Maintenance",
  "Electricity / Water",
  "Wi-Fi / Internet",
  "Furniture / Desk",
  "Signage / Branding",
  "Rent / Payment",
  "Other",
];

function KioskDashboard({
  session,
  greet,
  onGreetDone,
}: {
  session: Session;
  greet: boolean;
  onGreetDone: () => void;
}) {
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<Vendor>>({});
  const [saving, setSaving] = useState(false);
  const [req, setReq] = useState({ category: CATEGORIES[0]!, subject: "", details: "" });
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    const { data: v } = await supabase
      .from("kiosk_vendors")
      .select("*")
      .eq("user_id", session.user.id)
      .maybeSingle();
    setVendor((v as Vendor) ?? null);
    if (v) {
      const { data: r } = await supabase
        .from("kiosk_requests")
        .select("id, category, subject, details, status, staff_reply, created_at")
        .eq("vendor_id", (v as Vendor).id)
        .order("created_at", { ascending: false });
      setRequests((r as Request[]) ?? []);
    }
    setLoading(false);
  }, [session.user.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const displayName = vendor?.name || session.user.email || "Vendor";

  async function signOut() {
    await supabase.auth.signOut();
  }

  function openEdit() {
    if (!vendor) return;
    setForm({
      name: vendor.name,
      business_type: vendor.business_type,
      contact_person: vendor.contact_person,
      phone: vendor.phone,
      email: vendor.email,
      trade_license_no: vendor.trade_license_no,
      license_expiry: vendor.license_expiry,
      notes: vendor.notes,
    });
    setEditing(true);
  }

  async function saveVendor(e: React.FormEvent) {
    e.preventDefault();
    if (!vendor) return;
    setSaving(true);
    const { error } = await supabase
      .from("kiosk_vendors")
      .update({
        name: (form.name || vendor.name)!,
        business_type: form.business_type || null,
        contact_person: form.contact_person || null,
        phone: form.phone || null,
        email: form.email || null,
        trade_license_no: form.trade_license_no || null,
        license_expiry: form.license_expiry || null,
        notes: form.notes || null,
      })
      .eq("id", vendor.id);
    setSaving(false);
    if (error) {
      toast.error("Could not save your details.");
      return;
    }
    toast.success("Vendor details updated.");
    setEditing(false);
    void load();
  }

  async function submitRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!vendor || !req.subject.trim()) return;
    setSending(true);
    const { error } = await supabase.from("kiosk_requests").insert({
      vendor_id: vendor.id,
      category: req.category,
      subject: req.subject.trim(),
      details: req.details.trim() || null,
      created_by: session.user.id,
    });
    setSending(false);
    if (error) {
      toast.error("Could not send your request.");
      return;
    }
    toast.success("Request sent to the Red Star office team.");
    setReq({ category: CATEGORIES[0]!, subject: "", details: "" });
    void load();
  }

  const rentSummary = useMemo(
    () => [
      {
        icon: CalendarClock,
        label: "Tenancy started",
        value: vendor?.rent_start_date ? fmtDate(vendor.rent_start_date) : "To be updated",
      },
      {
        icon: Wallet,
        label: "Next payment due",
        value: vendor?.next_payment_date ? fmtDate(vendor.next_payment_date) : "To be updated",
      },
      {
        icon: Store,
        label: `Rent (${vendor?.payment_cycle ?? "monthly"})`,
        value: vendor?.rent_amount ? AED(vendor.rent_amount) : "To be updated",
      },
    ],
    [vendor],
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {greet ? <Greeting name={displayName} onDone={onGreetDone} /> : null}

      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 md:px-8">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Red Star Services" className="h-10 w-auto object-contain" />
            {vendor?.name?.toLowerCase().includes("triplux") ? (
              <img
                src={tripluxAsset.url}
                alt="TripLux Tourism"
                className="h-16 w-auto rounded-md border border-border bg-white object-contain p-1"
              />
            ) : null}
            <div className="leading-tight">
              <div className="text-sm font-semibold">Kiosk Vendor Portal</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                {vendor?.kiosk_no ?? "Red Star Services"}
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={signOut}>
            <LogOut className="mr-2 h-3.5 w-3.5" /> Sign out
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8 md:px-8">
        <PortalHeading
          title={displayName}
          subtitle={vendor?.business_type ?? "Kiosk vendor account"}
          actions={
            vendor ? (
              <Button variant="outline" onClick={openEdit}>
                Update vendor details
              </Button>
            ) : null
          }
        />

        {!vendor ? (
          <Panel className="p-6">
            <p className="text-sm text-muted-foreground">
              Your kiosk record is being set up by the Red Star office team. Please check back shortly.
            </p>
          </Panel>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              {rentSummary.map((c) => (
                <Panel key={c.label} className="p-5">
                  <c.icon className="h-5 w-5 text-[color:var(--brand-red)]" />
                  <div className="mt-3 text-xs uppercase tracking-wide text-muted-foreground">
                    {c.label}
                  </div>
                  <div className="mt-1 text-lg font-semibold">{c.value}</div>
                </Panel>
              ))}
            </div>

            <Panel className="p-5">
              <p className="text-sm text-muted-foreground">
                Your tenancy dates and rent schedule are being finalised by our accounts team — the exact
                start date and next cheque due date will appear here shortly. You will always see the
                current schedule on this page.
              </p>
            </Panel>

            <Panel className="p-6">
              <h2 className="text-base font-semibold">What your rent includes</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                One all-inclusive rent. No hidden charges, no separate utility bills, no service fees.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {INCLUSIONS.map((i) => (
                  <div key={i.label} className="flex items-center gap-3 rounded-xl border border-border p-3">
                    <i.icon className="h-4 w-4 text-[color:var(--brand-red)]" />
                    <span className="text-sm">{i.label}</span>
                    <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-600" />
                  </div>
                ))}
              </div>
            </Panel>

            <Panel className="p-6">
              <h2 className="text-base font-semibold">Raise a new request</h2>
              <form onSubmit={submitRequest} className="mt-4 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="cat">Category</Label>
                    <select
                      id="cat"
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      value={req.category}
                      onChange={(e) => setReq({ ...req, category: e.target.value })}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      required
                      value={req.subject}
                      onChange={(e) => setReq({ ...req, subject: e.target.value })}
                      placeholder="Extra desk required"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="details">Details</Label>
                  <Textarea
                    id="details"
                    rows={3}
                    value={req.details}
                    onChange={(e) => setReq({ ...req, details: e.target.value })}
                    placeholder="Tell us what you need and when."
                  />
                </div>
                <Button type="submit" disabled={sending}>
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" /> Send request
                    </>
                  )}
                </Button>
              </form>
            </Panel>

            <Panel className="p-6">
              <h2 className="text-base font-semibold">Your requests</h2>
              {requests.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">No requests raised yet.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {requests.map((r) => (
                    <div key={r.id} className="rounded-xl border border-border p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-sm font-semibold">{r.subject}</div>
                        <StatusBadge value={r.status} />
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {r.category} · {fmtDate(r.created_at)}
                      </div>
                      {r.details ? <p className="mt-2 text-sm">{r.details}</p> : null}
                      {r.staff_reply ? (
                        <p className="mt-2 rounded-lg bg-muted p-2 text-sm">
                          <span className="font-medium">Office reply: </span>
                          {r.staff_reply}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>
        )}
      </div>

      {editing && vendor ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
          <form
            onSubmit={saveVendor}
            className="mt-10 w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-lift"
          >
            <h2 className="text-lg font-semibold">Vendor details</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Vendor name" value={form.name ?? ""} onChange={(v) => setForm({ ...form, name: v })} />
              <Field
                label="Business type"
                value={form.business_type ?? ""}
                onChange={(v) => setForm({ ...form, business_type: v })}
              />
              <Field
                label="Contact person"
                value={form.contact_person ?? ""}
                onChange={(v) => setForm({ ...form, contact_person: v })}
              />
              <Field label="Phone" value={form.phone ?? ""} onChange={(v) => setForm({ ...form, phone: v })} />
              <Field label="Email" value={form.email ?? ""} onChange={(v) => setForm({ ...form, email: v })} />
              <Field
                label="Trade licence no."
                value={form.trade_license_no ?? ""}
                onChange={(v) => setForm({ ...form, trade_license_no: v })}
              />
              <Field
                label="Licence expiry"
                type="date"
                value={form.license_expiry ?? ""}
                onChange={(v) => setForm({ ...form, license_expiry: v })}
              />
            </div>
            <div className="mt-4 space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                rows={3}
                value={form.notes ?? ""}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditing(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save details"}
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
