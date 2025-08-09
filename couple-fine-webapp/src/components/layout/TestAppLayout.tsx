import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  FileText, 
  AlertCircle, 
  Gift, 
  Calendar, 
  Settings,
  LogOut,
  Heart
} from 'lucide-react';
import { useTestAuth } from '../../contexts/TestAuthContext';
import { useTestApp } from '../../contexts/TestAppContext';

// Navigation items
const navigationItems = [
  { name: '홈', href: '/', icon: Home },
  { name: '규칙', href: '/rules', icon: FileText },
  { name: '벌금 기록', href: '/violations/new', icon: AlertCircle },
  { name: '보상', href: '/rewards', icon: Gift },
  { name: '캘린더', href: '/calendar', icon: Calendar },
];

export const TestAppLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useTestAuth();
  const { state, getPartnerInfo } = useTestApp();

  const handleSignOut = async () => {
    await signOut();
    navigate('/test-login');
  };

  const handleSettings = () => {
    navigate('/settings');
  };

  // Get partner info for display
  const [partnerInfo, setPartnerInfo] = React.useState<any>(null);
  
  React.useEffect(() => {
    const fetchPartnerInfo = async () => {
      const info = await getPartnerInfo();
      if (info?.partner) {
        setPartnerInfo(info.partner);
      }
    };
    fetchPartnerInfo();
  }, [getPartnerInfo]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-coral-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Heart className="h-8 w-8 text-primary-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">
                🧪 Couple Fine
              </span>
              <span className="ml-2 px-2 py-1 text-xs bg-yellow-200 text-yellow-800 rounded">
                테스트
              </span>
            </div>

            {/* User info */}
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-700">
                <span className="font-medium">{user?.display_name}</span>
                {partnerInfo && (
                  <span className="ml-2 text-gray-500">
                    ↔️ {partnerInfo.display_name}
                  </span>
                )}
              </div>
              <button
                onClick={handleSettings}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Settings className="h-5 w-5" />
              </button>
              <button
                onClick={handleSignOut}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {navigationItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <button
                  key={item.name}
                  onClick={() => navigate(item.href)}
                  className={`flex items-center px-3 py-4 text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-primary-600 border-b-2 border-primary-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <item.icon className="w-4 h-4 mr-2" />
                  {item.name}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            <div className="flex items-center justify-center space-x-2">
              <span>🧪 테스트 모드</span>
              <span>•</span>
              <span>커플: {state.couple?.couple_name || '로딩 중...'}</span>
              <span>•</span>
              <span>규칙: {state.rules.length}개</span>
              <span>•</span>
              <span>총 벌금: ₩{state.couple?.total_balance?.toLocaleString() || 0}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};