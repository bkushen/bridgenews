const CHANNELS = [
  { name: "Ada Derana", language: "Sinhala / English / Tamil", url: "https://www.youtube.com/@AdaDerana", verified: true },
  { name: "Ada Derana News Channel English", language: "English", url: "https://www.youtube.com/@ADNCEnglish", verified: true },
  { name: "Newsfirst Sri Lanka", language: "Sinhala / English / Tamil", url: "https://www.youtube.com/@newsfirstsrilanka", verified: true },
] as const;

export default function VideosPage() {
  return (
    <main className="mx-auto max-w-7xl px-5 py-10">
      <div className="border-b border-gray-200 pb-6"><p className="text-[11px] font-black uppercase tracking-[0.18em] text-red-600">Official publishers</p><h1 className="mt-2 text-4xl font-black tracking-tight md:text-5xl">News Videos</h1><p className="mt-3 max-w-3xl leading-7 text-gray-600">Quick access to verified official Sri Lankan news video channels. BridgeNews links to the publisher’s own YouTube presence rather than rehosting video.</p></div>
      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {CHANNELS.map((channel) => <a key={channel.url} href={channel.url} target="_blank" rel="noreferrer" className="group overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><div className="grid aspect-video place-items-center bg-gradient-to-br from-red-600 to-red-800 text-white"><span className="grid h-16 w-16 place-items-center rounded-full bg-white text-2xl text-red-600 shadow-xl">▶</span></div><div className="p-5"><div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-gray-400"><span>Official channel</span>{channel.verified ? <span className="rounded-full bg-blue-50 px-2 py-1 text-blue-700">Verified</span> : null}</div><h2 className="mt-2 text-xl font-black group-hover:underline">{channel.name}</h2><p className="mt-2 text-sm text-gray-500">{channel.language}</p><p className="mt-5 text-sm font-black">Open YouTube ↗</p></div></a>)}
      </div>
      <div className="mt-8 rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-sm leading-6 text-gray-600">The video hub only lists channels whose official identity has been verified. More connected publishers can be added here as their official channel URLs are confirmed.</div>
    </main>
  );
}
