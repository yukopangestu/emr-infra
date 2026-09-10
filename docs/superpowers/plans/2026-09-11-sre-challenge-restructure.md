# SRE Challenge Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reposition the EMR multitenant architecture page (https://emr-infra.vercel.app/) from a governance/CTO-readiness document into an SRE-focused architecture challenge answer: diagram-first, decisive (stated assumptions instead of TBD/BLOCKED everywhere), with a new Reliability section and a tenant-context flow diagram.

**Architecture:** The page is a static Angular 22 app. All page content lives in ONE data file (`src/assets/data/architecture.data.ts`) typed by `ArchitectureData`/`Section` in `src/app/core/services/content.service.ts`. The template `src/app/app.html` renders each section generically (paragraphs, diagram(s), cards, steps, numberedList, tables, postContent, callouts). Diagrams are standalone SVG files in `src/assets/diagrams/`, referenced by filename. No component or template changes are needed — only data, SVGs, and the spec test.

**Tech Stack:** Angular 22 (standalone, static prerender), Vitest via `ng test`, SVG diagrams, deployed on Vercel.

**Spec:** This plan is self-contained. Background: the page was built as a CTO readiness package; the actual ask is "architecture diagram EMR multitenant" as a **challenge for an SRE role**. The review concluded: too much governance (BR/NFR tables, approval checklists, capacity TBD tables), too much hedging (TBD/Proposed/BLOCKED), and the SRE core (SLO, observability, failure modes, deploy/rollback, noisy neighbor) is missing.

## Global Constraints

- Page language: Bahasa Indonesia prose, English technical terms allowed (same style as current file).
- The words `TBD` and `BLOCKED` must NOT appear anywhere in rendered page text after this change (enforced by test). Uncertain items are stated once as assumptions in section 1 and in "Pertanyaan terbuka" in the last section.
- Do NOT modify `src/app/app.html`, `src/app/app.ts`, components, or `content.service.ts`.
- SVG style: reuse the exact CSS classes/colors from existing diagrams (`#16211E` text, `#4A5A55` sublabel, `#0F6E56` teal, `#E1EFE9` teal fill, `#E7EAF4` indigo fill, `#F5E7E2` clay fill, `#D9E0DD` borders).
- Every SVG must pass `xmllint --noout <file>`.
- Test command: `npx ng test --watch=false` (currently 10 tests pass). Build command: `npm run build`.
- Commit style: conventional commits, e.g. `feat(docs): ...`, `fix: ...`. End every commit message with `Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>`.
- Work on branch `feature/sre-challenge-restructure` created from `main`. Do not push.

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `src/assets/diagrams/master-diagram.svg` | Modify | Fix inconsistencies: PgBouncer placement, Cloudflare/Route 53 labels, add Reporting |
| `src/assets/diagrams/tenant-context-flow.svg` | Create | Sequence diagram: request → tenant context → RLS, plus async path |
| `src/app/app.spec.ts` | Modify | New expectations: 11 sections, new diagram, SRE content, no TBD/BLOCKED |
| `src/assets/data/architecture.data.ts` | Replace | New 11-section content |

New section order (ids in brackets):
1. Asumsi & scope `[scope]`
2. Master architecture diagram `[s1]` (absorbs old routing matrix)
3. Alur tenant context & lifecycle `[tenant-flow]` (NEW)
4. Model isolasi tenant `[s2]`
5. Compute & platform placement `[s4]`
6. Reliability: SLO, observability & failure modes `[reliability]` (NEW, core of the SRE story)
7. Deployment, CI/CD & migrasi `[s8]`
8. Backup & disaster recovery `[s7]`
9. Security & encryption `[s5]` (absorbs old KMS section)
10. Estimasi biaya & trade-off `[s9]`
11. Keputusan kunci & risiko `[decisions]`

Removed: `executive-summary`, `intro` (BR/NFR), `governance`, `s3` (merged into s1), `s6` (merged into s5), `capacity`, `risks` (merged into decisions).

---

### Task 0: Branch

- [ ] **Step 1: Create branch**

```bash
cd /Users/yukopangestu/yukopangestu/emr-infra
git checkout main
git checkout -b feature/sre-challenge-restructure
```

Expected: `Switched to a new branch 'feature/sre-challenge-restructure'`. Leave the untracked `.superpowers/sdd/*` files alone; do not add them.

---

### Task 1: Fix master diagram inconsistencies

**Files:**
- Modify: `src/assets/diagrams/master-diagram.svg`

**Interfaces:**
- Produces: `master-diagram.svg` (same filename; section `s1` references it).

Problems being fixed: (a) PgBouncer is drawn inside "Private Data Subnets" but the text says it runs as an EKS workload in the private app subnet; (b) Cloudflare is labelled "DNS" while Route 53 is the DNS; (c) Zero Trust and WAF are not visible; (d) Reporting service (reads from the replica) is missing; (e) sublabels at x=450 overflow the 600px-wide band.

- [ ] **Step 1: Edit viewBox (line 1)**

Replace:
```xml
<svg viewBox="80 0 800 792" xmlns="http://www.w3.org/2000/svg">
```
with:
```xml
<svg viewBox="80 0 800 770" xmlns="http://www.w3.org/2000/svg">
```

- [ ] **Step 2: Edit Cloudflare sublabel (line 41)**

Replace:
```xml
  <text x="450" y="162" class="sublabel">DNS, DDoS Protection, Cache</text>
```
with:
```xml
  <text x="200" y="162" class="sublabel">WAF · DDoS · rate limit per tenant · Zero Trust Access (staf)</text>
```

- [ ] **Step 3: Edit AWS Edge sublabel (line 50)**

Replace:
```xml
  <text x="450" y="232" class="sublabel">Route 53 DNS + protected ALB origin</text>
```
with:
```xml
  <text x="200" y="232" class="sublabel">Route 53 (DNS + health check) · WAF Regional · origin hanya dari Cloudflare</text>
```

- [ ] **Step 4: Enlarge VPC border (line 57)**

Replace:
```xml
  <rect x="20" y="280" width="600" height="440" class="zone-border" rx="4" />
```
with:
```xml
  <rect x="20" y="280" width="600" height="460" class="zone-border" rx="4" />
```

- [ ] **Step 5: Enlarge app subnet (line 85-86)**

Replace:
```xml
  <rect x="40" y="430" width="280" height="150" class="zone-border" rx="3" />
  <text x="60" y="447" class="sublabel">Private App Subnets · Java BE Services</text>
```
with:
```xml
  <rect x="40" y="430" width="280" height="195" class="zone-border" rx="3" />
  <text x="60" y="447" class="sublabel">Private App Subnets · EKS (Java services)</text>
```

- [ ] **Step 6: Replace the whole data-subnet block (lines 120-138)**

Replace everything from `  <!-- PRIVATE DATA SUBNETS -->` through the MQ circle text line `  <text x="200" y="689" text-anchor="middle" class="sublabel" font-size="9">MQ</text>` with:

```xml
  <!-- EKS platform workloads (inside app subnet) -->
  <rect x="60" y="580" width="110" height="30" class="box-indigo" rx="3" />
  <text x="115" y="599" text-anchor="middle" class="label">PgBouncer ×2</text>

  <rect x="190" y="580" width="92" height="30" class="box" rx="3" />
  <text x="236" y="599" text-anchor="middle" class="sublabel">Reporting</text>

  <!-- PRIVATE DATA SUBNETS -->
  <rect x="40" y="640" width="280" height="90" class="zone-border" rx="3" />
  <text x="60" y="657" class="sublabel">Private Data Subnets · tanpa rute internet</text>

  <rect x="60" y="667" width="130" height="35" class="box" rx="3" />
  <text x="125" y="689" text-anchor="middle" class="label">RDS PostgreSQL</text>

  <!-- Secondary components -->
  <circle cx="215" cy="684" r="14" fill="#FFFFFF" stroke="#D9E0DD" stroke-width="1" />
  <text x="215" y="688" text-anchor="middle" class="sublabel" font-size="9">Read</text>

  <circle cx="255" cy="684" r="14" fill="#FFFFFF" stroke="#D9E0DD" stroke-width="1" />
  <text x="255" y="688" text-anchor="middle" class="sublabel" font-size="9">Redis</text>

  <circle cx="295" cy="684" r="14" fill="#FFFFFF" stroke="#D9E0DD" stroke-width="1" />
  <text x="295" y="688" text-anchor="middle" class="sublabel" font-size="9">MQ</text>
```

