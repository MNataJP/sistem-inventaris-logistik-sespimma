import React, { useEffect, useState } from 'react';
import { getAuditLogs, deleteAuditLog, deleteMultipleAuditLogs, clearAllAuditLogs } from '@/services/auditService';
import { AuditLog } from '@/types/audit';
import { useAuth } from '@/context/AuthContext';
import {
  ShieldAlert,
  User,
  Clock,
  Trash2,
  CheckSquare,
  Square,
  Search,
  RefreshCw,
  Activity
} from 'lucide-react';

export const AuditLogPage: React.FC = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await getAuditLogs(200);
      setLogs(data);
      setSelectedIds([]);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    const q = searchQuery.toLowerCase();
    const matchesUser = (log.userName || '').toLowerCase().includes(q);
    const matchesModule = (log.module || '').toLowerCase().includes(q);
    const matchesAction = (log.action || '').toLowerCase().includes(q);
    const matchesDesc = (log.description || '').toLowerCase().includes(q);
    return matchesUser || matchesModule || matchesAction || matchesDesc;
  });

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const selectAll = () => {
    if (selectedIds.length === filteredLogs.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredLogs.map(l => l.id));
    }
  };

  // Delete single audit log
  const handleDeleteSingle = async (logId: string, desc: string) => {
    if (!window.confirm(`Hapus catatan audit log "${desc}" dari database?`)) return;

    setDeletingId(logId);
    try {
      await deleteAuditLog(logId);
      setLogs(prev => prev.filter(l => l.id !== logId));
      setSelectedIds(prev => prev.filter(id => id !== logId));
    } catch (err: any) {
      alert('Gagal menghapus audit log: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  // Delete multiple selected audit logs
  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Hapus ${selectedIds.length} catatan audit log terpilih dari database?`)) return;

    setBulkDeleting(true);
    try {
      await deleteMultipleAuditLogs(selectedIds);
      setLogs(prev => prev.filter(l => !selectedIds.includes(l.id)));
      setSelectedIds([]);
    } catch (err: any) {
      alert('Gagal menghapus audit log terpilih: ' + err.message);
    } finally {
      setBulkDeleting(false);
    }
  };

  // Clear all audit logs
  const handleClearAll = async () => {
    if (logs.length === 0) return;
    if (!window.confirm('PERINGATAN: Apakah Anda yakin ingin menghapus SEMUA rekaman Audit Trail di database? Tindakan ini tidak dapat dibatalkan.')) return;

    setBulkDeleting(true);
    try {
      await clearAllAuditLogs();
      setLogs([]);
      setSelectedIds([]);
    } catch (err: any) {
      alert('Gagal membersihkan semua audit log: ' + err.message);
    } finally {
      setBulkDeleting(false);
    }
  };

  const isStaff = user?.role === 'super_admin' || user?.role === 'admin';

  return (
    <div>
      {/* Top Header */}
      <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.875rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', color: '#0f172a', marginBottom: '0.25rem' }}>
            Audit Trail Aktivitas Sistem
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
            Rekaman jejak transaksi (Append-Only) seluruh perubahan data barang, maintenance, peminjaman, dan user.
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
          {selectedIds.length > 0 && isStaff && (
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
          {logs.length > 0 && isStaff && (
            <button
              onClick={handleClearAll}
              disabled={bulkDeleting || loading}
              className="btn btn-secondary btn-sm"
              style={{ color: '#b91c1c', borderColor: '#fecaca', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              title="Bersihkan seluruh riwayat audit log dari Firestore"
            >
              <Trash2 size={15} />
              <span>Bersihkan Semua</span>
            </button>
          )}
        </div>
      </div>

      {/* Search / Filter Toolbar */}
      {logs.length > 0 && (
        <div className="card" style={{ marginBottom: '1.25rem', padding: '0.875rem 1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: '400px' }}>
              <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '2.25rem', fontSize: '0.85rem' }}
                placeholder="Cari modul, aksi, pelaku, deskripsi..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span>Total Log: <strong>{logs.length}</strong></span>
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
          <p style={{ color: '#64748b' }}>Memuat audit log...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <ShieldAlert size={48} color="#cbd5e1" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.1rem', color: '#0f172a', marginBottom: '0.35rem' }}>Belum Ada Catatan Audit Log Tersimpan</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
            Seluruh aktivitas perubahan data barang, peminjaman, dan user akan terekam secara otomatis di sini.
          </p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '2.5rem' }}>
          <p style={{ color: '#64748b', margin: 0 }}>Tidak ada audit log yang cocok dengan pencarian "{searchQuery}".</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                {isStaff && (
                  <th style={{ width: '40px', textAlign: 'center' }}>
                    <div
                      onClick={selectAll}
                      style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                      title={selectedIds.length === filteredLogs.length ? 'Batalkan pilih semua' : 'Pilih semua'}
                    >
                      {selectedIds.length === filteredLogs.length && filteredLogs.length > 0 ? (
                        <CheckSquare size={17} color="#1e3a8a" />
                      ) : (
                        <Square size={17} color="#94a3b8" />
                      )}
                    </div>
                  </th>
                )}
                <th>Waktu Kejadian</th>
                <th>Pengguna / Pelaku</th>
                <th>Modul & Aksi</th>
                <th>Deskripsi Aktivitas</th>
                {isStaff && <th style={{ textAlign: 'right', width: '70px' }}>Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map(log => {
                const isChecked = selectedIds.includes(log.id);
                return (
                  <tr
                    key={log.id}
                    style={{ backgroundColor: isChecked ? '#f0f7ff' : undefined }}
                  >
                    {isStaff && (
                      <td style={{ textAlign: 'center' }}>
                        <div
                          onClick={() => toggleSelect(log.id)}
                          style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                        >
                          {isChecked ? (
                            <CheckSquare size={17} color="#1e3a8a" />
                          ) : (
                            <Square size={17} color="#cbd5e1" />
                          )}
                        </div>
                      </td>
                    )}
                    <td style={{ color: '#475569', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Clock size={12} color="#94a3b8" />
                        <span>{log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString('id-ID') : 'Baru saja'}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, color: '#0f172a' }}>
                        <User size={13} color="#64748b" />
                        <span>{log.userName}</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-info" style={{ marginRight: '0.35rem' }}>{log.module}</span>
                      <strong style={{ fontSize: '0.825rem', color: '#1e3a8a' }}>{log.action}</strong>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: '#334155' }}>
                      {log.description}
                    </td>
                    {isStaff && (
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => handleDeleteSingle(log.id, log.description)}
                          disabled={deletingId === log.id}
                          className="btn btn-secondary btn-sm"
                          style={{ color: '#dc2626', padding: '0.35rem 0.5rem' }}
                          title="Hapus rekaman audit ini dari Firebase"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
