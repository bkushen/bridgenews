import { createClient } from "@/lib/supabase/server";
import type { Story } from "@/lib/mock-data";
import type { EditionRegion } from "@/lib/region-context";

export type PortalStory = Story & {
  articleId: string;
  imageUrl?: string | null;
  languageCode: string;
  sourceSlug: string;
  sourceLogoUrl?: string | null;
  publishedAt: string | null;
  viewCount?: number;
};

export type SourceDirectoryItem = {
  id: string;
  name: string;
  slug: string;
  websiteUrl: string | null;
  logoUrl: string | null;
  languageCode: string;
  articleCount: number;
  lastSuccessAt: string | null;
};

const DISTRICTS = ["Ampara","Anuradhapura","Badulla","Batticaloa","Colombo","Galle","Gampaha","Hambantota","Jaffna","Kalutara","Kandy","Kegalle","Kilinochchi","Kurunegala","Mannar","Matale","Matara","Monaragala","Mullaitivu","Nuwara Eliya","Polonnaruwa","Puttalam","Ratnapura","Trincomalee","Vavuniya"] as const;
export type DistrictName = (typeof DISTRICTS)[number];
export type DistrictGroup = { name: DistrictName; slug: string; count: number; stories: PortalStory[] };
const DISTRICT_ALIASES: Record<DistrictName, string[]> = {
  Ampara:["ampara","amparai","අම්පාර","அம்பாறை"],Anuradhapura:["anuradhapura","අනුරාධපුර","அனுராதபுரம்"],Badulla:["badulla","බදුල්ල","பதுளை"],Batticaloa:["batticaloa","madakalapuwa","මඩකලපුව","மட்டக்களப்பு"],Colombo:["colombo","kolamba","කොළඹ","கொழும்பு"],Galle:["galle","ගාල්ල","காலி"],Gampaha:["gampaha","ගම්පහ","கம்பஹா"],Hambantota:["hambantota","හම්බන්තොට","அம்பாந்தோட்டை"],Jaffna:["jaffna","yapanaya","යාපනය","யாழ்ப்பாணம்"],Kalutara:["kalutara","කළුතර","களுத்துறை"],Kandy:["kandy","mahanuwara","මහනුවර","கண்டி"],Kegalle:["kegalle","kegalla","කෑගල්ල","கேகாலை"],Kilinochchi:["kilinochchi","කිලිනොච්චි","கிளிநொச்சி"],Kurunegala:["kurunegala","කුරුණෑගල","குருநாகல்"],Mannar:["mannar","මන්නාරම","மன்னார்"],Matale:["matale","මාතලේ","மாத்தளை"],Matara:["matara","මාතර","மாத்தறை"],Monaragala:["monaragala","moneragala","මොණරාගල","மொணராகலை"],Mullaitivu:["mullaitivu","mulathivu","මුලතිව්","முல்லைத்தீவு"],"Nuwara Eliya":["nuwara eliya","nuwaraeliya","nuwara-eliya","නුවරඑළිය","நுவரெலியா"],Polonnaruwa:["polonnaruwa","පොළොන්නරුව","பொலன்னறுவை"],Puttalam:["puttalam","පුත්තලම","புத்தளம்"],Ratnapura:["ratnapura","rathnapura","රත්නපුර","இரத்தினபுரி"],Trincomalee:["trincomalee","trinko","ත්‍රිකුණාමලය","திருகோணமலை"],Vavuniya:["vavuniya","වවුනියාව","வவுனியா"]
};
function slugify(value:string){return value.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");}
function relativeTime(value:string|null){if(!value)return"Recently";const diff=Math.max(0,Date.now()-new Date(value).getTime());const minutes=Math.floor(diff/60000);if(minutes<1)return"Just now";if(minutes<60)return`${minutes} min ago`;const hours=Math.floor(minutes/60);if(hours<24)return`${hours} hr${hours===1?"":"s"} ago`;const days=Math.floor(hours/24);return`${days} day${days===1?"":"s"} ago`;}

async function hydrateArticles(rows:any[], viewCounts=new Map<string,number>()):Promise<PortalStory[]>{
  if(!rows.length)return[];const supabase=await createClient();const articleIds=rows.map(r=>r.id);const sourceIds=[...new Set(rows.map(r=>r.source_id))];
  const [sourcesResult,categoryLinks]=await Promise.all([supabase.from("sources").select("id,name,slug,logo_url").in("id",sourceIds),supabase.from("article_categories").select("article_id,category_id").in("article_id",articleIds)]);
  if(sourcesResult.error)throw sourcesResult.error;if(categoryLinks.error)throw categoryLinks.error;const categoryIds=[...new Set((categoryLinks.data??[]).map(r=>r.category_id))];const categoriesResult=categoryIds.length?await supabase.from("categories").select("id,name").in("id",categoryIds):{data:[],error:null};if(categoriesResult.error)throw categoriesResult.error;
  const sources=new Map((sourcesResult.data??[]).map(s=>[s.id,s]));const categoryNames=new Map((categoriesResult.data??[]).map(c=>[c.id,c.name]));const categoryByArticle=new Map<string,string>();for(const link of categoryLinks.data??[]){const name=categoryNames.get(link.category_id);if(name&&!categoryByArticle.has(link.article_id))categoryByArticle.set(link.article_id,name);}
  return rows.map(row=>{const source=sources.get(row.source_id) as any;const publishedAt=row.published_at||row.discovered_at;return{articleId:row.id,slug:row.slug,title:row.title,summary:row.description||row.ai_summary||"Open the original publisher for full coverage.",source:source?.name||"Source",sourceSlug:source?.slug||"source",sourceLogoUrl:source?.logo_url||null,published:relativeTime(publishedAt),publishedAt,regions:[],category:categoryByArticle.get(row.id)||"News",sourceCount:1,imageUrl:row.image_url,languageCode:row.language_code||"en",viewCount:viewCounts.get(row.id)||0};});
}

export async function getPortalStories(options:{date?:string;language?:string;sourceSlug?:string;region?:EditionRegion;limit?:number}={}):Promise<PortalStory[]>{
  try{const supabase=await createClient();let sourceId:string|null=null;if(options.sourceSlug){const source=await supabase.from("sources").select("id").eq("slug",options.sourceSlug).maybeSingle();if(source.error||!source.data)return[];sourceId=source.data.id;}
    let regionalIds:string[]|null=null;if(options.region){const regionRow=await supabase.from("regions").select("id").eq("slug",options.region).maybeSingle();if(!regionRow.data)return[];const links=await supabase.from("article_regions").select("article_id").eq("region_id",regionRow.data.id).limit(5000);if(links.error)throw links.error;regionalIds=(links.data??[]).map(r=>r.article_id);if(!regionalIds.length)return[];}
    let query=supabase.from("articles").select("id,source_id,slug,title,description,ai_summary,image_url,language_code,published_at,discovered_at").eq("status","published").order("published_at",{ascending:false,nullsFirst:false}).limit(Math.min(Math.max(options.limit||60,1),200));
    if(sourceId)query=query.eq("source_id",sourceId);if(regionalIds)query=query.in("id",regionalIds);if(options.language&&["en","si","ta"].includes(options.language))query=query.eq("language_code",options.language);
    if(options.date&&/^\d{4}-\d{2}-\d{2}$/.test(options.date)){const zone=options.region==="sri-lanka"?"+05:30":options.region==="australia"?"+10:00":"+00:00";const start=new Date(`${options.date}T00:00:00${zone}`);const end=new Date(start.getTime()+86400000);query=query.gte("published_at",start.toISOString()).lt("published_at",end.toISOString());}
    const{data,error}=await query;if(error)throw error;return hydrateArticles(data??[]);
  }catch(error){console.error("getPortalStories",error);return[];}
}

export async function getSourceDirectory(limit=100):Promise<SourceDirectoryItem[]>{try{const supabase=await createClient();const{data:sources,error}=await supabase.from("sources").select("id,name,slug,website_url,logo_url,default_language_code,last_success_at").eq("enabled",true).order("name",{ascending:true}).limit(limit);if(error)throw error;if(!sources?.length)return[];const ids=sources.map(s=>s.id);const articles=await supabase.from("articles").select("source_id").eq("status","published").in("source_id",ids).limit(5000);if(articles.error)throw articles.error;const counts=new Map<string,number>();for(const row of articles.data??[])counts.set(row.source_id,(counts.get(row.source_id)||0)+1);return sources.map(source=>({id:source.id,name:source.name,slug:source.slug,websiteUrl:source.website_url,logoUrl:source.logo_url,languageCode:source.default_language_code||"en",articleCount:counts.get(source.id)||0,lastSuccessAt:source.last_success_at}));}catch(error){console.error("getSourceDirectory",error);return[];}}
export async function getMostReadStories(limit=30):Promise<PortalStory[]>{try{const supabase=await createClient();const metrics=await supabase.from("article_metrics").select("article_id,view_count").order("view_count",{ascending:false}).limit(limit);if(metrics.error||!metrics.data?.length)return[];const ids=metrics.data.map(r=>r.article_id);const articles=await supabase.from("articles").select("id,source_id,slug,title,description,ai_summary,image_url,language_code,published_at,discovered_at").in("id",ids).eq("status","published");if(articles.error)throw articles.error;const rowById=new Map((articles.data??[]).map(r=>[r.id,r]));const ordered=ids.map(id=>rowById.get(id)).filter(Boolean) as any[];const counts=new Map(metrics.data.map(r=>[r.article_id,Number(r.view_count||0)]));return hydrateArticles(ordered,counts);}catch(error){console.error("getMostReadStories",error);return[];}}
export async function getDistrictGroups():Promise<DistrictGroup[]>{const stories=await getPortalStories({region:"sri-lanka",limit:200});const groups:DistrictGroup[]=DISTRICTS.map(name=>({name,slug:slugify(name),count:0,stories:[]}));for(const story of stories){const haystack=`${story.title} ${story.summary}`.normalize("NFKC").toLocaleLowerCase();for(const group of groups){if(DISTRICT_ALIASES[group.name].some(alias=>haystack.includes(alias.toLocaleLowerCase()))){group.stories.push(story);group.count+=1;}}}return groups.sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name));}
export function getDistrictBySlug(groups:DistrictGroup[],slug:string){return groups.find(group=>group.slug===slug)||null;}
