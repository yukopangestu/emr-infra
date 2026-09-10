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

