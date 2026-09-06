"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Item={id:string;payer_name:string;amount_grosz:number;currency:string;message:string;voice_url:string|null;moderation_status:string;created_at:string};

export default function ModeratePage(){
 const [items,setItems]=useState<Item[]>([]);
 const [status,setStatus]=useState("");
 const [loading,setLoading]=useState(true);
 async function load(){
  const {data:{session}}=await supabase.auth.getSession();if(!session){location.href="/auth?mode=login";return;}
  const {data,error}=await supabase.functions.invoke("stream-moderation-queue",{body:{status:"pending"}});
  if(error)setStatus(error.message);else setItems(data?.items||[]);setLoading(false);
 }
 useEffect(()=>{load();},[]);
 async function act(id:string,action:"approve"|"reject"){
  const {error}=await supabase.functions.invoke("stream-moderate-donation",{body:{donation_id:id,action}});
  if(error)setStatus(error.message);else{setStatus(action==="approve"?"Wiadomość zaakceptowana.":"Wiadomość odrzucona.");await load();}
 }
 if(loading)return <main className="moderationPage">Ładowanie kolejki…</main>;
 return <main className="moderationPage"><header><div><span>DS Stream Support</span><h1>Panel moderatora</h1></div><Link className="button ghost small" href="/">Strona główna</Link></header>{status?<div className="moderationStatus">{status}</div>:null}<section className="moderationQueue">{items.length?items.map(item=><article key={item.id}><div className="moderationMeta"><strong>{item.payer_name}</strong><span>{(item.amount_grosz/100).toFixed(2)} {item.currency}</span><small>{new Date(item.created_at).toLocaleString("pl-PL")}</small></div><p>{item.message||"Brak wiadomości tekstowej."}</p>{item.voice_url?<audio controls src={item.voice_url}/>:null}<div className="moderationActions"><button onClick={()=>act(item.id,"approve")}>Akceptuj</button><button onClick={()=>act(item.id,"reject")}>Odrzuć</button></div></article>):<div className="emptyModeration"><h2>Kolejka jest pusta ✅</h2><p>Nie ma wiadomości oczekujących na decyzję.</p></div>}</section></main>;
}
