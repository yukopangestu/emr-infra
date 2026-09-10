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

