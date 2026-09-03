import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';

/**
 * Programmatically seed initial master data into Cloud Firestore:
 * 1. Authenticate / Create Admin User in Firebase Auth first (to satisfy Firestore Security Rules)
 * 2. Write Master Categories (categories)
 * 3. Write Master Locations (locations)
 * 4. Write Sample Inventory Items with unique QR codes (items)
 */
export async function seedInitialFirestoreData(): Promise<{ success: boolean; message: string }> {
  try {
    const adminEmail = 'admin@polri.go.id';
    const adminPass = 'Password123!';
    let userUid = '';

    // Step 1: Authenticate with Firebase Auth first so request.auth is not null
    try {
      const cred = await createUserWithEmailAndPassword(auth, adminEmail, adminPass);
      userUid = cred.user.uid;
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        const cred = await signInWithEmailAndPassword(auth, adminEmail, adminPass);
        userUid = cred.user.uid;
      } else {
        throw new Error(`Gagal otentikasi Firebase Auth (${err.code}): ${err.message}. Pastikan Email/Password sudah di-Enable di Firebase Console -> Authentication -> Sign-in method.`);
      }
    }

    // Step 2: Seed Admin User Profile in Firestore
    await setDoc(doc(db, 'users', userUid), {
      uid: userUid,
      name: 'Super Admin Sespimma',
      email: adminEmail,
      role: 'super_admin',
      unit: 'Sespimma Lemdiklat Polri',
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    });

    // Step 3: Seed Master Categories
    const categoriesData = [
      { id: 'cat_elektronik', name: 'Elektronik & TI', description: 'Laptop, Komputer Desktop, Monitor, Printer, Scanner, Projector', isActive: true },
      { id: 'cat_komunikasi', name: 'Alat Komunikasi', description: 'Radio HT, Rig, Repeater, Telepon Satelit', isActive: true },
      { id: 'cat_kendaraan', name: 'Kendaraan Dinas', description: 'Mobil Patroli, Motor Pengawalan, Bus Operasional', isActive: true },
      { id: 'cat_senjata', name: 'Senjata & Amunisi', description: 'Senjata Api Dinas, Rompi Anti Peluru, Amunisi', isActive: true },
      { id: 'cat_kantor', name: 'Peralatan & Mebel Kantor', description: 'Meja Kerja, Kursi Putar, Lemari Besi, Brankas', isActive: true },
    ];

    for (const cat of categoriesData) {
      await setDoc(doc(db, 'categories', cat.id), {
        ...cat,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    // Step 4: Seed Master Locations
    const locationsData = [
      { id: 'loc_gedung_utama', building: 'Gedung Utama Sespimma', floor: '1', room: 'Ruang Logistik & Sarpras', detail: 'Meja Admin 01', isActive: true },
      { id: 'loc_gadik_1', building: 'Gedung Gadik A', floor: '2', room: 'Ruang Laboratorium TI', detail: 'Rak Komputer 03', isActive: true },
      { id: 'loc_gudang_senjata', building: 'Gedung Sarpras', floor: '1', room: 'Gudang Senjata & Amunisi', detail: 'Brankas Senjata A', isActive: true },
      { id: 'loc_garasi', building: 'Garasi Utama', floor: '1', room: 'Area Parkir Kendaraan Dinas', detail: 'Slot 01 - 05', isActive: true },
    ];

    for (const loc of locationsData) {
      await setDoc(doc(db, 'locations', loc.id), {
        ...loc,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    // Step 5: Seed Sample Inventory Items with permanent QR Codes
    const baseUrl = window.location.origin;

    const sampleItems = [
      {
        id: 'item_sample_001',
        inventoryCode: 'INV-2026-000001',
        name: 'Laptop Dell Latitude 5420',
        categoryId: 'cat_elektronik',
        categoryNameSnapshot: 'Elektronik & TI',
        brand: 'Dell',
        model: 'Latitude 5420 i7 16GB',
        serialNumber: 'SN-DELL-889911',
        description: 'Laptop dinas pimpinan untuk kegiatan operasional logistik',
        purchaseDate: '2026-01-15',
        purchasePrice: 18500000,
        fundingSource: 'APBN 2026',
        vendor: 'PT. Teknologi Nusantara',
        documentNumber: 'BAST/2026/LOG/001',
        condition: 'Baik',
        status: 'Tersedia',
        building: 'Gedung Utama Sespimma',
        floor: '1',
        room: 'Ruang Logistik & Sarpras',
        locationDetail: 'Meja Admin 01',
        responsiblePersonNameSnapshot: 'AKBP Budi Santoso',
        qrUrl: `${baseUrl}/item/INV-2026-000001`,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      {
        id: 'item_sample_002',
        inventoryCode: 'INV-2026-000002',
        name: 'Radio HT Motorola APX 1000',
        categoryId: 'cat_komunikasi',
        categoryNameSnapshot: 'Alat Komunikasi',
        brand: 'Motorola',
        model: 'APX 1000 VHF',
        serialNumber: 'SN-MOT-773322',
        description: 'Radio komando komunikasi standar Sespimma Polri',
        purchaseDate: '2026-02-01',
        purchasePrice: 6500000,
        fundingSource: 'APBN 2026',
        vendor: 'PT. Komunikasi Prima',
        documentNumber: 'BAST/2026/LOG/002',
        condition: 'Baik',
        status: 'Tersedia',
        building: 'Gedung Sarpras',
        floor: '1',
        room: 'Gudang Logistik',
        locationDetail: 'Lemari HT 02',
        responsiblePersonNameSnapshot: 'Kompol Agus Wijaya',
        qrUrl: `${baseUrl}/item/INV-2026-000002`,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      {
        id: 'item_sample_003',
        inventoryCode: 'INV-2026-000003',
        name: 'Projector Epson EB-FH52',
        categoryId: 'cat_elektronik',
        categoryNameSnapshot: 'Elektronik & TI',
        brand: 'Epson',
        model: 'EB-FH52 Full HD',
        serialNumber: 'SN-EPS-441100',
        description: 'Proyektor ruang rapat dan kelas instruktur Sespimma',
        purchaseDate: '2026-02-10',
        purchasePrice: 12000000,
        fundingSource: 'APBN 2026',
        vendor: 'PT. Visual Utama',
        documentNumber: 'BAST/2026/LOG/003',
        condition: 'Baik',
        status: 'Tersedia',
        building: 'Gedung Gadik A',
        floor: '2',
        room: 'Ruang Kelas A',
        locationDetail: 'Plafon Kelas A',
        responsiblePersonNameSnapshot: 'AKBP Budi Santoso',
        qrUrl: `${baseUrl}/item/INV-2026-000003`,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }
    ];

    for (const item of sampleItems) {
      await setDoc(doc(db, 'items', item.id), item);
    }

    // Step 6: Seed Audit Log Record
    await setDoc(doc(db, 'auditLogs', 'log_init_001'), {
      id: 'log_init_001',
      userId: userUid,
      userName: 'Super Admin Sespimma',
      action: 'SYSTEM_INIT',
      module: 'DATABASE',
      targetType: 'FIRESTORE',
      targetId: 'all_collections',
      description: 'Inisialisasi awal database Firestore & Master Data Logistik Sespimma Polri',
      timestamp: serverTimestamp(),
    });

    return {
      success: true,
      message: `🎉 Berhasil! Akun ${adminEmail} (pass: ${adminPass}) & seluruh tabel Firestore telah siap digunakan!`
    };
  } catch (err: any) {
    console.error('Error seeding Firestore data:', err);
    return {
      success: false,
      message: err.message || 'Gagal menginisialisasi database Firestore.'
    };
  }
}
