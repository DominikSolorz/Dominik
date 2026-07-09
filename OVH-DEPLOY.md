## OVH deployment

To wdrozenie jest przygotowane pod Twoj VPS w OVH:

- host VPS: `vps-a3ea02a0.vps.ovh.net`
- IPv4: `146.59.93.168`
- IPv6: `2001:41d0:601:1100::22f3`
- system: `Ubuntu 26.04`
- docelowa domena: `linktalk.pl`

## Aktualny stan

- port `22/SSH` odpowiada z internetu
- port `80/HTTP` jest odrzucony
- port `443/HTTPS` jest odrzucony
- klucz SSH z repo nie jest obecnie autoryzowany na VPS, wiec automatyczny deploy nie przejdzie, dopoki poprawny klucz nie trafi na serwer albo do GitHub Secrets

## Co robi bootstrap

`ovh/bootstrap-vps.sh` po uruchomieniu:

1. instaluje `nginx`, `unzip`, `certbot`
2. rozpakowuje paczke do `/var/www/linktalk`
3. wystawia HTTP pod IP i domena
4. probuje wlaczyc HTTPS dla `linktalk.pl` i `www.linktalk.pl`, jesli DNS wskazuje na ten VPS
5. zostawia fallback po samym IP, dopoki domena albo certyfikat nie sa gotowe

## Pakiet do wrzucenia na VPS

Lokalnie uruchom:

```powershell
powershell -ExecutionPolicy Bypass -File .\ovh\make-ovh-package.ps1
```

To utworzy archiwum:

```text
ovh\release\linktalk-ovh-site.zip
```

Skrypt dorzuca tez:

- `downloads/linktalk-debug.apk`, jesli lokalnie istnieje zbudowany APK
- `downloads/bliskochat-debug.apk` jako zgodnosc wsteczna
- strone `downloads/index.html` do pobierania APK

## Reczny deploy z laptopa

```powershell
powershell -ExecutionPolicy Bypass -File .\ovh\deploy-local-to-ovh.ps1
```

Mozesz zmienic host, user, port i klucz, np.:

```powershell
powershell -ExecutionPolicy Bypass -File .\ovh\deploy-local-to-ovh.ps1 -User ubuntu -Port 22 -KeyPath C:\Users\Dell\.ssh\ovh_key
```

## Deploy z GitHuba

Workflow:

```text
.github/workflows/deploy-ovh.yml
```

Po pushu do `main` workflow:

1. buduje APK Android
2. sklada release WWW
3. pakuje `linktalk-ovh-site.zip`
4. wysyla release na VPS po SSH
5. uruchamia bootstrap po stronie serwera

### GitHub Secrets

- `OVH_SSH_HOST`
- `OVH_SSH_PORT`
- `OVH_SSH_USER`
- `OVH_SSH_PRIVATE_KEY`

### GitHub Variables

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `PUBLIC_APP_URL` - najlepiej `https://linktalk.pl/`
- opcjonalnie `APK_URL` - jesli chcesz inny adres APK

## DNS i publiczny adres

Docelowo ustaw w OVH:

- `A` dla `linktalk.pl` -> `146.59.93.168`
- `AAAA` dla `linktalk.pl` -> `2001:41d0:601:1100::22f3`
- `CNAME` dla `www.linktalk.pl` -> `linktalk.pl`

Po poprawnym DNS i udanym certyfikacie aplikacja bedzie dzialala pod:

```text
https://linktalk.pl/
```

Do czasu az DNS i certyfikat beda gotowe, bootstrap zostawia dostep po IP:

```text
http://146.59.93.168/
```
