export type UserRole = 'super_admin' | 'admin' | 'petugas' | 'user';

export type UserApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface UserProfile {
  uid: string;
  name: string;
  nrp?: string;
  email: string;
  role: UserRole;
  unit: string;
  photoUrl?: string;
  isActive: boolean;
  status?: UserApprovalStatus;
  rejectionReason?: string;
  approvedAt?: any;
  approvedBy?: string;
  rejectedAt?: any;
  rejectedBy?: string;
  createdAt?: any;
  updatedAt?: any;
  lastLoginAt?: any;
}

export interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}
