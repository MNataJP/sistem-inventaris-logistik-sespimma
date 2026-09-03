import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { getInventoryItems } from '@/services/inventoryService';
import { getCategories } from '@/services/masterDataService';
import { InventoryItem, Category } from '@/types/inventory';
import { generateQRLabelsPDF } from '@/utils/pdfLabelGenerator';
import { downloadSingleQRImage } from '@/utils/qrImageGenerator';
import { QRCodeSVG } from 'qrcode.react';
import {
  ArrowLeft,
  Download,
  CheckSquare,
  Square,
  Search,
  FileText,
  Boxes,
  Sparkles,
  Info
} from 'lucide-react';

export const QRPrintPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialCode = searchParams.get('code');

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [itemsData, catsData] = await Promise.all([
          getInventoryItems(),
          getCategories()
        ]);
        setItems(itemsData);
        setCategories(catsData);

        if (initialCode) {
          setSelectedCodes([initialCode]);
        } else if (itemsData.length > 0) {
          // Default: pilih semua barang untuk kemudahan download kolektif
          setSelectedCodes(itemsData.map(i => i.inventoryCode));
        }
      } catch (err) {
        console.error('Error loading items for label download:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [initialCode]);

  const toggleSelectCode = (code: string) => {
    if (selectedCodes.includes(code)) {
      setSelectedCodes(selectedCodes.filter(c => c !== code));
    } else {
      setSelectedCodes([...selectedCodes, code]);
    }
  };

  const selectAll = () => {
    setSelectedCodes(filteredItems.map(i => i.inventoryCode));
  };

  const clearAll = () => {
    setSelectedCodes([]);
  };

  const filteredItems = items.filter(item => {
    const matchesSearch =
      (item.inventoryCode || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.brand || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.building || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCat = selectedCategory ? (item.categoryId === selectedCategory || item.categoryNameSnapshot === selectedCategory) : true;
    return matchesSearch && matchesCat;
  });

  const selectedItems = items.filter(i => selectedCodes.includes(i.inventoryCode));

  const handleDownload = async () => {
    if (selectedItems.length === 0) {
      alert('Pilih setidaknya 1 barang untuk mengunduh QR Code.');
      return;
    }
    setDownloading(true);
    try {
      if (selectedItems.length === 1) {
        // Download 1 item as single high-resolution QR image (PNG)
        await downloadSingleQRImage(selectedItems[0]);
      } else {
        // Download multiple items as collective A4 PDF
        const filename = `Label_QR_Kolektif_Sespimma_${selectedItems.length}_Barang.pdf`;
        await generateQRLabelsPDF(selectedItems, filename);
      }
    } catch (err: any) {
      console.error('Error generating QR download:', err);
      alert('Terjadi kesalahan saat mengunduh: ' + err.message);
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadSingleCardQR = async (item: InventoryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await downloadSingleQRImage(item);
    } catch (err: any) {
      alert('Gagal mengunduh gambar QR: ' + err.message);
    }
  };

  return (
    <div>
      {/* Top Header Bar */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <Link to="/items" className="btn btn-secondary btn-sm">
            <ArrowLeft size={16} />
            <span>Kembali ke Data Barang</span>
          </Link>
          <div>
            <h1 style={{ fontSize: '1.5rem', margin: 0, color: '#0f172a' }}>
              Download Label QR Code Barang
            </h1>
            <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
              Unduh Gambar QR satuan (PNG) atau stiker label kolektif format PDF (Template A4).
            </p>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleDownload}
          disabled={selectedItems.length === 0 || downloading}
          className="btn btn-primary"
          style={{ padding: '0.625rem 1.25rem', fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Download size={18} />
          <span>
            {downloading
              ? 'Memproses...'
              : selectedItems.length === 1
              ? `Download 1 Gambar QR (PNG)`
              : `Download ${selectedItems.length} Label (PDF)`}
          </span>
        </button>
      </div>

      {/* Info Banner */}
      <div
        style={{
          padding: '0.875rem 1.25rem',
          borderRadius: '10px',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          color: '#1e40af',
          fontSize: '0.875rem'
        }}
      >
        <Info size={20} style={{ flexShrink: 0 }} />
        <div>
          <strong>Format Cetak Standar Kertas A4:</strong> File PDF akan diunduh dengan tata letak <strong>2 kolom per baris (1 baris 2 label)</strong> siap cetak pada kertas stiker / label A4 resmi Sespimma Polri.
        </div>
      </div>

      {/* Filter & Selection Control Panel */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={18} color="#1e3a8a" />
            <h3 style={{ fontSize: '1rem', color: '#0f172a', margin: 0 }}>
              Pilih Barang untuk Diunduh Labelnya ({selectedItems.length} terpilih)
            </h3>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={selectAll} className="btn btn-secondary btn-sm" style={{ fontSize: '0.8rem' }}>
              Pilih Semua Sesuai Filter ({filteredItems.length})
            </button>
            <button onClick={clearAll} className="btn btn-secondary btn-sm" style={{ fontSize: '0.8rem' }}>
              Kosongkan Pilihan
            </button>
          </div>
        </div>

        {/* Filter Inputs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '2.25rem' }}
              placeholder="Cari kode, nama barang, merk..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            className="form-select"
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
          >
            <option value="">Semua Kategori</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Item Selection Pills / Checkbox List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b' }}>
            Memuat daftar barang...
          </div>
        ) : filteredItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8' }}>
            Tidak ada barang yang cocok dengan filter.
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: '0.625rem',
              maxHeight: '220px',
              overflowY: 'auto',
              padding: '0.25rem',
              border: '1px solid #f1f5f9',
              borderRadius: '8px'
            }}
          >
            {filteredItems.map(item => {
              const isChecked = selectedCodes.includes(item.inventoryCode);
              return (
                <div
                  key={item.id}
                  onClick={() => toggleSelectCode(item.inventoryCode)}
                  style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    border: isChecked ? '1.5px solid #1e3a8a' : '1px solid #e2e8f0',
                    backgroundColor: isChecked ? '#eff6ff' : '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.625rem',
                    transition: 'all 120ms ease',
                    userSelect: 'none'
                  }}
                >
                  {isChecked ? (
                    <CheckSquare size={18} color="#1e3a8a" style={{ flexShrink: 0 }} />
                  ) : (
                    <Square size={18} color="#cbd5e1" style={{ flexShrink: 0 }} />
                  )}
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                    <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.85rem' }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#1e3a8a', fontFamily: 'monospace', fontWeight: 700 }}>
                      {item.inventoryCode}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Live Preview Area (Template A4: 1 baris berisi 2 label) */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.15rem', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={18} color="#1e3a8a" />
            <span>Pratinjau Tata Letak Label (1 Baris = 2 Label QR)</span>
          </h2>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
            {selectedItems.length} label siap diunduh
          </span>
        </div>

        {selectedItems.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
            <Boxes size={44} color="#cbd5e1" style={{ margin: '0 auto 0.75rem' }} />
            <h3 style={{ color: '#475569', marginBottom: '0.25rem' }}>Belum Ada Label yang Dipilih</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
              Silakan centang barang di atas atau klik "Pilih Semua" untuk mengunduh label QR Code.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
              gap: '1.25rem',
            }}
          >
            {selectedItems.map((item) => (
              <div
                key={item.id}
                style={{
                  border: '1.5px solid #1e3a8a',
                  borderRadius: '10px',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.08)',
                  overflow: 'hidden',
                  position: 'relative'
                }}
              >
                {/* Navy Header */}
                <div
                  style={{
                    backgroundColor: '#1e3a8a',
                    color: '#ffffff',
                    padding: '0.4rem 0.75rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    letterSpacing: '0.5px'
                  }}
                >
                  <span>SESPIMMA LEMDIKLAT POLRI</span>
                  <span style={{ fontSize: '0.65rem', opacity: 0.85, fontWeight: 500 }}>ASET LOGISTIK</span>
                </div>

                {/* Card Body */}
                <div style={{ padding: '0.75rem', display: 'flex', gap: '0.875rem', alignItems: 'center' }}>
                  {/* Left: QR Code Preview & Direct PNG Download */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      backgroundColor: '#f8fafc',
                      padding: '0.4rem',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      flexShrink: 0
                    }}
                  >
                    <QRCodeSVG
                      value={item.qrUrl || `${window.location.origin}/item/${item.inventoryCode}`}
                      size={100}
                      level="M"
                      includeMargin={false}
                    />
                    <span style={{ fontSize: '0.55rem', fontWeight: 700, color: '#64748b', marginTop: '0.25rem' }}>
                      SCAN UNTUK DETAIL
                    </span>
                    <button
                      onClick={(e) => handleDownloadSingleCardQR(item, e)}
                      className="btn btn-secondary btn-sm"
                      style={{
                        marginTop: '0.35rem',
                        padding: '0.2rem 0.4rem',
                        fontSize: '0.68rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        borderRadius: '6px',
                        width: '100%',
                        justifyContent: 'center',
                        fontWeight: 600,
                        color: '#1e3a8a'
                      }}
                      title="Download 1 Gambar QR ini (PNG)"
                    >
                      <Download size={11} />
                      <span>Unduh PNG</span>
                    </button>
                  </div>

                  {/* Right: Metadata */}
                  <div style={{ flex: 1, minWidth: 0, fontSize: '0.8rem' }}>
                    <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.95rem', color: '#1e3a8a', marginBottom: '0.2rem' }}>
                      {item.inventoryCode}
                    </div>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.875rem', lineHeight: 1.3, marginBottom: '0.35rem', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {item.name}
                    </div>
                    {item.brand && (
                      <div style={{ color: '#475569', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                        {item.brand} {item.model ? `(${item.model})` : ''}
                      </div>
                    )}
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.15rem' }}>
                      Kat: <strong style={{ color: '#1e293b' }}>{item.categoryNameSnapshot || item.categoryId || '-'}</strong>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.15rem' }}>
                      Lok: <strong style={{ color: '#1e293b' }}>{item.building} ({item.room})</strong>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Kondisi:{' '}
                      <span style={{ fontWeight: 700, color: item.condition === 'Baik' ? '#15803d' : '#b91c1c' }}>
                        {item.condition}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer Warning Strip */}
                <div
                  style={{
                    backgroundColor: '#f8fafc',
                    borderTop: '1px solid #f1f5f9',
                    padding: '0.25rem 0.5rem',
                    textAlign: 'center',
                    fontSize: '0.6rem',
                    color: '#94a3b8',
                    fontStyle: 'italic'
                  }}
                >
                  BARANG MILIK NEGARA - DILARANG MEMINDAHTANGANKAN TANPA IZIN
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
