# LinkTalk repository instructions

## Project summary

- LinkTalk is a messenger-style communication app delivered as one shared web codebase for desktop browsers, mobile browsers, PWA install, and a thin Android WebView wrapper.
- The repository is mostly static frontend files in the root (`index.html`, `styles.css`, `app.js`, `app-enhancements.js`, `service-worker.js`, `manifest.webmanifest`) plus Android wrapper files in `android/`, Supabase assets in `supabase/`, deployment scripts in `ovh/`, and GitHub Actions workflows in `.github/workflows/`.
- User-facing copy should stay in Polish unless a task explicitly asks for another language.

## Product and UX rules

- Keep the visual direction close to a modern dark messenger interface, but do not copy Messenger branding, names, or proprietary assets.
- Prefer shipping real working states over demos or placeholder panels.
- Preserve the current product shape: conversations, 1:1 chat, groups, notifications, settings, profile, install/download flow, offline hints, and account verification.
- Reuse the existing stack and file structure. Do not introduce React, Vue, Tailwind, build tooling, or a new framework unless the task explicitly requires it.
- Use Lucide icons when icons are needed.
- Keep mobile and desktop layouts aligned with the existing shell and bottom navigation patterns.

## Auth, data, and security rules

- Never expose Supabase `service_role` or any secret key in public client code.
- Public client configuration belongs in `config.js` / `config.example.js` and must use the publishable client key only.
- Login and signup use Supabase Auth. Keep human-readable auth errors in `app.js`.
- Private personal data must stay behind the existing private-profile flow and server-side vault pattern. Do not move PESEL, address, or phone data into broadly readable UI tables.
- If changing verification flows, preserve support for email confirmation, optional phone verification, and clear handling of rate limit (`429`) states.

## Frontend implementation rules

- `index.html`, `styles.css`, `app.js`, `app-enhancements.js`, `service-worker.js`, and `manifest.webmanifest` are the primary frontend files.
- When changing app-shell assets or first-load behavior, keep cache-busting consistent:
  - update the static asset query strings in `index.html`
  - update `window.LINKTALK_BUILD` in `index.html`
  - update `BUILD_VERSION` / cache naming in `service-worker.js`
  - keep `app.js` aware of the current build version if the change affects refresh behavior
- Preserve the manual refresh path (`Wymus odswiezenie`) so users can break stale service-worker caches.
- Keep APK detection practical: a small debug APK may still be valid, so do not assume production-scale file sizes.

## Android and CI rules

- The Android wrapper is a minimal WebView host for the public app URL. Avoid inventing native business logic when the web app should stay the source of truth.
- Keep Android aligned with:
  - JDK 17
  - Android Gradle Plugin 8.7.3
  - Gradle 8.9
  - Android Build Tools 34.0.0
- GitHub Actions workflows to preserve:
  - `.github/workflows/pages.yml` for GitHub Pages deploy
  - `.github/workflows/deploy-ovh.yml` for OVH release packaging/deploy
  - `.github/workflows/android-apk.yml` for APK artifact builds

## Deployment and release rules

- Public web release is served from GitHub Pages and custom domain `https://linktalk.pl/`.
- Public APK download should resolve through `https://linktalk.pl/downloads/linktalk-debug.apk`.
- `health.json` is used as a simple release indicator. Keep it accurate when touching publication workflows.
- OVH packaging is built from `ovh/make-ovh-package.ps1`. If Android output is missing, prefer an existing valid download fallback over publishing a broken APK.

## Validation steps

- For frontend syntax validation, run:
  - `node --check app.js`
  - `node --check service-worker.js`
- For local browser preview, use:
  - `powershell -NoProfile -ExecutionPolicy Bypass -File .\serve-local.ps1`
  - preview URL: `http://127.0.0.1:4173/`
- For OVH release packaging, use:
  - `powershell -NoProfile -ExecutionPolicy Bypass -File .\ovh\make-ovh-package.ps1`
- When a change affects the first screen or install flow, validate both:
  - the local preview
  - the public domain with a cache-busting query string, for example `https://linktalk.pl/?fresh=<build>`

## Change style

- Keep edits focused and incremental.
- Do not revert user work that is unrelated.
- Prefer concrete fixes over large refactors.
- If a task mentions GitHub Copilot, align outputs with these repo instructions and the prompt files in `.github/prompts/`.
