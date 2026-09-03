import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { MaintenanceRecord } from '@/types/maintenance';
import { updateInventoryItem, addHistoryRecord } from './inventoryService';
import { recordAuditLog } from './auditService';
import { removeUndefined } from '@/utils/firestoreHelper';

/**
 * Upload maintenance document/photo attachment
 */
export async function uploadMaintenanceAttachment(itemId: string, maintenanceId: string, file: File): Promise<string> {
  const storageRef = ref(storage, `items/${itemId}/maintenance/${maintenanceId}/${Date.now()}_${file.name}`);
  const snapshot = await uploadBytes(storageRef, file);
  return await getDownloadURL(snapshot.ref);
}

/**
 * Add a new maintenance record
 */
export async function createMaintenanceRecord(
  itemId: string,
  record: Omit<MaintenanceRecord, 'id' | 'itemId' | 'createdAt' | 'updatedAt'>,
  attachmentFiles?: File[],
  userId?: string,
  userName?: string
): Promise<string> {
  const maintenanceDocRef = doc(collection(db, `items/${itemId}/maintenance`));
  const maintenanceId = maintenanceDocRef.id;

  const uploadedUrls: string[] = [];
  if (attachmentFiles && attachmentFiles.length > 0) {
    for (const file of attachmentFiles) {
      const url = await uploadMaintenanceAttachment(itemId, maintenanceId, file);
      uploadedUrls.push(url);
    }
  }

  const newRecord: MaintenanceRecord = {
    ...record,
    id: maintenanceId,
    itemId,
    notes: record.notes || '',
    technicianId: record.technicianId || '',
    nextMaintenanceDate: record.nextMaintenanceDate || '',
    attachments: uploadedUrls,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: userId || 'system',
    updatedBy: userId || 'system',
  };

  const cleanRecord = removeUndefined(newRecord);

  await setDoc(maintenanceDocRef, cleanRecord);

  // If maintenance result is in progress or repair, update item status
  if (record.type === 'Repair' || record.type === 'Corrective') {
    await updateInventoryItem(itemId, { status: 'Dalam Maintenance' }, undefined, userId, userName);
  }

  // Record item history
  await addHistoryRecord(itemId, {
    action: 'ADD_MAINTENANCE',
    description: `Pencatatan pemeliharaan (${record.type}): ${record.complaint}`,
    newData: newRecord,
    userId: userId || 'system',
    userName: userName || 'Petugas',
  });

  // Audit log
  if (userId && userName) {
    await recordAuditLog({
      userId,
      userName,
      action: 'CREATE',
      module: 'MAINTENANCE',
      targetType: 'MAINTENANCE_RECORD',
      targetId: maintenanceId,
      description: `Menambahkan pemeliharaan barang (${record.type})`,
      after: newRecord,
    });
  }

  return maintenanceId;
}

/**
 * Get maintenance history for an item
 */
export async function getMaintenanceHistory(itemId: string): Promise<MaintenanceRecord[]> {
  const q = query(
    collection(db, `items/${itemId}/maintenance`),
    orderBy('date', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MaintenanceRecord));
}
