"use client";
import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Profile={id:string;username:string;display_name:string;bio:string;page_enabled:boolean;voice_enabled:boolean;min_amount_grosz:number;voice_min_amount_grosz:number};

export default function SettingsPage(){
 const [profile,setProfile]=useState<Profile|null>(null);
 const [status,setStatus]=useState("");
 const [loading,setLoading]=useState(true);

 useEffect(()=>{(async()=>{
  const {data:{session}}=await supabase.auth.getSession();
  if(!session){location.href="/auth?mode=login";return;}
  const {data:p}=await supabase.from("stream_profiles").select("id,username,display_name,bio,page_enabled,voice_enabled,min_amount_grosz,voice_min_amount_grosz").eq("user_id",session.user.id).maybeSingle();
  setProfile(p);setLoading(false);
 })();},[]);

 async function save(e:FormEvent){
  e.preventDefault();if(!profile)return;
  const username=profile.username.toLowerCase().trim().replace(/[^a-z0-9_-]/g,"-").slice(0,32);
  if(username.length<3){setStatus("Nazwa w adresie musi mieć co najmniej 3 znaki.");return;}
  const {error}=await supabase.from("stream_profiles").update({username,display_name:profile.display_name.trim().slice(0,100),bio:profile.bio.slice(0,500),page_enabled:profile.page_enabled,voice_enabled:profile.voice_enabled,min_amount_grosz:5000,voice_min_amount_grosz:5000}).eq("id",profile.id);
  if(error)setStatus(error.message);else{setProfile({...profile,username,min_amount_grosz:5000,voice_min_amount_grosz:5000});setStatus("Ustawienia zapisane. Próg pozostaje 50 PLN.");}
 }

 if(loading)return <main className="subpage">Ładowanie…</main>;
 if(!profile)return <main className="subpage"><p>Nie znaleziono profilu.</p><Link href="/dashboard">Wróć</Link></main>;
 return <main className="subpage"><div className="subpageTop"><div><span>DS Stream Support</span><h1>Ustawienia profilu</h1></div><Link className="button ghost small" href="/dashboard">← Dashboard</Link></div><section className="settingsCard"><form onSubmit={save}><label>Nazwa twórcy<input value={profile.display_name} onChange={e=>setProfile({...profile,display_name:e.target.value})} maxLength={100} required/></label><label>Adres strony<input value={profile.username} onChange={e=>setProfile({...profile,username:e.target.value})} maxLength={32} required/><small>Twoja strona: /c/{profile.username}</small></label><label>Opis<textarea value={profile.bio} onChange={e=>setProfile({...profile,bio:e.target.value})} maxLength={500}/></label><div className="settingsToggles"><label><input type="checkbox" checked={profile.page_enabled} onChange={e=>setProfile({...profile,page_enabled:e.target.checked})}/> Publiczna strona wpłat</label><label><input type="checkbox" checked={profile.voice_enabled} onChange={e=>setProfile({...profile,voice_enabled:e.target.checked})}/> Głosówki i TTS</label></div><div className="lockedMinimum"><span>Minimalna wpłata</span><strong>50 PLN</strong><small>Wymuszona dla wszystkich metod i głosówek.</small></div><button className="button primary">Zapisz ustawienia</button></form>{status?<div className="statusBox">{status}</div>:null}</section></main>;
}
