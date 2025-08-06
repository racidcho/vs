import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { AlertTriangle, Plus, Minus, ArrowLeft, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export const NewViolation: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useApp();
  
  const [selectedRuleId, setSelectedRuleId] = useState('');
  const [violationType, setViolationType] = useState<'add' | 'subtract'>('add');
  const [amount, setAmount] = useState(0);
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const selectedRule = state.rules?.find(r => r.id === selectedRuleId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRuleId) {
      toast.error('Please select a rule');
      return;
    }

    if (amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsLoading(true);
    
    try {
      // TODO: Implement violation creation
      toast.success(`${violationType === 'add' ? 'Violation' : 'Reduction'} recorded successfully!`);
      navigate('/');
    } catch (error) {
      toast.error('Failed to record violation');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Record Activity</h1>
          <p className="text-gray-600 mt-1">
            Add a violation or reduction to your couple's balance
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Violation Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Activity Type
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setViolationType('add')}
                className={`p-4 rounded-lg border-2 transition-colors text-left ${
                  violationType === 'add'
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <Plus className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Add Penalty</h3>
                    <p className="text-sm text-gray-600">Report a rule violation</p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setViolationType('subtract')}
                className={`p-4 rounded-lg border-2 transition-colors text-left ${
                  violationType === 'subtract'
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Minus className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Reduce Penalty</h3>
                    <p className="text-sm text-gray-600">Apply a reduction</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Rule Selection */}
          <div>
            <label htmlFor="rule" className="block text-sm font-medium text-gray-700 mb-2">
              Select Rule
            </label>
            <select
              id="rule"
              value={selectedRuleId}
              onChange={(e) => {
                setSelectedRuleId(e.target.value);
                // Auto-fill amount with rule penalty
                const rule = state.rules?.find(r => r.id === e.target.value);
                if (rule) {
                  setAmount(rule.penalty_amount);
                }
              }}
              className="input-field"
              required
            >
              <option value="">Choose a rule</option>
              {state.rules?.filter(r => r.is_active !== false).map((rule) => (
                <option key={rule.id} value={rule.id}>
                  {rule.title} ({rule.penalty_amount}만원)
                </option>
              ))}
            </select>
          </div>

          {/* Selected Rule Info */}
          {selectedRule && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-gray-600" />
                <div>
                  <h4 className="font-medium text-gray-900">{selectedRule.title}</h4>
                  <p className="text-sm text-gray-600">
                    Default penalty: {selectedRule.penalty_amount}만원 • Type: {selectedRule.type}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Amount */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              Amount (만원)
            </label>
            <input
              id="amount"
              type="number"
              min="1"
              value={amount || ''}
              onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
              className="input-field"
              placeholder="Enter amount"
              required
            />
          </div>

          {/* Note */}
          <div>
            <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-2">
              Note (optional)
            </label>
            <textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="input-field"
              placeholder="Add details about this activity..."
            />
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !selectedRuleId || amount <= 0}
              className={`btn-primary flex-1 flex items-center justify-center gap-2 ${
                violationType === 'subtract' ? 'bg-green-600 hover:bg-green-700' : ''
              }`}
            >
              <Save className="w-4 h-4" />
              {isLoading 
                ? 'Recording...' 
                : `${violationType === 'add' ? 'Add' : 'Reduce'} ${amount}만원`
              }
            </button>
          </div>
        </form>
      </div>

      {/* Rules Quick Reference */}
      {state.rules && state.rules.length > 0 && (
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Quick Reference</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {state.rules.filter(r => r.is_active !== false).map((rule) => (
              <div 
                key={rule.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <span className="text-sm font-medium text-gray-900">{rule.title}</span>
                <span className="text-sm text-gray-600">{rule.penalty_amount}만원</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};