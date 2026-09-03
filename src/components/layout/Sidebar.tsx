import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Boxes,
  QrCode,
  Repeat,
  Tags,
  MapPin,
  Users,
  ShieldAlert,
  History,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  isMobileOpen: boolean;
  isCollapsed: boolean;
  onCloseMobile: () => void;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isMobileOpen,
  isCollapsed,
  onCloseMobile,
  onToggleCollapse
}) => {
  const { user } = useAuth();
  const role = user?.role;

  const menuItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['super_admin', 'admin', 'petugas', 'user'] },
    { label: 'Data Barang', path: '/items', icon: Boxes, roles: ['super_admin', 'admin', 'petugas', 'user'] },
    { label: 'Download Label QR', path: '/qr-print', icon: QrCode, roles: ['super_admin', 'admin', 'petugas'] },
    { label: 'Peminjaman Barang', path: '/borrowings', icon: Repeat, roles: ['super_admin', 'admin', 'petugas', 'user'] },
    { label: 'Kategori Barang', path: '/categories', icon: Tags, roles: ['super_admin', 'admin'] },
    { label: 'Lokasi & Gedung', path: '/locations', icon: MapPin, roles: ['super_admin', 'admin'] },
    { label: 'Manajemen User', path: '/users', icon: Users, roles: ['super_admin', 'admin'] },
    { label: 'Riwayat Scan QR', path: '/scan-logs', icon: History, roles: ['super_admin', 'admin', 'petugas'] },
    { label: 'Audit Trail System', path: '/audit-logs', icon: ShieldAlert, roles: ['super_admin', 'admin'] },
  ];

  return (
    <aside className={`sidebar ${isMobileOpen ? 'mobile-open' : ''} ${isCollapsed ? 'collapsed' : ''}`}>
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: '64px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, backgroundColor: '#ffffff', padding: '2px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
            <img src="/logo.png" alt="Logo Sespimma Polri" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div className="sidebar-header-title" style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
            <h3 style={{ fontSize: '0.95rem', color: '#ffffff', margin: 0, fontWeight: 700 }}>LOGISTIK</h3>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>SESPIMMA POLRI</span>
          </div>
        </div>

        {/* Mobile Close Button */}
        <button
          onClick={onCloseMobile}
          style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.25rem' }}
          className="mobile-close-btn"
          aria-label="Tutup Menu Navigation"
        >
          <X size={22} />
        </button>

        {/* Desktop Collapse Toggle */}
        <button
          onClick={onToggleCollapse}
          style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.25rem' }}
          className="desktop-collapse-btn"
          title={isCollapsed ? "Buka Sidebar" : "Lipat Sidebar"}
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <nav style={{ padding: '0.75rem', flex: 1, overflowY: 'auto' }}>
        {menuItems
          .filter(item => !role || item.roles.includes(role))
          .map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                title={item.label}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  color: isActive ? '#ffffff' : '#94a3b8',
                  backgroundColor: isActive ? '#1e3a8a' : 'transparent',
                  textDecoration: 'none',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.875rem',
                  marginBottom: '0.375rem',
                  transition: 'all 150ms ease',
                  whiteSpace: 'nowrap',
                })}
              >
                <Icon size={20} style={{ flexShrink: 0 }} />
                <span className="sidebar-text">{item.label}</span>
              </NavLink>
            );
          })}
      </nav>

      <div style={{ padding: '1rem', borderTop: '1px solid #1e293b', fontSize: '0.75rem', color: '#64748b', textAlign: 'center' }} className="sidebar-text">
        Sespimma Polri v1.0
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .mobile-close-btn { display: none !important; }
        }
        @media (max-width: 1023px) {
          .desktop-collapse-btn { display: none !important; }
          .sidebar-text { display: inline !important; }
          .sidebar-header-title { display: block !important; }
        }
      `}</style>
    </aside>
  );
};
