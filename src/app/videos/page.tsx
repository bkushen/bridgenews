import { getLiveNewsVideos, getVerifiedVideoChannels } from "@/lib/data/videos";

function relative(value: string | null) {
  if (!value) return "Recent";
  const diff = Math.max(0, Date.now() - new Date(value).getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${Math.max(mins, 1)} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export default async function VideosPage() {
  const [videos, channels] = await Promise.all([getLiveNewsVideos(18), Promise.resolve(getVerifiedVideoChannels())]);

  return (
    <main className="mx-auto max-w-7xl px-5 py-10">
      <div className="border-b border-gray-200 pb-6"><p className="text-[11px] font-black uppercase tracking-[0.18em] text-red-600">Official publishers</p><h1 className="mt-2 text-4xl font-black tracking-tight md:text-5xl">Live News Videos</h1><p className="mt-3 max-w-3xl leading-7 text-gray-600">Latest items from verified official publisher YouTube feeds. BridgeNews shows the public thumbnail and title, then sends playback to YouTube.</p></div>

      {videos.length ? (
        <section className="mt-8">
          <div className="mb-4 flex items-end justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">Latest uploads</p><h2 className="mt-1 text-2xl font-black">Now on video</h2></div><span className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-black text-red-700">LIVE FEEDS</span></div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {videos.map((video) => <a key={video.id} href={video.url} target="_blank" rel="noreferrer" className="group overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="relative aspect-video overflow-hidden bg-gray-900">{video.thumbnail ? <img src={video.thumbnail} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : null}<div className="absolute inset-0 bg-black/10" /><span className="absolute left-4 bottom-4 grid h-11 w-11 place-items-center rounded-full bg-white text-red-600 shadow-lg">▶</span></div>
              <div className="p-5"><div className="flex items-center justify-between gap-3 text-[10px] font-black uppercase tracking-[0.14em] text-gray-400"><span>{video.channel}</span><span>{relative(video.publishedAt)}</span></div><h3 className="mt-2 line-clamp-2 text-xl font-black leading-snug group-hover:underline">{video.title}</h3><p className="mt-3 text-xs text-gray-500">{video.language}</p><p className="mt-5 text-sm font-black">Watch on YouTube ↗</p></div>
            </a>)}
          </div>
        </section>
      ) : <div className="mt-8 rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-gray-600">The live YouTube feeds did not respond on this refresh. The verified channel directory below remains available.</div>}

      <section className="mt-10">
        <div className="mb-4"><p className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">Directory</p><h2 className="mt-1 text-2xl font-black">Verified channels</h2></div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{channels.map((channel) => <a key={channel.channelUrl} href={channel.channelUrl} target="_blank" rel="noreferrer" className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-600">Verified official channel</p><h3 className="mt-2 text-lg font-black">{channel.name}</h3><p className="mt-1 text-sm text-gray-500">{channel.language}</p><p className="mt-4 text-sm font-black">Open channel ↗</p></a>)}</div>
      </section>
    </main>
  );
}
