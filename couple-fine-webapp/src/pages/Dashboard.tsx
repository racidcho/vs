import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
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
  Zap
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { state } = useApp();
  const { user } = useAuth();

  // Calculate statistics
  const activeRules = state.rules?.filter(r => r.is_active !== false).length || 0;
  const totalViolations = state.violations?.filter(v => v.type === 'add').length || 0;
  const totalPenalties = state.violations
    ?.filter(v => v.type === 'add')
    .reduce((sum, v) => sum + v.amount, 0) || 0;
  
  const claimedRewards = state.rewards?.filter(r => r.is_claimed).length || 0;
  const totalRewards = state.rewards?.length || 0;
  const rewardProgress = totalRewards > 0 ? Math.round((claimedRewards / totalRewards) * 100) : 0;

  // Recent activity (last 3 violations for mobile)
  const recentViolations = state.violations
    ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3) || [];

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
      title: '벌금 횟수',
      value: totalViolations,
      unit: '번',
      icon: AlertTriangle,
      emoji: '😅',
      gradient: 'from-orange-400 to-red-400',
      description: '이번 달 기록'
    },
    {
      title: '모인 벌금',
      value: totalPenalties,
      unit: '만원',
      icon: TrendingUp,
      emoji: '💰',
      gradient: 'from-purple-400 to-indigo-400',
      description: '현재까지 모은 금액'
    },
    {
      title: '달성 보상',
      value: rewardProgress,
      unit: '%',
      icon: Gift,
      emoji: '🎁',
      gradient: 'from-green-400 to-teal-400',
      description: '보상 달성률'
    }
  ];

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
            <>우리 커플 코드: <span className="font-medium text-pink-600">💑 {state.couple.code}</span></>
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
      {recentViolations.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-pink-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900">최근 기록</h2>
            <Clock className="w-4 h-4 text-gray-400" />
          </div>
          
          <div className="space-y-3">
            {recentViolations.map((violation) => {
              const rule = state.rules?.find(r => r.id === violation.rule_id);
              const isAdd = violation.type === 'add';
              
              return (
                <div 
                  key={violation.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isAdd ? 'bg-red-100' : 'bg-green-100'
                    }`}>
                      {isAdd ? '😅' : '😊'}
                    </div>
                    <div>
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
                      </p>
                    </div>
                  </div>
                  <span className={`text-sm font-bold ${
                    isAdd ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {isAdd ? '+' : '-'}{violation.amount}만원
                  </span>
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