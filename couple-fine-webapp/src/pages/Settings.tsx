import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { 
  User, 
  Palette, 
  Shield, 
  Smartphone,
  LogOut,
  Edit,
  Save,
  X,
  Lock,
  Info,
  Heart,
  Settings as SettingsIcon
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppLock } from '../hooks/useAppLock';

export const Settings: React.FC = () => {
  const { user, signOut, updateProfile } = useAuth();
  const { state, updateCoupleTheme, updateCoupleName, getPartnerInfo, leaveCouple, validateData, refreshData } = useApp();
  const { isLocked, lock, hasPin, setPin, removePin } = useAppLock();
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [partner, setPartner] = useState<any>(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showPinChangeModal, setShowPinChangeModal] = useState(false);
  const [isEditingCoupleName, setIsEditingCoupleName] = useState(false);
  const [coupleName, setCoupleName] = useState('');

  // Handle theme change
  const handleThemeChange = async (newTheme: 'light' | 'dark') => {
    try {
      await updateCoupleTheme(newTheme);
      toast.success(`${newTheme === 'light' ? '라이트' : '다크'} 테마로 변경되었어요! 🎨`);
    } catch (error) {
      toast.error('테마 변경에 실패했어요');
    }
  };

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

  const handleUpdateCoupleName = async () => {
    if (!coupleName.trim()) {
      toast.error('커플 이름을 입력해주세요! 📝');
      return;
    }

    setIsLoading(true);
    try {
      const result = await updateCoupleName(coupleName.trim());
      if (result.error) {
        toast.error(result.error);
      } else {
        setIsEditingCoupleName(false);
        toast.success('커플 이름이 업데이트되었어요! 💕');
      }
    } catch (error) {
      toast.error('커플 이름 업데이트에 실패했어요 😢');
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

  // Load partner info and initialize couple name
  useEffect(() => {
    const loadPartnerInfo = async () => {
      if (state.couple) {
        try {
          const result = await getPartnerInfo();
          if (result && !result.error) {
            setPartner(result.partner);
          }
        } catch (error) {
          console.error('Error loading partner info:', error);
        }
        
        // Initialize couple name
        setCoupleName((state.couple as any)?.couple_name || '');
      } else {
        // If couple becomes null, clear related states
        setPartner(null);
        setCoupleName('');
        
        // Ensure loading is not stuck when couple is removed
        if (isLoading) {
          setIsLoading(false);
        }
      }
    };

    loadPartnerInfo();
  }, [state.couple, getPartnerInfo, isLoading]);

  // Safety effect: Close leave modal when couple becomes null
  useEffect(() => {
    if (!state.couple && showLeaveModal) {
      setShowLeaveModal(false);
    }
  }, [state.couple, showLeaveModal]);

  const handleLeaveCouple = async () => {
    setIsLoading(true);
    try {
      const result = await leaveCouple();
      if (result.success) {
        toast.success('커플 연결이 해제되었어요 💔');
        setShowLeaveModal(false);
        
        // Clear local states related to couple
        setPartner(null);
        setCoupleName('');
        
        // Force a small delay to ensure state propagation
        setTimeout(() => {
          setIsLoading(false);
        }, 500);
      } else {
        toast.error(result.error || '연결 해제에 실패했어요 😢');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Leave couple error:', error);
      toast.error('연결 해제에 실패했어요 😢');
      setIsLoading(false);
    }
  };

  const handleChangePinMode = () => {
    setShowPinChangeModal(true);
    setNewPin('');
    setConfirmPin('');
  };

  const handleChangePIN = async () => {
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
      setShowPinChangeModal(false);
      toast.success('PIN이 변경되었어요! 🔐');
    } else {
      toast.error(result.error || 'PIN 변경에 실패했어요 😢');
    }
  };

  const handleRemovePIN = async () => {
    const result = await removePin();
    if (result.success) {
      toast.success('PIN이 제거되었어요! 🔓');
    } else {
      toast.error(result.error || 'PIN 제거에 실패했어요 😢');
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

  const handleValidateData = async () => {
    setIsLoading(true);
    try {
      const result = await validateData();
      
      if (result.isValid) {
        toast.success('데이터가 모두 정상이에요! ✅');
      } else {
        toast.error(`${result.errors.length}개의 데이터 불일치가 발견되었어요`);
        console.warn('Data validation errors:', result.errors);
      }
    } catch (error) {
      toast.error('데이터 검증 중 오류가 발생했어요 😢');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshData = async () => {
    setIsLoading(true);
    try {
      await refreshData();
      toast.success('데이터가 새로고침되었어요! 🔄');
    } catch (error) {
      toast.error('데이터 새로고침에 실패했어요 😢');
    } finally {
      setIsLoading(false);
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
            {/* Couple Name */}
            <div className="p-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-gray-700 font-medium flex items-center gap-2">
                  <span>💕</span> 커플 이름
                </span>
                {!isEditingCoupleName && (
                  <button
                    onClick={() => setIsEditingCoupleName(true)}
                    className="text-pink-600 hover:text-pink-700 text-sm font-medium flex items-center gap-1 transition-colors"
                  >
                    <Edit className="w-3 h-3" />
                    수정
                  </button>
                )}
              </div>
              
              {isEditingCoupleName ? (
                <div className="mt-3 space-y-3">
                  <input
                    type="text"
                    value={coupleName}
                    onChange={(e) => setCoupleName(e.target.value)}
                    className="input-field bg-white border-pink-200 focus:border-pink-400"
                    placeholder="커플 이름을 입력하세요"
                    maxLength={20}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleUpdateCoupleName}
                      disabled={isLoading || !coupleName.trim()}
                      className="px-3 py-1 bg-pink-600 text-white rounded-lg text-sm hover:bg-pink-700 transition-colors disabled:opacity-50 flex items-center gap-1"
                    >
                      <Save className="w-3 h-3" />
                      저장
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingCoupleName(false);
                        setCoupleName((state.couple as any)?.couple_name || '');
                      }}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors flex items-center gap-1"
                    >
                      <X className="w-3 h-3" />
                      취소
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-2">
                  <span className="text-gray-900 font-medium">
                    {(state.couple as any)?.couple_name || '우리'}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-indigo-50 to-cyan-50 rounded-xl">
              <span className="text-gray-700 font-medium flex items-center gap-2">
                <span>💑</span> 커플 코드
              </span>
              <span className="font-mono font-bold text-indigo-600 bg-white px-3 py-1 rounded-lg">
                {(state.couple as any).couple_code}
              </span>
            </div>

            {partner && (
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-teal-50 rounded-xl">
                <span className="text-gray-700 font-medium flex items-center gap-2">
                  <span>👫</span> 파트너
                </span>
                <span className="text-gray-900 font-medium">
                  {partner.display_name}
                </span>
              </div>
            )}
            
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
                <span>💰</span> 현재 벌금
              </span>
              <span className="text-gray-900 font-medium">
                {(state.couple as any)?.total_balance?.toLocaleString() || '0'}원
              </span>
            </div>

            {/* Leave Couple Button */}
            <div className="pt-2">
              <button
                onClick={() => setShowLeaveModal(true)}
                className="w-full p-3 bg-gradient-to-r from-red-50 to-pink-50 text-red-600 hover:from-red-100 hover:to-pink-100 rounded-xl transition-all font-medium flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                커플 연결 해제
              </button>
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
                  PIN 설정
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-green-50 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-800">
                      PIN 보호가 {isLocked ? '활성화' : '설정'}되었어요
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleChangePinMode}
                      className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                    >
                      변경
                    </button>
                    <button
                      onClick={handleRemovePIN}
                      className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                    >
                      제거
                    </button>
                  </div>
                </div>
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
            <select 
              value={state.theme}
              onChange={(e) => handleThemeChange(e.target.value as 'light' | 'dark')}
              className="input-field text-sm min-w-0 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 focus:border-indigo-400"
            >
              <option value="light">밝은 테마</option>
              <option value="dark">어두운 테마</option>
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

      {/* Advanced Settings */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-pink-100">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-indigo-400 rounded-lg flex items-center justify-center">
            <SettingsIcon className="w-4 h-4 text-white" />
          </div>
          고급 설정
        </h2>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900">데이터 동기화 검증 🔍</h3>
              <p className="text-sm text-gray-600">데이터 무결성을 확인하고 불일치를 감지해요</p>
            </div>
            <button 
              onClick={handleValidateData}
              disabled={isLoading}
              className="px-4 py-2 bg-gradient-to-r from-purple-400 to-indigo-400 text-white rounded-xl font-medium text-sm shadow-sm hover:shadow-md transition-all hover:scale-105 active:scale-95 flex items-center gap-1 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Shield className="w-3 h-3" />
              )}
              검증
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900">데이터 새로고침 🔄</h3>
              <p className="text-sm text-gray-600">서버에서 최신 데이터를 다시 불러와요</p>
            </div>
            <button 
              onClick={handleRefreshData}
              disabled={isLoading}
              className="px-4 py-2 bg-gradient-to-r from-green-400 to-teal-400 text-white rounded-xl font-medium text-sm shadow-sm hover:shadow-md transition-all hover:scale-105 active:scale-95 flex items-center gap-1 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>🔄</>
              )}
              새로고침
            </button>
          </div>

          {/* Connection Status */}
          <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-gray-700 font-medium flex items-center gap-2">
                <span>📡</span> 실시간 연결 상태
              </span>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${state.isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm font-medium text-gray-900">
                  {state.isOnline ? '온라인' : '오프라인'}
                </span>
              </div>
            </div>
            <p className="text-xs text-blue-700 mt-1">
              실시간 데이터 동기화를 위한 서버 연결 상태입니다
            </p>
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
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-pink-100">
        <div className="text-center space-y-2">
          <div className="text-sm text-gray-500 flex items-center justify-center gap-2">
            <span>💕</span>
            <span>우리 벌금통 v1.0.0</span>
            <span>💕</span>
          </div>
          {state.couple && (
            <div className="text-xs text-gray-400 space-y-1">
              <p>커플 ID: {state.couple.id}</p>
              <p>생성일: {new Date(state.couple.created_at).toLocaleDateString('ko-KR')}</p>
              <p>마지막 업데이트: {new Date().toLocaleString('ko-KR')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Leave Couple Confirmation Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-2 text-center">
              커플 연결 해제 확인
            </h3>
            <p className="text-gray-600 text-sm mb-6 text-center">
              정말로 커플 연결을 해제하시겠어요? 이 작업은 되돌릴 수 없어요. 
              모든 데이터는 보존되지만 파트너와의 연결이 끊어집니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLeaveModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleLeaveCouple}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    처리중
                  </>
                ) : (
                  '연결 해제'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PIN Change Modal */}
      {showPinChangeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-2 text-center">
              PIN 변경
            </h3>
            <p className="text-gray-600 text-sm mb-4 text-center">
              새로운 4자리 PIN을 설정해주세요
            </p>
            <div className="space-y-3 mb-6">
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                placeholder="새 PIN (4자리)"
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
            <div className="flex gap-3">
              <button
                onClick={() => setShowPinChangeModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleChangePIN}
                disabled={newPin.length !== 4 || confirmPin.length !== 4}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                변경
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};