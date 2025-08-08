import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Save, Sparkles, Heart, Zap, Edit3 } from 'lucide-react';
import toast from 'react-hot-toast';

export const NewViolation: React.FC = () => {
  const navigate = useNavigate();
  const { state, createViolation } = useApp();
  const { user } = useAuth();

  const [selectedRuleId, setSelectedRuleId] = useState('');
  const [violationType, setViolationType] = useState<'add' | 'subtract'>('add');
  const [selectedViolatorId, setSelectedViolatorId] = useState(user?.id || '');
  const [amount, setAmount] = useState(0);
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const selectedRule = state.rules?.find(r => r.id === selectedRuleId);
  
  // Get partner options for violation
  const getPartnerOptions = () => {
    const options: Array<{ id: string; name: string; emoji: string }> = [];
    const couple = state.couple as any;
    
    if (user) {
      options.push({
        id: user.id,
        name: user.display_name || user.email?.split('@')[0] || '나',
        emoji: '😅'
      });
    }
    
    if (couple) {
      // Add partner 1 if not current user
      if (couple.partner_1_id && couple.partner_1_id !== user?.id && couple.partner_1) {
        options.push({
          id: couple.partner_1_id,
          name: couple.partner_1.display_name || couple.partner_1.email?.split('@')[0] || '파트너1',
          emoji: '👩'
        });
      }
      
      // Add partner 2 if not current user
      if (couple.partner_2_id && couple.partner_2_id !== user?.id && couple.partner_2) {
        options.push({
          id: couple.partner_2_id,
          name: couple.partner_2.display_name || couple.partner_2.email?.split('@')[0] || '파트너2',
          emoji: '👨'
        });
      }
    }
    
    return options;
  };
  
  const partnerOptions = getPartnerOptions();
  const selectedViolator = partnerOptions.find(p => p.id === selectedViolatorId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('사용자 정보를 찾을 수 없어요! 🔐');
      return;
    }

    if (!selectedRuleId) {
      toast.error('규칙을 선택해주세요! 📝');
      return;
    }
    
    if (!selectedViolatorId) {
      toast.error('누가 벌금을 받을지 선택해주세요! 👥');
      return;
    }

    if (amount <= 0) {
      toast.error('금액을 입력해주세요! 💰');
      return;
    }

    setIsLoading(true);

    try {
      // Get couple_id from state.couple if user.couple_id is not available
      const coupleId = user.couple_id || (state.couple as any)?.id;
      
      if (!coupleId) {
        toast.error('커플 정보를 찾을 수 없어요. 다시 로그인해주세요.');
        navigate('/couple-setup');
        return;
      }

      const violationData = {
        rule_id: selectedRuleId,
        couple_id: coupleId,
        violator_user_id: selectedViolatorId,
        recorded_by_user_id: user.id,
        amount: violationType === 'add' ? amount : -amount,
        memo: note.trim() || undefined,
        violation_date: new Date().toISOString().split('T')[0]
      };

      const { error } = await createViolation(violationData);

      if (error) {
        toast.error(`기록 저장 실패: ${error}`);
        return;
      }

      const violatorName = selectedViolator?.name || '선택된 사람';
      if (violationType === 'add') {
        toast.success(`😅 ${violatorName}님에게 벌금 ${amount}만원이 추가되었어요!`);
      } else {
        toast.success(`😊 ${violatorName}님의 벌금 ${amount}만원이 차감되었어요!`);
      }

      navigate('/', { replace: true });
    } catch (error) {
      console.error('Violation creation error:', error);
      toast.error('기록 저장에 실패했어요 😢');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-pink-100">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                벌금 기록하기
              </h1>
              <Edit3 className="w-5 h-5 text-purple-400 animate-pulse" />
            </div>
            <p className="text-gray-600 text-sm">
              오늘은 어떤 일이 있었나요? 기록해보세요! ✍️
            </p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-gray-500 hover:text-pink-600 hover:bg-pink-50 rounded-xl transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-pink-100">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Violation Type */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">
              💫 기록 종류 선택
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setViolationType('add')}
                className={`p-4 rounded-2xl border-2 transition-all transform hover:scale-105 active:scale-95 text-left ${
                  violationType === 'add'
                    ? 'border-pink-300 bg-gradient-to-br from-pink-50 to-red-50 shadow-md'
                    : 'border-gray-200 hover:border-pink-200 bg-white'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    violationType === 'add'
                      ? 'bg-gradient-to-br from-pink-400 to-red-400 shadow-md'
                      : 'bg-pink-100'
                  }`}>
                    <span className="text-2xl">😅</span>
                  </div>
                  <div className="text-center">
                    <h3 className="font-bold text-gray-900">벌금 추가</h3>
                    <p className="text-xs text-gray-600 mt-1">규칙을 어겼어요</p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setViolationType('subtract')}
                className={`p-4 rounded-2xl border-2 transition-all transform hover:scale-105 active:scale-95 text-left ${
                  violationType === 'subtract'
                    ? 'border-green-300 bg-gradient-to-br from-green-50 to-teal-50 shadow-md'
                    : 'border-gray-200 hover:border-green-200 bg-white'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    violationType === 'subtract'
                      ? 'bg-gradient-to-br from-green-400 to-teal-400 shadow-md'
                      : 'bg-green-100'
                  }`}>
                    <span className="text-2xl">😊</span>
                  </div>
                  <div className="text-center">
                    <h3 className="font-bold text-gray-900">벌금 차감</h3>
                    <p className="text-xs text-gray-600 mt-1">착한 일 했어요</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Violator Selection */}
          <div>
            <label htmlFor="violator" className="block text-sm font-bold text-gray-700 mb-2">
              👥 누가 벌금을 받나요?
            </label>
            <div className="grid grid-cols-1 gap-2">
              {partnerOptions.map((partner) => (
                <button
                  key={partner.id}
                  type="button"
                  onClick={() => setSelectedViolatorId(partner.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all hover:scale-105 active:scale-95 ${
                    selectedViolatorId === partner.id
                      ? 'border-pink-300 bg-gradient-to-r from-pink-50 to-purple-50 shadow-md'
                      : 'border-gray-200 hover:border-pink-200 bg-white'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    selectedViolatorId === partner.id
                      ? 'bg-gradient-to-br from-pink-400 to-purple-400 shadow-md'
                      : 'bg-pink-100'
                  }`}>
                    <span className="text-xl">{partner.emoji}</span>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-bold text-gray-900">{partner.name}</p>
                    <p className="text-xs text-gray-600">
                      {partner.id === user?.id ? '본인이 받는 벌금' : '상대방이 받는 벌금'}
                    </p>
                  </div>
                  {selectedViolatorId === partner.id && (
                    <div className="w-5 h-5 bg-pink-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Rule Selection */}
          <div>
            <label htmlFor="rule" className="block text-sm font-bold text-gray-700 mb-2">
              📋 어떤 규칙인가요?
            </label>
            <select
              id="rule"
              value={selectedRuleId}
              onChange={(e) => {
                setSelectedRuleId(e.target.value);
                // Auto-fill amount with rule penalty
                const rule = state.rules?.find(r => r.id === e.target.value);
                if (rule) {
                  setAmount(rule.fine_amount);
                }
              }}
              className="input-field bg-gradient-to-r from-pink-50 to-purple-50 border-pink-200 focus:border-pink-400"
              required
            >
              <option value="">규칙을 선택해주세요 💝</option>
              {state.rules?.filter(r => r.is_active !== false).map((rule) => (
                <option key={rule.id} value={rule.id}>
                  {rule.title} ({rule.fine_amount}만원)
                </option>
              ))}
            </select>
          </div>

          {/* Selected Rule & Violator Info */}
          {(selectedRule || selectedViolator) && (
            <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200">
              <div className="space-y-3">
                {selectedViolator && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xl">{selectedViolator.emoji}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">
                        {selectedViolator.name}님{violationType === 'add' ? '이 받을' : '이 차감할'} 벌금
                      </h4>
                      <p className="text-xs text-gray-600">
                        {selectedViolator.id === user?.id ? '본인 기록' : '상대방 기록'}
                      </p>
                    </div>
                  </div>
                )}
                
                {selectedRule && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center flex-shrink-0">
                      <Heart className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{selectedRule.title}</h4>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                          💰 기본 벌금: {selectedRule.fine_amount}만원
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                          {selectedRule.category === 'word' ? '💬 말' : '🏃 행동'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Amount */}
          <div>
            <label htmlFor="amount" className="block text-sm font-bold text-gray-700 mb-2">
              💵 금액 (만원)
            </label>
            <div className="relative">
              <input
                id="amount"
                type="number"
                min="1"
                value={amount || ''}
                onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                className="input-field bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 focus:border-yellow-400 pl-10"
                placeholder="얼마나 추가할까요?"
                required
              />
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xl">💰</span>
            </div>
          </div>

          {/* Note */}
          <div>
            <label htmlFor="note" className="block text-sm font-bold text-gray-700 mb-2">
              📝 메모 (선택사항)
            </label>
            <textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="input-field bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 focus:border-blue-400"
              placeholder="어떤 일이 있었는지 자세히 적어보세요... 💭"
            />
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all transform hover:scale-105 active:scale-95"
            >
              취소하기
            </button>
            <button
              type="submit"
              disabled={isLoading || !selectedRuleId || !selectedViolatorId || amount <= 0}
              className={`flex-1 px-4 py-3 rounded-xl font-medium shadow-md transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2 ${
                violationType === 'subtract'
                  ? 'bg-gradient-to-r from-green-400 to-teal-400 text-white hover:from-green-500 hover:to-teal-500'
                  : 'bg-gradient-to-r from-pink-400 to-purple-400 text-white hover:from-pink-500 hover:to-purple-500'
              }`}
            >
              {isLoading ? (
                <>
                  <Zap className="w-4 h-4 animate-spin" />
                  기록 중...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {selectedViolator ? 
                    (violationType === 'add' ? 
                      `${selectedViolator.name}님에게 ${amount}만원 추가` : 
                      `${selectedViolator.name}님 ${amount}만원 차감하기`
                    ) : 
                    (violationType === 'add' ? `벌금 ${amount}만원 추가` : `${amount}만원 차감하기`)
                  }
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Rules Quick Reference */}
      {state.rules && state.rules.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-pink-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">📌 빠른 참조</h3>
            <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
          </div>
          <div className="grid grid-cols-1 gap-2">
            {state.rules.filter(r => r.is_active !== false).map((rule, index) => {
              const emojis = ['💕', '💝', '💖', '💗', '💓'];
              const gradients = [
                'from-pink-50 to-rose-50',
                'from-purple-50 to-pink-50',
                'from-indigo-50 to-purple-50',
                'from-coral-50 to-pink-50',
                'from-orange-50 to-coral-50'
              ];

              return (
                <button
                  key={rule.id}
                  type="button"
                  onClick={() => {
                    setSelectedRuleId(rule.id);
                    setAmount(rule.fine_amount);
                  }}
                  className={`flex items-center justify-between p-3 rounded-xl transition-all hover:shadow-md hover:scale-105 active:scale-95 ${
                    selectedRuleId === rule.id
                      ? 'bg-gradient-to-r from-pink-100 to-purple-100 border border-pink-300'
                      : `bg-gradient-to-r ${gradients[index % 5]} border border-gray-100`
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{emojis[index % 5]}</span>
                    <span className="text-sm font-medium text-gray-900">{rule.title}</span>
                  </div>
                  <span className="text-sm font-bold text-pink-600">{rule.fine_amount}만원</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 도움말 */}
      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <Zap className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-orange-900 mb-1">💡 기록 팁</p>
            <p className="text-xs text-orange-700">
              규칙을 어긴 것도 사랑의 일부예요! 서로를 이해하고 성장하는 과정이랍니다.<br />
              벌금통이 가득 차면 둘이서 특별한 데이트를 즐겨보세요! 🎉
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};