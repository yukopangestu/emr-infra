# SDD ledger — plan: docs/superpowers/plans/2026-09-10-emr-angular-implementation.md

**Branch:** main  
**Merge Base:** c9a6cd3 (initial setup with design spec)  
**Workspace:** .superpowers/sdd/

## Pre-flight conflict scan

| Task pair | Interface contract | Conflict found | Ruling |
|-----------|-------------------|---|---|
| T1 ↔ All | Angular project scaffold | None — T1 creates scaffold, all others depend on it | Proceed |
| T2 ↔ T3-T6 | Global styles, CSS vars | None — T2 defines vars, T3+ consume them | Proceed |
| T3 ↔ T4 | Core services exports | T4 imports from T3/services/index — spec includes this | Proceed |
| T4 ↔ T5 | SVG diagram files | T5 creates files, T4 references by filename in data | Proceed |
| T5 ↔ T6 | architecture.data.ts structure | T6 creates data, T4/T5 structure matches interfaces defined in T3 | Proceed |
| T1-T6 internal | No conflicting file edits | None found — each task creates distinct files | Proceed |

**Self-check: all tasks self-consistent?**
- T1: creates `.gitignore`, `vercel.json`, `angular.json` — no later edits ✓
- T2: creates styles in `src/styles/` — no later edits ✓
- T3: creates services in `src/app/core/services/` — specs are authoritative ✓
- T4: creates components in `src/app/shared/components/` — no later component edits ✓
- T5: creates SVG files in `src/assets/diagrams/` — standalone ✓
- T6: creates data in `src/assets/data/` — standalone ✓

**Spec coverage check (global constraints):**
- Angular 17+ LTS ✓ (T1 installs)
- Node.js 18+ ✓ (assumed in environment)
- Pre-render all routes ✓ (T12 finalizes, T1 scaffolds)
- Lighthouse 95+ ✓ (T13 verifies)
- Dark mode via CSS variables ✓ (T2 creates)
- Search with Lunr.js ✓ (T3 creates, T1 installs)
- Analytics (Vercel + GA) ✓ (T3 + T11 implement)
- SEO ✓ (T10 implements)

**Scan result:** Clean. No conflicts found. Proceed to Task 1.

---

## Tasks

- [ ] Task 1: Initialize Angular Project & Dependencies
- [ ] Task 2: Create Global Styling & Theme System
- [ ] Task 3: Create Core Services (Search, Theme, Analytics, Content)
- [ ] Task 4: Create Shared Components (Header, Sidebar, Cards)
- [ ] Task 5: Extract SVG Diagrams from HTML
- [ ] Task 6: Create Architecture Data Structure

---


## Ruling: Task 1 architecture conflict (2026-09-10)

**Conflict:** Task 1 implementer used Angular CLI 22.1.7, which scaffolds standalone-component/bootstrapApplication architecture. The plan's Tasks 2-14 are written entirely in NgModule idiom (AppModule, SharedModule, ArchitectureModule, declarations/imports/exports). Additionally, angular.json has no prerender config — the old `prerender` key inside `build.options` no longer applies to the `@angular/build:application` builder; modern Angular requires `ng add @angular/ssr` for static route prerendering.

**Ruling:** Adopt standalone-component architecture and Angular 22 as-is (this matches the user's explicit choice during brainstorming: "Approach C — adapt for modern web standards," and NgModules are legacy Angular idiom as of v17+; forcing an older CLI to get NgModules would contradict that choice and ship an outdated toolchain). Two concrete actions:

1. **Fix round on Task 1:** add `@angular/ssr` + configure prerender routes for `/, /s1-/s9` so the build produces real static HTML per route (required for Vercel static hosting — this is the modern equivalent of the plan's old `prerender` config block).
2. **All subsequent task briefs (Tasks 2-14) are adapted from NgModule code to standalone-component code when dispatched** — components get `standalone: true` + `imports: [...]` per component instead of `standalone: false` + NgModule declarations; routing uses `provideRouter()` in `app.config.ts` + functional route configs instead of `RouterModule.forRoot()`/`forChild()` NgModules; no `AppModule`/`SharedModule`/`ArchitectureModule` files are created. I (controller) will translate each task's plan text to standalone idiom in the dispatch brief rather than quoting the plan's NgModule code verbatim.

**Kept as-is (not worth the churn):** project internal name stays `emr-docs` (angular.json project key, package.json name, vercel.json `dist/emr-docs/browser`) rather than renaming to `emr-infra` — purely cosmetic, already internally consistent, renaming risks breaking working config for no functional gain. Vitest stays as the test runner (Angular 22's official default, integrates with `TestBed` via `@angular/core/testing` — the reviewer's compatibility concern is real to research but not yet confirmed broken; verify empirically in Task 3's test run rather than assuming failure).

**Cost if wrong:** If standalone/Vitest choice turns out unworkable downstream, the fix is rewriting component decorators and route config — mechanical, not a full re-scaffold. If prerender via `@angular/ssr` doesn't fully satisfy "no server-side rendering at runtime," fallback is pure client-side SPA with a single index.html (loses per-route static HTML, acceptable degradation, not a rebuild).


Task 1: fix round 1/5 (1 addressed, 0 open; commits d2bb823..cbe7397)
Task 1: complete (commits c9a6cd3..cbe7397, 1 fix round — architecture ruling recorded above)

Task 2: complete (commits cbe7397..f83a5e4, review clean)

Task 3: minor (deferred): ThemeService.applyTheme localStorage access not directly guarded (indirectly safe via earlier document check) — theme.service.ts:32-40
Task 3: complete (commits f83a5e4..d2e5953, review clean — 1 minor deferred)

Task 4: fix round 1/5 (1 addressed, 0 open; commits 0bb35b7..9ffa3ec)
Task 4: complete (commits d2e5953..9ffa3ec, 1 fix round)

## Ruling: Task 5 scope correction (2026-09-10)

**Conflict:** The plan's Task 5 assumes 9 SVG diagrams (one per section). Checking the actual source HTML (`emr-arsitektur-produksi-aws.html`, read in full at conversation start): only sections s1 and s2 contain real `<svg>` diagrams (Gambar 1: master architecture diagram, lines 165-283; Gambar 2: partition/RLS diagram, lines 293-323). Sections s3, s5, s6, s7, s9 are HTML tables only (no diagram). Section s4 is a CSS grid of 6 "cards" (compute placement options). Section s8 is a horizontal flow-step strip (7 steps, one marked "gate") plus a separately numbered rules list (10 items).

**Ruling:** Task 5 extracts only the 2 real SVGs that exist. The `Section` interface (already committed in Task 3's `content.service.ts`) gets extended with three new OPTIONAL fields to preserve content fidelity for s4 and s8, since `diagram`/`tables`/`callouts` alone can't represent cards or flow-steps: `cards?: {title: string; description: string}[]`, `steps?: {title: string; description: string; isGate?: boolean}[]`, `numberedList?: string[]`. This is an additive, non-breaking change to an already-committed interface (existing consumers unaffected — all new fields optional). Folded into Task 5's dispatch since Task 6 (data population) needs these fields to exist first.

**Cost if wrong:** If the extra fields turn out unnecessary or wrongly shaped, fixing them means editing `content.service.ts` plus whichever components consume them — mechanical, low blast radius since nothing consumes them yet.

Task 5: complete (commit f100163)
