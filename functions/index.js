const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

/**
 * Trigger Otomatis: Ketika dokumen pengguna dihapus dari Firestore 'users/{userId}',
 * fungsi ini akan otomatis menghapus akun pengguna dari Firebase Authentication.
 */
exports.onUserDocumentDeleted = functions.firestore
  .document('users/{userId}')
  .onDelete(async (snap, context) => {
    const userId = context.params.userId;
    console.log(`[Auth Cleanup] Mendeteksi penghapusan dokumen users/${userId}. Menghapus dari Firebase Authentication...`);

    try {
      await admin.auth().deleteUser(userId);
      console.log(`[Auth Cleanup] Berhasil: Akun pengguna UID ${userId} telah dihapus dari Firebase Authentication.`);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.log(`[Auth Cleanup] Info: Akun UID ${userId} sudah tidak ditemukan di Firebase Authentication.`);
      } else {
        console.error(`[Auth Cleanup] Gagal menghapus pengguna UID ${userId} dari Firebase Auth:`, error);
      }
    }
  });

/**
 * Callable Function: Hapus akun pengguna langsung dari Admin SDK
 */
exports.deleteUserAccount = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Permintaan harus diautentikasi.');
  }

  const callerUid = context.auth.uid;
  const targetUid = data.uid;

  if (!targetUid) {
    throw new functions.https.HttpsError('invalid-argument', 'UID target harus disediakan.');
  }

  // Cek apakah pemanggil adalah super_admin di Firestore
  const callerDoc = await admin.firestore().collection('users').doc(callerUid).get();
  if (!callerDoc.exists || callerDoc.data().role !== 'super_admin') {
    throw new functions.https.HttpsError('permission-denied', 'Hanya Super Admin yang berwenang menghapus akun.');
  }

  if (callerUid === targetUid) {
    throw new functions.https.HttpsError('invalid-argument', 'Tidak dapat menghapus akun Anda sendiri.');
  }

  // 1. Hapus dokumen di Firestore
  await admin.firestore().collection('users').doc(targetUid).delete();

  // 2. Hapus dari Firebase Auth
  try {
    await admin.auth().deleteUser(targetUid);
  } catch (err) {
    if (err.code !== 'auth/user-not-found') {
      console.error('Error saat menghapus user dari Firebase Auth:', err);
    }
  }

  return { success: true, message: `Pengguna ${targetUid} berhasil dihapus dari Database dan Authentication.` };
});
