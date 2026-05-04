⚖️ CHANAKYA'S COUNSEL
══════════════════════════════════════════

*Strategic review of AFP at 0.2.17.2, on branch `feat/who-planned-it`. Whole-repo audit through the Arthashastra lens — architecture, dependencies, reversibility, two-year cost. Style, naming, and tactical hygiene have already been addressed by other reviewers; their findings are not repeated here.*

---

## HUMANITY-THREATENING

> "The ally you cannot dismiss becomes the master you did not choose."
> यः सहायः त्यक्तुं न शक्यः, स एव स्वामी भवति यं त्वं न अवृणोः।

**Firebase is not a vendor — it is the spine of this kingdom.** Auth, Firestore, security rules, real-time sync, offline persistence, and the rules-deploy GitHub Action all assume Google's infrastructure is permanent and benevolent. Firestore is referenced directly in the `firebase-adapter`, in `auth-context`, in `useAllUsers`, in `useAdmin`, in `the-admin-nick`, in `invite.ts`, in `ChildDetail.tsx`, in `BabyDashboardBanner.tsx`, in `useSnooze.ts`, in `migration/elimination.ts`, and in `MigrationsTab.tsx`. The `StorageAdapter` interface — the one boundary that could have made this swappable — is bypassed wherever transactions, collection-group queries, or batched writes are needed. **The abstraction exists for ordinary CRUD; the privileged paths leak Firebase straight through to the call sites.** This is not surrender by accident — it is surrender by inattention. Every privileged feature added to the privileged paths makes the divorce more expensive.

The compounding harm is not "if Firebase disappears." It is: when pricing changes, when free quota tightens, when Firestore's real-time listener model proves unsuitable for a future feature, when GDPR/data-export becomes a serious request — every one of those forces a migration that touches the auth core, every privileged hook, every transaction, and every rule. There is no exit door drawn in the floor plan.

→ **Directive:** Treat the `StorageAdapter` interface as a contract you cannot break. Add three operations the current interface lacks: `runTransaction(fn)`, `batchWrite(ops[])`, and `getAllByGroup(subcollectionName)`. Move `redeemInvite`, `initializeAdmin`, `useAllUsers`, `useAdmin`, the elimination migration, and the four files in `modules/baby/*` that import `firebase/firestore` directly behind that interface. The goal is not "rewrite to be backend-agnostic tomorrow" — the goal is "the day you decide to leave Firebase, the search-and-replace surface is one file, not forty." Until that boundary is enforced, declare it in `CLAUDE.md` as an invariant: *"No file outside `src/shared/storage/` and `src/shared/auth/` may import from `firebase/*`."* Add an ESLint `no-restricted-imports` rule to enforce it. The rule will fail on twelve files today. Fix them one by one.

---

> "You have planned for peace. You have not planned for war."
> शान्तये योजना कृता। युद्धाय न।

**There is no exit for the data either.** Firestore holds every body activity, every expense, every feed, every milestone, every diaper from the day this app left dev. There is no scheduled export. No `scripts/export-firestore.ts`. No `gcloud firestore export` documented in the README. No backup strategy in `docs/`. The only persistence layer outside Google is the dev-mode `localStorage-adapter`, and it cannot read what is in production. **If the project's Firebase account is suspended, deleted, billed-into-disablement, or simply forgotten through a credential rotation gone wrong, every record this family has logged is gone.** This is a single-developer hobby project — meaning there is exactly one person between this data and oblivion, and that person has not built the lifeboat.

→ **Directive:** Before the next feature ships, write `scripts/export-user.ts` — runs against the prod Firestore Admin SDK (`firebase-admin` is already in `devDependencies`), takes a `uid`, dumps the full subtree (`profile/main`, `body_*`, `expenses/*`, `income/*`, `children/*` with all subcollections, `notifications/*`) to a timestamped JSON file. Document the run command in `docs/firebase-setup.md`. Schedule a monthly cron (manual `gh workflow dispatch` is fine) that runs it for the admin account, or at least for the headminick UID. This is not a roadmap item — this is the smoke detector you install before the second time you cook.

