import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { Heart, Sparkles, User, Users, ArrowRight, Loader2, Camera } from 'lucide-react';
import { updateProfile } from '../lib/supabaseApi';
import toast from 'react-hot-toast';

export const NameSetup: React.FC = () => {
  const navigate = useNavigate();
  const { user, refreshUser, updateProfile: updateAuthProfile } = useAuth();
  const { getPartnerInfo } = useApp();
  
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [partnerName, setPartnerName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasPartner, setHasPartner] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatar_url || null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load partner info on mount
  useEffect(() => {
    const loadPartnerInfo = async () => {
      try {
        const partnerInfo = await getPartnerInfo();
        if (partnerInfo?.partner && partnerInfo.partner.display_name) {
          setPartnerName(partnerInfo.partner.display_name);
          setHasPartner(true);
        }
      } catch (error) {
        console.log('Partner info not available yet');
      }
    };

    loadPartnerInfo();
  }, [getPartnerInfo]);

  // Handle avatar upload
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('이미지 파일만 선택 가능해요! 📷');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('파일 크기는 5MB 이하여야 해요! 📦');
      return;
    }

    setIsUploadingAvatar(true);

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        setAvatarUrl(base64String);
        toast.success('프로필 사진이 선택되었어요! 📸');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('사진 업로드에 실패했어요 😢');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSaveName = async () => {
    if (!displayName.trim()) {
      toast.error('이름을 입력해주세요! 📝');
      return;
    }

    if (!user) {
      toast.error('사용자 정보를 찾을 수 없어요 😢');
      return;
    }

    setIsLoading(true);
    
    try {
      // Update user profile with new display name and avatar if provided
      const updates: any = { display_name: displayName.trim() };
      if (avatarUrl) {
        updates.avatar_url = avatarUrl;
      }
      
      await updateProfile(user.id, updates);
      
      // Also update auth context if avatar was changed
      if (avatarUrl) {
        await updateAuthProfile({ avatar_url: avatarUrl });
      }
      
      // Refresh user context to get updated data
      await refreshUser();
      
      toast.success('이름이 저장되었어요! 💕');
      
      // Check if the couple is complete (both partners connected)
      // The second user who joins should see the celebration screen
      try {
        const updatedPartnerInfo = await getPartnerInfo();
        
        // Check if we have a partner (meaning couple is complete)
        const coupleIsComplete = updatedPartnerInfo?.partner !== null && updatedPartnerInfo?.partner !== undefined;
        
        if (coupleIsComplete) {
          // Couple is complete - second user should see celebration
          console.log('🎉 NAMESETUP: Couple is complete, navigating to celebration');
          setTimeout(() => {
            navigate('/couple-complete');
          }, 1500);
        } else {
          // First user who created couple - go to dashboard to wait
          console.log('⏳ NAMESETUP: First user, navigating to dashboard');
          setTimeout(() => {
            navigate('/dashboard');
          }, 1500);
        }
      } catch (error) {
        console.error('Failed to check partner info:', error);
        // Fallback to dashboard if partner info fails
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      }
      
    } catch (error) {
      console.error('Failed to update display name:', error);
      toast.error('이름 저장에 실패했어요 😢');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-coral-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      {/* Floating heart animations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 text-pink-300 animate-bounce" style={{ animationDelay: '0s', animationDuration: '3s' }}>
          💕
        </div>
        <div className="absolute top-32 right-32 text-purple-300 animate-pulse" style={{ animationDelay: '1s', animationDuration: '2s' }}>
          💖
        </div>
        <div className="absolute bottom-40 left-40 text-coral-300 animate-bounce" style={{ animationDelay: '2s', animationDuration: '2.5s' }}>
          💑
        </div>
        <div className="absolute bottom-60 right-20 text-pink-400 animate-pulse" style={{ animationDelay: '0.5s', animationDuration: '3s' }}>
          👩‍❤️‍👨
        </div>
        <div className="absolute top-1/2 left-10 text-purple-200 animate-bounce" style={{ animationDelay: '1.5s', animationDuration: '2.8s' }}>
          ✨
        </div>
        <div className="absolute top-1/3 right-10 text-coral-200 animate-pulse" style={{ animationDelay: '2.5s', animationDuration: '3.2s' }}>
          💫
        </div>
      </div>

      <div className="max-w-md mx-auto relative z-10">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-pink-100 overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-pink-400 via-purple-400 to-coral-400 p-8 text-center relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
            <div className="absolute top-4 left-4 text-white/30 animate-spin" style={{ animationDuration: '8s' }}>
              ✨
            </div>
            <div className="absolute top-6 right-6 text-white/40 animate-pulse">
              💫
            </div>
            <div className="absolute bottom-4 left-8 text-white/20 animate-bounce" style={{ animationDuration: '2.5s' }}>
              💖
            </div>
            <div className="absolute bottom-6 right-4 text-white/30 animate-pulse" style={{ animationDelay: '1s' }}>
              💕
            </div>
            
            <div className="relative z-10">
              {/* Main icon */}
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <div className="text-4xl animate-bounce" style={{ animationDuration: '2s' }}>
                  💑
                </div>
              </div>
              
              {/* Title */}
              <h1 className="text-2xl font-bold text-white mb-2 drop-shadow-sm">
                서로를 뭐라고 부를까요? 💕
              </h1>
              <p className="text-pink-100 text-sm font-medium">
                애칭을 정해보세요!
              </p>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-8 space-y-6">
            {/* Profile Photo Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-center">
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full overflow-hidden shadow-lg border-3 border-pink-200">
                    {avatarUrl ? (
                      <img 
                        src={avatarUrl} 
                        alt="프로필"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Camera className="w-10 h-10 text-pink-300" />
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    className="absolute bottom-0 right-0 w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                  >
                    <Camera className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-500 text-center">
                프로필 사진 (선택사항) 📸
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>

            {/* User Name Input */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-gray-700">
                <User className="w-4 h-4 text-pink-500" />
                <label className="text-sm font-semibold">내 이름</label>
                <div className="text-pink-500 animate-bounce">
                  👩
                </div>
              </div>
              
              <div className="relative group">
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="사랑스러운 이름을 입력하세요 ✨"
                  className="w-full px-4 py-3 bg-gradient-to-r from-pink-50 to-purple-50 border-2 border-pink-200 rounded-xl text-center font-medium text-gray-800 placeholder-gray-400 focus:border-pink-400 focus:ring-4 focus:ring-pink-100 transition-all duration-300 group-hover:shadow-md"
                  maxLength={20}
                  required
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-pink-400 animate-pulse">
                  💖
                </div>
              </div>
              
              <p className="text-xs text-gray-500 text-center">
                파트너가 보게 될 이름이에요
              </p>
            </div>

            {/* Partner Name Display */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-gray-700">
                <Users className="w-4 h-4 text-purple-500" />
                <label className="text-sm font-semibold">파트너 이름</label>
                <div className="text-purple-500 animate-bounce" style={{ animationDelay: '0.5s' }}>
                  👨
                </div>
              </div>
              
              <div className="relative">
                <div className="w-full px-4 py-3 bg-gradient-to-r from-purple-50 to-coral-50 border-2 border-purple-200 rounded-xl text-center font-medium text-gray-600 min-h-[48px] flex items-center justify-center">
                  {hasPartner && partnerName ? (
                    <div className="flex items-center gap-2">
                      <span className="animate-pulse">💕</span>
                      <span>{partnerName}</span>
                      <span className="animate-pulse">💕</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-400">
                      <Sparkles className="w-4 h-4 animate-spin" style={{ animationDuration: '3s' }} />
                      <span className="text-sm">파트너가 이름을 설정하면 여기에 표시돼요</span>
                      <Sparkles className="w-4 h-4 animate-spin" style={{ animationDuration: '3s', animationDelay: '1.5s' }} />
                    </div>
                  )}
                </div>
              </div>
            </div>


            {/* Action Button */}
            <button
              onClick={handleSaveName}
              disabled={isLoading || !displayName.trim()}
              className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-coral-500 hover:from-pink-600 hover:via-purple-600 hover:to-coral-600 disabled:from-gray-300 disabled:via-gray-400 disabled:to-gray-300 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 hover:shadow-lg hover:scale-105 disabled:hover:scale-100 disabled:cursor-not-allowed group"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>저장 중...</span>
                  <div className="animate-pulse">💫</div>
                </>
              ) : (
                <>
                  <Heart className="w-5 h-5 group-hover:animate-pulse" />
                  <span>시작하기</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>


            {/* Bottom decoration */}
            <div className="text-center pt-4 border-t border-pink-100/50">
              <div className="flex items-center justify-center gap-2 text-pink-400">
                <div className="animate-pulse" style={{ animationDelay: '0s' }}>💕</div>
                <div className="animate-pulse" style={{ animationDelay: '0.3s' }}>💖</div>
                <div className="animate-pulse" style={{ animationDelay: '0.6s' }}>💑</div>
                <div className="animate-pulse" style={{ animationDelay: '0.9s' }}>💖</div>
                <div className="animate-pulse" style={{ animationDelay: '1.2s' }}>💕</div>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                커플 벌금 관리의 시작이에요! 🎉
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};