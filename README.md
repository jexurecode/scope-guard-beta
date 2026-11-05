# Current source: v0.9.1 — Mobile HTTP fix RC2

See [RC2 mobile Create Project fix](qa/MOBILE-HTTP-FIX-RC2.md) for current validation (**313 tests**, build/lint, 12 browser groups and insecure-HTTP mobile checks). RC1 results below are historical.

See [stabilization results and repeatable QA](qa/QA-README.md) and the [development roadmap](ROADMAP.md).

See [v0.9.1 UI notes](V0.9.1-UI-POLISH.md) for the current visual changes and browser validation.

See [v0.9 implementation and validation notes](V0.9-ACCURACY-PROJECT-EXPERIENCE.md) for changes, verified results and the Windows checklist. Historical v0.8 notes below are retained for context.

# Scope Guard

An English-first, local prototype for comparing an original agreement with a client request. Results are preliminary keyword-based suggestions requiring human review, not semantic contract understanding or legal analysis.


## v0.8 real-contract feedback candidate

- **Document import**: use Import PDF, DOCX or TXT on the Analysis page for agreements or new requests. Parsing happens on-device; only extracted text is stored in existing browser workspace. Uploaded file bytes are not retained or sent to a server. PDF uses PDF.js, and DOCX uses Mammoth. Review the extraction carefully; scanned PDF pages need OCR and tables/headers/embedded material may not extract reliably.
- **Long agreements**: the agreement limit is now 150,000 characters (request 20,000). Documents are **never silently truncated**. LocalStorage quota still applies and each saved analysis stores an agreement snapshot; export an external copy before relying on browser storage.
- **Mixed-scope analysis**: displays a separate preliminary verdict for up to 24 explicit tasks, grounded in agreement phrases when possible. Additional tasks are reported as unassessed. `Likely covered` is **not a contract determination**. Unknown tasks remain `Needs review`.
- **Quick demo**: the Dashboard includes a no-project, no-signup sample. Mock mode remains rules-based (no real AI, no server, no paid API).

### Install on v0.8

New document parsers have been added to package.json. **Run `npm install` once first** (not `npm ci`): this candidate omits the outdated lockfile. Installation resolves `mammoth` and `pdfjs-dist` and generates a new `package-lock.json` on your computer. Commit the updated lock file before deploying. Then run `npm test`, `npm run build` and `npm run lint`. The package registry was unreachable in the build environment used for this candidate, so document parsing and full npm validation must be confirmed locally before release.

## Development

- `npm install` installs dependencies.
- `npm run dev` starts Vite.
- `npm test` runs the regression tests once.
- `npm run lint` runs Oxlint.
- `npm run build` runs strict TypeScript checks and builds production assets.

On Windows with PowerShell script execution disabled, use `npm.cmd` instead of `npm`.

## Architecture

- `src/App.tsx` composes the shell (sidebar, header, page, mobile bottom navigation) and owns the current view.
- `src/pages/` contains one component per screen: Dashboard, Projects, New analysis, History, Settings, and the mobile More menu.
- `src/components/layout/` holds the sidebar, header, bottom navigation, logo, and theme toggle. `src/lib/navigation.ts` is the single source for navigation items and page titles.
- `src/components/` contains shared presentation components: scope inputs, actions, analysis results and history rows, status badges, empty states, and project forms.
- `src/index.css` defines the design tokens (brand palette, sidebar colour, light/dark surface and status variables) and shared classes such as `card`, `btn`, and `field`.
- `src/hooks/useScopeAnalysis.ts` owns the input/result lifecycle, example/reset actions, and clipboard interaction.
- `src/hooks/useTheme.ts` applies the selected theme to the document.
- `src/lib/theme-storage.ts` isolates theme persistence.
- `src/lib/workspace.ts` validates and persists versioned project/history data, creates saved analyses, and handles project deletion.
- `src/components/AnalysisHistory.tsx` and `AnalysisRow.tsx` present saved analyses across all projects; reopening an analysis switches to its project.
- `src/lib/sparkline.ts` builds the dashboard sparklines: `dailyCounts` buckets saved timestamps into the last seven days and `buildSparkline` draws a monotone cubic curve (no overshoot). `Sparkline.tsx` renders it, with a neutral fallback when a metric has no history.
- `src/lib/search.ts` implements workspace search (all terms must match); `src/lib/notifications.ts` and `src/hooks/useNotificationReads.ts` own read/unread state for the activity panel, shared by the mobile and desktop headers.
- `src/lib/analysis-engine.ts` aggregates deterministic, per-feature decisions.
- `src/lib/feature-catalog.ts` lists recognized feature aliases; `feature-context.ts` implements bounded English context rules.
- `src/lib/analysis-provider.ts` exposes an asynchronous provider interface, currently backed only by the local heuristic engine.
- `src/types/` contains shared analysis and theme types. Analysis types are also re-exported from the engine for compatibility.

The engine remains separate from React; UI components consume its result type without implementing analysis rules. The analysis hook accepts an asynchronous provider and discards stale results after switching projects, resetting, or leaving the component. A future backend adapter can implement that interface; any credentials must remain on a secure backend. No backend provider or network calls are implemented.

