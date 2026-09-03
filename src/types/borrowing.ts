export type BorrowingStatus = 'requested' | 'borrowed' | 'returned' | 'overdue' | 'cancelled';

export interface BorrowingRecord {
  id: string;
  itemId: string;
  itemCode: string;
  itemNameSnapshot: string;
  borrowerId: string;
  borrowerNameSnapshot: string;
  borrowerInstitution?: string; // Instansi / Unit Kerja Peminjam
  borrowDate: string; // YYYY-MM-DD
  expectedReturnDate: string; // YYYY-MM-DD
  actualReturnDate?: string; // YYYY-MM-DD
  status: BorrowingStatus;
  purpose: string;
  notes?: string;
  createdAt?: any;
  createdBy?: string;
  updatedAt?: any;
  updatedBy?: string;
}
