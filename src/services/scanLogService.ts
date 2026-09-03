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
import { ScanLog } from '@/types/audit';

const COLLECTION_SCAN_LOGS = 'scanLogs';

export async function recordScanLog(
  itemId: string,
  inventoryCode: string,
  userId: string,
  userName: string
) {
  try {
    const docRef = doc(collection(db, COLLECTION_SCAN_LOGS));
    const userAgent = navigator.userAgent;
    const isMobile = /Mobile|Android|iP(hone|od|ad)/i.test(userAgent);
    const deviceType = isMobile ? 'Mobile Smartphone' : 'Desktop Browser';

    await setDoc(docRef, {
      id: docRef.id,
      itemId,
      inventoryCode,
      userId,
      userName,
      userAgent,
      deviceType,
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    console.error('Failed to record scan log:', err);
  }
}

export async function getScanLogs(maxCount = 200): Promise<ScanLog[]> {
  const q = query(
    collection(db, COLLECTION_SCAN_LOGS),
    orderBy('timestamp', 'desc'),
    limit(maxCount)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScanLog));
}

/**
 * Delete a single scan log from Firestore
 */
export async function deleteScanLog(logId: string): Promise<void> {
  const docRef = doc(db, COLLECTION_SCAN_LOGS, logId);
  await deleteDoc(docRef);
}

/**
 * Delete multiple scan logs from Firestore
 */
export async function deleteMultipleScanLogs(logIds: string[]): Promise<void> {
  if (!logIds || logIds.length === 0) return;

  const batchSize = 400;
  for (let i = 0; i < logIds.length; i += batchSize) {
    const batch = writeBatch(db);
    const chunk = logIds.slice(i, i + batchSize);
    chunk.forEach(id => {
      const docRef = doc(db, COLLECTION_SCAN_LOGS, id);
      batch.delete(docRef);
    });
    await batch.commit();
  }
}

/**
 * Clear all scan logs from Firestore
 */
export async function clearAllScanLogs(): Promise<void> {
  const snapshot = await getDocs(collection(db, COLLECTION_SCAN_LOGS));
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

