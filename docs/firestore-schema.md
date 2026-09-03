# Skema Database Cloud Firestore — Sistem Inventaris Logistik Sespimma Polri

Dokumen ini mendefinisikan koleksi, dokumen, dan field data pada Cloud Firestore.

---

## 1. Collection: `users`
**Path**: `users/{uid}`

| Field | Tipe Data | Deskripsi |
| :--- | :--- | :--- |
| `uid` | string | User ID dari Firebase Auth |
| `name` | string | Nama lengkap pengguna |
| `email` | string | Alamat email terdaftar |
| `role` | string | `super_admin` \| `admin` \| `petugas` \| `user` |
| `unit` | string | Unit / Bagian / Subdit di Sespimma Polri |
| `photoUrl` | string? | URL foto profil |
| `isActive` | boolean | Status keaktifan akun |
| `createdAt` | timestamp | Server timestamp pembuatan |
| `updatedAt` | timestamp | Server timestamp pembaruan |
| `lastLoginAt` | timestamp? | Server timestamp login terakhir |

---

## 2. Collection: `items`
**Path**: `items/{itemId}`

| Field | Tipe Data | Deskripsi |
| :--- | :--- | :--- |
| `inventoryCode` | string | Kode unik barang, e.g. `INV-2026-000001` (Indexed, Unique) |
| `name` | string | Nama barang |
| `categoryId` | string | Reference ID ke `categories/{categoryId}` |
| `categoryNameSnapshot` | string | Snapshot nama kategori untuk kemudahan tampilan |
| `brand` | string | Merk / Pabrikan |
| `model` | string | Tipe / Model barang |
| `serialNumber` | string | Nomor seri pabrik |
| `description` | string | Deskripsi detail & spesifikasi |
| `purchaseDate` | string | Tanggal perolehan / pembelian (`YYYY-MM-DD`) |
| `purchasePrice` | number | Harga perolehan (IDR) |
| `fundingSource` | string | Sumber dana (e.g. APBN 2026, Hibah) |
| `vendor` | string | Nama penyedia / vendor |
| `documentNumber` | string | Nomor BAST / NUP / Dokumen Pengadaan |
| `condition` | string | `Baik` \| `Rusak Ringan` \| `Rusak Berat` |
| `status` | string | `Tersedia` \| `Dipinjam` \| `Dalam Maintenance` \| `Dinonaktifkan` |
| `building` | string | Nama Gedung |
| `floor` | string | Lantai |
| `room` | string | Nama / Nomor Ruangan |
| `locationDetail` | string | Detail posisi spesifik dalam ruangan |
| `responsiblePersonId` | string? | User ID penanggung jawab barang |
| `responsiblePersonNameSnapshot` | string? | Nama penanggung jawab |
| `imageUrl` | string? | URL foto barang dari Firebase Storage |
| `qrUrl` | string | Permanent Deep-Link URL QR Code |
| `isActive` | boolean | Soft delete flag |
| `createdAt` | timestamp | Tanggal dibuat |
| `createdBy` | string | User ID pembuat |
| `updatedAt` | timestamp | Tanggal diubah |
| `updatedBy` | string | User ID pengubah |

---

## 3. Sub-Collection: `items/{itemId}/maintenance`
**Path**: `items/{itemId}/maintenance/{maintenanceId}`

| Field | Tipe Data | Deskripsi |
| :--- | :--- | :--- |
| `date` | string | Tanggal pemeliharaan (`YYYY-MM-DD`) |
| `type` | string | `Preventive` \| `Corrective` \| `Inspection` \| `Cleaning` \| `Repair` \| `Replacement` \| `Other` |
| `complaint` | string | Keluhan / Masalah awal |
| `action` | string | Tindakan pemeliharaan yang dilakukan |
| `technicianId` | string? | ID teknisi / petugas |
| `technicianNameSnapshot` | string | Nama teknisi / pelaksana |
| `cost` | number | Biaya pemeliharaan (IDR) |
| `result` | string | Hasil pemeliharaan |
| `notes` | string? | Catatan tambahan |
| `nextMaintenanceDate` | string? | Tanggal pemeliharaan berikutnya |
| `attachments` | array<string> | List URL dokumen/foto bukti dari Storage |
| `createdAt` | timestamp | Tanggal pencatatan |
| `createdBy` | string | User ID pencatat |
| `updatedAt` | timestamp | Tanggal update |
| `updatedBy` | string | User ID pengupdate |

---

## 4. Sub-Collection: `items/{itemId}/history`
**Path**: `items/{itemId}/history/{historyId}`

| Field | Tipe Data | Deskripsi |
| :--- | :--- | :--- |
| `action` | string | Perubahan status / bidang (e.g. `UPDATE_LOCATION`, `UPDATE_CONDITION`) |
| `description` | string | Rincian deskripsi perubahan |
| `oldData` | map? | Partial snapshot data sebelum diubah |
| `newData` | map? | Partial snapshot data sesudah diubah |
| `userId` | string | User ID pelaku perubahan |
| `userName` | string | Nama pelaku perubahan |
| `timestamp` | timestamp | Server timestamp |

---

## 5. Collection: `categories` & `locations`
- `categories/{categoryId}`: `name`, `description`, `isActive`, `createdAt`, `updatedAt`
- `locations/{locationId}`: `building`, `floor`, `room`, `detail`, `isActive`, `createdAt`, `updatedAt`

---

## 6. Collection: `borrowings`
**Path**: `borrowings/{borrowingId}`

| Field | Tipe Data | Deskripsi |
| :--- | :--- | :--- |
| `itemId` | string | Reference ID barang |
| `itemCode` | string | Snapshot inventoryCode |
| `itemNameSnapshot` | string | Snapshot nama barang |
| `borrowerId` | string | User ID peminjam |
| `borrowerNameSnapshot` | string | Nama peminjam |
| `borrowDate` | string | Tanggal pinjam |
| `expectedReturnDate` | string | Tanggal estimasi kembali |
| `actualReturnDate` | string? | Tanggal aktual pengembalian |
| `status` | string | `requested` \| `borrowed` \| `returned` \| `overdue` \| `cancelled` |
| `purpose` | string | Keperluan peminjaman |
| `notes` | string? | Catatan |
| `createdAt` | timestamp | Tanggal dibuat |
| `createdBy` | string | User ID |

---

## 7. Collection: `auditLogs` & `scanLogs`
- `auditLogs/{logId}`: `userId`, `userName`, `action`, `module`, `targetType`, `targetId`, `description`, `timestamp`
- `scanLogs/{scanId}`: `itemId`, `inventoryCode`, `userId`, `userName`, `timestamp`, `userAgent`, `deviceType`
