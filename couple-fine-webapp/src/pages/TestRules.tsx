import React, { useState } from 'react';
import { Plus, FileText, DollarSign, User, Calendar, Trash2, Edit } from 'lucide-react';
import { useTestApp } from '../contexts/TestAppContext';
import { useTestAuth } from '../contexts/TestAuthContext';

export const TestRules: React.FC = () => {
  const { state, createRule, deleteRule } = useTestApp();
  const { user } = useTestAuth();
  const [showForm, setShowForm] = useState(false);
  const [newRule, setNewRule] = useState({
    title: '',
    description: '',
    fine_amount: 0,
    created_by_user_id: user?.id || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRule.title.trim()) return;

    console.log('🧪 TEST: 규칙 생성 시도:', newRule);
    
    const result = await createRule({
      ...newRule,
      created_by_user_id: user?.id || '',
      is_active: true
    });

    if (!result.error) {
      console.log('✅ TEST: 규칙 생성 성공');
      setNewRule({ title: '', description: '', fine_amount: 0, created_by_user_id: user?.id || '' });
      setShowForm(false);
    } else {
      console.error('❌ TEST: 규칙 생성 실패:', result.error);
    }
  };

  const handleDelete = async (ruleId: string) => {
    console.log('🗑️ TEST: 규칙 삭제 시도:', ruleId);
    const result = await deleteRule(ruleId);
    if (!result.error) {
      console.log('✅ TEST: 규칙 삭제 성공');
    } else {
      console.error('❌ TEST: 규칙 삭제 실패:', result.error);
    }
  };

  const { rules } = state;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">📋 우리의 약속</h1>
            <p className="text-gray-600">
              서로를 위한 소중한 약속들을 만들고 관리해보세요
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            새 규칙 추가
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">{rules.length}</h3>
              <p className="text-sm text-gray-500">총 규칙 수</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">
                ₩{rules.reduce((sum, rule) => sum + rule.fine_amount, 0).toLocaleString()}
              </h3>
              <p className="text-sm text-gray-500">총 벌금액</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {rules.filter(r => r.is_active).length}
              </h3>
              <p className="text-sm text-gray-500">활성 규칙</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Rule Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">새 규칙 추가</h2>
            <button
              onClick={() => setShowForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                규칙 제목 *
              </label>
              <input
                type="text"
                value={newRule.title}
                onChange={(e) => setNewRule(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="예: 지각 금지"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                설명
              </label>
              <textarea
                value={newRule.description}
                onChange={(e) => setNewRule(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="규칙에 대한 상세 설명..."
                rows={3}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                벌금액 (원)
              </label>
              <input
                type="number"
                value={newRule.fine_amount}
                onChange={(e) => setNewRule(prev => ({ ...prev, fine_amount: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="5000"
                min="0"
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                규칙 추가
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Rules List */}
      <div className="space-y-4">
        {rules.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">아직 규칙이 없어요</h3>
            <p className="text-gray-500 mb-6">
              첫 번째 규칙을 만들어서 서로의 약속을 시작해보세요!
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
            >
              첫 규칙 만들기
            </button>
          </div>
        ) : (
          rules.map((rule) => (
            <div key={rule.id} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{rule.title}</h3>
                    {rule.is_active && (
                      <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                        활성
                      </span>
                    )}
                  </div>
                  
                  {rule.description && (
                    <p className="text-gray-600 mb-3">{rule.description}</p>
                  )}
                  
                  <div className="flex items-center text-sm text-gray-500 space-x-4">
                    <span className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-1" />
                      벌금: ₩{rule.fine_amount.toLocaleString()}
                    </span>
                    <span className="flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      생성자: {rule.created_by_user_id === user?.id ? '나' : '파트너'}
                    </span>
                    <span className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(rule.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => console.log('Edit rule:', rule.id)}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(rule.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Test Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-center">
          <div className="p-2 bg-blue-100 rounded-lg mr-3">
            <FileText className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-blue-800">🧪 CRUD 테스트 진행 중</h3>
            <p className="text-xs text-blue-700 mt-1">
              규칙 생성, 수정, 삭제 기능을 테스트하고 있습니다. 
              실시간 동기화 기능도 함께 확인됩니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};