import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { 
  User, 
  Palette, 
  Shield, 
  Smartphone,
  Users,
  LogOut,
  Edit,
  Save,
  X,
  Lock,
  Info,
  Sparkles,
  Heart,
  Settings as SettingsIcon,
  Bell,
  Star
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppLock } from '../hooks/useAppLock';

export const Settings: React.FC = () => {
  const { user, signOut, updateProfile } = useAuth();
  const { state } = useApp();
  const { isLocked, lock, hasPin, setPin } = useAppLock();
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdateProfile = async () => {
    if (!displayName.trim()) {
      toast.error('이름을 입력해주세요! 📝');
      return;
    }

    setIsLoading(true);
    try {
      await updateProfile({ display_name: displayName.trim() });
      setIsEditingProfile(false);
      toast.success('프로필이 업데이트되었어요! ✨');
    } catch (error) {
      toast.error('프로필 업데이트에 실패했어요 😢');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetupPin = async () => {
    if (newPin.length !== 4) {
      toast.error('PIN은 4자리여야 해요! 🔢');
      return;
    }

    if (newPin !== confirmPin) {
      toast.error('PIN이 일치하지 않아요! 🔄');
      return;
    }

    const result = await setPin(newPin);
    if (result.success) {
      setNewPin('');
      setConfirmPin('');
      toast.success('PIN이 설정되었어요! 🔐');
    } else {
      toast.error(result.error || 'PIN 설정에 실패했어요 😢');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('안녕히 가세요! 👋');
    } catch (error) {
      toast.error('로그아웃에 실패했어요 😢');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-pink-100">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent">
            내 정보 설정
          </h1>
          <SettingsIcon className="w-5 h-5 text-cyan-400 animate-pulse" />
        </div>
        <p className="text-gray-600 text-sm">
          프로필과 앱 설정을 관리해보세요 ⚙️
        </p>
      </div>

      {/* Profile Section */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-pink-100">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-pink-400 to-purple-400 rounded-lg flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          프로필
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-purple-400 rounded-2xl flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-2xl">
                {user?.display_name?.charAt(0) || '💕'}
              </span>
            </div>
            <div className="flex-1">
              {isEditingProfile ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="input-field bg-gradient-to-r from-pink-50 to-purple-50 border-pink-200 focus:border-pink-400"
                    placeholder="닉네임을 입력해주세요"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleUpdateProfile}
                      disabled={isLoading}
                      className="px-4 py-2 bg-gradient-to-r from-pink-400 to-purple-400 text-white rounded-xl font-medium text-sm shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-1"
                    >
                      <Save className="w-3 h-3" />
                      저장
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingProfile(false);
                        setDisplayName(user?.display_name || '');
                      }}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-200 transition-all flex items-center gap-1"
                    >
                      <X className="w-3 h-3" />
                      취소
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{user?.display_name}</h3>
                  <p className="text-gray-600 text-sm">{user?.email}</p>
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="text-pink-600 hover:text-pink-700 text-sm font-medium flex items-center gap-1 mt-2 transition-colors"
                  >
                    <Edit className="w-3 h-3" />
                    프로필 수정
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Couple Information */}
      {state.couple && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-pink-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-pink-400 to-red-400 rounded-lg flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" />
            </div>
            커플 정보
          </h2>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl">
              <span className="text-gray-700 font-medium flex items-center gap-2">
                <span>💑</span> 커플 코드
              </span>
              <span className="font-mono font-bold text-pink-600 bg-white px-3 py-1 rounded-lg">
                {state.couple.code}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl">
              <span className="text-gray-700 font-medium flex items-center gap-2">
                <span>📅</span> 시작일
              </span>
              <span className="text-gray-900 font-medium">
                {new Date(state.couple.created_at).toLocaleDateString('ko-KR')}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl">
              <span className="text-gray-700 font-medium flex items-center gap-2">
                <span>🎨</span> 테마
              </span>
              <span className="text-gray-900 font-medium capitalize">
                {state.couple.theme === 'cute' ? '귀여움' : state.couple.theme}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Security */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-pink-100">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-teal-400 rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          보안 설정
        </h2>
        
        <div className="space-y-4">
          {/* App Lock */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-gray-900">앱 잠금 🔐</h3>
                <p className="text-sm text-gray-600">4자리 PIN으로 앱을 보호하세요</p>
              </div>
              {hasPin && (
                <button
                  onClick={lock}
                  className="p-2 rounded-lg text-red-600 hover:bg-red-50"
                  disabled={isLocked}
                >
                  <Lock className="w-5 h-5" />
                </button>
              )}
            </div>
            
            {!hasPin ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="4자리 PIN"
                    className="input-field text-center bg-gradient-to-r from-green-50 to-teal-50 border-green-200 focus:border-green-400"
                  />
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="PIN 확인"
                    className="input-field text-center"
                  />
                </div>
                <button
                  onClick={handleSetupPin}
                  disabled={newPin.length !== 4 || confirmPin.length !== 4}
                  className="btn-primary text-sm w-full"
                >
                  {hasPin ? 'PIN 변경' : 'PIN 설정'}
                </button>
              </div>
            ) : (
              <div className="p-3 bg-green-50 rounded-lg flex items-center gap-2">
                <Lock className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-800">
                  PIN 보호가 {isLocked ? '활성화' : '설정'}되었어요
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* App Preferences */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-pink-100">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-lg flex items-center justify-center">
            <Palette className="w-4 h-4 text-white" />
          </div>
          환경설정
        </h2>
        
        <div className="space-y-4">
          {/* Theme */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900">테마 🎨</h3>
              <p className="text-sm text-gray-600">선호하는 색상 테마를 선택하세요</p>
            </div>
            <select className="input-field text-sm min-w-0 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 focus:border-indigo-400">
              <option>밝은 테마</option>
              <option>어두운 테마</option>
              <option>자동</option>
            </select>
          </div>

          {/* Notifications */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900">푸시 알림 🔔</h3>
              <p className="text-sm text-gray-600">벌금과 보상에 대한 알림을 받아보세요</p>
            </div>
            <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
              <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
            </button>
          </div>

          {/* PWA Install */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900">앱 설치 📱</h3>
              <p className="text-sm text-gray-600">홈 화면에 추가해서 빠르게 접근하세요</p>
            </div>
            <button className="px-4 py-2 bg-gradient-to-r from-indigo-400 to-purple-400 text-white rounded-xl font-medium text-sm shadow-sm hover:shadow-md transition-all hover:scale-105 active:scale-95 flex items-center gap-1">
              <Smartphone className="w-3 h-3" />
              설치
            </button>
          </div>
        </div>
      </div>

      {/* Support */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-pink-100">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-lg flex items-center justify-center">
            <Info className="w-4 h-4 text-white" />
          </div>
          도움말 & 지원
        </h2>
        
        <div className="space-y-2">
          <button className="w-full text-left p-3 bg-gradient-to-r from-yellow-50 to-orange-50 hover:from-yellow-100 hover:to-orange-100 rounded-xl transition-all flex items-center gap-3">
            <span className="text-xl">❓</span>
            <span className="text-gray-700 font-medium">도움말 & FAQ</span>
          </button>
          <button className="w-full text-left p-3 bg-gradient-to-r from-orange-50 to-pink-50 hover:from-orange-100 hover:to-pink-100 rounded-xl transition-all flex items-center gap-3">
            <span className="text-xl">📧</span>
            <span className="text-gray-700 font-medium">고객 지원</span>
          </button>
          <button className="w-full text-left p-3 bg-gradient-to-r from-pink-50 to-purple-50 hover:from-pink-100 hover:to-purple-100 rounded-xl transition-all flex items-center gap-3">
            <span className="text-xl">🔒</span>
            <span className="text-gray-700 font-medium">개인정보 처리방침</span>
          </button>
          <button className="w-full text-left p-3 bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 rounded-xl transition-all flex items-center gap-3">
            <span className="text-xl">📜</span>
            <span className="text-gray-700 font-medium">이용 약관</span>
          </button>
        </div>
      </div>

      {/* Sign Out */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-pink-100">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 p-4 bg-gradient-to-r from-red-50 to-pink-50 text-red-600 hover:from-red-100 hover:to-pink-100 rounded-xl transition-all font-bold hover:scale-105 active:scale-95"
        >
          <LogOut className="w-4 h-4" />
          로그아웃
        </button>
      </div>

      {/* App Version */}
      <div className="text-center text-sm text-gray-500 flex items-center justify-center gap-2">
        <span>💕</span>
        <span>우리 벌금통 v1.0.0</span>
        <span>💕</span>
      </div>
    </div>
  );
};