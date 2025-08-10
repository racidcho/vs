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
      {/* 배경 블러 효과 */}
      <div className="absolute inset-0 bg-white/90 backdrop-blur-lg border-t border-pink-100/30"></div>

      {/* 네비게이션 아이템들 */}
      <nav className="relative flex items-center justify-around px-1 py-0.5 safe-area-pb">
        {navItems.map((item) => {
          const Icon = item.icon;
          const current = isCurrentPath(item.href);

          if (item.isCenter) {
            // 중앙 버튼 (기록 추가) - 더 작게
            return (
              <Link
                key={item.name}
                to={item.href}
                className="relative"
              >
                <div className={`
                  relative flex flex-col items-center justify-center
                  w-8 h-8 rounded-xl
                  bg-gradient-to-br ${item.gradient}
                  shadow-md shadow-pink-200/40
                  transform transition-all duration-300
                  ${current ? 'scale-105 rotate-2' : 'hover:scale-105 active:scale-95'}
                `}>
                  <Icon className="w-3 h-3 text-white" />
                  {current && (
                    <div className="absolute -top-0.5 -right-0.5">
                      <Sparkles className="w-3 h-3 text-yellow-300 animate-pulse" />
                    </div>
                  )}
                </div>
                <span className={`
                  text-[7px] mt-0.5 block text-center font-medium
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
              className="flex flex-col items-center justify-center flex-1 py-0.5"
            >
              <div className={`
                relative flex items-center justify-center
                w-6 h-6 rounded-lg
                transition-all duration-300
                ${current
                  ? `bg-gradient-to-br ${item.gradient} shadow-sm scale-105`
                  : 'hover:bg-pink-50 active:scale-95'
                }
              `}>
                {current ? (
                  <>
                    <Icon className="w-3 h-3 text-white" />
                    <div className="absolute -top-0.5 -right-0.5">
                      <span className="text-[10px] animate-bounce">{item.emoji}</span>
                    </div>
                  </>
                ) : (
                  <Icon className={`w-3 h-3 text-gray-500`} />
                )}
              </div>
              <span className={`
                text-[7px] mt-0.5 font-medium
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