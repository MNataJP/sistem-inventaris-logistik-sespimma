import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setSubmitted(true);
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(err.message || 'Gagal mengirim email pemulihan kata sandi.');
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
        padding: '1.5rem'
      }}
    >
      <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '2rem' }}>
        <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#1e3a8a', marginBottom: '1.5rem', textDecoration: 'none' }}>
          <ArrowLeft size={16} />
          <span>Kembali ke Halaman Login</span>
        </Link>

        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '0.75rem',
              backgroundColor: '#ffffff',
              padding: '4px',
              boxShadow: '0 6px 14px -3px rgba(30, 58, 138, 0.2)',
              border: '1px solid #e2e8f0'
            }}
          >
            <img
              src="/logo.png"
              alt="Logo Sespimma Lemdiklat Polri"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
        </div>

        <h2 style={{ fontSize: '1.35rem', marginBottom: '0.5rem' }}>Lupa Kata Sandi</h2>
        <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1.5rem' }}>
          Masukkan alamat email akun Anda. Kami akan mengirimkan tautan pemulihan kata sandi.
        </p>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <CheckCircle2 size={48} color="#15803d" style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Email Terkirim!</h3>
            <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
              Silakan periksa kotak masuk email <strong>{email}</strong> Anda dan ikuti petunjuk untuk mengatur ulang kata sandi.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{ padding: '0.75rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '6px', fontSize: '0.875rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Email Terdaftar</label>
              <div style={{ position: 'relative' }}>
                <input
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

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }}>
              {loading ? 'Mengirim Email...' : 'Kirim Tautan Pemulihan'}
            </button>
          </form>
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
