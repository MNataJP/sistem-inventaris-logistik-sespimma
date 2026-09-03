import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyABXZnGM15wLwfEX62UwBEurxFZMaWqu6E",
  authDomain: "sistem-logistik-sespimma-polri.firebaseapp.com",
  projectId: "sistem-logistik-sespimma-polri",
  storageBucket: "sistem-logistik-sespimma-polri.firebasestorage.app",
  messagingSenderId: "687634657567",
  appId: "1:687634657567:web:acc2e923d389208bbfc02a",
  measurementId: "G-QCWFCS846G"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function main() {
  const adminEmail = 'admin@polri.go.id';
  const adminPass = 'Password123!';

  console.log(`Menguji pembuatan akun admin (${adminEmail})...`);

  let userUid = '';
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPass);
    userUid = userCredential.user.uid;
    console.log(`✅ Akun Auth ${adminEmail} berhasil dibuat! UID: ${userUid}`);
  } catch (err) {
    if (err.code === 'auth/email-already-in-use') {
      console.log(`ℹ️ Akun ${adminEmail} sudah terdaftar di Firebase Auth. Mencoba login...`);
      const userCredential = await signInWithEmailAndPassword(auth, adminEmail, adminPass);
      userUid = userCredential.user.uid;
      console.log(`✅ Login berhasil. UID: ${userUid}`);
    } else {
      console.error(`❌ Gagal di Firebase Auth: ${err.message}`);
      console.error(`Penyebab: Pastikan "Email/Password" disiapkan di Firebase Console -> Authentication -> Sign-in method.`);
      process.exit(1);
    }
  }

  console.log(`\nMenginisialisasi tabel & dokumen pada Cloud Firestore...`);

  try {
    // User profile
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
    console.log(`✅ Profil user super_admin disimpan di Firestore users/${userUid}`);

    // Seed Master Categories
    const categoriesData = [
      { id: 'cat_elektronik', name: 'Elektronik & TI', description: 'Laptop, Komputer Desktop, Monitor, Printer, Scanner, Projector', isActive: true },
      { id: 'cat_komunikasi', name: 'Alat Komunikasi', description: 'Radio HT, Rig, Repeater, Telepon Satelit', isActive: true },
      { id: 'cat_kendaraan', name: 'Kendaraan Dinas', description: 'Mobil Patroli, Motor Pengawalan, Bus Operasional', isActive: true },
      { id: 'cat_senjata', name: 'Senjata & Amunisi', description: 'Senjata Api Dinas, Rompi Anti Peluru, Amunisi', isActive: true },
      { id: 'cat_kantor', name: 'Peralatan & Mebel Kantor', description: 'Meja Kerja, Kursi Putar, Lemari Besi, Brankas', isActive: true },
    ];

    for (const cat of categoriesData) {
      await setDoc(doc(db, 'categories', cat.id), { ...cat, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    }
    console.log(`✅ Master Kategori berhasil dibuat di Firestore.`);

    // Seed Master Locations
    const locationsData = [
      { id: 'loc_gedung_utama', building: 'Gedung Utama Sespimma', floor: '1', room: 'Ruang Logistik & Sarpras', detail: 'Meja Admin 01', isActive: true },
      { id: 'loc_gadik_1', building: 'Gedung Gadik A', floor: '2', room: 'Ruang Laboratorium TI', detail: 'Rak Komputer 03', isActive: true },
      { id: 'loc_gudang_senjata', building: 'Gedung Sarpras', floor: '1', room: 'Gudang Senjata & Amunisi', detail: 'Brankas Senjata A', isActive: true },
      { id: 'loc_garasi', building: 'Garasi Utama', floor: '1', room: 'Area Parkir Kendaraan Dinas', detail: 'Slot 01 - 05', isActive: true },
    ];

    for (const loc of locationsData) {
      await setDoc(doc(db, 'locations', loc.id), { ...loc, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    }
    console.log(`✅ Master Lokasi berhasil dibuat di Firestore.`);

    // Seed Sample Items with QR Codes
    const baseUrl = 'http://localhost:5173';
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
      }
    ];

    for (const item of sampleItems) {
      await setDoc(doc(db, 'items', item.id), item);
    }
    console.log(`✅ Contoh Barang & QR Code berhasil dibuat di Firestore.`);

    console.log(`\n🎉 SUKSES! Seluruh data & Akun Admin berhasil diinisialisasi di Firebase!`);
  } catch (err) {
    console.error(`❌ Gagal di Firestore: ${err.message}`);
    console.error(`Penyebab: Pastikan "Firestore Database" sudah diaktifkan di Firebase Console -> Firestore Database -> Create Database.`);
  }
}

main();
