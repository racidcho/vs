import React from 'react';
import { Heart, Plus, Edit, Trash2, AlertCircle } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

export const Rules: React.FC = () => {
  const { state } = useApp();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relationship Rules</h1>
          <p className="text-gray-600 mt-1">
            Manage your couple's rules and penalties
          </p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Rule
        </button>
      </div>

      {/* Rules List */}
      {state.rules && state.rules.length > 0 ? (
        <div className="space-y-4">
          {state.rules.map((rule) => (
            <div key={rule.id} className="card p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Heart className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{rule.title}</h3>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-sm text-gray-600">
                        Penalty: {rule.penalty_amount}만원
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        rule.type === 'word' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {rule.type === 'word' ? 'Word' : 'Behavior'}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        rule.is_active !== false ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {rule.is_active !== false ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No rules yet</h3>
          <p className="text-gray-600 mb-6">
            Create your first relationship rule to start tracking together
          </p>
          <button className="btn-primary flex items-center gap-2 mx-auto">
            <Plus className="w-4 h-4" />
            Create First Rule
          </button>
        </div>
      )}
    </div>
  );
};