import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { getDashboardStats } from '../lib/supabaseApi';
import { toast } from 'react-hot-toast';
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
  Trash2
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { state, updateViolation, deleteViolation } = useApp();
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    totalBalance: 0,
    activeRules: 0,
    thisMonthViolations: 0,
    availableRewards: 0,
    recentActivity: [] as any[]
  });
  const [isLoading, setIsLoading] = useState(true);
  const [editingViolation, setEditingViolation] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<number>(0);
  const [editMemo, setEditMemo] = useState<string>('');

  // Load real dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      // **무한 로딩 방지**: 로딩 시작 상태 명시
      console.log('📊 DASHBOARD: 데이터 로딩 시작');
      setIsLoading(true);
      
      if (!user?.couple_id) {
        console.log('❌ DASHBOARD: 커플 ID 없음, 로딩 완료');
        setIsLoading(false);
        return;
      }

      try {
        console.log('🔄 DASHBOARD: getDashboardStats 호출');
        const stats = await getDashboardStats(user.couple_id);
        console.log('✅ DASHBOARD: 통계 데이터 로드 성공:', stats);
        setDashboardData(stats);
      } catch (error) {
        console.error('💥 DASHBOARD: 데이터 로딩 실패:', error);
        // Keep default values on error
      } finally {
        // **중요**: 성공/실패 관계없이 로딩 상태 해제
        console.log('✅ DASHBOARD: 로딩 완료');
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [user?.couple_id]);

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-gray-600">데이터 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 환영 메시지 - 모바일 최적화 */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-pink-100">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold text-gray-900">
            {getGreeting()}, {user?.display_name || '사랑'}님! 
          </h1>
          <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
        </div>
        <p className="text-sm text-gray-600">
          {state.couple ? (
            <>우리 커플 코드: <span className="font-medium text-pink-600">💑 {state.couple.couple_code}</span></>
          ) : (
            '커플 연결을 기다리고 있어요'
          )}
        </p>
      </div>

      {/* 통계 카드 - 2x2 그리드 모바일 최적화 */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div 
              key={index}
              className="relative bg-white rounded-2xl p-4 shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* 배경 그라데이션 */}
              <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.gradient} opacity-10 rounded-full -mr-8 -mt-8`}></div>
              
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-10 h-10 bg-gradient-to-br ${stat.gradient} rounded-xl flex items-center justify-center shadow-sm`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xl">{stat.emoji}</span>
                </div>
                
                <p className="text-xs text-gray-500 mb-1">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stat.value}
                  <span className="text-sm font-normal text-gray-600 ml-1">{stat.unit}</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">{stat.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 빠른 액션 버튼들 - 모바일 최적화 */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-pink-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-900">빠른 기록</h2>
          <Zap className="w-4 h-4 text-yellow-500" />
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          <Link
            to="/violations/new"
            className="flex flex-col items-center gap-2 p-3 bg-gradient-to-br from-red-50 to-pink-50 rounded-xl border border-red-100 hover:shadow-md transition-all hover:scale-105 active:scale-95"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-red-400 to-pink-400 rounded-full flex items-center justify-center">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-medium text-gray-700">벌금 추가</span>
          </Link>

          <Link
            to="/rules"
            className="flex flex-col items-center gap-2 p-3 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-100 hover:shadow-md transition-all hover:scale-105 active:scale-95"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-indigo-400 rounded-full flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-medium text-gray-700">규칙 보기</span>
          </Link>

          <Link
            to="/rewards"
            className="flex flex-col items-center gap-2 p-3 bg-gradient-to-br from-green-50 to-teal-50 rounded-xl border border-green-100 hover:shadow-md transition-all hover:scale-105 active:scale-95"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-teal-400 rounded-full flex items-center justify-center">
              <Gift className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-medium text-gray-700">보상 확인</span>
          </Link>
        </div>
      </div>

      {/* 최근 활동 - 모바일 최적화 */}
      {recentActivity.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-pink-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900">최근 기록</h2>
            <Clock className="w-4 h-4 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {recentActivity.map((violation: any) => {
              const rule = state.rules?.find(r => r.id === violation.rule_id);
              const isAdd = violation.amount > 0;
              
              return (
                <div 
                  key={violation.id}
                  className="border border-gray-100 rounded-xl p-4 bg-gradient-to-r from-white to-gray-50 hover:shadow-md transition-all"
                >
                  {editingViolation === violation.id ? (
                    /* Edit Mode */
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isAdd ? 'bg-red-100' : 'bg-green-100'
                        }`}>
                          <Edit className="w-4 h-4 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{rule?.title || '알 수 없는 규칙'}</p>
                          <p className="text-xs text-gray-500">편집 중...</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">금액 (만원)</label>
                          <input
                            type="number"
                            min="1"
                            value={editAmount || ''}
                            onChange={(e) => setEditAmount(parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-sm"
                            placeholder="금액"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">메모</label>
                          <input
                            type="text"
                            value={editMemo}
                            onChange={(e) => setEditMemo(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-sm"
                            placeholder="메모 (선택사항)"
                          />
                        </div>
                      </div>
                      
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={handleCancelEdit}
                          className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          취소
                        </button>
                        <button
                          onClick={handleSaveEdit}
                          disabled={editAmount <= 0}
                          className="px-3 py-2 text-sm bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          저장
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* View Mode */
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isAdd ? 'bg-red-100' : 'bg-green-100'
                        }`}>
                          {isAdd ? '😅' : '😊'}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {rule?.title || '알 수 없는 규칙'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(violation.created_at).toLocaleDateString('ko-KR', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                            {violation.memo && ` • ${violation.memo}`}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${
                          isAdd ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {isAdd ? '+' : ''}{violation.amount}만원
                        </span>
                        
                        <div className="flex gap-1 ml-2">
                          <button
                            onClick={() => handleEdit(violation)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="편집"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDelete(violation.id, (rule?.title || 'Unknown') + ' (' + violation.amount + '만원)')}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="삭제"
                          >
                            <Trash2 className="w-3 h-3" />
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
            className="mt-4 flex items-center justify-center gap-2 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <Calendar className="w-4 h-4" />
            전체 기록 보기
          </Link>
        </div>
      )}

      {/* 오늘의 한마디 - 모바일용 추가 */}
      <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <Trophy className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-purple-900 mb-1">오늘의 한마디</p>
            <p className="text-xs text-purple-700">
              "작은 약속도 소중히, 우리의 사랑은 더욱 단단해져요! 💪"
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};