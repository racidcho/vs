import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Contexts
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';
import { isTestMode } from './utils/testHelper';

// Components
import { ProtectedRoute, RequireCouple } from './components/auth/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { LoginForm } from './components/auth/LoginForm';
import { PinLockScreen } from './components/auth/PinLockScreen';
import { RealtimeStatus } from './components/RealtimeStatus';
import { useAppLock } from './hooks/useAppLock';
import { ErrorBoundary } from './components/ErrorBoundary';
// Debug components removed for production

// Pages (placeholders for now)
import { Dashboard } from './pages/Dashboard';
import { CoupleSetup } from './pages/CoupleSetup';
import { NameSetup } from './pages/NameSetup';
import { CoupleComplete } from './pages/CoupleComplete';
import { Rules } from './pages/Rules';
import { NewViolation } from './pages/NewViolation';
import { Rewards } from './pages/Rewards';
import { Calendar } from './pages/Calendar';
import { Settings } from './pages/Settings';

// Router content component that can use hooks
const RouterContent: React.FC = () => {
  const { user } = useAuth();
  const { isLocked, hasPin, unlock } = useAppLock();

  // Ensure light theme is always applied
  useEffect(() => {
    document.body.classList.add('light');
    document.body.classList.remove('dark');
  }, []);

  // Show PIN lock screen if user is logged in, has PIN set, and app is locked
  if (user && hasPin && isLocked) {
    return <PinLockScreen onUnlock={unlock} />;
  }

  // 테스트 모드에서는 인증 우회하고 바로 앱으로 이동
  if (isTestMode()) {
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
          {/* 테스트 모드에서는 모든 라우트를 보호 없이 접근 */}
          <Route path="/couple-setup" element={<CoupleSetupPage />} />
          <Route path="/name-setup" element={<NameSetupPage />} />
          <Route path="/couple-complete" element={<CoupleCompletePage />} />
          
          {/* 메인 앱 라우트 */}
          <Route path="/" element={<AppLayout />}>
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
        
        {/* 테스트 모드 인디케이터 */}
        <div style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          background: '#ff6b6b',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: 'bold',
          zIndex: 9999,
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
        }}>
          🧪 TEST MODE
        </div>
        
        {/* 개발 환경에서만 실시간 연결 상태 표시 */}
        {import.meta.env.DEV && <RealtimeStatus />}
      </div>
    );
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
        
        {/* Protected routes that require couple setup but allow incomplete profiles */}
        <Route path="/name-setup" element={<ProtectedRoute requireCouple><NameSetupPage /></ProtectedRoute>} />
        <Route path="/couple-complete" element={<ProtectedRoute requireCouple><CoupleCompletePage /></ProtectedRoute>} />

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
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <AppProvider>
            <RouterContent />
          </AppProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

// Public route component - redirects to dashboard if already authenticated
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  // 로그인되어 있으면 대시보드로 리다이렉트 (URL 파라미터 유지)
  if (user) {
    return <Navigate to={`/${location.search}`} replace />;
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

// Name setup page wrapper (the page already has its own styling)
const NameSetupPage: React.FC = () => {
  return <NameSetup />;
};

// Couple complete page wrapper
const CoupleCompletePage: React.FC = () => {
  return <CoupleComplete />;
};

export default App;// Force rebuild at 2025년 08월 10일 일 오후 12:42:17
