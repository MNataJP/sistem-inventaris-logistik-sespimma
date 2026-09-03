import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { AuthContextType, UserProfile, UserRole } from '@/types/auth';

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  logout: async () => {},
  refreshProfile: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async (uid: string, authEmail: string, authName?: string) => {
    try {
      const userRef = doc(db, 'users', uid);
      const docSnap = await getDoc(userRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfile;
        setUser({ ...data, uid });
        // Update last login timestamp asynchronously
        await setDoc(userRef, { lastLoginAt: serverTimestamp() }, { merge: true });
      } else {
        // Jika dokumen tidak ada dan merupakan super admin inisial, buat profil default
        if (authEmail === 'admin@polri.go.id') {
          const newProfile: UserProfile = {
            uid,
            name: authName || 'Super Admin Sespimma',
            email: authEmail,
            role: 'super_admin',
            unit: 'Sespimma Lemdiklat Polri',
            isActive: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            lastLoginAt: serverTimestamp(),
          };
          await setDoc(userRef, newProfile);
          setUser(newProfile);
        } else {
          // Dokumen tidak ditemukan (telah dihapus oleh Super Admin atau belum terdaftar)
          console.warn(`User document ${uid} not found in Firestore. Signing out.`);
          setUser(null);
          await signOut(auth);
          setError('Akun tidak terdaftar di sistem basis data Sespimma.');
        }
      }
    } catch (err: any) {
      console.error('Error fetching user profile:', err);
      setError(err.message || 'Gagal memuat profil pengguna.');
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser && firebaseUser.email) {
        await fetchProfile(firebaseUser.uid, firebaseUser.email, firebaseUser.displayName || undefined);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  const refreshProfile = async () => {
    if (auth.currentUser && auth.currentUser.email) {
      await fetchProfile(auth.currentUser.uid, auth.currentUser.email);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
