import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getItemByInventoryCode, getItemHistory, uploadItemPhoto, updateInventoryItem } from '@/services/inventoryService';
import { getMaintenanceHistory, createMaintenanceRecord } from '@/services/maintenanceService';
import { recordScanLog } from '@/services/scanLogService';
import { createBorrowing } from '@/services/borrowingService';
import { InventoryItem, InventoryHistoryRecord } from '@/types/inventory';
import { MaintenanceRecord, MaintenanceType } from '@/types/maintenance';
import { useAuth } from '@/context/AuthContext';
import {
  Wrench,
  Repeat,
  History,
  MapPin,
  X,
  Clock,
  LogOut,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  LayoutDashboard,
  Camera,
  Image as ImageIcon,
  Boxes
} from 'lucide-react';

export const ItemDetailPage: React.FC = () => {
  const { inventoryCode } = useParams<{ inventoryCode: string }>();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [item, setItem] = useState<InventoryItem | null>(null);
  const [historyList, setHistoryList] = useState<InventoryHistoryRecord[]>([]);
  const [maintenanceList, setMaintenanceList] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Direct Photo Upload for Staff (Super Admin, Admin, Petugas)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

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
  const [maintCostRaw, setMaintCostRaw] = useState<string>('');
  const [maintResult, setMaintResult] = useState('Selesai dengan Baik');
  const [maintNextDate, setMaintNextDate] = useState('');
  const [maintSubmitting, setMaintSubmitting] = useState(false);

  // Helper to format timestamps for audit logs
  const formatAuditTimestamp = (ts: any): string => {
    if (!ts) return '-';
    try {
      if (ts.toDate && typeof ts.toDate === 'function') {
        return ts.toDate().toLocaleString('id-ID', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      }
      if (ts.seconds) {
        return new Date(ts.seconds * 1000).toLocaleString('id-ID', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      }
      const d = new Date(ts);
      if (!isNaN(d.getTime())) {
        return d.toLocaleString('id-ID', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      }
    } catch (e) {
      console.error('Error formatting audit timestamp', e);
    }
    return '-';
  };

  const handleMaintCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numeric characters (digits)
    const digitsOnly = e.target.value.replace(/\D/g, '');
    setMaintCostRaw(digitsOnly);
  };

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

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleTriggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !item) return;
    const file = e.target.files[0];
    setUploadingPhoto(true);
    try {
      // 1. Upload & compress image instantly
      const newImageUrl = await uploadItemPhoto(item.id, file);

      // 2. Update Firestore item document
      await updateInventoryItem(
        item.id,
        { imageUrl: newImageUrl },
        undefined,
        user?.uid,
        user?.name
      );

      // 3. Update local state
      setItem(prev => (prev ? { ...prev, imageUrl: newImageUrl } : null));
      alert('Foto barang berhasil diperbarui!');
    } catch (err: any) {
      console.error('Error uploading photo:', err);
      alert('Gagal mengunggah foto: ' + (err.message || 'Terjadi kesalahan'));
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAddMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;
    setMaintSubmitting(true);
    try {
      const parsedCost = maintCostRaw ? parseInt(maintCostRaw, 10) : 0;

      await createMaintenanceRecord(
        item.id,
        {
          date: new Date().toISOString().split('T')[0],
          type: maintType,
          complaint: maintComplaint,
          action: maintAction,
          technicianNameSnapshot: maintTech || user?.name || 'Petugas',
          cost: parsedCost,
          result: maintResult,
          nextMaintenanceDate: maintNextDate,
        },
        undefined,
        user?.uid,
        user?.name
      );

      // Reset form states
      setMaintComplaint('');
      setMaintAction('');
      setMaintTech('');
      setMaintCostRaw('');
      setMaintNextDate('');
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

  // Roles: Super Admin, Admin, and Petugas are Staff
  const isStaff = user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'petugas';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      {/* Official Sespimma Polri Header */}
      <header
        style={{
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          padding: '0.75rem 1.25rem',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
        }}
      >
        <div
          style={{
            maxWidth: '1100px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem'
          }}
        >
          {/* Institution Branding */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <img
              src="/logo.png"
              alt="Logo Sespimma Polri"
              style={{ width: '36px', height: '36px', objectFit: 'contain' }}
            />
            <div>
              <h1 style={{ fontSize: '1rem', color: '#0f172a', lineHeight: 1.2, margin: 0 }}>
                Sistem Inventaris Logistik
              </h1>
              <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0, fontWeight: 500 }}>
                Sespimma Lemdiklat Polri
              </p>
            </div>
          </div>

          {/* User Profile Pill & Quick Logout */}
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backgroundColor: '#f1f5f9',
                  padding: '0.35rem 0.65rem',
                  borderRadius: '20px',
                  border: '1px solid #e2e8f0'
                }}
              >
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: '#1e3a8a',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}
                >
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div style={{ lineHeight: 1.2 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0f172a', maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user.name}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#1e3a8a', fontWeight: 700, textTransform: 'uppercase' }}>
                    {user.role}
                  </div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                title="Keluar / Ganti Akun"
                style={{
                  background: 'none',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '0.4rem',
                  cursor: 'pointer',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#ffffff'
                }}
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '1.25rem 1rem', maxWidth: '1100px', width: '100%', margin: '0 auto' }}>
        {/* Navigation Bar: HANYA DITAMPILKAN UNTUK SUPER ADMIN, ADMIN, DAN PETUGAS */}
        {isStaff && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem',
              flexWrap: 'wrap',
              gap: '0.625rem',
              paddingBottom: '0.75rem',
              borderBottom: '1px solid #e2e8f0'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Link to="/items" className="btn btn-secondary btn-sm" title="Kembali ke Daftar Barang Inventaris">
                <ArrowLeft size={16} />
                <span>Kembali ke Daftar Barang</span>
              </Link>
              <Link to="/dashboard" className="btn btn-secondary btn-sm" title="Buka Dashboard Logistik">
                <LayoutDashboard size={16} />
                <span>Dashboard</span>
              </Link>
            </div>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>
              Panel Staf Logistik Sespimma
            </span>
          </div>
        )}

        {loading ? (
          <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem', margin: '2rem auto', maxWidth: '500px' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTopColor: '#1e3a8a', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.1rem', color: '#0f172a', marginBottom: '0.25rem' }}>Memuat Detail Barang...</h3>
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Mengambil informasi aset dari pemindaian QR Code</p>
          </div>
        ) : error || !item ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem', margin: '2rem auto', maxWidth: '500px' }}>
            <div style={{ width: '56px', height: '56px', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <AlertCircle size={30} />
            </div>
            <h2 style={{ color: '#b91c1c', marginBottom: '0.5rem', fontSize: '1.25rem' }}>Barang Tidak Ditemukan</h2>
            <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.9rem' }}>{error}</p>
            {isStaff && (
              <Link to="/items" className="btn btn-primary btn-sm">
                Kembali ke Daftar Barang
              </Link>
            )}
          </div>
        ) : (
          <div>
            {/* Scanned Badge Banner */}
            <div
              style={{
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '10px',
                padding: '0.65rem 1rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.5rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <QrCode size={18} color="#1e3a8a" />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e3a8a' }}>
                  Detail Inventaris Logistik
                </span>
              </div>
              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1e3a8a', fontFamily: 'monospace' }}>
                {item.inventoryCode}
              </span>
            </div>

            {/* Main Grid Layout (2-column desktop / 1-column mobile) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
              
              {/* Left Column: Hero Image, Action Buttons (Pinjam & Maintenance), Core Details */}
              <div>
                <div className="card" style={{ marginBottom: '1.25rem', textAlign: 'center' }}>
                  {item.imageUrl ? (
                    <div style={{ position: 'relative', width: '100%', marginBottom: '0.875rem' }}>
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        style={{ width: '100%', maxHeight: '250px', objectFit: 'cover', borderRadius: '10px' }}
                      />
                    </div>
                  ) : (
                    <div style={{ height: '160px', backgroundColor: '#f1f5f9', borderRadius: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', marginBottom: '0.875rem', gap: '0.35rem', fontSize: '0.875rem' }}>
                      <ImageIcon size={32} />
                      <span>Foto barang belum diunggah</span>
                    </div>
                  )}

                  {/* FITUR UNGGAH / GANTI FOTO: HANYA UNTUK SUPER ADMIN, ADMIN, DAN PETUGAS */}
                  {isStaff && (
                    <div style={{ marginBottom: '1rem' }}>
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handlePhotoUpload}
                      />
                      <button
                        type="button"
                        onClick={handleTriggerUpload}
                        disabled={uploadingPhoto}
                        className="btn btn-secondary btn-sm"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          backgroundColor: '#eff6ff',
                          borderColor: '#bfdbfe',
                          color: '#1e40af',
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          padding: '0.4rem 0.85rem',
                          borderRadius: '8px'
                        }}
                        title="Unggah atau perbarui foto fisik barang"
                      >
                        <Camera size={15} />
                        <span>{uploadingPhoto ? 'Mengunggah Foto...' : (item.imageUrl ? 'Ganti Foto Barang' : 'Unggah Foto Barang')}</span>
                      </button>
                    </div>
                  )}

                  <h2 style={{ color: '#0f172a', marginBottom: '0.25rem', fontSize: '1.35rem' }}>{item.name}</h2>
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

                  {/* Action Buttons: Tombol Pinjam Barang & Tombol Maintenance */}
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

                    {/* Tombol Maintenance untuk Petugas / Admin */}
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
                      <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>DESKRIPSI / SPESIFIKASI</span>
                      {(() => {
                        if (!item.description || !item.description.trim()) {
                          return (
                            <p style={{ marginTop: '0.25rem', color: '#94a3b8', fontStyle: 'italic' }}>
                              Tidak ada catatan deskripsi khusus.
                            </p>
                          );
                        }

                        const lines = item.description
                          .split(/\r?\n/)
                          .map(line => line.trim())
                          .filter(Boolean);

                        if (lines.length === 0) {
                          return (
                            <p style={{ marginTop: '0.25rem', color: '#94a3b8', fontStyle: 'italic' }}>
                              Tidak ada catatan deskripsi khusus.
                            </p>
                          );
                        }

                        if (lines.length === 1 && !/^[•\-\*\d+\.]/.test(lines[0])) {
                          return (
                            <p style={{ marginTop: '0.25rem', color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                              {lines[0]}
                            </p>
                          );
                        }

                        return (
                          <ul
                            style={{
                              marginTop: '0.35rem',
                              marginBottom: '0.25rem',
                              paddingLeft: '1.25rem',
                              color: '#334155',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.35rem',
                              listStyleType: 'disc'
                            }}
                          >
                            {lines.map((line, idx) => {
                              const cleanText = line.replace(/^[•\-\*]\s*/, '').replace(/^\d+[\.\)]\s*/, '');
                              return (
                                <li key={idx} style={{ lineHeight: 1.5, fontSize: '0.875rem' }}>
                                  {cleanText || line}
                                </li>
                              );
                            })}
                          </ul>
                        );
                      })()}
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
                    <h3 style={{ fontSize: '1rem', marginBottom: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#1e3a8a' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <History size={18} />
                        <span>Jejak Audit Barang</span>
                      </div>
                      <span className="badge badge-info">{historyList.length} Log</span>
                    </h3>

                    {historyList.length === 0 ? (
                      <p style={{ color: '#94a3b8', fontSize: '0.875rem', fontStyle: 'italic' }}>Belum ada histori perubahan.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', maxHeight: '250px', overflowY: 'auto' }}>
                        {historyList.map(h => (
                          <div key={h.id} style={{ fontSize: '0.8rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                              <div style={{ fontWeight: 600, color: '#0f172a' }}>{h.description}</div>
                              <div style={{ color: '#64748b', fontSize: '0.725rem', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <Clock size={12} color="#94a3b8" />
                                <span>{formatAuditTimestamp(h.timestamp)}</span>
                              </div>
                            </div>
                            <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.2rem' }}>
                              Oleh: <strong style={{ color: '#334155' }}>{h.userName}</strong>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

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
                <label className="form-label">Biaya Pemeliharaan (IDR)</label>
                <div style={{ position: 'relative' }}>
                  <span
                    style={{
                      position: 'absolute',
                      left: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontWeight: 600,
                      color: '#64748b',
                      fontSize: '0.85rem'
                    }}
                  >
                    Rp
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    className="form-input"
                    style={{ paddingLeft: '2.5rem' }}
                    placeholder="Contoh: 150.000 (Kosongkan jika gratis)"
                    value={maintCostRaw ? Number(maintCostRaw).toLocaleString('id-ID') : ''}
                    onChange={handleMaintCostChange}
                  />
                </div>
                <small style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                  Hanya menerima angka. Format ribuan otomatis disesuaikan.
                </small>
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
            {item && (
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
            )}

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

              {/* 3. Tanggal Pinjam & Estimasi Kembali */}
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

      {/* Official Sespimma Polri Footer */}
      <footer style={{ padding: '1rem 1.5rem', textAlign: 'center', fontSize: '0.75rem', color: '#64748b', borderTop: '1px solid #e2e8f0', backgroundColor: '#ffffff', marginTop: 'auto', lineHeight: 1.6 }}>
        <div>Hak Cipta © 2026 Sistem Inventaris Logistik - Sespimma Lemdiklat Polri. All rights reserved.</div>
        <div style={{ marginTop: '0.25rem' }}>
          Created by M Nata Jayndra Permana &bull; Email : <a href="mailto:natajp81@gmail.com" style={{ color: 'inherit', textDecoration: 'none' }}>natajp81@gmail.com</a>
        </div>
      </footer>

      <style>{`
        @media (min-width: 768px) {
          .mobile-detail-tabs { display: none !important; }
        }
      `}</style>
    </div>
  );
};
