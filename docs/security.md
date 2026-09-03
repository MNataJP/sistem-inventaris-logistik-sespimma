# Dokumentasi Keamanan & Permission Rules — Sistem Inventaris Logistik Sespimma Polri

## 1. Prinsip Keamanan Utama
1. **Zero Public Access to Full Data**: Pengguna anonim/unauthenticated tidak dapat membaca detail spesifikasi barang, nomor seri, atau harga perolehan.
2. **Server-Side Rule Enforcement**: Validasi role dan otorisasi sepenuhnya dievaluasi di Firestore & Storage Security Rules. Frontend UI hanya bertindak sebagai antarmuka presentation.
3. **Immutability Protection**: Audit log, scan log, dan riwayat histori bersifat append-only. Pengguna tidak diperbolehkan menghapus atau mengedit audit log.
4. **Prevent Privilege Escalation**: Pengguna biasa maupun admin operasional tidak diperbolehkan mengubah field `role` pada profil pengguna lain maupun dirinya sendiri.

---

## 2. Definisi Firestore Security Rules (`firestore.rules`)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper Functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function getUserData() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
    }
    
    function isUserActive() {
      return isAuthenticated() && getUserData().isActive == true;
    }
    
    function hasRole(role) {
      return isUserActive() && getUserData().role == role;
    }
    
    function isSuperAdmin() {
      return hasRole('super_admin');
    }
    
    function isAdmin() {
      return hasRole('admin') || isSuperAdmin();
    }
    
    function isPetugas() {
      return hasRole('petugas') || isAdmin();
    }

    // Users Collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isSuperAdmin() || (isAuthenticated() && request.auth.uid == userId);
      allow update: if isSuperAdmin() || (
        isAuthenticated() && request.auth.uid == userId 
        && !request.resource.data.diff(resource.data).affectedKeys().hasAny(['role', 'isActive'])
      );
      allow delete: if isSuperAdmin();
    }

    // Items Collection & Subcollections
    match /items/{itemId} {
      allow read: if isAuthenticated();
      allow create, update: if isAdmin();
      allow delete: if isSuperAdmin();

      match /maintenance/{maintenanceId} {
        allow read: if isAuthenticated();
        allow create, update: if isPetugas();
        allow delete: if isSuperAdmin();
      }

      match /history/{historyId} {
        allow read: if isAuthenticated();
        allow create: if isPetugas();
        allow update, delete: if false; // Immutable history
      }
    }

    // Master Data (Categories & Locations)
    match /categories/{categoryId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }
    
    match /locations/{locationId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }

    // Borrowings Collection
    match /borrowings/{borrowingId} {
      allow read: if isAuthenticated();
      allow create: if isUserActive();
      allow update: if isPetugas();
      allow delete: if isSuperAdmin();
    }

    // Audit Logs Collection (Append Only)
    match /auditLogs/{logId} {
      allow read: if isAdmin();
      allow create: if isAuthenticated();
      allow update, delete: if false;
    }

    // Scan Logs Collection (Append Only)
    match /scanLogs/{scanId} {
      allow read: if isAdmin();
      allow create: if isAuthenticated();
      allow update, delete: if false;
    }
  }
}
```

---

## 3. Definisi Firebase Storage Rules (`storage.rules`)

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isValidImage() {
      return request.resource.contentType.matches('image/(jpeg|png|webp)')
        && request.resource.size < 5 * 1024 * 1024; // Max 5MB
    }

    match /items/{itemId}/{allPaths=**} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && isValidImage();
    }
    
    match /users/{userId}/{allPaths=**} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && request.auth.uid == userId && isValidImage();
    }
  }
}
```
