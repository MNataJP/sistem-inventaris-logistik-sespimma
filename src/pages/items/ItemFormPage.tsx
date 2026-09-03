import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { createInventoryItem, getItemById, updateInventoryItem } from '@/services/inventoryService';
import { getCategories, getLocations } from '@/services/masterDataService';
import { Category, Location, ItemCondition, ItemStatus } from '@/types/inventory';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';

export const ItemFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [description, setDescription] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [fundingSource, setFundingSource] = useState('APBN 2026');
  const [vendor, setVendor] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [condition, setCondition] = useState<ItemCondition>('Baik');
  const [status, setStatus] = useState<ItemStatus>('Tersedia');
  const [building, setBuilding] = useState('');
  const [floor, setFloor] = useState('1');
  const [room, setRoom] = useState('');
  const [locationDetail, setLocationDetail] = useState('');
  const [responsiblePersonName, setResponsiblePersonName] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [cats, locs] = await Promise.all([getCategories(), getLocations()]);
        setCategories(cats);
        setLocations(locs);

        if (cats.length > 0 && !categoryId) {
          setCategoryId(cats[0].id);
        }

        if (isEdit && id) {
          const item = await getItemById(id);
          if (item) {
            setName(item.name);
            setCategoryId(item.categoryId);
            setBrand(item.brand);
            setModel(item.model);
            setSerialNumber(item.serialNumber);
            setDescription(item.description);
            setPurchaseDate(item.purchaseDate);
            setPurchasePrice(item.purchasePrice);
            setFundingSource(item.fundingSource);
            setVendor(item.vendor);
            setDocumentNumber(item.documentNumber);
            setCondition(item.condition);
            setStatus(item.status);
            setBuilding(item.building);
            setFloor(item.floor);
            setRoom(item.room);
            setLocationDetail(item.locationDetail);
            setResponsiblePersonName(item.responsiblePersonNameSnapshot || '');
            setExistingImageUrl(item.imageUrl || '');
          }
        }
      } catch (err) {
        console.error('Error fetching form master data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !categoryId) {
      setError('Nama barang dan Kategori wajib diisi.');
      return;
    }

    setError(null);
    setSaving(true);

    try {
      const selectedCat = categories.find(c => c.id === categoryId);
      const categoryNameSnapshot = selectedCat ? selectedCat.name : '';

      const payload = {
        name,
        categoryId,
        categoryNameSnapshot,
        brand,
        model,
        serialNumber,
        description,
        purchaseDate,
        purchasePrice: Number(purchasePrice),
        fundingSource,
        vendor,
        documentNumber,
        condition,
        status,
        building,
        floor,
        room,
        locationDetail,
        responsiblePersonNameSnapshot: responsiblePersonName,
        imageUrl: existingImageUrl,
        isActive: true,
      };

      if (isEdit && id) {
        await updateInventoryItem(id, payload, photoFile || undefined, user?.uid, user?.name);
        navigate(`/items`);
      } else {
        await createInventoryItem(payload as any, photoFile || undefined, user?.uid, user?.name);
        navigate('/items');
      }
    } catch (err: any) {
      console.error('Error saving item:', err);
      setError(err.message || 'Gagal menyimpan data barang.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <Link to="/items" className="btn btn-secondary btn-sm">
          <ArrowLeft size={16} />
          <span>Kembali</span>
        </Link>
        <h1 style={{ color: '#0f172a', margin: 0 }}>
          {isEdit ? 'Edit Data Barang' : 'Tambah Barang Baru'}
        </h1>
      </div>

      {error && (
        <div className="card" style={{ backgroundColor: '#fee2e2', color: '#b91c1c', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: '#64748b' }}>Memuat formulir...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {/* Section 1: Data Utama */}
          <div className="card" style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', color: '#1e3a8a' }}>
              1. Identitas & Spesifikasi Barang
            </h3>

            <div className="form-group">
              <label className="form-label">Nama Barang *</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="Contoh: Laptop Dell Latitude 5420"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.875rem' }}>
              <div className="form-group">
                <label className="form-label">Kategori *</label>
                <select required className="form-select" value={categoryId} onChange={e => setCategoryId(e.target.value)}>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Merk / Brand</label>
                <input type="text" className="form-input" placeholder="Dell, Samsung, Yamaha, dll" value={brand} onChange={e => setBrand(e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Tipe / Model</label>
                <input type="text" className="form-input" placeholder="Latitude 5420" value={model} onChange={e => setModel(e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Nomor Seri Pabrik (S/N)</label>
                <input type="text" className="form-input" placeholder="SN123456789" value={serialNumber} onChange={e => setSerialNumber(e.target.value)} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Penanggung Jawab / Pengguna Aset</label>
              <input type="text" className="form-input" placeholder="Nama Petugas / Pamen / Bintara" value={responsiblePersonName} onChange={e => setResponsiblePersonName(e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">Deskripsi & Spesifikasi Detail</label>
              <textarea className="form-textarea" rows={3} placeholder="Penjelasan rincian spesifikasi teknis barang..." value={description} onChange={e => setDescription(e.target.value)} />
            </div>
          </div>

          {/* Section 2: Kondisi, Status & Lokasi */}
          <div className="card" style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', color: '#1e3a8a' }}>
              2. Kondisi, Status & Penempatan Lokasi
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.875rem' }}>
              <div className="form-group">
                <label className="form-label">Kondisi Barang</label>
                <select className="form-select" value={condition} onChange={e => setCondition(e.target.value as ItemCondition)}>
                  <option value="Baik">Baik</option>
                  <option value="Rusak Ringan">Rusak Ringan</option>
                  <option value="Rusak Berat">Rusak Berat</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Status Barang</label>
                <select className="form-select" value={status} onChange={e => setStatus(e.target.value as ItemStatus)}>
                  <option value="Tersedia">Tersedia</option>
                  <option value="Dipinjam">Dipinjam</option>
                  <option value="Dalam Maintenance">Dalam Maintenance</option>
                  <option value="Dinonaktifkan">Dinonaktifkan</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Gedung / Bangunan</label>
                <input type="text" className="form-input" placeholder="Gedung Utama / Gadik" value={building} onChange={e => setBuilding(e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Lantai</label>
                <input type="text" className="form-input" placeholder="Lantai 1 / 2" value={floor} onChange={e => setFloor(e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Ruangan</label>
                <input type="text" className="form-input" placeholder="Ruang Kelas A / R. Simulasi" value={room} onChange={e => setRoom(e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Detail Posisi Lokasi</label>
                <input type="text" className="form-input" placeholder="Meja 02 / Rak A3" value={locationDetail} onChange={e => setLocationDetail(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Section 3: Informasi Pengadaan & Legalitas */}
          <div className="card" style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', color: '#1e3a8a' }}>
              3. Pengadaan & Legalitas
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.875rem' }}>
              <div className="form-group">
                <label className="form-label">Tanggal Perolehan</label>
                <input type="date" className="form-input" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Harga Perolehan (IDR)</label>
                <input type="number" className="form-input" placeholder="0" value={purchasePrice} onChange={e => setPurchasePrice(Number(e.target.value))} />
              </div>

              <div className="form-group">
                <label className="form-label">Sumber Dana</label>
                <input type="text" className="form-input" placeholder="APBN 2026 / Hibah" value={fundingSource} onChange={e => setFundingSource(e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Vendor / Penyedia</label>
                <input type="text" className="form-input" placeholder="PT. Logistik Utama" value={vendor} onChange={e => setVendor(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Section 4: Photo Upload */}
          <div className="card" style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', color: '#1e3a8a' }}>
              4. Foto Fisik Barang
            </h3>

            <div className="form-group">
              <label className="form-label">Pilih Foto (JPG / PNG, Max 5MB)</label>
              <input
                type="file"
                accept="image/*"
                className="form-input"
                onChange={e => {
                  if (e.target.files && e.target.files[0]) {
                    setPhotoFile(e.target.files[0]);
                  }
                }}
              />
            </div>

            {(photoFile || existingImageUrl) && (
              <div style={{ marginTop: '0.75rem', textAlign: 'center' }}>
                <img
                  src={photoFile ? URL.createObjectURL(photoFile) : existingImageUrl}
                  alt="Preview Barang"
                  style={{ maxHeight: '180px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginBottom: '2rem' }}>
            <Link to="/items" className="btn btn-secondary" style={{ flex: '1 0 100px' }}>
              Batal
            </Link>
            <button type="submit" disabled={saving} className="btn btn-primary" style={{ flex: '2 0 160px', padding: '0.75rem 1.5rem' }}>
              <Save size={18} />
              <span>{saving ? 'Menyimpan...' : 'Simpan Data Barang'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
