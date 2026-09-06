# DS Stream Support

Platforma wsparcia twórców: rejestracja/logowanie, własne strony wpłat, próg 50 PLN, Stripe test Checkout, panel twórcy, alertbox OBS, głosówki, integracje i moderacja.

## Obecny stan
- Next.js / React
- Supabase Auth + Postgres + RLS + Realtime
- demo twórcy: `/c/dominik-demo`
- OBS: `/overlay/dominik-demo`
- Stripe test Payment Link: minimum 50 PLN, kwota ustalana przez widza
- BLIK/karta/przelew/PayPal/paysafecard/SMS są reprezentowane w panelu; faktyczna dostępność zależy od operatorów i konfiguracji konta.

## Uruchomienie
`npm install` oraz `npm run dev`.

Prywatne sekrety nie są zapisywane w repozytorium.