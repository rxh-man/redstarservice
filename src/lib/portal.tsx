import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Role = "admin" | "accountant" | "typist";

type PortalCtx = {
  session: Session | null;
  loading: boolean;
  roles: Role[];
  fullName: string;
  avatarUrl: string | null;
  isAdmin: boolean;
  isAccountant: boolean;
  isTypist: boolean;
  refresh: () => Promise<void>;
};

const Ctx = createContext<PortalCtx | null>(null);

export function PortalProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (uid: string | null) => {
    if (!uid) {
      setRoles([]);
      setFullName("");
      setAvatarUrl(null);
      return;
    }
    const [{ data: roleRows }, { data: profile }] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", uid),
      supabase.from("profiles").select("full_name, avatar_path").eq("id", uid).maybeSingle(),
    ]);
    setRoles(((roleRows ?? []) as { role: Role }[]).map((r) => r.role));
    setFullName(profile?.full_name ?? "");
    if (profile?.avatar_path) {
      const { data: signed } = await supabase.storage
        .from("avatars")
        .createSignedUrl(profile.avatar_path, 60 * 60 * 8);
      setAvatarUrl(signed?.signedUrl ?? null);
    } else {
      setAvatarUrl(null);
    }
  }, []);


  useEffect(() => {
    let alive = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!alive) return;
      setSession(data.session ?? null);
      await load(data.session?.user.id ?? null);
      if (alive) setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next ?? null);
      void load(next?.user.id ?? null);
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [load]);

  const value = useMemo<PortalCtx>(
    () => ({
      session,
      loading,
      roles,
      fullName,
      avatarUrl,
      isAdmin: roles.includes("admin"),
      isAccountant: roles.includes("admin") || roles.includes("accountant"),
      isTypist: roles.includes("admin") || roles.includes("typist"),
      refresh: async () => load(session?.user.id ?? null),
    }),
    [session, loading, roles, fullName, avatarUrl, load],

  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePortal(): PortalCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePortal must be used inside PortalProvider");
  return ctx;
}

export const AED = (n: number | null | undefined) =>
  `AED ${(Number(n ?? 0)).toLocaleString("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const fmtDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export const statusTone: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-100 text-blue-800",
  partial: "bg-amber-100 text-amber-800",
  paid: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
  new: "bg-muted text-muted-foreground",
  in_progress: "bg-blue-100 text-blue-800",
  ready: "bg-amber-100 text-amber-800",
  submitted: "bg-indigo-100 text-indigo-800",
  completed: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
};

export function StatusBadge({ value }: { value: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${statusTone[value] ?? "bg-muted text-muted-foreground"}`}
    >
      {value.replace("_", " ")}
    </span>
  );
}

export function PortalHeading({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-border bg-card shadow-card ${className}`}>{children}</div>
  );
}
