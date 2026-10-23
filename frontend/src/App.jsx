import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import MobileBottomNav from './components/MobileBottomNav';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import PatientDetail from './pages/PatientDetail';
import TemperatureRecords from './pages/TemperatureRecords';
import DoctorVisits from './pages/DoctorVisits';
import Discharges from './pages/Discharges';
import Analytics from './pages/Analytics';
import AuditLogs from './pages/AuditLogs';

// Role permissions map
const routePermissions = {
  '/patients': ['admin', 'doctor', 'nurse'],
  '/temperatures': ['nurse'],
  '/doctor-visits': ['doctor'],
  '/discharges': ['admin'],
  '/analytics': ['admin'],
  '/audit-logs': ['admin'],
};

// Guard: requires auth + optional role check
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(role)) {
    // Redirect to home dashboard instead of an error
    return <Navigate to="/" replace />;
  }

  return children;
};

// Responsive Layout with Desktop Sidebar & Mobile Off-canvas Drawer + Bottom Nav
const AppLayout = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar
        onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)}
        isMobileMenuOpen={mobileMenuOpen}
      />
      <div className="flex flex-1 relative overflow-hidden">
        {/* Desktop Sidebar (hidden on mobile) */}
        <div className="hidden md:flex flex-shrink-0">
          <Sidebar />
        </div>

        {/* Mobile Slide Drawer (modal overlay on mobile) */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            {/* Dark backdrop */}
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
            />
            {/* Sliding drawer panel */}
            <div className="relative w-72 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col z-50 animate-in slide-in-from-left duration-200">
              <Sidebar isMobile onCloseMobile={() => setMobileMenuOpen(false)} />
            </div>
          </div>
        )}

        {/* Main Content Area: padded for mobile bottom nav */}
        <main className="flex-1 p-3.5 sm:p-5 lg:p-7 overflow-y-auto pb-24 md:pb-8 w-full max-w-full min-w-0">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (one-thumb navigation on phones) */}
      <MobileBottomNav onOpenMenu={() => setMobileMenuOpen(true)} />
    </div>
  );
};

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Dashboard — role-specific view */}
        <Route path="/" element={
          <ProtectedRoute>
            <AppLayout><Dashboard /></AppLayout>
          </ProtectedRoute>
        } />

        {/* Patients — Admin, Doctor, Nurse (read/write varies by role inside component) */}
        <Route path="/patients" element={
          <ProtectedRoute allowedRoles={['admin', 'doctor', 'nurse']}>
            <AppLayout><Patients /></AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/patients/:id" element={
          <ProtectedRoute allowedRoles={['admin', 'doctor', 'nurse']}>
            <AppLayout><PatientDetail /></AppLayout>
          </ProtectedRoute>
        } />

        {/* Temperature Records — Nurse ONLY */}
        <Route path="/temperatures" element={
          <ProtectedRoute allowedRoles={['nurse']}>
            <AppLayout><TemperatureRecords /></AppLayout>
          </ProtectedRoute>
        } />

        {/* Doctor Visits — Doctor ONLY */}
        <Route path="/doctor-visits" element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <AppLayout><DoctorVisits /></AppLayout>
          </ProtectedRoute>
        } />

        {/* Discharges — Admin ONLY */}
        <Route path="/discharges" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AppLayout><Discharges /></AppLayout>
          </ProtectedRoute>
        } />

        {/* Analytics — Admin ONLY */}
        <Route path="/analytics" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AppLayout><Analytics /></AppLayout>
          </ProtectedRoute>
        } />

        {/* Audit Logs — Admin ONLY */}
        <Route path="/audit-logs" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AppLayout><AuditLogs /></AppLayout>
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </AuthProvider>
);

export default App;
