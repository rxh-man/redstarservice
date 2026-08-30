import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type Role = "admin" | "accountant" | "typist";

export async function assertAdmin(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw new Error("Could not verify permissions.");
  if (!data) throw new Error("Forbidden: administrators only.");
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export async function staffDirectory() {
  const db = await admin();
  const [{ data: profiles }, { data: roles }, users] = await Promise.all([
    db.from("profiles").select("id, full_name, email, phone, job_title, active, avatar_path, created_at"),
    db.from("user_roles").select("user_id, role"),
    db.auth.admin.listUsers({ page: 1, perPage: 200 }),
  ]);

  const roleByUser = new Map<string, Role>();
  for (const r of roles ?? []) roleByUser.set(r.user_id, r.role as Role);

  return Promise.all(
    (profiles ?? []).map(async (p) => {
      const authUser = users.data.users.find((u) => u.id === p.id);
      let avatar_url: string | null = null;
      if (p.avatar_path) {
        const { data: signed } = await db.storage.from("avatars").createSignedUrl(p.avatar_path, 60 * 60 * 8);
        avatar_url = signed?.signedUrl ?? null;
      }
      return {
        ...p,
        role: roleByUser.get(p.id) ?? null,
        last_sign_in_at: authUser?.last_sign_in_at ?? null,
        avatar_url,
      };
    }),
  );
}

export async function updateStaffProfile(input: {
  user_id: string;
  full_name?: string;
  job_title?: string | null;
  phone?: string | null;
  email?: string;
  active?: boolean;
  avatar_path?: string | null;
}) {
  const db = await admin();
  const patch: Record<string, unknown> = {};
  if (input.full_name !== undefined) patch['full_name'] = input.full_name;
  if (input.job_title !== undefined) patch['job_title'] = input.job_title || null;
  if (input.phone !== undefined) patch['phone'] = input.phone || null;
  if (input.email !== undefined) patch['email'] = input.email;
  if (input.active !== undefined) patch['active'] = input.active;
  if (input.avatar_path !== undefined) patch['avatar_path'] = input.avatar_path;

  if (Object.keys(patch).length) {
    const { error } = await db.from("profiles").update(patch as never).eq("id", input.user_id);
    if (error) throw new Error(error.message);
  }

  if (input.email) {
    const { error } = await db.auth.admin.updateUserById(input.user_id, {
      email: input.email,
      email_confirm: true,
    });
    if (error) throw new Error(error.message);
  }
  if (input.full_name) {
    await db.auth.admin.updateUserById(input.user_id, { user_metadata: { full_name: input.full_name } });
  }
  return { ok: true };
}

export async function addStaff(input: {
  email: string;
  password: string;
  full_name: string;
  job_title?: string;
  role: Role;
}) {
  const db = await admin();
  const { data, error } = await db.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: { full_name: input.full_name },
  });
  if (error || !data.user) throw new Error(error?.message ?? "Could not create the account.");

  await db.from("profiles").upsert({
    id: data.user.id,
    full_name: input.full_name,
    email: input.email,
    job_title: input.job_title ?? null,
  });

  const { error: roleError } = await db
    .from("user_roles")
    .insert({ user_id: data.user.id, role: input.role });
  if (roleError) throw new Error(roleError.message);

  return { ok: true, user_id: data.user.id };
}

export async function setStaffRole(userId: string, role: Role) {
  const db = await admin();
  await db.from("user_roles").delete().eq("user_id", userId);
  const { error } = await db.from("user_roles").insert({ user_id: userId, role });
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function deleteStaff(userId: string) {
  const db = await admin();
  const { error } = await db.auth.admin.deleteUser(userId);
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function setStaffPassword(userId: string, password: string) {
  const db = await admin();
  const { error } = await db.auth.admin.updateUserById(userId, { password });
  if (error) throw new Error(error.message);
  return { ok: true };
}
