import React from 'react';
import { User } from 'lucide-react';

interface AvatarProps {
  /** 사용자 정보 */
  user?: {
    display_name?: string;
    avatar_url?: string | null;
    email?: string;
  } | null;
  /** 아바타 크기 (px) */
  size?: number;
  /** CSS 클래스명 */
  className?: string;
  /** 클릭 이벤트 */
  onClick?: () => void;
  /** 편집 가능 여부 (편집 아이콘 표시) */
  editable?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
  user,
  size = 56,
  className = '',
  onClick,
  editable = false
}) => {
  // 사용자 이니셜 생성
  const getInitials = () => {
    if (user?.display_name) {
      // 한글 이름인 경우 첫 글자만
      if (/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(user.display_name)) {
        return user.display_name.charAt(0);
      }
      // 영문 이름인 경우 첫 글자들
      return user.display_name
        .split(' ')
        .map(name => name.charAt(0))
        .join('')
        .slice(0, 2)
        .toUpperCase();
    }
    
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    
    return '?';
  };

  // 컨테이너 스타일
  const containerStyle = {
    width: size,
    height: size,
    minWidth: size,
    minHeight: size
  };

  // 기본 클래스
  const baseClasses = `
    relative flex items-center justify-center 
    rounded-full overflow-hidden 
    bg-gradient-to-br from-pink-400 to-purple-400
    ${onClick ? 'cursor-pointer hover:shadow-lg transition-all hover:scale-105' : ''}
    ${className}
  `.trim();

  return (
    <div 
      className={baseClasses}
      style={containerStyle}
      onClick={onClick}
    >
      {user?.avatar_url ? (
        // 프로필 사진이 있는 경우
        <img
          src={user.avatar_url}
          alt={`${user.display_name || 'User'} 프로필`}
          className="w-full h-full object-cover"
          onError={(e) => {
            // 이미지 로드 실패 시 숨김
            const img = e.target as HTMLImageElement;
            img.style.display = 'none';
          }}
        />
      ) : (
        // 프로필 사진이 없는 경우 - 이니셜 또는 기본 아이콘
        <span 
          className="text-white font-bold select-none"
          style={{ fontSize: size * 0.4 }}
        >
          {getInitials()}
        </span>
      )}
      
      {/* 편집 가능한 경우 편집 아이콘 표시 */}
      {editable && (
        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center">
          <User className="w-3 h-3 text-gray-600" />
        </div>
      )}
      
      {/* 프로필 사진 로드 실패 시 대체 이미지 */}
      {user?.avatar_url && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-pink-400 to-purple-400">
          <span 
            className="text-white font-bold select-none"
            style={{ fontSize: size * 0.4 }}
          >
            {getInitials()}
          </span>
        </div>
      )}
    </div>
  );
};

// 미리 정의된 크기 variants
export const AvatarSizes = {
  xs: 32,    // 작은 아이콘용
  sm: 40,    // 네비게이션용
  md: 56,    // 기본 크기
  lg: 80,    // 프로필 페이지용
  xl: 120,   // 대형 프로필용
} as const;