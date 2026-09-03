import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Shield, Lock, Mail, AlertCircle, UserPlus } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();

  // Redirect destination after login (defaults to /dashboard or originally scanned item URL)
  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // Periksa status keaktifan akun & status persetujuan di Firestore
      const userDocRef = doc(db, 'users', userCredential.user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        // Akun sudah dihapus dari database
        await signOut(auth);
        setError(`Akun (${email}) telah dihapus dari sistem dan tidak memiliki izin akses. Silakan hubungi Super Admin.`);
        setLoading(false);
        return;
      }

      const userData = userDocSnap.data();

      if (userData.status === 'pending') {
        await signOut(auth);
        setError(`Akun Anda (${email}) sedang menunggu persetujuan dari Super Admin Sespimma Polri. Anda akan menerima notifikasi email setelah akun disetujui.`);
        setLoading(false);
        return;
      }

      if (userData.status === 'rejected') {
        await signOut(auth);
        const reasonText = userData.rejectionReason ? ` Alasan: ${userData.rejectionReason}.` : '';
        setError(`Permohonan pendaftaran akun Anda (${email}) ditolak oleh Administrator.${reasonText} Silakan hubungi Super Admin.`);
        setLoading(false);
        return;
      }

      if (userData.isActive === false) {
        // Akun dinonaktifkan: segera sign out dari Firebase Auth
        await signOut(auth);
        setError(`Akun Anda (${email}) telah dinonaktifkan oleh Administrator Sespimma Polri. Anda tidak dapat mengakses sistem. Silakan hubungi Super Admin.`);
        setLoading(false);
        return;
      }

      navigate(from, { replace: true });
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Email atau kata sandi yang Anda masukkan salah.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Terlalu banyak percobaan login yang gagal. Silakan coba beberapa saat lagi.');
      } else {
        setError(err.message || 'Gagal melakukan otentikasi. Silakan periksa koneksi internet Anda.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0f172a',
        padding: '1.5rem',
        backgroundImage: 'radial-gradient(circle at 50% 0%, #1e3a8a 0%, #0f172a 75%)'
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: '440px',
          width: '100%',
          padding: '2.5rem 2rem',
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backgroundColor: '#ffffff'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '20px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
              backgroundColor: '#ffffff',
              padding: '6px',
              boxShadow: '0 8px 20px -4px rgba(30, 58, 138, 0.25)',
              border: '1px solid #e2e8f0'
            }}
          >
            <img
              src="/logo.png"
              alt="Logo Sespimma Lemdiklat Polri"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
          <h1 style={{ fontSize: '1.5rem', color: '#0f172a', marginBottom: '0.25rem' }}>
            Sistem Inventaris Logistik
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 500 }}>
            Sespimma Lemdiklat Polri
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: '#fee2e2',
              border: '1px solid #fca5a5',
              borderRadius: '8px',
              color: '#b91c1c',
              fontSize: '0.875rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label" htmlFor="email-input">Alamat Email</label>
            <div style={{ position: 'relative' }}>
              <input
                id="email-input"
                type="email"
                required
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="admin@polri.go.id"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
              <Mail size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label" htmlFor="password-input">Kata Sandi</label>
            <div style={{ position: 'relative' }}>
              <input
                id="password-input"
                type="password"
                required
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <Lock size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            </div>
            {/* Lupa Kata Sandi diletakkan di bawah form input kata sandi */}
            <div style={{ textAlign: 'right', marginTop: '0.5rem' }}>
              <Link to="/forgot-password" style={{ fontSize: '0.8rem', color: '#1e3a8a', fontWeight: 500 }}>
                Lupa kata sandi?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', borderRadius: '8px' }}
          >
            {loading ? 'Memverifikasi...' : 'Masuk ke Sistem'}
          </button>
        </form>

        {/* Link Daftar Akun Baru */}
        <div style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.875rem', color: '#64748b' }}>
          Belum memiliki akun?{' '}
          <Link to="/register" style={{ color: '#1e3a8a', fontWeight: 600 }}>
            Daftar Akun Baru
          </Link>
        </div>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.6 }}>
          <div>Hak Cipta © 2026 Sespimma Lemdiklat Polri. All rights reserved.</div>
          <div style={{ marginTop: '0.35rem', color: '#64748b', fontSize: '0.75rem' }}>
            Created by <strong style={{ color: '#334155' }}>M Nata Jayndra Permana</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
