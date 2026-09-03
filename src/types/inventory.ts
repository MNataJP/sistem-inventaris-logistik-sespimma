export type ItemCondition = 'Baik' | 'Rusak Ringan' | 'Rusak Berat';
export type ItemStatus = 'Tersedia' | 'Dipinjam' | 'Dalam Maintenance' | 'Dinonaktifkan';

export interface Category {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export interface Location {
  id: string;
  building: string;
  floor: string;
  room: string;
  detail: string;
  isActive: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export interface InventoryItem {
  id: string;
  inventoryCode: string; // e.g. INV-2026-000001
  name: string;
  categoryId: string;
  categoryNameSnapshot: string;
  brand: string;
  model: string;
  serialNumber: string;
  description: string;
  purchaseDate: string; // YYYY-MM-DD
  purchasePrice: number;
  fundingSource: string;
  vendor: string;
  documentNumber: string;
  condition: ItemCondition;
  status: ItemStatus;
  building: string;
  floor: string;
  room: string;
  locationDetail: string;
  responsiblePersonId?: string;
  responsiblePersonNameSnapshot?: string;
  imageUrl?: string;
  qrUrl: string;
  isActive: boolean;
  createdAt?: any;
  createdBy?: string;
  updatedAt?: any;
  updatedBy?: string;
}

export interface InventoryHistoryRecord {
  id?: string;
  action: string;
  description: string;
  oldData?: Record<string, any>;
  newData?: Record<string, any>;
  userId: string;
  userName: string;
  timestamp?: any;
}
