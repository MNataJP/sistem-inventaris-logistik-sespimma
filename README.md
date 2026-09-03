# SISTEM INVENTARIS LOGISTIK BERBASIS QR CODE — SESPIMMA POLRI

Sistem aplikasi web pengelolaan aset dan inventaris logistik berbasis QR Code untuk **Sespimma Lemdiklat Polri**. Sistem ini terintegrasi penuh dengan **Firebase Authentication, Cloud Firestore, Firebase Storage, dan Firebase Hosting**.

---

## 🌟 Fitur utama

1. **Auto-Generated Unique Inventory Code**: Format `INV-YYYY-XXXXXX` (misal: `INV-2026-000001`) yang unik dan aman dari tabrakan data.
2. **Permanent Deep-Link QR Code**: QR Code hanya menyimpan URL permanen (`https://domain/item/INV-2026-000001`). Seluruh data sensitif diproteksi oleh otentikasi.
3. **Alur Scan HP Langsung**: Pengguna memindai QR melalui kamera HP, membuka URL barang, melakukan autentikasi jika belum login, dan otomatis diarahkan kembali ke detail barang.
4. **Label QR Printable Layout**: Cetak label QR tunggal maupun massal (*bulk print*) dengan tata letak bersih dan proporsional untuk printer label stiker.
5. **Multi-Role Authorization (RBAC)**:
   - `super_admin`: Akses penuh sistem, kelola pengguna, otorisasi peran, audit log, & aturan keamanan.
   - `admin`: Kelola data barang, pencetakan QR, maintenance, peminjaman, & ekspor laporan.
   - `petugas`: Pemeriksa lapangan, scan/lihat detail barang, catat maintenance, & proses pengembalian.
   - `user`: Anggota/pengguna umum, lihat detail barang dan ajukan peminjaman.
6. **Manajemen Pemeliharaan (Maintenance)**: Pencatatan perbaikan *Preventive, Corrective, Repair, Inspection*, biaya, teknisi, dan histori.
7. **Peminjaman Logistik**: Alur transaksi atomik peminjaman dan pengembalian barang dengan pembaruan status otomatis (`Tersedia` ↔ `Dipinjam`).
8. **Audit Trail & Scan Log System**: Pencatatan riwayat perubahan data (*Append-Only*) serta log pemindaian QR dari HP/perangkat.
9. **Dashboard Eksekutif Real-Time**: Ringkasan jumlah barang, kondisi (Baik, Rusak Ringan, Rusak Berat), status, serta grafik distribusi.
10. **Ekspor & Impor Excel**: Ekspor data inventaris logistik ke format Excel (.xlsx).

---

## 🏗️ Teknologi & Arsitektur

- **Frontend Core**: React 18 + Vite + TypeScript (Strict Mode)
- **UI & Icon System**: Vanilla Modern CSS + Lucide Icons + Recharts
- **Database**: Google Cloud Firestore
- **Otentikasi**: Firebase Authentication (Email & Password, Session Persistence)
- **Storage**: Firebase Storage (Foto barang & lampiran dokumen)
- **Hosting**: Firebase Hosting (SPA Rewrites, Global CDN, SSL HTTPS)

---

## 🚀 Panduan Setup & Memulai Pengembangan Lokal

### 1. Prasyarat
- Node.js v18+ dan npm v9+

### 2. Konfigurasi Environment Variables
Buat file `.env` di direktori utama dan tambahkan credential Firebase yang telah diberikan:

```env
VITE_FIREBASE_API_KEY=AIzaSyABXZnGM15wLwfEX62UwBEurxFZMaWqu6E
VITE_FIREBASE_AUTH_DOMAIN=sistem-logistik-sespimma-polri.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=sistem-logistik-sespimma-polri
VITE_FIREBASE_STORAGE_BUCKET=sistem-logistik-sespimma-polri.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=687634657567
VITE_FIREBASE_APP_ID=1:687634657567:web:acc2e923d389208bbfc02a
VITE_FIREBASE_MEASUREMENT_ID=G-QCWFCS846G
```

### 3. Install Dependensi & Jalankan Server Lokal
```bash
npm install
npm run dev
```
Buka peramban di `http://localhost:5173`.

### 4. Build Produksi & Deploy ke Firebase Hosting
```bash
npm run build
npx firebase-tools deploy
```

---

## 🔒 Aturan Keamanan Database & Storage

Aturan keamanan telah didefinisikan pada file `firestore.rules` dan `storage.rules`:
- Pengguna anonim/unauthenticated **tidak dapat** mengakses data barang.
- Role dan otorisasi sepenuhnya diverifikasi pada sisi server Firestore Security Rules.
- Koleksi `auditLogs` dan `scanLogs` bersifat *Append-Only* (tidak dapat diubah atau dihapus).

---

## 📑 Dokumentasi Terkait
- [Arsitektur Sistem](docs/architecture.md)
- [Skema Firestore](docs/firestore-schema.md)
- [Spesifikasi Keamanan](docs/security.md)
- [Panduan Pengguna](docs/user-guide.md)
