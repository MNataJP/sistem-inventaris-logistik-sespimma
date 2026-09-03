# MASTER PROMPT — SISTEM INVENTARIS LOGISTIK BERBASIS QR CODE
## Implementasi End-to-End dengan Google Antigravity
### Stack utama: React + Vite + TypeScript + Firebase Authentication + Cloud Firestore + Firebase Storage + Firebase Hosting

---

## 0. INSTRUKSI UTAMA UNTUK AGENT ANTIGRAVITY

Anda bertindak sebagai Senior Full-Stack Engineer, Software Architect, UI/UX Engineer, Firebase Security Engineer, QA Engineer, dan DevOps Engineer.

Bangun proyek ini sampai benar-benar selesai, runnable, aman, responsif, dan siap digunakan.

JANGAN hanya membuat mockup, placeholder, pseudocode, atau halaman statis. Semua fitur yang disebutkan harus benar-benar diimplementasikan dan terhubung ke Firebase.

Gunakan pendekatan bertahap. Sebelum mengubah banyak file, pahami struktur proyek yang sudah ada. Jika proyek masih kosong, inisialisasi struktur yang diperlukan.

PRINSIP WAJIB:
1. Jangan menghapus fitur yang sudah bekerja tanpa alasan.
2. Jangan menggunakan data dummy sebagai pengganti Firebase pada production flow.
3. Jangan menaruh secret Firebase Admin SDK/private key di frontend.
4. Jangan menyimpan seluruh data barang di dalam QR Code.
5. QR Code hanya berisi URL permanen menuju halaman detail barang.
6. Detail barang harus membutuhkan autentikasi.
7. Authorization wajib ditegakkan melalui Firebase Authentication + Firestore Security Rules, bukan frontend saja.
8. Gunakan TypeScript dengan strict mode.
9. Gunakan reusable components.
10. Gunakan loading state, empty state, error state, confirmation dialog, dan toast/feedback.
11. Validasi form di client dan server/rules sesuai kemampuan Firebase.
12. Semua timestamp penting gunakan serverTimestamp() atau mekanisme timestamp Firebase yang tepat.
13. Hindari query Firestore yang mahal dan tidak perlu.
14. Jangan expose informasi sensitif pada halaman publik.
15. Jangan membuat QR berisi nomor serial, harga, atau informasi sensitif.
16. Jika ada keputusan teknis yang belum ditentukan, pilih solusi yang paling sederhana, aman, maintainable, dan kompatibel dengan Firebase.
17. Setelah setiap phase selesai, jalankan lint/build/test yang relevan dan perbaiki error sebelum lanjut.
18. Dokumentasikan konfigurasi yang diperlukan.
19. Jangan berhenti hanya karena ada error kecil; diagnosa dan perbaiki sampai phase tersebut lolos.
20. Jangan meminta saya menulis kode yang seharusnya dapat Anda implementasikan sendiri.

Nama aplikasi sementara:
"Sistem Inventaris Logistik"

Tujuan:
Membangun sistem inventaris logistik yang memungkinkan setiap barang memiliki QR Code unik. Admin dapat mengelola barang dan otomatis menghasilkan QR Code yang dapat di-download dan di-print. QR ditempel pada barang. Pengguna cukup memindai QR menggunakan kamera/QR scanner bawaan HP, browser membuka URL barang, pengguna login terlebih dahulu, lalu sistem menampilkan detail barang, riwayat maintenance, dan informasi lain sesuai hak akses.

---

# PHASE 1 — ANALISIS DAN PERENCANAAN

Sebelum coding:

1. Audit repository/project.
2. Identifikasi framework yang sudah ada.
3. Jika kosong, gunakan:
   - React
   - Vite
   - TypeScript
   - Firebase Web SDK
4. Buat dokumentasi:
   - README.md
   - docs/architecture.md
   - docs/firestore-schema.md
   - docs/security.md
   - docs/implementation-plan.md
5. Buat arsitektur:
   Browser/User
       |
       v
   React Web App
       |
       +--> Firebase Authentication
       |
       +--> Cloud Firestore
       |
       +--> Firebase Storage
       |
       +--> Firebase Hosting
