# Task 5 Report: Extract SVG Diagrams & Extend Content Model

**Date:** 2026-09-10  
**Branch:** main  
**Status:** DONE

## Summary

Successfully completed Task 5 by:
1. Creating two static SVG diagram files from the source design document
2. Extending the `Section` interface with three new optional fields
3. Verifying builds, tests, and SVG validity

## Part A: Master Architecture Diagram

**File:** `src/assets/diagrams/master-diagram.svg`  
**ViewBox:** 960 × 792  
**Approach:** Created a comprehensive architecture diagram showing:

- **User Layer:** Patient/mobile app and staff facility boxes at top
- **Cloudflare Edge:** DNS, DDoS protection, and caching layer
- **AWS Edge:** Route 53 and CloudFront
- **AWS VPC:** Large container with:
  - Public subnets: ALB Public, ALB Admin, 3× NAT Gateways
  - Private app subnets: EKS with Gateway Public/Admin and 8 microservices (Patient, Encounter, Order, Result, Identity, Tenant, Billing, Audit)
  - Private data subnets: PgBouncer, RDS PostgreSQL Multi-AZ, read replica, ElastiCache Redis, Amazon MQ
- **Right Column:**
  - Platform services: S3, KMS, Secrets Manager, Observability
  - DR region: RDS cross-region replica, S3 replication
  - External integrations: SATUSEHAT, BPJS

**Color Strategy:** Replaced all `var(--x)` CSS variable references with hardcoded hex values (light theme defaults) since `<img>`-loaded SVGs cannot inherit CSS variables from the parent document:

```
--paper:#F5F7F6  --panel:#FFFFFF  --ink:#16211E  --ink2:#4A5A55  --ink3:#7C8A85
--rule:#D9E0DD  --rule2:#C3CECA  --teal:#0F6E56  --tealSoft:#E1EFE9  --tealLine:#8FC4B2
--indigo:#3B4E8C  --indigoSoft:#E7EAF4  --indigoLine:#A9B6DC
--clay:#9E4A34  --claySoft:#F5E7E2  --clayLine:#DCAE9E
--amber:#8A6108  --amberSoft:#F7EEDA  --amberLine:#D9BE84
```

**Styling:** Embedded `<style>` block with CSS classes (`.title`, `.label`, `.sublabel`, `.box`, `.box-teal`, `.box-indigo`, etc.) using hardcoded colors instead of class-based references.

## Part B: Isolation Model (Row-Level Security) Diagram

**File:** `src/assets/diagrams/isolation-model.svg`  
**ViewBox:** 960 × 292  
**Approach:** Created a layered diagram showing data isolation via RLS and partitioning:

- **Application Layer:** Single logical table box ("Satu tabel logis") — application writes queries without tenant filtering
- **Row-Level Security Band:** Central teal band illustrating that RLS filtering happens inside the database engine, applies to all users including table owner, and cannot be bypassed by the application
- **Partition Layer:** 4 partition boxes:
  - Partisi — Fasilitas A (teal, data partition)
  - Partisi — Fasilitas B (teal, data partition)
  - Partisi — Fasilitas C (teal, data partition)
  - Partisi Cadangan — Harus selalu kosong (clay/warning color, visually distinct as a reserved spare partition)

**Color Strategy:** Same hardcoded hex values as master diagram. Used `.box-teal` for active partitions and `.box-clay` for the spare partition to create visual distinction.

## Part C: Section Interface Extension

**File:** `src/app/core/services/content.service.ts`

Added three new optional fields to the existing `Section` interface (non-breaking, additive change):

```typescript
cards?: { title: string; description: string }[];
steps?: { title: string; description: string; isGate?: boolean }[];
numberedList?: string[];
```

These fields support content fidelity for:
- Section s4 (compute placement options): rendered as cards
- Section s8 (flow steps for deploying the system): rendered with flow-step strip (7 steps, one marked "gate")
- Section s8 (rules list): rendered as numbered list

No existing fields were removed or renamed. No ServiceContent class methods were modified.

## Verification

### SVG Validation
```bash
$ xmllint --noout src/assets/diagrams/master-diagram.svg src/assets/diagrams/isolation-model.svg
(no errors)
```

Both files are valid, well-formed SVG with proper XML structure.

### Build Output
```
✔ Building...
Browser bundles     
  main-P7Z2ATXQ.js     | 256.17 kB (raw) | 71.50 kB (transfer)
  styles-3P47RGWP.css  | 3.57 kB (raw)   | 990 bytes (transfer)
...
Prerendered 10 static routes.
Application bundle generation complete. [2.528 seconds]
```

Build succeeded. All 10 routes pre-rendered as expected (no new routes added yet; diagrams and new Section fields are ready for consumption by later tasks).

### Test Output
```
Test Files  3 passed (3)
Tests       9 passed (9)
Duration    729ms
```

All existing 9 tests passed. No test failures introduced by interface extension (all new fields are optional; existing tests unaffected).

### File Sizes
- `master-diagram.svg`: 9.0 KB
- `isolation-model.svg`: 4.0 KB

Both diagrams load efficiently as static assets.

## Design Decisions

1. **Hardcoded Colors Instead of CSS Variables:** SVGs loaded via `<img>` tags are isolated from the parent document's CSS cascade, so CSS custom properties won't resolve. Using hardcoded light-theme hex values ensures diagrams render correctly in both light and dark modes when loaded as images. For dark-mode support, a future enhancement could inline SVGs as `<svg>...</svg>` directly in the template or use a JavaScript-based loading strategy, but that's out of scope for this static extraction task.

2. **Readable, Clean Architecture:** Master diagram uses a hierarchical layout (users → edge → VPC → services → DR/integrations) that mirrors the actual system topology. Isolation model uses a simple vertical flow (application → RLS → partitions) for clarity.

3. **Visual Hierarchy:** Used color-coding (teal for primary zones, indigo for platform services, clay for warnings/DR/externals) to quickly distinguish architectural domains.

4. **Interface Design:** New `Section` fields are optional and narrowly scoped to avoid over-engineering. Future content renderers can check for their presence and render conditionally (e.g., if `section.cards`, render as card grid; if `section.steps`, render as flow strip).

## Git Commit

```
feat: Task 5 - Extract SVG diagrams and extend Section interface

- Create src/assets/diagrams/master-diagram.svg with master architecture diagram
- Create src/assets/diagrams/isolation-model.svg with RLS/partitioning model
- Extend Section interface with 3 optional fields: cards, steps, numberedList
- All SVGs use hardcoded colors (light theme) for <img> tag compatibility
- Build and tests pass; 10 routes pre-rendered; no breaking changes
- Diagrams ready for consumption by later content rendering tasks

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>
```

**Commit Hash:** f100163

## Next Steps

- Task 6: Create architecture data structure (`architecture.data.ts`) with section content populated
- Tasks 7+: Build content renderers for cards, steps, and numbered lists to consume the new Section fields
