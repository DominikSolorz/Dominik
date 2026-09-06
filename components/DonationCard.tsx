"use client";
import { useMemo, useState } from "react";
import { CreditCard, Landmark, MessageSquareText, Mic, Smartphone, WalletCards } from "lucide-react";
import { DEMO_PAYMENT_LINK, MIN_DONATION_PLN } from "@/lib/config";

const methods = [
  ["BLIK", Smartphone], ["Karta płatnicza", CreditCard], ["Przelew online", Landmark], ["PayPal", WalletCards],
  ["paysafecard", WalletCards], ["SMS Plus", Smartphone], ["SMS", Smartphone], ["SMS FULL", Smartphone],
] as const;

export function DonationCard({ username = "dominik-demo", displayName = "Dominik" }: { username?: string; displayName?: string }) {
  const [amount, setAmount] = useState(50); const [message, setMessage] = useState(""); const [voice, setVoice] = useState(false); const [selected, setSelected] = useState("BLIK");
  const valid = amount >= MIN_DONATION_PLN;
  const buttonText = useMemo(() => valid ? `Wpłać ${amount.toFixed(0)} zł` : `Minimum ${MIN_DONATION_PLN} zł`, [amount, valid]);
  function pay() { if (!valid) return; window.open(DEMO_PAYMENT_LINK, "_blank", "noopener,noreferrer"); }
  return (
    <div className="donationCard" id="wplata">
      <div className="creatorMini"><div className="avatarOrb">DS</div><div><strong>@{username}</strong><span>{displayName} · LIVE</span></div></div>
      <div className="tabs"><button className="active">Wpłata</button><button>Głosówka</button><button>Wiadomość</button></div>
      <label className="fieldLabel">Kwota (min. 50 PLN)</label>
      <div className="amountField"><input aria-label="Kwota wpłaty" type="number" min="50" step="1" value={amount} onChange={(e) => setAmount(Number(e.target.value))}/><span>PLN</span></div>
      <div className="quickAmounts">{[50,100,200,500].map(v => <button key={v} className={amount === v ? "selected" : ""} onClick={() => setAmount(v)}>{v} zł</button>)}</div>
      <label className="fieldLabel">Wiadomość (opcjonalnie)</label><textarea maxLength={255} value={message} onChange={(e)=>setMessage(e.target.value)} placeholder="Napisz coś miłego..." />
      <div className="voiceToggle"><button className={voice ? "switch on" : "switch"} onClick={()=>setVoice(v=>!v)} aria-label="Dodaj głosówkę"><span/></button><Mic size={17}/><span>Dodaj głosówkę</span></div>
      <div className="methodGrid">{methods.map(([name, Icon]) => <button key={name} onClick={()=>setSelected(name)} className={selected===name?"payMethod selected":"payMethod"}><Icon size={18}/><span>{name}</span><small>od 50 PLN</small></button>)}</div>
      <button onClick={pay} disabled={!valid} className="button primary wide">{buttonText}</button>
      <p className="microcopy">Tryb testowy Stripe. Wszystkie metody w DS mają próg 50 PLN. Dostępność konkretnej metody zależy od operatora płatności.</p>
      <div className="messagePreview"><MessageSquareText size={16}/><span>{message || "Twoja wiadomość pojawi się tutaj."}</span></div>
    </div>
  );
}
