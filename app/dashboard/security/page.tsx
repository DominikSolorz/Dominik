"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Factor={id:string;status:string;friendly_name?:string};

export default function SecurityPage(){
 const [factors,setFactors]=useState<Factor[]>([]);
 const [pendingId,setPendingId]=useState("");
 const [qr,setQr]=useState("");
 const [code,setCode]=useState("");
 const [status,setStatus]=useState("");
 const [loading,setLoading]=useState(true);

 async function load(){
  const {data:{session}}=await supabase.auth.getSession();
  if(!session){location.href="/auth?mode=login";return;}
  const {data,error}=await supabase.auth.mfa.listFactors();
  if(error)setStatus(error.message);else setFactors((data?.totp||[]) as Factor[]);
  setLoading(false);
 }
 useEffect(()=>{load();},[]);

 async function enroll(){
  setStatus("");
  const {data,error}=await supabase.auth.mfa.enroll({factorType:"totp",friendlyName:"DS Stream Support"});
  if(error){setStatus(error.message);return;}
  setPendingId(data.id);setQr(data.totp.qr_code);setStatus("Zeskanuj kod w aplikacji uwierzytelniającej i wpisz 6-cyfrowy kod.");
 }
 async function verify(){
  if(!pendingId||code.length<6)return;
  const {error}=await supabase.auth.mfa.challengeAndVerify({factorId:pendingId,code});
  if(error){setStatus(error.message);return;}
  setPendingId("");setQr("");setCode("");setStatus("2FA zostało włączone.");await load();
 }
 async function remove(id:string){
  const {error}=await supabase.auth.mfa.unenroll({factorId:id});
  if(error)setStatus(error.message);else{setStatus("Usunięto metodę 2FA.");await load();}
 }

 if(loading)return <main className="subpage">Ładowanie…</main>;
 return <main className="subpage"><div className="subpageTop"><div><span>DS Stream Support</span><h1>Bezpieczeństwo konta</h1></div><Link className="button ghost small" href="/dashboard">← Dashboard</Link></div><section className="settingsCard"><h2>Uwierzytelnianie dwuskładnikowe (TOTP)</h2><p>Możesz zabezpieczyć konto kodem z aplikacji uwierzytelniającej. Sekret 2FA nie jest zapisywany w kodzie aplikacji.</p>{factors.length?<div className="securityFactors">{factors.map(f=><div key={f.id}><span><strong>{f.friendly_name||"Authenticator"}</strong><small>Status: {f.status}</small></span><button onClick={()=>remove(f.id)}>Usuń</button></div>)}</div>:<button className="button primary" onClick={enroll}>Włącz 2FA</button>}{pendingId?<div className="mfaEnroll">{qr?<img src={qr} alt="Kod QR do konfiguracji 2FA"/>:null}<label>Kod z aplikacji<input inputMode="numeric" autoComplete="one-time-code" value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,"").slice(0,6))} placeholder="123456"/></label><button className="button primary" onClick={verify}>Potwierdź 2FA</button></div>:null}{status?<div className="statusBox">{status}</div>:null}</section></main>;
}