6. Tetapkan route utama:
   /login
   /forgot-password
   /dashboard
   /items
   /items/new
   /items/:id
   /items/:id/edit
   /items/:id/maintenance
   /categories
   /locations
   /borrowings
   /users
   /audit-logs
   /qr-print
   /profile
7. Route /item/:inventoryCode atau route setara untuk hasil scan QR.
8. Tentukan mana route public dan mana route protected.
9. Buat keputusan arsitektur yang terdokumentasi.

Jangan lanjut ke Phase 2 sebelum struktur dasar dan rencana terdokumentasi.

---

# PHASE 2 — SETUP PROJECT DAN UI SYSTEM

Implementasikan:

1. React + Vite + TypeScript.
2. Firebase SDK.
3. ESLint.
4. Formatter yang sesuai.
5. Struktur folder modular, misalnya:

src/
  app/
  components/
  features/
    auth/
    dashboard/
    items/
    maintenance/
    borrowings/
    categories/
    locations/
    users/
    audit/
    qr/
  layouts/
  pages/
  routes/
  services/
  hooks/
  lib/
  types/
  utils/
  styles/

6. Buat design system konsisten.
7. Responsive desktop/tablet/mobile.
8. Sidebar desktop.
9. Mobile navigation.
10. Header.
11. Breadcrumb.
12. Cards.
13. Tables.
14. Modal/dialog.
15. Form components.
16. Badge status.
17. Toast notification.
18. Skeleton/loading.
19. Empty state.
20. Error state.

Gaya visual:
- profesional
- modern
- clean
- cocok untuk sistem administrasi/logistik institusi
- mudah dibaca
- tidak berlebihan
- mobile-friendly

---

# PHASE 3 — FIREBASE CONFIGURATION

Gunakan Firebase Web SDK.

Aktifkan:
1. Firebase Authentication
2. Cloud Firestore
3. Firebase Storage
4. Firebase Hosting

Authentication:
- Email/password
- Password reset
- Persistent login session
- Logout

Buat file konfigurasi frontend menggunakan environment variables.

Contoh variabel:
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID

Jangan hardcode secret sensitif.

Buat:
.env.example

Jangan commit .env asli.

---

# PHASE 4 — AUTHENTICATION DAN ROLE

Implementasikan:

1. Login
2. Logout
3. Forgot password
4. Session persistence
5. Auth context/provider
6. Protected route
7. Role-based access

Role minimal:
- super_admin
- admin
- petugas
- user

Kemampuan:

super_admin:
- semua fitur
- user management
- konfigurasi sistem
- CRUD barang
- maintenance
- peminjaman
- audit log
- QR

admin:
- CRUD barang
- maintenance
- peminjaman
- QR
- laporan

petugas:
- melihat barang
- scan/detail
- maintenance sesuai izin
- peminjaman sesuai izin

user:
- melihat detail barang yang diizinkan
- melihat informasi maintenance yang diizinkan

Jangan percaya role dari localStorage. Role harus berasal dari sumber data yang aman dan diperkuat Firestore Security Rules.

Collection:
users/{uid}

Field:
uid
name
email
role
unit
photoUrl
isActive
createdAt
updatedAt
lastLoginAt

Jika menggunakan custom claims, dokumentasikan dan implementasikan dengan benar. Untuk MVP, role profile Firestore boleh digunakan bersama rules yang tepat, dengan perhatian terhadap privilege escalation.

---

# PHASE 5 — DATABASE FIRESTORE

Gunakan struktur berikut sebagai baseline.

users/{uid}
  name
  email
  role
  unit
  photoUrl
  isActive
  createdAt
  updatedAt
  lastLoginAt

items/{itemId}
  inventoryCode
  name
  categoryId
  categoryNameSnapshot
  brand
  model
  serialNumber
  description
  purchaseDate
  purchasePrice
  fundingSource
  vendor
  documentNumber
  condition
  status
  building
  floor
  room
  locationDetail
  responsiblePersonId
  responsiblePersonNameSnapshot
  imageUrl
  qrUrl
  isActive
  createdAt
  updatedAt
  createdBy
  updatedBy

