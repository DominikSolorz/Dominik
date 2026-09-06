"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type AlertSettings={profile_id:string;enabled:boolean;min_amount_grosz:number;duration_ms:number;show_name:boolean;show_message:boolean;speak_message:boolean;animation:string;sound_url:string|null};

export default function AlertsPage(){
 const [settings,setSettings]=useState<AlertSettings|null>(null);
 const [status,setStatus]=useState("");
 const [loading,setLoading]=useState(true);
 const [username,setUsername]=useState("");

 useEffect(()=>{(async()=>{
  const {data:{session}}=await supabase.auth.getSession();
  if(!session){location.href="/auth?mode=login";return;}
  const {data:p}=await supabase.from("stream_profiles").select("id,username").eq("user_id",session.user.id).maybeSingle();
  if(!p){setLoading(false);return;}
  setUsername(p.username);
  const {data:a}=await supabase.from("stream_alert_settings").select("profile_id,enabled,min_amount_grosz,duration_ms,show_name,show_message,speak_message,animation,sound_url").eq("profile_id",p.id).maybeSingle();
  setSettings(a);setLoading(false);
 })();},[]);

 async function save(){
  if(!settings)return;
  const payload={enabled:settings.enabled,min_amount_grosz:5000,duration_ms:Math.max(1000,Math.min(30000,settings.duration_ms)),show_name:settings.show_name,show_message:settings.show_message,speak_message:settings.speak_message,animation:settings.animation,sound_url:settings.sound_url||null};
  const {error}=await supabase.from("stream_alert_settings").update(payload).eq("profile_id",settings.profile_id);
  setStatus(error?error.message:"Ustawienia alertu zapisane. Minimum pozostaje 50 PLN.");
 }

 async function test(){
  const {error}=await supabase.functions.invoke("stream-test-alert",{body:{amount_grosz:10000,name:"Testowy widz",message:"Tak będzie wyglądał alert DS Stream Support 💜"}});
  setStatus(error?error.message:"Test alertu wysłany.");
 }

 if(loading)return <main className="subpage">Ładowanie…</main>;
 if(!settings)return <main className="subpage"><p>Brak ustawień alertu.</p><Link href="/dashboard">Wróć</Link></main>;
 return <main className="subpage"><div className="subpageTop"><div><span>DS Stream Support</span><h1>Alerty OBS</h1></div><Link className="button ghost small" href="/dashboard">← Dashboard</Link></div><section className="settingsCard"><div className="settingsToggles"><label><input type="checkbox" checked={settings.enabled} onChange={e=>setSettings({...settings,enabled:e.target.checked})}/> Alerty włączone</label><label><input type="checkbox" checked={settings.show_name} onChange={e=>setSettings({...settings,show_name:e.target.checked})}/> Pokazuj nazwę widza</label><label><input type="checkbox" checked={settings.show_message} onChange={e=>setSettings({...settings,show_message:e.target.checked})}/> Pokazuj wiadomość</label><label><input type="checkbox" checked={settings.speak_message} onChange={e=>setSettings({...settings,speak_message:e.target.checked})}/> Czytaj wiadomość TTS</label></div><div className="urlGrid"><label>Czas alertu (sekundy)<input type="number" min="1" max="30" value={Math.round(settings.duration_ms/1000)} onChange={e=>setSettings({...settings,duration_ms:Number(e.target.value)*1000})}/></label><label>Animacja<select value={settings.animation} onChange={e=>setSettings({...settings,animation:e.target.value})}><option value="glow-pop">Glow Pop</option><option value="slide-up">Slide Up</option><option value="minimal">Minimal</option></select></label></div><div className="lockedMinimum"><span>Minimalna kwota alertu</span><strong>50 PLN</strong><small>Nie można ustawić mniej niż 50 PLN.</small></div><div className="inlineActions"><button className="button primary" onClick={save}>Zapisz alert</button><button className="button ghost" onClick={test}>Wyślij test</button>{username?<a className="button ghost" target="_blank" rel="noreferrer" href={`/overlay/${username}`}>Podgląd overlay</a>:null}</div>{status?<div className="statusBox">{status}</div>:null}</section></main>;
}
