---
agent: "agent"
description: "Implement or fix LinkTalk auth, registration, verification, and profile flows"
---

Work on the LinkTalk authentication and account flow.

Task: ${input:task:What auth or verification problem should be solved?}
Files in scope: ${input:files:Which files or folders should Copilot inspect first?}
Expected result: ${input:result:What should the user be able to do after the fix?}

Rules:

- Use the current Supabase Auth approach.
- Do not expose service-role or secret keys in client code.
- Keep human-readable Polish auth errors.
- Preserve support for:
  - email signup/login
  - email confirmation handling
  - 429/rate-limit guidance
  - optional phone verification by SMS
  - legal consent fields
- Private personal data must stay behind the private profile / vault flow, not be moved into a broadly readable public table.

Deliver:

1. the likely root cause
2. the exact code changes
3. any required Supabase or workflow follow-up
4. how to validate the flow end to end