items/{itemId}/maintenance/{maintenanceId}
  date
  type
  complaint
  action
  technicianId
  technicianNameSnapshot
  cost
  result
  notes
  nextMaintenanceDate
  attachments
  createdAt
  createdBy
  updatedAt
  updatedBy

items/{itemId}/history/{historyId}
  action
  description
  oldData
  newData
  userId
  userName
  timestamp

categories/{categoryId}
  name
  description
  isActive
  createdAt
  updatedAt

locations/{locationId}
  building
  floor
  room
  detail
  isActive
  createdAt
  updatedAt

borrowings/{borrowingId}
  itemId
  itemCode
  itemNameSnapshot
  borrowerId
  borrowerNameSnapshot
  borrowDate
  expectedReturnDate
  actualReturnDate
  status
  purpose
  notes
  createdAt
  createdBy
  updatedAt
  updatedBy

auditLogs/{logId}
  userId
  userName
  action
  module
  targetType
  targetId
  description
  timestamp

scanLogs/{scanId}
  itemId
  inventoryCode
  userId
  userName
  timestamp
  userAgent
  deviceType

systemSettings/{settingId}
  key
  value
  updatedAt
  updatedBy

Catatan:
- Hindari denormalisasi berlebihan.
- Snapshot nama boleh digunakan untuk menjaga histori tetap terbaca.
- Jangan simpan data rahasia dalam document yang bisa dibaca user.
- Gunakan pagination pada tabel besar.
- Buat index Firestore yang memang diperlukan oleh query.

---

# PHASE 6 — INVENTORY CRUD

Buat modul Data Barang.

Fitur:
1. List barang
2. Search
3. Filter
4. Sort
5. Pagination
6. Tambah barang
7. Detail barang
8. Edit barang
9. Nonaktifkan barang
10. Hapus sesuai role/aturan
11. Upload foto
12. Validasi input

Form minimal:
- Kode inventaris
- Nama barang
- Kategori
- Merk
- Model/Tipe
- Nomor seri
- Deskripsi
- Tanggal pembelian
- Harga
- Sumber dana
- Vendor
- Nomor dokumen
- Kondisi
- Status
- Gedung
- Lantai
- Ruangan
- Lokasi detail
- Penanggung jawab
- Foto

Format kode inventaris:
INV-YYYY-000001

Kode harus unik.

Jika collision terjadi, sistem harus menanganinya dengan aman.

Jangan menggunakan timestamp sederhana sebagai satu-satunya jaminan uniqueness.

---

# PHASE 7 — QR CODE GENERATOR

Ini adalah fitur utama.

Ketika barang dibuat:
1. Sistem membuat inventoryCode unik.
2. Sistem membangun URL permanen.

Format:
https://DOMAIN/item/INV-2026-000001

Gunakan environment variable untuk base URL jika diperlukan.

QR Code hanya menyimpan URL tersebut.

Jangan masukkan seluruh data barang ke QR.

Implementasikan:
1. QR preview di tabel/detail.
2. Generate QR otomatis.
3. Download PNG/SVG.
4. Print individual.
5. Bulk print.
6. Label printable.

Label minimal:
- QR Code
- Nama barang
- Kode inventaris

Contoh:

[QR CODE]

MONITOR DELL
INV-2026-000001

Buat halaman /qr-print atau modal print khusus yang menghasilkan layout bersih untuk printer.

QR harus tetap sama walaupun:
- lokasi berubah
- kondisi berubah
- penanggung jawab berubah
- data maintenance bertambah

Karena QR menunjuk ke inventoryCode/ID, bukan data mutable.

---

# PHASE 8 — ALUR SCAN QR DARI HP

WAJIB mempertahankan flow:

HP camera / QR scanner
    |
    v
Scan QR
    |
    v
Browser membuka:
https://DOMAIN/item/INV-2026-000001
    |
    v
