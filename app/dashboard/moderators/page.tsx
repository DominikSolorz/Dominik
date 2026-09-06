"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Moderator={moderator_user_id:string;email:string|null;can_moderate_messages:boolean;can_moderate_voice:boolean;created_at:string};

export default function ModeratorsPage(){
 const [items,setItems]=useState<Moderator[]>([]);
 const [email,setEmail]=useState("");
 const [status,setStatus]=useState("");
 const [loading,setLoading]=useState(true);

 async function load(){
  const {data:{session}}=await supabase.auth.getSession();
  if(!session){location.href="/auth?mode=login";return;}
  const {data,error}=await supabase.functions.invoke("stream-manage-moderators",{body:{action:"list"}});
  if(error)setStatus(error.message);else setItems(data?.moderators||[]);
  setLoading(false);
 }
 useEffect(()=>{load();},[]);

 async function add(){
  if(!email.trim())return;
  const {error}=await supabase.functions.invoke("stream-manage-moderators",{body:{action:"add",email:email.trim(),can_moderate_messages:true,can_moderate_voice:true}});
  if(error){setStatus(error.message);return;}
  setEmail("");setStatus("Moderator dodany.");await load();
 }
 async function remove(id:string){
  const {error}=await supabase.functions.invoke("stream-manage-moderators",{body:{action:"remove",moderator_user_id:id}});
  if(error)setStatus(error.message);else{setStatus("Moderator usunięty.");await load();}
 }

 if(loading)return <main className="subpage">Ładowanie…</main>;
 return <main className="subpage"><div className="subpageTop"><div><span>DS Stream Support</span><h1>Moderatorzy</h1></div><Link className="button ghost small" href="/dashboard">← Dashboard</Link></div><section className="settingsCard"><h2>Dodaj moderatora</h2><p>Moderator musi najpierw mieć własne konto DS Stream Support. Nie otrzymuje dostępu do ustawień płatności ani sekretów.</p><div className="termEditor"><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="moderator@example.pl"/><button className="button primary small" onClick={add}>Dodaj</button></div>{status?<div className="statusBox">{status}</div>:null}</section><section className="settingsCard"><h2>Aktywni moderatorzy</h2><div className="moderatorList">{items.length?items.map(m=><div key={m.moderator_user_id}><div><strong>{m.email||m.moderator_user_id}</strong><span>Wiadomości: {m.can_moderate_messages?"tak":"nie"} · Głosówki: {m.can_moderate_voice?"tak":"nie"}</span></div><button onClick={()=>remove(m.moderator_user_id)}>Usuń</button></div>):<p>Nie dodano moderatorów.</p>}</div></section></main>;
}
