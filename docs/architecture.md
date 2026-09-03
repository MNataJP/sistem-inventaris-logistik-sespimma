# Dokumentasi Arsitektur — Sistem Inventaris Logistik Sespimma Polri

## 1. Overview Arsitektur

Sistem Inventaris Logistik Sespimma Polri dirancang menggunakan arsitektur modern Serverless Single Page Application (SPA) berbasis React, TypeScript, dan Firebase Cloud Infrastructure.

```mermaid
graph TD
    ClientHP[Kamera/Browser HP User] -->|Scan QR URL| Router[React Router /item/:code]
    ClientDesktop[Desktop Browser Admin] -->|Web Access| App[React + Vite SPA]
    
    subgraph Frontend Layer [React + Vite + TypeScript]
        App --> AuthCtx[Auth Context & State]
        App --> Router
        App --> Components[UI Components & Layouts]
        App --> Services[Firebase API Services]
    end

    subgraph Firebase Cloud Infrastructure
        Services -->|SDK v10| Auth[Firebase Authentication]
        Services -->|SDK v10| Firestore[Cloud Firestore Database]
        Services -->|SDK v10| Storage[Firebase Storage - Assets/Photos]
        App -->|Hosting Deploy| Hosting[Firebase Hosting - CDN & SPA Rewrites]
    end

    subgraph Security Layer
        Firestore --> FirestoreRules[Firestore Security Rules]
        Storage --> StorageRules[Storage Security Rules]
    end
```

---

## 2. Alur Utama QR Code Scan (Mobile Deep-Linking)

```mermaid
sequenceDiagram
    autonumber
    actor Inspector as Petugas / User HP
    participant Camera as Kamera / QR Scanner HP
    participant Hosting as Firebase Hosting SPA Rewrites
    participant ReactApp as React App (/item/:inventoryCode)
    participant Auth as Firebase Auth
    participant Firestore as Cloud Firestore

    Inspector->>Camera: Memindai QR Code pada barang
    Camera->>Hosting: Buka URL (https://domain/item/INV-2026-000001)
    Hosting->>ReactApp: Return index.html (SPA Rewrite)
    ReactApp->>Auth: Cek status autentikasi user
    alt User belum terautentikasi
        ReactApp->>Inspector: Redirect ke /login (simpan returnUrl = /item/INV-2026-000001)
        Inspector->>ReactApp: Form Login (Email & Password)
        ReactApp->>Auth: Authenticate
        Auth-->>ReactApp: Success (ID Token)
        ReactApp->>ReactApp: Redirect kembali ke /item/INV-2026-000001
    end
    ReactApp->>Firestore: Fetch items where inventoryCode == INV-2026-000001
    Firestore->>FirestoreRules: Evaluasi hak akses user
    alt Hak Akses Sesuai
        Firestore-->>ReactApp: Return Data Barang + Maintenance + Borrowing
        ReactApp->>Firestore: Record scanLogs (itemId, userId, device, timestamp)
        ReactApp->>Inspector: Tampilkan Detail Barang & Fitur Aksi
    else Hak Akses Ditolak
        Firestore-->>ReactApp: Permission Denied Error
        ReactApp->>Inspector: Tampilkan Halaman Access Denied (403)
    end
```

---

## 3. Matriks Peran & Hak Akses (Role-Based Access Control)

| Peran (Role) | Akses Dashboard | CRUD Barang | Print QR | Maintenance | Peminjaman | User Mgmt | Audit Trail |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **`super_admin`** | Full | Full | Full | Full | Full | Full | Read-Only |
| **`admin`** | Full | Full | Full | Full | Full | View Only | Read-Only |
| **`petugas`** | Inspector View | Read Only | Single Print | Create & Edit | Process | No | No |
| **`user`** | Restricted | Read Allowed | Preview | View Allowed | Request | No | No |

---

## 4. Keamanan & Kebijakan Data
1. **Tidak Ada Secret di Frontend**: Kunci privat Firebase Admin SDK tidak diperbolehkan ada di aplikasi browser.
2. **Minimalisasi QR Payload**: QR Code **hanya** menyimpan URL unik (`https://domain/item/INV-YYYY-XXXXXX`), bukan data mentah barang.
3. **Pemberlakuan Aturan Keamanan Database**: Authorization ditegakkan pada tingkat server oleh **Firestore Security Rules** dan **Storage Security Rules**.
