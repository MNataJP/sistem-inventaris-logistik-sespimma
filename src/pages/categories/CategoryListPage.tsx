import React, { useEffect, useState } from 'react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/services/masterDataService';
import { Category } from '@/types/inventory';
import { useAuth } from '@/context/AuthContext';
import {
  Tags,
  Plus,
  X,
  Search,
  Edit,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  FolderOpen
} from 'lucide-react';

export const CategoryListPage: React.FC = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  const isAdmin = user?.role === 'super_admin' || user?.role === 'admin';

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Alert Feedback
  const [alertInfo, setAlertInfo] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlertInfo({ type, message });
    setTimeout(() => setAlertInfo(null), 5000);
  };

  const fetchCats = async () => {
    setLoading(true);
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (err: any) {
      console.error('Error fetching categories:', err);
      showAlert('error', 'Gagal memuat kategori: ' + (err.message || 'Kesalahan jaringan'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCats();
  }, []);

  const openAddModal = () => {
    setEditingCategory(null);
    setName('');
    setDescription('');
    setShowModal(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setDescription(cat.description || '');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, name, description);
        showAlert('success', `Kategori "${name}" berhasil diperbarui.`);
      } else {
        await createCategory(name, description);
        showAlert('success', `Kategori baru "${name}" berhasil ditambahkan.`);
      }
      setShowModal(false);
      setName('');
      setDescription('');
      await fetchCats();
    } catch (err: any) {
      showAlert('error', 'Gagal menyimpan kategori: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;
    setDeleting(true);
    try {
      await deleteCategory(categoryToDelete.id);
      showAlert('success', `Kategori "${categoryToDelete.name}" berhasil dihapus.`);
      setCategoryToDelete(null);
      await fetchCats();
    } catch (err: any) {
      showAlert('error', 'Gagal menghapus kategori: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  const filteredCategories = categories.filter(c =>
    (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', color: '#0f172a', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Tags size={24} color="#1e3a8a" />
            <span>Master Kategori Barang</span>
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
            Pengelompokan jenis peralatan dan perlengkapan inventaris logistik Sespimma Polri.
          </p>
        </div>

        {isAdmin && (
          <button onClick={openAddModal} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={16} />
            <span>Tambah Kategori</span>
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

      {/* Search Input Bar */}
      <div className="card" style={{ padding: '0.875rem 1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative', maxWidth: '400px' }}>
          <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.4rem' }}
            placeholder="Cari kategori barang..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Content Table / Cards */}
      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <div style={{ width: '38px', height: '38px', border: '3px solid #e2e8f0', borderTopColor: '#1e3a8a', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
          <p style={{ color: '#64748b' }}>Memuat kategori barang...</p>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <FolderOpen size={44} color="#cbd5e1" style={{ margin: '0 auto 0.75rem' }} />
          <h3 style={{ color: '#475569', marginBottom: '0.375rem' }}>Tidak Ada Kategori</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
            {searchTerm ? 'Tidak ada kategori yang cocok dengan pencarian.' : 'Belum ada kategori barang yang terdaftar.'}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="table-container desktop-table-view">
            <table className="table">
              <thead>
                <tr>
                  <th>Nama Kategori</th>
                  <th>Deskripsi & Contoh Peralatan</th>
                  <th>Status</th>
                  {isAdmin && <th style={{ textAlign: 'right', minWidth: '140px' }}>Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#1e3a8a', display: 'inline-block' }} />
                        <span>{c.name}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ color: '#475569', fontSize: '0.875rem' }}>{c.description || '-'}</div>
                    </td>
                    <td>
                      <span className="badge badge-success">Aktif</span>
                    </td>
                    {isAdmin && (
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => openEditModal(c)}
                            className="btn btn-sm btn-secondary"
                            style={{ padding: '0.3rem 0.6rem' }}
                            title="Edit Kategori"
                          >
                            <Edit size={14} />
                            <span>Edit</span>
                          </button>
                          {isSuperAdmin && (
                            <button
                              onClick={() => setCategoryToDelete(c)}
                              className="btn btn-sm btn-danger"
                              style={{ padding: '0.3rem 0.6rem' }}
                              title="Hapus Kategori"
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
            {filteredCategories.map(c => (
              <div key={c.id} className="item-mobile-card">
                <div className="item-mobile-card-header">
                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem' }}>{c.name}</div>
                  <span className="badge badge-success">Aktif</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                  {c.description || 'Tidak ada deskripsi.'}
                </p>
                {isAdmin && (
                  <div className="item-mobile-card-actions">
                    <button
                      onClick={() => openEditModal(c)}
                      className="btn btn-sm btn-secondary"
                    >
                      <Edit size={14} />
                      <span>Edit</span>
                    </button>
                    {isSuperAdmin && (
                      <button
                        onClick={() => setCategoryToDelete(c)}
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

      {/* Modal Tambah / Edit Kategori */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', color: '#0f172a' }}>
                {editingCategory ? 'Edit Kategori Barang' : 'Tambah Kategori Baru'}
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
                <label className="form-label">Nama Kategori *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="Elektronik & TI, Kendaraan Dinas, Senjata..."
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Deskripsi & Rincian Jenis</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="Contoh: Laptop, Komputer Desktop, Printer, Scanner, Projector"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
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
                  {saving ? 'Menyimpan...' : 'Simpan Kategori'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Kategori */}
      {categoryToDelete && (
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
              <h3 style={{ fontSize: '1.2rem', color: '#0f172a', marginBottom: '0.5rem' }}>Hapus Kategori?</h3>
              <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
                Apakah Anda yakin ingin menghapus kategori <strong>{categoryToDelete.name}</strong>?
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setCategoryToDelete(null)}
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
                {deleting ? 'Menghapus...' : 'Ya, Hapus Kategori'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