Route membaca inventoryCode
    |
    v
Jika belum login -> /login
    |
    v
Setelah login -> kembali ke URL barang semula
    |
    v
Detail barang

Jangan mengharuskan user membuka website terlebih dahulu.

Tidak perlu membuat scanner khusus untuk MVP.

Pastikan deep-link route bekerja saat URL dibuka langsung.

Jika Firebase Hosting digunakan, konfigurasi SPA rewrites agar route seperti /item/... tidak menghasilkan 404 ketika dibuka langsung.

---

# PHASE 9 — PROTECTED ITEM DETAIL

Halaman detail barang dari QR harus protected.

Behavior:
- Belum login -> tampilkan login.
- Setelah login -> redirect kembali ke halaman barang.
- User terautentikasi -> Firestore query.
- Tidak punya izin -> tampilkan Access Denied.
- Barang tidak ditemukan -> 404/Not Found.
- Barang nonaktif -> tampilkan status sesuai aturan.

Detail:
1. Foto
2. Kode inventaris
3. Nama
4. Kategori
5. Merk
6. Model
7. Serial number sesuai hak akses
8. Kondisi
9. Status
10. Lokasi
11. Penanggung jawab
12. Informasi pengadaan sesuai hak akses
13. Maintenance
14. Peminjaman
15. Riwayat
16. Dokumen sesuai hak akses

Pisahkan informasi publik dari informasi internal/sensitif.

---

# PHASE 10 — MAINTENANCE MANAGEMENT

Implementasikan:

1. Tambah maintenance
2. Edit maintenance
3. Detail maintenance
4. Hapus sesuai role
5. Riwayat maintenance
6. Next maintenance date
7. Status maintenance
8. Upload attachment jika diperlukan

Field:
- tanggal
- jenis
- keluhan
- tindakan
- teknisi
- biaya
- hasil
- catatan
- jadwal maintenance berikutnya
- attachment

Jenis:
- Preventive
- Corrective
- Inspection
- Cleaning
- Repair
- Replacement
- Other

Tambahkan indikator:
- Maintenance jatuh tempo
- Maintenance mendekati jatuh tempo
- Maintenance terlambat

---

# PHASE 11 — PEMINJAMAN BARANG

Implementasikan:
1. Buat peminjaman
2. Pengembalian
3. Status
4. Riwayat

Status:
- requested
- borrowed
- returned
- overdue
- cancelled

Ketika barang dipinjam:
status item dapat menjadi "Dipinjam" sesuai aturan.

Ketika dikembalikan:
status kembali "Tersedia" atau status lain sesuai kondisi aktual.

Hindari race condition sebisa mungkin. Gunakan transaksi/batch write Firestore untuk perubahan yang harus atomik.

---

# PHASE 12 — AUDIT LOG

Catat aktivitas penting:
- login
- logout jika relevan
- create item
- update item
- delete/deactivate item
- add maintenance
- edit maintenance
- borrowing
- return
- QR generation jika relevan
- user role change
- perubahan permission
- perubahan data penting

Format:
timestamp
user
action
module
target
description
before
after

Jangan menyimpan password atau credential ke audit log.

---

# PHASE 13 — SCAN LOG

Jika sesuai kebijakan sistem, catat setiap akses detail dari QR:
- user
- barang
- waktu
- device type
- user agent

Jangan menyimpan data pribadi perangkat yang tidak diperlukan.

Buat halaman admin:
"Riwayat Scan"

Filter:
- tanggal
- user
- barang

---

# PHASE 14 — DASHBOARD

Dashboard harus real-time atau near-real-time sesuai kebutuhan.

Card:
- Total barang
- Barang baik
- Rusak ringan
- Rusak berat
- Dalam maintenance
- Dipinjam
- Tidak aktif

Grafik:
- Barang berdasarkan kondisi
- Barang berdasarkan kategori
- Barang berdasarkan lokasi
- Maintenance per bulan
- Peminjaman per bulan

Tambahkan:
- Barang yang maintenance-nya jatuh tempo
- Aktivitas terbaru
- Scan terbaru
- Barang terbaru ditambahkan

