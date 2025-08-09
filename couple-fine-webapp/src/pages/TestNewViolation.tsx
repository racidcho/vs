import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Minus, DollarSign, FileText, Calendar, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTestApp } from '../contexts/TestAppContext';
import { useTestAuth } from '../contexts/TestAuthContext';
import toast from 'react-hot-toast';

export const TestNewViolation: React.FC = () => {
  const navigate = useNavigate();
  const { state, createViolation } = useTestApp();
  const { user } = useTestAuth();
  const [formData, setFormData] = useState({
    type: 'fine' as 'fine' | 'deduction',
    rule_id: '',
    fine_recipient_id: user?.id || '',
    amount: 0,
    memo: ''
  });

  const { rules } = state;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.rule_id) {
      toast.error('규칙을 선택해주세요');
      return;
    }
    
    if (formData.amount <= 0) {
      toast.error('금액을 입력해주세요');
      return;
    }

    console.log('🧪 TEST: 벌금 기록 시도:', formData);
    console.log('🧪 TEST: formData.amount 값:', formData.amount, typeof formData.amount);

    const violationData = {
      ...formData,
      couple_id: 'test-couple-123',
      created_by_user_id: user?.id || ''
    };

    console.log('🧪 TEST: 최종 violationData:', violationData);
    console.log('🧪 TEST: violationData.amount 값:', violationData.amount, typeof violationData.amount);

    const result = await createViolation(violationData);
    
    if (!result.error) {
      console.log('✅ TEST: 벌금 기록 성공');
      toast.success(
        formData.type === 'fine'
          ? `벌금 ${formData.amount.toLocaleString()}원이 추가되었습니다!`
          : `벌금 ${formData.amount.toLocaleString()}원이 차감되었습니다!`
      );
      navigate('/');
    } else {
      console.error('❌ TEST: 벌금 기록 실패:', result.error);
      toast.error('벌금 기록에 실패했습니다');
    }
  };

  const selectedRule = rules.find(r => r.id === formData.rule_id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors mr-3"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">💰 벌금 기록하기</h1>
            <p className="text-gray-600 mt-1">
              규칙을 어겼을 때나 선행을 했을 때 기록해보세요
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Type Selection */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">유형 선택</h3>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, type: 'fine' }))}
              className={`p-4 rounded-xl border-2 transition-colors ${
                formData.type === 'fine'
                  ? 'border-red-200 bg-red-50 text-red-800'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Plus className="h-6 w-6 mx-auto mb-2 text-red-600" />
              <div className="font-semibold">벌금 추가</div>
              <div className="text-sm text-gray-500">규칙을 어겼을 때</div>
            </button>
            
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, type: 'deduction' }))}
              className={`p-4 rounded-xl border-2 transition-colors ${
                formData.type === 'deduction'
                  ? 'border-green-200 bg-green-50 text-green-800'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Minus className="h-6 w-6 mx-auto mb-2 text-green-600" />
              <div className="font-semibold">벌금 차감</div>
              <div className="text-sm text-gray-500">선행을 했을 때</div>
            </button>
          </div>
        </div>

        {/* Rule Selection */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            관련 규칙
          </h3>
          <select
            value={formData.rule_id}
            onChange={(e) => {
              const rule = rules.find(r => r.id === e.target.value);
              setFormData(prev => ({ 
                ...prev, 
                rule_id: e.target.value,
                // 금액이 0일 때만 기본값 설정, 기존 값은 유지
                amount: prev.amount === 0 ? (rule?.fine_amount || 0) : prev.amount
              }));
            }}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            required
          >
            <option value="">규칙을 선택하세요</option>
            {rules.map(rule => (
              <option key={rule.id} value={rule.id}>
                {rule.title} (₩{rule.fine_amount.toLocaleString()})
              </option>
            ))}
          </select>
        </div>

        {/* Recipient Selection */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <User className="h-5 w-5 mr-2" />
            벌금 받을 사람
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, fine_recipient_id: user?.id || '' }))}
              className={`p-4 rounded-xl border-2 transition-colors ${
                formData.fine_recipient_id === user?.id
                  ? 'border-primary-200 bg-primary-50 text-primary-800'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-2">👨</div>
              <div className="font-semibold">나</div>
              <div className="text-sm text-gray-500">{user?.display_name || user?.email}</div>
            </button>
            
            <button
              type="button"
              onClick={() => setFormData(prev => ({ 
                ...prev, 
                fine_recipient_id: user?.id === 'test-user-abc-123' ? 'test-user-ddd-456' : 'test-user-abc-123'
              }))}
              className={`p-4 rounded-xl border-2 transition-colors ${
                formData.fine_recipient_id !== user?.id
                  ? 'border-primary-200 bg-primary-50 text-primary-800'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-2">👩</div>
              <div className="font-semibold">파트너</div>
              <div className="text-sm text-gray-500">테스트파트너</div>
            </button>
          </div>
        </div>

        {/* Amount */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            금액
          </h3>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₩</span>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: parseInt(e.target.value) || 0 }))}
              className="w-full pl-8 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="금액을 입력하세요"
              min="0"
              required
            />
          </div>
          {selectedRule && (
            <p className="mt-2 text-sm text-gray-600">
              기본 벌금: ₩{selectedRule.fine_amount.toLocaleString()}
            </p>
          )}
        </div>

        {/* Memo */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">메모</h3>
          <textarea
            value={formData.memo}
            onChange={(e) => setFormData(prev => ({ ...prev, memo: e.target.value }))}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            rows={3}
            placeholder="상황에 대한 메모를 남겨보세요 (선택사항)"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-primary-600 text-white py-4 rounded-xl hover:bg-primary-700 transition-colors font-semibold text-lg"
        >
          {formData.type === 'fine' ? '벌금 추가하기' : '벌금 차감하기'}
        </button>
      </form>

      {/* Test Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-center">
          <div className="p-2 bg-blue-100 rounded-lg mr-3">
            <Calendar className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-blue-800">🧪 CRUD 테스트 진행 중</h3>
            <p className="text-xs text-blue-700 mt-1">
              벌금 기록 생성 기능을 테스트하고 있습니다. 
              실시간 동기화 기능도 함께 확인됩니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};