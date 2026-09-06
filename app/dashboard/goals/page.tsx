"use client";
import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type GoalRow={id:string;title:string;target_grosz:number;active:boolean};

export default function GoalsPage(){
 const [profileId,setProfileId]=useState("");
 const [goal,setGoal]=useState<GoalRow|null>(null);
 const [title,setTitle]=useState("Rozwój kanału");
 const [target,setTarget]=useState(5000);
 const [status,setStatus]=useState("");
 const [loading,setLoading]=useState(true);

 useEffect(()=>{(async()=>{
  const {data:{session}}=await supabase.auth.getSession();
  if(!session){location.href="/auth?mode=login";return;}
  const {data:p}=await supabase.from("stream_profiles").select("id").eq("user_id",session.user.id).maybeSingle();
  if(!p){setLoading(false);return;}
  setProfileId(p.id);
  const {data:g}=await supabase.from("stream_goals").select("id,title,target_grosz,active").eq("profile_id",p.id).eq("active",true).order("created_at",{ascending:false}).limit(1).maybeSingle();
  if(g){setGoal(g);setTitle(g.title);setTarget(g.target_grosz/100);}
  setLoading(false);
 })();},[]);

 async function save(e:FormEvent){
  e.preventDefault();
  if(!profileId)return;
  if(target<50){setStatus("Cel musi wynosić co najmniej 50 PLN.");return;}
  const payload={profile_id:profileId,title:title.trim().slice(0,120),target_grosz:Math.round(target*100),active:true};
  const {error}=goal
   ? await supabase.from("stream_goals").update(payload).eq("id",goal.id)
   : await supabase.from("stream_goals").insert(payload);
  setStatus(error?error.message:"Cel zapisany.");
 }

 if(loading)return <main className="subpage"><p>Ładowanie…</p></main>;
 return <main className="subpage"><div className="subpageTop"><div><span>DS Stream Support</span><h1>Cele wpłat</h1></div><Link className="button ghost small" href="/dashboard">← Dashboard</Link></div><section className="settingsCard"><h2>Aktywny cel</h2><p>Cel może być pokazany na stronie twórcy i w overlayu. Minimalna wartość to 50 PLN.</p><form onSubmit={save}><label>Nazwa celu<input value={title} onChange={e=>setTitle(e.target.value)} maxLength={120} required/></label><label>Kwota celu (PLN)<input type="number" min="50" step="1" value={target} onChange={e=>setTarget(Number(e.target.value))} required/></label><button className="button primary">Zapisz cel</button></form>{status?<div className="statusBox">{status}</div>:null}</section></main>;
}
