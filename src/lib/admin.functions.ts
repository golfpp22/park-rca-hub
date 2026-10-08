import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const roleEnum = z.enum(["admin", "executive", "operator", "technician"]);
const codeSchema = z.string().trim().min(2).max(30).regex(/^[A-Za-z0-9_-]+$/, "รหัสพนักงานใช้ได้เฉพาะ A-Z 0-9 - _");
const email = (c: string) => `${c.trim().toLowerCase()}@parking.local`;

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (!data) throw new Error("ต้องเป็นผู้ดูแลระบบเท่านั้น");
}

export const needsSetup = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { count } = await supabaseAdmin.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "admin");
  return { needsSetup: (count ?? 0) === 0 };
});

export const bootstrapAdmin = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ code: codeSchema, name: z.string().trim().min(1).max(100), password: z.string().min(8).max(72) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "admin");
    if ((count ?? 0) > 0) throw new Error("ระบบถูกตั้งค่าแล้ว");
    const { data: u, error } = await supabaseAdmin.auth.admin.createUser({ email: email(data.code), password: data.password, email_confirm: true });
    if (error || !u.user) throw new Error(error?.message ?? "สร้างผู้ใช้ไม่สำเร็จ");
    await supabaseAdmin.from("profiles").insert({ id: u.user.id, employee_code: data.code.toUpperCase(), full_name: data.name, position: "Admin" });
    await supabaseAdmin.from("user_roles").insert({ user_id: u.user.id, role: "admin" });
    return { ok: true };
  });

export const createStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ code: codeSchema, name: z.string().trim().min(1).max(100), password: z.string().min(8).max(72), role: roleEnum, position: z.string().max(100).optional(), phone: z.string().max(30).optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: u, error } = await supabaseAdmin.auth.admin.createUser({ email: email(data.code), password: data.password, email_confirm: true });
    if (error || !u.user) throw new Error(error?.message?.includes("already") ? "รหัสพนักงานนี้มีอยู่แล้ว" : error?.message ?? "สร้างไม่สำเร็จ");
    const { error: e2 } = await supabaseAdmin.from("profiles").insert({ id: u.user.id, employee_code: data.code.toUpperCase(), full_name: data.name, position: data.position ?? null, phone: data.phone ?? null });
    if (e2) { await supabaseAdmin.auth.admin.deleteUser(u.user.id); throw new Error(e2.message); }
    await supabaseAdmin.from("user_roles").insert({ user_id: u.user.id, role: data.role });
    return { ok: true };
  });

export const updateStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ id: z.string().uuid(), name: z.string().trim().min(1).max(100), role: roleEnum, active: z.boolean(), position: z.string().max(100).nullable().optional(), phone: z.string().max(30).nullable().optional(), password: z.string().min(8).max(72).optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.id === context.userId && (data.role !== "admin" || !data.active)) throw new Error("ไม่สามารถลดสิทธิ์หรือปิดบัญชีของตัวเองได้");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("profiles").update({ full_name: data.name, active: data.active, position: data.position ?? null, phone: data.phone ?? null }).eq("id", data.id);
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.id);
    await supabaseAdmin.from("user_roles").insert({ user_id: data.id, role: data.role });
    const attrs: Record<string, unknown> = { ban_duration: data.active ? "none" : "876000h" };
    if (data.password) attrs.password = data.password;
    await supabaseAdmin.auth.admin.updateUserById(data.id, attrs);
    return { ok: true };
  });

export const deleteStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.id === context.userId) throw new Error("ไม่สามารถลบบัญชีของตัวเองได้");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
