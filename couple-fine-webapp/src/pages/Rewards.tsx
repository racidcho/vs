import React from 'react';
import { Gift, Plus, Award, Target, TrendingUp } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

export const Rewards: React.FC = () => {
  const { state } = useApp();
  
  // Calculate total penalties for progress calculation
  const totalPenalties = state.violations
    ?.filter(v => v.type === 'add')
    .reduce((sum, v) => sum + v.amount, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reward Goals</h1>
          <p className="text-gray-600 mt-1">
            Set goals and earn rewards when you reach penalty milestones
          </p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Reward
        </button>
      </div>

      {/* Current Balance */}
      <div className="card p-6 bg-gradient-to-r from-primary-50 to-coral-50">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary-200 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-primary-700" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Current Balance</h3>
            <p className="text-2xl font-bold text-primary-700">{totalPenalties}만원</p>
            <p className="text-sm text-gray-600 mt-1">Available for rewards</p>
          </div>
        </div>
      </div>

      {/* Rewards List */}
      {state.rewards && state.rewards.length > 0 ? (
        <div className="space-y-4">
          {state.rewards.map((reward) => {
            const progress = Math.min(totalPenalties / reward.target_amount, 1);
            const progressPercent = Math.round(progress * 100);
            const canClaim = totalPenalties >= reward.target_amount && !reward.is_claimed;

            return (
              <div key={reward.id} className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      reward.is_claimed 
                        ? 'bg-green-100' 
                        : canClaim 
                        ? 'bg-yellow-100' 
                        : 'bg-gray-100'
                    }`}>
                      {reward.is_claimed ? (
                        <Award className="w-6 h-6 text-green-600" />
                      ) : (
                        <Gift className={`w-6 h-6 ${
                          canClaim ? 'text-yellow-600' : 'text-gray-500'
                        }`} />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{reward.title}</h3>
                      <p className="text-sm text-gray-600">
                        Target: {reward.target_amount}만원
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Progress</p>
                      <p className="font-semibold text-gray-900">{progressPercent}%</p>
                    </div>
                    
                    {reward.is_claimed ? (
                      <span className="px-3 py-2 text-sm font-medium bg-green-100 text-green-800 rounded-lg">
                        Claimed
                      </span>
                    ) : canClaim ? (
                      <button className="btn-primary text-sm">
                        Claim Reward
                      </button>
                    ) : (
                      <span className="px-3 py-2 text-sm font-medium bg-gray-100 text-gray-600 rounded-lg">
                        {reward.target_amount - totalPenalties}만원 to go
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{totalPenalties}만원</span>
                    <span>{reward.target_amount}만원</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        reward.is_claimed
                          ? 'bg-gradient-to-r from-green-400 to-green-500'
                          : canClaim
                          ? 'bg-gradient-to-r from-yellow-400 to-yellow-500'
                          : 'bg-gradient-to-r from-primary-400 to-coral-400'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No rewards yet</h3>
          <p className="text-gray-600 mb-6">
            Create reward goals to motivate yourselves and celebrate milestones together
          </p>
          <button className="btn-primary flex items-center gap-2 mx-auto">
            <Plus className="w-4 h-4" />
            Create First Reward
          </button>
        </div>
      )}

      {/* Reward Ideas */}
      <div className="card p-6">
        <h3 className="font-semibold text-gray-900 mb-4">💡 Reward Ideas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: 'Date Night', amount: 5, icon: '🍽️' },
            { title: 'Movie & Snacks', amount: 3, icon: '🎬' },
            { title: 'Couple Massage', amount: 15, icon: '💆' },
            { title: 'Weekend Getaway', amount: 50, icon: '🏖️' },
            { title: 'Fancy Dinner', amount: 10, icon: '🥂' },
            { title: 'Concert Tickets', amount: 20, icon: '🎵' }
          ].map((idea, index) => (
            <div 
              key={index}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <span className="text-2xl">{idea.icon}</span>
              <div>
                <p className="font-medium text-gray-900">{idea.title}</p>
                <p className="text-sm text-gray-600">{idea.amount}만원 goal</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};