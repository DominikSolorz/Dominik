"use client";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type EventPayload={name?:string;amount_grosz?:number;currency?:string;message?:string;voice_url?:string|null};

function playAlertAudio(payload: EventPayload) {
  if (payload.voice_url) {
    const audio = new Audio(payload.voice_url);
    audio.volume = 1;
    audio.play().catch(() => undefined);
    return;
  }
  if (payload.message && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(payload.message.slice(0, 300));
    utterance.lang = "pl-PL";
    utterance.rate = 1;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }
}

export default function Overlay(){
  const params=useParams<{username:string}>();
  const [profileId,setProfileId]=useState<string|null>(null);
  const [event,setEvent]=useState<EventPayload|null>(null);
  const timer=useRef<ReturnType<typeof setTimeout>|null>(null);

  useEffect(()=>{
    supabase.from("stream_profiles").select("id").eq("username",params.username).maybeSingle().then(({data})=>setProfileId(data?.id||null));
  },[params.username]);

  useEffect(()=>{
    if(!profileId)return;
    const channel=supabase.channel(`overlay-${profileId}`).on("postgres_changes",{
      event:"INSERT",schema:"public",table:"stream_events",filter:`creator_profile_id=eq.${profileId}`
    },payload=>{
      const p=(payload.new as {payload:EventPayload}).payload;
      setEvent(p);
      playAlertAudio(p);
      if(timer.current)clearTimeout(timer.current);
      timer.current=setTimeout(()=>setEvent(null),7000);
    }).subscribe();
    return()=>{
      supabase.removeChannel(channel);
      if(timer.current)clearTimeout(timer.current);
      if("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  },[profileId]);

  return <main className="overlayCanvas">{event?<div className="overlayAlert"><div className="crown">♛</div><span>Nowa wpłata!</span><strong>{event.name||"Anonim"} wpłacił {((event.amount_grosz||0)/100).toFixed(2)} PLN</strong>{event.message?<p>„{event.message}”</p>:null}</div>:<div className="overlayHint">OBS Alertbox · oczekiwanie na zdarzenie</div>}</main>;
}
