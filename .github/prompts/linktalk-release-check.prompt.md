---
agent: "agent"
description: "Check LinkTalk web release, APK path, cache freshness, and deployment health"
---

Review the current LinkTalk release state and prepare a safe fix if needed.

Release surface: ${input:surface:Which release surface is the priority? Example: GitHub Pages, linktalk.pl, OVH, APK, or all}
Known symptom: ${input:symptom:What looks broken or stale right now?}

Focus on:

- public web page content
- `health.json`
- APK download visibility and validity
- workflow reliability
- cache-busting and service-worker freshness
- consistency between local preview, GitHub Pages, and public domain

Deliver:

1. what is actually current vs stale
2. which file or workflow is responsible
3. the minimal fix
4. the exact validation checklist after deployment
