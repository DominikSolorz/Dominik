---
applyTo: "**/*.{html,css,js,webmanifest}"
excludeAgent: "code-review"
---

# LinkTalk frontend instructions

## Scope

These instructions apply when working on the static web app shell, layout, interaction polish, PWA behavior, and install/download experience.

## UI direction

- Build toward a premium dark messenger feel: calm, dense, readable, and mobile-first where needed.
- Keep the visual hierarchy close to a modern communication app:
  - strong conversation list
  - clear active chat header
  - compact composer with useful actions
  - recognizable mobile bottom navigation
- Avoid marketing-style hero sections, generic SaaS cards, decorative gradients without purpose, or placeholder copy that explains features instead of showing them.

## Frontend constraints

- Keep the app framework-free. Work within the current HTML, CSS, and browser JS setup.
- Reuse existing DOM IDs and flows where possible before adding new UI.
- Prefer editing `styles.css` and small targeted DOM/render changes over rewriting the app structure.
- Keep user-facing strings in Polish.
- Preserve accessibility basics: button labels, readable contrast, touch-size controls.

## PWA and cache rules

- If you change first-load assets, install behavior, or the auth landing screen, update versioning consistently so stale service-worker caches do not leave users on old UI.
- Preserve the visible manual refresh path for installed/stale sessions.

## What “done” looks like

- The change is visibly different where intended.
- Desktop and mobile both remain readable.
- The first load still works with `config.js`.
- `node --check app.js` and `node --check service-worker.js` still pass.
