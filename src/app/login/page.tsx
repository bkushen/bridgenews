import Link from "next/link";
import { login, signup } from "./actions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string; mode?: string; next?: string }> }) {
  const params = await searchParams;
  const signingUp = params.mode === "signup";
  const next = params.next && params.next.startsWith("/") && !params.next.startsWith("//") ? params.next : "/saved";

  return (
    <main className="mx-auto max-w-md px-4 py-12 sm:px-5 sm:py-16">
      <div className="rounded-xl border border-[var(--news-line)] bg-[var(--news-card)] p-6 sm:p-8">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--news-accent)]">BridgeNews account</p>
        <h1 className="mt-2 text-3xl font-bold text-[var(--news-ink)]">{signingUp ? "Create account" : "Sign in"}</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--news-muted)]">Use a reader account to save stories privately. Administrator access remains separately protected by role.</p>

        {params.message === "check-email" ? <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">Account created. Check your email if confirmation is required, then sign in.</div> : null}
        {params.error ? <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{params.error === "missing" ? "Enter your email and password." : params.error === "signup" ? "Use a valid email and a password with at least 8 characters." : "Sign-in failed. Check your credentials."}</div> : null}

        <form action={signingUp ? signup : login} className="mt-6 space-y-4">
          <input type="hidden" name="next" value={next} />
          <label className="block"><span className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--news-muted)]">Email</span><input name="email" type="email" required className="mt-1.5 w-full rounded-lg border border-[var(--news-line)] bg-[var(--news-card)] px-4 py-3 text-sm text-[var(--news-ink)] outline-none focus:border-[var(--news-accent)]" /></label>
          <label className="block"><span className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--news-muted)]">Password</span><input name="password" type="password" minLength={signingUp ? 8 : undefined} required className="mt-1.5 w-full rounded-lg border border-[var(--news-line)] bg-[var(--news-card)] px-4 py-3 text-sm text-[var(--news-ink)] outline-none focus:border-[var(--news-accent)]" /></label>
          <button className="w-full rounded-lg bg-[var(--news-ink)] px-5 py-3 text-sm font-black text-white transition hover:bg-[var(--news-accent-deep)]">{signingUp ? "Create account" : "Sign in"}</button>
        </form>

        <p className="mt-5 border-t border-[var(--news-line-soft)] pt-5 text-center text-sm text-[var(--news-muted)]">
          {signingUp ? "Already have an account?" : "New to BridgeNews?"}{" "}
          <Link href={signingUp ? `/login?next=${encodeURIComponent(next)}` : `/login?mode=signup&next=${encodeURIComponent(next)}`} className="font-bold text-[var(--news-accent)] underline decoration-[var(--news-line)]">{signingUp ? "Sign in" : "Create one"}</Link>
        </p>
      </div>
    </main>
  );
}
