import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export const AppLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="app-container">
      {/* Mobile Backdrop */}
      <div
        className={`sidebar-backdrop ${mobileOpen ? 'visible' : ''}`}
        onClick={() => setMobileOpen(false)}
      />

      <Sidebar
        isMobileOpen={mobileOpen}
        isCollapsed={collapsed}
        onCloseMobile={() => setMobileOpen(false)}
        onToggleCollapse={() => setCollapsed(prev => !prev)}
      />

      <div className={`main-content ${collapsed ? 'collapsed' : ''}`}>
        <Header onToggleSidebar={() => setMobileOpen(prev => !prev)} />
        <main className="content-body">
          <Outlet />
        </main>
        <footer style={{ padding: '1rem 1.5rem', textAlign: 'center', fontSize: '0.8rem', color: '#64748b', borderTop: '1px solid #e2e8f0', backgroundColor: '#ffffff', marginTop: 'auto' }}>
          <div>Hak Cipta © 2026 Sistem Inventaris Logistik - Sespimma Lemdiklat Polri. All rights reserved.</div>
          <div style={{ marginTop: '0.25rem', fontSize: '0.75rem' }}>
            Created by <strong style={{ color: '#1e293b' }}>M Nata Jayndra Permana</strong> &bull; Email : <a href="mailto:natajp81@gmail.com" style={{ color: '#1e3a8a', textDecoration: 'none', fontWeight: 600 }}>natajp81@gmail.com</a>
          </div>
        </footer>
      </div>
    </div>
  );
};
