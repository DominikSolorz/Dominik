"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Brand } from "@/components/Brand";

export default function UpdatePasswordPage(){
 const [password,setPassword]=useState("");const [confirm,setConfirm]=useState("");const [status,setStatus]=useState("");
 async function submit(e:FormEvent){e.preventDefault();if(password.length<8){setStatus("Hasło musi mieć minimum 8 znaków.");return;}if(password!==confirm){setStatus("Hasła nie są identyczne.");return;}const {error}=await supabase.auth.updateUser({password});if(error)setStatus(error.message);else setStatus("Hasło zostało zmienione. Możesz przejść do panelu.");}
 return <main className="authShell"><Link href="/" className="brandLink"><Brand/></Link><section className="authCard"><h1>Ustaw nowe hasło</h1><p>Link z wiadomości e-mail powinien zalogować Cię w trybie odzyskiwania konta.</p><form onSubmit={submit}><label>Nowe hasło<input type="password" minLength={8} required value={password} onChange={e=>setPassword(e.target.value)}/></label><label>Powtórz hasło<input type="password" minLength={8} required value={confirm} onChange={e=>setConfirm(e.target.value)}/></label><button className="button primary wide">Zmień hasło</button></form>{status?<div className="statusBox">{status}</div>:null}<Link href="/dashboard" className="button ghost wide">Otwórz panel</Link></section></main>;
}
