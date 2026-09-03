import React, { useEffect, useState } from 'react';
import { getLocations, createLocation, updateLocation, deleteLocation } from '@/services/masterDataService';
import { Location } from '@/types/inventory';
import { useAuth } from '@/context/AuthContext';
import {
  MapPin,
  Plus,
  X,
  Search,
  Edit,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Building
} from 'lucide-react';

export const LocationListPage: React.FC = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  const isAdmin = user?.role === 'super_admin' || user?.role === 'admin';

  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [building, setBuilding] = useState('');
  const [floor, setFloor] = useState('1');
  const [room, setRoom] = useState('');
  const [detail, setDetail] = useState('');
  const [saving, setSaving] = useState(false);

  const [locationToDelete, setLocationToDelete] = useState<Location | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Alert Feedback
  const [alertInfo, setAlertInfo] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlertInfo({ type, message });
    setTimeout(() => setAlertInfo(null), 5000);
  };

  const fetchLocs = async () => {
    setLoading(true);
    try {
      const data = await getLocations();
      setLocations(data);
    } catch (err: any) {
      console.error('Error fetching locations:', err);
      showAlert('error', 'Gagal memuat lokasi: ' + (err.message || 'Kesalahan jaringan'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocs();
  }, []);

  const openAddModal = () => {
    setEditingLocation(null);
    setBuilding('');
    setFloor('1');
    setRoom('');
    setDetail('');
    setShowModal(true);
  };

  const openEditModal = (loc: Location) => {
    setEditingLocation(loc);
    setBuilding(loc.building);
    setFloor(String(loc.floor));
    setRoom(loc.room);
    setDetail(loc.detail || '');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingLocation) {
        await updateLocation(editingLocation.id, building, floor, room, detail);
        showAlert('success', `Lokasi "${building} - ${room}" berhasil diperbarui.`);
      } else {
        await createLocation(building, floor, room, detail);
        showAlert('success', `Lokasi baru "${building} - ${room}" berhasil ditambahkan.`);
      }
      setShowModal(false);
      setBuilding('');
      setRoom('');
      setDetail('');
      await fetchLocs();
    } catch (err: any) {
      showAlert('error', 'Gagal menyimpan lokasi: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!locationToDelete) return;
    setDeleting(true);
    try {
      await deleteLocation(locationToDelete.id);
      showAlert('success', `Lokasi "${locationToDelete.building} - ${locationToDelete.room}" berhasil dihapus.`);
      setLocationToDelete(null);
      await fetchLocs();
    } catch (err: any) {
      showAlert('error', 'Gagal menghapus lokasi: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  const filteredLocations = locations.filter(l =>
    (l.building || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (l.room || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (l.detail || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(l.floor).includes(searchTerm)
  );

  return (
    <div>
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', color: '#0f172a', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MapPin size={24} color="#1e3a8a" />
            <span>Master Lokasi & Gedung</span>
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
            Pemetaan gedung, lantai, dan ruangan penempatan inventaris di lingkungan Sespimma Polri.
          </p>
        </div>

        {isAdmin && (
          <button onClick={openAddModal} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={16} />
            <span>Tambah Lokasi</span>
          </button>
        )}
      </div>

      {/* Alert Banner */}
      {alertInfo && (
        <div
          style={{
            padding: '0.875rem 1.25rem',
            borderRadius: '10px',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: alertInfo.type === 'success' ? '#dcfce7' : '#fee2e2',
            border: `1px solid ${alertInfo.type === 'success' ? '#86efac' : '#fca5a5'}`,
            color: alertInfo.type === 'success' ? '#15803d' : '#b91c1c',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            animation: 'fadeIn 200ms ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            {alertInfo.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{alertInfo.message}</span>
          </div>
          <button
            onClick={() => setAlertInfo(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="card" style={{ padding: '0.875rem 1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative', maxWidth: '400px' }}>
          <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.4rem' }}
            placeholder="Cari gedung, ruangan, lantai..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Content Table / Cards */}
      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <div style={{ width: '38px', height: '38px', border: '3px solid #e2e8f0', borderTopColor: '#1e3a8a', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
          <p style={{ color: '#64748b' }}>Memuat data lokasi...</p>
        </div>
      ) : filteredLocations.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <Building size={44} color="#cbd5e1" style={{ margin: '0 auto 0.75rem' }} />
          <h3 style={{ color: '#475569', marginBottom: '0.375rem' }}>Tidak Ada Lokasi Ditemukan</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
            {searchTerm ? 'Tidak ada lokasi yang cocok dengan kata kunci pencarian.' : 'Belum ada data gedung / ruangan yang terdaftar.'}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="table-container desktop-table-view">
            <table className="table">
              <thead>
                <tr>
                  <th>Gedung / Bangunan</th>
                  <th>Lantai</th>
                  <th>Nama Ruangan</th>
                  <th>Keterangan / Detail</th>
                  {isAdmin && <th style={{ textAlign: 'right', minWidth: '140px' }}>Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {filteredLocations.map(l => (
                  <tr key={l.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Building size={16} color="#1e3a8a" />
                        <span>{l.building}</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-info" style={{ backgroundColor: '#f1f5f9', color: '#334155' }}>
                        Lantai {l.floor}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: '#1e3a8a' }}>{l.room}</strong>
                    </td>
                    <td>
                      <div style={{ color: '#475569', fontSize: '0.875rem' }}>{l.detail || '-'}</div>
                    </td>
                    {isAdmin && (
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => openEditModal(l)}
                            className="btn btn-sm btn-secondary"
                            style={{ padding: '0.3rem 0.6rem' }}
                            title="Edit Lokasi"
                          >
                            <Edit size={14} />
                            <span>Edit</span>
                          </button>
                          {isSuperAdmin && (
                            <button
                              onClick={() => setLocationToDelete(l)}
                              className="btn btn-sm btn-danger"
                              style={{ padding: '0.3rem 0.6rem' }}
                              title="Hapus Lokasi"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Grid View */}
          <div className="mobile-card-grid">
            {filteredLocations.map(l => (
              <div key={l.id} className="item-mobile-card">
                <div className="item-mobile-card-header">
                  <div>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem' }}>{l.building}</div>
                    <div style={{ fontSize: '0.85rem', color: '#1e3a8a', fontWeight: 600 }}>{l.room}</div>
                  </div>
                  <span className="badge badge-info" style={{ backgroundColor: '#f1f5f9', color: '#334155' }}>
                    Lt. {l.floor}
                  </span>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                  {l.detail || 'Tidak ada keterangan detail.'}
                </p>
                {isAdmin && (
                  <div className="item-mobile-card-actions">
                    <button
                      onClick={() => openEditModal(l)}
                      className="btn btn-sm btn-secondary"
                    >
                      <Edit size={14} />
                      <span>Edit</span>
                    </button>
                    {isSuperAdmin && (
                      <button
                        onClick={() => setLocationToDelete(l)}
                        className="btn btn-sm btn-danger"
                      >
                        <Trash2 size={14} />
                        <span>Hapus</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modal Tambah / Edit Lokasi */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', color: '#0f172a' }}>
                {editingLocation ? 'Edit Lokasi & Gedung' : 'Tambah Lokasi Baru'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Nama Gedung / Bangunan *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="Gedung Utama, Gedung Gadik A, Garasi..."
                  value={building}
                  onChange={e => setBuilding(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Lantai *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="1, 2, 3..."
                    value={floor}
                    onChange={e => setFloor(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Nama Ruangan *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="Ruang Logistik & Sarpras..."
                    value={room}
                    onChange={e => setRoom(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Keterangan / Detail Penempatan</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  placeholder="Contoh: Meja Admin 01, Rak Komputer 03, Slot Parkir..."
                  value={detail}
                  onChange={e => setDetail(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Lokasi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Lokasi */}
      {locationToDelete && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: '#fee2e2',
                  color: '#b91c1c',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem'
                }}
              >
                <Trash2 size={24} />
              </div>
              <h3 style={{ fontSize: '1.2rem', color: '#0f172a', marginBottom: '0.5rem' }}>Hapus Lokasi?</h3>
              <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
                Apakah Anda yakin ingin menghapus lokasi <strong>{locationToDelete.building} - {locationToDelete.room}</strong>?
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setLocationToDelete(null)}
                disabled={deleting}
                className="btn btn-secondary"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="btn btn-danger"
              >
                {deleting ? 'Menghapus...' : 'Ya, Hapus Lokasi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
