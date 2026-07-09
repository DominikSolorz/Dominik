# Szablony maili LinkTalk

Te pliki sa gotowe do wklejenia w panelu:

`Supabase -> Authentication -> Email Templates`

## Co wkleic

- `confirmation.html` -> **Confirm signup**
- `recovery.html` -> **Reset password**

## Ustawienia, ktore trzeba dopiac

1. `Authentication -> URL Configuration -> Site URL` ustaw na publiczny adres aplikacji, np. `https://linktalk.pl/`
2. `Authentication -> URL Configuration -> Redirect URLs` dodaj:
   - `https://linktalk.pl/**`
   - ewentualny adres testowy GitHub Pages
3. `Authentication -> Emails -> SMTP Settings` ustaw wlasny SMTP, zeby maile wychodzily od Waszej domeny
4. W szablonie potwierdzenia zostaw:
   - `{{ .ConfirmationURL }}` dla klikniecia w przycisk
   - `{{ .Token }}` dla 6-cyfrowego kodu wpisywanego recznie w aplikacji

## SMS

Kod telefonu nie jest wysylany z tych szablonow. Dla SMS skonfiguruj:

- `Authentication -> Providers -> Phone`
- dostawce SMS lub `Send SMS Hook`

W aplikacji LinkTalk po pierwszym zalogowaniu otwiera sie centrum weryfikacji konta, gdzie uzytkownik wpisuje kod SMS.
