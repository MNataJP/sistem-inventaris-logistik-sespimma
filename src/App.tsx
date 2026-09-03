import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';

import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';

import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { ItemListPage } from '@/pages/items/ItemListPage';
import { ItemFormPage } from '@/pages/items/ItemFormPage';
import { ItemDetailPage } from '@/pages/items/ItemDetailPage';
import { QRPrintPage } from '@/pages/qr/QRPrintPage';
import { BorrowingPage } from '@/pages/borrowings/BorrowingPage';
import { CategoryListPage } from '@/pages/categories/CategoryListPage';
import { LocationListPage } from '@/pages/locations/LocationListPage';
import { UserListPage } from '@/pages/users/UserListPage';
import { AuditLogPage } from '@/pages/audit/AuditLogPage';
import { ScanHistoryPage } from '@/pages/scan/ScanHistoryPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Protected Main Layout Routes */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/items" element={<ItemListPage />} />
            <Route
              path="/items/new"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'admin', 'petugas']}>
                  <ItemFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/items/:id/edit"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'admin', 'petugas']}>
                  <ItemFormPage />
                </ProtectedRoute>
              }
            />

            {/* Deep link QR scan target */}
            <Route path="/item/:inventoryCode" element={<ItemDetailPage />} />

            <Route path="/qr-print" element={<QRPrintPage />} />
            <Route path="/borrowings" element={<BorrowingPage />} />

            <Route
              path="/categories"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                  <CategoryListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/locations"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                  <LocationListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                  <UserListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/audit-logs"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                  <AuditLogPage />
                </ProtectedRoute>
              }
            />
            <Route path="/scan-logs" element={<ScanHistoryPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
