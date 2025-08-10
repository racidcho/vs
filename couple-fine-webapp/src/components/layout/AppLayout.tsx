import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import {
  Home,
  Heart,
  Plus,
  Gift,
  Calendar,
  Settings,
  LogOut,
  Wifi,
  WifiOff,
  Sparkles
} from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import toast from 'react-hot-toast';
import { MobileNav } from './MobileNav';

const navigation = [
  { name: '홈', href: '/', icon: Home, emoji: '🏠' },
  { name: '우리 규칙', href: '/rules', icon: Heart, emoji: '💝' },
  { name: '벌금 기록', href: '/violations/new', icon: Plus, emoji: '✍️' },
  { name: '보상', href: '/rewards', icon: Gift, emoji: '🎁' },
  { name: '달력', href: '/calendar', icon: Calendar, emoji: '📅' },
  { name: '설정', href: '/settings', icon: Settings, emoji: '⚙️' },
];

export const AppLayout: React.FC = () => {
  const { user, signOut } = useAuth();
  const { state } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();

  // const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('👋 안녕히 가세요!');
      navigate('/login');
    } catch (error) {
      toast.error('로그아웃 실패');
    }
  };

  const isCurrentPath = (path: string) => {
    if (path === '/') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      {/* Mobile Header - 심플한 헤더 */}
      <div className="sticky top-0 z-40 lg:hidden">
        <div className="bg-white/90 backdrop-blur-md px-4 py-3 border-b border-pink-100">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-pink-400 animate-pulse" />
              <span className="text-lg font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                우리 벌금통
              </span>
              <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex lg:flex-row">
        {/* Desktop Sidebar */}
        <div className="hidden lg:flex lg:flex-shrink-0">
          <div className="flex w-64 flex-col">
            <div className="flex min-h-0 flex-1 flex-col bg-white border-r border-gray-200">
              {/* Logo */}
              <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-coral-400 rounded-full flex items-center justify-center">
                  <Heart className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">💕 우리 벌금통</span>
              </div>

              {/* User info */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-coral-400 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {user?.display_name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{user?.display_name}</p>
                    <p className="text-sm text-gray-600 truncate">{user?.email}</p>
                  </div>
                </div>

                {state.couple && (
                  <div className="mt-3">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                      💑 커플 코드: {(state.couple as any).couple_code}
                    </span>
                  </div>
                )}
              </div>

              {/* Navigation */}
              <nav className="flex-1 px-6 py-4">
                <ul className="space-y-1">
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    const current = isCurrentPath(item.href);

                    return (
                      <li key={item.name}>
                        <Link
                          to={item.href}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            current
                              ? 'bg-primary-100 text-primary-700'
                              : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          {item.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              {/* Bottom section */}
              <div className="px-6 py-4 border-t border-gray-200">
                {/* Online status */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-gray-600">연결 상태</span>
                  <div className="flex items-center gap-2">
                    {isOnline ? (
                      <>
                        <Wifi className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-green-600">온라인</span>
                      </>
                    ) : (
                      <>
                        <WifiOff className="w-4 h-4 text-red-500" />
                        <span className="text-sm text-red-600">오프라인</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Sign out */}
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 w-full"
                >
                  <LogOut className="w-5 h-5" />
                  로그아웃
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto pb-8 lg:pb-0">
            <div className="p-4 lg:p-8 max-w-7xl mx-auto">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav />
    </div>
  );
};