import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Test Contexts
import { TestAuthProvider, useTestAuth } from './contexts/TestAuthContext';
import { TestAppProvider } from './contexts/TestAppContext';

// Components
import { TestAppLayout } from './components/layout/TestAppLayout';
import { TestRealtimeStatus } from './components/TestRealtimeStatus';
import { ErrorBoundary } from './components/ErrorBoundary';

// Test Pages
import TestLogin from './pages/TestLogin';

// Test Pages
import { TestDashboard } from './pages/TestDashboard';
import { TestRules } from './pages/TestRules';
import { TestNewViolation } from './pages/TestNewViolation';
import { TestRewards } from './pages/TestRewards';
// Regular Pages
import { Dashboard } from './pages/Dashboard';
import { CoupleSetup } from './pages/CoupleSetup';
import { NameSetup } from './pages/NameSetup';
import { CoupleComplete } from './pages/CoupleComplete';
import { Rules } from './pages/Rules';
import { NewViolation } from './pages/NewViolation';
import { Rewards } from './pages/Rewards';
import { Calendar } from './pages/Calendar';
import { Settings } from './pages/Settings';

// Test Protected Route Component
const TestProtectedRoute: React.FC<{ 
  children: React.ReactNode;
  requireCouple?: boolean;
}> = ({ children, requireCouple = false }) => {
  const { user } = useTestAuth();

  if (!user) {
    return <Navigate to="/test-login" replace />;
  }

  // If couple is required but user doesn't have one, redirect to couple setup
  if (requireCouple && !user.couple_id) {
    return <Navigate to="/couple-setup" replace />;
  }

  return <>{children}</>;
};

// Test Public Route Component
const TestPublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useTestAuth();

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Router content component that can use test hooks
const TestRouterContent: React.FC = () => {
  const { user } = useTestAuth();

  // Ensure light theme is always applied
  useEffect(() => {
    document.body.classList.add('light');
    document.body.classList.remove('dark');
  }, []);

  return (
    <div className="TestApp">
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
        {/* Test login route */}
        <Route path="/test-login" element={<TestPublicRoute><TestLogin /></TestPublicRoute>} />

        {/* Protected routes that don't require couple setup */}
        <Route path="/couple-setup" element={<TestProtectedRoute><CoupleSetupPage /></TestProtectedRoute>} />
        
        {/* Protected routes that require couple setup but allow incomplete profiles */}
        <Route path="/name-setup" element={<TestProtectedRoute requireCouple><NameSetupPage /></TestProtectedRoute>} />
        <Route path="/couple-complete" element={<TestProtectedRoute requireCouple><CoupleCompletePage /></TestProtectedRoute>} />

        {/* Protected routes that require couple setup */}
        <Route path="/" element={<TestProtectedRoute requireCouple><TestAppLayout /></TestProtectedRoute>}>
          <Route index element={<TestDashboard />} />
          <Route path="rules" element={<TestRules />} />
          <Route path="violations/new" element={<TestNewViolation />} />
          <Route path="rewards" element={<TestRewards />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/test-login" replace />} />
      </Routes>
      
      {/* 테스트 환경에서 실시간 연결 상태 표시 */}
      <TestRealtimeStatus />

      {/* 테스트 환경 표시 */}
      <div className="fixed top-0 left-0 bg-yellow-400 text-yellow-900 px-4 py-2 text-sm font-medium z-50">
        🧪 테스트 모드 | 현재 사용자: {user?.email || '로그인 필요'}
      </div>
    </div>
  );
};

function TestApp() {
  return (
    <ErrorBoundary>
      <Router>
        <TestAuthProvider>
          <TestAppProvider>
            <TestRouterContent />
          </TestAppProvider>
        </TestAuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

// Couple setup page wrapper
const CoupleSetupPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-coral-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <CoupleSetup />
    </div>
  );
};

// Name setup page wrapper
const NameSetupPage: React.FC = () => {
  return <NameSetup />;
};

// Couple complete page wrapper
const CoupleCompletePage: React.FC = () => {
  return <CoupleComplete />;
};

export default TestApp;