import { createAdminClient } from "@/lib/supabase/admin";
import { inviteUser, setUserBan, setUserRole } from "./actions";

export default async function AdminUsers() {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (error) throw error;
  const users = data.users;
  const admins = users.filter((user: any) => user.app_metadata?.role === "admin").length;
  const banned = users.filter((user: any) => Boolean(user.banned_until && new Date(user.banned_until) > new Date())).length;

  return <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8 xl:px-10">
    <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
      <div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Access control</p><h1 className="mt-1 text-3xl font-black tracking-tight">Users</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Invite users, manage administrator access and suspend accounts when required.</p></div>
      <div className="flex flex-wrap gap-2 text-xs font-black"><span className="rounded-full bg-slate-100 px-3 py-2 text-slate-600">{users.length} users</span><span className="rounded-full bg-slate-100 px-3 py-2 text-slate-600">{admins} admins</span>{banned ? <span className="rounded-full bg-rose-50 px-3 py-2 text-rose-700">{banned} suspended</span> : null}</div>
    </div>

    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><h2 className="font-black text-slate-950">Invite a user</h2><p className="mt-1 text-xs leading-5 text-slate-500">An invitation will be sent to the email address below.</p></div><form action={inviteUser} className="flex w-full flex-col gap-2 sm:flex-row lg:max-w-xl"><input name="email" type="email" required placeholder="email@example.com" className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-black"/><button className="rounded-xl bg-black px-4 py-2.5 text-sm font-black text-white hover:bg-slate-800">Send invite</button></form></div>
    </section>

    <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h2 className="font-black text-slate-950">User directory</h2><p className="mt-0.5 text-xs text-slate-500">Roles and account status</p></div><span className="text-xs font-bold text-slate-400">Latest {users.length}</span></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[980px] text-sm"><thead><tr className="border-b border-slate-100 bg-slate-50 text-left text-[10px] font-black uppercase tracking-[0.08em] text-slate-400"><th className="p-3">User</th><th>Role</th><th>Created</th><th>Last sign-in</th><th>Status</th><th className="pr-3">Access</th></tr></thead><tbody>{users.map((u:any)=>{const role=u.app_metadata?.role||"reader"; const isBanned=Boolean(u.banned_until&&new Date(u.banned_until)>new Date());return <tr key={u.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70"><td className="p-3"><div className="font-black text-slate-900">{u.email||u.phone||"User"}</div><div className="mt-0.5 max-w-[260px] truncate font-mono text-[10px] text-slate-400">{u.id}</div></td><td><form action={setUserRole} className="flex items-center gap-2"><input type="hidden" name="user_id" value={u.id}/><select name="role" defaultValue={role} className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-bold"><option value="reader">Reader</option><option value="admin">Admin</option></select><button className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black hover:bg-slate-50">Save</button></form></td><td className="text-xs text-slate-600">{new Date(u.created_at).toLocaleDateString("en-AU")}</td><td className="text-xs text-slate-600">{u.last_sign_in_at?new Date(u.last_sign_in_at).toLocaleString("en-AU"):"Never"}</td><td>{isBanned?<span className="rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-black text-rose-700">Suspended</span>:<span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-700">Active</span>}</td><td className="pr-3"><form action={setUserBan}><input type="hidden" name="user_id" value={u.id}/><input type="hidden" name="banned" value={String(!isBanned)}/><button className={`rounded-lg px-3 py-2 text-xs font-black ${isBanned?"border border-slate-200 bg-white text-slate-700 hover:bg-slate-50":"border border-rose-200 bg-white text-rose-600 hover:bg-rose-50"}`}>{isBanned?"Restore":"Suspend"}</button></form></td></tr>})}</tbody></table></div>
    </section>
  </main>;
}
