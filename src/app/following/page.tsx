import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { saveNotificationPreferences, unfollowSource, unfollowTopic } from "./actions";

export default async function FollowingPage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?next=%2Ffollowing");

  const [sourceFollows, topicFollows, preferences] = await Promise.all([
    supabase.from("source_follows").select("source_id,created_at").eq("user_id", auth.user.id).order("created_at", { ascending: false }),
    supabase.from("topic_follows").select("topic_key,topic_label,created_at").eq("user_id", auth.user.id).order("created_at", { ascending: false }),
    supabase.from("notification_preferences").select("breaking_news,daily_digest,source_updates,topic_updates,preferred_language").eq("user_id", auth.user.id).maybeSingle(),
  ]);

  const sourceIds = (sourceFollows.data ?? []).map((row) => row.source_id);
  const sourceRows = sourceIds.length
    ? await supabase.from("sources").select("id,name,slug,logo_url,website_url,default_language_code").in("id", sourceIds)
    : { data: [], error: null };
  const sourceById = new Map((sourceRows.data ?? []).map((source) => [source.id, source]));
  const prefs = preferences.data;

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <div className="border-b border-gray-200 pb-6">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Personal feed</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight md:text-5xl">Following & alerts</h1>
        <p className="mt-3 max-w-3xl leading-7 text-gray-600">Follow publishers and topics, then choose which update types you want BridgeNews to prepare for notifications and digests.</p>
      </div>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4"><h2 className="text-2xl font-black">Publishers</h2><Link href="/sources" className="text-xs font-black text-gray-500">Find sources →</Link></div>
          <div className="divide-y divide-gray-100">
            {(sourceFollows.data ?? []).map((follow) => {
              const source = sourceById.get(follow.source_id);
              if (!source) return null;
              const icon = source.logo_url || (source.website_url ? `${new URL(source.website_url).origin}/favicon.ico` : null);
              return <div key={follow.source_id} className="flex items-center gap-3 py-4">
                <div className="grid h-11 w-11 place-items-center overflow-hidden rounded-xl border bg-white">{icon ? <img src={icon} alt="" className="h-full w-full object-contain p-1" /> : source.name.slice(0,2)}</div>
                <div className="min-w-0 flex-1"><Link href={`/sources/${source.slug}`} className="font-black hover:underline">{source.name}</Link><p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">{source.default_language_code || "en"}</p></div>
                <form action={unfollowSource}><input type="hidden" name="sourceId" value={source.id} /><input type="hidden" name="returnTo" value="/following" /><button className="rounded-full border px-3 py-1.5 text-xs font-black hover:bg-gray-50">Unfollow</button></form>
              </div>;
            })}
            {!sourceFollows.data?.length ? <p className="py-6 text-sm text-gray-500">You are not following any publishers yet.</p> : null}
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4"><h2 className="text-2xl font-black">Topics</h2><Link href="/topics" className="text-xs font-black text-gray-500">Browse topics →</Link></div>
          <div className="divide-y divide-gray-100">
            {(topicFollows.data ?? []).map((topic) => <div key={topic.topic_key} className="flex items-center gap-3 py-4"><div className="grid h-11 w-11 place-items-center rounded-xl bg-gray-950 text-white">#</div><div className="min-w-0 flex-1"><Link href={`/topics/${topic.topic_key}`} className="font-black hover:underline">{topic.topic_label}</Link><p className="mt-0.5 text-xs text-gray-400">Topic follow</p></div><form action={unfollowTopic}><input type="hidden" name="topicKey" value={topic.topic_key} /><input type="hidden" name="returnTo" value="/following" /><button className="rounded-full border px-3 py-1.5 text-xs font-black hover:bg-gray-50">Unfollow</button></form></div>)}
            {!topicFollows.data?.length ? <p className="py-6 text-sm text-gray-500">You are not following any topics yet.</p> : null}
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="max-w-3xl"><p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Notification-ready preferences</p><h2 className="mt-1 text-2xl font-black">Choose what you want to hear about</h2><p className="mt-2 text-sm leading-6 text-gray-600">These preferences are stored now. Delivery channels can be connected later without changing how users follow publishers and topics.</p></div>
        <form action={saveNotificationPreferences} className="mt-6 grid gap-4 md:grid-cols-2">
          <input type="hidden" name="returnTo" value="/following" />
          {[
            ["breakingNews", "Breaking news", "High-priority BridgeNews updates", prefs?.breaking_news],
            ["dailyDigest", "Daily digest", "One daily summary of followed coverage", prefs?.daily_digest],
            ["sourceUpdates", "Publisher updates", "New stories from followed publishers", prefs?.source_updates],
            ["topicUpdates", "Topic updates", "New coverage for followed topics", prefs?.topic_updates],
          ].map(([name, label, description, checked]) => <label key={String(name)} className="flex cursor-pointer items-start gap-3 rounded-2xl border border-gray-200 p-4"><input type="checkbox" name={String(name)} defaultChecked={Boolean(checked)} className="mt-1 h-4 w-4" /><span><span className="block font-black">{String(label)}</span><span className="mt-1 block text-xs leading-5 text-gray-500">{String(description)}</span></span></label>)}
          <label className="md:col-span-2"><span className="text-xs font-black uppercase tracking-wider text-gray-500">Preferred language</span><select name="preferredLanguage" defaultValue={prefs?.preferred_language || "all"} className="mt-2 w-full max-w-sm rounded-xl border border-gray-300 bg-white px-4 py-3 font-semibold"><option value="all">All languages</option><option value="en">English</option><option value="si">සිංහල</option><option value="ta">தமிழ்</option></select></label>
          <div className="md:col-span-2"><button className="rounded-full bg-gray-950 px-5 py-3 text-sm font-black text-white">Save preferences</button></div>
        </form>
      </section>
    </main>
  );
}
