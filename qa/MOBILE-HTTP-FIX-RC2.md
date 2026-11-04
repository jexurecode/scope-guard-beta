# v0.9.1 RC2 — Mobile Create Project on HTTP LAN

## Confirmed cause

The project and analysis creation paths called `crypto.randomUUID()` unconditionally. This API is restricted to secure contexts. Desktop localhost is trusted, while a phone opening the development server through a plain HTTP LAN address usually is not. The exception escaped the project-creation click handler, making the button appear unresponsive.

Reproduction used the unchanged RC1 production bundle on a mobile-sized (390 x 844) non-localhost HTTP origin served from local fixture routing. No crypto API was mocked for the main reproduction:

```json
{"secure":false,"uuid":"undefined","randomValues":"function"}
```

Creating a project raised `crypto.randomUUID is not a function` and wrote no workspace. Two new tests also failed before the fix with that error. This matches the reported symptom; the user's actual phone/browser and URL have not been inspected.

## Fix

- Shared local-ID helper uses native randomUUID when available, otherwise generates UUIDv4 IDs with crypto.getRandomValues (available on HTTP contexts).
- Both project creation and saved analyses use the helper, so analysis saving does not fail later for the same reason.
- If the browser has neither usable randomness API, project creation shows a visible retry/browser message instead of throwing silently. This rare condition was fault-injected in a separate isolated browser profile; existing data remained unchanged.
- Existing UUIDs, storage key/schema, project records, agreements, history and UI design are retained. No new runtime dependencies and no Math.random fallback.

References: https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID and https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues

## Executed verification

- Vitest: **313/313**, 22 files.
- TypeScript + production build: passed.
- oxlint: passed, no diagnostics.
- Existing production-browser QA: **12/12 groups passed** on the fixed bundle, including all document formats, duplicate paths, saved snapshots, themes and viewport checks.
- Real insecure HTTP mobile-context regression: project creation, saved analysis and refresh persistence passed without page exceptions. The main check verifies `isSecureContext === false` and `typeof crypto.randomUUID === 'undefined'` instead of simulating them.
- Unavailable-randomness fault injection: visible creation error, no uncaught error, existing stored data preserved.

See `validation-mobile-http.json` and `validation-browser.json`. The new reproducible browser script is `qa/mobile-http-check.mjs`; use the optional Playwright setup in QA-README.md, then `node qa/mobile-http-check.mjs` after building. It starts a local preview and routes a fictional `.test` HTTP origin locally; it does not deploy or contact that host externally. `SCOPE_GUARD_MOBILE_REPORT` optionally selects its JSON report output. `SCOPE_GUARD_EXPECT_BROKEN=1` is only for reproducing the old RC1 bundle.

## Apply on Windows / retry on the actual phone

1. Stop the old development server with Ctrl+C. Extract this RC2 ZIP into a fresh folder.
2. Open PowerShell inside the extracted `scope-guard` folder and run `npm ci`, then `npm run dev -- --host`.
3. Open the printed Network URL on the phone and refresh. Try a fresh project name, then save a request analysis and reload.
4. Keep the same browser profile and origin when checking existing projects. Different ports/addresses have separate localStorage. Do not clear browser storage as a fix.

Actual phone verification remains necessary. If the same symptom occurs on an HTTPS deployment, capture the URL scheme, browser/version and visible message; that may be a different cause.

No production deployment was performed.