---

## KINGDOM-WEAKENING

> "Draw borders where armies rest, not where they fight."
> सीमाः तत्र निर्धार्यन्तां यत्र सेनाः विश्रमन्ति, न यत्र युध्यन्ते।

**The module boundary is healthy in one direction and inverted in the other.** No module imports from a sibling module — that is hard-won discipline and worth preserving. But `src/shared/` and `src/admin/` reach freely into `src/modules/`:

- `shared/components/Dashboard.tsx` imports four module components
- `shared/components/Layout.tsx` imports `BabySuggestionsToast` from the baby module — meaning the supposedly module-agnostic root shell hard-depends on the baby module existing
- `shared/components/PaymentMethodBubble.tsx` imports labels from the budget module
- `shared/components/bench-generators.ts` imports types and helpers from all three modules
- `admin/components/MigrationsTab.tsx` imports the baby migration directly

This is the reverse-dependency anti-pattern. The shell knows about its tenants; the tenants do not know about each other; therefore removing the baby module — should it ever be split into its own deployable, or simply made optional at build time — requires editing files in `shared/` that have no business knowing baby exists. The illusion of clean modules is paid for by the shell's promiscuity.

→ **Directive:** Introduce a `ModuleRegistry` pattern. Each module exports a single registration object (`{ id, summaryCard, dashboardBanner, suggestionsToast?, benchGenerators?, migrations? }`). `App.tsx` (or a new `module-registry.ts` at the same level) imports the three registrations and passes them down. `Dashboard.tsx`, `Layout.tsx`, `MigrationsTab.tsx`, `bench-generators.ts` consume the registry, not the modules directly. `shared/` becomes truly shared. Cost: one afternoon. Reward: a future fourth or fifth module is a registration-and-route addition, not a shell modification.

---

> "A door with no hinge is a wall."
> यस्य द्वारस्य कीलकं नास्ति, तत् भित्तिरेव।

**The dev-mode bypass is no longer a courtesy — it is a parallel reality.** Fourteen production files branch on `isFirebaseConfigured`: auth-context, four admin hooks, three shared components, the invite flow, the username flow, the storage factory. The dev branch is a hardcoded `dev-user`, a hardcoded `DEV_PROFILE`, a localStorage-only path, and an admin role granted unconditionally. This was a defensible shortcut at version 0.0.x. At 0.2.17 it is a second codebase that must be maintained alongside the first, and every Firestore-shaped change has to be replicated against a fundamentally different storage model. The CLAUDE.md already records the symptoms: *"Dev mode doesn't persist profile reads,"* *"Multi-baby not tested,"* *"Time travel possibilities."* Each of those is a divergence between dev and prod that you discovered the hard way.

The admin bypass in dev is also a mild security smell — not because it is exploitable in production (it is not), but because the test surface and the production surface no longer share invariants. Tests asserting "admin can do X" pass in dev mode trivially because dev mode IS admin. Whether the rules actually permit it remains a question answered only by deploying.

→ **Directive:** Replace the boolean `isFirebaseConfigured` with an explicit `BackendMode = 'firebase' | 'emulator' | 'memory'`. Wire to the **Firestore + Auth emulators** locally — Firebase ships them, they cost nothing, they exercise the real rules and the real schema. Memory mode stays for unit tests only. Within six months, every place that branches on `isFirebaseConfigured` should branch on the explicit mode, and the emulator path should be the dev default. Then the rules are tested every time you `bun run test`, and the parallel reality collapses to one.

---

> "The schema you are proposing will outlive the assumption that justified it."
> या रूपरेखा त्वं रचयसि, सा तस्या मान्यतायाः अधिका जीविष्यति यया सा न्याय्या कृता।

