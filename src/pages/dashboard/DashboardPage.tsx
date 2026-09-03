import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getInventoryItems } from '@/services/inventoryService';
import { getAllBorrowings } from '@/services/borrowingService';
import { getScanLogs } from '@/services/scanLogService';
import { InventoryItem } from '@/types/inventory';
import { BorrowingRecord } from '@/types/borrowing';
import { ScanLog } from '@/types/audit';
import {
  Boxes,
  CheckCircle,
  AlertTriangle,
  AlertOctagon,
  Wrench,
  Repeat,
  QrCode,
  ArrowRight,
  ShieldCheck,
  TrendingUp
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';

export const DashboardPage: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [borrowings, setBorrowings] = useState<BorrowingRecord[]>([]);
  const [recentScans, setRecentScans] = useState<ScanLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [itemsData, borrowingsData, scansData] = await Promise.all([
          getInventoryItems(),
          getAllBorrowings(),
          getScanLogs(5),
        ]);
        setItems(itemsData);
        setBorrowings(borrowingsData);
        setRecentScans(scansData);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalItems = items.length;
  const baikCount = items.filter(i => i.condition === 'Baik').length;
  const rusakRinganCount = items.filter(i => i.condition === 'Rusak Ringan').length;
  const rusakBeratCount = items.filter(i => i.condition === 'Rusak Berat').length;
  const maintenanceCount = items.filter(i => i.status === 'Dalam Maintenance').length;
  const dipinjamCount = items.filter(i => i.status === 'Dipinjam').length;

  // Chart data preparation
  const conditionChartData = [
    { name: 'Baik', value: baikCount, color: '#15803d' },
    { name: 'Rusak Ringan', value: rusakRinganCount, color: '#b45309' },
    { name: 'Rusak Berat', value: rusakBeratCount, color: '#b91c1c' },
  ];

  // Category counts
  const categoryMap: Record<string, number> = {};
  items.forEach(i => {
    const cat = i.categoryNameSnapshot || 'Lainnya';
    categoryMap[cat] = (categoryMap[cat] || 0) + 1;
  });
  const categoryChartData = Object.keys(categoryMap).map(cat => ({
    name: cat,
    total: categoryMap[cat]
  }));

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', color: '#0f172a', marginBottom: '0.25rem' }}>
          Dashboard Eksekutif Logistik
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
          Ringkasan status inventaris, aset, dan riwayat pemindaian QR Code Sespimma Polri.
        </p>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ width: '36px', height: '36px', border: '3px solid #e2e8f0', borderTopColor: '#1e3a8a', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
          <p style={{ color: '#64748b' }}>Memuat statistik logistik...</p>
        </div>
      ) : (
        <>
          {/* Top Metric Cards (5 Primary Columns) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '0.875rem',
              marginBottom: '1.5rem'
            }}
          >
            {/* 1. Total Inventaris */}
            <div className="card" style={{ borderLeft: '4px solid #1e3a8a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Total Inventaris</span>
                <h3 style={{ fontSize: '1.75rem', color: '#0f172a', marginTop: '0.25rem', lineHeight: 1.1 }}>{totalItems}</h3>
              </div>
              <div style={{ padding: '0.75rem', borderRadius: '10px', backgroundColor: '#eff6ff', color: '#1e3a8a' }}>
                <Boxes size={24} />
              </div>
            </div>

            {/* 2. Kondisi Baik */}
            <div className="card" style={{ borderLeft: '4px solid #15803d', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Kondisi Baik</span>
                <h3 style={{ fontSize: '1.75rem', color: '#15803d', marginTop: '0.25rem', lineHeight: 1.1 }}>{baikCount}</h3>
              </div>
              <div style={{ padding: '0.75rem', borderRadius: '10px', backgroundColor: '#dcfce7', color: '#15803d' }}>
                <CheckCircle size={24} />
              </div>
            </div>

            {/* 3. Rusak Ringan */}
            <div className="card" style={{ borderLeft: '4px solid #b45309', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Rusak Ringan</span>
                <h3 style={{ fontSize: '1.75rem', color: '#b45309', marginTop: '0.25rem', lineHeight: 1.1 }}>{rusakRinganCount}</h3>
              </div>
              <div style={{ padding: '0.75rem', borderRadius: '10px', backgroundColor: '#fef3c7', color: '#b45309' }}>
                <AlertTriangle size={24} />
              </div>
            </div>

            {/* 4. Rusak Berat */}
            <div className="card" style={{ borderLeft: '4px solid #b91c1c', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Rusak Berat</span>
                <h3 style={{ fontSize: '1.75rem', color: '#b91c1c', marginTop: '0.25rem', lineHeight: 1.1 }}>{rusakBeratCount}</h3>
              </div>
              <div style={{ padding: '0.75rem', borderRadius: '10px', backgroundColor: '#fee2e2', color: '#b91c1c' }}>
                <AlertOctagon size={24} />
              </div>
            </div>

            {/* 5. Maintenance & Sedang Dipinjam (Berada dalam 1 Kolom) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', height: '100%' }}>
              <div
                className="card"
                style={{
                  flex: 1,
                  padding: '0.625rem 0.875rem',
                  borderLeft: '4px solid #0369a1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  margin: 0
                }}
              >
                <div>
                  <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Maintenance</span>
                  <h4 style={{ fontSize: '1.35rem', color: '#0369a1', margin: '0.1rem 0 0', fontWeight: 700, lineHeight: 1.1 }}>{maintenanceCount}</h4>
                </div>
                <div style={{ padding: '0.45rem', borderRadius: '8px', backgroundColor: '#e0f2fe', color: '#0369a1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Wrench size={16} />
                </div>
              </div>

              <div
                className="card"
                style={{
                  flex: 1,
                  padding: '0.625rem 0.875rem',
                  borderLeft: '4px solid #6366f1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  margin: 0
                }}
              >
                <div>
                  <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Sedang Dipinjam</span>
                  <h4 style={{ fontSize: '1.35rem', color: '#6366f1', margin: '0.1rem 0 0', fontWeight: 700, lineHeight: 1.1 }}>{dipinjamCount}</h4>
                </div>
                <div style={{ padding: '0.45rem', borderRadius: '8px', backgroundColor: '#e0e7ff', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Repeat size={16} />
                </div>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div className="card">
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp size={18} color="#1e3a8a" />
                <span>Distribusi Kondisi Barang</span>
              </h3>
              <div style={{ width: '100%', height: 220 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={conditionChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                      {conditionChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Boxes size={18} color="#1e3a8a" />
                <span>Barang per Kategori</span>
              </h3>
              <div style={{ width: '100%', height: 220 }}>
                <ResponsiveContainer>
                  <BarChart data={categoryChartData}>
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip />
                    <Bar dataKey="total" fill="#1e3a8a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Recent Scans Section */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <QrCode size={18} color="#1e3a8a" />
                <span>Pemindaian QR Code Terbaru dari HP / Perangkat</span>
              </h3>
              <Link to="/scan-logs" style={{ fontSize: '0.875rem', color: '#1e3a8a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span>Lihat Semua Log</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            {recentScans.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '0.875rem', fontStyle: 'italic' }}>Belum ada aktivitas scan QR Code recorded.</p>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Kode Inventaris</th>
                      <th>Pemindai / Pengguna</th>
                      <th>Perangkat</th>
                      <th>Waktu Pemindaian</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentScans.map(scan => (
                      <tr key={scan.id}>
                        <td>
                          <Link to={`/item/${scan.inventoryCode}`} style={{ fontWeight: 600, color: '#1e3a8a' }}>
                            {scan.inventoryCode}
                          </Link>
                        </td>
                        <td>{scan.userName}</td>
                        <td>
                          <span className="badge badge-info">{scan.deviceType || 'HP Camera'}</span>
                        </td>
                        <td style={{ color: '#64748b', fontSize: '0.8rem' }}>
                          {scan.timestamp?.toDate ? scan.timestamp.toDate().toLocaleString('id-ID') : 'Baru saja'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
