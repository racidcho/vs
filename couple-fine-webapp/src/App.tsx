import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Contexts
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppProvider, useApp } from './contexts/AppContext';

// Components
import { ProtectedRoute, RequireCouple } from './components/auth/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { LoginForm } from './components/auth/LoginForm';
import { PinLockScreen } from './components/auth/PinLockScreen';
import { RealtimeStatus } from './components/RealtimeStatus';
import { useAppLock } from './hooks/useAppLock';

// Pages (placeholders for now)
import { Dashboard } from './pages/Dashboard';
import { CoupleSetup } from './pages/CoupleSetup';
import { Rules } from './pages/Rules';
import { NewViolation } from './pages/NewViolation';
import { Rewards } from './pages/Rewards';
import { Calendar } from './pages/Calendar';
import { Settings } from './pages/Settings';

// Router content component that can use hooks
const RouterContent: React.FC = () => {
  const { user } = useAuth();
  const { state } = useApp();
  const { isLocked, hasPin, unlock } = useAppLock();
  
  // Apply theme to document body - this will be handled by AppContext
  useEffect(() => {
    // Apply theme based on current state
    const currentTheme = state.theme || 'light';
    
    // Apply theme class to body
    if (currentTheme === 'dark') {
      document.body.classList.add('dark');
      document.body.classList.remove('light');
    } else {
      document.body.classList.add('light');
      document.body.classList.remove('dark');
    }
    
    console.log('🎨 APP: Theme applied to body from App.tsx:', currentTheme);
  }, [state.theme]);
  
  // Show PIN lock screen if user is logged in, has PIN set, and app is locked
  if (user && hasPin && isLocked) {
    return <PinLockScreen onUnlock={unlock} />;
  }
  
  return (
    <div className="App">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#374151',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          },
          success: {
            iconTheme: {
              primary: '#059669',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#DC2626',
              secondary: '#fff',
            },
          },
        }}
      />
      
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        
        {/* Protected routes that don't require couple setup */}
        <Route path="/couple-setup" element={<ProtectedRoute><CoupleSetupPage /></ProtectedRoute>} />
        
        {/* Protected routes that require couple setup */}
        <Route path="/" element={<RequireCouple><AppLayout /></RequireCouple>}>
          <Route index element={<Dashboard />} />
          <Route path="rules" element={<Rules />} />
          <Route path="violations/new" element={<NewViolation />} />
          <Route path="rewards" element={<Rewards />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {/* 개발 환경에서만 실시간 연결 상태 표시 */}
      {import.meta.env.DEV && <RealtimeStatus />}
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppProvider>
          <RouterContent />
        </AppProvider>
      </AuthProvider>
    </Router>
  );
}

// Public route component - redirects to dashboard if already authenticated
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  // 로그인되어 있으면 대시보드로 리다이렉트
  if (user) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

// Login page wrapper
const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-coral-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <LoginForm />
    </div>
  );
};

// Couple setup page wrapper  
const CoupleSetupPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-coral-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <CoupleSetup />
    </div>
  );
};

export default App;