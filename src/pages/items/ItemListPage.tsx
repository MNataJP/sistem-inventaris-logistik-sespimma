import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getInventoryItems } from '@/services/inventoryService';
import { getCategories } from '@/services/masterDataService';
import { InventoryItem, Category } from '@/types/inventory';
import { exportItemsToExcel } from '@/utils/exportImport';
import { downloadSingleQRImage } from '@/utils/qrImageGenerator';
import { useAuth } from '@/context/AuthContext';
import {
  Search,
  Plus,
  Eye,
  Edit,
  Boxes,
  FileSpreadsheet,
  MapPin,
  Download
} from 'lucide-react';

export const ItemListPage: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCondition, setSelectedCondition] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [itemsData, catData] = await Promise.all([
          getInventoryItems(),
          getCategories(),
        ]);
        setItems(itemsData);
        setCategories(catData);
      } catch (err) {
        console.error('Error fetching inventory items:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const getCategoryName = (item: InventoryItem) => {
    if (item.categoryNameSnapshot) return item.categoryNameSnapshot;
    const found = categories.find(c => c.id === item.categoryId || c.name === item.categoryId);
    return found ? found.name : (item.categoryId || '-');
  };

  const filteredItems = items.filter(item => {
    const itemCatName = getCategoryName(item);
    const matchesSearch =
      (item.inventoryCode || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.brand || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.model || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.serialNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.building || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.room || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      itemCatName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCat = selectedCategory
      ? (item.categoryId === selectedCategory || itemCatName === selectedCategory || item.categoryNameSnapshot === selectedCategory)
      : true;
    const matchesCond = selectedCondition ? item.condition === selectedCondition : true;
    const matchesStat = selectedStatus ? item.status === selectedStatus : true;

    return matchesSearch && matchesCat && matchesCond && matchesStat;
  });

  const handleExport = () => {
    exportItemsToExcel(filteredItems);
  };

  const handleDownloadSingleLabel = async (item: InventoryItem) => {
    try {
      await downloadSingleQRImage(item);
    } catch (err: any) {
      alert('Gagal mengunduh gambar QR: ' + err.message);
    }
  };

  // Role check: super_admin, admin, and petugas can add & edit items
  const isStaff = user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'petugas';

  return (
    <div>
      {/* Header & Main Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.875rem' }}>
        <div>
          <h1 style={{ color: '#0f172a', marginBottom: '0.25rem' }}>
            Data Logistik & Inventaris Barang
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
            Kelola inventaris barang, penempatan lokasi, dan penanggung jawab aset Sespimma Polri.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Excel Export Button */}
          <button
            onClick={handleExport}
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1rem', fontWeight: 600, whiteSpace: 'nowrap' }}
          >
            <FileSpreadsheet size={16} />
            <span>Ekspor Excel</span>
          </button>

          {/* Add Item Button (Available for super_admin, admin, petugas) */}
          {isStaff && (
            <Link
              to="/items/new"
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1.15rem', fontWeight: 600, whiteSpace: 'nowrap' }}
            >
              <Plus size={16} />
              <span>Tambah Barang</span>
            </Link>
          )}
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="card" style={{ marginBottom: '1.25rem', padding: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.875rem' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Cari Barang</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '2.25rem' }}
                placeholder="INV-2026..., laptop, dell..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            </div>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Filter Kategori</label>
            <select className="form-select" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
              <option value="">Semua Kategori</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Filter Kondisi</label>
            <select className="form-select" value={selectedCondition} onChange={e => setSelectedCondition(e.target.value)}>
              <option value="">Semua Kondisi</option>
              <option value="Baik">Baik</option>
              <option value="Rusak Ringan">Rusak Ringan</option>
              <option value="Rusak Berat">Rusak Berat</option>
            </select>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Filter Status</label>
            <select className="form-select" value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}>
              <option value="">Semua Status</option>
              <option value="Tersedia">Tersedia</option>
              <option value="Dipinjam">Dipinjam</option>
              <option value="Dalam Maintenance">Dalam Maintenance</option>
            </select>
          </div>
        </div>
      </div>

      {/* Item List Content */}
      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ width: '36px', height: '36px', border: '3px solid #e2e8f0', borderTopColor: '#1e3a8a', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
          <p style={{ color: '#64748b' }}>Memuat daftar barang...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Boxes size={48} color="#94a3b8" style={{ marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: '#0f172a' }}>Tidak ada barang ditemukan</h3>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Coba ubah kata kunci pencarian atau filter yang Anda pilih.</p>
        </div>
      ) : (
        <>
          {/* 1. Desktop & Tablet View (>= 768px) */}
          <div className="table-container desktop-table-view">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ textAlign: 'center', width: '50px' }}>No.</th>
                  <th>Kode Inventaris</th>
                  <th>Nama Barang & Spesifikasi</th>
                  <th>Kategori</th>
                  <th>Lokasi</th>
                  <th>Kondisi</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item, index) => (
                  <tr key={item.id}>
                    <td style={{ textAlign: 'center', fontWeight: 600, color: '#64748b', fontSize: '0.875rem' }}>
                      {index + 1}
                    </td>
                    <td>
                      <Link
                        to={`/item/${item.inventoryCode}`}
                        style={{ fontWeight: 700, color: '#1e3a8a', fontFamily: 'monospace', fontSize: '0.9rem' }}
                      >
                        {item.inventoryCode}
                      </Link>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {item.brand} {item.model ? `• ${item.model}` : ''} {item.serialNumber ? `(S/N: ${item.serialNumber})` : ''}
                      </div>
                    </td>
                    <td>{getCategoryName(item)}</td>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}>{item.building}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Lantai {item.floor} - {item.room}</div>
                    </td>
                    <td>
                      <span className={`badge ${
                        item.condition === 'Baik'
                          ? 'badge-success'
                          : item.condition === 'Rusak Ringan'
                          ? 'badge-warning'
                          : 'badge-danger'
                      }`}>
                        {item.condition}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${
                        item.status === 'Tersedia'
                          ? 'badge-success'
                          : item.status === 'Dipinjam'
                          ? 'badge-info'
                          : 'badge-warning'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.375rem', justifyContent: 'flex-end' }}>
                        <Link to={`/item/${item.inventoryCode}`} className="btn btn-secondary btn-sm" title="Lihat Detail">
                          <Eye size={14} />
                        </Link>
                        {/* Direct Download Single QR Image Button */}
                        <button
                          onClick={() => handleDownloadSingleLabel(item)}
                          className="btn btn-secondary btn-sm"
                          title="Download Gambar QR (PNG)"
                        >
                          <Download size={14} color="#1e3a8a" />
                        </button>
                        {isStaff && (
                          <Link to={`/items/${item.id}/edit`} className="btn btn-secondary btn-sm" title="Edit Barang">
                            <Edit size={14} />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 2. Mobile Adaptive Card List View (< 768px) */}
          <div className="mobile-card-grid">
            {filteredItems.map(item => (
              <div key={item.id} className="item-mobile-card">
                <div className="item-mobile-card-header">
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.1rem' }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: '0.825rem', fontWeight: 700, color: '#1e3a8a', fontFamily: 'monospace' }}>
                      {item.inventoryCode}
                    </div>
                  </div>
                  <span className={`badge ${
                    item.condition === 'Baik' ? 'badge-success' : item.condition === 'Rusak Ringan' ? 'badge-warning' : 'badge-danger'
                  }`}>
                    {item.condition}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8rem', color: '#475569' }}>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '0.7rem', display: 'block' }}>STATUS</span>
                    <span className={`badge ${item.status === 'Tersedia' ? 'badge-success' : 'badge-info'}`} style={{ marginTop: '0.15rem' }}>
                      {item.status}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '0.7rem', display: 'block' }}>LOKASI</span>
                    <div style={{ fontWeight: 600, color: '#0f172a', marginTop: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <MapPin size={12} color="#1e3a8a" />
                      <span>{item.building || 'Sespimma'}</span>
                    </div>
                  </div>
                </div>

                <div className="item-mobile-card-actions">
                  <Link to={`/item/${item.inventoryCode}`} className="btn btn-secondary btn-sm">
                    <Eye size={14} />
                    <span>Detail</span>
                  </Link>
                  <button
                    onClick={() => handleDownloadSingleLabel(item)}
                    className="btn btn-secondary btn-sm"
                    title="Download Gambar QR (PNG)"
                  >
                    <Download size={14} color="#1e3a8a" />
                    <span>Gambar QR</span>
                  </button>
                  {isStaff && (
                    <Link to={`/items/${item.id}/edit`} className="btn btn-secondary btn-sm">
                      <Edit size={14} />
                      <span>Edit</span>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