Jangan melakukan query berulang yang mahal hanya untuk dashboard. Optimalkan agregasi/query.

---

# PHASE 15 — KATEGORI DAN LOKASI

Kategori:
- CRUD
- aktif/nonaktif
- pencarian

Lokasi:
- gedung
- lantai
- ruangan
- detail
- aktif/nonaktif

Pastikan barang dapat difilter berdasarkan lokasi.

---

# PHASE 16 — USER MANAGEMENT

Khusus super_admin/admin yang berwenang.

Fitur:
- list user
- tambah user
- edit profile
- aktivasi/nonaktivasi
- role
- unit
- reset password melalui flow Firebase
- lihat aktivitas

Jangan memberikan kemampuan mengubah password orang lain secara langsung dari frontend dengan cara yang tidak aman.

Jika pembuatan user admin membutuhkan Admin SDK/Cloud Functions, gunakan backend/server-side yang aman. Jangan pernah menaruh service account private key di frontend.

---

# PHASE 17 — IMPORT DAN EXPORT

Implementasikan setelah core system stabil.

Import:
- Excel/CSV
- template import
- validasi
- preview
- error report
- batch insertion

Export:
- Excel/CSV
- PDF jika diperlukan

Pastikan data yang diekspor sesuai permission user.

---

# PHASE 18 — FIRESTORE SECURITY RULES

Ini WAJIB dan tidak boleh dilewati.

Buat rules berdasarkan:
- request.auth
- role
- ownership/permission
- active user
- allowed fields
- immutable fields jika diperlukan

Contoh konsep:
- unauthenticated: tidak boleh membaca detail item.
- user: read item sesuai permission.
- petugas: read + operasi yang diizinkan.
- admin: CRUD sesuai modul.
- super_admin: full access.

Jangan membuat:
allow read, write: if true;

Jangan menjadikan database public hanya agar aplikasi "berhasil".

Validasi:
- user tidak boleh mengubah role dirinya sendiri.
- user biasa tidak boleh membuat admin.
- user tidak boleh menghapus audit log.
- createdAt/createdBy tidak boleh sembarang diubah.
- inventoryCode harus dijaga.
- data sensitif harus dibatasi.

Uji rules dengan Firebase Emulator jika memungkinkan.

---

# PHASE 19 — STORAGE SECURITY

Storage digunakan untuk:
- foto barang
- attachment maintenance
- dokumen yang diizinkan

Aturan:
- autentikasi wajib.
- validasi content type.
- batas ukuran file.
- folder berdasarkan itemId.
- user tidak boleh mengakses dokumen yang tidak menjadi haknya.

Contoh:
items/{itemId}/images/...
items/{itemId}/maintenance/{maintenanceId}/...

Jangan menerima file tanpa batas ukuran.

---

# PHASE 20 — ERROR HANDLING

Semua operasi Firebase harus menangani:
- permission denied
- network error
- not found
- unauthenticated
- invalid argument
- timeout
- upload failure

Gunakan pesan user-friendly dalam Bahasa Indonesia.

Contoh:
"Anda tidak memiliki izin untuk mengubah data barang ini."

Jangan tampilkan stack trace ke user.

---

# PHASE 21 — UX DETAIL

Pastikan:
- tombol memiliki loading state
- submit tidak dapat diklik berkali-kali
- delete menggunakan confirmation
- form memberi validasi
- tabel responsive
- mobile detail mudah dibaca
- QR mudah diperbesar
- print layout bersih
- warna status konsisten
- keyboard accessibility
- focus state
- semantic HTML
- kontras warna memadai

---

# PHASE 22 — SEARCH DAN FILTER

Search barang berdasarkan:
- inventoryCode
- nama
- merk
- model
- serial number
- lokasi

Filter:
- kategori
- kondisi
- status
- gedung
- ruangan
- tahun pembelian
- maintenance status

Gunakan query Firestore yang sesuai dan hindari menarik seluruh koleksi jika data besar.

---

# PHASE 23 — PERFORMANCE

