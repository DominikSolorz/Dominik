"use client";
import { useMemo, useState } from "react";
import { CreditCard, Landmark, MessageSquareText, Mic, Smartphone, WalletCards } from "lucide-react";
import { DEMO_PAYMENT_LINK, MIN_DONATION_PLN } from "@/lib/config";

const methods = [
  {name:"Karta płatnicza", Icon:CreditCard, connected:true},
  {name:"BLIK", Icon:Smartphone, connected:false},
  {name:"Przelew online", Icon:Landmark, connected:false},
  {name:"PayPal", Icon:WalletCards, connected:false},
  {name:"paysafecard", Icon:WalletCards, connected:false},
  {name:"SMS Plus", Icon:Smartphone, connected:false},
  {name:"SMS", Icon:Smartphone, connected:false},
  {name:"SMS FULL", Icon:Smartphone, connected:false},
] as const;

type Props={username?:string;displayName?:string;paymentLink?:string|null};

export function DonationCard({ username = "dominik-demo", displayName = "Dominik", paymentLink }: Props) {
  const [amount,setAmount]=useState(50);
  const [message,setMessage]=useState("");
  const [voice,setVoice]=useState(false);
  const [selected,setSelected]=useState("Karta płatnicza");
  const valid=amount>=MIN_DONATION_PLN;
  const selectedMethod=methods.find(m=>m.name===selected)!;
  const resolvedPaymentLink=paymentLink===undefined?(username==="dominik-demo"?DEMO_PAYMENT_LINK:null):paymentLink;
  const canPay=valid&&selectedMethod.connected&&Boolean(resolvedPaymentLink);
  const buttonText=useMemo(()=>{
    if(!valid)return `Minimum ${MIN_DONATION_PLN} zł`;
    if(!selectedMethod.connected)return "Metoda wymaga podłączenia";
    if(!resolvedPaymentLink)return "Płatności twórcy nieaktywne";
    return `Wpłać ${amount.toFixed(0)} zł`;
  },[amount,valid,resolvedPaymentLink,selectedMethod.connected]);

  function pay(){if(!canPay||!resolvedPaymentLink)return;window.open(resolvedPaymentLink,"_blank","noopener,noreferrer");}

  return <div className="donationCard" id="wplata">
    <div className="creatorMini"><div className="avatarOrb">DS</div><div><strong>@{username}</strong><span>{displayName} · LIVE</span></div></div>
    <div className="tabs"><button className="active">Wpłata</button><button>Głosówka</button><button>Wiadomość</button></div>
    <label className="fieldLabel">Kwota (min. 50 PLN)</label>
    <div className="amountField"><input aria-label="Kwota wpłaty" type="number" min="50" step="1" value={amount} onChange={(e)=>setAmount(Number(e.target.value))}/><span>PLN</span></div>
    <div className="quickAmounts">{[50,100,200,500].map(v=><button key={v} className={amount===v?"selected":""} onClick={()=>setAmount(v)}>{v} zł</button>)}</div>
    <label className="fieldLabel">Wiadomość (opcjonalnie)</label><textarea maxLength={255} value={message} onChange={(e)=>setMessage(e.target.value)} placeholder="Napisz coś miłego..." />
    <div className="voiceToggle"><button className={voice?"switch on":"switch"} onClick={()=>setVoice(v=>!v)} aria-label="Dodaj głosówkę"><span/></button><Mic size={17}/><span>Dodaj głosówkę / TTS</span></div>
    <div className="methodGrid">{methods.map(({name,Icon,connected})=><button key={name} onClick={()=>setSelected(name)} className={selected===name?"payMethod selected":"payMethod"}><Icon size={18}/><span>{name}</span><small>{connected?"od 50 PLN · test aktywny":"od 50 PLN · do podłączenia"}</small></button>)}</div>
    <button onClick={pay} disabled={!canPay} className="button primary wide">{buttonText}</button>
    <p className="microcopy">Próg dla każdej metody: 50 PLN. Aktualne konto Stripe ma aktywną płatność kartą; BLIK, przelewy, PayPal, paysafecard i SMS-y są przygotowane w interfejsie, ale wymagają osobnych uprawnień lub operatorów.</p>
    <div className="messagePreview"><MessageSquareText size={16}/><span>{message||"Twoja wiadomość pojawi się tutaj."}</span></div>
  </div>;
}