Light is the default regardless of operating-system preferences. Only an explicitly saved dark preference enables dark mode. The existing `scope-guard-theme` key is preserved. When storage fails, the toggle still works for the current session.

Projects, agreements, completed analyses, and edited responses are saved only to localStorage under `scope-guard-workspace-v1`. Request drafts stay in memory until analyzed; switching projects or starting a new request clears the draft. No agreement or request is transmitted. localStorage is not secure storage for confidential contracts, and clearing browser data removes saved work.

Each analysis retains the agreement and request used at analysis time. Reopening history displays those inputs read-only; the response remains editable. Start a new request to return to the project's current agreement. Project deletion removes its history after confirmation. Try example confirms before replacing a nonempty agreement.

Character limits: project names 80, agreements 150,000, requests 20,000, and responses 10,000. Empty or whitespace-only names/analysis inputs are rejected. Persistence failures leave changes in memory and offer a retry. Invalid stored data is not overwritten automatically; replacement requires explicit confirmation. Use one tab for editing: simultaneous changes across tabs are not merged.

## Phase status and limitations

Phase 1 separates presentation, state, shared types, and persistence while preserving the existing workflow and engine tests. Phase 2 adds project creation/renaming/deletion, project-specific agreements and history, editable responses, copy feedback, validation, loading/empty/error states, and responsive controls. Phase 3 replaces request-wide exclusions with feature-level mention and intent rules, adds transparent review notes, and preserves existing saved results. Phase 4 runs the full automated regression suite, strict TypeScript checks, lint, and production build.

### Analysis rules

1. Normalize case, whitespace, common apostrophes/contractions, and a few spelling variants. Match explicit aliases at word boundaries.
2. Separate sentences and common contrast/action clauses while keeping feature lists together. Preserve leading conditions and quoted-sentence uncertainty across clause boundaries.
3. Classify each feature mention as an addition, exclusion/removal, or uncertain. Addition wording is required in requests; plain deliverable lists may count as agreement mentions.
4. If a feature has conflicting or ambiguous mentions, request human review instead of inferring a new addition. Cosmetic edits, links, documentation, alternatives, hypothetical work, and double negatives are treated conservatively.
5. Compare requested additions with agreement mentions of the same group. Excluded terms do not count as included deliverables. Existing or conflicting agreement mentions produce review notes rather than a coverage conclusion.
6. Return a fixed-order list of potential changes with normalized evidence and context explanations. Results always require human review. No confidence scores, prices, or legal conclusions are generated.

Example: `Don't add payments, but add a booking system.` flags only booking and explains the payment exclusion. `Should we add payments?` asks for review. `No payments` in the agreement does not suppress a later explicit request to add payments.

### Known limits

These rules do not understand contracts semantically. The catalog is finite and English-focused. Complex sentence structure, references across sentences, pronouns, sarcasm, unrecognized synonyms, and overlapping feature groups can still produce false positives or missed changes. Conditions or quotations conservatively qualify their whole sentence. Broad feature-group matches cannot determine quantities, complexity, or whether switching payment providers is included. Removal notes do not mean removal work is free or within scope. Human review is required even when no additions are flagged.

Saved analyses are snapshots, not automatically reanalyzed with new rules. Legacy history without review notes remains supported. New analyses persist optional `reviewNotes` using the existing storage format.


## Verification

Vitest covers the original engine behavior, theme fallback/persistence, workspace validation and round trips, storage failures, project deletion, input boundaries, analysis creation, provider equivalence, legacy/new history compatibility, context rules, deterministic outputs, and server-rendered UI states. Rendering tests do not simulate browser interactions; manually verify project switching, history reopening, clipboard behavior, and mobile/tablet/desktop layouts in a browser.


### Final manual browser checklist

Browser automation could not connect because its access host was unavailable. The following require interactive verification:

- Create, rename, switch, and delete projects; check that each retains its own agreement and history.
- Analyze a mixed request, reopen it, edit/copy the reply, and reload. Confirm snapshots and edited replies persist.
- Start a new request while analysis is pending; confirm stale results do not appear in another project.
- Verify clipboard success and denied-permission feedback, storage-full recovery, and corrupt-storage replacement confirmation.
- Confirm light is the first-run default under a dark OS preference; toggle dark/light and reload.
- Inspect 320px mobile, tablet, and desktop layouts, long content, keyboard navigation, focus visibility, and screen-reader announcements.
- Confirm no agreement/request data leaves the browser in the Network panel. Only local application assets should load during use.

## Dashboard shell redesign (Phase A)

The desktop navigation uses a dark navy sidebar, while narrow screens use a fixed five-tab bottom navigation with a pill-highlighted active tab. The main dashboard includes a welcome action area, counts derived from local workspace data, recent analyses with review status, and working navigation shortcuts. All analysis, project, history, and theme logic remains local and unchanged. The UI does not include authentication, paid plans, or fake notifications.

Before merging this iteration into the original repository, run `npm install`, `npm test`, `npm run build`, and `npm run lint`, and manually check the desktop and mobile layouts, dark theme, and navigation. Dependencies were unavailable for automated checks in the authoring environment.
