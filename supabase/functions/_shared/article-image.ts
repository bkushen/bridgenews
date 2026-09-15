export const ARTICLE_HEADERS = {
  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
  accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
  "accept-language": "en-US,en;q=0.9",
};

function decodeHtml(value: string) {
  return value.replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,"<").replace(/&gt;/g,">");
}
function metaAll(html:string,key:string){
  const escaped=key.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),out:string[]=[];
  for(const re of [new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["']`,"gi"),new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["']`,"gi")]) for(const match of html.matchAll(re)) if(match[1])out.push(decodeHtml(match[1].trim()));
  return out;
}
function jsonLdImages(html:string):string[]{
  const out:string[]=[];
  for(const script of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){
    try{
      const parsed=JSON.parse(script[1]),roots=Array.isArray(parsed)?parsed:[parsed],nodes=roots.flatMap((root:any)=>Array.isArray(root?.["@graph"])?[root,...root["@graph"]]:[root]);
      for(const node of nodes) for(const candidate of [node?.image,node?.thumbnailUrl,node?.primaryImageOfPage?.contentUrl]){
        if(typeof candidate==="string")out.push(candidate);
        else if(Array.isArray(candidate)) for(const value of candidate){if(typeof value==="string")out.push(value);else if(value&&typeof value.url==="string")out.push(value.url);}
        else if(candidate&&typeof candidate==="object"&&typeof candidate.url==="string")out.push(candidate.url);
      }
    }catch{}
  }
  return out;
}
function srcsetCandidates(html:string){const out:string[]=[];for(const match of html.matchAll(/<img[^>]+srcset=["']([^"']+)["']/gi)){const values=match[1].split(",").map(part=>part.trim().split(/\s+/)[0]).filter(Boolean);out.push(...values.reverse());}return out;}
function normalizeImageUrl(raw:string|undefined|null,pageUrl:string):string|null{
  if(!raw)return null;
  try{
    const url=new URL(decodeHtml(raw).replace(/\\\//g,"/"),pageUrl),path=`${url.hostname}${url.pathname}${url.search}`;
    if(!/^https?:$/.test(url.protocol))return null;
    if(/\.(svg|gif)(?:$|\?)/i.test(path))return null;
    if(/(?:logo|favicon|site[-_]?icon|avatar|sprite|placeholder|tracking|pixel|branding|masthead|default[-_]?image|ebadge|bestweb|award[-_]?badge|\/badge|image_8df7de9e07)/i.test(path))return null;
    if(/atrk\.gif/i.test(path))return null;
    return url.toString();
  }catch{return null;}
}
export function extractPublisherImages(html:string,pageUrl:string):string[]{
  const raws:string[]=[
    ...metaAll(html,"og:image"),...metaAll(html,"og:image:secure_url"),...metaAll(html,"twitter:image"),...metaAll(html,"twitter:image:src"),...jsonLdImages(html),
    ...[...html.matchAll(/["']image["']\s*:\s*["'](https?:\\?\/\\?\/[^"']+)["']/gi)].map(m=>m[1]),
    ...[...html.matchAll(/<img[^>]+(?:data-src|data-lazy-src|data-original)=["']([^"']+)["']/gi)].map(m=>m[1]),
    ...srcsetCandidates(html),
    ...[...html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)].map(m=>m[1]),
  ];
  const out:string[]=[];const seen=new Set<string>();
  for(const raw of raws){const normalized=normalizeImageUrl(raw,pageUrl);if(normalized&&!seen.has(normalized)){seen.add(normalized);out.push(normalized);}}
  return out.slice(0,40);
}
export function extractPublisherImage(html:string,pageUrl:string):string|null{return extractPublisherImages(html,pageUrl)[0]??null;}
export async function verifyPublisherImage(url:string):Promise<boolean>{
  const check=(response:Response)=>{if(!response.ok&&response.status!==206)return false;const type=(response.headers.get("content-type")||"").toLowerCase();return type.startsWith("image/")&&!type.includes("svg")&&!type.includes("gif");};
  try{const head=await fetch(url,{method:"HEAD",headers:ARTICLE_HEADERS,redirect:"follow",signal:AbortSignal.timeout(7_000)});if(check(head))return true;}catch{}
  try{const response=await fetch(url,{method:"GET",headers:{...ARTICLE_HEADERS,range:"bytes=0-2047"},redirect:"follow",signal:AbortSignal.timeout(8_000)});return check(response);}catch{return false;}
}
export async function resolvePublisherImage(articleUrl:string,candidate?:string|null,excludeUrls:string[]=[]):Promise<string|null>{
  const excluded=new Set(excludeUrls.map(url=>{try{return new URL(url).toString();}catch{return url;}}));
  const normalizedCandidate=normalizeImageUrl(candidate,articleUrl);
  if(normalizedCandidate&&!excluded.has(normalizedCandidate)&&await verifyPublisherImage(normalizedCandidate))return normalizedCandidate;
  try{
    const response=await fetch(articleUrl,{headers:ARTICLE_HEADERS,redirect:"follow",signal:AbortSignal.timeout(12_000)});if(!response.ok)return null;
    for(const image of extractPublisherImages(await response.text(),articleUrl)){if(excluded.has(image))continue;if(await verifyPublisherImage(image))return image;}
    return null;
  }catch{return null;}
}
