"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Brand } from "@/components/Brand";
import { BellRing, CreditCard, Goal, Link2, LogOut, Settings2, Volume2 } from "lucide-react";

type Profile={id:string;username:string;display_name:string;bio:string;min_amount_grosz:number;voice_enabled:boolean;voice_min_amount_grosz:number};
type Donation={id:string;payer_name:string;amount_grosz:number;message:string;status:string;moderation_status:string;created_at:string};
type BlockedTerm={id:string;term:string};

export default function Dashboard(){
 const [profile,setProfile]=useState<Profile|null>(null);
 const [donations,setDonations]=useState<Donation[]>([]);
 const [blockedTerms,setBlockedTerms]=useState<BlockedTerm[]>([]);
 const [newTerm,setNewTerm]=useState("");
 const [loading,setLoading]=useState(true);
 const [notice,setNotice]=useState("");

 async function loadCreatorData(profileId:string){
   const [{data:d},{data:b}]=await Promise.all([
     supabase.from("stream_donations").select("id,payer_name,amount_grosz,message,status,moderation_status,created_at").eq("creator_profile_id",profileId).order("created_at",{ascending:false}).limit(25),
     supabase.from("stream_blocked_terms").select("id,term").eq("profile_id",profileId).order("created_at",{ascending:false})
   ]);
   setDonations(d||[]);
   setBlockedTerms(b||[]);
 }

 useEffect(()=>{(async()=>{
   const {data:{session}}=await supabase.auth.getSession();
   if(!session){window.location.href="/auth?mode=login";return;}
   const {data:p}=await supabase.from("stream_profiles").select("id,username,display_name,bio,min_amount_grosz,voice_enabled,voice_min_amount_grosz").eq("user_id",session.user.id).maybeSingle();
   if(p){setProfile(p);await loadCreatorData(p.id);}
   setLoading(false);
 })();},[]);

 const paid=useMemo(()=>donations.filter(d=>d.status==="paid"),[donations]);
 const total=paid.reduce((s,d)=>s+d.amount_grosz,0)/100;

 async function updateMin(){
   if(!profile)return;
   const {error}=await supabase.from("stream_profiles").update({min_amount_grosz:5000,voice_min_amount_grosz:5000}).eq("id",profile.id);
   if(!error)setProfile({...profile,min_amount_grosz:5000,voice_min_amount_grosz:5000});
   setNotice(error?error.message:"Ustawiono 50 PLN dla wpłat i głosówek.");
 }

 async function testAlert(){
   const {error}=await supabase.functions.invoke("stream-test-alert",{body:{amount_grosz:10000,name:"Testowy widz",message:"Test alertu DS Stream Support 💜"}});
   setNotice(error?`Błąd testu alertu: ${error.message}`:"Wysłano testowy alert. Otwórz overlay OBS, aby go zobaczyć.");
 }

 async function moderate(donationId:string,action:"approve"|"reject"){
   const {error}=await supabase.functions.invoke("stream-moderate-donation",{body:{donation_id:donationId,action}});
   setNotice(error?`Moderacja: ${error.message}`:`Wiadomość ${action==="approve"?"zaakceptowana":"odrzucona"}.`);
   if(profile&&!error)await loadCreatorData(profile.id);
 }

 async function addBlockedTerm(){
   if(!profile||!newTerm.trim())return;
   const term=newTerm.trim().slice(0,80);
   const {error}=await supabase.from("stream_blocked_terms").insert({profile_id:profile.id,term});
   if(error)setNotice(error.message);else{setNewTerm("");await loadCreatorData(profile.id);setNotice("Dodano słowo do filtra.");}
 }

 async function removeBlockedTerm(id:string){
   if(!profile)return;
   const {error}=await supabase.from("stream_blocked_terms").delete().eq("id",id).eq("profile_id",profile.id);
   if(error)setNotice(error.message);else await loadCreatorData(profile.id);
 }

 async function logout(){await supabase.auth.signOut();window.location.href="/";}
 if(loading)return <main className="dashboardShell"><div className="loading">Ładowanie panelu…</div></main>;

 return <main className="dashboardShell">
  <aside className="dashSidebar"><Brand compact/><nav><Link className="dashNavLink active" href="/dashboard"><CreditCard size={18}/>Dashboard</Link><a className="dashNavLink" href="#obs"><BellRing size={18}/>Alerty</a><Link className="dashNavLink" href="/dashboard/settings"><Volume2 size={18}/>Głosówki</Link><Link className="dashNavLink" href="/dashboard/goals"><Goal size={18}/>Cele</Link><Link className="dashNavLink" href="/dashboard/integrations"><Link2 size={18}/>Integracje</Link><Link className="dashNavLink" href="/dashboard/settings"><Settings2 size={18}/>Ustawienia</Link></nav><button onClick={logout} className="logout"><LogOut size={17}/>Wyloguj</button></aside>
  <section className="dashMain">
   <div className="dashTop"><div><span>Panel twórcy</span><h1>{profile?.display_name||"Twórca"}</h1></div>{profile?<Link className="button ghost small" href={`/c/${profile.username}`}>Otwórz stronę wpłat</Link>:null}</div>
   {!profile?<div className="emptyState"><h2>Profil nie został jeszcze utworzony</h2><p>Nowe konto powinno otrzymać profil automatycznie.</p></div>:<>
    <div className="dashCards"><article><span>Próg wpłaty</span><strong>{(profile.min_amount_grosz/100).toFixed(0)} PLN</strong></article><article><span>Wpłaty w widoku</span><strong>{donations.length}</strong></article><article><span>Suma opłaconych</span><strong>{total.toFixed(2)} PLN</strong></article><article><span>Twój URL</span><strong className="smallStrong">/c/{profile.username}</strong></article></div>
    <div className="dashboardQuickLinks"><Link href="/dashboard/goals">Edytuj cele</Link><Link href="/dashboard/integrations">Integracje</Link><Link href="/dashboard/settings">Profil i głosówki</Link></div>
    <section className="panelSection"><div><h2>Ustawienia płatności</h2><p>Wszystkie metody i głosówki mają próg 50 PLN.</p></div><button className="button primary small" onClick={updateMin}>Ustaw wszędzie 50 PLN</button></section>
    <section className="panelSection column"><div><h2>Moderacja wiadomości</h2><p>Dodaj słowa, których nie chcesz pokazywać na transmisji. Webhook odrzuci wiadomość zawierającą zablokowany zwrot.</p></div><div className="termEditor"><input value={newTerm} onChange={e=>setNewTerm(e.target.value)} maxLength={80} placeholder="np. obraźliwy zwrot"/><button className="button primary small" onClick={addBlockedTerm}>Dodaj do filtra</button></div><div className="termList">{blockedTerms.length?blockedTerms.map(t=><span key={t.id}>{t.term}<button onClick={()=>removeBlockedTerm(t.id)}>×</button></span>):<small>Brak własnych zablokowanych słów.</small>}</div></section>
    <section className="panelSection column"><div><h2>Ostatnie wpłaty</h2><p>Dane są chronione przez RLS. Wiadomości oczekujące możesz zaakceptować lub odrzucić.</p></div><div className="donationTable">{donations.length?donations.map(d=><div key={d.id}><span>{d.payer_name}</span><b>{(d.amount_grosz/100).toFixed(2)} PLN</b><em>{d.status} · {d.moderation_status}</em><small>{d.message||"—"}</small>{d.moderation_status==="pending"?<span className="moderationButtons"><button onClick={()=>moderate(d.id,"approve")}>Akceptuj</button><button onClick={()=>moderate(d.id,"reject")}>Odrzuć</button></span>:null}</div>):<p>Brak zarejestrowanych wpłat.</p>}</div></section>
    <section id="obs" className="panelSection"><div><h2>OBS alertbox + TTS</h2><p>Dodaj jako Browser Source: <code>/overlay/{profile.username}</code>. Jeśli wpłata ma wiadomość tekstową, przeglądarka może odczytać ją po polsku; jeśli ma plik głosowy, overlay go odtworzy.</p></div><div className="inlineActions"><button className="button primary small" onClick={testAlert}>Wyślij test alert</button><Link className="button ghost small" href={`/overlay/${profile.username}`}>Podgląd overlay</Link></div></section>
    {notice?<div className="notice panelNotice">{notice}</div>:null}
   </>}
  </section>
 </main>;
}
