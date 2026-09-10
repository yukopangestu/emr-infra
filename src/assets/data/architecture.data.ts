import { ArchitectureData } from '../../app/core/services/content.service';

export const architectureData: ArchitectureData = {
  title: 'Arsitektur produksi platform EMR multitenant',
  lede: 'Satu instalasi di AWS Jakarta melayani puluhan fasilitas kesehatan. Setiap keputusan di halaman ini berpangkal pada satu syarat yang tidak dinegosiasikan: data pasien satu fasilitas tidak boleh dapat diakses fasilitas lain.',
  metadata: {
    'Region': 'ap-southeast-3 (Jakarta)',
    'DR': 'ap-southeast-1 (Singapura)',
    'Isolasi': 'Partisi + Row-Level Security',
    'Estimasi': '± $5.060 / bulan'
  },
  sections: [
    {
      id: 's1',
      number: 1,
      title: 'Master architecture diagram',
      content: 'Trafik pasien masuk lewat ALB Public menuju Gateway Public, dan hanya boleh mencapai layanan klinis dan transaksi. Trafik staf fasilitas masuk lewat Cloudflare Zero Trust menuju ALB Admin, lalu ke seluruh layanan. Zona data tidak memiliki rute keluar ke internet.',
      diagram: {
        file: 'master-diagram.svg',
        caption: 'Gateway Public dan Gateway Admin dipisahkan agar permukaan serang yang terpapar internet hanya mencakup dua layanan, bukan seluruhnya. Audit Service ditandai berbeda karena hak aksesnya khusus: tabelnya tidak dapat diubah maupun dihapus oleh role aplikasi.'
      }
    },
    {
      id: 's2',
      number: 2,
      title: 'Model isolasi tenant',
      content: 'Bagian ini yang membedakan platform multitenant dari platform biasa, dan merupakan keputusan arsitektur paling penting di seluruh dokumen. Satu basis data melayani seluruh fasilitas; pemisahannya ditegakkan mesin basis data, bukan kode aplikasi.',
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
        }
      ],
      callouts: [
        {
          type: 'warning',
          content: 'Konsekuensi yang tidak dapat dibalik dengan murah: kunci partisi wajib menjadi bagian dari setiap primary key dan unique constraint. Primary key berbentuk (tenant_id, id), bukan id tunggal. Seluruh foreign key ikut menjadi komposit.\n\nStruktur ini harus final sebelum implementasi modul klinis pertama dimulai. Mengubahnya setelah ada data produksi berarti merefaktor setiap entity dan setiap kueri.'
        }
      ],
      postContent: ['Membatasi partisi pada kelas pertama menjaga jumlahnya terkendali. Pada 50 fasilitas dengan lima tabel bervolume tinggi, jumlah partisi berada di kisaran 250 — jauh di bawah titik di mana perencanaan kueri mulai terdegradasi.']
    },
    {
      id: 's3',
      number: 3,
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
      number: 4,
      title: 'Compute placement',
      content: 'Tanpa bastion terpisah, tanpa VM runner, tanpa VM batch. Ketiganya digantikan layanan terkelola yang tidak menambah host untuk dijaga.\n\nSetiap workload di cluster wajib memiliki resource request dan limit, Pod Disruption Budget, serta NetworkPolicy yang bersifat tolak-secara-default. Readiness probe memverifikasi konektivitas basis data, bukan sekadar mengembalikan status 200.',
      cards: [
        {
          title: 'EKS — 3 × m6i.xlarge',
          description: 'Private app subnet, satu node per AZ. Autoscaling sampai 5 node. Seluruh service berjalan di sini.'
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
          description: 'Dua replika di data subnet. Wajib, bukan optimasi — lihat bagian 2.'
        }
      ]
    },
    {
      id: 's5',
      number: 5,
      title: 'Security: defense in depth',
      content: 'Empat lapis pertama bersifat preventif dan semuanya dapat gagal karena kesalahan implementasi. Lapis kelima yang menentukan apakah kegagalan itu berubah menjadi insiden kebocoran data.\n\nRole aplikasi bukan superuser, bukan pemilik tabel, dan tidak memiliki hak melewati penyaringan baris. Ketiga kondisi tersebut masing-masing membatalkan seluruh penegakan L5. Verifikasi hak akses dijalankan otomatis pada pipeline.',
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
      number: 6,
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
      number: 7,
      title: 'Backup & disaster recovery',
      content: 'Primary di Jakarta, warm standby di Singapura. Route 53 health check dengan failover routing.\n\nBackup yang belum pernah diuji pemulihannya tidak dapat dianggap sebagai backup. Uji restore dijadwalkan sebagai aktivitas rutin, bukan sebagai respons terhadap insiden.',
      tables: [
        {
          headers: ['Komponen', 'Metode', 'Lintas region', 'RPO', 'RTO'],
          rows: [
            ['RDS PostgreSQL', 'Multi-AZ + PITR + cross-region replica', '✓ ap-southeast-1', '≤ 5 menit', '≤ 1 jam'],
            ['S3 dokumen medis', 'Versioning + replikasi lintas region', '✓ ap-southeast-1', '≤ 15 menit', '≤ 1 jam'],
            ['ElastiCache Redis', 'Tidak di-backup, dibangun ulang', '—', 'Sesi hilang', '≤ 15 menit'],
            ['Amazon MQ', 'Cluster tiga node + infrastructure as code', '✓ re-apply', 'Pesan in-flight hilang', '≤ 2 jam'],
            ['Kegagalan satu AZ', 'Failover otomatis RDS, rescheduling pod', '—', '≈ 0', '≤ 5 menit'],
            ['Kegagalan region', 'Promosi replica + scale up EKS Singapura', 'ap-southeast-1', '≤ 5 menit', '≤ 2 jam']
          ]
        }
      ],
      callouts: [
        {
          type: 'warning',
          content: 'Pemulihan satu fasilitas secara terpisah adalah kelemahan yang diakui dari model basis data bersama. Prosedurnya: restore ke instans sementara, point-in-time recovery, ekspor partisi fasilitas terkait, validasi, lalu impor kembali dengan penanganan konflik yang terdefinisi.\n\nProsedur ini wajib ditulis dan diuji sebelum go-live. Menyusunnya saat insiden sedang berlangsung menghasilkan waktu pemulihan yang jauh melampaui target.'
        }
      ]
    },
    {
      id: 's8',
      number: 8,
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
      id: 's9',
      number: 9,
      title: 'Estimasi biaya bulanan',
      content: 'On-demand ap-southeast-3, tanpa Reserved Instance maupun Savings Plan. Angka USD adalah yang utama; nilai rupiah dihitung pada kurs JISDOR Bank Indonesia 9 September 2026 sebesar Rp17.552 per USD dan perlu dihitung ulang seiring pergerakan nilai tukar.\n\nPada 50 fasilitas, biaya infrastruktur berada di kisaran $101 per fasilitas per bulan, setara sekitar Rp1,78 juta. Biaya marjinal menambah satu fasilitas jauh di bawah angka rata-rata tersebut karena sebagian besar komponen bersifat tetap terhadap jumlah tenant.',
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
            ['Backup & DR', 'AWS Backup + warm standby Singapura', '900'],
            ['CI/CD', 'ECR, runner di luar VPC', '10'],
            ['Transfer', 'NAT data processing + egress', '80'],
            ['Total estimasi', '≈ Rp88,8 juta pada kurs di atas', '≈ 5.060']
          ]
        },
        {
          headers: ['Pemangkasan', 'Dampak', 'Hemat / bulan'],
          rows: [
            ['Amazon MQ → RabbitMQ di EKS', 'Beban operasional pindah ke tim; perlu keahlian tuning dan pemulihan sendiri', '~550'],
            ['DR region → salinan snapshot saja', 'RTO naik dari ≤ 2 jam menjadi ≤ 8 jam. Sulit diterima untuk sistem yang dipakai saat pelayanan berjalan', '~650'],
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
          content: 'Shield Advanced tidak dimasukkan. Biayanya sekitar $3.000 per bulan dan akan melipatgandakan total di atas untuk mendapat SLA DDoS serta akses tim respons AWS. Untuk platform dengan puluhan fasilitas, proporsinya sulit dibenarkan pada tahap ini. Tinjau kembali jika platform menjadi target serangan atau bila disyaratkan kontrak.'
        },
        {
          type: 'warning',
          content: 'Angka di atas adalah estimasi, bukan penawaran. Harga on-demand ap-southeast-3 berubah, dan konsumsi nyata bergantung pada pola beban yang belum terukur. Sebelum dijadikan dasar anggaran, verifikasi dengan AWS Pricing Calculator atau penawaran dari account manager.\n\nDua parameter dengan dampak biaya terbesar — target RPO dan RTO — masih berstatus usulan dan belum disepakati bisnis. RPO mendekati nol memerlukan replikasi sinkron dengan penalti latensi tulis; RTO di bawah satu jam memerlukan standby berkapasitas penuh, bukan warm standby.'
        }
      ]
    }
  ],
  footer: 'Halaman ini merupakan arsitektur referensi untuk lingkungan produksi dan mendampingi Software Architecture Document, yang memuat evaluasi model multitenancy secara lengkap, registrasi risiko, siklus hidup tenant, serta daftar keputusan yang masih menunggu konfirmasi. Seluruh target performa, ketersediaan, dan biaya bersifat usulan dan memerlukan persetujuan pemangku kepentingan sebelum menjadi komitmen. Bagian yang menyangkut kewajiban regulasi perlindungan data dan retensi rekam medis memerlukan verifikasi penasihat hukum.'
};
