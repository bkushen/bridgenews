export const metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-12">
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Contact</p>
      <h1 className="mt-2 text-4xl font-black tracking-tight md:text-5xl">Contact BridgeNews</h1>
      <div className="mt-8 rounded-3xl border border-[var(--border)] bg-white p-7 shadow-sm">
        <p className="text-base leading-7 text-gray-700">For corrections, publisher attribution issues, feed removal requests, privacy questions or general feedback, contact the BridgeNews operator through the project repository until a dedicated support email is configured.</p>
        <a href="https://github.com/bkushen/bridgenews/issues" target="_blank" rel="noreferrer" className="mt-6 inline-flex rounded-full bg-gray-950 px-5 py-3 text-sm font-bold text-white">Open a GitHub issue</a>
      </div>
    </main>
  );
}
