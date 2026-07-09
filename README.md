# LinkTalk

Niezalezny komunikator PWA pod laptop, WWW, Android i iPhone.

## Uruchomienie

Aplikacja wymaga prawdziwego backendu Supabase i nie tworzy rozmow bez bazy danych.

1. Utworz projekt w Supabase.
2. W SQL Editor uruchom `supabase-schema.sql`.
3. W Supabase Auth wlacz rejestracje email i potwierdzanie email dla publicznej sieci.
4. Skopiuj `config.example.js` do `config.js`.
5. Wpisz `supabaseUrl`, `supabaseAnonKey` / publishable key i `publicAppUrl`.
6. Wgraj `supabase/functions/transcribeVoiceMessage/index.ts` jako Edge Function `transcribeVoiceMessage`.
7. Wgraj `supabase/functions/privateProfileVault/index.ts` jako Edge Function `privateProfileVault`.
8. Dodaj sekrety Edge Function: `OPENAI_API_KEY`, opcjonalnie `OPENAI_TRANSCRIBE_MODEL=gpt-4o-mini-transcribe`. Dla sejfu danych prywatnych mozesz opcjonalnie dodac `PRIVATE_PROFILE_VAULT_KEY`; bez tego funkcja wyprowadza klucz z sekretu serwerowego Supabase.
9. W `Authentication -> Providers -> Phone` wlacz Phone Auth i dostawce SMS lub `Send SMS Hook`, jesli chcesz potwierdzac telefony kodem SMS.
10. W `Authentication -> Email Templates` wklej szablony z katalogu `supabase/email-templates/`.
11. Otworz `index.html` albo wrzuc pliki na hosting HTTPS.

## Jeden link dla PC i telefonu

Rekomendowany uklad:

```text
GitHub repo + GitHub Pages = publiczny adres URL aplikacji
Supabase = konta, logowanie, rozmowy, pliki, audio i baza danych
Telefon/PC = ta sama aplikacja otwierana z jednego linku
```

Uzytkownik nie potrzebuje publicznego IP. Potrzebny jest publiczny adres strony, np. `https://linktalk.pl/`.

Po wrzuceniu tego katalogu do repozytorium GitHub na branch `main`, workflow `.github/workflows/pages.yml` publikuje statyczna aplikacje przez GitHub Pages. W ustawieniach repozytorium wybierz `Settings -> Pages -> Source: GitHub Actions`.

To jest glowny tryb 24/7 dla produkcji: GitHub Pages trzyma stale wlaczona strone, Supabase trzyma dane i logowanie, a nowe zmiany wpadaja po samym pushu do `main`. Nie trzeba recznie podnosic hostingu po kazdej zmianie.

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

Supabase Auth przechowuje login, email, haslo, sesje oraz znaczniki potwierdzenia emaila i telefonu. Publiczna tabela `profiles` przechowuje tylko dane potrzebne w komunikatorze: nazwe profilu, username, status, avatar i ustawienia czatu.

Komunikator rozdziela dane prywatne od zwyklego profilu czatu:

- `profiles` - publiczny profil do rozmow
- `profile_private` - znacznik zgody i zgodnosc ze starszym zapisem
- `profile_private_vault` - szyfrowany sejf z danymi prywatnymi, zapisywany przez Edge Function `privateProfileVault`

Sejf trzyma dane osobowe:

- `full_name` - imie i nazwisko
- `phone` - numer telefonu
- `home_address` - adres zamieszkania
- `pesel` - PESEL, widoczny w aplikacji jako zamaskowany
- `data_consent_at` - czas pierwszego zapisu danych osobowych

Klient nie czyta telefonu, adresu ani PESEL bezposrednio z tabeli. Odczyt i zapis przechodzi przez `privateProfileVault`, ktory zwraca rekord tylko zalogowanemu uzytkownikowi po weryfikacji JWT.

Jesli podczas testow rejestracja zwraca `429 Too Many Requests`, najczesciej blokuje ja wysylka maila potwierdzajacego przez domyslnego mailera Supabase. Do prywatnych testow mozna tymczasowo wylaczyc `Authentication -> Providers -> Email -> Confirm email`; docelowo lepiej wlaczyc potwierdzanie email i ustawic wlasny SMTP.

Email wyglada profesjonalniej i dziala stabilniej po ustawieniu:

- `Authentication -> URL Configuration -> Site URL` = publiczny adres aplikacji
- `Authentication -> URL Configuration -> Redirect URLs` = `https://linktalk.pl/**`, `https://twoj-login.github.io/**` lub aktualny URL testowy
- `Authentication -> Emails -> SMTP Settings` = wlasny SMTP, np. Brevo, Resend, Mailgun
- `Authentication -> Email Templates` = wlasny HTML z logo LinkTalk, np. `supabase/email-templates/confirmation.html`

Telefon mozna potwierdzac kodem SMS po ustawieniu:

