# Panduan Pengguna — Sistem Inventaris Logistik Berbasis QR Code Sespimma Polri

Panduan ini berisi petunjuk operasional pengelola logistik, petugas pemeriksa, dan anggota di lingkungan Sespimma Lemdiklat Polri.

---

## 1. Alur Pemindaian QR Code Melalui Kamera HP

1. Buka aplikasi **Kamera** atau **QR Code Scanner** pada smartphone HP Anda.
2. Arahkan kamera ke stiker label QR Code yang terpasang pada fisik barang.
3. Klik tautan URL yang muncul (format: `https://<domain-app>/item/INV-2026-000001`).
4. **Otentikasi Pengguna**:
   - Jika Anda belum login, sistem secara otomatis mengarahkan ke halaman `/login`.
   - Masukkan Alamat Email dan Kata Sandi terdaftar.
   - Setelah login berhasil, sistem **secara otomatis mengarahkan kembali** ke halaman detail barang yang dipindai.
5. Halaman Detail Barang akan menampilkan foto fisik, spesifikasi teknis, kondisi, lokasi gedung/ruangan, riwayat pemeliharaan, serta penanggung jawab aset.

---

## 2. Panduan Administrator (Super Admin & Admin)

### A. Menambahkan Barang Baru
1. Buka menu **Data Barang** pada sidebar.
2. Klik tombol **+ Tambah Barang Baru**.
3. Isi data identitas (Nama, Kategori, Merk, Model, Nomor Seri), harga perolehan, lokasi gedung/ruangan, dan upload foto fisik barang.
4. Klik **Simpan Data Barang**. Sistem akan secara otomatis meng-generate Kode Inventaris unik (misal: `INV-2026-000001`) dan tautan QR Code permanen.

### B. Mencetak Label QR Code Stiker
1. Buka menu **Cetak Label QR**.
2. Pilih barang yang ingin dicetak labelnya (bisa memilih satu barang atau memilih beberapa sekaligus/bulk print).
3. Klik tombol **Cetak Label QR**.
4. Gunakan printer stiker label standar. Setiap label memuat QR Code, Nama Barang, Kode Inventaris, dan identitas Sespimma Lemdiklat Polri.

### C. Mengelola Pemeliharaan (Maintenance)
1. Buka halaman detail barang yang bersangkutan.
2. Klik tombol **+ Maintenance**.
3. Isi Jenis Pemeliharaan (Preventive, Corrective, Repair, Replacement, Inspection), deskripsi keluhan, tindakan yang diambil, nama teknisi, serta biaya.
4. Simpan maintenance. Riwayat akan tersimpan permanen dan terikat pada barang tersebut.

### D. Mengelola Peminjaman Barang
1. Pada halaman detail barang atau menu **Peminjaman Barang**, klik **Ajukan Peminjaman**.
2. Isi tanggal pinjam, estimasi pengembalian, serta keperluan kedinasan.
3. Status barang otomatis berubah menjadi **Dipinjam**.
4. Saat pengembalian, klik **Proses Kembali** untuk mengembalikan status barang menjadi **Tersedia**.

---

## 3. Panduan Troubleshooting Sederhana
- **Halaman Access Denied (403)**: Peran (role) akun Anda tidak memiliki akses ke fitur tertentu. Hubungi Super Admin untuk penyesuaian wewenang.
- **Lupa Kata Sandi**: Pada halaman login, klik *Lupa Sandi?* dan masukkan email terdaftar untuk menerima tautan pemulihan sandi.
