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
  const { state, updateCoupleName, getPartnerInfo, leaveCouple, validateData, refreshData } = useApp();
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

  // PWA Install State
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIOSInstallModal, setShowIOSInstallModal] = useState(false);

  // Check if app is already installed
  useEffect(() => {
    // Check if app is running in standalone mode (PWA installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone ||
                        document.referrer.includes('android-app://');
    
    setIsInstalled(isStandalone);
  }, []);

  // PWA Install Prompt Handler
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      console.log('PWA install prompt available');
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  // PWA Install Functions
  const handleInstallPWA = async () => {
    console.log('Install PWA clicked');
    
    // Check if it's iOS Safari
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    
    if (isIOS && isSafari) {
      console.log('iOS Safari detected - showing install instructions');
      setShowIOSInstallModal(true);
      return;
    }

    // Android/Chrome PWA install
    if (installPrompt) {
      console.log('Showing install prompt');
      const result = await (installPrompt as any).prompt();
      console.log('Install prompt result:', result);
      
      if (result.outcome === 'accepted') {
        toast.success('앱이 설치되었어요! 📱');
        setIsInstalled(true);
      } else {
        toast.error('앱 설치가 취소되었어요');
      }
      
      setInstallPrompt(null);
    } else {
      console.log('No install prompt available');
      toast.error('현재 브라우저에서는 앱 설치를 지원하지 않아요 😢');
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
      console.error('Profile update error:', error);
      toast.error('프로필 업데이트에 실패했어요 😢');
    } finally {
      // **무한 로딩 방지**: 항상 로딩 상태 해제
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
      console.error('Couple name update error:', error);
      toast.error('커플 이름 업데이트에 실패했어요 😢');
    } finally {
      // **무한 로딩 방지**: 항상 로딩 상태 해제
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
      console.log('🔄 SETTINGS: loadPartnerInfo 시작');
      
      if (state.couple) {
        console.log('💑 SETTINGS: 커플 정보 존재, 파트너 정보 로드');
        try {
          const result = await getPartnerInfo();
          if (result && !result.error) {
            console.log('✅ SETTINGS: 파트너 정보 로드 성공:', result.partner);
            setPartner(result.partner);
          } else {
            console.log('❌ SETTINGS: 파트너 정보 로드 실패:', result?.error);
          }
        } catch (error) {
          console.error('💥 SETTINGS: 파트너 정보 로드 예외:', error);
        }
        
        // Initialize couple name
        const newCoupleName = (state.couple as any)?.couple_name || '';
        console.log('📝 SETTINGS: 커플 이름 초기화:', newCoupleName);
        setCoupleName(newCoupleName);
      } else {
        console.log('❌ SETTINGS: 커플 정보 없음, 관련 상태 초기화');
        // If couple becomes null, clear related states
        setPartner(null);
        setCoupleName('');
        
        // **무한 로딩 방지**: 커플 해제 시 로딩 상태 확실히 해제
        if (isLoading) {
          console.log('✅ SETTINGS: 로딩 상태 해제 (커플 없음)');
          setIsLoading(false);
        }
      }
    };

    loadPartnerInfo();
  }, [state.couple]); // **중요**: 순환 의존성 제거 - getPartnerInfo, isLoading 제거

  // Safety effect: Close leave modal when couple becomes null
  useEffect(() => {
    if (!state.couple && showLeaveModal) {
      setShowLeaveModal(false);
    }
  }, [state.couple, showLeaveModal]);

  const handleLeaveCouple = async () => {
    // **무한 로딩 방지**: 시작 시 로딩 설정
    setIsLoading(true);
    
    try {
      console.log('🔄 SETTINGS: 커플 해제 시작');
      const result = await leaveCouple();
      
      if (result.success) {
        console.log('✅ SETTINGS: 커플 해제 성공');
        toast.success('커플 연결이 해제되었어요 💔');
        setShowLeaveModal(false);
        
        // Clear local states immediately
        setPartner(null);
        setCoupleName('');
        
        console.log('✅ SETTINGS: 로컬 상태 정리 완료');
      } else {
        console.log('❌ SETTINGS: 커플 해제 실패:', result.error);
        toast.error(result.error || '연결 해제에 실패했어요 😢');
      }
    } catch (error) {
      console.error('💥 SETTINGS: 커플 해제 예외:', error);
      toast.error('연결 해제에 실패했어요 😢');
    } finally {
      // **중요**: 모든 상황에서 로딩 상태 해제
      console.log('✅ SETTINGS: 로딩 상태 해제');
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
      console.error('Data validation error:', error);
      toast.error('데이터 검증 중 오류가 발생했어요 😢');
    } finally {
      // **무한 로딩 방지**: 항상 로딩 상태 해제
      setIsLoading(false);
    }
  };

  const handleRefreshData = async () => {
    setIsLoading(true);
    try {
      await refreshData();
      toast.success('데이터가 새로고침되었어요! 🔄');
    } catch (error) {
      console.error('Data refresh error:', error);
      toast.error('데이터 새로고침에 실패했어요 😢');
    } finally {
      // **무한 로딩 방지**: 항상 로딩 상태 해제
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
          {/* PWA Install */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900">앱 설치 📱</h3>
              <p className="text-sm text-gray-600">
                {isInstalled 
                  ? '앱이 이미 설치되어 있어요' 
                  : '홈 화면에 추가해서 빠르게 접근하세요'
                }
              </p>
            </div>
            {!isInstalled && (
              <button 
                onClick={handleInstallPWA}
                className="px-4 py-2 bg-gradient-to-r from-indigo-400 to-purple-400 text-white rounded-xl font-medium text-sm shadow-sm hover:shadow-md transition-all hover:scale-105 active:scale-95 flex items-center gap-1"
              >
                <Smartphone className="w-3 h-3" />
                설치
              </button>
            )}
            {isInstalled && (
              <div className="flex items-center gap-2 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium">설치됨</span>
              </div>
            )}
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

      {/* iOS Install Instructions Modal */}
      {showIOSInstallModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">
              앱 설치 안내 (iOS)
            </h3>
            <div className="space-y-4 text-sm text-gray-700 mb-6">
              <div className="flex items-center gap-3">
                <span className="text-2xl">1️⃣</span>
                <span>Safari 하단의 <strong>공유 버튼</strong>을 눌러주세요</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">2️⃣</span>
                <span><strong>"홈 화면에 추가"</strong> 옵션을 찾아주세요</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">3️⃣</span>
                <span><strong>"추가"</strong> 버튼을 눌러서 설치하세요</span>
              </div>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 mb-4">
              <p className="text-xs text-blue-700 text-center">
                💡 설치 후 홈 화면에서 앱을 바로 실행할 수 있어요!
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowIOSInstallModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};