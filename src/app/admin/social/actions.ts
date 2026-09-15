"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/app/admin/actions";
import { createAdminClient } from "@/lib/supabase/admin";

const STATES=new Set(["queued","approved","scheduled","published","skipped","failed"]);
const PLATFORMS=["facebook","instagram","x","threads","linkedin"] as const;

export async function updateSocialQueue(formData:FormData){
  const session=await requireAdmin();
  if(session.preview)throw new Error("Supabase admin connection required");
  const id=String(formData.get("id")||"");
  const status=String(formData.get("status")||"");
  if(!id||!STATES.has(status))throw new Error("Invalid social queue update");
  const admin=createAdminClient();
  const patch:any={status,updated_at:new Date().toISOString()};
  if(status==="published")patch.published_at=new Date().toISOString();
  if(status==="queued"){patch.error_message=null;patch.scheduled_for=null;patch.provider_response={};}
  const {error}=await admin.from("social_post_queue").update(patch).eq("id",id);
  await admin.from("admin_audit_log").insert({user_id:session.user?.id??null,action:"social_queue_status",entity_type:"social_post",entity_id:id,details:{status,error:error?.message??null}});
  if(error)throw error;
  revalidatePath("/admin/social");
}

export async function updateAutoSocialConfig(formData:FormData){
  const session=await requireAdmin();
  if(session.preview)throw new Error("Supabase admin connection required");
  const enabled=formData.get("enabled")==="on";
  const attachArticleImage=formData.get("attachArticleImage")==="on";
  const platforms=PLATFORMS.filter(platform=>formData.get(platform)==="on");
  const timezone=String(formData.get("timezone")||"Australia/Melbourne").slice(0,80);
  const maxAttempts=Math.max(1,Math.min(Number(formData.get("maxAttempts")||5),20));
  if(enabled&&!platforms.length)throw new Error("Select at least one social platform");
  const admin=createAdminClient();
  const {error}=await admin.from("social_publish_config").upsert({id:1,enabled,platforms,attach_article_image:attachArticleImage,timezone,max_attempts:maxAttempts,updated_at:new Date().toISOString()},{onConflict:"id"});
  await admin.from("admin_audit_log").insert({user_id:session.user?.id??null,action:"social_auto_config",entity_type:"social_publish_config",entity_id:"1",details:{enabled,platforms,attachArticleImage,timezone,maxAttempts,error:error?.message??null}});
  if(error)throw error;
  revalidatePath("/admin/social");
}

export async function runAutoSocialNow(){
  const session=await requireAdmin();
  if(session.preview)throw new Error("Supabase admin connection required");
  const admin=createAdminClient();
  const {data,error}=await admin.functions.invoke("social-publish",{body:{limit:20}});
  await admin.from("admin_audit_log").insert({user_id:session.user?.id??null,action:error?"social_publish_failed":"social_publish_run",entity_type:"edge_function",entity_id:"social-publish",details:error?{message:error.message}:{result:data??null}});
  if(error)throw error;
  revalidatePath("/admin/social");
}

export async function queueRecentPublishedStories(){
  const session=await requireAdmin();
  if(session.preview)throw new Error("Supabase admin connection required");
  const admin=createAdminClient();
  const [{data:config},{data,error}]=await Promise.all([
    admin.from("social_publish_config").select("platforms").eq("id",1).maybeSingle(),
    admin.from("articles").select("id,title").eq("status","published").not("image_url","is",null).order("published_at",{ascending:false}).limit(25),
  ]);
  if(error)throw error;
  const platforms=(config?.platforms?.length?config.platforms:PLATFORMS) as string[];
  const rows=(data??[]).flatMap((article:any)=>platforms.map(platform=>({article_id:article.id,platform,post_text:article.title,status:"queued"})));
  if(rows.length){const insert=await admin.from("social_post_queue").upsert(rows,{onConflict:"article_id,platform",ignoreDuplicates:true});if(insert.error)throw insert.error;}
  await admin.from("admin_audit_log").insert({user_id:session.user?.id??null,action:"queue_recent_social",entity_type:"social_post",details:{articles:(data??[]).length,posts:rows.length}});
  revalidatePath("/admin/social");
}

export async function bulkScheduleSocial(formData:FormData){
  const session=await requireAdmin();
  if(session.preview)throw new Error("Supabase admin connection required");
  const count=Math.max(1,Math.min(Number(formData.get("count")||50),500));
  const lookbackHours=Math.max(1,Math.min(Number(formData.get("lookbackHours")||168),24*90));
  const startDelay=Math.max(0,Math.min(Number(formData.get("startDelay")||0),24*60));
  const interval=Math.max(1,Math.min(Number(formData.get("interval")||10),24*60));
  const selected=PLATFORMS.filter(platform=>formData.get(`bulk_${platform}`)==="on");
  if(!selected.length)throw new Error("Select at least one bulk-post platform");
  const since=new Date(Date.now()-lookbackHours*60*60*1000).toISOString();
  const admin=createAdminClient();
  const {data,error}=await admin.from("articles").select("id,title,published_at").eq("status","published").not("image_url","is",null).gte("published_at",since).order("published_at",{ascending:false}).limit(count);
  if(error)throw error;
  const now=Date.now();
  const rows=(data??[]).flatMap((article:any,index:number)=>selected.map(platform=>({article_id:article.id,platform,post_text:article.title,status:"queued",scheduled_for:new Date(now+(startDelay+index*interval)*60*1000).toISOString(),error_message:null})));
  if(rows.length){
    const upsert=await admin.from("social_post_queue").upsert(rows,{onConflict:"article_id,platform",ignoreDuplicates:false});
    if(upsert.error)throw upsert.error;
  }
  await admin.from("admin_audit_log").insert({user_id:session.user?.id??null,action:"bulk_schedule_social",entity_type:"social_post",details:{articles:(data??[]).length,posts:rows.length,platforms:selected,lookbackHours,startDelay,interval}});
  revalidatePath("/admin/social");
}
