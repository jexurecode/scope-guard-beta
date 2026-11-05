# Scope Guard v0.9.1 — Quality Assurance & Stabilization (RC1)

## Result

Validated from the actual v0.9.1 UI-polish source, not from an assumed earlier result. Initial source comparison found no local differences from the delivered UI ZIP. Baseline: 297/297 tests, build and lint passed.

Final validation after the confirmed exclusion fix:

| Check | Result |
| --- | --- |
| Vitest | 309 / 309 passed, 21 files |
| TypeScript + Vite production build | Passed |
| oxlint | Passed, no diagnostics |
| Production-build browser checks | 12 / 12 groups passed |
| Uncaught browser page errors in tested flows | 0 |
| External HTTP requests during tested flows | 0 |
| Viewport widths checked | 320, 390, 768, 1024, 1366px |

Environment: Linux, Node 24.22.1, npm 11.9.0, headless Chromium. `validation-browser.json` records the executed browser groups. The runner uses Vite preview of `dist`, so PDF parsing and its bundled worker were exercised in the production bundle rather than mocked.

## Confirmed bug and fix

The rule parser missed definite passive exclusions in past/perfect tense, e.g. `Blog wasn't included`, `Blog was not included`, `Blog has not been included`, and their booking-system equivalents.

Regression tests were added and executed before editing behavior: six definite-exclusion cases failed, while four ambiguity/conflict guards passed. The fix normalizes the relevant contractions and extends bounded passive predicates, including shared noun-list predicates. Twelve new regression cases pass after the fix. Conditional, optional and conflicting wording still requires review.

Only `src/lib/feature-context.ts` changed in existing application code. The UI, project IDs, workspace key/schema, imports, hooks and saved snapshots remain unchanged. Existing tests were not removed or weakened. Fixtures, runner, new regression tests and documentation were added.

## Import and browser coverage

The included fictional restaurant agreement has **53,697 source characters**, with covered homepage-copy/gallery tasks near the beginning and blog/booking/newsletter exclusions near the end. The same text was exported to actual PDF and DOCX files. Every format imported more than 50K characters, retained the end sentinel and exclusion clauses, and produced two likely-covered tasks plus one potential change for the mixed request. TXT import was also checked for exact source length.

The 12 executed browser groups cover:

1. Fresh workspace and light default despite a dark system preference.
2. Sample preview without saved workspace changes.
3. TXT agreement/request import, mixed tasks and blog evidence.
4. DOCX agreement import, mixed tasks and blog evidence.
5. PDF agreement import and worker, mixed tasks and blog evidence.
6. Past-tense blog exclusion in the browser after the fix.
7. Edited reply, project agreement and analysis-snapshot persistence after reload.
8. Bounded card preview and scrollable full agreement retaining its sentinel.
9. Case-insensitive duplicate prompt, existing-project request and explicit separate-engagement path.
10. Empty/malformed files, text over the agreement limit, image-only PDF rejection and partial-scan warning; failed imports preserve the previous agreement.
11. Per-project analysis-history isolation.
12. Desktop/mobile overflow and navigation checks plus manual dark mode and theme persistence.

## Repeat normal checks on Windows

Use Node 24. From the extracted `scope-guard` folder:

```powershell
npm ci
npm test
npm run build
npm run lint
npm run dev
```

Then test the fixture files on your actual Windows browser and phone. Inspect long-agreement scrolling, controls, keyboard focus and readability. Check the existing browser profile and original origin when verifying your own data; another localhost port uses separate storage. The automated tests used isolated browser profiles and did not touch your live beta or personal projects.

## Optional: repeat automated browser QA

Playwright is optional QA tooling, not an application dependency. This PowerShell setup installs it separately in TEMP:

```powershell
$qaTools = Join-Path $env:TEMP 'scope-guard-browser-qa'
npm install --prefix "$qaTools" --no-package-lock --ignore-scripts playwright
node "$qaTools\node_modules\playwright\cli.js" install chromium
$env:SCOPE_GUARD_PLAYWRIGHT_MODULE = Join-Path $qaTools 'node_modules\playwright\index.mjs'
$env:SCOPE_GUARD_QA_REPORT = 'qa/validation-browser-local.json'
npm run build
node qa/browser-check.mjs
```

The script starts and closes a local Vite preview and isolated Chromium profile. It never deploys. Advanced Linux environments can supply `SCOPE_GUARD_CHROMIUM_BINARY` and JSON `SCOPE_GUARD_CHROMIUM_ARGS`; Windows normally does not need them. Fixtures are already included. Optional regeneration requires Python with `python-docx` and `reportlab`, then `python qa/generate-fixtures.py`.

## Practical limits / release status

This is a **release candidate**, not proof of universal contract accuracy. The contract fixtures are fictional realistic structures, not the Reddit reviewers' private contracts. Complex layouts and nuanced obligations still require manual review. Headless Chromium does not replace visual/device testing on Windows, Android/iOS, Firefox or Safari. Request-draft persistence is not promised; saved analyses and full agreements are preserved.

No production deployment, Git checkpoint, real AI connection, login, cloud migration or billing was performed. The next public-beta update requires approval after device validation. Git checkpoint creation belongs to the next phase; this source was provided as ZIP and was not a Git checkout.
