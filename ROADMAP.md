# Scope Guard — Development roadmap

Developer brand: JEXURE. Current source: v0.9.1 UI polish plus stabilization RC2 (mobile HTTP fix).

## Phase 1 — v0.9.1 Quality Assurance & Stabilization

Immediate phase: preserve the existing UI while validating tests, build, lint, realistic PDF/DOCX/TXT imports, 50K+ agreements, mixed tasks, explicit exclusions, project creation and duplicate handling, navigation, full agreement viewing, browser persistence and responsive behavior. Fix confirmed bugs with regression tests.

RC2 mobile fix and current validation: [mobile HTTP report](qa/MOBILE-HTTP-FIX-RC2.md).

RC1 results and Windows checks: [QA report](qa/QA-README.md). Automated validation completed; actual user-device checks remain.

## Phase 2 — Public beta update

After validation, create a stable Git checkpoint, deploy to Vercel only with explicit approval, verify production, then ask the two Reddit reviewers to repeat their original scenarios. Collect accuracy, usability and regular-use feedback. Sending reviewer messages is a separate authorized action; no messages were sent during stabilization.

## Phase 3 — Real AI integration

Next major development milestone. Preserve the rule engine and replace the hybrid mock with a secure server-side AI provider. Require input validation, structured task-level output with agreement evidence, automatic rules fallback and clear engine labels. Add prompt-injection defenses and privacy controls for confidential agreements.

Before exposing the AI endpoint publicly, require authentication or equivalent server-side access controls, persistent rate limiting, quotas and cost monitoring. This access gate precedes the full account/cloud product in Phase 4.

Before public AI release, compare AI and rules using at least 50 realistic scenarios. Measure accuracy, false positives/negatives, response quality, latency and estimated costs. Never put provider API keys in frontend code. Mock mode must remain clearly labelled as not AI.

## Phase 4 — Accounts & cloud sync

After AI workflow and product value validation: real sign up/sign in, secure accounts, cloud project storage, cross-device sync, export/deletion and an explicit migration path for localStorage projects. Do not fake authentication, silently merge engagements or replace local storage without a migration plan.

## Phase 5 — Monetization

After sufficient user feedback, define free/paid limits, estimate cost per AI analysis and compare subscriptions versus credits. Introduce billing only after validating demand and sustainable unit economics.

## Working rules

Inspect actual source. Preserve product identity and saved data. Prioritize accuracy/reliability/experience over cosmetic additions. Add regressions before confirmed-bug fixes and do not weaken existing tests. Deliver complete implementation batches and updated source ZIPs with checks actually executed. Never deploy production changes without approval.
