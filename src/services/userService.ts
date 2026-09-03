import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  query,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserProfile, UserRole } from '@/types/auth';
import { recordAuditLog } from '@/services/auditService';
import { sendApprovalEmail, sendRejectionEmail, EmailNotificationResult } from '@/services/emailService';

const COLLECTION_USERS = 'users';

/**
 * Mengambil seluruh daftar pengguna dari Firestore
 */
export async function getAllUsers(): Promise<UserProfile[]> {
  const q = query(collection(db, COLLECTION_USERS), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docSnap => ({
    uid: docSnap.id,
    ...docSnap.data()
  } as UserProfile));
}

/**
 * Menyetujui pendaftaran pengguna (Approve)
 * 1. Mengubah status menjadi 'approved' dan isActive menjadi true
 * 2. Mengirimkan email notifikasi persetujuan ke pengguna
 * 3. Merekam ke jejak audit trail
 */
export async function approveUserRegistration(
  targetUser: UserProfile,
  actor: { uid: string; name: string }
): Promise<EmailNotificationResult> {
  const userRef = doc(db, COLLECTION_USERS, targetUser.uid);
  
  await updateDoc(userRef, {
    status: 'approved',
    isActive: true,
    approvedAt: serverTimestamp(),
    approvedBy: actor.name,
    updatedAt: serverTimestamp()
  });

  await recordAuditLog({
    userId: actor.uid,
    userName: actor.name,
    action: 'APPROVE',
    module: 'MANAJEMEN_USER',
    targetType: 'USER',
    targetId: targetUser.uid,
    description: `Menyetujui pendaftaran akun pengguna: ${targetUser.name} (${targetUser.email})`
  });

  // Kirim email notifikasi
  const emailResult = await sendApprovalEmail(targetUser, actor.name);
  return emailResult;
}

/**
 * Menolak pendaftaran pengguna (Reject)
 * 1. Mengubah status menjadi 'rejected' dan isActive menjadi false
 * 2. Mengisi alasan penolakan
 * 3. Mengirimkan email notifikasi penolakan ke pengguna
 * 4. Merekam ke jejak audit trail
 */
export async function rejectUserRegistration(
  targetUser: UserProfile,
  reason: string,
  actor: { uid: string; name: string }
): Promise<EmailNotificationResult> {
  const userRef = doc(db, COLLECTION_USERS, targetUser.uid);

  await updateDoc(userRef, {
    status: 'rejected',
    isActive: false,
    rejectionReason: reason,
    rejectedAt: serverTimestamp(),
    rejectedBy: actor.name,
    updatedAt: serverTimestamp()
  });

  await recordAuditLog({
    userId: actor.uid,
    userName: actor.name,
    action: 'REJECT',
    module: 'MANAJEMEN_USER',
    targetType: 'USER',
    targetId: targetUser.uid,
    description: `Menolak pendaftaran akun pengguna: ${targetUser.name} (${targetUser.email}). Alasan: ${reason}`
  });

  // Kirim email notifikasi penolakan
  const emailResult = await sendRejectionEmail(targetUser, reason, actor.name);
  return emailResult;
}

/**
 * Mengubah peran (role) pengguna
 */
export async function updateUserRole(
  targetUid: string,
  newRole: UserRole,
  actor: { uid: string; name: string }
): Promise<void> {
  const userRef = doc(db, COLLECTION_USERS, targetUid);
  await updateDoc(userRef, {
    role: newRole,
    updatedAt: serverTimestamp()
  });

  await recordAuditLog({
    userId: actor.uid,
    userName: actor.name,
    action: 'UPDATE',
    module: 'MANAJEMEN_USER',
    targetType: 'USER',
    targetId: targetUid,
    description: `Mengubah peran (role) pengguna UID ${targetUid} menjadi ${newRole.toUpperCase()}`
  });
}

/**
 * Mengubah status aktif / non-aktif pengguna
 */
export async function toggleUserActiveStatus(
  targetUid: string,
  currentStatus: boolean,
  targetEmail: string,
  actor: { uid: string; name: string }
): Promise<void> {
  const newStatus = !currentStatus;
  const userRef = doc(db, COLLECTION_USERS, targetUid);
  await updateDoc(userRef, {
    isActive: newStatus,
    status: newStatus ? 'approved' : 'rejected',
    updatedAt: serverTimestamp()
  });

  await recordAuditLog({
    userId: actor.uid,
    userName: actor.name,
    action: 'UPDATE',
    module: 'MANAJEMEN_USER',
    targetType: 'USER',
    targetId: targetUid,
    description: `${newStatus ? 'Mengaktifkan' : 'Menonaktifkan'} akun pengguna (${targetEmail})`
  });
}

/**
 * Menghapus dokumen pengguna secara permanen dari Firestore
 */
export async function deleteUserFromFirestore(
  targetUser: UserProfile,
  actor: { uid: string; name: string }
): Promise<void> {
  const userRef = doc(db, COLLECTION_USERS, targetUser.uid);
  await deleteDoc(userRef);

  await recordAuditLog({
    userId: actor.uid,
    userName: actor.name,
    action: 'DELETE',
    module: 'MANAJEMEN_USER',
    targetType: 'USER',
    targetId: targetUser.uid,
    description: `Menghapus akun pengguna (${targetUser.name} - ${targetUser.email}) secara permanen dari sistem database`,
    before: {
      name: targetUser.name,
      email: targetUser.email,
      role: targetUser.role,
      unit: targetUser.unit,
      isActive: targetUser.isActive,
      status: targetUser.status
    }
  });
}

/**
 * Menambah profil pengguna baru ke Firestore
 */
export async function createUserProfileInFirestore(
  userData: {
    uid?: string;
    name: string;
    nrp?: string;
    email: string;
    role: UserRole;
    unit: string;
    status?: 'pending' | 'approved' | 'rejected';
    isActive?: boolean;
  },
  actor: { uid: string; name: string }
): Promise<string> {
  const docRef = userData.uid ? doc(db, COLLECTION_USERS, userData.uid) : doc(collection(db, COLLECTION_USERS));
  const newUid = docRef.id;

  const newProfile: UserProfile = {
    uid: newUid,
    name: userData.name,
    nrp: userData.nrp || '',
    email: userData.email,
    role: userData.role,
    unit: userData.unit || 'Sespimma Lemdiklat Polri',
    isActive: userData.isActive !== undefined ? userData.isActive : true,
    status: userData.status || 'approved',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(docRef, newProfile);

  await recordAuditLog({
    userId: actor.uid,
    userName: actor.name,
    action: 'CREATE',
    module: 'MANAJEMEN_USER',
    targetType: 'USER',
    targetId: newUid,
    description: `Menambahkan akun pengguna baru: ${userData.name} (${userData.email}) dengan peran ${userData.role.toUpperCase()}`
  });

  return newUid;
}