**Firestore data is durable in a way the code is not.** The `diaper → elimination` migration is the precedent: a backfill that copies, never deletes, and ships as an admin-clicks-a-button tab. That worked once because the data volume is small and the trust model is single-user-admin. It will not work at three migrations, four, ten — because the code will accumulate read-time fallbacks ("if `mode` exists use new shape, else treat as old diaper") that nobody dares delete. The numeric enums (`PaymentMethod`, `ExpenseCategory`, `IncomeSource`, `FeedType`, `SleepType`, `SleepQuality`, `DiaperType`) are the deeper trap: they are stored as integers. If you ever insert a new enum member at position 3 instead of appending, you have silently re-categorised every historical row. There is no schema-version field on any document.

The `children/{childId}/{sub}/{docId}` rule wildcard is forgiving in scope but offers zero protection against schema drift — any future subcollection inherits permissions whether or not the application has reasoned about it.

→ **Directive:** Add a `schemaVersion: number` field on every persisted document type starting now (`Expense`, `BodyActivity`, `BodyRecord`, all baby entries, `UserProfile`). Default `1`. Read code branches on it — even if the only branch today is `assert(v === 1)`. When you add the second branch, you will be glad. Separately: write down the rule for numeric enums in `CLAUDE.md` with the same severity as the "no `||` for env vars" rule — *"Never insert. Always append. Renaming a member is fine; renumbering is migration."*

---

> "Build what protects your throne. Buy what speeds your victory."
> आत्मशक्तिं वर्धयितुं स्वयं रचय, विजयं शीघ्रं प्राप्तुं परैः क्रीणीहि।

**The bleeding edge is not free.** `package.json` shows React 19, Vite 8, Tailwind 4, Vitest 4, Vite-PWA 1, Bun runtime, Firebase 12, react-router 7. Six of those are major versions less than 18 months old; three are first-year majors. Every one is a dependency whose breaking-change cadence you cannot influence. Tailwind 4 alone replaced the entire configuration model from v3. Vite 8 is so new that the README's instruction "use Bun (not npm/yarn)" is itself a downstream of bleeding-edge tooling. Each upgrade is an afternoon today and a week in two years when three of them collide.

Add to that: eight Google Font families loaded over a `<link>` tag in `index.html`. The visual identity of every theme depends on Google's CDN being reachable, fast, and free. There is no self-hosting fallback.

→ **Directive:** This is **WISE COUNSEL** more than an action item — it is a posture choice. If the goal is "stay current to learn the latest stack," accept the upgrade tax as part of the project's purpose. If the goal is "make a thing that will still run in five years with minimal touching," pin majors aggressively, downgrade Tailwind to v3 LTS, downgrade Vite to v6, and stop chasing. Pick one. Today the project is doing both — chasing the bleeding edge while accumulating data the user will not want to lose. For the fonts specifically: run `npx fontsource-cli` once, vendor the eight families into `src/themes/fonts/`, drop the Google `<link>`. One afternoon. Identity stops depending on Google.

---

## TACTICAL MISSTEP

**Version drift between source and deploy.** `package.json` says `0.2.17.2`. `.github/workflows/deploy.yml` line 40 hardcodes `VITE_APP_VERSION: 'v0.2.15'`. The deployed site has been displaying a stale version for three releases. This is a small thing today and an audit-trail nightmare the day someone asks "which build introduced the bug?"

→ **Directive:** Replace the literal in deploy.yml with `VITE_APP_VERSION: ${{ github.sha }}` or, better, derive from `package.json`: `VITE_APP_VERSION: $(node -p "require('./package.json').version")`. Single source of truth.

---

**Tests are excluded from `tsconfig.json`.** `"exclude": ["src/**/__tests__/**"]` means `tsc -b` does not type-check the 7,400 lines of test code. Vitest type-checks at run time, but errors that would have caught at compile time only surface when the test runs. For a project with 82 test files this is a compounding risk — a refactor that breaks a type signature can leave a stale test passing because its assertions never execute against the new shape.

→ **Directive:** Either remove the exclusion (let `tsc` type-check tests) or add a separate `tsconfig.test.json` and run `tsc -b tsconfig.test.json` in CI alongside the build. The cost is build time. The reward is your test suite never silently rotting against the production code it claims to verify.

