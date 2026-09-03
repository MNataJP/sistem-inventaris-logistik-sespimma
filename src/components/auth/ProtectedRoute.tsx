import React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types/auth';
import { ShieldAlert, AlertTriangle, LogOut, ArrowLeft } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, loading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', border: '4px solid #e2e8f0', borderTopColor: '#1e3a8a', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
          <p style={{ marginTop: '1rem', color: '#64748b', fontWeight: 500 }}>Memuat Sistem Inventaris Logistik...</p>
        </div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) {
    // Redirect to login page and retain current location state for return after auth
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const handleLogoutAndRedirect = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      navigate('/login', { replace: true });
    }
  };

  if (!user.isActive) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          backgroundColor: '#0f172a',
          backgroundImage: 'radial-gradient(circle at 50% 0%, #1e3a8a 0%, #0f172a 75%)'
        }}
      >
        <div
          className="card"
          style={{
            maxWidth: '480px',
            width: '100%',
            textAlign: 'center',
            padding: '2.5rem 2rem',
            borderRadius: '16px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backgroundColor: '#ffffff'
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              backgroundColor: '#fee2e2',
              color: '#b91c1c',
              borderRadius: '50%',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.25rem',
              boxShadow: '0 4px 6px -1px rgba(185, 28, 28, 0.2)'
            }}
          >
            <ShieldAlert size={34} />
          </div>

          <h2 style={{ color: '#b91c1c', marginBottom: '0.75rem', fontSize: '1.4rem' }}>
            Akun Dinonaktifkan
          </h2>
          
          <p style={{ color: '#475569', marginBottom: '0.75rem', fontSize: '0.95rem', lineHeight: '1.6' }}>
            Akun Anda (<strong>{user.email}</strong>) saat ini berada dalam status <strong>Non-Aktif</strong> oleh Administrator Sespimma Polri.
          </p>

          <p style={{ color: '#64748b', marginBottom: '2rem', fontSize: '0.85rem' }}>
            Anda tidak dapat mengakses fitur sistem logistik. Silakan hubungi Super Admin jika ini adalah kekeliruan atau gunakan akun lain yang aktif.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={handleLogoutAndRedirect}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '0.95rem',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <LogOut size={18} />
              <span>Keluar & Kembali ke Halaman Login</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', backgroundColor: '#f8fafc' }}>
        <div className="card" style={{ maxWidth: '480px', width: '100%', textAlign: 'center', padding: '2.5rem 2rem', borderRadius: '16px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              backgroundColor: '#fef3c7',
              color: '#b45309',
              borderRadius: '50%',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.25rem'
            }}
          >
            <AlertTriangle size={34} />
          </div>
          <h2 style={{ color: '#b45309', marginBottom: '0.5rem', fontSize: '1.35rem' }}>Akses Ditolak (403)</h2>
          <p style={{ color: '#64748b', marginBottom: '1.75rem', fontSize: '0.9rem' }}>
            Peran akun Anda (<strong>{user.role.toUpperCase()}</strong>) tidak memiliki izin untuk mengakses modul ini.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button
              onClick={() => navigate('/dashboard')}
              className="btn btn-secondary"
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              <ArrowLeft size={16} />
              <span>Dashboard</span>
            </button>
            <button
              onClick={handleLogoutAndRedirect}
              className="btn btn-primary"
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              <LogOut size={16} />
              <span>Ganti Akun</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
