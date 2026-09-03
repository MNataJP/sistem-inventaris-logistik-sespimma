import React, { useEffect, useState, useMemo } from 'react';
import { getAllBorrowings, returnBorrowing } from '@/services/borrowingService';
import { BorrowingRecord } from '@/types/borrowing';
import { useAuth } from '@/context/AuthContext';
import {
  getReturnTimeliness,
  formatIndoDate,
  getDaysDifference,
  ReturnTimelinessInfo
} from '@/utils/borrowingUtils';
import {
  Repeat,
  CheckCircle,
  Clock,
  AlertTriangle,
  Zap,
  Calendar,
  Search,
  Filter,
  X,
  FileText,
  UserCheck,
  Building,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

type FilterTab = 'all' | 'borrowed' | 'on_time' | 'early' | 'late' | 'overdue';

export const BorrowingPage: React.FC = () => {
  const { user } = useAuth();
  const [borrowings, setBorrowings] = useState<BorrowingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<FilterTab>('all');

  // Modal State for returning item
  const [selectedBorrowing, setSelectedBorrowing] = useState<BorrowingRecord | null>(null);
  const [returnDate, setReturnDate] = useState<string>('');
  const [returnNotes, setReturnNotes] = useState<string>('Dikembalikan dalam keadaan baik');
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);

  const fetchBorrowings = async () => {
    setLoading(true);
    try {
      const data = await getAllBorrowings();
      setBorrowings(data);
    } catch (err) {
      console.error('Error loading borrowings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBorrowings();
  }, []);

  const isStaff = user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'petugas';

  // Open Return Modal
  const handleOpenReturnModal = (record: BorrowingRecord) => {
    setSelectedBorrowing(record);
    const today = new Date().toISOString().split('T')[0];
    setReturnDate(today);
    setReturnNotes('Dikembalikan dalam keadaan baik');
  };

  // Submit Return Process
  const handleConfirmReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBorrowing) return;
    if (!returnDate) {
      alert('Pilih tanggal pengembalian aktual.');
      return;
    }

    setIsSubmittingReturn(true);
    try {
      await returnBorrowing(
        selectedBorrowing.id,
        returnDate,
        returnNotes.trim() || 'Dikembalikan dalam keadaan baik',
        user?.uid,
        user?.name
      );
      alert(`Pengembalian barang "${selectedBorrowing.itemNameSnapshot}" berhasil diproses.`);
      setSelectedBorrowing(null);
      await fetchBorrowings();
    } catch (err: any) {
      alert('Gagal memproses pengembalian: ' + err.message);
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  // Stats calculation
  const stats = useMemo(() => {
    let total = borrowings.length;
    let borrowed = 0;
    let onTime = 0;
    let early = 0;
    let late = 0;
    let overdueOngoing = 0;

    borrowings.forEach(b => {
      const timeliness = getReturnTimeliness(b.expectedReturnDate, b.actualReturnDate, b.status);
      if (b.status === 'borrowed') {
        borrowed++;
        if (timeliness.type === 'overdue') {
          overdueOngoing++;
        }
      } else if (b.status === 'returned') {
        if (timeliness.type === 'on_time') onTime++;
        else if (timeliness.type === 'early') early++;
        else if (timeliness.type === 'late') late++;
      }
    });

    return { total, borrowed, onTime, early, late, overdueOngoing };
  }, [borrowings]);

  // Filtered borrowings list
  const filteredBorrowings = useMemo(() => {
    return borrowings.filter(b => {
      const timeliness = getReturnTimeliness(b.expectedReturnDate, b.actualReturnDate, b.status);

      // Search match
      const query = searchQuery.toLowerCase().trim();
      const matchSearch =
        !query ||
        b.itemNameSnapshot?.toLowerCase().includes(query) ||
        b.itemCode?.toLowerCase().includes(query) ||
        b.borrowerNameSnapshot?.toLowerCase().includes(query) ||
        (b.borrowerInstitution && b.borrowerInstitution.toLowerCase().includes(query)) ||
        b.purpose?.toLowerCase().includes(query);

      if (!matchSearch) return false;

      // Tab match
      if (selectedTab === 'borrowed') return b.status === 'borrowed';
      if (selectedTab === 'on_time') return b.status === 'returned' && timeliness.type === 'on_time';
      if (selectedTab === 'early') return b.status === 'returned' && timeliness.type === 'early';
      if (selectedTab === 'late') return b.status === 'returned' && timeliness.type === 'late';
      if (selectedTab === 'overdue') return b.status === 'borrowed' && timeliness.type === 'overdue';

      return true;
    });
  }, [borrowings, searchQuery, selectedTab]);

  // Live preview for modal return date
  const modalTimelinessPreview: ReturnTimelinessInfo | null = useMemo(() => {
    if (!selectedBorrowing || !returnDate) return null;
    return getReturnTimeliness(selectedBorrowing.expectedReturnDate, returnDate, 'returned');
  }, [selectedBorrowing, returnDate]);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', color: '#0f172a', marginBottom: '0.25rem', fontWeight: 800 }}>
            Manajemen Peminjaman & Pengembalian Logistik
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
            Pantau status peminjaman, ketepatan waktu pengembalian (sesuai, lebih cepat, atau telat), dan riwayat aset Sespimma Polri.
          </p>
        </div>
      </div>

      {/* Summary Statistics Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: '0.875rem',
          marginBottom: '1.5rem',
        }}
      >
        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #1e3a8a' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Total Peminjaman</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>{stats.total}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>Seluruh transaksi</div>
        </div>

        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #2563eb' }}>
          <div style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 600, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Clock size={14} />
            <span>Sedang Dipinjam</span>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1d4ed8', marginTop: '0.25rem' }}>{stats.borrowed}</div>
          <div style={{ fontSize: '0.75rem', color: stats.overdueOngoing > 0 ? '#b91c1c' : '#64748b', marginTop: '0.2rem', fontWeight: stats.overdueOngoing > 0 ? 600 : 400 }}>
            {stats.overdueOngoing > 0 ? `⚠️ ${stats.overdueOngoing} melewati tempo` : 'Semua dalam jadwal'}
          </div>
        </div>

        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #15803d' }}>
          <div style={{ fontSize: '0.75rem', color: '#15803d', fontWeight: 600, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <CheckCircle size={14} />
            <span>Kembali Sesuai</span>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#15803d', marginTop: '0.25rem' }}>{stats.onTime}</div>
          <div style={{ fontSize: '0.75rem', color: '#15803d', marginTop: '0.2rem' }}>Tepat waktu estimasi</div>
        </div>

        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #0284c7' }}>
          <div style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 600, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Zap size={14} />
            <span>Kembali Lebih Cepat</span>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0369a1', marginTop: '0.25rem' }}>{stats.early}</div>
          <div style={{ fontSize: '0.75rem', color: '#0284c7', marginTop: '0.2rem' }}>Sebelum batas waktu</div>
        </div>

        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #b91c1c' }}>
          <div style={{ fontSize: '0.75rem', color: '#b91c1c', fontWeight: 600, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <AlertTriangle size={14} />
            <span>Terlambat / Telat</span>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#b91c1c', marginTop: '0.25rem' }}>{stats.late}</div>
          <div style={{ fontSize: '0.75rem', color: '#b91c1c', marginTop: '0.2rem' }}>Melebihi estimasi</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ marginBottom: '1.25rem', padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Search Bar */}
          <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: '400px' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '2.25rem' }}
              placeholder="Cari barang, kode, nama peminjam, atau instansi..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              onClick={() => setSelectedTab('all')}
              className={`btn btn-sm ${selectedTab === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
            >
              Semua ({borrowings.length})
            </button>
            <button
              onClick={() => setSelectedTab('borrowed')}
              className={`btn btn-sm ${selectedTab === 'borrowed' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
            >
              Sedang Dipinjam ({stats.borrowed})
            </button>
            <button
              onClick={() => setSelectedTab('on_time')}
              className={`btn btn-sm ${selectedTab === 'on_time' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem', color: selectedTab === 'on_time' ? '#fff' : '#15803d' }}
            >
              Sesuai Estimasi ({stats.onTime})
            </button>
            <button
              onClick={() => setSelectedTab('early')}
              className={`btn btn-sm ${selectedTab === 'early' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem', color: selectedTab === 'early' ? '#fff' : '#0284c7' }}
            >
              Lebih Cepat ({stats.early})
            </button>
            <button
              onClick={() => setSelectedTab('late')}
              className={`btn btn-sm ${selectedTab === 'late' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem', color: selectedTab === 'late' ? '#fff' : '#b91c1c' }}
            >
              Telat ({stats.late})
            </button>
            {stats.overdueOngoing > 0 && (
              <button
                onClick={() => setSelectedTab('overdue')}
                className={`btn btn-sm ${selectedTab === 'overdue' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem', color: selectedTab === 'overdue' ? '#fff' : '#dc2626', borderColor: '#fca5a5' }}
              >
                ⚠️ Lewat Tempo ({stats.overdueOngoing})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem' }}>
          <div style={{ width: '36px', height: '36px', border: '3px solid #e2e8f0', borderTopColor: '#1e3a8a', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
          <p style={{ color: '#64748b' }}>Memuat data peminjaman logistik...</p>
        </div>
      ) : filteredBorrowings.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem' }}>
          <Repeat size={48} color="#94a3b8" style={{ marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.1rem', color: '#0f172a', marginBottom: '0.5rem' }}>
            {searchQuery || selectedTab !== 'all' ? 'Tidak ada data peminjaman yang cocok' : 'Belum ada data peminjaman'}
          </h3>
          <p style={{ color: '#64748b', fontSize: '0.875rem', maxWidth: '450px', margin: '0 auto 1.5rem' }}>
            {searchQuery || selectedTab !== 'all'
              ? 'Coba ubah kata kunci pencarian atau filter status yang dipilih.'
              : 'Peminjaman barang dapat diajukan dengan membuka halaman detail barang logistik.'}
          </p>
          {(searchQuery || selectedTab !== 'all') && (
            <button onClick={() => { setSearchQuery(''); setSelectedTab('all'); }} className="btn btn-secondary btn-sm">
              Reset Filter & Pencarian
            </button>
          )}
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Barang Logistik</th>
                <th>Peminjam & Instansi</th>
                <th>Periode Peminjaman</th>
                <th>Pengembalian Riil</th>
                <th>Status & Ketepatan Waktu</th>
                <th>Keperluan</th>
                {isStaff && <th style={{ textAlign: 'right' }}>Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {filteredBorrowings.map(b => {
                const timeliness = getReturnTimeliness(b.expectedReturnDate, b.actualReturnDate, b.status);

                return (
                  <tr key={b.id}>
                    {/* Item details */}
                    <td>
                      <Link to={`/item/${b.itemCode}`} style={{ textDecoration: 'none' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }} className="hover-link">{b.itemNameSnapshot}</div>
                        <div style={{ fontSize: '0.75rem', color: '#1e3a8a', fontFamily: 'monospace', fontWeight: 600 }}>{b.itemCode}</div>
                      </Link>
                    </td>

                    {/* Borrower details */}
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <UserCheck size={14} color="#64748b" />
                        <span>{b.borrowerNameSnapshot}</span>
                      </div>
                      {b.borrowerInstitution && (
                        <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.15rem' }}>
                          <Building size={12} />
                          <span>{b.borrowerInstitution}</span>
                        </div>
                      )}
                    </td>

                    {/* Dates */}
                    <td>
                      <div style={{ fontSize: '0.8rem', color: '#334155' }}>
                        <span style={{ color: '#64748b', fontSize: '0.725rem', display: 'block' }}>PINJAM:</span>
                        <strong>{formatIndoDate(b.borrowDate)}</strong>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#1e3a8a', marginTop: '0.25rem' }}>
                        <span style={{ color: '#64748b', fontSize: '0.725rem', display: 'block' }}>ESTIMASI KEMBALI:</span>
                        <strong>{formatIndoDate(b.expectedReturnDate)}</strong>
                      </div>
                    </td>

                    {/* Actual Return Date */}
                    <td>
                      {b.status === 'returned' && b.actualReturnDate ? (
                        <div>
                          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.85rem' }}>
                            {formatIndoDate(b.actualReturnDate)}
                          </div>
                          {b.notes && (
                            <div style={{ fontSize: '0.725rem', color: '#64748b', fontStyle: 'italic', marginTop: '0.15rem', maxWidth: '180px' }} title={b.notes}>
                              {b.notes}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontStyle: 'italic' }}>Belum dikembalikan</span>
                      )}
                    </td>

                    {/* Timeliness & Status Badge */}
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', alignItems: 'flex-start' }}>
                        {/* Status Label Badge */}
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.25rem 0.6rem',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            ...timeliness.badgeStyle
                          }}
                          title={timeliness.description}
                        >
                          {timeliness.type === 'on_time' && <CheckCircle size={13} />}
                          {timeliness.type === 'early' && <Zap size={13} />}
                          {timeliness.type === 'late' && <AlertTriangle size={13} />}
                          {timeliness.type === 'overdue' && <AlertCircle size={13} />}
                          {timeliness.type === 'due_today' && <Clock size={13} />}
                          {timeliness.type === 'active' && <Clock size={13} />}
                          <span>{timeliness.label}</span>
                        </span>

                        <span style={{ fontSize: '0.725rem', color: '#64748b' }}>
                          {timeliness.description}
                        </span>
                      </div>
                    </td>

                    {/* Purpose */}
                    <td style={{ maxWidth: '180px' }}>
                      <div style={{ fontSize: '0.8rem', color: '#334155', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                        {b.purpose || '-'}
                      </div>
                    </td>

                    {/* Actions */}
                    {isStaff && (
                      <td style={{ textAlign: 'right' }}>
                        {b.status === 'borrowed' ? (
                          <button
                            onClick={() => handleOpenReturnModal(b)}
                            className="btn btn-primary btn-sm"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap', fontWeight: 600 }}
                          >
                            <CheckCircle size={14} />
                            <span>Proses Kembali</span>
                          </button>
                        ) : (
                          <span style={{ color: '#15803d', fontSize: '0.75rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <CheckCircle2 size={14} />
                            <span>Selesai</span>
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Return Processing Modal */}
      {selectedBorrowing && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSubmittingReturn) setSelectedBorrowing(null);
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '520px',
              padding: '1.5rem',
              borderRadius: '16px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.08)',
              animation: 'modalSlideIn 0.2s ease-out'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', color: '#0f172a', fontWeight: 800, margin: 0 }}>
                  Formulir Pengembalian Barang
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>
                  Konfirmasi pengembalian dan ketepatan waktu aset logistik.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBorrowing(null)}
                disabled={isSubmittingReturn}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '0.25rem' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Item & Borrower Summary Card */}
            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '0.875rem',
                marginBottom: '1.25rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>{selectedBorrowing.itemNameSnapshot}</div>
                  <div style={{ fontSize: '0.75rem', color: '#1e3a8a', fontFamily: 'monospace', fontWeight: 600 }}>{selectedBorrowing.itemCode}</div>
                </div>
                <span className="badge badge-info">Sedang Dipinjam</span>
              </div>

              <div style={{ fontSize: '0.8rem', color: '#475569', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', borderTop: '1px dashed #cbd5e1', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.725rem', display: 'block' }}>PEMINJAM:</span>
                  <strong>{selectedBorrowing.borrowerNameSnapshot}</strong>
                  <div style={{ fontSize: '0.725rem', color: '#64748b' }}>{selectedBorrowing.borrowerInstitution || '-'}</div>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.725rem', display: 'block' }}>ESTIMASI KEMBALI:</span>
                  <strong style={{ color: '#1e3a8a' }}>{formatIndoDate(selectedBorrowing.expectedReturnDate)}</strong>
                  <div style={{ fontSize: '0.725rem', color: '#64748b' }}>Dipinjam sejak: {formatIndoDate(selectedBorrowing.borrowDate)}</div>
                </div>
              </div>
            </div>

            <form onSubmit={handleConfirmReturn}>
              {/* Actual Return Date Picker */}
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                  Tanggal Pengembalian Aktual <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="date"
                  required
                  className="form-input"
                  value={returnDate}
                  min={selectedBorrowing.borrowDate}
                  onChange={e => setReturnDate(e.target.value)}
                />
              </div>

              {/* Dynamic Timeliness Live Preview Badge */}
              {modalTimelinessPreview && (
                <div
                  style={{
                    marginBottom: '1rem',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    ...modalTimelinessPreview.badgeStyle
                  }}
                >
                  {modalTimelinessPreview.type === 'on_time' && <CheckCircle size={18} />}
                  {modalTimelinessPreview.type === 'early' && <Zap size={18} />}
                  {modalTimelinessPreview.type === 'late' && <AlertTriangle size={18} />}
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                      Status Pengembalian: {modalTimelinessPreview.label}
                    </div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>
                      {modalTimelinessPreview.description}
                    </div>
                  </div>
                </div>
              )}

              {/* Condition Notes */}
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                  Catatan Kondisi Barang Saat Kembali
                </label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  placeholder="Contoh: Dikembalikan dalam keadaan baik, lengkap bersama charger & kabel..."
                  value={returnNotes}
                  onChange={e => setReturnNotes(e.target.value)}
                />
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.625rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
                <button
                  type="button"
                  onClick={() => setSelectedBorrowing(null)}
                  disabled={isSubmittingReturn}
                  className="btn btn-secondary"
                  style={{ padding: '0.5rem 1rem' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReturn}
                  className="btn btn-primary"
                  style={{ padding: '0.5rem 1.25rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <CheckCircle size={16} />
                  <span>{isSubmittingReturn ? 'Memproses...' : 'Konfirmasi Pengembalian'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
