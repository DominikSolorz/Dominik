"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Method={id:string;provider:string;label:string;configured:boolean;enabled:boolean;min_amount_grosz:number};

export default function PaymentsPage(){
 const [profileId,setProfileId]=useState("");
 const [methods,setMethods]=useState<Method[]>([]);
 const [status,setStatus]=useState("");
 const [loading,setLoading]=useState(true);
 const [testName,setTestName]=useState("Testowy widz");
 const [testAmount,setTestAmount]=useState(100);
 const [testMessage,setTestMessage]=useState("Testowa wpłata DS Stream Support 💜");

 async function load(){
  const {data:{session}}=await supabase.auth.getSession();
  if(!session){location.href="/auth?mode=login";return;}
  const {data:p}=await supabase.from("stream_profiles").select("id").eq("user_id",session.user.id).maybeSingle();
  if(!p){setLoading(false);return;}
  setProfileId(p.id);
  const {data:m}=await supabase.from("stream_payment_methods").select("id,provider,label,configured,enabled,min_amount_grosz").eq("profile_id",p.id).order("sort_order");
  setMethods(m||[]);setLoading(false);
 }
 useEffect(()=>{load();},[]);

 async function toggle(method:Method){
  const {error}=await supabase.rpc("stream_set_payment_method_enabled",{p_method_id:method.id,p_enabled:!method.enabled});
  if(error){setStatus(method.configured?error.message:`${method.label}: najpierw trzeba podłączyć operatora/API.`);return;}
  setMethods(v=>v.map(x=>x.id===method.id?{...x,enabled:!x.enabled,min_amount_grosz:5000}:x));
  setStatus(`${method.label}: ${!method.enabled?"włączona":"wyłączona"}. Próg pozostaje 50 PLN.`);
 }

 async function createTestDonation(){
  if(testAmount<50){setStatus("Testowa wpłata musi mieć minimum 50 PLN.");return;}
  const {data,error}=await supabase.functions.invoke("stream-test-donation",{body:{name:testName,amount_grosz:Math.round(testAmount*100),message:testMessage}});
  setStatus(error?error.message:`Utworzono testową wpłatę ${((data?.amount_grosz||0)/100).toFixed(2)} PLN. Powinna pojawić się w historii i overlayu OBS.`);
 }

 if(loading)return <main className="subpage">Ładowanie…</main>;
 return <main className="subpage"><div className="subpageTop"><div><span>DS Stream Support</span><h1>Metody płatności</h1></div><Link className="button ghost small" href="/dashboard">← Dashboard</Link></div><section className="settingsCard"><h2>Próg globalny: 50 PLN</h2><p>Każda metoda ma twarde minimum 50 PLN. Metodę można włączyć dopiero po prawidłowym podłączeniu operatora.</p><div className="paymentMethodList">{methods.map(m=><button key={m.id} className={m.enabled?"paymentMethodRow on":"paymentMethodRow"} onClick={()=>toggle(m)}><div><strong>{m.label}</strong><span>{m.configured?"Operator skonfigurowany":"Wymaga operatora / API"}</span></div><div><b>{(m.min_amount_grosz/100).toFixed(0)} PLN</b><em>{m.enabled?"AKTYWNA":"WYŁ."}</em></div></button>)}</div>{!profileId?<p>Brak profilu twórcy.</p>:null}</section><section className="settingsCard"><h2>Test całego przepływu</h2><p>To nie pobiera pieniędzy. Tworzy testową opłaconą wpłatę w bazie, uruchamia Realtime i alert OBS/TTS.</p><div className="testPaymentGrid"><label>Nazwa widza<input value={testName} onChange={e=>setTestName(e.target.value)} maxLength={80}/></label><label>Kwota (PLN)<input type="number" min="50" value={testAmount} onChange={e=>setTestAmount(Number(e.target.value))}/></label><label className="wideField">Wiadomość<textarea value={testMessage} onChange={e=>setTestMessage(e.target.value)} maxLength={255}/></label></div><button className="button primary" onClick={createTestDonation}>Wyślij testową wpłatę</button>{status?<div className="statusBox">{status}</div>:null}</section></main>;
}
