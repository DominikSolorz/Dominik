import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type"};
Deno.serve(async(req:Request)=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:corsHeaders});
 if(req.method!=="POST")return Response.json({error:"Method not allowed"},{status:405,headers:corsHeaders});
 const admin=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,{auth:{persistSession:false}});
 const token=(req.headers.get("Authorization")||"").replace(/^Bearer\s+/i,"");
 const {data:userData,error:userError}=await admin.auth.getUser(token);
 if(userError||!userData.user)return Response.json({error:"Unauthorized"},{status:401,headers:corsHeaders});
 const {data:profile}=await admin.from("stream_profiles").select("id").eq("user_id",userData.user.id).maybeSingle();
 if(!profile)return Response.json({error:"Creator profile not found"},{status:404,headers:corsHeaders});
 const body=await req.json().catch(()=>({}));
 const action=String(body.action||"list");
 if(action==="list"){
   const {data:rows,error}=await admin.from("stream_moderators").select("moderator_user_id,can_moderate_messages,can_moderate_voice,created_at").eq("profile_id",profile.id).order("created_at");
   if(error)return Response.json({error:error.message},{status:500,headers:corsHeaders});
   const result=[];
   for(const row of rows||[]){const {data:u}=await admin.auth.admin.getUserById(row.moderator_user_id);result.push({...row,email:u?.user?.email||null});}
   return Response.json({moderators:result},{headers:corsHeaders});
 }
 if(action==="add"){
   const email=String(body.email||"").trim().toLowerCase();
   if(!email)return Response.json({error:"Email required"},{status:400,headers:corsHeaders});
   let found:any=null;
   for(let page=1;page<=10&&!found;page++){const {data:list,error}=await admin.auth.admin.listUsers({page,perPage:100});if(error)break;found=(list.users||[]).find((u:any)=>String(u.email||"").toLowerCase()===email);if((list.users||[]).length<100)break;}
   if(!found)return Response.json({error:"Użytkownik z tym e-mailem musi najpierw założyć konto DS Stream Support."},{status:404,headers:corsHeaders});
   if(found.id===userData.user.id)return Response.json({error:"Właściciel profilu nie musi być dodawany jako moderator."},{status:400,headers:corsHeaders});
   const {error}=await admin.from("stream_moderators").upsert({profile_id:profile.id,moderator_user_id:found.id,can_moderate_messages:body.can_moderate_messages!==false,can_moderate_voice:body.can_moderate_voice!==false},{onConflict:"profile_id,moderator_user_id"});
   if(error)return Response.json({error:error.message},{status:500,headers:corsHeaders});
   return Response.json({ok:true,email},{headers:corsHeaders});
 }
 if(action==="remove"){
   const moderatorId=String(body.moderator_user_id||"");
   const {error}=await admin.from("stream_moderators").delete().eq("profile_id",profile.id).eq("moderator_user_id",moderatorId);
   if(error)return Response.json({error:error.message},{status:500,headers:corsHeaders});
   return Response.json({ok:true},{headers:corsHeaders});
 }
 return Response.json({error:"Unsupported action"},{status:400,headers:corsHeaders});
});
