"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Donation={id:string;payer_name:string;payer_email:string|null;amount_grosz:number;currency:string;message:string;payment_provider:string;status:string;moderation_status:string;created_at:string;paid_at:string|null};

function csvCell(value:unknown){const s=String(value??"");return `"${s.replaceAll('"','""')}"`;}

export default function ExportPage(){
 const [rows,setRows]=useState<Donation[]>([]);
 const [status,setStatus]=useState("");
 const [loading,setLoading]=useState(true);
 useEffect(()=>{(async()=>{
  const {data:{session}}=await supabase.auth.getSession();if(!session){location.href="/auth?mode=login";return;}
  const {data:p}=await supabase.from("stream_profiles").select("id,username").eq("user_id",session.user.id).maybeSingle();if(!p){setLoading(false);return;}
  const {data,error}=await supabase.from("stream_donations").select("id,payer_name,payer_email,amount_grosz,currency,message,payment_provider,status,moderation_status,created_at,paid_at").eq("creator_profile_id",p.id).order("created_at",{ascending:false}).limit(10000);
  if(error)setStatus(error.message);else setRows(data||[]);setLoading(false);
 })();},[]);
 function download(){
  const header=["id","payer_name","payer_email","amount_pln","currency","message","payment_provider","status","moderation_status","created_at","paid_at"];
  const lines=[header.map(csvCell).join(","),...rows.map(r=>[r.id,r.payer_name,r.payer_email,(r.amount_grosz/100).toFixed(2),r.currency,r.message,r.payment_provider,r.status,r.moderation_status,r.created_at,r.paid_at].map(csvCell).join(","))];
  const blob=new Blob(["\ufeff"+lines.join("\r\n")],{type:"text/csv;charset=utf-8"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`ds-stream-support-wplaty-${new Date().toISOString().slice(0,10)}.csv`;a.click();URL.revokeObjectURL(url);setStatus(`Wyeksportowano ${rows.length} rekordów.`);
 }
 if(loading)return <main className="subpage">Ładowanie…</main>;
 return <main className="subpage"><div className="subpageTop"><div><span>DS Stream Support</span><h1>Eksport danych</h1></div><Link className="button ghost small" href="/dashboard">← Dashboard</Link></div><section className="settingsCard"><h2>Historia wpłat CSV</h2><p>Eksport obejmuje maksymalnie 10 000 najnowszych wpisów dostępnych właścicielowi profilu. Plik zawiera dane osobowe darczyńców, więc przechowuj go bezpiecznie.</p><div className="lockedMinimum"><span>Liczba rekordów</span><strong>{rows.length}</strong><small>Kwoty są eksportowane w PLN.</small></div><button className="button primary" onClick={download} disabled={!rows.length}>Pobierz CSV</button>{status?<div className="statusBox">{status}</div>:null}</section></main>;
}