- `Authentication -> Providers -> Phone` = ON
- dostawcy SMS (np. Twilio, Vonage, MessageBird, Textlocal) albo `Send SMS Hook`
- publicznego adresu aplikacji, aby po potwierdzeniu emaila uzytkownik mogl zalogowac sie i dokonczyc weryfikacje telefonu

W obecnym interfejsie rejestracja dziala tak:

1. uzytkownik wpisuje email, haslo, imie i nazwisko oraz numer telefonu
2. dostaje mail potwierdzajacy z przyciskiem i 6-cyfrowym kodem
3. po pierwszym zalogowaniu otwiera sie centrum weryfikacji telefonu SMS
4. po weryfikacji numer trafia do prywatnego sejfu danych

## GitHub Pages

Workflow `.github/workflows/pages.yml` publikuje strone z katalogu `dist`. Przy kazdym pushu do `main`:

- sklada statyczna wersje WWW,
- probuje zbudowac swiezy APK Android,
- publikuje jedna publiczna wersje strony i pliku APK,
- wystawia `health.json` z czasem ostatniego builda.

Jesli w repozytorium ustawisz zmienne `SUPABASE_URL` i `SUPABASE_ANON_KEY` w `Settings -> Secrets and variables -> Actions -> Variables`, workflow sam wygeneruje poprawny `config.js` dla publicznego linku.

Jesli w repo jest plik `CNAME`, workflow traktuje te domene jako glowny adres produkcyjny.

Po publikacji link bedzie mial ksztalt:

```text
https://TWOJ_LOGIN.github.io/NAZWA_REPO/
```

Przy wlasnej domenie ustaw jednorazowo:

- `Settings -> Pages -> Custom domain` = `linktalk.pl`
- poprawne rekordy DNS domeny na GitHub Pages
- po wystawieniu certyfikatu `Enforce HTTPS = ON`

Jesli `https://linktalk.pl/` pokazuje zly certyfikat albo blad HTTPS, to problem lezy w konfiguracji GitHub Pages dla domeny, nie w samym kodzie aplikacji.

## Android APK

Katalog `android/` zawiera prosta aplikacje Android WebView, ktora otwiera ten sam link GitHub Pages. Workflow `.github/workflows/android-apk.yml` zostawiamy do recznego uruchomienia, jesli chcesz osobno pobrac artifact APK z GitHub Actions. Standardowy publiczny link do APK aktualizuje workflow Pages.

Publiczny link do pobrania testowego APK po wdrozeniu Pages:

```text
https://linktalk.pl/downloads/linktalk-debug.apk
```

Po uruchomieniu workflow pobierz plik:

```text
Actions -> Build LinkTalk Android APK -> artifact linktalk-debug-apk -> app-debug.apk
```

To jest APK debug do prywatnego testu. Do publikacji poza testami trzeba zrobic podpisany release APK/AAB.

## Co zawiera

- logowanie i rejestracja Supabase Auth
- potwierdzanie emaila linkiem lub kodem OTP z maila
- centrum weryfikacji numeru telefonu kodem SMS po pierwszym logowaniu
- profile, username, status, potwierdzenia odczytu i auto-transkrypcja
- prywatne dane osobowe w szyfrowanym `profile_private_vault`
- rozmowy 1 na 1 oraz grupy
- znajomi, prosby o kontakt i lista kontaktow
- realne wiadomosci z tabeli `messages`
- reakcje, przypinanie wiadomosci, archiwum i odczytano
- prywatne pliki w Supabase Storage `chat-files` przez signed URLs
- wiadomosci glosowe nagrywane w przegladarce
- transkrypcja audio przez Supabase Edge Function i OpenAI
- tapety i motywy czatu zapisywane w bazie
- blokowanie, zgloszenia i panel admin/moderator
- manifest PWA i service worker z cache aplikacji, `config.js` i podstawowych zaleznosci CDN
- ostatnio zsynchronizowane rozmowy zapisane lokalnie do pracy offline
- kolejka wiadomosci tekstowych offline, ktora wysyla sie po powrocie internetu

## Offline

Po pierwszym poprawnym zaladowaniu aplikacji strona zapamietuje:

- ostatnie listy rozmow i wiadomosci na danym urzadzeniu,
- podstawowe pliki aplikacji WWW,
- teksty napisane bez internetu.

Gdy internet zniknie:

- WWW nadal moze pokazac ostatnio zapisane rozmowy,
- nowe wiadomosci tekstowe sa oznaczone jako zapisane offline,
- po powrocie sieci aplikacja probuje sama wyslac zalegle teksty na serwer.

## Admin

Po utworzeniu pierwszego konta ustaw admina w SQL:

```sql
update public.profiles
set role = 'admin'
where username = 'twoj-username';
```

## Mobile

Na start aplikacja jest PWA i dodatkowo ma projekt Android WebView do APK. iPhone uzywa PWA przez Safari; natywna aplikacja iOS przez TestFlight/App Store to osobny etap.
