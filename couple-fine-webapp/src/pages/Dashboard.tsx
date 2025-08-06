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
  Users,
  Target,
  Award,
  Activity
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { state } = useApp();
  const { user } = useAuth();

  // Calculate statistics
  const activeRules = state.rules?.filter(r => r.is_active !== false).length || 0;
  const addViolations = state.violations?.filter(v => v.type === 'add').length || 0;
  const totalPenalties = state.violations
    ?.filter(v => v.type === 'add')
    .reduce((sum, v) => sum + v.amount, 0) || 0;
  
  const claimedRewards = state.rewards?.filter(r => r.is_claimed).length || 0;
  const totalRewards = state.rewards?.length || 0;

  // Recent activity (last 5 violations)
  const recentViolations = state.violations
    ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5) || [];

  const partnerName = 'Partner'; // Will be updated when we have partner info

  const statsCards = [
    {
      title: 'Active Rules',
      value: activeRules,
      icon: Heart,
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
      description: 'relationship rules'
    },
    {
      title: 'Add Violations',
      value: addViolations,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      description: 'penalty violations'
    },
    {
      title: 'Total Penalties',
      value: `${totalPenalties}만원`,
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      description: 'current balance'
    },
    {
      title: 'Rewards Progress',
      value: `${claimedRewards}/${totalRewards}`,
      icon: Gift,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'rewards claimed'
    }
  ];

  const quickActions = [
    {
      title: 'Add Violation',
      description: 'Report a rule violation',
      href: '/violations/new',
      icon: Plus,
      color: 'bg-red-500 hover:bg-red-600'
    },
    {
      title: 'View Rules',
      description: 'Manage relationship rules',
      href: '/rules',
      icon: Heart,
      color: 'bg-primary-500 hover:bg-primary-600'
    },
    {
      title: 'Rewards',
      description: 'Track reward goals',
      href: '/rewards',
      icon: Gift,
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'Calendar',
      description: 'View activity timeline',
      href: '/calendar',
      icon: Calendar,
      color: 'bg-blue-500 hover:bg-blue-600'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.display_name}!
          </h1>
          <p className="text-gray-600 mt-1">
            You and {partnerName} are tracking {activeRules} rules together
          </p>
        </div>
        
        {state.couple && (
          <div className="flex items-center gap-2 px-3 py-2 bg-primary-50 rounded-lg">
            <Users className="w-4 h-4 text-primary-600" />
            <span className="text-sm font-medium text-primary-700">
              Code: {state.couple.code}
            </span>
          </div>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{card.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{card.description}</p>
                </div>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${card.bgColor}`}>
                  <Icon className={`w-6 h-6 ${card.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-primary-600" />
          Quick Actions
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link
                key={index}
                to={action.href}
                className="group p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white transition-colors ${action.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 group-hover:text-primary-600">
                      {action.title}
                    </h3>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary-600" />
            Recent Violations
          </h2>
          
          {recentViolations.length > 0 ? (
            <div className="space-y-3">
              {recentViolations.map((violation) => {
                const rule = state.rules?.find(r => r.id === violation.rule_id);
                const isRecent = new Date(violation.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000);
                
                return (
                  <div key={violation.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{rule?.title || 'Unknown Rule'}</p>
                        {isRecent && (
                          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                            New
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-sm text-gray-600">
                          {violation.amount}만원
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(violation.created_at).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                    </div>
                    <div className={`px-2 py-1 text-xs font-medium rounded-full ${
                      violation.type === 'add' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {violation.type === 'add' ? 'Penalty' : 'Reduction'}
                    </div>
                  </div>
                );
              })}
              
              <div className="pt-3">
                <Link 
                  to="/calendar" 
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                >
                  View all activity
                  <Calendar className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No violations yet</p>
              <p className="text-gray-400 text-xs mt-1">Great job following the rules!</p>
            </div>
          )}
        </div>

        {/* Reward Progress */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-primary-600" />
            Reward Goals
          </h2>
          
          {state.rewards && state.rewards.length > 0 ? (
            <div className="space-y-4">
              {state.rewards.slice(0, 3).map((reward) => {
                // For now, we'll calculate progress based on penalty accumulation
                const currentPenalties = totalPenalties;
                const progress = Math.min(currentPenalties / reward.target_amount, 1);
                const progressPercent = Math.round(progress * 100);
                
                return (
                  <div key={reward.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900">{reward.title}</p>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        reward.is_claimed 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {reward.is_claimed ? 'Claimed' : 'Available'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>{currentPenalties}만원 / {reward.target_amount}만원</span>
                      <span>{progressPercent}%</span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-primary-400 to-coral-400 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              
              <div className="pt-3">
                <Link 
                  to="/rewards" 
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                >
                  View all rewards
                  <Gift className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Gift className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No reward goals set</p>
              <Link 
                to="/rewards" 
                className="text-primary-600 hover:text-primary-700 text-sm font-medium mt-2 inline-block"
              >
                Create your first reward
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Summary Banner */}
      {totalPenalties > 0 && (
        <div className="card p-6 bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-red-900">Current Balance</h3>
              <p className="text-red-700 mt-1">
                You have <strong>{totalPenalties}만원</strong> in accumulated penalties from {addViolations} violations
              </p>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <Link 
                to="/violations/new"
                className="btn-secondary text-red-700 border-red-300 hover:bg-red-50"
              >
                Add Reduction
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};