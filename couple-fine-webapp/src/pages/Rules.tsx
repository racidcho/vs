import React from 'react';
import { Heart, Plus, Edit, Trash2, Sparkles, Star } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

export const Rules: React.FC = () => {
  const { state } = useApp();

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
          <button className="bg-gradient-to-r from-pink-400 to-purple-400 text-white px-4 py-2 rounded-xl font-medium text-sm shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">규칙 추가</span>
          </button>
        </div>
      </div>

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
                          <span>벌금 {rule.penalty_amount}만원</span>
                        </span>
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                          rule.type === 'word' 
                            ? 'bg-blue-50 text-blue-700' 
                            : 'bg-green-50 text-green-700'
                        }`}>
                          {rule.type === 'word' ? '💬 말' : '🏃 행동'}
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
                    <button className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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
          <button className="bg-gradient-to-r from-pink-400 to-purple-400 text-white px-6 py-3 rounded-xl font-medium shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95 inline-flex items-center gap-2">
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