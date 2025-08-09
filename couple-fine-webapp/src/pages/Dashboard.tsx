import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { getDashboardStats } from '../lib/supabaseApi';
import { toast } from 'react-hot-toast';
import { VersusWidget } from '../components/VersusWidget';
import {
  Heart,
  AlertTriangle,
  Gift,
  Plus,
  TrendingUp,
  Calendar,
  Clock,
  Sparkles,
  Trophy,
  Zap,
  Edit,
  Trash2,
  RefreshCw,
  WifiOff
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, updateViolation, deleteViolation } = useApp();
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    totalBalance: 0,
    activeRules: 0,
    thisMonthViolations: 0,
    availableRewards: 0,
    recentActivity: [] as any[]
  });
  const [loadError, setLoadError] = useState(false);
  const [editingViolation, setEditingViolation] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<number>(0);
  const [editMemo, setEditMemo] = useState<string>('');

  // 축하 페이지 본 적 있는지 체크 및 리다이렉트
  useEffect(() => {
    const checkCelebration = () => {
      if (user && state.couple) {
        const celebrationKey = `couple_celebrated_${user.id}_${state.couple.id}`;
        const hasCelebrated = localStorage.getItem(celebrationKey);
        
        // 커플이 존재하고 두 파트너 모두 이름이 설정되어 있는지 확인
        const couple = state.couple as any;
        // 단순하게 커플이 완성되었는지만 체크 (두 파트너 모두 존재)
        const coupleIsComplete = couple?.partner_1_id && couple?.partner_2_id;
        
        console.log('🎉 DASHBOARD: 축하 페이지 체크:', {
          hasCelebrated: !!hasCelebrated,
          coupleIsComplete,
          partner1Id: couple?.partner_1_id,
          partner2Id: couple?.partner_2_id,
          partner1Name: couple?.partner_1?.display_name,
          partner2Name: couple?.partner_2?.display_name,
          currentUserName: user?.display_name
        });
        
        if (coupleIsComplete && !hasCelebrated) {
          // 두 파트너 모두 있고 축하 페이지를 안 봤으면 리다이렉트
          console.log('🎉 DASHBOARD: 축하 페이지로 리다이렉트');
          navigate('/couple-complete' + location.search);
        }
      }
    };

    checkCelebration();
  }, [user, state.couple, navigate]);

  // Load real dashboard data with cleanup and abort controller
  useEffect(() => {

    // Create AbortController for cleanup
    const abortController = new AbortController();
    let isMounted = true;

    const loadDashboardData = async () => {
      // **무한 로딩 방지**: 이미 언마운트된 경우 조기 리턴
      if (!isMounted || abortController.signal.aborted) {

        return;
      }

      setLoadError(false);

      if (!user?.couple_id) {

        return;
      }

      try {
        // Check abort signal before making API call
        if (abortController.signal.aborted) {

          return;
        }

        const stats = await getDashboardStats(user.couple_id);

        // Check if still mounted and not aborted before updating state
        if (!isMounted || abortController.signal.aborted) {

          return;
        }

        setDashboardData(stats);
      } catch (error) {
        if (abortController.signal.aborted) {

          return;
        }
        console.error('💥 DASHBOARD: 데이터 로딩 실패:', error);
        // Keep default values on error
        if (isMounted) {
          setLoadError(true);
        }
      } finally {
        // **중요**: API 호출 완료 로깅
        if (isMounted) {

        }
      }
    };

    // Only load if we have required data
    if (user?.couple_id) {
      loadDashboardData();
    }

    // Cleanup function
    return () => {

      isMounted = false;
      abortController.abort();
    };
  }, [user?.couple_id]); // Only depend on couple_id change

  // Handle edit violation
  const handleEdit = (violation: any) => {
    setEditingViolation(violation.id);
    setEditAmount(Math.abs(violation.amount));
    setEditMemo(violation.memo || '');
  };

  // Handle save edit
  const handleSaveEdit = async () => {
    if (!editingViolation) return;

    try {
      const violation = state.violations.find(v => v.id === editingViolation);
      if (!violation) {
        toast.error('위반 기록을 찾을 수 없어요');
        return;
      }

      const amount = violation.amount < 0 ? -editAmount : editAmount;
      const { error } = await updateViolation(editingViolation, {
        amount,
        memo: editMemo.trim() || undefined
      });

      if (error) {
        console.error('Edit violation error:', error);
        toast.error(`수정 실패: ${error}`);
      } else {
        toast.success('위반 기록이 수정되었어요! 💝');
        setEditingViolation(null);
        setEditAmount(0);
        setEditMemo('');
      }
    } catch (error) {
      console.error('Edit violation exception:', error);
      toast.error('수정 중 오류가 발생했어요');
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingViolation(null);
    setEditAmount(0);
    setEditMemo('');
  };

  // Handle delete violation
  const handleDelete = async (violationId: string, violationInfo: string) => {
    if (!window.confirm(`"${violationInfo}" 기록을 정말 삭제하시겠어요?\n\n⚠️ 삭제된 기록은 복구할 수 없습니다.`)) {
      return;
    }

    try {
      const { error } = await deleteViolation(violationId);
      if (error) {
        console.error('Delete violation error:', error);
        toast.error(`삭제 실패: ${error}`);
      } else {
        toast.success('위반 기록이 삭제되었어요');
      }
    } catch (error) {
      console.error('Delete violation exception:', error);
      toast.error('삭제 중 오류가 발생했어요');
    }
  };

  // Get data from real API or fallback to context state
  const activeRules = dashboardData.activeRules || state.rules?.filter(r => r.is_active !== false).length || 0;
  const totalBalance = dashboardData.totalBalance || 0;
  const thisMonthViolations = dashboardData.thisMonthViolations || 0;
  const availableRewards = dashboardData.availableRewards || state.rewards?.filter(r => !r.is_achieved).length || 0;
  const recentActivity = dashboardData.recentActivity || state.violations?.slice(0, 3) || [];

  // 귀여운 인사말
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) return '🌙 새벽이네요';
    if (hour < 12) return '🌞 좋은 아침이에요';
    if (hour < 18) return '☀️ 좋은 오후예요';
    return '🌆 좋은 저녁이에요';
  };

  const statsCards = [
    {
      title: '우리 규칙',
      value: activeRules,
      unit: '개',
      icon: Heart,
      emoji: '💝',
      gradient: 'from-pink-400 to-rose-400',
      description: '함께 정한 약속'
    },
    {
      title: '이번달 벌금',
      value: thisMonthViolations,
      unit: '번',
      icon: AlertTriangle,
      emoji: '😅',
      gradient: 'from-orange-400 to-red-400',
      description: '이번 달 기록'
    },
    {
      title: '모인 벌금',
      value: Math.floor(totalBalance / 10000),
      unit: '만원',
      icon: TrendingUp,
      emoji: '💰',
      gradient: 'from-purple-400 to-indigo-400',
      description: '현재까지 모은 금액'
    },
    {
      title: '사용 가능한 보상',
      value: availableRewards,
      unit: '개',
      icon: Gift,
      emoji: '🎁',
      gradient: 'from-green-400 to-teal-400',
      description: '달성 가능한 보상'
    }
  ];

  // Show error message inline if data loading fails (but don't block the page)
  const showInlineError = loadError;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 p-4 space-y-6">
      {/* Floating Hearts Animation */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute animate-bounce" style={{ top: '10%', left: '10%', animationDelay: '0s' }}>
          💖
        </div>
        <div className="absolute animate-pulse" style={{ top: '20%', right: '20%', animationDelay: '1s' }}>
          💕
        </div>
        <div className="absolute animate-bounce" style={{ top: '60%', left: '15%', animationDelay: '2s' }}>
          💗
        </div>
        <div className="absolute animate-pulse" style={{ bottom: '20%', right: '15%', animationDelay: '3s' }}>
          ✨
        </div>
        <div className="absolute animate-bounce" style={{ top: '30%', left: '80%', animationDelay: '0.5s' }}>
          🌟
        </div>
        <div className="absolute animate-pulse" style={{ top: '70%', right: '30%', animationDelay: '1.5s' }}>
          ⭐
        </div>
      </div>

      <div className="relative z-10 space-y-6">
        {/* 인라인 오류 메시지 */}
        {showInlineError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 animate-pulse">
            <WifiOff className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-red-800">데이터를 불러오지 못했어요 😢</p>
              <p className="text-xs text-red-600">기본값으로 표시됩니다</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="text-red-600 hover:text-red-800 p-1 rounded transition-colors"
              title="새로고침"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 작은 인사말 - 1줄로 간단하게 */}
        <div className="text-center">
          <h1 className="text-lg font-bold text-gray-800 flex items-center justify-center gap-2">
            {getGreeting()}, {user?.display_name || '사랑'}님! 
            <Sparkles className="w-5 h-5 text-yellow-500 animate-spin" />
          </h1>
        </div>

        {/* 커플 정보 및 대결 위젯 */}
        {state.couple ? (
          <div>
            {/* 커플 연결 상태 카드 */}
            <div className="bg-gradient-to-r from-pink-100 via-purple-100 to-blue-100 rounded-3xl p-6 mb-4 shadow-lg border-2 border-pink-200">
              <div className="text-center mb-4">
                <h2 className="text-xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-2">
                  <span className="text-2xl animate-bounce">💑</span>
                  우리들의 연결 상태
                  <span className="text-2xl animate-bounce" style={{animationDelay: '0.5s'}}>💑</span>
                </h2>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* 내 정보 */}
                <div className="bg-white/80 rounded-2xl p-4 text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-400 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-white font-bold text-lg">
                      {user?.display_name?.charAt(0) || '👩'}
                    </span>
                  </div>
                  <p className="font-bold text-gray-900">{user?.display_name || '나'}</p>
                  <p className="text-xs text-gray-500 mt-1">나</p>
                </div>
                
                {/* 파트너 정보 */}
                <div className="bg-white/80 rounded-2xl p-4 text-center">
                  {(() => {
                    const couple = state.couple as any;
                    const isPartner1 = user?.id === couple?.partner_1_id;
                    const partnerId = isPartner1 ? couple?.partner_2_id : couple?.partner_1_id;
                    const partnerData = isPartner1 ? couple?.partner_2 : couple?.partner_1;
                    
                    // Determine partner name with fallbacks
                    let partnerName = '파트너';
                    let partnerStatus = '연결 대기 중';
                    let partnerIcon = '👨';
                    
                    if (partnerData?.display_name) {
                      partnerName = partnerData.display_name;
                      partnerStatus = '연결됨';
                      partnerIcon = partnerData.display_name.charAt(0);
                    } else if (partnerData?.email) {
                      partnerName = partnerData.email.split('@')[0];
                      partnerStatus = '이름 설정 대기';
                      partnerIcon = partnerData.email.charAt(0).toUpperCase();
                    } else if (partnerId) {
                      partnerName = '파트너';
                      partnerStatus = '정보 로딩 중...';
                      partnerIcon = '👨';
                    }
                    
                    return (
                      <>
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-full flex items-center justify-center mx-auto mb-2">
                          <span className="text-white font-bold text-lg">
                            {partnerIcon}
                          </span>
                        </div>
                        <p className="font-bold text-gray-900">
                          {partnerName}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {partnerStatus}
                        </p>
                      </>
                    );
                  })()}
                </div>
              </div>
              
              <div className="text-center">
                {state.couple.couple_code && (
                  <p className="text-sm text-pink-600 font-medium">
                    커플 코드: 💑 {state.couple.couple_code}
                  </p>
                )}
              </div>
            </div>
            
            {/* 대결 위젯 */}
            {(() => {
              const couple = state.couple as any;
              const hasBothPartners = couple?.partner_1_id && couple?.partner_2_id;
              
              if (hasBothPartners) {
                return (
                  <div className="transform hover:scale-105 transition-all duration-300">
                    <VersusWidget />
                  </div>
                );
              } else {
                return (
                  <div className="bg-gradient-to-r from-yellow-100 via-orange-100 to-pink-100 rounded-3xl p-6 text-center shadow-lg">
                    <div className="text-4xl mb-3">⏳💕</div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">파트너 연결 대기중</h3>
                    <p className="text-gray-600 text-sm">파트너가 커플 코드를 입력하면 대결이 시작돼요!</p>
                    {couple?.couple_code && (
                      <div className="mt-4 p-3 bg-white/70 rounded-xl">
                        <p className="text-xs text-gray-500 mb-1">커플 코드를 공유하세요</p>
                        <p className="font-mono font-bold text-lg text-pink-600">
                          {couple.couple_code}
                        </p>
                      </div>
                    )}
                  </div>
                );
              }
            })()}
          </div>
        ) : (
          <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-3xl p-8 text-center shadow-lg">
            <div className="text-6xl mb-4">💔</div>
            <h2 className="text-2xl font-bold text-gray-600 mb-2">커플 연결이 필요해요</h2>
            <p className="text-gray-500">먼저 커플 설정을 완료해주세요</p>
          </div>
        )}

        {/* 최근 벌금 기록 - 오늘 누가 벌금 받았나요? */}
        {recentActivity.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-pink-200">
            <div className="flex items-center justify-center gap-2 mb-6">
              <h2 className="text-2xl font-bold text-gray-800 text-center">
                오늘 누가 벌금 받았나요? 👀
              </h2>
            </div>

            <div className="space-y-4">
              {recentActivity.slice(0, 3).map((violation: any) => {
                const rule = state.rules?.find(r => r.id === violation.rule_id);
                const isAdd = violation.amount > 0;
                
                // Get violator name from relation or couple data
                const getViolatorName = () => {
                  // First try from violation relation
                  if (violation.violator?.display_name) {
                    return violation.violator.display_name;
                  }
                  if (violation.violator?.email) {
                    return violation.violator.email.split('@')[0];
                  }
                  
                  // Fallback to couple data
                  const couple = state.couple as any;
                  if (couple) {
                    if (violation.violator_user_id === couple.partner_1_id && couple.partner_1) {
                      return couple.partner_1.display_name || couple.partner_1.email?.split('@')[0] || '파트너1';
                    }
                    if (violation.violator_user_id === couple.partner_2_id && couple.partner_2) {
                      return couple.partner_2.display_name || couple.partner_2.email?.split('@')[0] || '파트너2';
                    }
                  }
                  
                  // Final fallback
                  return violation.violator_user_id === user?.id ? '나' : '파트너';
                };
                
                const violatorName = getViolatorName();
                const isPartner1 = violation.violator_user_id === (state.couple as any)?.partner_1_id;
                const cardBg = isPartner1 ? 'from-pink-100 to-pink-200' : 'from-blue-100 to-blue-200';
                const textColor = isPartner1 ? 'text-pink-800' : 'text-blue-800';

                return (
                  <div
                    key={violation.id}
                    className={`bg-gradient-to-r ${cardBg} rounded-2xl p-5 shadow-md hover:shadow-lg transition-all transform hover:scale-102`}
                  >
                    {editingViolation === violation.id ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            isAdd ? 'bg-red-100' : 'bg-green-100'
                          }`}>
                            <Edit className="w-5 h-5 text-gray-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-lg font-bold text-gray-900">{rule?.title || '알 수 없는 규칙'}</p>
                            <p className="text-sm text-gray-500">편집 중... ✏️</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">금액 (만원)</label>
                            <input
                              type="number"
                              min="1"
                              value={editAmount || ''}
                              onChange={(e) => setEditAmount(parseInt(e.target.value) || 0)}
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-lg"
                              placeholder="금액"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">메모</label>
                            <input
                              type="text"
                              value={editMemo}
                              onChange={(e) => setEditMemo(e.target.value)}
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-lg"
                              placeholder="메모 (선택사항)"
                            />
                          </div>
                        </div>

                        <div className="flex gap-3 justify-end">
                          <button
                            onClick={handleCancelEdit}
                            className="px-6 py-3 text-gray-600 hover:text-gray-800 hover:bg-white/50 rounded-xl transition-all font-medium"
                          >
                            취소 😊
                          </button>
                          <button
                            onClick={handleSaveEdit}
                            disabled={editAmount <= 0}
                            className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl hover:from-pink-600 hover:to-purple-600 disabled:opacity-50 transition-all font-medium"
                          >
                            저장 ✨
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="text-4xl">
                            {isAdd ? '😅' : '😊'}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <p className="text-xl font-bold text-gray-900">
                                {rule?.title || '알 수 없는 규칙'}
                              </p>
                              <span className="text-2xl">{isPartner1 ? '👩' : '👨'}</span>
                            </div>
                            <p className={`text-lg font-bold ${textColor} mb-1`}>
                              {violatorName}님{isAdd ? '이 벌금을 받았어요! 💸' : '이 벌금을 차감했어요! 🎉'}
                            </p>
                            <p className="text-sm text-gray-600">
                              {new Date(violation.created_at).toLocaleDateString('ko-KR', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                              {violation.memo && (
                                <>
                                  <span className="mx-2">•</span>
                                  <span className="font-medium">{violation.memo}</span>
                                </>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className={`text-2xl font-bold ${
                            isAdd ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {isAdd ? '+' : ''}{violation.amount}만원
                          </span>

                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(violation)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-white/50 rounded-xl transition-all"
                              title="편집"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(violation.id, (rule?.title || 'Unknown') + ' (' + violation.amount + '만원)')}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-white/50 rounded-xl transition-all"
                              title="삭제"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <Link
              to="/calendar"
              className="mt-6 flex items-center justify-center gap-2 py-4 text-lg font-medium text-gray-600 hover:text-gray-900 transition-colors bg-white/50 rounded-2xl hover:bg-white/80"
            >
              <Calendar className="w-5 h-5" />
              전체 기록 보기 📅
            </Link>
          </div>
        )}

        {/* 빠른 액션 버튼들 - 크고 눈에 띄게! */}
        <div className="space-y-4">
          <Link
            to="/violations/new"
            className="block bg-gradient-to-r from-red-400 via-pink-400 to-purple-400 hover:from-red-500 hover:via-pink-500 hover:to-purple-500 text-white rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 active:scale-95"
          >
            <div className="flex items-center justify-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <Plus className="w-8 h-8 text-white" />
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold mb-1">벌금 기록하기 💰</p>
                <p className="text-white/80">누가 규칙을 어겼나요? 😏</p>
              </div>
            </div>
          </Link>

          <div className="grid grid-cols-2 gap-4">
            <Link
              to="/rules"
              className="flex flex-col items-center gap-3 p-5 bg-gradient-to-br from-purple-100 to-indigo-200 hover:from-purple-200 hover:to-indigo-300 rounded-2xl border-2 border-purple-200 hover:border-purple-300 hover:shadow-lg transition-all transform hover:scale-105 active:scale-95"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-indigo-400 rounded-full flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div className="text-center">
                <span className="text-lg font-bold text-purple-800">규칙 추가 📝</span>
                <p className="text-sm text-purple-600 mt-1">새로운 약속 만들기</p>
              </div>
            </Link>

            <Link
              to="/rewards"
              className="flex flex-col items-center gap-3 p-5 bg-gradient-to-br from-green-100 to-teal-200 hover:from-green-200 hover:to-teal-300 rounded-2xl border-2 border-green-200 hover:border-green-300 hover:shadow-lg transition-all transform hover:scale-105 active:scale-95"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-teal-400 rounded-full flex items-center justify-center">
                <Gift className="w-6 h-6 text-white" />
              </div>
              <div className="text-center">
                <span className="text-lg font-bold text-green-800">보상 확인 🎁</span>
                <p className="text-sm text-green-600 mt-1">뭘로 보상받을까?</p>
              </div>
            </Link>
          </div>
        </div>

        {/* 통계 카드 - 작게 만들어서 하단으로 이동 */}
        <div className="grid grid-cols-2 gap-3">
          {statsCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="relative bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-white/50 overflow-hidden hover:shadow-md transition-all transform hover:scale-105"
              >
                {/* 배경 그라데이션 */}
                <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${stat.gradient} opacity-15 rounded-full -mr-6 -mt-6`}></div>

                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-8 h-8 bg-gradient-to-br ${stat.gradient} rounded-lg flex items-center justify-center shadow-sm`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-lg">{stat.emoji}</span>
                  </div>

                  <p className="text-xs text-gray-500 mb-1">{stat.title}</p>
                  <p className="text-xl font-bold text-gray-900">
                    {stat.value}
                    <span className="text-sm font-normal text-gray-600 ml-1">{stat.unit}</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{stat.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* 오늘의 한마디 - 더 귀엽게! */}
        <div className="bg-gradient-to-br from-yellow-100 via-pink-100 to-purple-100 rounded-3xl p-6 shadow-lg border-2 border-pink-200 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="text-4xl animate-bounce">🏆</div>
            <div className="flex-1">
              <p className="text-lg font-bold text-purple-900 mb-2 flex items-center gap-2">
                오늘의 한마디 💝
                <Sparkles className="w-5 h-5 text-yellow-500 animate-spin" />
              </p>
              <p className="text-base text-purple-800 font-medium">
                "작은 약속도 소중히, 우리의 사랑은 더욱 단단해져요! 💪✨"
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};