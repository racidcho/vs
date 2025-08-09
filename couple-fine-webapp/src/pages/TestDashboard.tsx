import React from 'react';
import { Heart, Plus, AlertCircle, Trophy, TrendingUp, Users } from 'lucide-react';
import { useTestApp } from '../contexts/TestAppContext';
import { useTestAuth } from '../contexts/TestAuthContext';
import { useNavigate } from 'react-router-dom';

export const TestDashboard: React.FC = () => {
  const { state } = useTestApp();
  const { user } = useTestAuth();
  const navigate = useNavigate();

  const { couple, rules, violations, rewards } = state;

  // Calculate statistics
  const activeRules = rules.filter(rule => rule.is_active);
  const totalViolations = violations.length;
  const totalBalance = violations.reduce((sum, violation) => sum + violation.amount, 0);
  const achievedRewards = rewards.filter(reward => reward.is_achieved).length;

  // Recent activity from actual data
  const recentActivity = [
    ...violations.slice(-5).reverse().map(violation => ({
      id: violation.id,
      type: violation.amount > 0 ? '벌금 추가' : '벌금 차감',
      description: `${Math.abs(violation.amount).toLocaleString()}원 ${violation.amount > 0 ? '추가' : '차감'}${violation.memo ? ` - ${violation.memo}` : ''}`,
      time: new Date(violation.created_at).toLocaleString('ko-KR', { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    })),
    ...rules.slice(-3).reverse().map(rule => ({
      id: `rule-${rule.id}`,
      type: '규칙',
      description: `새 규칙 추가: ${rule.title}`,
      time: new Date(rule.created_at).toLocaleString('ko-KR', { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    }))
  ].slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              안녕하세요, {user?.display_name}님! 👋
            </h1>
            <p className="text-gray-600">
              {couple?.couple_name || '테스트커플'}의 벌금통 현황을 확인해보세요
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-primary-600 mb-1">
              ₩{totalBalance.toLocaleString()}
            </div>
            <p className="text-sm text-gray-500">총 벌금</p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">{activeRules.length}</h3>
              <p className="text-sm text-gray-500">활성 규칙</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">{totalViolations}</h3>
              <p className="text-sm text-gray-500">총 위반</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Trophy className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">{achievedRewards}</h3>
              <p className="text-sm text-gray-500">달성한 보상</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">{rewards.length}</h3>
              <p className="text-sm text-gray-500">총 보상</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">빠른 액션</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/violations/new')}
            className="flex items-center justify-center p-4 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
          >
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-red-700 font-medium">벌금 기록하기</span>
          </button>
          
          <button
            onClick={() => navigate('/rules')}
            className="flex items-center justify-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            <Plus className="h-5 w-5 text-blue-600 mr-2" />
            <span className="text-blue-700 font-medium">새 규칙 추가</span>
          </button>
          
          <button
            onClick={() => navigate('/rewards')}
            className="flex items-center justify-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
          >
            <Trophy className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-green-700 font-medium">보상 확인</span>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">최근 활동</h2>
          <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            전체 보기
          </button>
        </div>
        <div className="space-y-4">
          {recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
              <div className="p-2 bg-white rounded-lg mr-3">
                <Heart className="h-4 w-4 text-gray-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                <p className="text-xs text-gray-500">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Test Info */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <div className="flex items-center">
          <div className="p-2 bg-yellow-100 rounded-lg mr-3">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-yellow-800">🧪 테스트 모드</h3>
            <p className="text-xs text-yellow-700 mt-1">
              현재 테스트 데이터로 실행 중입니다. 
              실제 데이터베이스 연결 및 실시간 동기화 테스트를 진행합니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};