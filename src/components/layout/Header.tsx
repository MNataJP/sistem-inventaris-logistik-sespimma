import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Menu, LogOut, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();

  return (
    <header className="header-bar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button
          onClick={onToggleSidebar}
          className="btn btn-secondary btn-sm"
          style={{ padding: '0.5rem', minHeight: '40px', minWidth: '40px' }}
          aria-label="Toggle navigation menu"
        >
          <Menu size={20} />
        </button>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: 'clamp(0.95rem, 2vw, 1.125rem)', margin: 0, color: '#1e3a8a', lineHeight: 1.2, fontWeight: 700 }}>
            LOGISTIK SESPIMMA
          </h2>
          <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>
            LEMDIKLAT POLRI
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }} className="header-user-info">
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>
                {user.name}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <ShieldCheck size={12} color="#1e3a8a" />
                <span className="badge badge-info" style={{ fontSize: '0.625rem', padding: '0.1rem 0.35rem' }}>
                  {user.role.toUpperCase()}
                </span>
              </div>
            </div>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: '#1e3a8a',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '0.875rem',
                flexShrink: 0
              }}
              title={user.name}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
            <button
              onClick={logout}
              className="btn btn-secondary btn-sm"
              title="Keluar / Logout"
              style={{ color: '#b91c1c', borderColor: '#fca5a5', padding: '0.375rem 0.625rem' }}
            >
              <LogOut size={16} />
              <span className="header-logout-text">Keluar</span>
            </button>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 640px) {
          .header-user-info { display: none !important; }
          .header-logout-text { display: none !important; }
        }
      `}</style>
    </header>
  );
};
