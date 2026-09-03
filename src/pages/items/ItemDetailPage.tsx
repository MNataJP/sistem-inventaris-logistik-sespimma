import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getItemByInventoryCode, getItemHistory } from '@/services/inventoryService';
import { getMaintenanceHistory, createMaintenanceRecord } from '@/services/maintenanceService';
import { recordScanLog } from '@/services/scanLogService';
import { createBorrowing } from '@/services/borrowingService';
import { InventoryItem, InventoryHistoryRecord } from '@/types/inventory';
import { MaintenanceRecord, MaintenanceType } from '@/types/maintenance';
import { useAuth } from '@/context/AuthContext';
import {
  ArrowLeft,
  Wrench,
  Repeat,
  History,
  MapPin,
  X,
  Clock,
  Building2,
  User,
  Calendar,
  CheckCircle2,
  FileText
} from 'lucide-react';

export const ItemDetailPage: React.FC = () => {
  const { inventoryCode } = useParams<{ inventoryCode: string }>();
  const { user } = useAuth();

  const [item, setItem] = useState<InventoryItem | null>(null);
  const [historyList, setHistoryList] = useState<InventoryHistoryRecord[]>([]);
  const [maintenanceList, setMaintenanceList] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active Tab for Mobile View (specs | maintenance | history)
  const [activeTab, setActiveTab] = useState<'specs' | 'maintenance' | 'history'>('specs');

  // Modals
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [showBorrowModal, setShowBorrowModal] = useState(false);

  // Maintenance Form state
  const [maintType, setMaintType] = useState<MaintenanceType>('Preventive');
  const [maintComplaint, setMaintComplaint] = useState('');
  const [maintAction, setMaintAction] = useState('');
  const [maintTech, setMaintTech] = useState('');
  const [maintCost, setMaintCost] = useState(0);
  const [maintResult, setMaintResult] = useState('Selesai dengan Baik');
  const [maintNextDate, setMaintNextDate] = useState('');
  const [maintSubmitting, setMaintSubmitting] = useState(false);

  // Borrow Form state
  const [borrowerName, setBorrowerName] = useState(user?.name || '');
  const [borrowerInstitution, setBorrowerInstitution] = useState('');
  const [borrowDate, setBorrowDate] = useState(new Date().toISOString().split('T')[0]);
  const [returnDate, setReturnDate] = useState('');
  const [borrowPurpose, setBorrowPurpose] = useState('');
  const [borrowSubmitting, setBorrowSubmitting] = useState(false);

  const fetchItemData = async () => {
    if (!inventoryCode) return;
    setLoading(true);
    setError(null);
    try {
      const itemData = await getItemByInventoryCode(inventoryCode);
      if (!itemData) {
        setError(`Barang dengan Kode Inventaris "${inventoryCode}" tidak ditemukan.`);
        setLoading(false);
        return;
      }

      setItem(itemData);

      // Record Scan Log automatically if user is authenticated
      if (user) {
        await recordScanLog(itemData.id, itemData.inventoryCode, user.uid, user.name);
      }

      const [hist, maint] = await Promise.all([
        getItemHistory(itemData.id),
        getMaintenanceHistory(itemData.id),
      ]);
      setHistoryList(hist);
      setMaintenanceList(maint);
    } catch (err: any) {
      console.error('Error loading item detail:', err);
      setError(err.message || 'Gagal memuat detail barang.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItemData();
  }, [inventoryCode, user]);

  const handleAddMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;
    setMaintSubmitting(true);
    try {
      await createMaintenanceRecord(
        item.id,
        {
          date: new Date().toISOString().split('T')[0],
          type: maintType,
          complaint: maintComplaint,
          action: maintAction,
          technicianNameSnapshot: maintTech || user?.name || 'Petugas',
          cost: Number(maintCost),
          result: maintResult,
          nextMaintenanceDate: maintNextDate,
        },
        undefined,
        user?.uid,
        user?.name
      );

      setShowMaintenanceModal(false);
      await fetchItemData();
    } catch (err: any) {
      alert('Gagal menambah maintenance: ' + err.message);
    } finally {
      setMaintSubmitting(false);
    }
  };

  const openBorrowModal = () => {
    setBorrowerName(user?.name || '');
    setBorrowDate(new Date().toISOString().split('T')[0]);
    setShowBorrowModal(true);
  };

  const handleCreateBorrowing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item || !user) {
      alert('Silakan login terlebih dahulu untuk mengajukan peminjaman.');
      return;
    }
    if (!borrowerName.trim()) {
      alert('Nama peminjam wajib diisi.');
      return;
    }
    if (!borrowerInstitution.trim()) {
      alert('Instansi peminjam wajib diisi.');
      return;
    }
    if (!returnDate) {
      alert('Estimasi tanggal pengembalian wajib diisi.');
      return;
    }
    setBorrowSubmitting(true);
    try {
      await createBorrowing(
        item.id,
        item.inventoryCode,
        item.name,
        user.uid,
        borrowerName.trim(),
        borrowerInstitution.trim(),
        borrowDate,
        returnDate,
        borrowPurpose.trim(),
        undefined,
        user.uid,
        user.name
      );

      alert(`Pengajuan peminjaman barang "${item.name}" berhasil dicatat.`);
      setShowBorrowModal(false);
      setBorrowPurpose('');
      setReturnDate('');
      await fetchItemData();
    } catch (err: any) {
      alert('Gagal memproses peminjaman: ' + err.message);
    } finally {
      setBorrowSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem', margin: '1rem auto', maxWidth: '600px' }}>
        <div style={{ width: '36px', height: '36px', border: '3px solid #e2e8f0', borderTopColor: '#1e3a8a', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
        <p style={{ color: '#64748b' }}>Memuat informasi barang dari QR Code...</p>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem', margin: '1rem auto', maxWidth: '600px' }}>
        <h2 style={{ color: '#b91c1c', marginBottom: '0.5rem' }}>Barang Tidak Ditemukan</h2>
        <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>{error}</p>
        <Link to="/items" className="btn btn-primary">
          Kembali ke Daftar Barang
        </Link>
      </div>
    );
  }

  const isStaff = user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'petugas';

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Top Header Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link to="/items" className="btn btn-secondary btn-sm">
            <ArrowLeft size={16} />
            <span>Kembali</span>
          </Link>
          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e3a8a', fontFamily: 'monospace' }}>
            {item.inventoryCode}
          </span>
        </div>
      </div>

      {/* Main Grid Layout (Adaptive 2-column desktop / 1-column mobile) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
        
        {/* Left Column: Hero Image, Action Buttons (Pinjam & Maintenance), Core Details */}
        <div>
          <div className="card" style={{ marginBottom: '1.25rem', textAlign: 'center' }}>
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.name}
                style={{ width: '100%', maxHeight: '240px', objectFit: 'cover', borderRadius: '10px', marginBottom: '1rem' }}
              />
            ) : (
              <div style={{ height: '160px', backgroundColor: '#f1f5f9', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', marginBottom: '1rem' }}>
                Foto barang belum diunggah
              </div>
            )}

            <h1 style={{ color: '#0f172a', marginBottom: '0.25rem' }}>{item.name}</h1>
            <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.875rem' }}>
              {item.categoryNameSnapshot || 'Kategori Logistik'}
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <span className={`badge ${item.condition === 'Baik' ? 'badge-success' : 'badge-danger'}`}>
                Kondisi: {item.condition}
              </span>
              <span className={`badge ${item.status === 'Tersedia' ? 'badge-success' : 'badge-warning'}`}>
                Status: {item.status}
              </span>
            </div>

            {/* Action Buttons: Tombol Pinjam Barang & Tombol Maintenance di bawahnya */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', margin: '0.5rem 0 0.5rem', width: '100%' }}>
              {item.status === 'Tersedia' ? (
                <button
                  onClick={openBorrowModal}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    borderRadius: '10px',
                    boxShadow: '0 4px 10px rgba(30, 58, 138, 0.2)',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                  }}
                  title="Ajukan Peminjaman Barang Logistik Ini"
                >
                  <Repeat size={18} />
                  <span>Pinjam Barang Ini</span>
                </button>
              ) : item.status === 'Dipinjam' ? (
                <div
                  style={{
                    padding: '0.625rem 0.875rem',
                    backgroundColor: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '8px',
                    color: '#1e40af',
                    fontSize: '0.825rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    fontWeight: 600
                  }}
                >
                  <Clock size={16} />
                  <span>Status: Sedang Dipinjam</span>
                </div>
              ) : null}

              {/* Tombol Maintenance di bawah tombol pinjam barang */}
              {isStaff && (
                <button
                  onClick={() => setShowMaintenanceModal(true)}
                  className="btn btn-secondary"
                  style={{
                    width: '100%',
                    padding: '0.65rem 1rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    borderRadius: '10px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    color: '#334155',
                    cursor: 'pointer'
                  }}
                  title="Catat Pemeliharaan / Perbaikan Barang"
                >
                  <Wrench size={16} />
                  <span>+ Catat Maintenance</span>
                </button>
              )}
            </div>
          </div>

          {/* Location & Responsible Person */}
          <div className="card">
            <h3 style={{ fontSize: '1rem', marginBottom: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1e3a8a' }}>
              <MapPin size={18} />
              <span>Lokasi & Penanggung Jawab</span>
            </h3>

            <div style={{ fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: 600 }}>GEDUNG / RUANGAN</span>
                <strong style={{ color: '#0f172a' }}>{item.building || '-'}, Lantai {item.floor || '1'} ({item.room || '-'})</strong>
              </div>

              <div>
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: 600 }}>DETAIL POSISI</span>
                <span>{item.locationDetail || '-'}</span>
              </div>

              <div>
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: 600 }}>PENANGGUNG JAWAB ASET</span>
                <strong style={{ color: '#1e3a8a' }}>{item.responsiblePersonNameSnapshot || 'Dinas Logistik Sespimma'}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Specs, Maintenance & Audit History */}
        <div>
          {/* Mobile Tab Selectors (< 768px) */}
          <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', marginBottom: '1rem', gap: '0.5rem' }} className="mobile-detail-tabs">
            <button
              onClick={() => setActiveTab('specs')}
              style={{
                padding: '0.5rem 0.875rem',
                border: 'none',
                background: 'none',
                fontWeight: activeTab === 'specs' ? 700 : 500,
                color: activeTab === 'specs' ? '#1e3a8a' : '#64748b',
                borderBottom: activeTab === 'specs' ? '2px solid #1e3a8a' : '2px solid transparent',
                cursor: 'pointer',
                marginBottom: '-2px'
              }}
            >
              Spesifikasi
            </button>
            <button
              onClick={() => setActiveTab('maintenance')}
              style={{
                padding: '0.5rem 0.875rem',
                border: 'none',
                background: 'none',
                fontWeight: activeTab === 'maintenance' ? 700 : 500,
                color: activeTab === 'maintenance' ? '#1e3a8a' : '#64748b',
                borderBottom: activeTab === 'maintenance' ? '2px solid #1e3a8a' : '2px solid transparent',
                cursor: 'pointer',
                marginBottom: '-2px'
              }}
            >
              Maintenance ({maintenanceList.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              style={{
                padding: '0.5rem 0.875rem',
                border: 'none',
                background: 'none',
                fontWeight: activeTab === 'history' ? 700 : 500,
                color: activeTab === 'history' ? '#1e3a8a' : '#64748b',
                borderBottom: activeTab === 'history' ? '2px solid #1e3a8a' : '2px solid transparent',
                cursor: 'pointer',
                marginBottom: '-2px'
              }}
            >
              Audit ({historyList.length})
            </button>
          </div>

          {/* Section 1: Detailed Specs & Legal Specs */}
          {(activeTab === 'specs' || window.innerWidth >= 768) && (
            <div className="card" style={{ marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.875rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', color: '#1e3a8a' }}>
                Spesifikasi Lengkap & Pengadaan
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.875rem', fontSize: '0.875rem' }}>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>MERK / BRAND</span>
                  <strong>{item.brand || '-'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>MODEL / TIPE</span>
                  <strong>{item.model || '-'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>SERI (S/N)</span>
                  <strong>{item.serialNumber || '-'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>TANGGAL PEROLEHAN</span>
                  <strong>{item.purchaseDate || '-'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>HARGA PEROLEHAN</span>
                  <strong>{item.purchasePrice ? `Rp ${item.purchasePrice.toLocaleString('id-ID')}` : '-'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>SUMBER DANA</span>
                  <strong>{item.fundingSource || '-'}</strong>
                </div>
              </div>

              <div style={{ marginTop: '0.875rem', paddingTop: '0.75rem', borderTop: '1px solid #e2e8f0', fontSize: '0.875rem' }}>
                <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>DESKRIPSI / SPESIFIKASI</span>
                <p style={{ marginTop: '0.25rem', color: '#334155' }}>{item.description || 'Tidak ada catatan deskripsi khusus.'}</p>
              </div>
            </div>
          )}

          {/* Section 2: Maintenance Records */}
          {(activeTab === 'maintenance' || window.innerWidth >= 768) && (
            <div className="card" style={{ marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#1e3a8a' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Wrench size={18} />
                  <span>Riwayat Maintenance</span>
                </div>
                <span className="badge badge-info">{maintenanceList.length} Record</span>
              </h3>

              {maintenanceList.length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: '0.875rem', fontStyle: 'italic' }}>Belum ada riwayat maintenance tercatat.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {maintenanceList.map(m => (
                    <div key={m.id} style={{ padding: '0.75rem', borderRadius: '8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, marginBottom: '0.25rem' }}>
                        <span>{m.type} - {m.result}</span>
                        <span style={{ color: '#64748b' }}>{m.date}</span>
                      </div>
                      <div style={{ color: '#475569' }}><strong>Keluhan:</strong> {m.complaint}</div>
                      <div style={{ color: '#475569' }}><strong>Tindakan:</strong> {m.action}</div>
                      <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.25rem' }}>Teknisi: {m.technicianNameSnapshot}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Section 3: Audit History */}
          {(activeTab === 'history' || window.innerWidth >= 768) && (
            <div className="card">
              <h3 style={{ fontSize: '1rem', marginBottom: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1e3a8a' }}>
                <History size={18} />
                <span>Jejak Audit Barang</span>
              </h3>

              {historyList.length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: '0.875rem', fontStyle: 'italic' }}>Belum ada histori perubahan.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '220px', overflowY: 'auto' }}>
                  {historyList.map(h => (
                    <div key={h.id} style={{ fontSize: '0.8rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.375rem' }}>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{h.description}</div>
                      <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Oleh: {h.userName}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Maintenance Modal */}
      {showMaintenanceModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3>Catat Pemeliharaan Barang</h3>
              <button onClick={() => setShowMaintenanceModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddMaintenance}>
              <div className="form-group">
                <label className="form-label">Jenis Pemeliharaan</label>
                <select className="form-select" value={maintType} onChange={e => setMaintType(e.target.value as MaintenanceType)}>
                  <option value="Preventive">Preventive</option>
                  <option value="Corrective">Corrective</option>
                  <option value="Inspection">Inspection</option>
                  <option value="Repair">Repair</option>
                  <option value="Replacement">Replacement</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Keluhan / Masalah Awal</label>
                <textarea required className="form-textarea" rows={2} value={maintComplaint} onChange={e => setMaintComplaint(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Tindakan Pemeliharaan</label>
                <textarea required className="form-textarea" rows={2} value={maintAction} onChange={e => setMaintAction(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Teknisi / Pelaksana</label>
                <input type="text" className="form-input" value={maintTech} onChange={e => setMaintTech(e.target.value)} placeholder="Nama Petugas / Teknisi" />
              </div>
              <div className="form-group">
                <label className="form-label">Biaya (IDR)</label>
                <input type="number" className="form-input" value={maintCost} onChange={e => setMaintCost(Number(e.target.value))} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowMaintenanceModal(false)} className="btn btn-secondary">Batal</button>
                <button type="submit" disabled={maintSubmitting} className="btn btn-primary">{maintSubmitting ? 'Menyimpan...' : 'Simpan Maintenance'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Borrow Item Modal */}
      {showBorrowModal && (
        <div className="modal-overlay" onClick={() => setShowBorrowModal(false)}>
          <div className="modal-content" style={{ maxWidth: '520px', width: '100%', padding: '1.5rem' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', color: '#0f172a', margin: '0 0 0.25rem' }}>
                  Formulir Peminjaman Barang
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                  Lengkapi data peminjaman aset logistik Sespimma Polri.
                </p>
              </div>
              <button
                onClick={() => setShowBorrowModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '0.25rem' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Item Mini Overview Pill */}
            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '0.625rem 0.875rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem'
              }}
            >
              <div>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.875rem' }}>{item.name}</div>
                <div style={{ fontSize: '0.75rem', color: '#1e3a8a', fontFamily: 'monospace', fontWeight: 600 }}>{item.inventoryCode}</div>
              </div>
              <span className="badge badge-success">Tersedia</span>
            </div>

            <form onSubmit={handleCreateBorrowing}>
              {/* 1. Nama Peminjam */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                  Nama Peminjam <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="Masukkan nama lengkap peminjam"
                  value={borrowerName}
                  onChange={e => setBorrowerName(e.target.value)}
                />
              </div>

              {/* 2. Instansi Peminjam */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                  Instansi / Unit Kerja Peminjam <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="Contoh: Bagian Logistik / Pokjar IV / Korps Siswa..."
                  value={borrowerInstitution}
                  onChange={e => setBorrowerInstitution(e.target.value)}
                />
              </div>

              {/* 3. Tanggal Pinjam & Estimasi Kembali (Responsive 2-column Grid) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                    Tanggal Peminjaman <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={borrowDate}
                    onChange={e => setBorrowDate(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                    Estimasi Tanggal Pengembalian <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={returnDate}
                    min={borrowDate}
                    onChange={e => setReturnDate(e.target.value)}
                  />
                </div>
              </div>

              {/* 4. Keperluan Peminjaman */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                  Keperluan Peminjaman <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <textarea
                  required
                  className="form-textarea"
                  rows={3}
                  placeholder="Jelaskan keperluan peminjaman / kegiatan / tugas kedinasan operasional..."
                  value={borrowPurpose}
                  onChange={e => setBorrowPurpose(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.625rem', marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
                <button
                  type="button"
                  onClick={() => setShowBorrowModal(false)}
                  className="btn btn-secondary"
                  style={{ padding: '0.5rem 1rem' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={borrowSubmitting}
                  className="btn btn-primary"
                  style={{ padding: '0.5rem 1.25rem', fontWeight: 600 }}
                >
                  {borrowSubmitting ? 'Memproses...' : 'Kirim Pengajuan Peminjaman'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @media (min-width: 768px) {
          .mobile-detail-tabs { display: none !important; }
        }
      `}</style>
    </div>
  );
};
