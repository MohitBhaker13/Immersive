import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import ProtectedRoute from '@/components/ProtectedRoute';

const Login = lazy(() => import('@/pages/LoginWithGoogle'));
const AuthCallback = lazy(() => import('@/pages/AuthCallback'));
const Onboarding = lazy(() => import('@/pages/Onboarding'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Library = lazy(() => import('@/pages/Library'));
const Calendar = lazy(() => import('@/pages/Calendar'));
const ImmersiveSession = lazy(() => import('@/pages/ImmersiveSession'));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#F8F6F1]">
    <div className="w-8 h-8 rounded-full border-2 border-[#A68A64] border-t-transparent animate-spin"></div>
  </div>
);
import '@/App.css';

function AppRouter() {
  const location = useLocation();

  // Check URL fragment for session_id synchronously during render
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/onboarding" element={
          <ProtectedRoute>
            <Onboarding />
          </ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/library" element={
          <ProtectedRoute>
            <Library />
          </ProtectedRoute>
        } />
        <Route path="/calendar" element={
          <ProtectedRoute>
            <Calendar />
          </ProtectedRoute>
        } />
        <Route path="/session/:sessionId" element={
          <ProtectedRoute>
            <ImmersiveSession />
          </ProtectedRoute>
        } />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AppRouter />
        <Toaster position="top-center" />
      </BrowserRouter>
    </div>
  );
}

export default App;