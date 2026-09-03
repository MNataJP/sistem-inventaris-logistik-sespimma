import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  runTransaction
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { InventoryItem, InventoryHistoryRecord } from '@/types/inventory';
import { recordAuditLog } from './auditService';
import { removeUndefined } from '@/utils/firestoreHelper';

const COLLECTION_ITEMS = 'items';

/**
 * Generate a unique inventory code formatted as INV-YYYY-XXXXXX
 * (e.g. INV-2026-000001)
 */
export async function generateUniqueInventoryCode(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = `INV-${currentYear}-`;

  try {
    const snapshot = await getDocs(collection(db, COLLECTION_ITEMS));
    let nextNumber = 1;

    snapshot.docs.forEach(doc => {
      const itemData = doc.data();
      const code = itemData.inventoryCode as string;
      if (code && typeof code === 'string' && code.startsWith(prefix)) {
        const parts = code.split('-');
        if (parts.length === 3) {
          const parsedNum = parseInt(parts[2], 10);
          if (!isNaN(parsedNum) && parsedNum >= nextNumber) {
            nextNumber = parsedNum + 1;
          }
        }
      }
    });

    const formattedNum = String(nextNumber).padStart(6, '0');
    return `${prefix}${formattedNum}`;
  } catch (err) {
    console.error('Error generating inventory code:', err);
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    return `${prefix}${randomSuffix}`;
  }
}

/**
 * Upload item photo to Firebase Storage
 */
export async function uploadItemPhoto(itemId: string, file: File): Promise<string> {
  const storageRef = ref(storage, `items/${itemId}/${Date.now()}_${file.name}`);
  const snapshot = await uploadBytes(storageRef, file);
  return await getDownloadURL(snapshot.ref);
}

/**
 * Create a new inventory item
 */
export async function createInventoryItem(
  itemData: Omit<InventoryItem, 'id' | 'inventoryCode' | 'qrUrl' | 'createdAt' | 'updatedAt'>,
  photoFile?: File,
  userId?: string,
  userName?: string
): Promise<string> {
  const itemDocRef = doc(collection(db, COLLECTION_ITEMS));
  const itemId = itemDocRef.id;

  const inventoryCode = await generateUniqueInventoryCode();

  // QR Code permanent URL target
  const baseUrl = window.location.origin;
  const qrUrl = `${baseUrl}/item/${inventoryCode}`;

  let imageUrl = itemData.imageUrl || '';
  if (photoFile) {
    imageUrl = await uploadItemPhoto(itemId, photoFile);
  }

  const newItem: InventoryItem = {
    ...itemData,
    id: itemId,
    inventoryCode,
    imageUrl,
    qrUrl,
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: userId || '',
    updatedBy: userId || '',
  };

  await setDoc(itemDocRef, newItem);

  // Add initial history record
  await addHistoryRecord(itemId, {
    action: 'CREATE_ITEM',
    description: `Barang diajukan ke dalam sistem dengan Kode ${inventoryCode}`,
    newData: newItem,
    userId: userId || 'system',
    userName: userName || 'Admin',
  });

  // Record Audit Log
  if (userId && userName) {
    await recordAuditLog({
      userId,
      userName,
      action: 'CREATE',
      module: 'BARANG',
      targetType: 'ITEM',
      targetId: itemId,
      description: `Menambahkan barang baru (${itemData.name}) - Kode: ${inventoryCode}`,
      after: newItem,
    });
  }

  return itemId;
}

/**
 * Get item by ID
 */
export async function getItemById(itemId: string): Promise<InventoryItem | null> {
  try {
    const docRef = doc(db, COLLECTION_ITEMS, itemId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as InventoryItem;
    }
    // Fallback: search by inventoryCode if itemId was an inventory code
    const snapshot = await getDocs(collection(db, COLLECTION_ITEMS));
    for (const d of snapshot.docs) {
      if (d.data().inventoryCode === itemId) {
        return { id: d.id, ...d.data() } as InventoryItem;
      }
    }
  } catch (err) {
    console.error('Error fetching item by id:', err);
  }
  return null;
}

