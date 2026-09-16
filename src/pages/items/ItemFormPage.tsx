import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { createInventoryItem, getItemById, updateInventoryItem } from '@/services/inventoryService';
import { getCategories, getLocations } from '@/services/masterDataService';
import { Category, Location, ItemCondition, ItemStatus } from '@/types/inventory';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, Save, AlertCircle, Upload, X, Image as ImageIcon, MapPin } from 'lucide-react';

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
  const [purchasePrice, setPurchasePrice] = useState<string>('');
  const [fundingSource, setFundingSource] = useState('');
  const [vendor, setVendor] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [condition, setCondition] = useState<ItemCondition>('Baik');
  const [status, setStatus] = useState<ItemStatus>('Tersedia');
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [building, setBuilding] = useState('');
  const [floor, setFloor] = useState('');
  const [room, setRoom] = useState('');
  const [locationDetail, setLocationDetail] = useState('');
  const [isManualBuilding, setIsManualBuilding] = useState(false);
  const [isManualRoom, setIsManualRoom] = useState(false);
  const [responsiblePersonName, setResponsiblePersonName] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [existingImageUrl, setExistingImageUrl] = useState('');

  const uniqueBuildings = Array.from(new Set(locations.map(l => l.building).filter(Boolean)));
  const availableRooms = building
    ? Array.from(new Set(locations.filter(l => l.building.toLowerCase() === building.toLowerCase()).map(l => l.room).filter(Boolean)))
    : [];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [cats, locs] = await Promise.all([getCategories(), getLocations()]);
        setCategories(cats);
        setLocations(locs);

        if (isEdit && id) {
          const item = await getItemById(id);
          if (item) {
            setName(item.name || '');
            setCategoryId(item.categoryId || '');
            setBrand(item.brand || '');
            setModel(item.model || '');
            setSerialNumber(item.serialNumber || '');
            setDescription(item.description || '');
            setPurchaseDate(item.purchaseDate || '');
            setPurchasePrice(
              item.purchasePrice ? new Intl.NumberFormat('id-ID').format(item.purchasePrice) : ''
            );
            setFundingSource(item.fundingSource || '');
            setVendor(item.vendor || '');
            setDocumentNumber(item.documentNumber || '');
            setCondition(item.condition || 'Baik');
            setStatus(item.status || 'Tersedia');
            setBuilding(item.building || '');
            setFloor(item.floor || '');
            setRoom(item.room || '');
            setLocationDetail(item.locationDetail || '');
            setResponsiblePersonName(item.responsiblePersonNameSnapshot || '');
            setExistingImageUrl(item.imageUrl || '');

            // Match master location if exists
            if (item.building && item.room) {
              const matchedLoc = locs.find(
                l => l.building.toLowerCase() === (item.building || '').toLowerCase() &&
                     l.room.toLowerCase() === (item.room || '').toLowerCase()
              );
              if (matchedLoc) {
                setSelectedLocationId(matchedLoc.id);
              }
            }
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

  // Handler when user selects Master Location from quick dropdown
  const handleMasterLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const locId = e.target.value;
    setSelectedLocationId(locId);
    if (!locId) return;

    const loc = locations.find(l => l.id === locId);
    if (loc) {
      setBuilding(loc.building);
      setFloor(loc.floor || '');
      setRoom(loc.room || '');
      setLocationDetail(loc.detail || '');
      setIsManualBuilding(false);
      setIsManualRoom(false);
    }
  };

  // Handler when user selects Building from dropdown
  const handleBuildingSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === '__manual__') {
      setIsManualBuilding(true);
      setBuilding('');
      setRoom('');
      setSelectedLocationId('');
    } else {
      setIsManualBuilding(false);
      setBuilding(val);
      const matchingRooms = locations.filter(l => l.building === val);
      if (matchingRooms.length === 1) {
        setRoom(matchingRooms[0].room);
        setFloor(matchingRooms[0].floor || '');
        setLocationDetail(matchingRooms[0].detail || '');
        setSelectedLocationId(matchingRooms[0].id);
      } else {
        setRoom('');
        setSelectedLocationId('');
      }
    }
  };

  // Handler when user selects Room from dropdown
  const handleRoomSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === '__manual__') {
      setIsManualRoom(true);
      setRoom('');
      setSelectedLocationId('');
    } else {
      setIsManualRoom(false);
      setRoom(val);
      const match = locations.find(l => l.building === building && l.room === val);
      if (match) {
        if (match.floor) setFloor(match.floor);
        if (match.detail) setLocationDetail(match.detail);
        setSelectedLocationId(match.id);
      }
    }
  };

  // Handle formatted numeric price input (only digits, formatted with thousand separators)
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    if (!rawVal) {
      setPurchasePrice('');
      return;
    }
    const num = Number(rawVal);
    const formatted = new Intl.NumberFormat('id-ID').format(num);
    setPurchasePrice(formatted);
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview('');
    setExistingImageUrl('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !categoryId) {
      setError('Nama barang dan Kategori wajib diisi.');
      return;
    }

    setError(null);
    setSaving(true);

    try {
      const selectedCat = categories.find(c => c.id === categoryId);
      const categoryNameSnapshot = selectedCat ? selectedCat.name : '';

      // Parse numeric price without formatting dots
      const cleanNumericPrice = purchasePrice ? Number(purchasePrice.replace(/\D/g, '')) : 0;

      const payload = {
        name: name.trim(),
        categoryId,
        categoryNameSnapshot,
        brand: brand.trim(),
        model: model.trim(),
        serialNumber: serialNumber.trim(),
        description: description.trim(),
        purchaseDate,
        purchasePrice: cleanNumericPrice,
        fundingSource: fundingSource.trim(),
        vendor: vendor.trim(),
        documentNumber: documentNumber.trim(),
        condition,
        status,
        building: building.trim(),
        floor: floor.trim(),
        room: room.trim(),
        locationDetail: locationDetail.trim(),
        responsiblePersonNameSnapshot: responsiblePersonName.trim(),
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
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
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
                placeholder="Masukkan nama barang..."
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.875rem' }}>
              <div className="form-group">
                <label className="form-label">Kategori *</label>
                <select required className="form-select" value={categoryId} onChange={e => setCategoryId(e.target.value)}>
                  <option value="">-- Pilih Kategori --</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Merk / Brand</label>
                <input type="text" className="form-input" placeholder="Masukkan merk / brand barang..." value={brand} onChange={e => setBrand(e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Tipe / Model</label>
                <input type="text" className="form-input" placeholder="Masukkan tipe / model barang..." value={model} onChange={e => setModel(e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Nomor Seri Pabrik (S/N)</label>
                <input type="text" className="form-input" placeholder="Masukkan nomor seri pabrik (S/N)..." value={serialNumber} onChange={e => setSerialNumber(e.target.value)} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Penanggung Jawab / Pengguna Aset</label>
              <input type="text" className="form-input" placeholder="Masukkan nama penanggung jawab / pengguna aset..." value={responsiblePersonName} onChange={e => setResponsiblePersonName(e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">Deskripsi & Spesifikasi Detail</label>
              <textarea
                className="form-textarea"
                rows={4}
                placeholder="Masukkan deskripsi & spesifikasi detail barang...\nCatatan: Tekan ENTER untuk membuat poin baru."
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
              <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem', display: 'block' }}>
                💡 <strong>Petunjuk:</strong> Tekan ENTER untuk memisahkan setiap poin spesifikasi. Sistem akan otomatis menampilkannya sebagai daftar poin (bullet points) yang rapi di halaman detail barang.
              </span>
            </div>
          </div>

          {/* Section 2: Kondisi, Status & Lokasi */}
          <div className="card" style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', color: '#1e3a8a' }}>
              2. Kondisi, Status & Penempatan Lokasi
            </h3>

            {/* Pilihan Cepat: Master Lokasi & Gedung */}
            {locations.length > 0 && (
              <div
                style={{
                  backgroundColor: '#f0f9ff',
                  padding: '0.875rem 1rem',
                  borderRadius: '10px',
                  border: '1px solid #bae6fd',
                  marginBottom: '1.25rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0369a1', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <MapPin size={16} color="#0284c7" />
                    <span>Pilih dari Master Lokasi & Gedung:</span>
                  </label>
                  <Link to="/locations" target="_blank" style={{ fontSize: '0.75rem', color: '#0284c7', textDecoration: 'underline' }}>
                    + Kelola Master Lokasi
                  </Link>
                </div>
                <select
                  className="form-select"
                  value={selectedLocationId}
                  onChange={handleMasterLocationChange}
                  style={{ backgroundColor: '#ffffff', borderColor: '#7dd3fc', fontSize: '0.9rem', fontWeight: 500 }}
                >
                  <option value="">-- Pilih dari Daftar Master Lokasi & Gedung --</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>
                      {loc.building} • {loc.room} (Lantai {loc.floor}){loc.detail ? ` - ${loc.detail}` : ''}
                    </option>
                  ))}
                </select>
                <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.35rem', display: 'block' }}>
                  Memilih lokasi dari master data akan otomatis mengisi form Gedung, Lantai, Ruangan, dan Detail tanpa perlu mengetik manual.
                </span>
              </div>
            )}

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

              {/* Gedung / Bangunan */}
              <div className="form-group">
                <label className="form-label">Gedung / Bangunan</label>
                {uniqueBuildings.length > 0 && !isManualBuilding ? (
                  <div>
                    <select
                      className="form-select"
                      value={uniqueBuildings.includes(building) ? building : ''}
                      onChange={handleBuildingSelect}
                    >
                      <option value="">-- Pilih Gedung --</option>
                      {uniqueBuildings.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                      <option value="__manual__">+ Ketik Nama Gedung Manual...</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Masukkan nama gedung / bangunan..."
                      value={building}
                      onChange={e => setBuilding(e.target.value)}
                    />
                    {uniqueBuildings.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setIsManualBuilding(false)}
                        style={{ background: 'none', border: 'none', color: '#1e3a8a', fontSize: '0.75rem', cursor: 'pointer', padding: '0.2rem 0', textDecoration: 'underline' }}
                      >
                        Pilih dari dropdown master gedung
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Ruangan */}
              <div className="form-group">
                <label className="form-label">Ruangan</label>
                {availableRooms.length > 0 && !isManualRoom ? (
                  <div>
                    <select
                      className="form-select"
                      value={availableRooms.includes(room) ? room : ''}
                      onChange={handleRoomSelect}
                    >
                      <option value="">-- Pilih Ruangan --</option>
                      {availableRooms.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                      <option value="__manual__">+ Ketik Nama Ruangan Manual...</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Masukkan nama ruangan..."
                      value={room}
                      onChange={e => setRoom(e.target.value)}
                    />
                    {availableRooms.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setIsManualRoom(false)}
                        style={{ background: 'none', border: 'none', color: '#1e3a8a', fontSize: '0.75rem', cursor: 'pointer', padding: '0.2rem 0', textDecoration: 'underline' }}
                      >
                        Pilih dari dropdown master ruangan
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Lantai */}
              <div className="form-group">
                <label className="form-label">Lantai</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Masukkan lantai..."
                  value={floor}
                  onChange={e => setFloor(e.target.value)}
                />
              </div>

              {/* Detail Posisi Lokasi */}
              <div className="form-group">
                <label className="form-label">Detail Posisi Lokasi</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Masukkan detail posisi lokasi..."
                  value={locationDetail}
                  onChange={e => setLocationDetail(e.target.value)}
                />
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
                <div style={{ position: 'relative' }}>
                  <span
                    style={{
                      position: 'absolute',
                      left: '0.85rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#64748b',
                      fontWeight: 600,
                      fontSize: '0.875rem'
                    }}
                  >
                    Rp
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    className="form-input"
                    style={{ paddingLeft: '2.5rem' }}
                    placeholder="Masukkan harga perolehan barang (ketik angka saja)..."
                    value={purchasePrice}
                    onChange={handlePriceChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Sumber Dana</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Masukkan sumber dana pengadaan..."
                  value={fundingSource}
                  onChange={e => setFundingSource(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Vendor / Penyedia</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Masukkan nama vendor / penyedia..."
                  value={vendor}
                  onChange={e => setVendor(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Section 4: Photo Upload with Preview & Instant Compression */}
          <div className="card" style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', color: '#1e3a8a' }}>
              4. Foto Fisik Barang
            </h3>

            <div className="form-group">
              <label className="form-label">Pilih Foto Fisik Barang (Kamera HP / Galeri)</label>
              <input
                type="file"
                accept="image/*"
                className="form-input"
                onChange={handlePhotoSelect}
              />
              <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                Foto akan otomatis dikompresi & dioptimasi agar proses unggah cepat dan hemat kuota.
              </span>
            </div>

            {(photoPreview || existingImageUrl) && (
              <div
                style={{
                  marginTop: '0.875rem',
                  padding: '1rem',
                  backgroundColor: '#f8fafc',
                  borderRadius: '10px',
                  border: '1px dashed #cbd5e1',
                  textAlign: 'center',
                  position: 'relative',
                  display: 'inline-block'
                }}
              >
                <img
                  src={photoPreview || existingImageUrl}
                  alt="Preview Barang"
                  style={{ maxHeight: '200px', maxWidth: '100%', objectFit: 'contain', borderRadius: '8px' }}
                />
                <div style={{ marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="btn btn-secondary btn-sm"
                    style={{ color: '#b91c1c', borderColor: '#fca5a5', padding: '0.25rem 0.625rem', fontSize: '0.75rem' }}
                  >
                    <X size={14} />
                    <span>Hapus / Ganti Foto</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginBottom: '2rem' }}>
            <Link to="/items" className="btn btn-secondary" style={{ flex: '1 0 100px' }}>
              Batal
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary"
              style={{ flex: '2 0 180px', padding: '0.75rem 1.5rem', fontWeight: 600 }}
            >
              <Save size={18} />
              <span>{saving ? 'Menyimpan & Mengunggah Foto...' : 'Simpan Data Barang'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
