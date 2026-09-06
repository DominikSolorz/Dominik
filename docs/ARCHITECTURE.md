# DS Stream Support — architektura

## Główny przepływ wpłaty

1. Widz otwiera publiczny profil twórcy `/c/[username]`.
2. Front pobiera tylko publiczne dane profilu, aktywne metody i agregaty celu/rankingu przez RLS/RPC.
3. Płatność przechodzi przez operatora. Obecny demo flow używa Stripe Payment Link w trybie testowym z minimum 50 PLN.
4. Stripe wysyła podpisany webhook do `stream-stripe-webhook`.
5. Edge Function weryfikuje HMAC, limit 50 PLN, profil, duplikaty i pola prywatności.
6. Wiadomość przechodzi filtr blokowanych słów. Rekord trafia do `stream_donations`.
7. Gdy `status=paid` i `moderation_status=approved`, trigger tworzy wpis `stream_events`.
8. Supabase Realtime publikuje nowy event do Browser Source OBS.
9. Overlay pokazuje alert, może odczytać tekst po polsku TTS lub odtworzyć `voice_url`.

## Bezpieczeństwo

- RLS jest włączony na tabelach biznesowych.
- Anonimowy widz nie może czytać `stream_donations` ani danych rozliczeniowych.
- Moderator nie ma bezpośredniego SELECT do prywatnej tabeli wpłat; korzysta z ograniczonej Edge Function `stream-moderation-queue`.
- Provider może zostać włączony przez twórcę tylko jeśli backend wcześniej ustawi `configured=true`.
- Sekrety nie trafiają do GitHuba ani publicznego JS.
- Stripe webhook używa tajnego signing secret pobieranego przez `stream_get_secret` z bezpiecznego magazynu.
- Ranking jest opt-in (`show_in_ranking`) i nie pokazuje anonimowych wpłat.

## Moduły

- `stream_profiles` — profil, linki, motyw, progi.
- `stream_payment_methods` — widoczne metody i stan konfiguracji.
- `stream_provider_accounts` — zewnętrzne konta operatorów/KYC.
- `stream_donations` — prywatna historia wpłat.
- `stream_events` — krótkotrwały publiczny kanał eventów dla overlayu.
- `stream_goals` — cele wpłat.
- `stream_alert_settings` — konfiguracja OBS/TTS.
- `stream_integrations` — integracje twórcy.
- `stream_moderators` — ograniczone uprawnienia moderacyjne.
- `stream_blocked_terms` — filtr słów.

## Edge Functions

- `stream-test-alert` — test Realtime/OBS.
- `stream-test-donation` — test całego flow bez pobierania pieniędzy.
- `stream-stripe-webhook` — zapis opłaconych checkoutów Stripe.
- `stream-moderate-donation` — bezpieczna decyzja approve/reject.
- `stream-moderation-queue` — prywatnościowy widok kolejki moderatora.
- `stream-manage-moderators` — zarządzanie moderatorami przez właściciela.

## Publiczne RPC

- `stream_public_goal_progress(username)` — tylko agregat celu.
- `stream_public_ranking(username, limit)` — ranking wyłącznie po zgodzie darczyńcy.

## Prywatne RPC

- `stream_creator_stats()` — pełne statystyki tylko właściciela.
- `stream_set_payment_method_enabled()` — bezpieczne przełączanie skonfigurowanej metody.

## Zewnętrzne blokery przed LIVE

Pełne live payments wymagają weryfikacji/KYC każdego operatora, bezpiecznego zapisania webhook secret, produkcyjnych kluczy i decyzji dotyczących payoutów/fee. AI Moderator wymaga bezpiecznie skonfigurowanego OpenAI API key. Kod nie udaje, że provider jest aktywny, dopóki naprawdę nie jest skonfigurowany.
