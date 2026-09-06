# DS Stream Support

Platforma wsparcia twórców: rejestracja/logowanie, własne strony wpłat, próg 50 PLN, panel twórcy, testowe płatności Stripe, alertbox OBS z Realtime, TTS, moderacja, cele i integracje.

## Stack
- Next.js / React / TypeScript
- Supabase Auth + Postgres + Row Level Security + Realtime + Edge Functions
- Stripe test mode
- Vercel deployment

## Działające elementy
- rejestracja i logowanie e-mail/hasło
- automatyczne tworzenie profilu twórcy
- publiczne strony `/c/[username]`
- twarde minimum 50 PLN dla wpłat i głosówek
- per-creator URL płatności (demo ma testowy Stripe Payment Link)
- panel: płatności, cele, integracje, profil, blokowane słowa
- bezpieczne RLS: publiczny widz nie może czytać historii wpłat
- OBS Browser Source `/overlay/[username]`
- Realtime alerty + polski browser TTS + odtwarzanie `voice_url`
- ręczna moderacja wpłat przez właściciela/moderatora
- testowa wpłata end-to-end (`stream-test-donation`) bez pobierania pieniędzy
- test alertu (`stream-test-alert`)
- bezpieczny publiczny RPC do agregatu celu bez ujawniania danych darczyńców

## Płatności
Stripe test Payment Link ma custom amount z minimum 50 PLN i pole wiadomości. Aktualna konfiguracja Stripe ma aktywną kartę; BLIK, P24/przelewy i PayPal są obecnie niedostępne na tym koncie Stripe, dlatego DS nie oznacza ich jako aktywnych. PayPal, paysafecard i płatności SMS wymagają osobnych operatorów/API.

Provider może być oznaczony jako `enabled` dopiero gdy backend ustawi `configured=true`. Właściciel konta nie może samodzielnie oznaczyć niepodłączonego operatora jako skonfigurowanego.

## Stripe webhook
Edge Function `stream-stripe-webhook` weryfikuje podpis Stripe, chroni przed duplikatami, zapisuje opłacone wpłaty, stosuje filtr zablokowanych słów i uruchamia zdarzenie OBS. Sekret podpisu webhooka ma być przechowywany poza repozytorium (Supabase Vault / secret manager).

## Supabase
Migracje są w `supabase/migrations`. Edge Functions są w `supabase/functions`.

## Lokalne uruchomienie
```bash
npm install
npm run dev
```

Publiczne zmienne Supabase mogą trafić do hostingu. Prywatne klucze i sekrety nigdy nie powinny być commitowane do GitHuba.

## Przed trybem LIVE
1. Dokończyć KYC/merchant onboarding operatorów płatności.
2. Włączyć wybrane metody (BLIK/P24/PayPal/paysafecard/SMS) dopiero po otrzymaniu dostępu od operatora.
3. Umieścić sekret Stripe webhook w bezpiecznym secret managerze.
4. Włączyć produkcyjny Stripe/PayPal dopiero po osobnej weryfikacji live-mode.
5. Skonfigurować domenę, politykę prywatności/regulamin i dane rozliczeniowe.
6. Dodać OpenAI API key do bezpiecznego środowiska, jeśli ma działać AI Moderator ponad obecny filtr regułowy.
