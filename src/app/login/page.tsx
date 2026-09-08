import { login } from "./actions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  return (
    <main className="mx-auto max-w-md px-5 py-16">
      <div className="rounded-3xl border border-[var(--border)] bg-white p-8 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-gray-500">BridgeNews</p>
        <h1 className="mt-2 text-3xl font-black">Admin sign in</h1>
        <p className="mt-3 text-sm leading-6 text-gray-600">Use a Supabase Auth account whose app metadata contains <code className="rounded bg-gray-100 px-1">role: admin</code>.</p>
        {params.error && <div className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{params.error === "missing" ? "Enter your email and password." : "Sign-in failed. Check your credentials."}</div>}
        <form action={login} className="mt-6 space-y-4">
          <label className="block"><span className="text-sm font-bold">Email</span><input name="email" type="email" required className="mt-2 w-full rounded-xl border border-[var(--border)] px-4 py-3 outline-none focus:border-gray-500" /></label>
          <label className="block"><span className="text-sm font-bold">Password</span><input name="password" type="password" required className="mt-2 w-full rounded-xl border border-[var(--border)] px-4 py-3 outline-none focus:border-gray-500" /></label>
          <button className="w-full rounded-xl bg-gray-950 px-5 py-3 font-bold text-white">Sign in</button>
        </form>
      </div>
    </main>
  );
}
