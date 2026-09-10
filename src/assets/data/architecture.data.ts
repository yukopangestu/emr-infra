import { ArchitectureData } from '../../app/core/services/content.service';

export const architectureData: ArchitectureData = {
  title: 'Arsitektur produksi platform EMR multitenant',
  lede: 'Satu instalasi di AWS Jakarta melayani puluhan fasilitas kesehatan. Setiap keputusan di halaman ini berpangkal pada satu syarat yang tidak dinegosiasikan: data pasien satu fasilitas tidak boleh dapat diakses fasilitas lain.',
  metadata: {
    'Region': 'ap-southeast-3 (Jakarta) — proposed primary',
    'DR': 'ap-southeast-1 (Singapore) — blocked',
    'Isolasi': 'Partisi + Row-Level Security — proposed',
    'Estimasi': '± $5.060 / bulan — assumptions TBD'
  },
  sections: [
    {
      id: 'executive-summary',
      number: 1,
      title: 'Executive summary & readiness status',
      content: 'Dokumen ini mengusulkan platform EMR multitenant untuk melayani banyak fasilitas kesehatan dalam satu instalasi AWS. Tujuan utamanya adalah menyediakan workflow klinis yang aman, isolasi tenant yang dapat dibuktikan, dan operasi yang dapat dipulihkan. Ini adalah proposal teknis; belum menjadi komitmen SLA, anggaran, RPO/RTO, atau keputusan legal.',
      cards: [
        { title: 'Scope produk', description: 'Rekam medis elektronik, workflow klinis, administrasi fasilitas, billing, audit, dan integrasi eksternal.' },
        { title: 'Stack aplikasi', description: 'Flutter untuk mobile app pasien, Angular untuk admin dashboard, dan Java services pada EKS.' },
        { title: 'Tenant model', description: 'Pooled PostgreSQL dengan partisi untuk tabel volume tinggi dan RLS sebagai enforcement security.' },
        { title: 'Security posture', description: 'Cloudflare, protected ALB, private subnet, IdP/MFA, workload identity, dan audit immutable.' },
        { title: 'DR status', description: 'Singapore masih candidate dan blocked sampai legal/compliance, Product, serta CTO menyetujui data residency dan strategi failover.' },
        { title: 'Cost status', description: '± $5.060/bulan adalah reference estimate dengan workload dan target NFR yang masih TBD.' }
      ],
      tables: [
        {
          headers: ['Readiness gate', 'Status', 'Required owner / evidence'],
          rows: [
            ['Business requirements', 'Proposed — confirmation required', 'Product + Clinical + Operations'],
            ['Architecture', 'Proposed — review required', 'CTO + Engineering + Security'],
            ['Data residency / cross-border DR', 'BLOCKED', 'Legal/Compliance written decision'],
            ['SLA, RPO/RTO, capacity, cost', 'TBD', 'Product + SRE + Finance approval'],
            ['Go-live', 'BLOCKED', 'All critical gates and operational evidence']
          ]
        }
      ],
      postContent: [
        'Top decisions proposed: EKS sebagai compute, Java services dengan modular boundaries, pooled PostgreSQL dengan partition/RLS, Cloudflare sebagai external edge dengan protected ALB, dan Amazon MQ sebagai broker managed.',
        'Top unresolved decisions: Singapore atau recovery in-country, data residency/cross-border basis, service decomposition final, RPO/RTO per capability, dan budget/capacity envelope.',
        'Top risks dan mitigasi: cross-border compliance (written decision), tenant leak (end-to-end negative tests), noisy neighbor (quota/load test), inaccurate sizing (workload evidence), dan operational gap (restore/failover exercises).',
        'Approval yang diminta dari CTO: arah arsitektur, trade-off pooled versus bridge/silo, acceptance terhadap risk register, owner lintas fungsi, serta izin melanjutkan discovery dan validation gates.'
      ],
      callouts: [
        { type: 'warning', content: 'Tidak ada keputusan legal, business approval, SLA, RPO/RTO, atau workload number yang diasumsikan sudah disetujui. Semua status yang belum memiliki bukti ditandai Proposed, TBD, atau Blocked.' }
      ],
    },
    {
      id: 'intro',
      number: 2,
      title: 'Apa itu EMR dan business requirement',
      content: 'EMR (Electronic Medical Record) adalah sistem digital untuk mencatat, menyimpan, mengelola, dan menyajikan rekam medis pasien sepanjang proses pelayanan kesehatan. EMR bukan sekadar pengganti berkas kertas; ia menjadi sumber data bersama untuk tenaga kesehatan, pasien, operasional fasilitas, dan integrasi eksternal.',
      cards: [
        {
          title: 'Identitas & master data',
          description: 'Pasien, fasilitas, tenaga kesehatan, pengguna, tenant, unit, dan referensi klinis.'
        },
        {
          title: 'Workflow klinis',
          description: 'Registrasi, encounter, diagnosis, order, hasil pemeriksaan, resep, dan ringkasan medis.'
        },
        {
          title: 'Akses & privasi',
          description: 'Role-based access, isolasi antar fasilitas, consent, dan audit trail yang dapat ditelusuri.'
        },
        {
          title: 'Integrasi & interoperabilitas',
          description: 'API/FHIR, SATUSEHAT, BPJS, notifikasi, dan pertukaran data dengan sistem eksternal.'
        },
        {
          title: 'Operasional & billing',
          description: 'Penjadwalan, tarif, klaim, pembayaran, laporan, dan metrik operasional fasilitas.'
        },
        {
          title: 'Keandalan & kepatuhan',
          description: 'Availability, backup, disaster recovery, retensi, enkripsi, observability, dan SLA.'
        }
      ],
      tables: [
        {
          headers: ['ID', 'Domain / owner', 'Business requirement', 'Priority', 'Acceptance / status', 'Driver'],
          rows: [
            ['BR-01', 'Registration / Product', 'Registrasi pasien, identity matching, dan deduplikasi mencegah duplicate medical record.', 'Must', 'Match rules, duplicate workflow, and Clinical acceptance — TBD', 'Patient safety'],
            ['BR-02', 'Clinical / Product', 'Authorized health workers dapat menulis clinical documentation untuk encounter, diagnosis, procedure, order, result, prescription, dan medical summary.', 'Must', 'Role-based workflow scenarios lulus — TBD', 'Continuity of care'],
            ['BR-03', 'Patient / Clinical', 'Pasien dan tenaga berwenang dapat mengambil medical-record data sesuai purpose, consent, disclosure, dan confidentiality policy.', 'Must', 'Access/disclosure scenarios + audit evidence — TBD', 'Privacy & care'],
            ['BR-04', 'Records / Data', 'Record disimpan, quality-assured, memiliki amendment history, dan dapat ditransfer/export sesuai policy.', 'Must', 'Integrity, amendment, export, and retention tests — TBD', 'Record integrity'],
            ['BR-05', 'Claims / Finance', 'Claims dan billing mendukung rekonsiliasi BPJS serta koreksi yang dapat diaudit.', 'Must', 'Reconciliation and exception workflow — TBD', 'Revenue operations'],
            ['BR-06', 'Integration / Platform', 'SATUSEHAT onboarding, FHIR resources, terminology validation, retry, idempotency, reconciliation, dan partner API tersedia.', 'Must', 'Contract/conformance and replay tests — TBD', 'Interoperability'],
            ['BR-07', 'Tenant / Product', 'Tenant dapat di-onboard, disuspend, diexport, dimigrasikan, dan diterminasi dengan authorization serta evidence.', 'Must', 'Lifecycle runbook and tenant export audit — TBD', 'Platform operations'],
            ['BR-08', 'Continuity / Clinical', 'Downtime procedure menjaga continuity of clinical care dan reconciles data setelah layanan kembali.', 'Must', 'Downtime drill + reconciliation evidence — TBD', 'Clinical safety'],
            ['BR-09', 'Privacy / Legal', 'Consent, disclosure, patient access, confidentiality, retention, dan deletion/legal hold mengikuti keputusan resmi.', 'Must', 'Written policy and legal interpretation — TBD', 'Compliance'],
            ['BR-10', 'Reliability / Operations', 'Backup, restore, monitoring, incident response, security, dan DR dapat diuji serta memiliki owner.', 'Must', 'Runbook, exercise, and review evidence — TBD', 'Continuity & assurance']
          ]
        },
        {
          headers: ['ID', 'Non-functional requirement', 'Target / acceptance', 'Owner', 'Status'],
          rows: [
            ['NFR-01', 'Availability', 'TBD — Product + SRE menetapkan service tier dan target availability.', 'Product / SRE', 'TBD'],
            ['NFR-02', 'Performance', 'TBD — baseline p50/p95/p99 per critical workflow dan batas payload.', 'Product / SRE', 'TBD'],
            ['NFR-03', 'Capacity', 'TBD — fasilitas, active users, concurrent sessions, requests/sec, storage growth.', 'Product / SRE', 'TBD'],
            ['NFR-04', 'RPO / RTO', 'TBD — Clinical, Product, Operations, Legal/Compliance, dan CTO menyetujui.', 'Product / SRE', 'TBD'],
            ['NFR-05', 'Security', 'Zero critical findings; tenant-negative test suite lulus; evidence disimpan.', 'Security', 'Proposed'],
            ['NFR-06', 'Privacy / retention', 'TBD — Legal/Compliance menetapkan lokasi, retensi, deletion/legal hold, dan access procedure.', 'Legal / Compliance', 'BLOCKED'],
            ['NFR-07', 'Observability', 'TBD — logs, metrics, traces, alert thresholds, and audit retention disepakati.', 'SRE / Security', 'TBD'],
            ['NFR-08', 'Operability', 'Runbook, on-call, ownership, escalation, restore, failover, dan failback evidence — TBD.', 'Operations / SRE', 'TBD'],
            ['NFR-09', 'Interoperability', 'FHIR/API contract, idempotency, versioning, retry, and reconciliation tests — TBD.', 'Platform / Integration', 'Proposed'],
            ['NFR-10', 'Cost', 'TBD — workload model, region, retention, traffic, and AWS quote/Pricing Calculator validation.', 'Finance / SRE', 'TBD'],
            ['NFR-11', 'Accessibility / devices', 'TBD — accessibility standard, supported Flutter device/OS matrix, browser matrix for Angular, and offline constraints.', 'Product / Clinical', 'TBD'],
            ['NFR-12', 'Support model', 'TBD — support hours, incident severity definitions, response/restore targets, escalation, and notification policy.', 'Operations / Product', 'TBD'],
            ['NFR-13', 'Auditability', 'TBD — audit events, review cadence, evidence retention, and breach/notification ownership.', 'Security / Legal', 'TBD']
          ]
        }
      ]
    },
    {
      id: 'governance',
      number: 3,
      title: 'Decision register & approval checklist',
      content: 'Register ini memisahkan keputusan desain yang diusulkan dari keputusan yang memerlukan persetujuan. Status Proposed bukan berarti sudah disetujui; Blocked berarti ada dependency yang harus ditutup sebelum implementasi atau go-live.',
      tables: [
        {
          headers: ['ID', 'Decision', 'Rationale', 'Alternative', 'Status', 'Owner', 'Due'],
          rows: [
            ['DEC-01', 'EKS sebagai compute platform', 'Reuse Kubernetes ecosystem dan operating model yang konsisten.', 'ECS perlu evaluasi capability dan team fit.', 'Proposed', 'CTO / SRE', 'TBD'],
            ['DEC-02', 'Java services; modular boundaries', 'Service boundaries jelas untuk ownership dan deployment.', 'Modular monolith bila team/operasi belum siap.', 'Proposed', 'CTO / Product', 'TBD'],
            ['DEC-03', 'Pooled database + partition/RLS', 'Cost-efficient dan shared platform.', 'Bridge/silo untuk tenant khusus atau requirement terisolasi.', 'Proposed', 'CTO / Security / Data', 'TBD'],
            ['DEC-04', 'Cloudflare edge + protected ALB', 'Reduce public surface dan enforce origin lockdown.', 'CloudFront/WAF AWS bila responsibility berbeda disetujui.', 'Proposed', 'Platform / Security', 'TBD'],
            ['DEC-05', 'PostgreSQL RLS enforcement', 'FORCE RLS, dedicated migration role, transaction-scoped tenant context.', 'Bridge/silo atau database terpisah bila risk appetite berubah.', 'Proposed', 'Data / Security', 'TBD'],
            ['DEC-06', 'Singapore sebagai DR candidate', 'Cross-region resilience benefit.', 'In-country Multi-AZ + immutable backup + tested restore.', 'BLOCKED', 'Legal / Compliance / CTO', 'TBD'],
            ['DEC-07', 'Amazon MQ untuk messaging', 'Managed RabbitMQ mengurangi operasi cluster.', 'RabbitMQ on EKS atau broker lain setelah trade-off.', 'Proposed', 'CTO / SRE', 'TBD'],
            ['DEC-08', 'RPO/RTO targets', 'Mengikuti criticality klinis dan operasional.', 'Tiered recovery atau target berbeda per capability.', 'TBD', 'Product / Clinical / SRE', 'TBD']
          ]
        },
        {
          headers: ['Approval domain', 'Approval needed', 'Status', 'Owner / evidence'],
          rows: [
            ['Product', 'Scope, tenant model, service tiers, business priority', 'TBD', 'Product decision record'],
            ['Clinical / Medical Records', 'Workflow correctness, safety, downtime procedure', 'TBD', 'Clinical sign-off + scenarios'],
            ['Security', 'Threat model, controls, access matrix, test evidence', 'TBD', 'Security review'],
            ['Legal / Compliance', 'Residency, cross-border DR, retention, consent, contracts', 'BLOCKED', 'Written legal/compliance decision'],
            ['Finance', 'Budget envelope, cost model, commitment strategy', 'TBD', 'Approved budget / calculator export'],
            ['Operations / SRE', 'On-call, runbook, monitoring, restore/failover exercise', 'TBD', 'Operational readiness evidence'],
            ['CTO', 'Architecture trade-offs and go-live risk acceptance', 'TBD', 'Architecture decision record']
          ]
        }
      ],
      callouts: [
        { type: 'warning', content: 'Dokumen ini tidak membuat keputusan legal atau business approval. Singapore DR tetap BLOCKED sampai Legal/Compliance dan CTO menilai data residency, transfer, retention, failover, dan failback secara tertulis.' }
      ]
    },
    {
      id: 's1',
      number: 4,
      title: 'Master architecture diagram',
      content: 'Trafik pasien masuk lewat Cloudflare external edge menuju ALB Public dan Gateway Public, lalu hanya boleh mencapai layanan klinis dan transaksi. Trafik staf fasilitas masuk lewat Cloudflare Zero Trust dengan IdP, MFA, Access-token validation, dan break-glass teraudit menuju ALB Admin, lalu ke layanan administratif yang diizinkan. Route 53 berfungsi sebagai DNS dan health-check/origin control; CloudFront bukan runtime hop kecuali diputuskan terpisah. ALB origin dikunci agar direct access di luar Cloudflare ditolak. Zona data tidak memiliki rute keluar ke internet.',
      diagram: {
        file: 'master-diagram.svg',
        caption: 'Cloudflare menjadi external edge, sedangkan Route 53 adalah DNS/health-check dan ALB tetap menjadi origin yang dilindungi. Gateway Public dan Gateway Admin dipisahkan agar permukaan serang yang terpapar internet hanya mencakup dua layanan. Audit Service ditandai berbeda karena tabelnya tidak dapat diubah maupun dihapus oleh role aplikasi.'
      }
    },
    {
      id: 's2',
      number: 5,
      title: 'Model isolasi tenant',
      content: 'Bagian ini yang membedakan platform multitenant dari platform biasa, dan merupakan keputusan arsitektur paling penting di seluruh dokumen. Satu basis data melayani seluruh fasilitas; pemisahannya ditegakkan mesin basis data, bukan kode aplikasi. Semua tabel tenant-aware wajib memakai ENABLE ROW LEVEL SECURITY dan FORCE ROW LEVEL SECURITY. Migration/owner role dipisahkan dari runtime role; runtime role bukan owner, superuser, atau BYPASSRLS.',
      diagram: {
        file: 'isolation-model.svg',
        caption: 'Partisi memberi manfaat performa dan kemudahan memindahkan satu fasilitas keluar. Penyaringan baris yang memberi jaminan keamanannya. Keduanya menjawab persoalan berbeda dan tidak saling menggantikan.'
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
          headers: ['Resource', 'Tenant boundary', 'Required control', 'Negative test / evidence'],
          rows: [
            ['RDS PostgreSQL', 'tenant_id pada row + partition key', 'FORCE RLS; USING/WITH CHECK; transaction-scoped context', 'A tidak dapat read/write B; no-context = zero rows — TBD'],
            ['S3 documents', 'tenant prefix + object metadata', 'IAM condition/policy, KMS, presigned URL scoped to object/tenant', 'A URL tidak dapat membaca B — TBD'],
            ['Redis cache', 'tenant-prefixed key', 'Key builder terpusat; no raw user-controlled key', 'A tidak hit cache B — TBD'],
            ['Amazon MQ', 'tenant_id pada message envelope', 'Producer/consumer validation, DLQ, idempotency, ACL', 'Consumer tidak memproses tenant lain — TBD'],
            ['Logs/traces/metrics', 'tenant context tanpa secret/PHI berlebih', 'Redaction, access boundary, immutable audit sink', 'Tenant dashboard/search tidak melihat data yang tidak berwenang — TBD'],
            ['Backup/restore', 'tenant mapping + legal hold', 'Encryption, access control, restore validation, omission check', 'Restore tidak silently omit tenant data — TBD']
          ]
        }
      ],
      callouts: [
        {
          type: 'warning',
          content: 'Konsekuensi yang tidak dapat dibalik dengan murah: kunci partisi wajib menjadi bagian dari setiap primary key dan unique constraint. Primary key berbentuk (tenant_id, id), bukan id tunggal. Seluruh foreign key ikut menjadi komposit. Policy RLS harus memakai USING dan WITH CHECK, konteks tenant ditulis pada awal transaksi dan dibersihkan otomatis setelah transaksi selesai. Referensi/constraint antar-tenant dan akses owner/superuser harus diuji karena dapat menjadi bypass atau side-channel.\n\nStruktur ini harus final sebelum implementasi modul klinis pertama dimulai. Mengubahnya setelah ada data produksi berarti merefaktor setiap entity dan setiap kueri.'
        }
      ],
      postContent: ['Membatasi partisi pada kelas pertama menjaga jumlahnya terkendali. Pada 50 fasilitas dengan lima tabel bervolume tinggi, jumlah partisi berada di kisaran 250 — jauh di bawah titik di mana perencanaan kueri mulai terdegradasi.']
    },
    {
      id: 's3',
      number: 6,
      title: 'Routing & connectivity matrix',
      content: 'Pelengkap master diagram. Gateway Public sengaja dibatasi pada dua layanan agar permukaan yang terpapar internet sekecil mungkin.',
      tables: [
        {
          headers: ['Service', 'Gateway Public', 'Gateway Admin', 'Alasan'],
          rows: [
            ['Patient', '✓', '✓', 'Pasien melihat data dirinya sendiri'],
            ['Encounter', '✓', '✓', 'Riwayat kunjungan pasien'],
            ['Order', '—', '✓', 'Hanya tenaga medis'],
            ['Result', '✓', '✓', 'Hasil dirilis ke pasien setelah verifikasi'],
            ['Identity', '—', '✓', 'Manajemen pengguna internal'],
            ['Tenant', '—', '✓', 'Provisioning, operasional platform'],
            ['Billing', '—', '✓', 'Klaim dan penagihan'],
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
      ],
      callouts: [
        {
          type: 'note',
          content: 'Setiap consumer antrean wajib menetapkan konteks tenant dari header pesan. Pekerjaan latar belakang tidak melewati API Gateway — bila langkah ini terlewat, consumer menjadi celah isolasi terbesar dalam sistem.'
        }
      ]
    },
    {
      id: 's4',
      number: 7,
      title: 'Compute placement',
      content: 'Tanpa bastion terpisah, tanpa VM runner, tanpa VM batch. Ketiganya digantikan layanan terkelola yang tidak menambah host untuk dijaga.\n\nSetiap workload di cluster wajib memiliki resource request dan limit, Pod Disruption Budget, serta NetworkPolicy yang bersifat tolak-secara-default. Startup probe memeriksa inisialisasi Java service. Liveness hanya memeriksa kesehatan proses dan deadlock lokal. Readiness menilai kemampuan menerima traffic tanpa bergantung sinkron pada database bersama; kesehatan database dipantau lewat metrics, synthetic check, alert, circuit breaker, dan degraded mode.',
      cards: [
        {
          title: 'EKS — proposed baseline sizing',
          description: 'Model awal: 3 × m6i.xlarge, satu node per AZ, autoscaling sampai 5 node. Harus divalidasi dengan workload/load test; bukan capacity commitment.'
        },
        {
          title: 'SSM Session Manager',
          description: 'Pengganti bastion. Shell ke node tanpa SSH publik dan tanpa host tambahan.'
        },
        {
          title: 'Cloudflare Zero Trust',
          description: 'Pengganti VM tunnel. Akses staf ke ALB Admin tanpa VPN yang dikelola sendiri.'
        },
        {
          title: 'EventBridge + Job terjadwal',
          description: 'Pengganti VM batch. Cron dijalankan sebagai job di dalam cluster.'
        },
        {
          title: 'Runner CI SaaS',
          description: 'Build di luar VPC, image didorong ke ECR. Tidak ada runner EC2 yang perlu ditambal.'
        },
        {
          title: 'PgBouncer',
          description: 'Dua replika sebagai workload EKS di private app subnet, dikelola Platform/SRE. DB security group hanya mengizinkan akses dari PgBouncer; tidak ada PgBouncer di data subnet. Replica di-reschedule oleh EKS; bila pool unavailable, request gagal closed dan alert aktif tanpa direct-DB fallback.'
        }
      ]
    },
    {
      id: 's5',
      number: 8,
      title: 'Security: defense in depth',
      content: 'Empat lapis pertama bersifat preventif dan semuanya dapat gagal karena kesalahan implementasi. Lapis kelima yang menentukan apakah kegagalan itu berubah menjadi insiden kebocoran data.\n\nIdentity Provider dan MFA wajib untuk admin/staf; pasien memiliki authentication dan account-recovery flow yang harus disetujui Product/Security. Break-glass dibatasi, time-bound, dan diaudit. EKS access entries/RBAC mengatur operator cluster. Workload memakai EKS Pod Identity/IRSA dengan satu role per aplikasi, bukan node role bersama. Image admission, Pod Security Standards, dependency/image scanning, egress policy, dan immutable audit log menjadi kontrol wajib. Secret rotation dan compromise response mengikuti runbook. Role aplikasi bukan superuser, bukan pemilik tabel, dan tidak memiliki hak melewati penyaringan baris.',
      diagrams: [
        {
          file: 'identity-trust-boundary.svg',
          caption: 'Trust boundary dipisahkan antara client, identity, application, dan data/resource. Tenant claim dari identity boundary harus dipetakan ke policy aplikasi serta policy resource; tidak cukup hanya mengandalkan UI.'
        }
      ],
      tables: [
        {
          headers: ['Lapis', 'Komponen', 'Fungsi', 'Sifat'],
          rows: [
            ['L1', 'Cloudflare Pro + Shield Standard', 'DDoS proxy, WAF managed rules, Zero Trust Access. Header internal dibersihkan dari permintaan masuk. Rate limit diterapkan per tenant', 'Preventif'],
            ['L2', 'WAF Regional pada ALB', 'Rate-based rule dan custom rule di depan gateway', 'Preventif'],
            ['L3', 'Security Group, private subnet', 'App dan data tanpa IP publik. Zona data tanpa rute keluar ke internet', 'Preventif'],
            ['L4', 'Gateway dan konteks aplikasi', 'Tanda tangan JWT divalidasi, klaim tenant dicocokkan dengan subdomain, konteks ditulis dengan cakupan transaksi', 'Preventif'],
            ['L5', 'Row-Level Security di RDS', 'Setiap baris disaring di dalam mesin basis data. Kueri tanpa konteks mengembalikan nol baris, bukan seluruh baris', 'Penegakan akhir']
          ]
        },
        {
          headers: ['Control', 'Implementation expectation', 'Evidence / owner'],
          rows: [
            ['Identity & MFA', 'IdP, MFA, short-lived token, role/tenant claims, session revocation', 'Access matrix + review — Security'],
            ['Patient authentication', 'Account recovery, session revocation, device/risk controls, patient support path', 'Product/Security decision — TBD'],
            ['EKS access', 'Access entries, RBAC, least privilege, break-glass operator path', 'Cluster access review — Platform'],
            ['Workload identity', 'EKS Pod Identity/IRSA; separate role per service; block node IMDS access', 'IAM review + policy test — Platform'],
            ['Container & cluster', 'Signed images, vulnerability gate, admission policy, PSS, NetworkPolicy default deny', 'CI/CD and cluster evidence — Platform'],
            ['Break-glass', 'Separate approval, time-bound elevation, reason code, alert, immutable audit', 'Exercise record — Security / Operations'],
            ['Audit', 'Append-only event model, redaction, retention/legal hold per approved policy', 'Query/access test — Security / Legal'],
            ['Secrets', 'Rotation, revocation, compromise response, and dependency restart procedure', 'Secret drill — Platform / Security'],
            ['Incident response', 'Runbook for suspected cross-tenant access, containment, notification, recovery', 'Tabletop exercise — Operations']
          ]
        }
      ],
      callouts: [
        {
          type: 'warning',
          content: 'Cakupan penulisan konteks adalah butir paling kritis dalam keseluruhan desain. PgBouncer mengembalikan koneksi ke pool setelah setiap transaksi, dan koneksi yang sama berikutnya bisa melayani fasilitas yang berbeda.\n\nKonteks bercakupan sesi menempel pada koneksi dan terbawa ke fasilitas berikutnya. Konteks bercakupan transaksi hilang dengan sendirinya. Kesalahan memilih di titik ini menghasilkan kebocoran yang muncul acak, hanya di bawah beban, dan sangat sulit direproduksi.'
        }
      ]
    },
    {
      id: 's6',
      number: 9,
      title: 'Encryption & key management',
      content: 'Enam customer managed key, bukan satu per service. Pemisahan mengikuti tingkat sensitivitas data, bukan batas layanan.',
      tables: [
        {
          headers: ['Key alias', 'Digunakan untuk', 'Rotasi'],
          rows: [
            ['kms-rds-clinical', 'RDS primary dan replica — seluruh data klinis', 'Otomatis tahunan, CloudTrail data event aktif'],
            ['kms-s3-documents', 'S3 dokumen medis dan hasil radiologi', 'Otomatis tahunan, S3 Bucket Key aktif'],
            ['kms-field-pii', 'Enkripsi kolom untuk NIK dan nomor rekam medis', 'Manual dengan tumpang tindih dua kunci'],
            ['kms-secrets', 'Secrets Manager — kredensial basis data dan JWT', 'Kunci tahunan, kredensial 90 hari'],
            ['kms-ebs', 'Volume node EKS', 'Otomatis tahunan'],
            ['kms-backup-vault', 'AWS Backup Vault dengan Vault Lock', 'Otomatis tahunan, penghapusan kunci ditolak']
          ]
        }
      ],
      callouts: [
        {
          type: 'note',
          content: 'Enkripsi volume melindungi terhadap pencurian snapshot, tetapi tidak melindungi terhadap akses baca yang tidak sah pada basis data yang sedang berjalan. Kunci kms-field-pii dikelola terpisah agar akses baca basis data saja tidak memadai untuk mendekripsi pengenal pasien.\n\nKonsekuensinya: kolom terenkripsi tidak dapat diindeks untuk pencarian rentang. Pencarian berdasarkan NIK memerlukan kolom HMAC terpisah sebagai indeks.'
        }
      ]
    },
    {
      id: 's7',
      number: 10,
      title: 'Backup & disaster recovery',
      content: 'Jakarta adalah proposed primary. Singapore adalah candidate DR dengan model pilot light: komponen minimum dan prosedur deployment disiapkan, tetapi kapasitas penuh belum dianggap tersedia. Jika Singapore ditolak, opsi in-country yang lebih rendah resiliennya adalah Multi-AZ Jakarta, immutable backups, tested restore, dan domestic recovery mechanism yang harus disetujui terpisah. Istilah warm standby hanya boleh dipakai setelah stack yang fully functional dan evidence capacity diuji. Route 53 health check/failover routing hanya bagian dari orkestrasi; promosi database, deployment/scale EKS, secret/key access, integrasi, dan failback tetap memerlukan runbook.\n\nBackup yang belum pernah diuji pemulihannya tidak dapat dianggap sebagai backup. Uji restore dijadwalkan sebagai aktivitas rutin, bukan sebagai respons terhadap insiden.',
      tables: [
        {
          headers: ['Komponen', 'Metode', 'Lintas region', 'RPO', 'RTO'],
          rows: [
            ['RDS PostgreSQL', 'Multi-AZ + PITR + cross-region replica', 'Candidate ap-southeast-1', '≤ 5 menit (proposed)', '≤ 1 jam (proposed)'],
            ['S3 dokumen medis', 'Versioning + replikasi lintas region', 'Candidate ap-southeast-1', '≤ 15 menit (proposed)', '≤ 1 jam (proposed)'],
            ['ElastiCache Redis', 'Tidak di-backup, dibangun ulang', '—', 'Sesi hilang (proposed)', '≤ 15 menit (proposed)'],
            ['Amazon MQ', 'Cluster + infrastructure as code', 'Re-apply candidate region', 'Pesan in-flight hilang (proposed)', '≤ 2 jam (proposed)'],
            ['Kegagalan satu AZ', 'Failover otomatis RDS, rescheduling pod', '—', '≈ 0 (proposed)', '≤ 5 menit (proposed)'],
            ['Kegagalan region', 'Promosi replica + deploy/scale EKS candidate', 'ap-southeast-1 candidate', '≤ 5 menit (proposed)', '≤ 2 jam (proposed)']
          ]
        },
        {
          headers: ['DR evidence', 'Acceptance', 'Status / owner'],
          rows: [
            ['Restore RDS/S3 dan validasi tenant completeness', 'Runbook repeatable; checksum/reconciliation; no silent omission', 'TBD — SRE / Data'],
            ['Failover application dan dependency', 'Synthetic clinical workflow lulus di candidate region', 'TBD — SRE / Clinical'],
            ['Failback dan data reconciliation', 'No loss/duplication outside approved tolerance', 'TBD — SRE / Data'],
            ['Cross-border legal basis and data residency', 'Written decision and contract/control evidence', 'BLOCKED — Legal / Compliance'],
            ['Target RPO/RTO', 'Approved by Product, Clinical, Operations, CTO', 'TBD']
          ]
        }
      ],
      diagram: {
        file: 'dr-failover.svg',
        caption: 'Diagram ini menunjukkan candidate DR dan pilot light secara eksplisit. Perpindahan region bukan otomatis hanya karena health check; legal approval, runbook, capacity evidence, dan failback test tetap menjadi gate.'
      },
      postContent: ['Urutan recovery yang harus diuji: deteksi dan deklarasi insiden; lindungi serta evaluasi data; promosi RDS/restore sesuai prosedur; deploy/scale EKS dan aktifkan secret/KMS; siapkan MQ dan replay dengan idempotency; ubah DNS/origin; jalankan synthetic clinical workflow; rekonsiliasi tenant/data; lalu failback. Target waktu tetap proposed sampai owner menyetujuinya.'],
      callouts: [
        {
          type: 'warning',
          content: 'Pemulihan satu fasilitas secara terpisah adalah kelemahan yang diakui dari model basis data bersama. Prosedurnya: restore ke instans sementara, point-in-time recovery, ekspor partisi fasilitas terkait, validasi, lalu impor kembali dengan penanganan konflik yang terdefinisi.\n\nSingapore DR tetap BLOCKED sampai keputusan data residency/cross-border, retention, dan legal basis tersedia. Angka RPO/RTO di atas hanyalah proposed acceptance criteria, bukan komitmen.'
        }
      ]
    },
    {
      id: 's8',
      number: 11,
      title: 'CI/CD strategy',
      content: 'Migrasi dijalankan satu kali karena seluruh fasilitas berbagi satu basis data — keunggulan operasional terbesar dari model yang dipilih. Gerbang isolasi memblokir pipeline, bukan sekadar memberi peringatan.\n\nRangkaian pengujian isolasi menangkap regresi sebelum mencapai produksi. Sepuluh kasus berikut menjadi isi gerbangnya.\n\nStaging memakai data teranonimisasi. Data pasien asli tidak pernah keluar dari lingkungan produksi.',
      steps: [
        { title: 'Commit', description: 'Merge request' },
        { title: 'Build', description: 'Unit test' },
        { title: 'Scan', description: 'SAST, dependency, image' },
        { title: 'Uji isolasi', description: 'Gerbang pemblokir', isGate: true },
        { title: 'Push ECR', description: 'Image bertanda versi' },
        { title: 'Migrasi', description: 'Role terpisah' },
        { title: 'Rolling update', description: 'Canary di gateway' }
      ],
      numberedList: [
        'Kueri fasilitas A tidak mengembalikan baris fasilitas B',
        'Kueri tanpa konteks mengembalikan nol baris, bukan seluruh baris',
        'Penulisan dengan penanda fasilitas lain ditolak pemeriksaan tulis',
        'Permintaan paralel dari beberapa fasilitas tidak saling mencemari konteks',
        'Konteks bersih setelah permintaan selesai, termasuk ketika terjadi eksepsi',
        'Konteks tidak bertahan pada koneksi setelah transaksi berakhir',
        'Role aplikasi terverifikasi tidak dapat melewati penyaringan baris',
        'Consumer antrean menerapkan konteks dari header pesan',
        'Seluruh kunci cache berprefiks fasilitas',
        'Presigned URL satu fasilitas tidak dapat mengakses objek fasilitas lain'
      ],
      callouts: [
        {
          type: 'note',
          content: 'Kasus 6 wajib dijalankan terhadap PgBouncer dalam mode transaction pooling, bukan koneksi langsung ke RDS. Terhadap koneksi langsung, kesalahan cakupan konteks tidak akan terdeteksi sama sekali.'
        }
      ]
    },
    {
      id: 'capacity',
      number: 12,
      title: 'Asumsi kapasitas, resilience & cost model',
      content: 'Sizing dan estimasi biaya di halaman ini adalah model awal untuk diskusi, bukan forecast atau approval anggaran. Nilai yang belum memiliki sumber data diberi label TBD dan harus diisi setelah Product, Clinical, Finance, dan SRE menyepakati workload model.',
      tables: [
        {
          headers: ['Parameter', 'Current assumption / target', 'Owner', 'Status / next action'],
          rows: [
            ['Facility count', '50 fasilitas — proposed base scenario dari dokumen ini', 'Product', 'TBD — konfirmasi jumlah dan growth'],
            ['Active users / concurrency', 'TBD', 'Product / SRE', 'Buat workload model per workflow'],
            ['Requests per second / peak', 'TBD', 'SRE', 'Instrument production-like test'],
            ['Encounters per day', 'TBD', 'Clinical / Product', 'Baseline per facility and peak day'],
            ['Clinical data growth', 'TBD', 'Data / Product', 'Ukur storage growth dan retention'],
            ['Average document size and monthly growth', 'TBD', 'Product / SRE', 'Ukur size, access, lifecycle'],
            ['Retention period', 'TBD', 'Legal / Compliance', 'Written retention and legal-hold policy'],
            ['Log ingestion and retention', 'TBD', 'SRE / Security', 'Measure volume and approved retention'],
            ['SATUSEHAT / BPJS request volume', 'TBD', 'Integration / Product', 'Baseline calls, retries, and reconciliation'],
            ['Expected tenant growth', 'TBD', 'Product / Finance', 'Confirm pipeline and horizon'],
            ['Load-test scenario and date', 'TBD', 'SRE / Clinical', 'Jadwalkan test dan simpan evidence'],
            ['DR exercise cadence', 'TBD', 'Operations / SRE', 'Setujui cadence dan success criteria'],
            ['Cost allocation', 'TBD', 'Finance / Platform', 'Tagging, shared-cost allocation, per-tenant view']
          ]
        },
        {
          headers: ['Decision input', 'Why it matters', 'Status'],
          rows: [
            ['RPO/RTO by service tier', 'Menentukan replica, standby capacity, backup, dan failover runbook.', 'TBD — Product / Clinical / SRE'],
            ['Data residency and DR location', 'Menentukan apakah cross-border replication/storage boleh dilakukan.', 'BLOCKED — Legal / Compliance'],
            ['Workload and growth evidence', 'Menentukan node/database/cache/broker sizing serta biaya aktual.', 'TBD — Product / SRE'],
            ['AWS commercial validation', 'Memvalidasi harga region, transfer, support, commitment, dan tax.', 'TBD — Finance / AWS account team']
          ]
        }
      ],
      callouts: [
        { type: 'warning', content: 'Jangan mengubah angka estimasi menjadi SLA, budget, RPO/RTO, atau capacity commitment sebelum owner terkait memberikan evidence dan approval tertulis.' }
      ]
    },
    {
      id: 's9',
      number: 13,
      title: 'Estimasi biaya bulanan',
      content: 'On-demand ap-southeast-3, tanpa Reserved Instance maupun Savings Plan. Angka USD adalah reference estimate per 9 September 2026; nilai rupiah dihitung pada kurs JISDOR Bank Indonesia sebesar Rp17.552 per USD dan perlu dihitung ulang seiring pergerakan nilai tukar. Asumsi kapasitas dan angka 50 fasilitas dirujuk pada bagian Asumsi kapasitas dan belum disetujui. Estimasi mengecualikan atau belum memvalidasi pajak, support plan, license aplikasi, biaya tim operasional, serta commitment discount.\n\nPada base scenario 50 fasilitas, biaya infrastruktur berada di kisaran $101 per fasilitas per bulan, setara sekitar Rp1,78 juta. Biaya marjinal menambah satu fasilitas belum dapat dipastikan tanpa workload dan allocation model. Baris biaya berjumlah $5.058 dan total ditampilkan sebagai ≈ $5.060 karena pembulatan.',
      subheading: 'Yang bisa dipangkas, dan apa harganya',
      subheadingDescription: 'Setiap penghematan punya konsekuensi. Tabel ini menyatakan konsekuensinya secara eksplisit agar keputusan diambil sadar, bukan karena angka terlihat besar.',
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
            ['Backup & DR', 'AWS Backup + candidate cross-region DR — blocked', '900'],
            ['CI/CD', 'ECR, runner di luar VPC', '10'],
            ['Transfer', 'NAT data processing + egress', '80'],
            ['Total estimasi', '≈ Rp88,8 juta pada kurs di atas', '≈ 5.060']
          ]
        },
        {
          headers: ['Pemangkasan', 'Dampak', 'Hemat / bulan'],
          rows: [
            ['Amazon MQ → RabbitMQ di EKS', 'Beban operasional pindah ke tim; perlu keahlian tuning dan pemulihan sendiri', '~550'],
            ['DR region → salinan snapshot saja', 'Recovery menjadi lebih lambat dan target RTO harus ditetapkan ulang; dampaknya perlu dinilai Clinical/Operations', '~650 reference estimate'],
            ['Read replica dihapus', 'Pelaporan membebani primary; risiko kueri berat mengganggu pelayanan', '~435'],
            ['NAT × 3 → × 1', 'Kehilangan satu AZ mengganggu egress ke SATUSEHAT dan BPJS', '~90'],
            ['EKS → ECS on EC2', 'Hemat control plane, tetapi kehilangan ekosistem Kubernetes dan portabilitas', '~73'],
            ['Reserved Instance satu tahun', 'Tidak ada dampak teknis; memerlukan komitmen anggaran di muka', '~30%']
          ]
        }
      ],
      callouts: [
        {
          type: 'note',
          content: 'Shield Advanced tidak dimasukkan. Harga dan manfaatnya perlu divalidasi ulang bila diwajibkan oleh threat model, kontrak, atau business approval. Jangan menyimpulkan SLA DDoS atau kebutuhan layanan dari angka estimasi ini.'
        },
        {
          type: 'warning',
          content: 'Angka di atas adalah estimasi, bukan penawaran. Harga on-demand, transfer, support, tax, dan konsumsi nyata perlu diverifikasi dengan AWS Pricing Calculator atau account team.\n\nTarget RPO/RTO masih usulan dan belum disepakati bisnis. Kapabilitas pilot light, warm standby, dan active/active memiliki biaya serta evidence berbeda; pilih setelah criticality dan legal/compliance decision tersedia.'
        }
      ]
    },
    {
      id: 'risks',
      number: 14,
      title: 'Risk register & top blockers',
      content: 'Risk register ini membantu CTO melihat apa yang sudah dikendalikan oleh desain, apa yang masih berupa asumsi, dan siapa yang harus menutup gap. Residual risk bukan berarti risiko hilang; ia adalah risiko yang tersisa setelah mitigation yang diusulkan.',
      tables: [
        {
          headers: ['Risk', 'Likelihood', 'Impact', 'Mitigation', 'Residual', 'Owner'],
          rows: [
            ['Cross-border DR melanggar residency/contract requirement', 'High', 'High', 'Legal decision, data classification, approved transfer/control, or local DR alternative', 'BLOCKED', 'Legal / Compliance'],
            ['Cross-tenant leak melalui RLS, async, cache, object, log, atau backup', 'Medium', 'Critical', 'FORCE RLS, transaction context, tenant-aware policies, negative tests, incident runbook', 'Medium until evidence', 'Security / Data'],
            ['Noisy neighbor menurunkan workflow klinis', 'Medium', 'High', 'Resource quotas, workload isolation, service tiers, load test, tenant-aware metrics', 'TBD', 'SRE / Product'],
            ['Sizing dan cost estimate tidak merepresentasikan beban nyata', 'High', 'Medium', 'Workload model, production-like load test, tagging, pricing validation', 'TBD', 'SRE / Finance'],
            ['PgBouncer context salah scope atau pool misconfigured', 'Medium', 'Critical', 'Transaction pooling test, dedicated config, context cleanup, direct-RDS comparison', 'TBD', 'Data / Platform'],
            ['Workflow klinis tidak sesuai praktik lapangan', 'Medium', 'High', 'Clinical discovery, acceptance scenarios, downtime drill, safety review', 'TBD', 'Clinical / Product'],
            ['On-call dan incident capability belum siap', 'Medium', 'High', 'Named owners, runbook, alert test, tabletop, restore/failover exercise', 'TBD', 'Operations / SRE']
          ]
        },
        {
          headers: ['Top blocker before go-live', 'Exit criterion', 'Status'],
          rows: [
            ['Legal/compliance data residency and DR decision', 'Written decision covering storage, replication, retention, transfer, and failback', 'BLOCKED'],
            ['Clinical/Product NFR approval', 'Approved service tiers, availability, performance, RPO/RTO, and workflow acceptance', 'TBD'],
            ['Tenant isolation evidence', 'Automated negative tests across RDS, S3, Redis, MQ, logs, and backups', 'TBD'],
            ['Operational readiness', 'Restore, failover, failback, break-glass, and incident exercises with evidence', 'TBD'],
            ['Capacity/cost validation', 'Workload model, load test, cost allocation, and Finance approval', 'TBD']
          ]
        }
      ],
      callouts: [
        { type: 'warning', content: 'Go-live harus tetap BLOCKED bila legal/compliance decision, clinical acceptance, tenant isolation evidence, atau operational evidence belum tersedia. Risiko tidak boleh ditutup hanya dengan narasi arsitektur.' }
      ]
    }
  ],
  footer: 'Halaman ini merupakan arsitektur referensi untuk lingkungan produksi dan mendampingi Software Architecture Document, yang memuat evaluasi model multitenancy secara lengkap, registrasi risiko, siklus hidup tenant, serta daftar keputusan yang masih menunggu konfirmasi. Seluruh target performa, ketersediaan, dan biaya bersifat usulan dan memerlukan persetujuan pemangku kepentingan sebelum menjadi komitmen. Bagian yang menyangkut kewajiban regulasi perlindungan data dan retensi rekam medis memerlukan verifikasi penasihat hukum.'
};
