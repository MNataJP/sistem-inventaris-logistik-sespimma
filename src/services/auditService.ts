import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
  query,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AuditLog } from '@/types/audit';
import { removeUndefined } from '@/utils/firestoreHelper';

const COLLECTION_AUDIT = 'auditLogs';

export async function recordAuditLog(logData: Omit<AuditLog, 'id' | 'timestamp'>) {
  try {
    const docRef = doc(collection(db, COLLECTION_AUDIT));
    const cleanData = removeUndefined(logData);
    await setDoc(docRef, {
      ...cleanData,
      id: docRef.id,
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    console.error('Failed to record audit log:', err);
  }
}

export async function getAuditLogs(maxCount = 200): Promise<AuditLog[]> {
  const q = query(
    collection(db, COLLECTION_AUDIT),
    orderBy('timestamp', 'desc'),
    limit(maxCount)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLog));
}

/**
 * Delete a single audit log from Firestore
 */
export async function deleteAuditLog(logId: string): Promise<void> {
  const docRef = doc(db, COLLECTION_AUDIT, logId);
  await deleteDoc(docRef);
}

/**
 * Delete multiple audit logs from Firestore
 */
export async function deleteMultipleAuditLogs(logIds: string[]): Promise<void> {
  if (!logIds || logIds.length === 0) return;

  const batchSize = 400;
  for (let i = 0; i < logIds.length; i += batchSize) {
    const batch = writeBatch(db);
    const chunk = logIds.slice(i, i + batchSize);
    chunk.forEach(id => {
      const docRef = doc(db, COLLECTION_AUDIT, id);
      batch.delete(docRef);
    });
    await batch.commit();
  }
}

/**
 * Clear all audit logs from Firestore
 */
export async function clearAllAuditLogs(): Promise<void> {
  const snapshot = await getDocs(collection(db, COLLECTION_AUDIT));
  const docs = snapshot.docs;
  if (docs.length === 0) return;

  const batchSize = 400;
  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = writeBatch(db);
    const chunk = docs.slice(i, i + batchSize);
    chunk.forEach(d => {
      batch.delete(d.ref);
    });
    await batch.commit();
  }
}

