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
 const {data:profile}=await admin.from("stream_profiles").select("id,min_amount_grosz").eq("user_id",userData.user.id).maybeSingle();
 if(!profile)return Response.json({error:"Creator profile not found"},{status:404,headers:corsHeaders});
 const body=await req.json().catch(()=>({}));
 const amount=Math.max(Number(profile.min_amount_grosz||5000),Math.min(Number(body.amount_grosz||10000),100000000));
 const message=String(body.message||"Testowa wpłata DS Stream Support 💜").slice(0,255);
 const name=String(body.name||"Testowy widz").slice(0,80);
 const {data,error}=await admin.from("stream_donations").insert({creator_profile_id:profile.id,payer_name:name,amount_grosz:amount,currency:"PLN",message,payment_provider:"test",provider_reference:`test_${crypto.randomUUID()}`,status:"paid",moderation_status:"approved",paid_at:new Date().toISOString()}).select("id").single();
 if(error)return Response.json({error:error.message},{status:500,headers:corsHeaders});
 return Response.json({ok:true,donation_id:data.id,amount_grosz:amount},{headers:corsHeaders});
});
