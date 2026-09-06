"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Brand } from "@/components/Brand";
import { DonationCard } from "@/components/DonationCard";

type Profile={username:string;display_name:string;bio:string;twitch_url:string|null};
export default function CreatorPage(){const params=useParams<{username:string}>();const [profile,setProfile]=useState<Profile|null>(null);const [loading,setLoading]=useState(true);useEffect(()=>{supabase.from("stream_profiles").select("username,display_name,bio,twitch_url").eq("username",params.username).maybeSingle().then(({data})=>{setProfile(data);setLoading(false)})},[params.username]);if(loading)return <main className="creatorPage"><div className="loading">Ładowanie…</div></main>;if(!profile)return <main className="creatorPage"><Link href="/"><Brand/></Link><div className="notFound"><h1>Nie znaleziono twórcy</h1><p>Sprawdź adres strony wpłat.</p></div></main>;return <main className="creatorPage"><header><Link href="/"><Brand/></Link><Link href="/auth?mode=login" className="button ghost small">Panel twórcy</Link></header><section className="creatorHero"><div className="creatorIntro"><div className="avatarLarge">DS</div><h1>{profile.display_name}</h1><span>@{profile.username}</span><p>{profile.bio}</p>{profile.twitch_url?<a href={profile.twitch_url} target="_blank" rel="noreferrer">Twitch</a>:null}</div><DonationCard username={profile.username} displayName={profile.display_name}/></section></main>}
