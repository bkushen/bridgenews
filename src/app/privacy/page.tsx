export const metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-12">
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Privacy</p>
      <h1 className="mt-2 text-4xl font-black tracking-tight md:text-5xl">Privacy notice</h1>
      <div className="mt-8 space-y-6 text-base leading-8 text-gray-700">
        <p>BridgeNews stores the minimum account information needed to provide sign-in and saved-story features. Authentication is handled through Supabase Auth. Saved stories are associated with the signed-in account and protected by row-level security.</p>
        <p>Public browsing does not require an account. BridgeNews may process normal technical request information needed to operate and secure the service, such as timestamps, request paths and platform logs.</p>
        <p>BridgeNews does not sell personal information. The current non-AI version does not send user data or news-reading activity to an AI model.</p>
        <p>External publisher links are operated by third parties and are subject to those publishers' own privacy policies.</p>
      </div>
      <p className="mt-10 text-sm text-gray-500">Last updated: 8 September 2026.</p>
    </main>
  );
}
