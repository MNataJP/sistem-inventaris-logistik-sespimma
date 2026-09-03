/**
 * Script Utilitas: Sinkronisasi & Pembersihan Pengguna Firebase Authentication
 * 
 * Script ini membandingkan data akun di Firebase Authentication dengan koleksi 'users' di Firestore.
 * Akun yang ada di Firebase Authentication tetapi dokumennya sudah dihapus dari Firestore
 * akan dihapus secara otomatis dari Firebase Authentication.
 * 
 * Cara menjalankan:
 *   node scripts/syncAuthUsers.js
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Inisialisasi Firebase Admin
// Jika dijalankan di Google Cloud / Firebase CLI terotentikasi, credentials otomatis terdeteksi
initializeApp();

const auth = getAuth();
const db = getFirestore();

async function syncAndCleanupAuthUsers() {
  console.log('🔍 Memulai pemindaian akun Firebase Authentication & Firestore Database...');

  try {
    // 1. Ambil semua UID yang aktif di Firestore database
    const firestoreUsersSnapshot = await db.collection('users').get();
    const activeUids = new Set();
    firestoreUsersSnapshot.forEach(doc => {
      activeUids.add(doc.id);
    });

    console.log(`📊 Ditemukan ${activeUids.size} akun valid di Firestore Database.`);

    // 2. Ambil semua akun di Firebase Authentication
    let listUsersResult = await auth.listUsers(1000);
    let deletedCount = 0;

    for (const userRecord of listUsersResult.users) {
      const uid = userRecord.uid;
      const email = userRecord.email;

      // Jangan hapus akun super admin utama sistem
      if (email === 'admin@polri.go.id') {
        continue;
      }

      // Jika UID tidak ada di Firestore database, hapus dari Firebase Auth
      if (!activeUids.has(uid)) {
        console.log(`🗑️ Menghapus akun yatim (${email} - UID: ${uid}) dari Firebase Authentication...`);
        try {
          await auth.deleteUser(uid);
          deletedCount++;
          console.log(`✅ Sukses menghapus ${email} dari Firebase Authentication.`);
        } catch (err) {
          console.error(`❌ Gagal menghapus ${email}:`, err.message);
        }
      }
    }

    console.log(`\n🎉 Pembersihan selesai! Total ${deletedCount} akun yatim berhasil dihapus dari Firebase Authentication.`);
  } catch (error) {
    console.error('❌ Terjadi kesalahan saat sinkronisasi:', error);
  }
}

syncAndCleanupAuthUsers();