Optimalkan:
- lazy loading route
- pagination
- memoization jika diperlukan
- image compression
- query Firestore
- indexes
- avoid unnecessary listeners
- cleanup subscriptions
- caching yang aman

Jangan menggunakan realtime listener untuk semua halaman jika tidak diperlukan.

---

# PHASE 24 — ACCESSIBILITY

Pastikan:
- keyboard navigable
- label form jelas
- aria label untuk icon button
- focus visible
- modal accessible
- error message terhubung dengan input
- kontras memadai
- tidak hanya mengandalkan warna untuk status

---

# PHASE 25 — TESTING

Buat testing minimal:

Unit test:
- inventory code generation
- role guard
- validation
- QR URL generation
- utility functions

Integration:
- login
- CRUD item
- maintenance
- borrowing
- QR route
- protected route

Security:
- unauthenticated access
- user privilege escalation
- admin access
- role modification
- unauthorized Firestore access

E2E flow paling penting:

TEST 1:
Admin login
-> tambah barang
-> QR otomatis
-> download
-> print preview

TEST 2:
HP/Browser membuka QR URL
-> belum login
-> login
-> kembali ke detail barang
-> detail tampil

TEST 3:
User biasa mencoba edit
-> ditolak

TEST 4:
Admin menambahkan maintenance
-> history bertambah

TEST 5:
Barang dipinjam
-> status berubah
-> dikembalikan
-> status kembali sesuai aturan

---

# PHASE 26 — FIREBASE EMULATOR

Jika feasible, gunakan Firebase Emulator Suite untuk:
- Auth
- Firestore
- Storage

Buat seed data development.

Pisahkan:
development
staging
production

Jangan mencampurkan data testing dengan production.

---

# PHASE 27 — DEPLOYMENT

Firebase Hosting:

1. Build production.
2. Deploy.
3. Konfigurasi SPA rewrite.
4. Pastikan route:
   /login
   /dashboard
   /items
   /item/:inventoryCode
   dapat dibuka langsung.
5. Pastikan HTTPS.
6. Pastikan environment production benar.
7. Pastikan Firebase rules production aktif.

Dokumentasikan:
- firebase login
- firebase init
- firebase deploy
- environment configuration
- build command
- test command

Jangan menaruh credential pribadi dalam README.

---

# PHASE 28 — FINAL QA CHECKLIST

Sebelum menyatakan selesai, cek:

AUTH
[ ] Login
[ ] Logout
[ ] Forgot password
[ ] Session persistence
[ ] Role authorization

INVENTORY
[ ] Create
[ ] Read
[ ] Update
[ ] Deactivate/delete
[ ] Search
[ ] Filter
[ ] Pagination
[ ] Photo

QR
[ ] Generate otomatis
[ ] QR URL benar
[ ] Download
[ ] Print
[ ] Bulk print
[ ] Label nama barang
[ ] Label kode inventaris

SCAN
[ ] Scan dari kamera HP
[ ] URL terbuka
[ ] Login required
[ ] Redirect kembali ke item
[ ] Detail tampil
[ ] Access denied bekerja
[ ] 404 bekerja

MAINTENANCE
[ ] Create
[ ] Edit
[ ] History
[ ] Next maintenance
[ ] Attachment
[ ] Reminder indicator

BORROWING
[ ] Borrow
[ ] Return
[ ] Overdue
[ ] Status item sinkron

SECURITY
[ ] Firestore Rules
[ ] Storage Rules
[ ] Role protection
[ ] No public sensitive data
[ ] No client-side-only authorization
[ ] No service account key in frontend

REPORTING
[ ] Dashboard
[ ] Statistics
[ ] Export
[ ] Audit log
[ ] Scan history

DEPLOYMENT
[ ] Production build
[ ] Firebase Hosting
[ ] SPA rewrite
[ ] HTTPS
[ ] Production rules
[ ] README

---

# PHASE 29 — FINAL DOCUMENTATION

Setelah seluruh implementasi selesai, update README.md berisi:

