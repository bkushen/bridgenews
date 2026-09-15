"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/app/admin/actions";
import { createAdminClient } from "@/lib/supabase/admin";

const STATES=new Set(["queued","approved","published","skipped","failed"]);

export async function updateSocialQueue(formData:FormData){
  const session=await requireAdmin();
  if(session.preview)throw new Error("Supabase admin connection required");
  const id=String(formData.get("id")||"");
  const status=String(formData.get("status")||"");
  if(!id||!STATES.has(status))throw new Error("Invalid social queue update");
  const admin=createAdminClient();
  const patch:any={status,updated_at:new Date().toISOString()};
  if(status==="published")patch.published_at=new Date().toISOString();
  const {error}=await admin.from("social_post_queue").update(patch).eq("id",id);
  await admin.from("admin_audit_log").insert({user_id:session.user?.id??null,action:"social_queue_status",entity_type:"social_post",entity_id:id,details:{status,error:error?.message??null}});
  if(error)throw error;
  revalidatePath("/admin/social");
}

export async function queueHighlightedStories(){
  const session=await requireAdmin();
  if(session.preview)throw new Error("Supabase admin connection required");
  const admin=createAdminClient();
  const {data,error}=await admin.from("articles").select("id,title").eq("status","published").not("image_url","is",null).or("is_breaking.eq.true,is_featured.eq.true,is_main_headline.eq.true").order("published_at",{ascending:false}).limit(50);
  if(error)throw error;
  const rows=(data??[]).flatMap((article:any)=>["facebook","x","threads","telegram"].map(platform=>({article_id:article.id,platform,post_text:article.title})));
  if(rows.length){const insert=await admin.from("social_post_queue").upsert(rows,{onConflict:"article_id,platform",ignoreDuplicates:true});if(insert.error)throw insert.error;}
  await admin.from("admin_audit_log").insert({user_id:session.user?.id??null,action:"queue_highlighted_social",entity_type:"social_post",details:{articles:(data??[]).length,posts:rows.length}});
  revalidatePath("/admin/social");
}
