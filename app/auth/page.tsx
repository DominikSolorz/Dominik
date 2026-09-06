"use client";
import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Brand } from "@/components/Brand";

export default function AuthPage(){
  const [mode,setMode]=useState<"login"|"register">("login");
  const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [name,setName]=useState("");
  const [status,setStatus]=useState(""); const [busy,setBusy]=useState(false);
  useEffect(()=>{if(new URLSearchParams(window.location.search).get("mode")==="register")setMode("register")},[]);
  async function submit(e:FormEvent){e.preventDefault();setBusy(true);setStatus("");
    if(password.length<8){setStatus("Hasło musi mieć co najmniej 8 znaków.");setBusy(false);return;}
    if(mode==="register"){
      const {error}=await supabase.auth.signUp({email,password,options:{data:{full_name:name}}});
      setStatus(error?error.message:"Konto utworzone. Jeśli wymagane jest potwierdzenie e-mail, sprawdź skrzynkę.");
    }else{
      const {error}=await supabase.auth.signInWithPassword({email,password});
      if(error)setStatus(error.message); else window.location.href="/dashboard";
    } setBusy(false);
  }
  async function google(){const {error}=await supabase.auth.signInWithOAuth({provider:"google",options:{redirectTo:`${window.location.origin}/dashboard`}});if(error)setStatus("Logowanie Google wymaga włączenia dostawcy OAuth w projekcie Supabase.");}
  return <main className="authShell"><Link href="/" className="brandLink"><Brand/></Link><section className="authCard"><div className="authTabs"><button className={mode==="login"?"active":""} onClick={()=>setMode("login")}>Logowanie</button><button className={mode==="register"?"active":""} onClick={()=>setMode("register")}>Rejestracja</button></div><h1>{mode==="login"?"Witaj ponownie":"Załóż konto twórcy"}</h1><p>{mode==="login"?"Zaloguj się do panelu DS Stream Support.":"Po rejestracji otrzymasz własny profil, metody płatności i alertbox."}</p><form onSubmit={submit}>{mode==="register"?<label>Nazwa twórcy<input value={name} onChange={e=>setName(e.target.value)} required placeholder="Dominik"/></label>:null}<label>E-mail<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="tworca@example.pl"/></label><label>Hasło<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required placeholder="Minimum 8 znaków"/></label><button className="button primary wide" disabled={busy}>{busy?"Przetwarzam...":mode==="login"?"Zaloguj się":"Zarejestruj się"}</button></form><button className="button ghost wide" onClick={google}>Kontynuuj przez Google</button>{status?<div className="statusBox">{status}</div>:null}</section></main>
}
