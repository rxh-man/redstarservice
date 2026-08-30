import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  FileText,
  Receipt,
  BookOpenCheck,
  Keyboard,
  Settings,
  ShieldCheck,
  LogOut,
  Loader2,
  Menu,
  BarChart3,

} from "lucide-react";
import logo from "@/assets/red-star-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { PortalProvider, usePortal, WelcomeBanner } from "@/lib/portal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/portal")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Staff Portal — Red Star Services ERP" },
      {
        name: "description",
        content:
          "Secure back-office portal for Red Star Services: customers, invoicing, receipts, chart of accounts and the typing job queue.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Red Star Services Staff Portal" },
      { property: "og:description", content: "Internal document management and accounting portal." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <PortalProvider>
      <WelcomeBanner />
      <PortalShell />
  ),
});

function LoginCard() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) setError(err.message);
    setBusy(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-hero px-4 py-16">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-3xl border border-white/10 bg-card p-8 shadow-lift"
      >
        <img src={logo} alt="Red Star Services" className="mx-auto h-16 w-auto object-contain" />
        <h1 className="mt-5 text-center text-xl font-semibold tracking-tight">Staff Portal</h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          Document management &amp; accounting system
        </p>

        <div className="mt-7 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Work email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@redstar.ae"
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
          Authorised personnel only. All activity in this portal is logged against your account.
        </p>
      </form>
    </div>
  );
}

function PortalShell() {
  const { loading, session, roles, fullName, avatarUrl, isAdmin, isAccountant, isTypist } = usePortal();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session) return <LoginCard />;

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/portal", replace: true });
  }

  if (roles.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <ShieldCheck className="h-10 w-10 text-[color:var(--brand-red)]" />
        <h1 className="text-xl font-semibold">No role assigned</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Your account exists but has not been granted a portal role yet. Ask an administrator to assign
          you Admin, Accountant or Typist access.
        </p>
        <Button variant="outline" onClick={signOut}>
          Sign out
        </Button>
      </div>
    );
  }

  const nav = [
    { to: "/portal", label: "Dashboard", icon: LayoutDashboard, show: true },
    { to: "/portal/customers", label: "Customers", icon: Users, show: true },
    { to: "/portal/invoices", label: "Invoices", icon: FileText, show: true },
    { to: "/portal/receipts", label: "Receipts", icon: Receipt, show: true },
    { to: "/portal/reports", label: "Reports", icon: BarChart3, show: isAccountant },
    { to: "/portal/accounts", label: "Chart of Accounts", icon: BookOpenCheck, show: isAccountant },

    { to: "/portal/jobs", label: "Typing Jobs", icon: Keyboard, show: true },
    { to: "/portal/services", label: "Service Catalogue", icon: BookOpenCheck, show: isAdmin },
    { to: "/portal/staff", label: "Staff & Roles", icon: ShieldCheck, show: isAdmin },
    { to: "/portal/settings", label: "Settings", icon: Settings, show: isAdmin },
  ].filter((n) => n.show);

  const roleLabel = isAdmin ? "Administrator" : isAccountant ? "Accountant" : isTypist ? "Typist" : "Staff";

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-[1500px]">
        <aside
          className={`${open ? "block" : "hidden"} fixed inset-0 z-40 w-full bg-card p-5 lg:static lg:block lg:w-64 lg:shrink-0 lg:border-r lg:border-border`}
        >
          <div className="flex items-center justify-between">
            <Link to="/portal" className="flex items-center gap-2" onClick={() => setOpen(false)}>
              <img src={logo} alt="Red Star Services" className="h-10 w-auto object-contain" />
              <div className="leading-tight">
                <div className="text-sm font-semibold">Red Star ERP</div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  {roleLabel}
                </div>
              </div>
            </Link>
            <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
              ✕
            </button>
          </div>

          <nav className="mt-7 space-y-1">
            {nav.map((item) => {
              const active = item.to === "/portal" ? pathname === "/portal" : pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    active
                      ? "bg-[color:var(--brand-red)] text-[color:var(--primary-foreground)]"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-8 rounded-xl border border-border p-3">
            <div className="flex items-center gap-3">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={fullName || "Profile photo"}
                  className="h-10 w-10 rounded-full border border-border object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-muted text-xs font-semibold text-muted-foreground">
                  {(fullName || session.user.email || "?").slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{fullName || session.user.email}</div>
                <div className="truncate text-xs text-muted-foreground">{session.user.email}</div>
              </div>
            </div>
            <Button variant="outline" size="sm" className="mt-3 w-full" onClick={signOut}>
              <LogOut className="mr-2 h-3.5 w-3.5" /> Sign out
            </Button>
          </div>

        </aside>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 lg:hidden">
            <button onClick={() => setOpen(true)} aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </button>
            <span className="text-sm font-semibold">Red Star ERP</span>
          </div>
          <div className="px-4 py-6 md:px-8 md:py-8">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
