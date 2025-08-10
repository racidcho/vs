import React, { useState } from 'react';
import { Heart, Plus, Edit, Trash2, Sparkles, Star, Save, X } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface RuleFormData {
  category: 'word' | 'behavior';
  title: string;
  fine_amount: number | '';
  description?: string;
  icon_emoji: string;
  is_active: boolean;
}

export const Rules: React.FC = () => {
  const { state, createRule, updateRule, deleteRule } = useApp();
  const { user } = useAuth();
  
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<string | null>(null);
  const [formData, setFormData] = useState<RuleFormData>({
    category: 'word',
    title: '',
    fine_amount: '',
    icon_emoji: '💝',
    is_active: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault();

    if (!formData.title.trim()) {

      toast.error('규칙 제목을 입력해주세요');
      return;
    }

    const amount = typeof formData.fine_amount === 'number' ? formData.fine_amount : parseInt(formData.fine_amount);
    if (isNaN(amount) || amount < 1 || amount > 100) {

      toast.error('벌금은 1만원에서 100만원 사이로 설정해주세요');
      return;
    }

    // **무한 로딩 방지**: 모든 경로에서 로딩 해제 보장 + 타임아웃 추가

    setIsSubmitting(true);
    setHasError(false);

    // **타임아웃 추가**: 10초 후 강제 로딩 해제
    const timeoutId = setTimeout(() => {

      setIsSubmitting(false);
      toast.error('요청 시간이 초과되었어요. 다시 시도해주세요.');
    }, 10000);

    try {
      if (editingRule) {

        // Update existing rule with timeout protection
        const updatePromise = updateRule(editingRule, { ...formData, fine_amount: amount * 10000 });  // 만원을 원 단위로 변환
        const { error } = await Promise.race([
          updatePromise,
          new Promise<{error: string}>((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), 9000)
          )
        ]);

        if (error) {

          toast.error(`규칙 수정 실패: ${error}`);
        } else {

          toast.success('규칙이 수정되었어요! 💝');
          setEditingRule(null);
          // Reset form on success
          setFormData({
            category: 'word',
            title: '',
            fine_amount: '',
            icon_emoji: '💝',
            is_active: true
          });
        }
      } else {

        // Create new rule with timeout protection
        const createPromise = createRule({ ...formData, fine_amount: amount * 10000 });  // 만원을 원 단위로 변환
        const { error } = await Promise.race([
          createPromise,
          new Promise<{error: string}>((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), 9000)
          )
        ]);

        if (error) {

          toast.error(`규칙 생성 실패: ${error}`);
        } else {

          toast.success('새 규칙이 추가되었어요! 💝');
          setShowForm(false);
          // Reset form on success
          setFormData({
            category: 'word',
            title: '',
            fine_amount: '',
            icon_emoji: '💝',
            is_active: true
          });
        }
      }
    } catch (error) {

      setHasError(true);
      if (error instanceof Error && error.message === 'Request timeout') {
        toast.error('요청 시간이 초과되었어요. 다시 시도해주세요.');
      } else {
        toast.error('오류가 발생했어요');
      }
    } finally {
      // **중요**: 타임아웃 클리어 및 모든 상황에서 로딩 상태를 false로 설정
      clearTimeout(timeoutId);

      setIsSubmitting(false);
    }
  };

  // Handle rule deletion
  const handleDelete = async (ruleId: string, ruleTitle: string) => {
    if (!window.confirm(`"${ruleTitle}" 규칙을 정말 삭제하시겠어요?`)) {
      return;
    }

    try {
      const { error } = await deleteRule(ruleId);
      if (error) {
        toast.error(`규칙 삭제 실패: ${error}`);
      } else {
        toast.success('규칙이 삭제되었어요');
      }
    } catch (error) {
      toast.error('삭제 중 오류가 발생했어요');
    }
  };

  // Handle edit mode
  const handleEdit = (rule: any) => {
    setEditingRule(rule.id);
    setFormData({
      category: rule.category as 'word' | 'behavior',
      title: rule.title,
      fine_amount: Math.floor(rule.fine_amount / 10000),  // 원 단위를 만원 단위로 변환
      icon_emoji: rule.icon_emoji || '💝',
      is_active: rule.is_active
    });
    setShowForm(true);
  };

  // Cancel edit/create
  const handleCancel = () => {
    setShowForm(false);
    setEditingRule(null);
    setFormData({
      category: 'word',
      title: '',
      fine_amount: '',
      icon_emoji: '💝',
      is_active: true
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-pink-100">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                우리들의 약속
              </h1>
              <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
            </div>
            <p className="text-gray-600 text-sm">
              사랑하는 사람과 함께 지킬 소중한 규칙들이에요 💝
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-gradient-to-r from-pink-400 to-purple-400 text-white px-4 py-2 rounded-xl font-medium text-sm shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span className="hidden sm:inline">{showForm ? '취소' : '규칙 추가'}</span>
          </button>
        </div>
      </div>

      {/* Rule Form */}
      {showForm && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-pink-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            {editingRule ? '규칙 수정하기' : '새 규칙 만들기'} ✨
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Rule Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">규칙 종류</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, category: 'word' }))}
                  className={`p-3 rounded-xl border-2 transition-all text-left ${
                    formData.category === 'word'
                      ? 'border-blue-300 bg-blue-50 text-blue-900'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">💬 말 관련</div>
                  <div className="text-xs text-gray-500">욕설, 거짓말 등</div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, category: 'behavior' }))}
                  className={`p-3 rounded-xl border-2 transition-all text-left ${
                    formData.category === 'behavior'
                      ? 'border-green-300 bg-green-50 text-green-900'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">🏃 행동 관련</div>
                  <div className="text-xs text-gray-500">늦기, 약속 어기기 등</div>
                </button>
              </div>
            </div>

            {/* Rule Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                규칙 이름
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="예: 욕설 금지, 데이트 약속 지키기"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                disabled={isSubmitting}
              />
            </div>

            {/* Penalty Amount */}
            <div>
              <label htmlFor="penalty" className="block text-sm font-medium text-gray-700 mb-2">
                벌금 (만원)
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="penalty"
                  min="1"
                  max="100"
                  value={formData.fine_amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, fine_amount: e.target.value === '' ? '' : parseInt(e.target.value) || '' }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
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
                disabled={isSubmitting || !formData.title.trim() || hasError}
                className="flex-1 bg-gradient-to-r from-pink-400 to-purple-400 text-white py-3 px-4 rounded-xl font-medium shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isSubmitting ? '저장 중...' : editingRule ? '수정하기' : '만들기'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                취소
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Rules List */}
      {state.rules && state.rules.length > 0 ? (
        <div className="space-y-3">
          {state.rules.map((rule, index) => {
            const emojis = ['💕', '💝', '💖', '💗', '💓'];
            const gradients = [
              'from-pink-400 to-rose-400',
              'from-purple-400 to-pink-400',
              'from-indigo-400 to-purple-400',
              'from-coral-400 to-pink-400',
              'from-orange-400 to-coral-400'
            ];

            return (
              <div key={rule.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`w-12 h-12 bg-gradient-to-br ${gradients[index % 5]} rounded-xl flex items-center justify-center shadow-sm flex-shrink-0`}>
                      <span className="text-xl">{emojis[index % 5]}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-base mb-2">{rule.title}</h3>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full text-xs font-medium">
                          <span>💰</span>
                          <span>벌금 {Math.floor(rule.fine_amount / 10000)}만원</span>
                        </span>
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                          rule.category === 'word'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-green-50 text-green-700'
                        }`}>
                          {rule.category === 'word' ? '💬 말' : '🏃 행동'}
                        </span>
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                          rule.is_active !== false
                            ? 'bg-green-50 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {rule.is_active !== false ? '✅ 활성' : '⏸️ 비활성'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={() => handleEdit(rule)}
                      className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(rule.id, rule.title)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-pink-100">
          <div className="w-20 h-20 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-10 h-10 text-pink-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">아직 규칙이 없어요!</h3>
          <p className="text-gray-600 mb-6 text-sm">
            서로를 위한 첫 번째 약속을 만들어보세요 🌸<br />
            작은 규칙부터 시작하면 좋아요!
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-pink-400 to-purple-400 text-white px-6 py-3 rounded-xl font-medium shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95 inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            첫 규칙 만들기
          </button>
        </div>
      )}

      {/* 도움말 카드 */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <Star className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-purple-900 mb-1">💡 규칙 만들기 팁</p>
            <p className="text-xs text-purple-700">
              너무 엄격한 규칙보다는 서로 지킬 수 있는 재미있는 규칙을 만들어보세요.<br />
              예시: "안아달라고 했을 때 거절하기", "데이트 약속 늦기", "사랑한다 말 안하기"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};