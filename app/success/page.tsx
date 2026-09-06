import Link from "next/link";
import { Brand } from "@/components/Brand";
export default function Success(){return <main className="successPage"><Brand/><div><h1>Dziękujemy za wsparcie 💜</h1><p>Płatność testowa została zakończona. Po podłączeniu webhooka Stripe zdarzenie będzie automatycznie zapisywane i pokazywane w OBS.</p><Link href="/c/dominik-demo" className="button primary">Wróć do strony twórcy</Link></div></main>}
