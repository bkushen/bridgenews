const OFFICIAL = [
  { name: "Department of Meteorology", label: "Weather forecasts, severe advisories and observations", url: "https://meteo.gov.lk/index", icon: "🌦️" },
  { name: "Disaster Management Centre", label: "Disaster alerts, emergency information and general alert maps", url: "https://www.dmc.gov.lk/", icon: "⚠️" },
  { name: "Sri Lanka Police", label: "Police news, media releases and public services", url: "https://www.police.gov.lk/", icon: "👮" },
  { name: "Sri Lanka Railways", label: "Railway notices, schedules and passenger information", url: "https://www.railway.gov.lk/web/", icon: "🚆" },
  { name: "Ceylon Electricity Board", label: "Power-sector notices and electricity information", url: "https://www.ceb.lk/", icon: "⚡" },
  { name: "Central Bank of Sri Lanka", label: "Monetary policy, exchange rates and financial releases", url: "https://www.cbsl.gov.lk/", icon: "🏦" },
] as const;

export default function OfficialPage() {
  return (
    <main className="mx-auto max-w-7xl px-5 py-10">
      <div className="border-b border-gray-200 pb-6"><p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-700">Primary information</p><h1 className="mt-2 text-4xl font-black tracking-tight md:text-5xl">Official Sri Lanka Sources</h1><p className="mt-3 max-w-3xl leading-7 text-gray-600">Go directly to government and public-service sources for alerts, weather, transport, police, electricity and financial information. These links are separated from publisher reporting.</p></div>
      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{OFFICIAL.map((item) => <a key={item.url} href={item.url} target="_blank" rel="noreferrer" className="group rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><div className="text-3xl">{item.icon}</div><p className="mt-5 text-[10px] font-black uppercase tracking-[0.15em] text-blue-600">Official source</p><h2 className="mt-1 text-xl font-black group-hover:underline">{item.name}</h2><p className="mt-2 text-sm leading-6 text-gray-600">{item.label}</p><p className="mt-5 text-sm font-black">Open official website ↗</p></a>)}</div>
    </main>
  );
}
