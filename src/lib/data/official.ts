import { createClient } from "@/lib/supabase/server";

export type OfficialLiveItem = { key:string; name:string; label:string; url:string; icon:string; latest:string[]; status:"live"|"unavailable" };
type ManagedOfficialSource = { id:string; slug:string; name:string; url:string; category:string; description:string|null; icon:string|null };

const KEYWORDS: Record<string,string[]> = {
  meteorology:["weather forecast","advisory","warning","lightning","wind","rain"], dmc:["warning","advisory","forecast","situation report","water level","weather"], police:["press release","media","notice"], railways:["train","service","rail","notice","timetable","resumed","limited"], ceb:["power interruption","interruption","outage","schedule"], cbsl:["press release","monetary policy","notice","open market","inflation","financial"]
};

function decode(value:string){return value.replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&nbsp;/g," ").replace(/&ndash;|&#8211;/g,"–").replace(/&mdash;|&#8212;/g,"—").replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n)));}
function clean(value:string){return decode(value.replace(/<script[\s\S]*?<\/script>/gi," ").replace(/<style[\s\S]*?<\/style>/gi," ").replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim());}
function candidates(html:string){const output:string[]=[];for(const pattern of [/<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/gi,/<a[^>]+href=["'][^"']+["'][^>]*>([\s\S]*?)<\/a>/gi,/<td[^>]*>([\s\S]*?)<\/td>/gi]){for(const match of html.matchAll(pattern)){const t=clean(match[1]||"");if(t.length>=10&&t.length<=180&&!output.includes(t))output.push(t);}}return output;}
function chooseLatest(html:string,keywords:string[]){const phrases=candidates(html);const preferred=phrases.filter((text)=>{const lower=text.toLowerCase();return keywords.some((k)=>lower.includes(k));});return (preferred.length?preferred:phrases).slice(0,5);}

async function fetchSource(source:ManagedOfficialSource):Promise<OfficialLiveItem>{
  const label=source.description||`${source.category} information from ${source.name}`; const icon=source.icon||"🏛️";
  try{const response=await fetch(source.url,{headers:{"user-agent":"BridgeNews/1.0 (+public-official-source-monitor)"},next:{revalidate:600},signal:AbortSignal.timeout(10000)});if(!response.ok)throw new Error(`HTTP ${response.status}`);const html=await response.text();const latest=chooseLatest(html,KEYWORDS[source.slug]||[source.category.toLowerCase(),"notice","update","release"]);return{key:source.slug,name:source.name,label,url:source.url,icon,latest,status:latest.length?"live":"unavailable"};}catch(error){console.error("Official source fetch failed",source.name,error);return{key:source.slug,name:source.name,label,url:source.url,icon,latest:[],status:"unavailable"};}
}

export async function getOfficialLiveItems(){
  const supabase=await createClient(); const { data,error }=await supabase.from("official_sources").select("id,slug,name,url,category,description,icon").eq("enabled",true).order("sort_order");
  if(error||!data?.length){console.error("Managed official sources unavailable",error);return [];}
  return Promise.all((data as ManagedOfficialSource[]).map(fetchSource));
}
