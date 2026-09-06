"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Integration={id:string;provider:string;enabled:boolean};
type Profile={id:string;twitch_url:string|null;youtube_url:string|null;tiktok_url:string|null;discord_url:string|null};

const labels:Record<string,string>={twitch:"Twitch",youtube:"YouTube",tiktok:"TikTok",discord:"Discord",obs:"OBS",webhook:"Webhook"};

export default function IntegrationsPage(){
 const [profile,setProfile]=useState<Profile|null>(null);
 const [items,setItems]=useState<Integration[]>([]);
 const [status,setStatus]=useState("");
 const [loading,setLoading]=useState(true);

 async function load(){
  const {data:{session}}=await supabase.auth.getSession();
  if(!session){location.href="/auth?mode=login";return;}
  const {data:p}=await supabase.from("stream_profiles").select("id,twitch_url,youtube_url,tiktok_url,discord_url").eq("user_id",session.user.id).maybeSingle();
  if(!p){setLoading(false);return;}
  setProfile(p);
  const {data:i}=await supabase.from("stream_integrations").select("id,provider,enabled").eq("profile_id",p.id).order("provider");
  setItems(i||[]);setLoading(false);
 }
 useEffect(()=>{load();},[]);

 async function toggle(item:Integration){
  const {error}=await supabase.from("stream_integrations").update({enabled:!item.enabled}).eq("id",item.id);
  if(error)setStatus(error.message);else setItems(v=>v.map(x=>x.id===item.id?{...x,enabled:!x.enabled}:x));
 }

 async function saveUrls(){
  if(!profile)return;
  const {error}=await supabase.from("stream_profiles").update({twitch_url:profile.twitch_url||null,youtube_url:profile.youtube_url||null,tiktok_url:profile.tiktok_url||null,discord_url:profile.discord_url||null}).eq("id",profile.id);
  setStatus(error?error.message:"Linki integracji zapisane.");
 }

 if(loading)return <main className="subpage"><p>Ładowanie…</p></main>;
 return <main className="subpage"><div className="subpageTop"><div><span>DS Stream Support</span><h1>Integracje</h1></div><Link className="button ghost small" href="/dashboard">← Dashboard</Link></div><section className="settingsCard"><h2>Platformy transmisji</h2><p>Włączenie przełącznika aktywuje integrację w DS. Sekrety OAuth i klucze API nie są przechowywane w przeglądarce ani w publicznej konfiguracji.</p><div className="integrationList">{items.map(item=><button key={item.id} className={item.enabled?"integrationRow on":"integrationRow"} onClick={()=>toggle(item)}><span>{labels[item.provider]||item.provider}</span><strong>{item.enabled?"WŁ.":"WYŁ."}</strong></button>)}</div></section>{profile?<section className="settingsCard"><h2>Twoje linki</h2><div className="urlGrid"><label>Twitch<input value={profile.twitch_url||""} onChange={e=>setProfile({...profile,twitch_url:e.target.value})} placeholder="https://twitch.tv/..."/></label><label>YouTube<input value={profile.youtube_url||""} onChange={e=>setProfile({...profile,youtube_url:e.target.value})} placeholder="https://youtube.com/@..."/></label><label>TikTok<input value={profile.tiktok_url||""} onChange={e=>setProfile({...profile,tiktok_url:e.target.value})} placeholder="https://tiktok.com/@..."/></label><label>Discord<input value={profile.discord_url||""} onChange={e=>setProfile({...profile,discord_url:e.target.value})} placeholder="https://discord.gg/..."/></label></div><button className="button primary" onClick={saveUrls}>Zapisz linki</button>{status?<div className="statusBox">{status}</div>:null}</section>:null}</main>;
}
