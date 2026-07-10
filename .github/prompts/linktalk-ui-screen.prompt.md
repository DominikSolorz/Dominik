---
agent: "agent"
description: "Create or refine a LinkTalk screen in the current messenger style"
---

You are improving LinkTalk, a messenger-style app with a dark premium communication UI.

Target screen or feature: ${input:target:Which screen or UI area should be changed?}
Files in scope: ${input:files:Which files should Copilot focus on?}
Main user goal: ${input:goal:What should feel better or work better for the user?}

Requirements:

- Stay within the existing stack: HTML, CSS, browser JavaScript, no new framework.
- Keep the result visually close to a modern messenger layout, but do not introduce Messenger branding or copyrighted assets.
- Keep user-facing copy in Polish.
- Prefer a real working state over decorative placeholders.
- Preserve responsive behavior for desktop and mobile.
- Reuse existing patterns, IDs, and components where possible.
- If the change affects first-load assets or install UX, keep cache/version refresh behavior in mind.

Deliver:

1. a short implementation plan
2. the concrete code changes
3. any validation steps that should be run
4. a short summary of the visible user impact
