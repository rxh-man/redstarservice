import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listStaff = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin, staffDirectory } = await import("./staff.server");
    await assertAdmin(context.supabase, context.userId);
    return staffDirectory();
  });

export const createStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    email: string;
    password: string;
    full_name: string;
    job_title?: string;
    role: "admin" | "accountant" | "typist";
  }) => input)
  .handler(async ({ data, context }) => {
    const { assertAdmin, addStaff } = await import("./staff.server");
    await assertAdmin(context.supabase, context.userId);
    return addStaff(data);
  });

export const updateStaffRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { user_id: string; role: "admin" | "accountant" | "typist" }) => input)
  .handler(async ({ data, context }) => {
    const { assertAdmin, setStaffRole } = await import("./staff.server");
    await assertAdmin(context.supabase, context.userId);
    return setStaffRole(data.user_id, data.role);
  });

export const removeStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { user_id: string }) => input)
  .handler(async ({ data, context }) => {
    const { assertAdmin, deleteStaff } = await import("./staff.server");
    await assertAdmin(context.supabase, context.userId);
    if (data.user_id === context.userId) throw new Error("You cannot delete your own account.");
    return deleteStaff(data.user_id);
  });

export const resetStaffPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { user_id: string; password: string }) => input)
  .handler(async ({ data, context }) => {
    const { assertAdmin, setStaffPassword } = await import("./staff.server");
    await assertAdmin(context.supabase, context.userId);
    return setStaffPassword(data.user_id, data.password);
  });
