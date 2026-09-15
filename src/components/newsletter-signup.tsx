"use client";

import { FormEvent, useState } from "react";

export function NewsletterSignup({ source = "footer", compact = false }: { source?: string; compact?: boolean }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setState("loading");
    setMessage("");
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, source }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "Could not subscribe");
      setState("done");
      setMessage("You’re subscribed to the BridgeNews Daily Brief.");
      setEmail("");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Could not subscribe");
    }
  }

  return <div className={compact ? "" : "rounded-2xl border border-white/10 bg-white/5 p-5"}>
    {!compact ? <><p className="text-xs font-black uppercase tracking-[0.16em] text-[#c9bdb0]">Daily Brief</p><p className="mt-2 text-sm leading-6 text-[#ddd4c9]">Get the biggest Sri Lanka, Australia and world stories in one daily email.</p></> : null}
    <form onSubmit={submit} className={`flex gap-2 ${compact ? "" : "mt-4"}`}>
      <label className="sr-only" htmlFor={`newsletter-${source}`}>Email address</label>
      <input id={`newsletter-${source}`} type="email" required autoComplete="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="you@example.com" className="min-w-0 flex-1 rounded-xl border border-white/15 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none ring-[#a5232f] placeholder:text-slate-400 focus:ring-2" />
      <button disabled={state === "loading"} className="rounded-xl bg-[#a5232f] px-4 py-2.5 text-sm font-black text-white transition hover:bg-[#8d1d28] disabled:opacity-60">{state === "loading" ? "Joining…" : "Subscribe"}</button>
    </form>
    {message ? <p className={`mt-2 text-xs font-semibold ${state === "error" ? "text-rose-300" : "text-emerald-300"}`}>{message}</p> : null}
  </div>;
}
