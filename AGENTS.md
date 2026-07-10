# LinkTalk agent instructions

## Mission

Work on LinkTalk as a real communication product, not a throwaway demo. Favor working flows, visible UI improvements, and deployable results.

## Codebase map

- Web app shell: `index.html`, `styles.css`, `app.js`, `app-enhancements.js`
- PWA/offline: `service-worker.js`, `manifest.webmanifest`
- Android wrapper: `android/`
- Supabase assets: `supabase/`
- Deployment scripts: `ovh/`
- CI/CD: `.github/workflows/`

## Operating rules

- Keep changes small, direct, and compatible with the existing no-framework frontend.
- Preserve Polish user-facing text unless asked otherwise.
- Never expose private or secret backend credentials in client code.
- If changing first-load assets, remember that stale service-worker caches exist. Keep build/version refresh paths in sync.
- When touching auth or private profile logic, keep Supabase Auth and the private-data vault pattern intact.

## Validation

- Use `node --check app.js` and `node --check service-worker.js` for quick JS validation.
- Use `powershell -NoProfile -ExecutionPolicy Bypass -File .\serve-local.ps1` for local preview on `http://127.0.0.1:4173/`.
- Treat public verification on `https://linktalk.pl/` as separate from local preview verification.
