"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Brand } from "@/components/Brand";
import { DonationCard } from "@/components/DonationCard";

type Profile={username:string;display_name:string;bio:string;twitch_url:string|null;youtube_url:string|null;tiktok_url:string|null;discord_url:string|null;stripe_payment_link_url:string|null};
type Goal={title:string;target_grosz:number;current_grosz:number};

export default function CreatorPage(){
 const params=useParams<{username:string}>();
 const [profile,setProfile]=useState<Profile|null>(null);
 const [goal,setGoal]=useState<Goal|null>(null);
 const [loading,setLoading]=useState(true);

 useEffect(()=>{(async()=>{
   const [{data:p},{data:g}]=await Promise.all([
     supabase.from("stream_profiles").select("username,display_name,bio,twitch_url,youtube_url,tiktok_url,discord_url,stripe_payment_link_url").eq("username",params.username).maybeSingle(),
     supabase.rpc("stream_public_goal_progress",{p_username:params.username}).maybeSingle()
   ]);
   setProfile(p);
   setGoal(g as Goal|null);
   setLoading(false);
 })();},[params.username]);

 const progress=useMemo(()=>goal?Math.max(0,Math.min(100,(Number(goal.current_grosz)/goal.target_grosz)*100)):0,[goal]);
 if(loading)return <main className="creatorPage"><div className="loading">Ładowanie…</div></main>;
 if(!profile)return <main className="creatorPage"><Link href="/"><Brand/></Link><div className="notFound"><h1>Nie znaleziono twórcy</h1><p>Sprawdź adres strony wpłat.</p></div></main>;

 return <main className="creatorPage">
  <header><Link href="/"><Brand/></Link><Link href="/auth?mode=login" className="button ghost small">Panel twórcy</Link></header>
  <section className="creatorHero">
   <div className="creatorIntro"><div className="avatarLarge">DS</div><h1>{profile.display_name}</h1><span>@{profile.username}</span><p>{profile.bio}</p><div className="creatorSocials">{profile.twitch_url?<a href={profile.twitch_url} target="_blank" rel="noreferrer">Twitch</a>:null}{profile.youtube_url?<a href={profile.youtube_url} target="_blank" rel="noreferrer">YouTube</a>:null}{profile.tiktok_url?<a href={profile.tiktok_url} target="_blank" rel="noreferrer">TikTok</a>:null}{profile.discord_url?<a href={profile.discord_url} target="_blank" rel="noreferrer">Discord</a>:null}</div>{goal?<div className="goalCard"><div><strong>{goal.title}</strong><span>{(Number(goal.current_grosz)/100).toFixed(2)} / {(goal.target_grosz/100).toFixed(2)} PLN</span></div><div className="goalTrack"><i style={{width:`${progress}%`}}/></div></div>:null}</div>
   <DonationCard username={profile.username} displayName={profile.display_name} paymentLink={profile.stripe_payment_link_url}/>
  </section>
 </main>;
}
