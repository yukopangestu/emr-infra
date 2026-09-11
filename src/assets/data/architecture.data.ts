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