---

**The Firestore rule for profile updates is broader than the documentation claims.** `CLAUDE.md` says *"Owner can update only `theme`, `colorMode`, `name`."* The actual rule (firestore.rules:69-75) admits any update where `role`, `modules`, and `viewerOf` are unchanged — the user can rewrite their own `email`, `username`, `effectIntensity`, `effectSize`, `requestedModules`, anything. The narrow `affectedKeys()` clause is an OR-branch the broader clause swallows. This is not an exploitable hole — it is documentation drift that will mislead the next person reading the rules to understand the security model.

→ **Directive:** Either tighten the rule to actually match the documentation (replace the broad path with an `affectedKeys().hasOnly([...])` listing every field the owner is permitted to change) or update the documentation to describe the rule that exists. Consistency between rules and docs is the difference between a security model and a security suggestion.

---

**Profile transactional writes are not directly tested.** `redeemInvite`, `initializeAdmin`, the elimination migration's batch commit — all are integration-shaped code with no unit or integration coverage that exercises Firestore semantics (real or emulated). The pure helpers (`generateInviteCode`, `transformDiaperToElimination`, the runner orchestration in `runEliminationMigration.ts`) are tested. The transactions that actually touch the database are not. The day a Firestore client upgrade subtly changes transaction retry semantics, you will discover it in production.

→ **Directive:** Stand up the Firestore emulator in CI. Add one test file per transactional path: `redeemInvite.emulator.test.ts`, `initializeAdmin.emulator.test.ts`, `migration.emulator.test.ts`. Tagged separately so they don't slow the default unit run. Triggered before deploy. This pairs with the dev-mode collapse directive above — same emulator infrastructure, two payoffs.

---

## WISE COUNSEL

**The branch-naming queue is a finite resource.** `CLAUDE.md` reserves the trial-ending beats. Honor that discipline — do not burn `the-verdict` or `case-closed` on a routine PR. The narrative arc is part of the project's identity.

**The 26-version CHANGELOG and the per-feature `docs/plans/` folder are exemplary.** Most hobby projects accumulate context loss; this one accumulates context. Maintain that posture even when speed pressures suggest skipping a CHANGELOG entry. The cost of writing it is small. The cost of reconstructing it later is total.

**The strict TypeScript posture (`noUncheckedIndexedAccess`, `noImplicitOverride`, `strict`) is a quiet asset.** Five `as unknown as` escape hatches across the production codebase is well within tolerance. Do not normalize adding more.

**The Result type discipline is a strategic strength.** Every async returns `Result<T>`. This is the kind of decision that pays dividends in years three through ten. Defend it against the temptation, when adding new transactional code, to just `throw` and let the caller catch.

**The CSS-themes-as-files architecture is sustainable for ten themes and dangerous for fifty.** Ten light/dark CSS files plus an effects file plus a 270-line `themes.ts` registry is the maximum the current shape can carry without becoming the project's center of gravity. If the theme count grows to fifteen or twenty, the right move is a single declarative table and a CSS-variable generator script — not more files. Today it is fine. Note the inflection point.

**The `ChildConfig`-gated tab system inside the baby module is the cleanest part of the codebase.** Per-child opt-in for elimination/meals/needs/milestones is exactly the right shape for a feature with this much variation. When the next module needs sub-features, copy this pattern.

---

## THE SEAL

> "An empire that cannot list its allies cannot dismiss them. An empire that cannot find its records cannot defend them."
> यः मित्राणि न जानाति, स तानि त्यक्तुं न शक्नोति। यः अभिलेखान् न रक्षति, स तान् न रक्षितुं शक्नोति।

The architecture before me is the work of a careful single hand. The boundaries are real, the conventions are honored, the test posture is serious. The kingdom is well-administered. But two structural choices — the Firebase coupling that has not been contained, and the data that has no exit — are the kind of decisions that look thrifty in year one and ruinous in year five. Fix the import boundary, build the export script, schedule the backups. Then proceed.

VERDICT: **PROCEED WITH CAUTION**
