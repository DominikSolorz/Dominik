"use client";
import Link from "next/link";
import { Brand } from "./Brand";

export function SiteHeader() {
  return (
    <header className="topbar">
      <Link href="/" className="brandLink"><Brand /></Link>
      <nav className="navLinks" aria-label="Główna nawigacja">
        <a href="#funkcje">Funkcje</a><a href="#tworcy">Dla twórców</a><a href="#bezpieczenstwo">Bezpieczeństwo</a>
      </nav>
      <div className="headerActions">
        <Link className="button ghost small" href="/auth?mode=login">Zaloguj się</Link>
        <Link className="button primary small" href="/auth?mode=register">Zarejestruj się</Link>
      </div>
    </header>
  );
}
