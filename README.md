# BliskoChat

Niezalezny komunikator PWA pod laptop, PC, Android i iPhone.

## Uruchomienie

Aplikacja wymaga prawdziwego backendu Supabase i nie tworzy rozmow bez bazy danych.

1. Utworz projekt w Supabase.
2. W SQL Editor uruchom `supabase-schema.sql`.
3. W Supabase Auth wlacz rejestracje email i potwierdzanie email dla publicznej sieci.
4. Skopiuj `config.example.js` do `config.js`.
5. Wpisz `supabaseUrl` i `supabaseAnonKey` / publishable key.
6. Wgraj `supabase/functions/transcribeVoiceMessage/index.ts` jako Edge Function `transcribeVoiceMessage`.
7. Dodaj sekrety Edge Function: `OPENAI_API_KEY`, opcjonalnie `OPENAI_TRANSCRIBE_MODEL=gpt-4o-mini-transcribe`.
8. Otworz `index.html` albo wrzuc pliki na hosting HTTPS.

## Jeden link dla PC i telefonu

Rekomendowany uklad:

```text
GitHub repo + GitHub Pages = publiczny adres URL aplikacji
Supabase = konta, logowanie, rozmowy, pliki, audio i baza danych
Telefon/PC = ta sama aplikacja otwierana z jednego linku
```

Uzytkownik nie potrzebuje publicznego IP. Potrzebny jest publiczny adres strony, np. `https://twoj-login.github.io/bliskochat/`.

Po wrzuceniu tego katalogu do repozytorium GitHub na branch `main`, workflow `.github/workflows/pages.yml` publikuje statyczna aplikacje przez GitHub Pages. W ustawieniach repozytorium wybierz `Settings -> Pages -> Source: GitHub Actions`.

Na PC uzytkownik otwiera ten link w Chrome/Edge. Na Androidzie otwiera link w Chrome i wybiera instalacje aplikacji. Na iPhonie otwiera link w Safari i dodaje do ekranu poczatkowego.

## Serwer danych

Model polaczenia:

```text
PC / Android APK / iPhone PWA
  -> GitHub Pages URL z aplikacja
  -> Supabase Auth, Database, Realtime i Storage
  -> Edge Function transcribeVoiceMessage
  -> OpenAI tylko do transkrypcji audio
```

GitHub nie przechowuje wiadomosci. GitHub przechowuje kod, publikuje strone i uruchamia budowanie APK. Supabase jest serwerem danych: konta, logowanie, rozmowy, wiadomosci, pliki, audio, blokady i zgloszenia.

## Rejestracja i dane osobowe

Supabase Auth przechowuje login, email, haslo i sesje. Publiczna tabela `profiles` przechowuje tylko dane potrzebne w komunikatorze: nazwe profilu, username, status, avatar i ustawienia czatu.

Prywatna tabela `profile_private` przechowuje dane osobowe:

- `full_name` - imie i nazwisko
- `phone` - numer telefonu
- `home_address` - adres zamieszkania
- `pesel` - PESEL, widoczny w aplikacji jako zamaskowany
- `data_consent_at` - czas pierwszego zapisu danych osobowych

RLS na `profile_private` pozwala czytac i zmieniac rekord tylko wlascicielowi konta albo adminowi. Dla publicznej aplikacji warto dodac szyfrowanie PESEL-u po stronie backendu i pelna polityke prywatnosci.

Jesli podczas testow rejestracja zwraca `429 Too Many Requests`, najczesciej blokuje ja wysylka maila potwierdzajacego przez domyslnego mailera Supabase. Do prywatnych testow mozna tymczasowo wylaczyc `Authentication -> Providers -> Email -> Confirm email`; docelowo lepiej wlaczyc potwierdzanie email i ustawic wlasny SMTP.

## GitHub Pages

Workflow `.github/workflows/pages.yml` publikuje strone z katalogu `dist`. Jesli w repozytorium ustawisz zmienne `SUPABASE_URL` i `SUPABASE_ANON_KEY` w `Settings -> Secrets and variables -> Actions -> Variables`, workflow sam wygeneruje poprawny `config.js` dla publicznego linku.

Po publikacji link bedzie mial ksztalt:

```text
https://TWOJ_LOGIN.github.io/NAZWA_REPO/
```

## Android APK

Katalog `android/` zawiera prosta aplikacje Android WebView, ktora otwiera ten sam link GitHub Pages. Workflow `.github/workflows/android-apk.yml` buduje APK w chmurze GitHub Actions.

Publiczny link do pobrania testowego APK po wdrozeniu Pages:

```text
https://dominiksolorz.github.io/Dominik/downloads/bliskochat-debug.apk
```

Po uruchomieniu workflow pobierz plik:

```text
Actions -> Build BliskoChat Android APK -> artifact bliskochat-debug-apk -> app-debug.apk
```

To jest APK debug do prywatnego testu. Do publikacji poza testami trzeba zrobic podpisany release APK/AAB.

## Co zawiera

- logowanie i rejestracja Supabase Auth
- profile, username, status, potwierdzenia odczytu i auto-transkrypcja
- prywatne dane osobowe w `profile_private`
- rozmowy 1 na 1 oraz grupy
- znajomi, prosby o kontakt i lista kontaktow
- realne wiadomosci z tabeli `messages`
- reakcje, przypinanie wiadomosci, archiwum i odczytano
- prywatne pliki w Supabase Storage `chat-files` przez signed URLs
- wiadomosci glosowe nagrywane w przegladarce
- transkrypcja audio przez Supabase Edge Function i OpenAI
- tapety i motywy czatu zapisywane w bazie
- blokowanie, zgloszenia i panel admin/moderator
- manifest PWA i service worker bez cache'owania `config.js`

## Admin

Po utworzeniu pierwszego konta ustaw admina w SQL:

```sql
update public.profiles
set role = 'admin'
where username = 'twoj-username';
```

## Mobile

Na start aplikacja jest PWA i dodatkowo ma projekt Android WebView do APK. iPhone uzywa PWA przez Safari; natywna aplikacja iOS przez TestFlight/App Store to osobny etap.