/**
 * Get item by Inventory Code (for QR Scan deep-link)
 */
export async function getItemByInventoryCode(inventoryCode: string): Promise<InventoryItem | null> {
  try {
    // 1. Coba langsung fetch berdasarkan document ID jika sama
    const directDoc = await getDoc(doc(db, COLLECTION_ITEMS, inventoryCode));
    if (directDoc.exists()) {
      return { id: directDoc.id, ...directDoc.data() } as InventoryItem;
    }

    // 2. Scan seluruh dokumen items untuk menemukan inventoryCode yang cocok
    const snapshot = await getDocs(collection(db, COLLECTION_ITEMS));
    for (const d of snapshot.docs) {
      const data = d.data();
      if (data.inventoryCode === inventoryCode || d.id === inventoryCode) {
        return { id: d.id, ...data } as InventoryItem;
      }
    }
  } catch (err) {
    console.error('Error fetching item by inventoryCode:', err);
  }
  return null;
}

/**
 * Fetch all active items
 */
export async function getInventoryItems(): Promise<InventoryItem[]> {
  try {
    const snapshot = await getDocs(collection(db, COLLECTION_ITEMS));
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as InventoryItem))
      .filter(item => item.isActive !== false)
      .sort((a, b) => {
        const timeA = a.createdAt?.seconds || (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const timeB = b.createdAt?.seconds || (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return timeB - timeA;
      });
  } catch (err) {
    console.error('Error fetching inventory items from database:', err);
    return [];
  }
}

/**
 * Update inventory item
 */
export async function updateInventoryItem(
  itemId: string,
  updates: Partial<InventoryItem>,
  photoFile?: File,
  userId?: string,
  userName?: string
): Promise<void> {
  const itemRef = doc(db, COLLECTION_ITEMS, itemId);
  const oldDocSnap = await getDoc(itemRef);
  const oldData = oldDocSnap.exists() ? oldDocSnap.data() : {};

  let imageUrl = updates.imageUrl;
  if (photoFile) {
    imageUrl = await uploadItemPhoto(itemId, photoFile);
  }

  const payload: Partial<InventoryItem> = {
    ...updates,
    ...(imageUrl ? { imageUrl } : {}),
    updatedAt: serverTimestamp(),
    updatedBy: userId || 'system',
  };

  await updateDoc(itemRef, payload);

  // Add history record
  await addHistoryRecord(itemId, {
    action: 'UPDATE_ITEM',
    description: `Pembaruan data barang oleh ${userName || 'User'}`,
    oldData,
    newData: payload,
    userId: userId || 'system',
    userName: userName || 'Admin',
  });

  if (userId && userName) {
    await recordAuditLog({
      userId,
      userName,
      action: 'UPDATE',
      module: 'BARANG',
      targetType: 'ITEM',
      targetId: itemId,
      description: `Memperbarui data barang (${updates.name || oldData.name})`,
      before: oldData,
      after: payload,
    });
  }
}

/**
 * Add history record to sub-collection items/{itemId}/history
 */
export async function addHistoryRecord(itemId: string, record: Omit<InventoryHistoryRecord, 'id' | 'timestamp'>) {
  try {
    const historyRef = doc(collection(db, `items/${itemId}/history`));
    const cleanRecord = removeUndefined(record);
    await setDoc(historyRef, {
      ...cleanRecord,
      id: historyRef.id,
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    console.error('Failed to add history record:', err);
  }
}

/**
 * Get history list for an item
 */
export async function getItemHistory(itemId: string): Promise<InventoryHistoryRecord[]> {
  const q = query(
    collection(db, `items/${itemId}/history`),
    orderBy('timestamp', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryHistoryRecord));
}
