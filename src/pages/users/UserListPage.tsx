import React, { useEffect, useState } from 'react';
import { UserProfile, UserRole } from '@/types/auth';
import { useAuth } from '@/context/AuthContext';
import {
  getAllUsers,
  updateUserRole,
  toggleUserActiveStatus,
  deleteUserFromFirestore,
  approveUserRegistration,
  rejectUserRegistration
} from '@/services/userService';
import {
  Users,
  UserCheck,
  UserX,
  Trash2,
  Search,
  Filter,
  Shield,
  ShieldCheck,
  AlertTriangle,
  X,
  CheckCircle2,
  Check,
  Clock,
  Send
} from 'lucide-react';

export const UserListPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'active' | 'inactive'>('all');

  // Modal states
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Approval / Rejection states
  const [userToApprove, setUserToApprove] = useState<UserProfile | null>(null);
  const [approving, setApproving] = useState(false);

  const [userToReject, setUserToReject] = useState<UserProfile | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  // Notification feedback
  const [alertInfo, setAlertInfo] = useState<{ type: 'success' | 'error'; message: string; details?: string } | null>(null);

  const showAlert = (type: 'success' | 'error', message: string, details?: string) => {
    setAlertInfo({ type, message, details });
    setTimeout(() => {
      setAlertInfo(null);
    }, 6000);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const list = await getAllUsers();
      setUsers(list);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      showAlert('error', 'Gagal memuat data pengguna: ' + (err.message || 'Kesalahan jaringan'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (targetUid: string, roleName: UserRole) => {
    if (!currentUser) return;
    if (targetUid === currentUser.uid && roleName !== 'super_admin') {
      if (!window.confirm('PERINGATAN: Anda sedang mengubah peran akun Anda sendiri. Yakin ingin melanjutkan?')) {
        return;
      }
    }

    try {
      await updateUserRole(targetUid, roleName, { uid: currentUser.uid, name: currentUser.name });
      showAlert('success', `Peran pengguna berhasil diperbarui menjadi ${roleName.toUpperCase()}.`);
      await fetchUsers();
    } catch (err: any) {
      showAlert('error', 'Gagal mengubah peran: ' + err.message);
    }
  };

  const handleApproveConfirm = async () => {
    if (!userToApprove || !currentUser) return;
    setApproving(true);
    try {
      await approveUserRegistration(userToApprove, {
        uid: currentUser.uid,
        name: currentUser.name
      });
      showAlert(
        'success',
        `Pendaftaran ${userToApprove.name} telah DISETUJUI!`,
        `Email notifikasi persetujuan telah otomatis dikirimkan ke: ${userToApprove.email}`
      );
      setUserToApprove(null);
      await fetchUsers();
    } catch (err: any) {
      showAlert('error', 'Gagal menyetujui akun: ' + err.message);
    } finally {
      setApproving(false);
    }
  };

  const handleRejectConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToReject || !currentUser) return;
    setRejecting(true);
    try {
      await rejectUserRegistration(userToReject, rejectionReason, {
        uid: currentUser.uid,
        name: currentUser.name
      });
      showAlert(
        'success',
        `Pendaftaran ${userToReject.name} telah DITOLAK.`,
        `Email pemberitahuan penolakan telah dikirimkan ke: ${userToReject.email}`
      );
      setUserToReject(null);
      setRejectionReason('');
      await fetchUsers();
    } catch (err: any) {
      showAlert('error', 'Gagal menolak akun: ' + err.message);
    } finally {
      setRejecting(false);
    }
  };

  const handleToggleActive = async (targetUser: UserProfile) => {
    if (!currentUser) return;
    if (targetUser.uid === currentUser.uid) {
      alert('Anda tidak dapat menonaktifkan akun yang sedang Anda gunakan saat ini.');
      return;
    }

    try {
      await toggleUserActiveStatus(
        targetUser.uid,
        targetUser.isActive,
        targetUser.email,
        { uid: currentUser.uid, name: currentUser.name }
      );
      showAlert(
        'success',
        `Akun ${targetUser.email} berhasil ${!targetUser.isActive ? 'diaktifkan' : 'dinonaktifkan'}.`
      );
      await fetchUsers();
    } catch (err: any) {
      showAlert('error', 'Gagal mengubah status akun: ' + err.message);
    }
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete || !currentUser) return;
    if (userToDelete.uid === currentUser.uid) {
      alert('Anda tidak dapat menghapus akun Anda sendiri.');
      setUserToDelete(null);
      return;
    }

    setDeleting(true);
    try {
      await deleteUserFromFirestore(userToDelete, {
        uid: currentUser.uid,
        name: currentUser.name
      });
      showAlert('success', `Akun pengguna ${userToDelete.name} (${userToDelete.email}) berhasil dihapus permanen dari database.`);
      setUserToDelete(null);
      await fetchUsers();
    } catch (err: any) {
      showAlert('error', 'Gagal menghapus pengguna: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  // Metrik Penghitungan
  const totalUsers = users.length;
  const pendingUsersList = users.filter(u => u.status === 'pending');
  const totalPending = pendingUsersList.length;
  const totalActive = users.filter(u => u.isActive && u.status !== 'pending').length;
  const totalInactive = users.filter(u => !u.isActive && u.status !== 'pending').length;
  const isSuperAdmin = currentUser?.role === 'super_admin';

  // Filter & Search
  const filteredUsers = users.filter(u => {
    const matchesSearch =
      (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.unit || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.nrp || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === 'all' || u.role === roleFilter;

    let matchesTab = true;
    if (activeTab === 'pending') {
      matchesTab = u.status === 'pending';
    } else if (activeTab === 'active') {
      matchesTab = u.isActive && u.status !== 'pending';
    } else if (activeTab === 'inactive') {
      matchesTab = !u.isActive && u.status !== 'pending';
    }

    return matchesSearch && matchesRole && matchesTab;
  });

  return (
    <div>
      {/* Header Section */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', color: '#0f172a', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users size={26} color="#1e3a8a" />
          <span>Manajemen Pengguna & Konfirmasi Akun</span>
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
          Persetujuan pendaftaran akun baru, pengiriman email notifikasi otomatis, hak akses wewenang (*Role*), dan penghapusan pengguna dari database.
        </p>
      </div>

      {/* Alert Banner Feedback */}
      {alertInfo && (
        <div
          style={{
            padding: '0.875rem 1.25rem',
            borderRadius: '10px',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            backgroundColor: alertInfo.type === 'success' ? '#dcfce7' : '#fee2e2',
            border: `1px solid ${alertInfo.type === 'success' ? '#86efac' : '#fca5a5'}`,
            color: alertInfo.type === 'success' ? '#15803d' : '#b91c1c',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            animation: 'fadeIn 200ms ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem' }}>
            {alertInfo.type === 'success' ? <CheckCircle2 size={20} style={{ marginTop: '2px', flexShrink: 0 }} /> : <AlertTriangle size={20} style={{ marginTop: '2px', flexShrink: 0 }} />}
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{alertInfo.message}</div>
              {alertInfo.details && (
                <div style={{ fontSize: '0.825rem', marginTop: '0.25rem', opacity: 0.9 }}>
                  {alertInfo.details}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => setAlertInfo(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div
          className="card"
          style={{
            padding: '1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            cursor: 'pointer',
            border: activeTab === 'all' ? '2px solid #1e3a8a' : '1px solid var(--color-border)'
          }}
          onClick={() => setActiveTab('all')}
        >
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: '#eff6ff', color: '#1e3a8a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Total Pengguna</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a' }}>{totalUsers}</div>
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            cursor: 'pointer',
            border: activeTab === 'pending' ? '2px solid #d97706' : '1px solid var(--color-border)',
            backgroundColor: totalPending > 0 ? '#fffbeb' : '#ffffff'
          }}
          onClick={() => setActiveTab('pending')}
        >
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: '#fef3c7', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 700, textTransform: 'uppercase' }}>
              Menunggu Persetujuan
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#b45309', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>{totalPending}</span>
              {totalPending > 0 && (
                <span style={{ fontSize: '0.7rem', backgroundColor: '#f59e0b', color: '#ffffff', padding: '0.1rem 0.5rem', borderRadius: '999px', fontWeight: 600 }}>
                  Perlu Konfirmasi
                </span>
              )}
            </div>
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            cursor: 'pointer',
            border: activeTab === 'active' ? '2px solid #16a34a' : '1px solid var(--color-border)'
          }}
          onClick={() => setActiveTab('active')}
        >
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: '#dcfce7', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UserCheck size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Akun Aktif</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#15803d' }}>{totalActive}</div>
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            cursor: 'pointer',
            border: activeTab === 'inactive' ? '2px solid #dc2626' : '1px solid var(--color-border)'
          }}
          onClick={() => setActiveTab('inactive')}
        >
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: '#fee2e2', color: '#b91c1c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UserX size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Non-Aktif / Ditolak</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#b91c1c' }}>{totalInactive}</div>
          </div>
        </div>
      </div>

      {/* Tabs & Search Filter Bar */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
          <button
            onClick={() => setActiveTab('all')}
            className={`btn btn-sm ${activeTab === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: '20px' }}
          >
            Semua ({totalUsers})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`btn btn-sm ${activeTab === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
            style={{
              borderRadius: '20px',
              backgroundColor: activeTab === 'pending' ? '#d97706' : undefined,
              borderColor: activeTab === 'pending' ? '#d97706' : undefined,
              color: activeTab === 'pending' ? '#ffffff' : totalPending > 0 ? '#b45309' : undefined,
              fontWeight: totalPending > 0 ? 700 : 500
            }}
          >
            <Clock size={14} />
            <span>Menunggu Persetujuan ({totalPending})</span>
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`btn btn-sm ${activeTab === 'active' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: '20px' }}
          >
            Disetujui / Aktif ({totalActive})
          </button>
          <button
            onClick={() => setActiveTab('inactive')}
            className={`btn btn-sm ${activeTab === 'inactive' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: '20px' }}
          >
            Non-Aktif / Ditolak ({totalInactive})
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '2.4rem' }}
              placeholder="Cari nama, NRP, email, unit..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={18} color="#64748b" style={{ flexShrink: 0 }} />
            <select
              className="form-select"
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
            >
              <option value="all">Semua Peran (Role)</option>
              <option value="super_admin">Super Admin</option>
              <option value="admin">Admin Logistik</option>
              <option value="petugas">Petugas Gudang</option>
              <option value="user">User Standar</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table / Card Content */}
      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTopColor: '#1e3a8a', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
          <p style={{ color: '#64748b', fontWeight: 500 }}>Memuat data pengguna dari database...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <Users size={48} color="#cbd5e1" style={{ margin: '0 auto 0.75rem' }} />
          <h3 style={{ color: '#475569', marginBottom: '0.5rem' }}>Tidak Ada Pengguna Ditemukan</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
            {activeTab === 'pending'
              ? 'Tidak ada permohonan pendaftaran akun yang sedang menunggu persetujuan.'
              : 'Tidak ada data pengguna yang cocok dengan kriteria pencarian atau filter yang dipilih.'}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="table-container desktop-table-view">
            <table className="table">
              <thead>
                <tr>
                  <th>Pengguna & NRP</th>
                  <th>Unit / Satker</th>
                  <th>Peran Sistem (*Role*)</th>
                  <th>Status Persetujuan</th>
                  <th style={{ textAlign: 'right', minWidth: '260px' }}>Aksi & Keputusan</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => {
                  const isSelf = u.uid === currentUser?.uid;
                  const isPending = u.status === 'pending';
                  const isRejected = u.status === 'rejected';

                  return (
                    <tr
                      key={u.uid}
                      style={{
                        backgroundColor: isPending ? '#fffdf7' : !u.isActive ? '#fffbfa' : undefined
                      }}
                    >
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              backgroundColor: isPending ? '#fef3c7' : u.role === 'super_admin' ? '#1e3a8a' : u.role === 'admin' ? '#0369a1' : '#e2e8f0',
                              color: isPending ? '#b45309' : u.role === 'super_admin' || u.role === 'admin' ? '#ffffff' : '#475569',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '0.9rem',
                              flexShrink: 0
                            }}
                          >
                            {isPending ? <Clock size={18} /> : (u.name || u.email || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                              <span>{u.name || 'Tanpa Nama'}</span>
                              {isSelf && (
                                <span style={{ fontSize: '0.65rem', backgroundColor: '#dbeafe', color: '#1e40af', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 600 }}>
                                  Anda
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                              {u.email} {u.nrp && `• NRP: ${u.nrp}`}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div style={{ color: '#475569', fontSize: '0.875rem' }}>{u.unit || 'Sespimma Polri'}</div>
                      </td>

                      <td>
                        <select
                          className="form-select"
                          style={{
                            fontSize: '0.8rem',
                            padding: '0.3rem 0.6rem',
                            minHeight: '34px',
                            fontWeight: 600,
                            maxWidth: '160px',
                            backgroundColor: !isSuperAdmin ? '#f1f5f9' : '#ffffff'
                          }}
                          value={u.role}
                          onChange={e => handleRoleChange(u.uid, e.target.value as UserRole)}
                          disabled={!isSuperAdmin}
                          title={!isSuperAdmin ? 'Hanya Super Admin yang dapat mengubah peran' : 'Ubah peran'}
                        >
                          <option value="super_admin">SUPER_ADMIN</option>
                          <option value="admin">ADMIN</option>
                          <option value="petugas">PETUGAS</option>
                          <option value="user">USER</option>
                        </select>
                      </td>

                      <td>
                        {isPending ? (
                          <span className="badge badge-warning" style={{ backgroundColor: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}>
                            <Clock size={12} />
                            <span>Menunggu Persetujuan</span>
                          </span>
                        ) : isRejected ? (
                          <span className="badge badge-danger" title={u.rejectionReason ? `Alasan: ${u.rejectionReason}` : 'Ditolak'}>
                            <X size={12} />
                            <span>Ditolak</span>
                          </span>
                        ) : (
                          <span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`}>
                            {u.isActive ? <Check size={12} /> : <UserX size={12} />}
                            <span>{u.isActive ? 'Disetujui / Aktif' : 'Non-Aktif'}</span>
                          </span>
                        )}
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          {/* Approval / Rejection Actions for Pending Users */}
                          {isSuperAdmin && isPending && (
                            <>
                              <button
                                type="button"
                                onClick={() => setUserToApprove(u)}
                                className="btn btn-sm btn-primary"
                                style={{ backgroundColor: '#16a34a', borderColor: '#16a34a', color: '#ffffff', padding: '0.375rem 0.75rem' }}
                                title="Setujui pendaftaran dan kirim email notifikasi"
                              >
                                <Check size={15} />
                                <span>Setujui</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setUserToReject(u);
                                  setRejectionReason('');
                                }}
                                className="btn btn-sm btn-secondary"
                                style={{ color: '#b91c1c', borderColor: '#fca5a5', padding: '0.375rem 0.75rem' }}
                                title="Tolak pendaftaran dan kirim email penolakan"
                              >
                                <X size={15} />
                                <span>Tolak</span>
                              </button>
                            </>
                          )}

                          {/* Toggle Active Button for already processed users */}
                          {isSuperAdmin && !isPending && (
                            <button
                              type="button"
                              onClick={() => handleToggleActive(u)}
                              disabled={isSelf}
                              className={`btn btn-sm ${u.isActive ? 'btn-secondary' : 'btn-primary'}`}
                              style={{
                                opacity: isSelf ? 0.5 : 1,
                                cursor: isSelf ? 'not-allowed' : 'pointer'
                              }}
                              title={isSelf ? 'Tidak dapat menonaktifkan akun sendiri' : u.isActive ? 'Nonaktifkan akun' : 'Aktifkan akun'}
                            >
                              {u.isActive ? <UserX size={14} color="#b91c1c" /> : <UserCheck size={14} />}
                              <span>{u.isActive ? 'Nonaktifkan' : 'Aktifkan'}</span>
                            </button>
                          )}

                          {/* Delete User Button */}
                          {isSuperAdmin && (
                            <button
                              type="button"
                              onClick={() => setUserToDelete(u)}
                              disabled={isSelf}
                              className="btn btn-sm btn-danger"
                              style={{
                                opacity: isSelf ? 0.4 : 1,
                                cursor: isSelf ? 'not-allowed' : 'pointer',
                                padding: '0.375rem 0.625rem'
                              }}
                              title={isSelf ? 'Tidak dapat menghapus akun Anda sendiri' : 'Hapus pengguna dari database'}
                            >
                              <Trash2 size={14} />
                              <span>Hapus</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Grid View */}
          <div className="mobile-card-grid">
            {filteredUsers.map(u => {
              const isSelf = u.uid === currentUser?.uid;
              const isPending = u.status === 'pending';
              const isRejected = u.status === 'rejected';

              return (
                <div
                  key={u.uid}
                  className="item-mobile-card"
                  style={{
                    borderLeft: `4px solid ${isPending ? '#f59e0b' : u.isActive ? '#22c55e' : '#ef4444'}`
                  }}
                >
                  <div className="item-mobile-card-header">
                    <div>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <span>{u.name || 'Tanpa Nama'}</span>
                        {isSelf && (
                          <span style={{ fontSize: '0.65rem', backgroundColor: '#dbeafe', color: '#1e40af', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 600 }}>
                            Anda
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.825rem', color: '#64748b' }}>
                        {u.email} {u.nrp && `• NRP: ${u.nrp}`}
                      </div>
                    </div>
                    {isPending ? (
                      <span className="badge badge-warning" style={{ backgroundColor: '#fef3c7', color: '#b45309' }}>
                        Pending
                      </span>
                    ) : (
                      <span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`}>
                        {u.isActive ? 'Aktif' : 'Non-Aktif'}
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                      <span>Unit Kerja:</span>
                      <strong style={{ color: '#334155' }}>{u.unit || 'Sespimma Polri'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b' }}>
                      <span>Peran Sistem:</span>
                      <select
                        className="form-select"
                        style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', width: 'auto', minHeight: '30px' }}
                        value={u.role}
                        onChange={e => handleRoleChange(u.uid, e.target.value as UserRole)}
                        disabled={!isSuperAdmin}
                      >
                        <option value="super_admin">SUPER_ADMIN</option>
                        <option value="admin">ADMIN</option>
                        <option value="petugas">PETUGAS</option>
                        <option value="user">USER</option>
                      </select>
                    </div>
                  </div>

                  {isSuperAdmin && (
                    <div className="item-mobile-card-actions">
                      {isPending ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setUserToApprove(u)}
                            className="btn btn-sm btn-primary"
                            style={{ backgroundColor: '#16a34a', borderColor: '#16a34a', flex: 1 }}
                          >
                            <Check size={14} />
                            <span>Setujui</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setUserToReject(u);
                              setRejectionReason('');
                            }}
                            className="btn btn-sm btn-secondary"
                            style={{ color: '#b91c1c', flex: 1 }}
                          >
                            <X size={14} />
                            <span>Tolak</span>
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleToggleActive(u)}
                          disabled={isSelf}
                          className={`btn btn-sm ${u.isActive ? 'btn-secondary' : 'btn-primary'}`}
                          style={{ opacity: isSelf ? 0.5 : 1, flex: 1 }}
                        >
                          {u.isActive ? <UserX size={14} color="#b91c1c" /> : <UserCheck size={14} />}
                          <span>{u.isActive ? 'Nonaktifkan' : 'Aktifkan'}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setUserToDelete(u)}
                        disabled={isSelf}
                        className="btn btn-sm btn-danger"
                        style={{ opacity: isSelf ? 0.4 : 1, flex: isPending ? 'none' : 1 }}
                      >
                        <Trash2 size={14} />
                        <span>Hapus</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Modal Konfirmasi Persetujuan (Approve) */}
      {userToApprove && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.25rem' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: '#dcfce7',
                  color: '#15803d',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Check size={26} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.2rem', color: '#0f172a', marginBottom: '0.25rem' }}>
                  Setujui Pendaftaran Akun
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
                  Akun pengguna akan diaktifkan dan email notifikasi resmi akan otomatis dikirimkan ke pendaftar.
                </p>
              </div>
              <button
                onClick={() => setUserToApprove(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1.5rem',
                fontSize: '0.875rem'
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '0.5rem', marginBottom: '0.375rem' }}>
                <span style={{ color: '#64748b' }}>Nama:</span>
                <strong style={{ color: '#0f172a' }}>{userToApprove.name}</strong>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '0.5rem', marginBottom: '0.375rem' }}>
                <span style={{ color: '#64748b' }}>Email:</span>
                <span style={{ color: '#0f172a', fontWeight: 600 }}>{userToApprove.email}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '0.5rem', marginBottom: '0.375rem' }}>
                <span style={{ color: '#64748b' }}>Unit / Satker:</span>
                <span style={{ color: '#475569' }}>{userToApprove.unit || 'Sespimma Polri'}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '0.5rem' }}>
                <span style={{ color: '#64748b' }}>Peran Diberikan:</span>
                <span style={{ fontWeight: 700, color: '#1e3a8a' }}>{(userToApprove.role || 'user').toUpperCase()}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setUserToApprove(null)}
                disabled={approving}
                className="btn btn-secondary"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleApproveConfirm}
                disabled={approving}
                className="btn btn-primary"
                style={{ backgroundColor: '#16a34a', borderColor: '#16a34a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                {approving ? (
                  <>
                    <div style={{ width: '16px', height: '16px', border: '2px solid #ffffff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    <span>Memproses & Mengirim Email...</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>Setujui & Kirim Email</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Penolakan (Reject) */}
      {userToReject && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.25rem' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: '#fee2e2',
                  color: '#b91c1c',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <X size={26} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.2rem', color: '#0f172a', marginBottom: '0.25rem' }}>
                  Tolak Pendaftaran Akun
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
                  Akun akan berstatus Ditolak dan email pemberitahuan penolakan akan dikirimkan ke pendaftar.
                </p>
              </div>
              <button
                onClick={() => setUserToReject(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRejectConfirm}>
              <div
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '0.875rem 1rem',
                  marginBottom: '1.25rem',
                  fontSize: '0.875rem'
                }}
              >
                <div><strong>Nama:</strong> {userToReject.name}</div>
                <div><strong>Email:</strong> {userToReject.email}</div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Alasan Penolakan Pendaftaran</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  required
                  placeholder="Contoh: NRP tidak terdaftar dalam database personel aktif Sespimma Polri / Data unit tidak valid."
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                />
                <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                  Alasan ini akan dicantumkan secara jelas pada email yang dikirim ke pendaftar.
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setUserToReject(null)}
                  disabled={rejecting}
                  className="btn btn-secondary"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={rejecting}
                  className="btn btn-danger"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#dc2626', color: '#ffffff' }}
                >
                  {rejecting ? (
                    <>
                      <div style={{ width: '16px', height: '16px', border: '2px solid #ffffff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                      <span>Mengirim Penolakan...</span>
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      <span>Tolak & Kirim Email</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus User */}
      {userToDelete && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.25rem' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: '#fee2e2',
                  color: '#b91c1c',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Trash2 size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.2rem', color: '#0f172a', marginBottom: '0.25rem' }}>
                  Hapus Pengguna dari Database
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
                  Tindakan ini akan menghapus data profil pengguna secara permanen dari sistem database.
                </p>
              </div>
              <button
                onClick={() => setUserToDelete(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1.5rem',
                fontSize: '0.875rem'
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '0.5rem', marginBottom: '0.375rem' }}>
                <span style={{ color: '#64748b' }}>Nama:</span>
                <strong style={{ color: '#0f172a' }}>{userToDelete.name || '-'}</strong>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '0.5rem', marginBottom: '0.375rem' }}>
                <span style={{ color: '#64748b' }}>Email:</span>
                <span style={{ color: '#0f172a', fontFamily: 'monospace' }}>{userToDelete.email}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '0.5rem', marginBottom: '0.375rem' }}>
                <span style={{ color: '#64748b' }}>Peran:</span>
                <span style={{ fontWeight: 600, color: '#1e3a8a' }}>{(userToDelete.role || 'user').toUpperCase()}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '0.5rem' }}>
                <span style={{ color: '#64748b' }}>Unit:</span>
                <span style={{ color: '#475569' }}>{userToDelete.unit || 'Sespimma Polri'}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                disabled={deleting}
                className="btn btn-secondary"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="btn btn-danger"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#dc2626', color: '#ffffff' }}
              >
                {deleting ? (
                  <>
                    <div style={{ width: '16px', height: '16px', border: '2px solid #ffffff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    <span>Ya, Hapus Permanen</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