1. Nama proyek
2. Deskripsi
3. Fitur
4. Tech stack
5. Arsitektur
6. Struktur folder
7. Firebase setup
8. Environment variables
9. Firestore schema
10. Security rules
11. Cara menjalankan lokal
12. Cara menjalankan emulator
13. Cara build
14. Cara deploy
15. Cara membuat admin
16. Cara menambah barang
17. Cara generate QR
18. Cara print QR
19. Cara scan QR
20. Troubleshooting
21. Testing
22. Production checklist

Buat juga:
docs/user-guide.md

Berisi panduan:
- admin
- petugas
- user
- scan QR
- maintenance
- peminjaman
- print QR

---

# PHASE 30 — DEFINITION OF DONE

Proyek hanya boleh dianggap selesai jika:

1. Aplikasi dapat dijalankan.
2. Build production berhasil.
3. Firebase Authentication bekerja.
4. Firestore bekerja.
5. Storage bekerja jika digunakan.
6. Admin dapat membuat barang.
7. Setiap barang memiliki inventoryCode unik.
8. QR Code otomatis dibuat.
9. QR dapat di-download.
10. QR dapat di-print.
11. Nama barang berada di bawah QR.
12. QR dapat dipindai menggunakan kamera/QR scanner HP.
13. Scanner membuka URL barang langsung.
14. URL meminta login jika belum authenticated.
15. Setelah login user kembali ke barang yang dipindai.
16. Detail barang tampil sesuai permission.
17. Maintenance tersimpan dan memiliki histori.
18. Peminjaman bekerja jika modul diaktifkan.
19. Audit log bekerja.
20. Firestore Rules tidak public.
21. Storage Rules aman.
22. Tidak ada secret sensitif di frontend.
23. Responsive.
24. Error handling bekerja.
25. Test utama lulus.
26. README lengkap.
27. Deployment berhasil atau instruksi deployment lengkap.
28. Tidak ada TODO kritis.
29. Tidak ada placeholder penting.
30. Tidak ada console error kritis pada production flow.

---

# ATURAN EKSEKUSI ANTIGRAVITY

Kerjakan secara berurutan:

PHASE 1
-> audit + architecture

PHASE 2
-> project + UI system

PHASE 3
-> Firebase

PHASE 4
-> authentication + roles

PHASE 5
-> Firestore schema

PHASE 6
-> inventory CRUD

PHASE 7
-> QR generator

PHASE 8
-> scan flow

PHASE 9
-> protected detail

PHASE 10
-> maintenance

PHASE 11
-> borrowing

PHASE 12
-> audit

PHASE 13
-> scan logs

PHASE 14
-> dashboard

PHASE 15
-> categories/location

PHASE 16
-> user management

PHASE 17
-> import/export

PHASE 18
-> security rules

PHASE 19
-> storage security

PHASE 20
-> error handling

PHASE 21
-> UX

PHASE 22
-> search/filter

PHASE 23
-> performance

PHASE 24
-> accessibility

PHASE 25
-> testing

PHASE 26
-> emulator

PHASE 27
-> deployment

PHASE 28
-> final QA

PHASE 29
-> documentation

PHASE 30
-> final verification

SETELAH SETIAP PHASE:
1. Periksa hasil.
2. Jalankan lint.
3. Jalankan test yang relevan.
4. Jalankan build bila relevan.
5. Perbaiki error.
6. Update dokumentasi.
7. Catat apa yang selesai.
8. Baru lanjut ke phase berikutnya.

JANGAN mengklaim selesai jika fitur belum benar-benar bekerja.

Jika menemukan konflik antara requirement dan kondisi repository:
- prioritaskan keamanan,
- pertahankan fitur existing,
- pilih solusi paling maintainable,
- dokumentasikan keputusan.

HASIL AKHIR YANG DIHARAPKAN:
Sebuah sistem inventaris logistik berbasis web yang siap digunakan, dengan QR Code unik per barang, authentication, role-based authorization, Cloud Firestore, Firebase Storage, maintenance history, audit trail, dashboard, print QR label, dan deployment Firebase Hosting.
