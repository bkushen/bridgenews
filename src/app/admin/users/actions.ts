"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/app/admin/actions";

async function ctx() { const session = await requireAdmin(); if (session.preview) throw new Error("Supabase admin connection required"); return { admin: createAdminClient(), adminId: session.user?.id ?? null }; }
async function audit(adminId:string|null, action:string, userId:string, details:Record<string,unknown>={}) { await createAdminClient().from("admin_audit_log").insert({ user_id:adminId, action, entity_type:"user", entity_id:userId, details }); }

export async function setUserRole(formData: FormData) {
  const { admin, adminId } = await ctx(); const userId=String(formData.get("user_id")||""); const role=String(formData.get("role")||"reader");
  if (!userId || !["reader","admin"].includes(role)) return;
  const { data } = await admin.auth.admin.getUserById(userId); const current=data.user?.app_metadata ?? {};
  const { error } = await admin.auth.admin.updateUserById(userId,{ app_metadata:{...current,role} }); if(error) throw error;
  await audit(adminId,"set_role",userId,{role}); revalidatePath("/admin/users");
}

export async function setUserBan(formData: FormData) {
  const { admin, adminId } = await ctx(); const userId=String(formData.get("user_id")||""); const banned=String(formData.get("banned")||"false")==="true";
  const { error } = await admin.auth.admin.updateUserById(userId,{ ban_duration:banned?"876000h":"none" }); if(error) throw error;
  await audit(adminId,banned?"ban":"unban",userId); revalidatePath("/admin/users");
}

export async function inviteUser(formData: FormData) {
  const { admin, adminId } = await ctx(); const email=String(formData.get("email")||"").trim(); if(!email) return;
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email); if(error) throw error;
  await audit(adminId,"invite",data.user?.id??email,{email}); revalidatePath("/admin/users");
}