- [ ] **Step 7: Edit DR label (line ~159)**

Replace:
```xml
  <text x="370" y="442" class="sublabel">Candidate DR (ap-southeast-1)</text>
```
with:
```xml
  <text x="370" y="442" class="sublabel">DR pilot light (ap-southeast-1) · bersyarat legal</text>
```

- [ ] **Step 8: Replace the data connection lines**

Replace:
```xml
  <!-- Connection lines from services to data layer -->
  <line x1="175" y1="565" x2="175" y2="590" class="line" />

  <!-- Return arrows from data to services -->
  <line x1="105" y1="625" x2="105" y2="570" class="arrow" />
```
with:
```xml
  <!-- Services -> PgBouncer -> RDS (runtime path) -->
  <line x1="115" y1="565" x2="115" y2="580" class="line" />
  <line x1="115" y1="610" x2="115" y2="667" class="arrow" />

  <!-- Reporting -> read replica (dependency) -->
  <line x1="236" y1="610" x2="215" y2="670" class="line" stroke-dasharray="5,3" />
```

- [ ] **Step 9: Validate**

Run: `xmllint --noout src/assets/diagrams/master-diagram.svg && grep -c "PgBouncer" src/assets/diagrams/master-diagram.svg && grep -c "DNS, DDoS" src/assets/diagrams/master-diagram.svg`
Expected: no xmllint output, then `1`, then `0` (grep exits 1 on the last — that's expected).

Open the file in a browser (`open src/assets/diagrams/master-diagram.svg`) and check: PgBouncer and Reporting sit inside the app-subnet dashed box; RDS/Read/Redis/MQ inside the data-subnet box; nothing overlaps; the long edge sublabels fit inside the teal bands.

- [ ] **Step 10: Commit**

```bash
git add src/assets/diagrams/master-diagram.svg
git commit -m "fix: align master diagram with PgBouncer placement and edge roles

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"
```

---

### Task 2: Create tenant-context flow diagram

**Files:**
- Create: `src/assets/diagrams/tenant-context-flow.svg`

**Interfaces:**
- Produces: `tenant-context-flow.svg` (section `tenant-flow` references it in Task 3).

- [ ] **Step 1: Write the file with exactly this content**

```xml
<svg viewBox="0 0 980 660" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .title { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: 16px; font-weight: 600; fill: #16211E; }
      .label { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: 13px; font-weight: 600; fill: #16211E; }
      .msg { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: 11px; fill: #16211E; }
      .sublabel { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: 11px; fill: #4A5A55; }
      .zone-label { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: 12px; font-weight: 600; fill: #0F6E56; }
      .box { fill: #FFFFFF; stroke: #D9E0DD; stroke-width: 1.5; }
      .box-teal { fill: #E1EFE9; stroke: #8FC4B2; stroke-width: 1.5; }
      .box-indigo { fill: #E7EAF4; stroke: #A9B6DC; stroke-width: 1.5; }
      .box-clay { fill: #F5E7E2; stroke: #DCAE9E; stroke-width: 1.5; }
      .lifeline { stroke: #D9E0DD; stroke-width: 1.5; stroke-dasharray: 4,3; }
      .arrow { stroke: #0F6E56; stroke-width: 1.5; fill: none; marker-end: url(#ah); }
      .ret { stroke: #4A5A55; stroke-width: 1.2; stroke-dasharray: 5,3; fill: none; marker-end: url(#ahg); }
      .sep { stroke: #D9E0DD; stroke-width: 1; }
    </style>
    <marker id="ah" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0 0, 10 3, 0 6" fill="#0F6E56" />
    </marker>
    <marker id="ahg" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0 0, 10 3, 0 6" fill="#4A5A55" />
    </marker>
  </defs>

  <text x="490" y="28" text-anchor="middle" class="title">Alur tenant context: request sampai Row-Level Security</text>

  <!-- Participants -->
  <rect x="30" y="48" width="120" height="40" class="box" rx="4" />
  <text x="90" y="73" text-anchor="middle" class="label">Client</text>
  <rect x="190" y="48" width="120" height="40" class="box-teal" rx="4" />
  <text x="250" y="73" text-anchor="middle" class="label">Cloudflare</text>
  <rect x="350" y="48" width="120" height="40" class="box-indigo" rx="4" />
  <text x="410" y="73" text-anchor="middle" class="label">Gateway</text>
  <rect x="510" y="48" width="120" height="40" class="box" rx="4" />
  <text x="570" y="73" text-anchor="middle" class="label">Service</text>
  <rect x="670" y="48" width="120" height="40" class="box-indigo" rx="4" />
  <text x="730" y="73" text-anchor="middle" class="label">PgBouncer</text>
  <rect x="830" y="48" width="120" height="40" class="box-teal" rx="4" />
  <text x="890" y="73" text-anchor="middle" class="label">PostgreSQL</text>

  <!-- Lifelines -->
  <line x1="90" y1="88" x2="90" y2="440" class="lifeline" />
  <line x1="250" y1="88" x2="250" y2="440" class="lifeline" />
  <line x1="410" y1="88" x2="410" y2="440" class="lifeline" />
  <line x1="570" y1="88" x2="570" y2="440" class="lifeline" />
  <line x1="730" y1="88" x2="730" y2="440" class="lifeline" />
  <line x1="890" y1="88" x2="890" y2="440" class="lifeline" />

  <!-- 1 -->
  <text x="170" y="118" text-anchor="middle" class="msg">1. HTTPS + JWT</text>
  <text x="170" y="131" text-anchor="middle" class="sublabel">rs-a.emr.id</text>
  <line x1="92" y1="138" x2="248" y2="138" class="arrow" />

  <!-- 2 -->
  <text x="330" y="160" text-anchor="middle" class="msg">2. WAF, rate limit</text>
  <text x="330" y="173" text-anchor="middle" class="sublabel">hapus header X-Tenant-*</text>
  <line x1="252" y1="180" x2="408" y2="180" class="arrow" />

  <!-- 3: gateway check -->
  <rect x="345" y="194" width="130" height="44" class="box-clay" rx="3" />
  <text x="410" y="212" text-anchor="middle" class="msg">3. verifikasi JWT</text>
  <text x="410" y="228" text-anchor="middle" class="sublabel">klaim tenant = subdomain</text>

  <!-- 4 -->
  <text x="490" y="256" text-anchor="middle" class="msg">4. tenant_id terverifikasi</text>
  <text x="490" y="269" text-anchor="middle" class="sublabel">header internal + mTLS</text>
  <line x1="412" y1="276" x2="568" y2="276" class="arrow" />

  <!-- 5 -->
  <text x="650" y="298" text-anchor="middle" class="msg">5. BEGIN;</text>
  <text x="650" y="311" text-anchor="middle" class="sublabel">SET LOCAL app.tenant_id</text>
  <line x1="572" y1="318" x2="728" y2="318" class="arrow" />

  <!-- 6 -->
  <text x="810" y="340" text-anchor="middle" class="msg">6. query</text>
  <text x="810" y="353" text-anchor="middle" class="sublabel">transaction pooling</text>
  <line x1="732" y1="360" x2="888" y2="360" class="arrow" />

  <!-- 7: RLS -->
  <rect x="822" y="370" width="136" height="36" class="box-clay" rx="3" />
  <text x="890" y="385" text-anchor="middle" class="msg">7. RLS filter</text>
  <text x="890" y="399" text-anchor="middle" class="sublabel">tenant_id = konteks</text>

  <!-- 8: return + commit -->
  <text x="730" y="422" text-anchor="middle" class="sublabel">8. hanya baris rs-a · COMMIT, konteks hilang</text>
  <line x1="888" y1="430" x2="572" y2="430" class="ret" />

  <!-- Separator -->
  <line x1="30" y1="460" x2="950" y2="460" class="sep" />
  <text x="30" y="484" class="zone-label">Jalur async (tidak melewati gateway)</text>

  <rect x="30" y="500" width="150" height="48" class="box" rx="4" />
  <text x="105" y="520" text-anchor="middle" class="msg">Service</text>
  <text x="105" y="536" text-anchor="middle" class="sublabel">tulis event ke outbox</text>

  <rect x="220" y="500" width="150" height="48" class="box-indigo" rx="4" />
  <text x="295" y="520" text-anchor="middle" class="msg">Amazon MQ</text>
  <text x="295" y="536" text-anchor="middle" class="sublabel">header tenant_id</text>

  <rect x="410" y="500" width="170" height="48" class="box-clay" rx="4" />
  <text x="495" y="520" text-anchor="middle" class="msg">Consumer</text>
  <text x="495" y="536" text-anchor="middle" class="sublabel">header = payload? idempotent</text>

  <rect x="620" y="500" width="150" height="48" class="box" rx="4" />
  <text x="695" y="520" text-anchor="middle" class="msg">BEGIN;</text>
  <text x="695" y="536" text-anchor="middle" class="sublabel">SET LOCAL app.tenant_id</text>

  <rect x="810" y="500" width="140" height="48" class="box-teal" rx="4" />
  <text x="880" y="520" text-anchor="middle" class="msg">PostgreSQL</text>
  <text x="880" y="536" text-anchor="middle" class="sublabel">RLS</text>

  <line x1="180" y1="524" x2="218" y2="524" class="arrow" />
  <line x1="370" y1="524" x2="408" y2="524" class="arrow" />
  <line x1="580" y1="524" x2="618" y2="524" class="arrow" />
  <line x1="770" y1="524" x2="808" y2="524" class="arrow" />

  <!-- Fail-closed rules -->
  <rect x="30" y="572" width="920" height="68" class="box" rx="4" />
  <text x="50" y="594" class="zone-label">Fail-closed</text>
  <text x="50" y="614" class="msg">Tanpa konteks → nol baris. Klaim ≠ subdomain → 403 + audit event. Header ≠ payload di consumer → pesan ke DLQ + alert.</text>
  <text x="50" y="630" class="sublabel">Konteks selalu SET LOCAL (cakupan transaksi), tidak pernah SET biasa: koneksi PgBouncer berikutnya bisa melayani tenant lain.</text>
</svg>
```

- [ ] **Step 2: Validate**

Run: `xmllint --noout src/assets/diagrams/tenant-context-flow.svg`
Expected: no output (exit 0).

Run: `open src/assets/diagrams/tenant-context-flow.svg` and check that no text overlaps a box border or another text. If a label overflows, shorten the label text only; do not move participants.

- [ ] **Step 3: Commit**

```bash
git add src/assets/diagrams/tenant-context-flow.svg
git commit -m "feat(docs): add tenant context flow diagram

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"
```

---

### Task 3: Restructure page content for the SRE challenge

**Files:**
- Modify: `src/app/app.spec.ts` (third `it` block)
- Replace: `src/assets/data/architecture.data.ts`

**Interfaces:**
- Consumes: `ArchitectureData`, `Section`, `Table`, `Callout` from `src/app/core/services/content.service.ts` (unchanged). Diagram files `master-diagram.svg`, `tenant-context-flow.svg`, `isolation-model.svg`, `identity-trust-boundary.svg`, `dr-failover.svg`.
- Rendering notes (from `src/app/app.html`): `content` is split into paragraphs on `\n\n`; `subheading` renders before the table at index 1; `postContent` renders after tables; callouts render last.

- [ ] **Step 1: Update the failing test**

In `src/app/app.spec.ts`, replace the whole third test (`it('should render the readiness sections and all architecture diagrams', ...)`) with:

```ts
  it('should render the SRE-focused sections and all architecture diagrams', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const text = compiled.textContent ?? '';

    expect(compiled.querySelectorAll('.document-section')).toHaveLength(11);
    expect(compiled.querySelector('#reliability')).toBeTruthy();
    expect(compiled.querySelector('#tenant-flow')).toBeTruthy();
    expect(text).toContain('Error budget');
    expect(text).toContain('Failure mode');
    expect(text).toContain('expand/contract');
    expect(text).not.toContain('TBD');
    expect(text).not.toContain('BLOCKED');
    expect(text).not.toContain('BR-01');
    expect(compiled.querySelector('img[src="/assets/diagrams/master-diagram.svg"]')).toBeTruthy();
    expect(compiled.querySelector('img[src="/assets/diagrams/tenant-context-flow.svg"]')).toBeTruthy();
    expect(compiled.querySelector('img[src="/assets/diagrams/isolation-model.svg"]')).toBeTruthy();
    expect(compiled.querySelector('img[src="/assets/diagrams/dr-failover.svg"]')).toBeTruthy();
    expect(compiled.querySelector('img[src="/assets/diagrams/identity-trust-boundary.svg"]')).toBeTruthy();
  });
```

Leave the first two tests unchanged (the page title stays `Arsitektur produksi platform EMR multitenant`).

- [ ] **Step 2: Run test to verify it fails**

Run: `npx ng test --watch=false`
Expected: FAIL in `app.spec.ts` — `expected [...] to have a length of 11 but got 14`.

- [ ] **Step 3: Replace `src/assets/data/architecture.data.ts` with exactly this content**

```ts
import { ArchitectureData } from '../../app/core/services/content.service';

export const architectureData: ArchitectureData = {
  title: 'Arsitektur produksi platform EMR multitenant',
  lede: 'Satu instalasi di AWS Jakarta melayani puluhan fasilitas kesehatan. Setiap keputusan di halaman ini berpangkal pada dua syarat: data pasien satu fasilitas tidak boleh dapat diakses fasilitas lain, dan workflow klinis harus tetap berjalan ketika satu komponen gagal.',
  metadata: {
    'Region': 'ap-southeast-3 (Jakarta), Multi-AZ',
    'Isolasi': 'Pooled PostgreSQL + partisi + Row-Level Security',
    'SLO': '99,9% workflow klinis',
    'Estimasi': '± $5.060 / bulan'
  },
  sections: [
    {
      id: 'scope',
      number: 1,
      title: 'Asumsi & scope',
      content: 'Platform EMR multitenant untuk jaringan fasilitas kesehatan: aplikasi pasien (Flutter), dashboard staf (Angular), dan Java services di EKS. Karena workload nyata belum tersedia, desain ini berangkat dari asumsi eksplisit di bawah. Semua sizing, SLO, dan biaya diturunkan dari angka ini; bila asumsinya berubah, bagian yang terdampak disebutkan di kolom terakhir.',
      tables: [
        {
          headers: ['Parameter', 'Asumsi', 'Mempengaruhi'],
          rows: [
            ['Fasilitas (tenant)', '50 saat go-live, tumbuh ke 150 dalam 2 tahun', 'Jumlah partisi, sizing RDS, biaya per fasilitas'],
            ['Pengguna staf', '± 2.500 terdaftar, puncak ± 800 sesi bersamaan', 'Node EKS, pool PgBouncer'],
            ['Pengguna aplikasi pasien', '± 100.000 terdaftar, ± 5% aktif harian', 'Gateway Public, rate limit, Redis'],
            ['Beban puncak', '± 300 request/detik (jam 08.00–11.00)', 'Autoscaling, load test'],
            ['Encounter', '± 20.000 per hari di seluruh fasilitas', 'Pertumbuhan tabel volume tinggi'],
            ['Pertumbuhan data', 'DB ± 80 GB/bulan, dokumen S3 ± 150 GB/bulan', 'Storage RDS/S3, backup'],
            ['Target reliability', 'SLO 99,9% workflow klinis; RPO 5 menit, RTO 1 jam (AZ/DB), 2 jam (region)', 'Multi-AZ, replica, DR'],
            ['Data residency', 'Primary di Indonesia; DR lintas negara hanya jika disetujui Legal', 'Pilihan DR region']
          ]
        }
      ],
      cards: [
        { title: 'Tenant model', description: 'Pooled PostgreSQL: satu database, partisi per tenant untuk tabel volume tinggi, RLS sebagai penegak isolasi. Tenant besar dapat dipindah ke database sendiri (silo).' },
        { title: 'Edge & akses', description: 'Cloudflare untuk pasien, Cloudflare Zero Trust untuk staf. ALB hanya menerima trafik dari Cloudflare.' },
        { title: 'Reliability', description: 'SLO per kelas workflow, alert berbasis burn rate, failure mode yang terdokumentasi, dan drill restore terjadwal.' },
        { title: 'Delivery', description: 'Terraform + GitOps, canary per cohort tenant, auto-rollback berbasis SLO, migrasi expand/contract.' }
      ]
    },
    {
      id: 's1',
      number: 2,
      title: 'Master architecture diagram',
      content: 'Trafik pasien masuk lewat Cloudflare menuju ALB Public dan Gateway Public, dan hanya dapat mencapai layanan yang dibutuhkan pasien. Trafik staf masuk lewat Cloudflare Zero Trust (IdP + MFA) menuju ALB Admin dan Gateway Admin. Route 53 memegang DNS dan health check; ALB origin dikunci sehingga akses langsung di luar Cloudflare ditolak.\n\nPgBouncer berjalan sebagai dua replika workload EKS di private app subnet. Security group RDS hanya menerima koneksi dari PgBouncer. Zona data tidak memiliki rute ke internet; egress ke SATUSEHAT dan BPJS lewat NAT per AZ.',
      diagram: {
        file: 'master-diagram.svg',
        caption: 'Gateway Public dan Gateway Admin dipisahkan agar permukaan yang terpapar internet sekecil mungkin. Reporting membaca dari read replica sehingga kueri berat tidak mengganggu workflow klinis di primary.'
      },
      tables: [
        {
          headers: ['Service', 'Gateway Public', 'Gateway Admin', 'Alasan'],
          rows: [
            ['Patient', '✓', '✓', 'Pasien melihat data dirinya sendiri'],
            ['Encounter', '✓', '✓', 'Riwayat kunjungan pasien'],
            ['Order', '—', '✓', 'Hanya tenaga medis'],
            ['Result', '✓', '✓', 'Hasil dirilis ke pasien setelah verifikasi'],
            ['Identity', '—', '✓', 'Manajemen pengguna internal'],
            ['Tenant', '—', '✓', 'Provisioning dan operasional platform'],
            ['Billing', '—', '✓', 'Klaim dan penagihan'],
            ['Reporting', '—', '✓', 'Laporan fasilitas dari read replica'],
            ['Audit', '—', '—', 'Hanya menerima event dari antrean']
          ]
        },
        {
          headers: ['Service', 'RDS primary', 'Read replica', 'Redis', 'Amazon MQ'],
          rows: [
            ['Gateway', '—', '—', '✓ sesi', '—'],
            ['Patient', '✓', '—', '✓ cache', 'publish'],
            ['Encounter', '✓', '—', '—', 'publish'],
            ['Order', '✓', '—', '—', 'publish'],
            ['Result', '✓', '—', '—', 'pub + consume'],
            ['Billing', '✓', '—', '—', 'pub + consume'],
            ['Reporting', '—', '✓', '—', '—'],
            ['Audit', '✓ hanya tambah', '—', '—', 'consume']
          ]
        }
      ]
    },
    {
      id: 'tenant-flow',
      number: 3,
      title: 'Alur tenant context & lifecycle',
      content: 'Isolasi hanya sekuat titik terlemah di jalur tenant context. Diagram berikut menunjukkan dari mana tenant ditentukan, di mana diverifikasi, dan bagaimana sampai ke database. Aturan intinya: tenant tidak pernah diambil dari input yang bisa dikontrol pengguna, dan konteks database selalu bercakupan transaksi.',
      diagram: {
        file: 'tenant-context-flow.svg',
        caption: 'Jalur sinkron diverifikasi di gateway. Jalur async tidak melewati gateway, sehingga consumer wajib memvalidasi dan menulis konteks sendiri. Event ditulis ke tabel outbox dalam transaksi yang sama agar tidak hilang ketika broker sedang tidak tersedia.'
      },
      tables: [
        {
          headers: ['Jalur', 'Sumber tenant', 'Validasi', 'Jika gagal'],
          rows: [
            ['Staf (dashboard)', 'Subdomain + klaim tenant di JWT', 'Klaim harus sama dengan subdomain', '403 + audit event'],
            ['Pasien (mobile app)', 'Fasilitas yang dipilih di app', 'Gateway memeriksa link pasien–fasilitas di Patient service', '403 + audit event'],
            ['Consumer antrean', 'Header tenant_id pada pesan', 'Header harus sama dengan tenant di payload', 'Pesan ke DLQ + alert'],
            ['Job terjadwal', 'Daftar tenant aktif', 'Satu transaksi per tenant, konteks ditulis per iterasi', 'Job gagal untuk tenant itu saja'],
            ['Operator platform', 'Tidak ada', 'Tanpa konteks → nol baris; akses data lewat break-glass', 'Ditolak, break-glass teraudit']
          ]
        },
        {
          headers: ['Tahap lifecycle', 'Otomasi', 'Bukti selesai'],
          rows: [
            ['Onboard', 'Tenant service membuat baris tenant, partisi, hostname Cloudflare, dan konfigurasi awal', 'Smoke test isolasi untuk tenant baru lulus'],
            ['Suspend', 'Gateway menolak semua request tenant; data tetap tersimpan', 'Request ditolak, audit event tercatat'],
            ['Export', 'Ekspor partisi tenant ke S3 terenkripsi', 'Checksum dan jumlah baris cocok'],
            ['Pindah ke silo', 'Detach partisi → RDS terpisah, verifikasi paralel, pindahkan routing di gateway', 'Rekonsiliasi data, SLO stabil 7 hari'],
            ['Terminate', 'Setelah masa retensi, partisi di-drop; jejak audit tetap disimpan', 'Laporan terminasi ditandatangani']
          ]
        }
      ],
      subheading: 'Lifecycle tenant',
      subheadingDescription: 'Siklus hidup tenant adalah pembeda platform multitenant. Setiap tahap otomatis, dapat diulang, dan meninggalkan bukti.',
      callouts: [
        {
          type: 'note',
          content: 'Pasien lintas fasilitas: identitas pasien bersifat global (tabel identitas berisi HMAC NIK dan IHS number SATUSEHAT, hanya dapat diakses role Identity service), sedangkan rekam medis tetap milik masing-masing fasilitas dan dilindungi RLS. Tabel link pasien–fasilitas menentukan fasilitas mana yang boleh dilihat pasien di aplikasi. Pertukaran rekam medis antar fasilitas hanya lewat SATUSEHAT dan consent, tidak lewat query langsung.'
        }
      ]
    },
    {
      id: 's2',
      number: 4,
      title: 'Model isolasi tenant',
      content: 'Satu basis data melayani seluruh fasilitas; pemisahannya ditegakkan mesin basis data, bukan kode aplikasi. Semua tabel tenant-aware memakai ENABLE dan FORCE ROW LEVEL SECURITY. Migration/owner role dipisahkan dari runtime role; runtime role bukan owner, bukan superuser, dan tidak memiliki BYPASSRLS.',
      diagram: {
        file: 'isolation-model.svg',
        caption: 'Partisi memberi manfaat performa dan kemudahan memindahkan satu fasilitas keluar. Row-Level Security yang memberi jaminan keamanannya. Keduanya menjawab persoalan berbeda dan tidak saling menggantikan.'
      },
      tables: [
        {
          headers: ['Kelas tabel', 'Contoh', 'Perlakuan'],
          rows: [
            ['Volume tinggi', 'Kunjungan, observasi, hasil lab, resep, jejak audit', 'Partisi per tenant dan RLS'],
            ['Volume sedang', 'Pasien, pengguna, departemen, konfigurasi', 'RLS saja'],
            ['Referensi global', 'ICD-10, formularium obat, wilayah', 'Tanpa penanda tenant, hak baca saja']
          ]
        },
        {
          headers: ['Resource', 'Tenant boundary', 'Kontrol', 'Negative test di CI'],
          rows: [
            ['RDS PostgreSQL', 'tenant_id pada row + partition key', 'FORCE RLS; USING/WITH CHECK; SET LOCAL', 'A tidak dapat read/write B; tanpa konteks = nol baris'],
            ['S3 documents', 'Prefix tenant + metadata objek', 'IAM condition, KMS, presigned URL per objek', 'URL milik A tidak dapat membaca objek B'],
            ['Redis cache', 'Key berprefiks tenant', 'Key builder terpusat', 'A tidak mendapat cache hit milik B'],
            ['Amazon MQ', 'tenant_id di envelope pesan', 'Validasi producer/consumer, DLQ, idempotency', 'Consumer menolak pesan dengan header ≠ payload'],
            ['Logs/traces/metrics', 'Label tenant_id, tanpa PHI', 'Redaksi, access boundary', 'Log tidak memuat NIK atau isi rekam medis'],
            ['Backup/restore', 'Mapping tenant', 'Enkripsi, validasi restore', 'Restore per tenant lengkap (jumlah baris cocok)']
          ]
        }
      ],
      callouts: [
        {
          type: 'warning',
          content: 'Keputusan yang mahal untuk dibalik: kunci partisi wajib menjadi bagian dari setiap primary key dan unique constraint. Primary key berbentuk (tenant_id, id), dan seluruh foreign key ikut menjadi komposit. Struktur ini harus final sebelum modul klinis pertama diimplementasikan.'
        }
      ],
      postContent: ['Partisi hanya untuk kelas volume tinggi. Pada 150 fasilitas dengan lima tabel bervolume tinggi, jumlah partisi sekitar 750. Angka ini masih aman untuk perencanaan kueri PostgreSQL modern, tetapi dipantau lewat waktu planning. Tenant yang tumbuh sangat besar dipindah ke silo.']
    },
    {
      id: 's4',
      number: 5,
      title: 'Compute & platform placement',
      content: 'Tanpa bastion, tanpa VM runner, tanpa VM batch. Semuanya digantikan layanan terkelola, sehingga tidak ada host tambahan yang harus di-patch.\n\nSetiap workload wajib memiliki resource request dan limit, Pod Disruption Budget, topology spread lintas AZ, dan NetworkPolicy default-deny. Startup probe menunggu inisialisasi JVM. Liveness hanya memeriksa proses. Readiness tidak bergantung sinkron pada database bersama, supaya gangguan database tidak membuat semua pod keluar dari load balancer sekaligus; kesehatan database dipantau lewat metrics dan circuit breaker.',
      cards: [
        { title: 'EKS', description: '3 × m6i.xlarge (satu per AZ), Cluster Autoscaler sampai 6 node. HPA pada CPU dan latency p95. Sizing divalidasi lewat load test 2× beban puncak.' },
        { title: 'PgBouncer', description: 'Dua replika, transaction pooling, anti-affinity lintas AZ, PDB minAvailable 1. Jika pool tidak tersedia, request gagal closed; tidak ada fallback langsung ke RDS.' },
        { title: 'SSM Session Manager', description: 'Pengganti bastion. Shell ke node tanpa SSH publik, seluruh sesi terekam.' },
        { title: 'Cloudflare Zero Trust', description: 'Pengganti VPN. Akses staf ke ALB Admin lewat IdP + MFA.' },
        { title: 'EventBridge + Kubernetes Job', description: 'Pengganti VM batch. Job terjadwal berjalan di cluster dengan batas konkurensi per tenant.' },
        { title: 'Runner CI SaaS', description: 'Build di luar VPC, image ditandatangani dan didorong ke ECR. Tidak ada runner EC2 yang perlu dirawat.' }
      ]
    },
    {
      id: 'reliability',
      number: 6,
      title: 'Reliability: SLO, observability & failure modes',
      content: 'Reliability diukur dari sisi pengguna, bukan dari uptime server. Setiap kelas workflow punya SLO sendiri karena dampaknya berbeda: registrasi pasien yang gagal di IGD jauh lebih mahal daripada laporan bulanan yang terlambat.\n\nError budget menentukan prioritas: selama budget tersisa, tim bebas merilis; bila budget habis dalam satu bulan, rilis fitur dihentikan dan kapasitas tim dialihkan ke perbaikan reliability sampai budget pulih.',
      tables: [
        {
          headers: ['Kelas workflow', 'SLI', 'SLO (30 hari)', 'Error budget'],
          rows: [
            ['Klinis (registrasi, encounter, order, result)', 'Request sukses (non-5xx) dan p95 < 500 ms', '99,9%', '± 43 menit / bulan'],
            ['Aplikasi pasien', 'Request sukses dan p95 < 800 ms', '99,5%', '± 3,6 jam / bulan'],
            ['Admin & billing', 'Request sukses dan p95 < 1 detik', '99,5%', '± 3,6 jam / bulan'],
            ['Reporting', 'Query sukses; replica lag < 60 detik', '99,0%', '± 7,2 jam / bulan'],
            ['Integrasi SATUSEHAT/BPJS', 'Event terkirim ≤ 15 menit sejak dibuat', '99,0%', 'Sisanya wajib terekonsiliasi ≤ 24 jam'],
            ['Audit event', 'Event tersimpan ≤ 5 menit', '99,99%', 'Tidak boleh ada event hilang']
          ]
        },
        {
          headers: ['Failure mode', 'Dampak ke pengguna', 'Deteksi', 'Mitigasi otomatis', 'Runbook / manual'],
          rows: [
            ['RDS primary gagal (satu AZ)', 'Write gagal ± 60–120 detik', 'RDS event, lonjakan error rate', 'Multi-AZ failover; PgBouncer reconnect; retry idempoten di client', 'Verifikasi replica lag, catat dampak ke SLO'],
            ['Satu replika PgBouncer mati', 'Tidak ada (replika lain melayani)', 'Pod restart, pool metrics', 'EKS reschedule, PDB', '—'],
            ['Kedua PgBouncer mati', 'Semua request DB gagal closed', 'Readiness gagal, alert SLO', 'Reschedule pod', 'Scale up / rollback konfigurasi; tidak ada bypass ke RDS'],
            ['Tenant membebani DB (noisy neighbor)', 'Latency naik untuk semua tenant', 'Latency dan waktu tunggu pool per tenant', 'Bulkhead per tenant, statement_timeout', 'Throttle tenant di Cloudflare/gateway, cek kueri lambat'],
            ['Amazon MQ tidak tersedia', 'Integrasi dan billing tertunda; workflow klinis tetap jalan', 'Publish error, umur outbox', 'Outbox menahan event, relay retry', 'Replay dari outbox setelah broker pulih'],
            ['Redis gagal', 'Staf login ulang; latency naik karena cache miss', 'Error rate Redis', 'ElastiCache failover, circuit breaker lewati cache', 'Pantau beban DB'],
            ['Satu AZ hilang', 'Kapasitas turun ± 1/3 sementara', 'Node NotReady, health check ALB', 'Pod pindah AZ, autoscaler menambah node, NAT per AZ', 'Verifikasi kapasitas cukup'],
            ['SATUSEHAT/BPJS lambat atau down', 'Pengiriman tertunda, pelayanan tidak terganggu', 'Error rate dan umur antrean per integrasi', 'Retry backoff, circuit breaker, DLQ', 'Job rekonsiliasi harian'],
            ['Deploy bermasalah', 'Error rate naik pada cohort canary', 'Analisis canary (error rate, p95)', 'Auto-rollback', 'Postmortem'],
            ['Region Jakarta down', 'Seluruh layanan down', 'Health check Route 53 + deklarasi insiden', '—', 'Runbook DR, target RTO 2 jam']
          ]
        }
      ],
      cards: [
        { title: 'Telemetri', description: 'OpenTelemetry di setiap service → CloudWatch (metrics, logs) dan X-Ray (traces). Setiap sinyal membawa label tenant_id dan service; PHI diredaksi di collector.' },
        { title: 'Alerting berbasis burn rate', description: 'Page bila burn rate 14,4× dalam 1 jam atau 6× dalam 6 jam; ticket bila 1× dalam 3 hari. Alert berbasis gejala pengguna, bukan CPU.' },
        { title: 'Dashboard per tenant', description: 'Latency, error rate, dan waktu tunggu pool per tenant untuk mendeteksi noisy neighbor dan menjawab "apakah hanya fasilitas saya yang lambat?".' },
        { title: 'Synthetic check', description: 'Skenario login → cari pasien → buka encounter dijalankan tiap menit terhadap tenant sintetis di setiap AZ.' }
      ],
      subheading: 'Failure mode analysis',
      subheadingDescription: 'Setiap komponen punya jawaban untuk pertanyaan "apa yang terjadi kalau ini mati?". Baris tanpa mitigasi otomatis wajib punya runbook yang sudah dilatih.',
      postContent: [
        'Kontrol noisy neighbor berlapis: rate limit per tenant di Cloudflare (600 request/menit untuk API pasien), token bucket per tenant di gateway (50 RPS stabil, burst 100), bulkhead maksimal 10 operasi DB bersamaan per tenant per pod, statement_timeout 5 detik untuk role OLTP dan 60 detik untuk reporting di replica, serta idle_in_transaction_session_timeout 30 detik.',
        'On-call: SEV1 (dugaan kebocoran lintas tenant, atau workflow klinis down lebih dari 5 menit) dipage langsung, acknowledge ≤ 5 menit, ada incident commander dan status update ke fasilitas tiap 30 menit. SEV2 (degradasi atau satu integrasi down) ditangani ≤ 30 menit. SEV3 lewat ticket. Setiap SEV1/SEV2 menghasilkan postmortem tanpa menyalahkan individu dalam 5 hari kerja.'
      ],
      callouts: [
        {
          type: 'warning',
          content: 'Dugaan akses lintas tenant selalu SEV1, walaupun sistem tetap berjalan normal. Langkah pertama adalah containment (suspend jalur yang terdampak), bukan investigasi. Setelah itu audit log dipakai untuk menentukan data dan fasilitas yang terdampak.'
        }
      ]
    },
    {
      id: 's8',
      number: 7,
      title: 'Deployment, CI/CD & migrasi',
      content: 'Infrastruktur dikelola dengan Terraform; workload dengan GitOps (Argo CD), sehingga state cluster selalu dapat direkonstruksi dari Git. Gerbang isolasi memblokir pipeline, bukan sekadar memberi peringatan.\n\nRollout memakai canary per cohort tenant: cohort 0 adalah tenant sintetis dan internal, cohort 1 adalah tiga fasilitas pilot, lalu seluruh fasilitas. Setiap tahap dianalisis 15 menit terhadap error rate dan p95; jika melewati ambang, Argo Rollouts melakukan rollback otomatis.\n\nMigrasi skema berjalan satu kali untuk semua fasilitas karena database dipakai bersama. Karena itu setiap migrasi memakai pola expand/contract: tambah kolom atau tabel baru dulu, deploy kode yang kompatibel dengan skema lama dan baru, backfill bertahap, lalu hapus struktur lama di rilis berikutnya. lock_timeout 5 detik dan CREATE INDEX CONCURRENTLY mencegah migrasi mengunci tabel klinis.',
      steps: [
        { title: 'Commit', description: 'Merge request' },
        { title: 'Build', description: 'Unit test' },
        { title: 'Scan', description: 'SAST, dependency, image' },
        { title: 'Uji isolasi', description: 'Gerbang pemblokir', isGate: true },
        { title: 'Push ECR', description: 'Image ditandatangani' },
        { title: 'Migrasi expand', description: 'Role terpisah' },
        { title: 'Canary', description: 'Cohort 0 → 1 → semua' },
        { title: 'Analisis SLO', description: 'Auto-rollback', isGate: true }
      ],
      numberedList: [
        'Kueri fasilitas A tidak mengembalikan baris fasilitas B',
        'Kueri tanpa konteks mengembalikan nol baris, bukan seluruh baris',
        'Penulisan dengan penanda fasilitas lain ditolak pemeriksaan tulis',
        'Permintaan paralel dari beberapa fasilitas tidak saling mencemari konteks',
        'Konteks bersih setelah permintaan selesai, termasuk ketika terjadi eksepsi',
        'Konteks tidak bertahan pada koneksi setelah transaksi berakhir',
        'Role aplikasi terverifikasi tidak dapat melewati Row-Level Security',
        'Consumer antrean menerapkan konteks dari header pesan dan menolak header ≠ payload',
        'Seluruh kunci cache berprefiks fasilitas',
        'Presigned URL satu fasilitas tidak dapat mengakses objek fasilitas lain'
      ],
      callouts: [
        {
          type: 'note',
          content: 'Kasus 6 wajib dijalankan melalui PgBouncer dalam mode transaction pooling, bukan koneksi langsung ke RDS. Pada koneksi langsung, kesalahan cakupan konteks tidak akan terdeteksi sama sekali. Staging memakai data teranonimisasi; data pasien asli tidak pernah keluar dari produksi.'
        }
      ]
    },
    {
      id: 's7',
      number: 8,
      title: 'Backup & disaster recovery',
      content: 'Jakarta adalah primary dengan Multi-AZ untuk semua komponen stateful. DR lintas region memakai model pilot light di Singapore: replica RDS dan replikasi S3 berjalan terus, sedangkan compute baru dibangun saat DR dideklarasikan. Karena menyangkut data residency, opsi Singapore hanya diaktifkan setelah persetujuan Legal. Jika tidak disetujui, fallback-nya adalah backup immutable in-country dengan restore drill, dan RTO region naik menjadi 8 jam.\n\nBackup yang belum pernah diuji restore-nya tidak dapat dianggap sebagai backup. Restore drill adalah aktivitas rutin terjadwal, bukan respons terhadap insiden.',
      tables: [
        {
          headers: ['Komponen', 'Metode', 'Lintas region', 'RPO', 'RTO'],
          rows: [
            ['RDS PostgreSQL', 'Multi-AZ + PITR + cross-region replica', 'ap-southeast-1', '≤ 5 menit', '≤ 1 jam'],
            ['S3 dokumen medis', 'Versioning + replikasi lintas region + Object Lock', 'ap-southeast-1', '≤ 15 menit', '≤ 1 jam'],
            ['ElastiCache Redis', 'Tidak di-backup, dibangun ulang', '—', 'Sesi hilang', '≤ 15 menit'],
            ['Amazon MQ', 'Cluster + IaC; event aman di outbox', 'Re-apply IaC', '0 (outbox)', '≤ 2 jam'],
            ['Kegagalan satu AZ', 'Failover otomatis RDS, rescheduling pod', '—', '≈ 0', '≤ 5 menit'],
            ['Kegagalan region', 'Promosi replica + deploy EKS via IaC', 'ap-southeast-1', '≤ 5 menit', '≤ 2 jam']
          ]
        },
        {
          headers: ['Drill', 'Frekuensi', 'Kriteria lulus'],
          rows: [
            ['Restore RDS ke instans sementara', 'Bulanan', 'Selesai dalam RTO; checksum dan jumlah baris per tenant cocok'],
            ['Restore satu tenant', 'Kuartalan', 'Partisi tenant diekspor dan diimpor ulang tanpa konflik'],
            ['Failover AZ (game day)', 'Kuartalan', 'SLO klinis tetap terpenuhi selama drill'],
            ['Failover dan failback region', 'Semesteran', 'Synthetic clinical workflow lulus di region DR; failback tanpa kehilangan data']
          ]
        }
      ],
      diagram: {
        file: 'dr-failover.svg',
        caption: 'Failover region dideklarasikan oleh manusia, bukan otomatis oleh health check, karena melibatkan promosi database dan keputusan data residency. Urutan: deklarasi insiden → promosi RDS → deploy dan scale EKS → aktifkan secret/KMS → siapkan MQ dan replay outbox → pindahkan DNS → synthetic check → rekonsiliasi tenant.'
      },
      callouts: [
        {
          type: 'warning',
          content: 'Restore satu fasilitas adalah kelemahan yang diakui dari model database bersama. Prosedurnya: PITR ke instans sementara, ekspor partisi fasilitas terkait, validasi, lalu impor kembali dengan penanganan konflik yang terdefinisi. Prosedur ini dilatih kuartalan agar tidak pertama kali dijalankan saat insiden.'
        }
      ]
    },
    {
      id: 's5',
      number: 9,
      title: 'Security & encryption',
      content: 'Empat lapis pertama bersifat preventif dan semuanya dapat gagal karena kesalahan implementasi. Lapis kelima yang menentukan apakah kegagalan itu berubah menjadi kebocoran data.\n\nIdP dan MFA wajib untuk staf; break-glass dibatasi waktu dan diaudit. Workload memakai EKS Pod Identity dengan satu IAM role per service, bukan node role bersama. Image ditandatangani dan diverifikasi saat admission; Pod Security Standards dan NetworkPolicy default-deny berlaku di seluruh namespace.',
      diagrams: [
        {
          file: 'identity-trust-boundary.svg',
          caption: 'Trust boundary dipisahkan antara client, identity, application, dan data. Klaim tenant dari identity boundary dipetakan ke policy aplikasi dan policy resource, bukan hanya ke UI.'
        }
      ],
      tables: [
        {
          headers: ['Lapis', 'Komponen', 'Fungsi', 'Sifat'],
          rows: [
            ['L1', 'Cloudflare Pro + Zero Trust', 'DDoS proxy, WAF, rate limit per tenant, header internal dibersihkan', 'Preventif'],
            ['L2', 'WAF Regional pada ALB', 'Rate-based rule dan custom rule; origin hanya menerima Cloudflare', 'Preventif'],
            ['L3', 'Security group, private subnet', 'App dan data tanpa IP publik; zona data tanpa rute internet', 'Preventif'],
            ['L4', 'Gateway dan konteks aplikasi', 'JWT divalidasi, klaim tenant dicocokkan dengan subdomain, konteks SET LOCAL', 'Preventif'],
            ['L5', 'Row-Level Security di RDS', 'Setiap baris disaring mesin database; tanpa konteks = nol baris', 'Penegakan akhir']
          ]
        },
        {
          headers: ['Key alias', 'Digunakan untuk', 'Rotasi'],
          rows: [
            ['kms-rds-clinical', 'RDS primary dan replica', 'Otomatis tahunan'],
            ['kms-s3-documents', 'S3 dokumen medis dan radiologi', 'Otomatis tahunan, S3 Bucket Key aktif'],
            ['kms-field-pii', 'Enkripsi kolom NIK dan nomor rekam medis', 'Manual dengan tumpang tindih dua kunci'],
            ['kms-secrets', 'Secrets Manager', 'Kunci tahunan, kredensial database 90 hari'],
            ['kms-ebs', 'Volume node EKS', 'Otomatis tahunan'],
            ['kms-backup-vault', 'AWS Backup Vault dengan Vault Lock', 'Otomatis tahunan, penghapusan kunci ditolak']
          ]
        }
      ],
      subheading: 'Encryption & key management',
      subheadingDescription: 'Enam customer managed key, dipisah berdasarkan sensitivitas data, bukan per service. kms-field-pii terpisah agar akses baca database saja tidak cukup untuk mendekripsi identitas pasien; pencarian NIK memakai kolom HMAC terpisah.',
      callouts: [
        {
          type: 'warning',
          content: 'Cakupan penulisan konteks adalah butir paling kritis dalam keseluruhan desain. PgBouncer mengembalikan koneksi ke pool setelah setiap transaksi, dan koneksi yang sama berikutnya bisa melayani fasilitas yang berbeda. Konteks bercakupan sesi terbawa ke fasilitas berikutnya; konteks bercakupan transaksi hilang dengan sendirinya. Kesalahan di titik ini menghasilkan kebocoran yang muncul acak, hanya di bawah beban, dan sangat sulit direproduksi.'
        }
      ]
    },
    {
      id: 's9',
      number: 10,
      title: 'Estimasi biaya & trade-off',
      content: 'On-demand ap-southeast-3 per 9 September 2026, tanpa Reserved Instance atau Savings Plan, untuk skenario 50 fasilitas. Kurs JISDOR Rp17.552 per USD. Belum termasuk pajak, AWS support plan, dan biaya tim.\n\nBiaya infrastruktur sekitar $101 per fasilitas per bulan (± Rp1,78 juta). Biaya ini turun seiring bertambahnya fasilitas karena sebagian besar komponen adalah biaya tetap bersama.',
      subheading: 'Yang bisa dipangkas, dan harganya',
      subheadingDescription: 'Setiap penghematan punya konsekuensi terhadap reliability atau beban operasional. Konsekuensinya ditulis eksplisit agar keputusannya diambil dengan sadar.',
      tables: [
        {
          headers: ['Layer', 'Komponen', 'USD / bulan'],
          rows: [
            ['Edge', 'Cloudflare Pro + Route 53 + WAF Regional + Shield Standard', '55'],
            ['Load balancing', 'ALB × 2 + NAT Gateway × 3 AZ', '194'],
            ['Compute', 'EKS control plane + 3 × m6i.xlarge + EBS gp3', '587'],
            ['Data', 'RDS db.r6g.xlarge Multi-AZ + read replica + 2 TB gp3', '1.705'],
            ['Cache', 'ElastiCache Redis, dua node Multi-AZ', '260'],
            ['Messaging', 'Amazon MQ RabbitMQ cluster tiga node', '690'],
            ['Storage', 'S3 5 TB + replikasi lintas region', '300'],
            ['Secrets & KMS', 'Secrets Manager + enam CMK', '17'],
            ['Observability', 'CloudWatch, CloudTrail, GuardDuty, X-Ray', '260'],
            ['Backup & DR', 'AWS Backup + DR pilot light', '900'],
            ['CI/CD', 'ECR, runner di luar VPC', '10'],
            ['Transfer', 'NAT data processing + egress', '80'],
            ['Total estimasi', '≈ Rp88,8 juta', '≈ 5.060']
          ]
        },
        {
          headers: ['Pemangkasan', 'Dampak', 'Hemat / bulan'],
          rows: [
            ['Amazon MQ → RabbitMQ di EKS', 'Beban operasional pindah ke tim; perlu keahlian tuning dan pemulihan sendiri', '~550'],
            ['DR region → salinan snapshot saja', 'RTO region naik dari 2 jam menjadi ± 8 jam', '~650'],
            ['Read replica dihapus', 'Reporting membebani primary; risiko kueri berat mengganggu SLO klinis', '~435'],
            ['NAT × 3 → × 1', 'Kehilangan satu AZ memutus egress ke SATUSEHAT dan BPJS', '~90'],
            ['EKS → ECS on EC2', 'Hemat control plane, tetapi kehilangan ekosistem Kubernetes (Argo, HPA, NetworkPolicy)', '~73'],
            ['Savings Plan satu tahun', 'Tidak ada dampak teknis; perlu komitmen anggaran', '~30%']
          ]
        }
      ],
      callouts: [
        {
          type: 'note',
          content: 'Angka di atas adalah estimasi, bukan penawaran, dan perlu divalidasi dengan AWS Pricing Calculator. Rekomendasi pertama setelah 3 bulan beban stabil: Savings Plan untuk compute dan Reserved Instance untuk RDS.'
        }
      ]
    },
    {
      id: 'decisions',
      number: 11,
      title: 'Keputusan kunci & risiko',
      content: 'Ringkasan keputusan arsitektur beserta alternatif yang ditolak, lalu risiko teknis terbesar beserta sinyal yang dipantau untuk mendeteksinya lebih awal.',
      tables: [
        {
          headers: ['ID', 'Keputusan', 'Alasan', 'Alternatif ditolak'],
          rows: [
            ['ADR-01', 'EKS sebagai compute', 'Ekosistem Kubernetes untuk GitOps, canary, NetworkPolicy, dan HPA', 'ECS: lebih murah, tetapi tooling rollout dan isolasi jaringan lebih terbatas'],
            ['ADR-02', 'Pooled PostgreSQL + partisi + RLS', 'Hemat biaya, migrasi satu kali, isolasi ditegakkan database', 'Database per tenant: 50+ instans, migrasi dan biaya berlipat'],
            ['ADR-03', 'SET LOCAL + PgBouncer transaction pooling', 'Konteks tidak bocor antar transaksi; koneksi RDS tetap efisien', 'Session pooling: koneksi RDS habis pada 800 sesi bersamaan'],
            ['ADR-04', 'Cloudflare edge + ALB terkunci', 'Zero Trust untuk staf tanpa VPN; permukaan publik minimal', 'CloudFront + VPN: dua sistem akses terpisah untuk dikelola'],
            ['ADR-05', 'Amazon MQ + transactional outbox', 'Broker managed; event tidak hilang ketika broker down', 'RabbitMQ di EKS: hemat, tetapi beban operasi ke tim'],
            ['ADR-06', 'SLO per kelas workflow + burn-rate alert', 'Prioritas berdasarkan dampak klinis, alert lebih sedikit dan lebih akurat', 'Satu target uptime global: menyamakan IGD dengan laporan bulanan'],
            ['ADR-07', 'DR pilot light Singapore, bersyarat Legal', 'RTO 2 jam dengan biaya moderat', 'Warm standby: biaya compute DR hampir dua kali lipat']
          ]
        },
        {
          headers: ['Risiko', 'Dampak', 'Mitigasi', 'Sinyal deteksi'],
          rows: [
            ['Kebocoran lintas tenant', 'Kritis', 'FORCE RLS, SET LOCAL, 10 negative test di CI, SEV1 runbook', 'Audit event 403 tenant mismatch, pesan DLQ header ≠ payload'],
            ['Noisy neighbor', 'Tinggi', 'Rate limit, bulkhead, statement_timeout, pindah ke silo', 'Latency dan waktu tunggu pool per tenant'],
            ['Salah konfigurasi PgBouncer', 'Kritis', 'Test kasus 6 lewat PgBouncer, konfigurasi di Git', 'Negative test gagal di pipeline'],
            ['Sizing meleset', 'Sedang', 'Load test 2× puncak sebelum go-live, autoscaling', 'Utilisasi dan burn rate saat onboarding tenant baru'],
            ['Migrasi skema mengunci tabel klinis', 'Tinggi', 'Expand/contract, lock_timeout, index concurrently', 'Lock wait dan p95 saat deploy']
          ]
        }
      ],
      subheading: 'Top risiko teknis',
      subheadingDescription: 'Risiko diurutkan berdasarkan dampak terhadap pasien dan kepercayaan fasilitas.',
      postContent: [
        'Pertanyaan terbuka yang perlu dijawab di luar tim teknis: (1) Legal: apakah replikasi lintas negara ke Singapore diizinkan untuk data rekam medis; (2) Clinical dan Product: konfirmasi target SLO dan RTO per kelas workflow; (3) Product: jumlah fasilitas dan proyeksi pertumbuhan untuk mengunci sizing dan biaya.'
      ]
    }
  ],
  footer: 'Arsitektur referensi untuk lingkungan produksi. Target SLO, RPO/RTO, dan biaya diturunkan dari asumsi di bagian 1 dan akan dikalibrasi setelah load test serta data beban nyata tersedia. Aspek regulasi perlindungan data dan retensi rekam medis memerlukan verifikasi penasihat hukum.'
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx ng test --watch=false`
Expected: `Test Files 3 passed (3)`, `Tests 10 passed (10)`.

If `not.toContain('TBD')` or `not.toContain('BLOCKED')` fails, search the data file (`grep -n "TBD\|BLOCKED" src/assets/data/architecture.data.ts`) and reword the offending text; do not weaken the test.

- [ ] **Step 5: Commit**

```bash
git add src/app/app.spec.ts src/assets/data/architecture.data.ts
git commit -m "feat(docs): restructure architecture page for SRE challenge

Replace governance/readiness sections with assumptions, tenant context
flow, and a reliability section (SLO, observability, failure modes).

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"
```

---

### Task 4: Build and verify in the browser

**Files:** none modified (fix-ups only if verification fails).

- [ ] **Step 1: Production build**

Run: `npm run build`
Expected: build completes with no errors. Warnings about bundle budgets are acceptable only if they already existed before (check with `git stash` is NOT needed — just report them).

- [ ] **Step 2: Confirm the new diagram is copied to the output**

Run: `find dist -name "tenant-context-flow.svg"`
Expected: one path printed (under `dist/.../browser/assets/diagrams/`).

- [ ] **Step 3: Run the dev server and check visually**

Run in background: `npx ng serve --port 4300`
Open `http://localhost:4300/` and check:
- Sidebar lists 11 sections, in the order from the File Structure section.
- Section 3 shows the tenant context diagram; text is readable, nothing overlaps.
- Section 2 master diagram: PgBouncer and Reporting inside the app subnet.
- Section 6 shows 2 tables (SLO, then "Failure mode analysis" subheading + failure mode table), 4 cards, 2 paragraphs, 1 warning callout.
- Search (header) for `burn rate` returns the Reliability section.

- [ ] **Step 4: Stop the dev server**

Stop the background `ng serve` process (Ctrl+C / kill the task).

- [ ] **Step 5: Report**

Report to the user: commits created, test result, build result, anything that looked off visually. Do NOT push and do NOT merge — the user will review first.
