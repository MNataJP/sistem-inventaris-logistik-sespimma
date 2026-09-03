import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { UserRole } from '@/types/auth';
import { recordAuditLog } from '@/services/auditService';
import {
  Shield,
  User,
  Mail,
  Lock,
  Building,
  BadgeCheck,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Clock
} from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [nrp, setNrp] = useState('');
  const [unit, setUnit] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registered, setRegistered] = useState(false);

  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok. Silakan periksa kembali.');
      return;
    }

    if (password.length < 6) {
      setError('Kata sandi minimal 6 karakter demi keamanan akun.');
      return;
    }

    setLoading(true);

    try {
      // 1. Buat user di Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // 2. Buat profil di Firestore dengan status 'pending' dan isActive false
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, {
        uid,
        name: fullName,
        nrp: nrp || '',
        email,
        unit: unit || 'Sespimma Lemdiklat Polri',
        role,
        status: 'pending',
        isActive: false, // Menunggu persetujuan Super Admin
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // 3. Catat audit trail pendaftaran akun
      await recordAuditLog({
        userId: uid,
        userName: fullName,
        action: 'REGISTER',
        module: 'AUTENTIKASI',
        targetType: 'USER',
        targetId: uid,
        description: `Pendaftaran akun baru oleh ${fullName} (${email}) - Status: Menunggu Persetujuan (Pending)`
      });

      // 4. Segera sign out agar akun pending tidak dapat langsung mengakses dashboard
      await signOut(auth);

      setRegistered(true);
    } catch (err: any) {
      console.error('Registration error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Alamat email ini sudah terdaftar di sistem. Silakan login atau gunakan menu Lupa Sandi.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Format alamat email tidak valid.');
      } else if (err.code === 'auth/weak-password') {
        setError('Kata sandi terlalu lemah. Gunakan kombinasi huruf dan angka.');
      } else {
        setError(err.message || 'Gagal mendaftarkan akun. Silakan periksa koneksi internet Anda.');
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
        padding: '2rem 1.5rem',
        backgroundImage: 'radial-gradient(circle at 50% 0%, #1e3a8a 0%, #0f172a 75%)'
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: '520px',
          width: '100%',
          padding: '2.5rem 2rem',
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backgroundColor: '#ffffff'
        }}
      >
        {registered ? (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                backgroundColor: '#fef3c7',
                color: '#b45309',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem'
              }}
            >
              <Clock size={40} />
            </div>

            <h2 style={{ fontSize: '1.4rem', color: '#0f172a', marginBottom: '0.5rem' }}>
              Pendaftaran Berhasil!
            </h2>

            <div
              style={{
                padding: '1rem',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                margin: '1.25rem 0',
                textAlign: 'left',
                fontSize: '0.875rem'
              }}
            >
              <p style={{ color: '#334155', lineHeight: '1.6', marginBottom: '0.75rem' }}>
                Akun atas nama <strong>{fullName}</strong> (<strong>{email}</strong>) telah berhasil didaftarkan ke sistem.
              </p>
              <p style={{ color: '#64748b', lineHeight: '1.6', margin: 0 }}>
                Akun Anda saat ini berstatus <strong>Menunggu Persetujuan (*Pending Approval*)</strong> dari <strong>Super Admin Sespimma Polri</strong>. Anda akan menerima notifikasi otomatis via email setelah permohonan disetujui.
              </p>
            </div>

            <Link
              to="/login"
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              <ArrowLeft size={18} />
              <span>Kembali ke Halaman Login</span>
            </Link>
          </div>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
              <div
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '16px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '0.75rem',
                  backgroundColor: '#ffffff',
                  padding: '5px',
                  boxShadow: '0 8px 16px -3px rgba(30, 58, 138, 0.2)',
                  border: '1px solid #e2e8f0'
                }}
              >
                <img
                  src="/logo.png"
                  alt="Logo Sespimma Lemdiklat Polri"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </div>
              <h1 style={{ fontSize: '1.4rem', color: '#0f172a', marginBottom: '0.25rem' }}>
                Daftar Akun Baru
              </h1>
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Sistem Inventaris Logistik Sespimma Lemdiklat Polri
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
                  fontSize: '0.85rem',
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

            <form onSubmit={handleRegister}>
              <div className="form-group">
                <label className="form-label">Nama Lengkap & Pangkat / Gelar</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    required
                    className="form-input"
                    style={{ paddingLeft: '2.5rem' }}
                    placeholder="Contoh: Bripka Ahmad Hidayat, S.H."
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                  />
                  <User size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">NRP / NIP / NIK</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      required
                      className="form-input"
                      style={{ paddingLeft: '2.5rem' }}
                      placeholder="89012345"
                      value={nrp}
                      onChange={e => setNrp(e.target.value)}
                    />
                    <BadgeCheck size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Unit / Bagian</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      required
                      className="form-input"
                      style={{ paddingLeft: '2.5rem' }}
                      placeholder="Bag Sarpras / Gadik"
                      value={unit}
                      onChange={e => setUnit(e.target.value)}
                    />
                    <Building size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Alamat Email Dinas / Utama</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    required
                    className="form-input"
                    style={{ paddingLeft: '2.5rem' }}
                    placeholder="nama.user@polri.go.id"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                  <Mail size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Permohonan Hak Akses (*Role*)</label>
                <select
                  className="form-select"
                  value={role}
                  onChange={e => setRole(e.target.value as UserRole)}
                >
                  <option value="user">USER (Peminjam Logistik / Personel Sespimma)</option>
                  <option value="petugas">PETUGAS (Petugas Gudang / Scanner QR / Mutasi Barang)</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Kata Sandi</label>
                  <div style={{ position: 'relative' }}>
                    <input
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
                </div>

                <div className="form-group">
                  <label className="form-label">Konfirmasi Sandi</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="password"
                      required
                      className="form-input"
                      style={{ paddingLeft: '2.5rem' }}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                    />
                    <Lock size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', borderRadius: '8px', marginTop: '0.5rem' }}
              >
                {loading ? 'Mendaftarkan Akun...' : 'Kirim Permohonan Pendaftaran'}
              </button>
            </form>

            <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: '#64748b' }}>
              Sudah memiliki akun terdaftar?{' '}
              <Link to="/login" style={{ color: '#1e3a8a', fontWeight: 600 }}>
                Masuk di Sini
              </Link>
            </div>
          </>
        )}

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
