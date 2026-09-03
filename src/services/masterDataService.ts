import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Category, Location } from '@/types/inventory';

const COLLECTION_CATEGORIES = 'categories';
const COLLECTION_LOCATIONS = 'locations';

// ==================== CATEGORIES CRUD ====================

/**
 * Mengambil seluruh daftar kategori barang dari Firestore database
 */
export async function getCategories(): Promise<Category[]> {
  try {
    const snapshot = await getDocs(collection(db, COLLECTION_CATEGORIES));
    const list = snapshot.docs
      .map(d => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name || 'Tanpa Nama',
          description: data.description || '',
          isActive: data.isActive !== undefined ? data.isActive : true,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        } as Category;
      })
      .filter(c => c.isActive !== false)
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    return list;
  } catch (err) {
    console.error('Error fetching categories from database:', err);
    return [];
  }
}

/**
 * Membuat kategori barang baru
 */
export async function createCategory(name: string, description: string): Promise<string> {
  const ref = doc(collection(db, COLLECTION_CATEGORIES));
  await setDoc(ref, {
    id: ref.id,
    name,
    description,
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

/**
 * Memperbarui data kategori barang
 */
export async function updateCategory(id: string, name: string, description: string): Promise<void> {
  const ref = doc(db, COLLECTION_CATEGORIES, id);
  await updateDoc(ref, {
    name,
    description,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Menghapus kategori barang
 */
export async function deleteCategory(id: string): Promise<void> {
  const ref = doc(db, COLLECTION_CATEGORIES, id);
  await deleteDoc(ref);
}

// ==================== LOCATIONS CRUD ====================

/**
 * Mengambil seluruh daftar lokasi & gedung dari Firestore database
 */
export async function getLocations(): Promise<Location[]> {
  try {
    const snapshot = await getDocs(collection(db, COLLECTION_LOCATIONS));
    const list = snapshot.docs
      .map(d => {
        const data = d.data();
        return {
          id: d.id,
          building: data.building || 'Gedung Utama',
          floor: String(data.floor || '1'),
          room: data.room || 'Ruangan',
          detail: data.detail || '',
          isActive: data.isActive !== undefined ? data.isActive : true,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        } as Location;
      })
      .filter(l => l.isActive !== false)
      .sort((a, b) => (a.building || '').localeCompare(b.building || ''));

    return list;
  } catch (err) {
    console.error('Error fetching locations from database:', err);
    return [];
  }
}

/**
 * Membuat lokasi / gedung baru
 */
export async function createLocation(building: string, floor: string, room: string, detail: string): Promise<string> {
  const ref = doc(collection(db, COLLECTION_LOCATIONS));
  await setDoc(ref, {
    id: ref.id,
    building,
    floor: String(floor),
    room,
    detail,
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

/**
 * Memperbarui data lokasi
 */
export async function updateLocation(id: string, building: string, floor: string, room: string, detail: string): Promise<void> {
  const ref = doc(db, COLLECTION_LOCATIONS, id);
  await updateDoc(ref, {
    building,
    floor: String(floor),
    room,
    detail,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Menghapus lokasi
 */
export async function deleteLocation(id: string): Promise<void> {
  const ref = doc(db, COLLECTION_LOCATIONS, id);
  await deleteDoc(ref);
}
