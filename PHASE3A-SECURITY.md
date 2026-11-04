# Phase 3A — mock hybrid architecture and security gate

This is **not AI integration**. The mock provider runs entirely in the browser and delegates to the existing deterministic rule engine. The purpose is to verify provider switching, result validation and fallback without external transmission or charges. UI labels explicitly identify the mock.

## Security posture
- No API keys, secrets, authentication, or external inference requests exist in this build.
- Existing projects and analyses remain in browser localStorage. Treat shared devices/browser extensions as a privacy risk.
- Input limits are checked before analysis; returned mock results are schema-checked. This is not a replacement for server-side validation.
- Do **not** deploy an unauthenticated paid inference endpoint. A frontend token, CORS, hidden route, and browser-only throttling are **not** sufficient protection.
- Before enabling real AI: implement server-side auth, persistent rate limits, per-user quotas, budget alerts/kill switch, server-side validation, timeouts, safe error handling, and no raw-agreement logging. Obtain explicit consent for third-party processing and document retention.
- Treat client-supplied agreement/request as untrusted data; never execute its instructions. AI output must be validated and reviewed by a human.
- Browser fallback is resilient but should be visibly labelled as rules, never as an AI result.

## Acceptance criteria
1. Rule-based mode remains the default.
2. Hybrid mock mode is clearly labelled, never calls a network endpoint, and yields the same analysis as rules.
3. Invalid or failed mock response triggers rule fallback.
4. Legacy saved analyses remain compatible. The engine badge is shown only for the current run, not inferred for old snapshots.
5. Tests, build and lint pass before any release.

## Next milestone (not included)
Build a server-only provider adapter and access-controlled endpoint, opt-in transmission, strict response schema, durable quotas, provider budget caps and a 50-case evaluation suite. No real API credentials should be placed in VITE_* variables.
