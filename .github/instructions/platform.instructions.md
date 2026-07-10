---
applyTo: "**/*.{yml,ps1,gradle,properties,java}"
excludeAgent: "code-review"
---

# LinkTalk platform instructions

## Scope

These instructions apply to GitHub Actions, deployment scripts, Android wrapper files, and release packaging.

## Build and release rules

- Keep GitHub Pages as the main always-on public release surface.
- Keep OVH packaging as a deployable mirror or server-hosted variant, not a separate product.
- Prefer robust fallbacks over publishing broken artifacts. If a fresh APK build is unavailable, use an existing valid APK only when the release flow already supports that fallback.

## Android wrapper rules

- The Android app is a WebView wrapper around the public LinkTalk URL.
- Do not move core messaging logic into native Android code.
- Keep compatibility aligned with JDK 17, Gradle 8.9, AGP 8.7.3, and Android Build Tools 34.0.0.

## Workflow rules

- Avoid introducing extra CI complexity unless it directly improves reliability.
- When changing workflows, preserve:
  - generated `config.js` for production
  - APK publication path under `downloads/`
  - `health.json`
  - custom domain compatibility

## Validation

- For Android or workflow changes, document whether validation was local, CI-only, or both.
- If Android SDK is unavailable locally, say so clearly rather than pretending the APK was verified end to end.
