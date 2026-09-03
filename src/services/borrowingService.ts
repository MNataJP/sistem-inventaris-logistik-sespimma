import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  runTransaction
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { BorrowingRecord } from '@/types/borrowing';
import { updateInventoryItem, addHistoryRecord } from './inventoryService';
import { recordAuditLog } from './auditService';
import { removeUndefined } from '@/utils/firestoreHelper';
import { getReturnTimeliness } from '@/utils/borrowingUtils';

const COLLECTION_BORROWINGS = 'borrowings';

/**
 * Process a new borrowing request
 */
export async function createBorrowing(
  itemId: string,
  itemCode: string,
  itemNameSnapshot: string,
  borrowerId: string,
  borrowerNameSnapshot: string,
  borrowerInstitution: string,
  borrowDate: string,
  expectedReturnDate: string,
  purpose: string,
  notes?: string,
  userId?: string,
  userName?: string
): Promise<string> {
  const borrowingRef = doc(collection(db, COLLECTION_BORROWINGS));
  const borrowingId = borrowingRef.id;

  const newBorrowing: BorrowingRecord = {
    id: borrowingId,
    itemId,
    itemCode,
    itemNameSnapshot,
    borrowerId,
    borrowerNameSnapshot,
    borrowerInstitution: borrowerInstitution || '-',
    borrowDate,
    expectedReturnDate,
    status: 'borrowed',
    purpose,
    notes: notes || '',
    createdAt: serverTimestamp(),
    createdBy: userId || borrowerId,
    updatedAt: serverTimestamp(),
    updatedBy: userId || borrowerId,
  };

  const cleanBorrowing = removeUndefined(newBorrowing);

  // Run atomic transaction to update borrowing record and set item status to 'Dipinjam'
  await runTransaction(db, async (transaction) => {
    const itemRef = doc(db, 'items', itemId);
    const itemSnap = await transaction.get(itemRef);
    if (!itemSnap.exists()) {
      throw new Error('Barang tidak ditemukan dalam sistem.');
    }
    const itemData = itemSnap.data();
    if (itemData.status === 'Dipinjam') {
      throw new Error('Barang saat ini sedang dipinjam oleh pengguna lain.');
    }

    transaction.set(borrowingRef, cleanBorrowing);
    transaction.update(itemRef, {
      status: 'Dipinjam',
      updatedAt: serverTimestamp(),
    });
  });

  // Record item history & audit log
  await addHistoryRecord(itemId, {
    action: 'BORROW_ITEM',
    description: `Barang dipinjam oleh ${borrowerNameSnapshot} (${borrowerInstitution || '-'}) sampai ${expectedReturnDate}`,
    newData: cleanBorrowing,
    userId: userId || borrowerId,
    userName: userName || borrowerNameSnapshot,
  });

  if (userId && userName) {
    await recordAuditLog({
      userId,
      userName,
      action: 'BORROW',
      module: 'PEMINJAMAN',
      targetType: 'BORROWING',
      targetId: borrowingId,
      description: `Memproses peminjaman barang (${itemNameSnapshot})`,
      after: cleanBorrowing,
    });
  }

  return borrowingId;
}

/**
 * Process item return
 */
export async function returnBorrowing(
  borrowingId: string,
  actualReturnDate: string,
  conditionNotes?: string,
  userId?: string,
  userName?: string
): Promise<void> {
  const borrowingRef = doc(db, COLLECTION_BORROWINGS, borrowingId);
  let itemId = '';
  let itemName = '';
  let borrowerName = '';
  let timelinessLabel = '';

  await runTransaction(db, async (transaction) => {
    const borrowingSnap = await transaction.get(borrowingRef);
    if (!borrowingSnap.exists()) {
      throw new Error('Data peminjaman tidak ditemukan.');
    }
    const borrowingData = borrowingSnap.data() as BorrowingRecord;
    itemId = borrowingData.itemId;
    itemName = borrowingData.itemNameSnapshot || 'Barang Logistik';
    borrowerName = borrowingData.borrowerNameSnapshot || 'Peminjam';

    const timeliness = getReturnTimeliness(borrowingData.expectedReturnDate, actualReturnDate, 'returned');
    timelinessLabel = timeliness.label;

    const updatePayload = removeUndefined({
      status: 'returned',
      actualReturnDate,
      notes: conditionNotes ? `Pengembalian: ${conditionNotes}` : (borrowingData.notes || ''),
      updatedAt: serverTimestamp(),
      updatedBy: userId || 'system',
    });

    transaction.update(borrowingRef, updatePayload);

    const itemRef = doc(db, 'items', borrowingData.itemId);
    transaction.update(itemRef, {
      status: 'Tersedia',
      updatedAt: serverTimestamp(),
    });
  });

  if (itemId) {
    await addHistoryRecord(itemId, {
      action: 'RETURN_ITEM',
      description: `Pengembalian barang oleh ${borrowerName}. Status: ${timelinessLabel}.${conditionNotes ? ` Catatan: ${conditionNotes}` : ''}`,
      userId: userId || 'system',
      userName: userName || 'Petugas',
    });
  }

  if (userId && userName) {
    await recordAuditLog({
      userId,
      userName,
      action: 'RETURN',
      module: 'PEMINJAMAN',
      targetType: 'BORROWING',
      targetId: borrowingId,
      description: `Memproses pengembalian barang (${itemName}) - ${timelinessLabel}`,
    });
  }
}

/**
 * Get all borrowings
 */
export async function getAllBorrowings(): Promise<BorrowingRecord[]> {
  const q = query(collection(db, COLLECTION_BORROWINGS), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BorrowingRecord));
}
