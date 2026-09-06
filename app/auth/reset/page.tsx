"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Brand } from "@/components/Brand";

export default function ResetPasswordPage(){
 const [email,setEmail]=useState("");const [status,setStatus]=useState("");
 async function submit(e:FormEvent){e.preventDefault();const redirectTo=`${window.location.origin}/auth/update-password`;const {error}=await supabase.auth.resetPasswordForEmail(email.trim(),{redirectTo});setStatus(error?error.message:"Jeśli konto istnieje, wysłaliśmy link do ustawienia nowego hasła.");}
 return <main className="authShell"><Link href="/" className="brandLink"><Brand/></Link><section className="authCard"><h1>Reset hasła</h1><p>Podaj e-mail konta twórcy.</p><form onSubmit={submit}><label>E-mail<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="tworca@example.pl"/></label><button className="button primary wide">Wyślij link resetujący</button></form>{status?<div className="statusBox">{status}</div>:null}<Link href="/auth?mode=login" className="button ghost wide">Wróć do logowania</Link></section></main>;
}
