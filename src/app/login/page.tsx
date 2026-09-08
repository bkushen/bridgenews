import Link from "next/link";
import { login, signup } from "./actions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string; mode?: string; next?: string }> }) {
  const params = await searchParams;
  const signingUp = params.mode === "signup";
  const next = params.next && params.next.startsWith("/") && !params.next.startsWith("//") ? params.next : "/saved";

  return (
    <main className="mx-auto max-w-md px-5 py-16">
      <div className="rounded-3xl border border-[var(--border)] bg-white p-8 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-gray-500">BridgeNews account</p>
        <h1 className="mt-2 text-3xl font-black">{signingUp ? "Create account" : "Sign in"}</h1>
        <p className="mt-3 text-sm leading-6 text-gray-600">Use a reader account to save stories privately. Admin access is still separately protected by role.</p>

        {params.message === "check-email" ? <div className="mt-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">Account created. Check your email if confirmation is required, then sign in.</div> : null}
        {params.error ? <div className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{params.error === "missing" ? "Enter your email and password." : params.error === "signup" ? "Use a valid email and a password with at least 8 characters." : "Sign-in failed. Check your credentials."}</div> : null}

        <form action={signingUp ? signup : login} className="mt-6 space-y-4">
          <input type="hidden" name="next" value={next} />
          <label className="block"><span className="text-sm font-bold">Email</span><input name="email" type="email" required className="mt-2 w-full rounded-xl border border-[var(--border)] px-4 py-3 outline-none focus:border-gray-500" /></label>
          <label className="block"><span className="text-sm font-bold">Password</span><input name="password" type="password" minLength={signingUp ? 8 : undefined} required className="mt-2 w-full rounded-xl border border-[var(--border)] px-4 py-3 outline-none focus:border-gray-500" /></label>
          <button className="w-full rounded-xl bg-gray-950 px-5 py-3 font-bold text-white">{signingUp ? "Create account" : "Sign in"}</button>
        </form>

        <p className="mt-5 text-center text-sm text-gray-600">
          {signingUp ? "Already have an account?" : "New to BridgeNews?"}{" "}
          <Link href={signingUp ? `/login?next=${encodeURIComponent(next)}` : `/login?mode=signup&next=${encodeURIComponent(next)}`} className="font-bold text-gray-950 underline">{signingUp ? "Sign in" : "Create one"}</Link>
        </p>
      </div>
    </main>
  );
}
