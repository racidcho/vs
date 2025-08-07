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