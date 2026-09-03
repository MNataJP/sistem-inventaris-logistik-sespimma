import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getScanLogs, deleteScanLog, deleteMultipleScanLogs, clearAllScanLogs } from '@/services/scanLogService';
import { ScanLog } from '@/types/audit';
import { useAuth } from '@/context/AuthContext';
import {
  QrCode,
  Smartphone,
  Laptop,
  Trash2,
  CheckSquare,
  Square,
  Search,
  RefreshCw,
  AlertTriangle,
  Clock,
  User,
  ShieldAlert
} from 'lucide-react';

export const ScanHistoryPage: React.FC = () => {
  const { user } = useAuth();
  const [scans, setScans] = useState<ScanLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await getScanLogs(200);
      setScans(data);
      setSelectedIds([]);
    } catch (err) {
      console.error('Error fetching scan logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Filtered scans by search query
  const filteredScans = scans.filter(scan => {
    const q = searchQuery.toLowerCase();
    const matchesCode = (scan.inventoryCode || '').toLowerCase().includes(q);
    const matchesUser = (scan.userName || '').toLowerCase().includes(q);
    const matchesDevice = (scan.deviceType || '').toLowerCase().includes(q);
    return matchesCode || matchesUser || matchesDevice;
  });

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const selectAll = () => {
    if (selectedIds.length === filteredScans.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredScans.map(s => s.id));
    }
  };

  // Delete single scan log
  const handleDeleteSingle = async (scanId: string, inventoryCode: string) => {
    if (!window.confirm(`Hapus catatan riwayat scan untuk barang "${inventoryCode}"?`)) return;

    setDeletingId(scanId);
    try {
      await deleteScanLog(scanId);
      setScans(prev => prev.filter(s => s.id !== scanId));
      setSelectedIds(prev => prev.filter(id => id !== scanId));
    } catch (err: any) {
      alert('Gagal menghapus riwayat: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  // Delete multiple selected scan logs
  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Hapus ${selectedIds.length} catatan riwayat pemindaian terpilih dari database?`)) return;

    setBulkDeleting(true);
    try {
      await deleteMultipleScanLogs(selectedIds);
      setScans(prev => prev.filter(s => !selectedIds.includes(s.id)));
      setSelectedIds([]);
    } catch (err: any) {
      alert('Gagal menghapus riwayat terpilih: ' + err.message);
    } finally {
      setBulkDeleting(false);
    }
  };

  // Clear all scan logs
  const handleClearAll = async () => {
    if (scans.length === 0) return;
    if (!window.confirm('PERINGATAN: Apakah Anda yakin ingin menghapus SEMUA riwayat pemindaian QR Code di database? Tindakan ini tidak dapat dibatalkan.')) return;

    setBulkDeleting(true);
    try {
      await clearAllScanLogs();
      setScans([]);
      setSelectedIds([]);
    } catch (err: any) {
      alert('Gagal membersihkan semua riwayat: ' + err.message);
    } finally {
      setBulkDeleting(false);
    }
  };

  return (
    <div>
      {/* Top Header */}
      <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.875rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', color: '#0f172a', marginBottom: '0.25rem' }}>
            Riwayat Pemindaian QR Code dari Kamera HP
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
            Jejak akses detail barang yang dibuka langsung dari pemindaian fisik stiker QR Code.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Refresh Button */}
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="btn btn-secondary btn-sm"
            title="Muat Ulang Data"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          {/* Delete Selected Button */}
          {selectedIds.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              disabled={bulkDeleting}
              className="btn btn-danger btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', backgroundColor: '#dc2626', color: '#ffffff' }}
            >
              <Trash2 size={15} />
              <span>{bulkDeleting ? 'Menghapus...' : `Hapus Terpilih (${selectedIds.length})`}</span>
            </button>
          )}

          {/* Clear All Logs Button */}
          {scans.length > 0 && (
            <button
              onClick={handleClearAll}
              disabled={bulkDeleting || loading}
              className="btn btn-secondary btn-sm"
              style={{ color: '#b91c1c', borderColor: '#fecaca', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              title="Bersihkan seluruh riwayat scan dari Firestore"
            >
              <Trash2 size={15} />
              <span>Bersihkan Semua</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter / Search Bar */}
      {scans.length > 0 && (
        <div className="card" style={{ marginBottom: '1.25rem', padding: '0.875rem 1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: '400px' }}>
              <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '2.25rem', fontSize: '0.85rem' }}
                placeholder="Cari kode barang, nama pemindai, perangkat..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span>Total Riwayat: <strong>{scans.length}</strong></span>
              {selectedIds.length > 0 && (
                <span style={{ color: '#1e3a8a', fontWeight: 600 }}>
                  ({selectedIds.length} terpilih)
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ width: '32px', height: '32px', border: '3px solid #e2e8f0', borderTopColor: '#1e3a8a', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 0.75rem' }} />
          <p style={{ color: '#64748b' }}>Memuat riwayat scan...</p>
        </div>
      ) : scans.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <QrCode size={48} color="#cbd5e1" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.1rem', color: '#0f172a', marginBottom: '0.35rem' }}>Belum Ada Catatan Pemindaian QR Code</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
            Riwayat akan otomatis tercatat setiap kali ada pengguna yang memindai stiker QR Code barang logistik.
          </p>
        </div>
      ) : filteredScans.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '2.5rem' }}>
          <p style={{ color: '#64748b', margin: 0 }}>Tidak ada riwayat pemindaian yang cocok dengan pencarian "{searchQuery}".</p>
        </div>
      ) : (
        <>
          {/* Desktop & Tablet Table View (>= 768px) */}
          <div className="table-container" style={{ display: 'block' }}>
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>
                    <div
                      onClick={selectAll}
                      style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                      title={selectedIds.length === filteredScans.length ? 'Batalkan pilih semua' : 'Pilih semua'}
                    >
                      {selectedIds.length === filteredScans.length && filteredScans.length > 0 ? (
                        <CheckSquare size={17} color="#1e3a8a" />
                      ) : (
                        <Square size={17} color="#94a3b8" />
                      )}
                    </div>
                  </th>
                  <th>Kode Inventaris</th>
                  <th>Pemindai / Pengguna</th>
                  <th>Tipe Perangkat</th>
                  <th>User Agent Browser</th>
                  <th>Waktu Scan</th>
                  <th style={{ textAlign: 'right', width: '80px' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredScans.map(scan => {
                  const isChecked = selectedIds.includes(scan.id);
                  const isMobile = scan.deviceType?.toLowerCase().includes('mobile') || scan.deviceType?.toLowerCase().includes('smartphone');
                  return (
                    <tr
                      key={scan.id}
                      style={{ backgroundColor: isChecked ? '#f0f7ff' : undefined }}
                    >
                      <td style={{ textAlign: 'center' }}>
                        <div
                          onClick={() => toggleSelect(scan.id)}
                          style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                        >
                          {isChecked ? (
                            <CheckSquare size={17} color="#1e3a8a" />
                          ) : (
                            <Square size={17} color="#cbd5e1" />
                          )}
                        </div>
                      </td>
                      <td>
                        <Link
                          to={`/item/${scan.inventoryCode}`}
                          style={{ fontWeight: 700, color: '#1e3a8a', fontFamily: 'monospace', textDecoration: 'none' }}
                          title="Lihat Detail Barang"
                        >
                          {scan.inventoryCode}
                        </Link>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, color: '#0f172a' }}>
                          <User size={13} color="#64748b" />
                          <span>{scan.userName || 'Pengguna'}</span>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`badge ${isMobile ? 'badge-success' : 'badge-info'}`}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                          {isMobile ? <Smartphone size={12} /> : <Laptop size={12} />}
                          <span>{scan.deviceType || 'Browser'}</span>
                        </span>
                      </td>
                      <td style={{ fontSize: '0.75rem', color: '#64748b', maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {scan.userAgent || '-'}
                      </td>
                      <td style={{ color: '#475569', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Clock size={12} color="#94a3b8" />
                          <span>{scan.timestamp?.toDate ? scan.timestamp.toDate().toLocaleString('id-ID') : 'Baru saja'}</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => handleDeleteSingle(scan.id, scan.inventoryCode)}
                          disabled={deletingId === scan.id}
                          className="btn btn-secondary btn-sm"
                          style={{ color: '#dc2626', padding: '0.35rem 0.5rem' }}
                          title="Hapus riwayat scan ini dari Firebase"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};
