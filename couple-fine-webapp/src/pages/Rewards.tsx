import React, { useState } from 'react';
import { Gift, Plus, Sparkles, Star, Trophy, Save, X, Trash2 } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface RewardFormData {
  title: string;
  target_amount: number | '';
  description?: string;
  category: string;
  icon_emoji: string;
  priority: number;
  is_achieved: boolean;
}

export const Rewards: React.FC = () => {
  const { state, createReward, claimReward, deleteReward, getUserTotalFines } = useApp();
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<RewardFormData>({
    title: '',
    target_amount: '',
    description: '',
    category: 'general',
    icon_emoji: '🎁',
    priority: 1,
    is_achieved: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Calculate total penalties for progress calculation (couple total)
  const totalPenalties = state.couple?.total_balance || 0;

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('보상 이름을 입력해주세요 ✨');
      return;
    }

    const targetAmount = Number(formData.target_amount);
    if (!formData.target_amount || targetAmount < 1 || targetAmount > 1000) {
      toast.error('목표 금액은 1만원에서 1000만원 사이로 설정해주세요 💰');
      return;
    }

    // **무한 로딩 방지**: 모든 경로에서 로딩 해제 보장 + 타임아웃 추가

    setIsSubmitting(true);
    setHasError(false);

    // **타임아웃 추가**: 10초 후 강제 로딩 해제
    const timeoutId = setTimeout(() => {
      setIsSubmitting(false);
      toast.error('요청 시간이 초과되었어요. 잠시 후 다시 시도해주세요 ⏰');
    }, 10000);

    try {

      // Create reward with timeout protection - ensure target_amount is a number
      const rewardData = {
        ...formData,
        target_amount: Number(formData.target_amount)
      };
      
      const createPromise = createReward(rewardData);
      const { error } = await Promise.race([
        createPromise,
        new Promise<{error: string}>((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), 9000)
        )
      ]);

      if (error) {
        toast.error(`보상 생성에 실패했어요: ${error} 😢`);
      } else {
        toast.success('새로운 보상이 추가되었어요! 🎁✨');
        setShowForm(false);
        // Reset form on success
        setFormData({
          title: '',
          target_amount: '',
          description: '',
          category: 'general',
          icon_emoji: '🎁',
          priority: 1,
          is_achieved: false
        });
      }
    } catch (error) {

      setHasError(true);
      if (error instanceof Error && error.message === 'Request timeout') {
        toast.error('요청 시간이 초과되었어요. 잠시 후 다시 시도해주세요 ⏰');
      } else {
        toast.error('오류가 발생했어요. 다시 시도해주세요 😅');
      }
    } finally {
      // **중요**: 타임아웃 클리어 및 모든 상황에서 로딩 상태를 false로 설정
      clearTimeout(timeoutId);

      setIsSubmitting(false);
    }
  };

  // Handle reward claim
  const handleClaimReward = async (rewardId: string, rewardTitle: string) => {
    try {
      const { error } = await claimReward(rewardId);

      if (error) {
        toast.error(`보상 획득 실패: ${error}`);
      } else {
        toast.success(`🎉 "${rewardTitle}" 보상을 획득했어요! 축하해요!`);
      }
    } catch (error) {
      toast.error('보상 획득 중 오류가 발생했어요');
    }
  };

  // Handle reward deletion
  const handleDeleteReward = async (rewardId: string, rewardTitle: string) => {
    if (!window.confirm(`"${rewardTitle}" 보상을 정말 삭제하시겠어요?`)) {
      return;
    }

    try {
      const { error } = await deleteReward(rewardId);

      if (error) {
        toast.error(`보상 삭제 실패: ${error}`);
      } else {
        toast.success('보상이 삭제되었어요');
      }
    } catch (error) {
      toast.error('보상 삭제 중 오류가 발생했어요');
    }
  };

  // Handle quick idea selection
  const handleIdeaSelect = (idea: { title: string; amount: number }) => {
    setFormData({
      title: idea.title,
      target_amount: idea.amount,
      description: '',
      category: 'general',
      icon_emoji: '🎁',
      priority: 1,
      is_achieved: false
    });
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-pink-100">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                우리의 보상
              </h1>
              <Trophy className="w-5 h-5 text-yellow-400 animate-pulse" />
            </div>
            <p className="text-gray-600 text-sm">
              벌금을 모아서 함께 즐길 수 있는 달콤한 보상을 만들어요! 💕🎁
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-gradient-to-r from-purple-400 to-pink-400 text-white px-4 py-2 rounded-xl font-medium text-sm shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span className="hidden sm:inline">{showForm ? '취소' : '보상 추가'}</span>
          </button>
        </div>
      </div>

      {/* Current Balance */}
      <div className="bg-gradient-to-br from-purple-100 via-pink-50 to-yellow-50 rounded-2xl p-6 shadow-sm border border-purple-200">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl flex items-center justify-center shadow-md">
            <span className="text-2xl">💰</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-900">현재 모인 벌금</h3>
              <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
            </div>
            <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {totalPenalties}만원
            </p>
            <p className="text-sm text-gray-600 mt-1">이제 달콤한 보상을 받을 시간이에요! 🎉💕</p>
          </div>
        </div>
      </div>

      {/* Reward Form */}
      {showForm && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-pink-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            새 보상 만들기 ✨
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Reward Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                보상 이름
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="예: 맛있는 저녁 데이트, 영화 관람, 주말 여행"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={isSubmitting}
              />
            </div>

            {/* Target Amount */}
            <div>
              <label htmlFor="target" className="block text-sm font-medium text-gray-700 mb-2">
                목표 금액 (만원)
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="target"
                  min="1"
                  max="1000"
                  value={formData.target_amount}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    target_amount: e.target.value === '' ? '' : Number(e.target.value)
                  }))}
                  placeholder="예: 5만원, 10만원, 50만원"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={isSubmitting}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                  <span className="text-gray-500 text-sm">만원</span>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting || !formData.title.trim() || !formData.target_amount || hasError}
                className="flex-1 bg-gradient-to-r from-purple-400 to-pink-400 text-white py-3 px-4 rounded-xl font-medium shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isSubmitting ? '생성 중...' : '보상 만들기 ✨'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                disabled={isSubmitting}
                className="px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                취소
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Rewards List */}
      {state.rewards && state.rewards.length > 0 ? (
        <div className="space-y-3">
          {state.rewards.map((reward, index) => {
            const progress = Math.min(totalPenalties / reward.target_amount, 1);
            const progressPercent = Math.round(progress * 100);
            const canClaim = totalPenalties >= reward.target_amount && !reward.is_achieved;

            const emojis = ['🎁', '🎉', '🌟', '💝', '🏆'];
            const gradients = [
              'from-purple-400 to-pink-400',
              'from-pink-400 to-red-400',
              'from-yellow-400 to-orange-400',
              'from-green-400 to-teal-400',
              'from-indigo-400 to-purple-400'
            ];

            return (
              <div key={reward.id} className="bg-white rounded-2xl p-5 shadow-sm border border-pink-100 hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-12 h-12 bg-gradient-to-br ${gradients[index % 5]} rounded-xl flex items-center justify-center shadow-sm`}>
                      {reward.is_achieved ? (
                        <span className="text-2xl">✅</span>
                      ) : (
                        <span className="text-2xl">{emojis[index % 5]}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900">{reward.title}</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                          🎯 목표: {reward.target_amount}만원
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-pink-100 text-pink-700 rounded-full text-xs font-medium">
                          📈 달성률: {progressPercent}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex flex-col items-end gap-2">
                      {reward.is_achieved ? (
                        <span className="px-3 py-1.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                          ✨ 달성 완료!
                        </span>
                      ) : canClaim ? (
                        <button
                          onClick={() => handleClaimReward(reward.id, reward.title)}
                          className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-xl font-medium text-sm shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95"
                        >
                          🎉 받기
                        </button>
                      ) : (
                        <span className="text-xs text-gray-600 font-medium">
                          앞으로 {reward.target_amount - totalPenalties}만원
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteReward(reward.id, reward.title)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="보상 삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>현재: {totalPenalties}만원</span>
                    <span>목표: {reward.target_amount}만원</span>
                  </div>
                  <div className="w-full bg-gradient-to-r from-gray-100 to-gray-200 rounded-full h-3 p-0.5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${
                        reward.is_achieved
                          ? 'from-green-400 to-teal-400'
                          : canClaim
                          ? 'from-yellow-400 to-orange-400'
                          : 'from-pink-400 to-purple-400'
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
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-pink-100">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Gift className="w-10 h-10 text-purple-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">아직 보상이 없어요!</h3>
          <p className="text-gray-600 mb-6 text-sm">
            함께 이루고 싶은 목표를 정해보세요 🌈<br />
            벌금이 쌓이면 특별한 데이트를 즐길 수 있어요!
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-purple-400 to-pink-400 text-white px-6 py-3 rounded-xl font-medium shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95 inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            첫 보상 만들기
          </button>
        </div>
      )}

      {/* Reward Ideas */}
      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            💡 보상 아이디어
          </h3>
          <Star className="w-4 h-4 text-yellow-400 animate-pulse" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { title: '맛있는 데이트', amount: 5, icon: '🍽️' },
            { title: '영화 관람', amount: 3, icon: '🎬' },
            { title: '커플 마사지', amount: 15, icon: '💆' },
            { title: '주말 여행', amount: 50, icon: '🏖️' },
            { title: '고급 디너', amount: 10, icon: '🥂' },
            { title: '콘서트 관람', amount: 20, icon: '🎵' }
          ].map((idea, index) => {
            const ideaGradients = [
              'from-pink-50 to-rose-50',
              'from-purple-50 to-pink-50',
              'from-indigo-50 to-purple-50',
              'from-teal-50 to-cyan-50',
              'from-orange-50 to-coral-50',
              'from-yellow-50 to-amber-50'
            ];

            return (
              <button
                key={index}
                onClick={() => handleIdeaSelect(idea)}
                className={`flex items-center gap-2 p-3 bg-gradient-to-br ${ideaGradients[index]} rounded-xl border border-gray-100 hover:shadow-md transition-all hover:scale-105 active:scale-95`}
              >
                <span className="text-2xl">{idea.icon}</span>
                <div className="text-left">
                  <p className="font-medium text-gray-900 text-sm">{idea.title}</p>
                  <p className="text-xs text-gray-600">{idea.amount}만원 목표</p>
                </div>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-orange-700 mt-4 text-center">
          💕 서로를 위한 특별한 시간을 계획해보세요!
        </p>
      </div>
    </div>
  );
};