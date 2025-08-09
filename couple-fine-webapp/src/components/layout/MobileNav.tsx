import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Heart,
  PlusCircle,
  Gift,
  User,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
  {
    name: '홈',
    href: '/',
    icon: Home,
    emoji: '🏠',
    gradient: 'from-pink-400 to-rose-400'
  },
  {
    name: '규칙',
    href: '/rules',
    icon: Heart,
    emoji: '💝',
    gradient: 'from-purple-400 to-pink-400'
  },
  {
    name: '기록',
    href: '/violations/new',
    icon: PlusCircle,
    emoji: '✍️',
    gradient: 'from-coral-400 to-orange-400',
    isCenter: true
  },
  {
    name: '보상',
    href: '/rewards',
    icon: Gift,
    emoji: '🎁',
    gradient: 'from-indigo-400 to-purple-400'
  },
  {
    name: '내정보',
    href: '/settings',
    icon: User,
    emoji: '👤',
    gradient: 'from-teal-400 to-cyan-400'
  },
];

// Fine Status Bar Component
const FineStatusBar: React.FC = () => {
  const { state, getUserTotalFines } = useApp();
  const { user } = useAuth();

  if (!state.couple || !user) return null;

  const partner1 = (state.couple as any).partner_1;
  const partner2 = (state.couple as any).partner_2;
  
  // Determine current user and partner
  const currentUser = partner1?.id === user.id ? partner1 : partner2;
  const partner = partner1?.id === user.id ? partner2 : partner1;
  
  if (!currentUser || !partner) return null;

  // Calculate total fines for each partner
  const currentUserFines = getUserTotalFines(currentUser.id);
  const partnerFines = getUserTotalFines(partner.id);
  
  // Calculate total and progress ratios
  const totalFines = currentUserFines + partnerFines;
  const currentUserRatio = totalFines > 0 ? (currentUserFines / totalFines) * 100 : 50;
  const partnerRatio = totalFines > 0 ? (partnerFines / totalFines) * 100 : 50;
  
  // Determine who's winning (has more fines = losing)
  const currentUserWinning = currentUserFines < partnerFines;
  const isEqual = currentUserFines === partnerFines;
  
  // Format currency
  const formatAmount = (amount: number) => {
    if (amount === 0) return '0원';
    return amount >= 10000 
      ? `${Math.floor(amount / 10000)}만${amount % 10000 > 0 ? Math.floor((amount % 10000) / 1000) + '천' : ''}원`
      : amount >= 1000
      ? `${Math.floor(amount / 1000)}천${amount % 1000 > 0 ? amount % 1000 : ''}원`
      : `${amount}원`;
  };

  return (
    <div className="bg-gradient-to-r from-pink-50 via-purple-50 to-pink-50 px-3 py-2.5 border-b border-pink-100/50 backdrop-blur-sm relative">
      {/* Partner Names and Amounts */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-sm animate-bounce">👩</span>
          <div className="flex flex-col">
            <span className={`text-xs font-semibold ${currentUserWinning ? 'text-green-600' : 'text-pink-700'}`}>
              {currentUser.display_name}
              {currentUserWinning && totalFines > 0 && <span className="ml-1">🏆</span>}
            </span>
            <span className={`text-xs font-bold ${currentUserWinning ? 'text-green-700' : 'text-pink-600'}`}>
              {formatAmount(currentUserFines)}
            </span>
          </div>
        </div>
        
        <div className="flex flex-col items-center">
          <span className="text-xs font-bold text-purple-600 animate-pulse px-2">
            VS
          </span>
          {isEqual && totalFines > 0 && (
            <span className="text-xs text-purple-500">무승부!</span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex flex-col items-end">
            <span className={`text-xs font-semibold ${!currentUserWinning && !isEqual ? 'text-green-600' : 'text-blue-700'}`}>
              {partner.display_name}
              {!currentUserWinning && !isEqual && totalFines > 0 && <span className="ml-1">🏆</span>}
            </span>
            <span className={`text-xs font-bold ${!currentUserWinning && !isEqual ? 'text-green-700' : 'text-blue-600'}`}>
              {formatAmount(partnerFines)}
            </span>
          </div>
          <span className="text-sm animate-bounce">👨</span>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden shadow-inner">
        {/* Sparkle effect overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
        
        {/* Left side (current user) */}
        <div 
          className={`absolute left-0 top-0 h-full transition-all duration-1000 ease-out ${
            currentUserWinning 
              ? 'bg-gradient-to-r from-green-400 to-green-500 shadow-sm shadow-green-200' 
              : 'bg-gradient-to-r from-pink-400 to-pink-500 shadow-sm shadow-pink-200'
          }`}
          style={{ width: `${currentUserRatio}%` }}
        />
        
        {/* Right side (partner) */}
        <div 
          className={`absolute right-0 top-0 h-full transition-all duration-1000 ease-out ${
            !currentUserWinning && !isEqual
              ? 'bg-gradient-to-l from-green-400 to-green-500 shadow-sm shadow-green-200'
              : 'bg-gradient-to-l from-blue-400 to-blue-500 shadow-sm shadow-blue-200'
          }`}
          style={{ width: `${partnerRatio}%` }}
        />
        
        {/* Center divider when equal */}
        {isEqual && totalFines > 0 && (
          <div className="absolute left-1/2 top-0 w-0.5 h-full bg-purple-400 transform -translate-x-0.5" />
        )}
      </div>
      
      {/* Cute message */}
      {totalFines === 0 && (
        <p className="text-center text-xs text-purple-500 mt-1 animate-fade-in">
          아직 벌금이 없어요! 💕
        </p>
      )}
    </div>
  );
};

export const MobileNav: React.FC = () => {
  const location = useLocation();

  const isCurrentPath = (path: string) => {
    if (path === '/') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      {/* Fine Status Bar */}
      <FineStatusBar />
      
      {/* 배경 블러 효과 */}
      <div className="absolute inset-0 bg-white/80 backdrop-blur-lg border-t border-pink-100"></div>

      {/* 네비게이션 아이템들 */}
      <nav className="relative flex items-center justify-around px-2 py-2 safe-area-pb">
        {navItems.map((item) => {
          const Icon = item.icon;
          const current = isCurrentPath(item.href);

          if (item.isCenter) {
            // 중앙 버튼 (기록 추가)
            return (
              <Link
                key={item.name}
                to={item.href}
                className="relative -top-2"
              >
                <div className={`
                  relative flex flex-col items-center justify-center
                  w-14 h-14 rounded-2xl
                  bg-gradient-to-br ${item.gradient}
                  shadow-lg shadow-pink-200/50
                  transform transition-all duration-300
                  ${current ? 'scale-110 rotate-3' : 'hover:scale-105 active:scale-95'}
                `}>
                  <Icon className="w-6 h-6 text-white" />
                  {current && (
                    <div className="absolute -top-1 -right-1">
                      <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
                    </div>
                  )}
                </div>
                <span className={`
                  text-[10px] mt-1 block text-center font-medium
                  ${current ? 'text-pink-600' : 'text-gray-500'}
                `}>
                  {item.name}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.name}
              to={item.href}
              className="flex flex-col items-center justify-center flex-1 py-1"
            >
              <div className={`
                relative flex items-center justify-center
                w-10 h-10 rounded-xl
                transition-all duration-300
                ${current
                  ? `bg-gradient-to-br ${item.gradient} shadow-md scale-110`
                  : 'hover:bg-pink-50 active:scale-95'
                }
              `}>
                {current ? (
                  <>
                    <Icon className="w-5 h-5 text-white" />
                    <div className="absolute -top-1 -right-1">
                      <span className="text-xs animate-bounce">{item.emoji}</span>
                    </div>
                  </>
                ) : (
                  <Icon className={`w-5 h-5 text-gray-500`} />
                )}
              </div>
              <span className={`
                text-[10px] mt-1 font-medium
                ${current ? 'text-pink-600' : 'text-gray-500'}
              `}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};