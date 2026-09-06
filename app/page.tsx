import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { DonationCard } from "@/components/DonationCard";
import { FeatureStrip } from "@/components/FeatureStrip";
import { DashboardPreview } from "@/components/DashboardPreview";
import { BellRing, MessageCircleMore, ShieldCheck, Sparkles } from "lucide-react";

export default function Home(){
  return <main>
    <SiteHeader/>
    <section className="hero">
      <div className="heroCopy">
        <h1>Twoje wsparcie.<br/><span>Ich pasja.</span></h1>
        <p>Szybkie wpłaty od 50 zł z wiadomościami, głosówkami i alertami na żywo — zbudowane dla polskich twórców.</p>
        <div className="platforms"><span>Twitch</span><span>YouTube</span><span>TikTok</span><span>Discord</span><span>OBS</span></div>
        <div className="heroActions"><a href="#wplata" className="button primary">Wesprzyj twórcę</a><Link href="/c/dominik-demo" className="button ghost">Zobacz stronę demo</Link></div>
        <div className="proof"><div><strong>50 PLN</strong><span>minimalna wpłata</span></div><div><strong>8</strong><span>metod w panelu</span></div><div><strong>24/7</strong><span>alerty OBS</span></div></div>
      </div>
      <div className="heroVisual"><div className="glow one"/><div className="glow two"/><div className="streamScene"><div className="sceneTop"><Sparkles size={20}/><span>LIVE STREAM</span></div><div className="scenePerson"><div className="personHead"/><div className="personBody"/></div><div className="floatingAlert"><BellRing size={19}/><div><strong>Nowa wpłata!</strong><span>Kamil · 100 PLN</span></div></div><div className="floatingBubble"><MessageCircleMore size={18}/> Dzięki! 💜</div></div></div>
      <DonationCard/>
    </section>
    <FeatureStrip/>
    <DashboardPreview/>
    <section className="trust" id="bezpieczenstwo"><div><ShieldCheck size={34}/><h2>Bezpieczeństwo od początku</h2><p>Konta twórców są izolowane przez Row Level Security w bazie. Wpłaty są zapisywane przez zaufany backend, a widz nie potrzebuje konta do wsparcia twórcy.</p></div><div className="trustList"><span>Rejestracja i logowanie Supabase</span><span>RLS dla danych wielu twórców</span><span>Stripe w trybie testowym do uruchomienia płatności</span><span>Alertbox OBS z Realtime</span><span>Moderacja wiadomości i głosówek</span></div></section>
    <footer><strong>DS Stream Support</strong><span>Projekt demonstracyjny · Polska</span></footer>
  </main>
}
