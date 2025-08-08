import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Filter, TrendingUp, TrendingDown, Clock, Edit, Trash2 } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

export const Calendar: React.FC = () => {
  const { state, updateViolation, deleteViolation } = useApp();
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filter, setFilter] = useState<'all' | 'add' | 'subtract'>('all');
  const [editingViolation, setEditingViolation] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<number>(0);
  const [editMemo, setEditMemo] = useState<string>('');

  // Get current month/year
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Filter violations by current month
  const monthlyViolations = state.violations?.filter(violation => {
    const violationDate = new Date(violation.created_at);
    return violationDate.getMonth() === currentMonth &&
           violationDate.getFullYear() === currentYear &&
           (filter === 'all' || (filter === 'add' && violation.amount > 0) || (filter === 'subtract' && violation.amount < 0));
  }) || [];

  // Group violations by date
  const violationsByDate = monthlyViolations.reduce((acc, violation) => {
    const date = new Date(violation.created_at).toDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(violation);
    return acc;
  }, {} as Record<string, typeof monthlyViolations>);

  // Calculate monthly stats
  const monthlyStats = {
    total: monthlyViolations.length,
    penalties: monthlyViolations.filter(v => v.amount > 0).reduce((sum, v) => sum + v.amount, 0),
    reductions: monthlyViolations.filter(v => v.amount < 0).reduce((sum, v) => sum + Math.abs(v.amount), 0)
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  // Handle edit violation
  const handleEdit = (violation: any) => {
    setEditingViolation(violation.id);
    setEditAmount(Math.abs(violation.amount));
    setEditMemo(violation.memo || '');
  };

  // Handle save edit
  const handleSaveEdit = async () => {
    if (!editingViolation) return;

    try {
      const violation = state.violations.find(v => v.id === editingViolation);
      if (!violation) return;

      const amount = violation.amount < 0 ? -editAmount : editAmount;
      const { error } = await updateViolation(editingViolation, {
        amount,
        memo: editMemo.trim() || undefined
      });

      if (error) {
        toast.error(`수정 실패: ${error}`);
      } else {
        toast.success('위반 기록이 수정되었어요! 💝');
        setEditingViolation(null);
        setEditAmount(0);
        setEditMemo('');
      }
    } catch (error) {
      toast.error('수정 중 오류가 발생했어요');
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingViolation(null);
    setEditAmount(0);
    setEditMemo('');
  };

  // Handle delete violation
  const handleDelete = async (violationId: string, violationInfo: string) => {
    if (!window.confirm(`"${violationInfo}" 기록을 정말 삭제하시겠어요?\n\n⚠️ 삭제된 기록은 복구할 수 없습니다.`)) {
      return;
    }

    try {
      const { error } = await deleteViolation(violationId);
      if (error) {
        toast.error(`삭제 실패: ${error}`);
      } else {
        toast.success('위반 기록이 삭제되었어요');
      }
    } catch (error) {
      toast.error('삭제 중 오류가 발생했어요');
    }
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const days = getDaysInMonth(currentDate);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Activity Calendar</h1>
          <p className="text-gray-600 mt-1">
            Track your violations and reductions over time
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="input-field text-sm min-w-0"
          >
            <option value="all">All Activities</option>
            <option value="add">Penalties Only</option>
            <option value="subtract">Reductions Only</option>
          </select>
        </div>
      </div>

      {/* Monthly Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <CalendarIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Activities</p>
              <p className="text-xl font-bold text-gray-900">{monthlyStats.total}</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Penalties</p>
              <p className="text-xl font-bold text-gray-900">{monthlyStats.penalties}만원</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Reductions</p>
              <p className="text-xl font-bold text-gray-900">{monthlyStats.reductions}만원</p>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="card p-6">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            {monthNames[currentMonth]} {currentYear}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={previousMonth}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextMonth}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-px mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-600">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {days.map((day, index) => {
            if (!day) {
              return <div key={index} className="bg-gray-50 h-24" />;
            }

            const dateString = day.toDateString();
            const dayViolations = violationsByDate[dateString] || [];
            const penalties = dayViolations.filter(v => v.amount > 0).length;
            const reductions = dayViolations.filter(v => v.amount < 0).length;

            return (
              <div
                key={day.toISOString()}
                className={`bg-white h-24 p-2 flex flex-col justify-between ${
                  isToday(day) ? 'ring-2 ring-primary-500' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${
                    isToday(day)
                      ? 'font-bold text-primary-600'
                      : 'text-gray-900'
                  }`}>
                    {day.getDate()}
                  </span>
                  {dayViolations.length > 0 && (
                    <div className="w-2 h-2 bg-primary-500 rounded-full" />
                  )}
                </div>

                {dayViolations.length > 0 && (
                  <div className="space-y-1">
                    {penalties > 0 && (
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                        <span className="text-xs text-red-600">+{penalties}</span>
                      </div>
                    )}
                    {reductions > 0 && (
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                        <span className="text-xs text-green-600">-{reductions}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary-600" />
          Recent Activity
        </h3>

        {monthlyViolations.length > 0 ? (
          <div className="space-y-4">
            {monthlyViolations
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .slice(0, 10)
              .map((violation) => {
                const rule = state.rules?.find(r => r.id === violation.rule_id);
                
                // Get violator name
                const getViolatorName = () => {
                  // First try from violation relation
                  if (violation.violator?.display_name) {
                    return violation.violator.display_name;
                  }
                  if (violation.violator?.email) {
                    return violation.violator.email.split('@')[0];
                  }
                  
                  // Fallback to couple data
                  const couple = state.couple as any;
                  if (couple) {
                    if (violation.violator_user_id === couple.partner_1_id && couple.partner_1) {
                      return couple.partner_1.display_name || couple.partner_1.email?.split('@')[0] || '파트너1';
                    }
                    if (violation.violator_user_id === couple.partner_2_id && couple.partner_2) {
                      return couple.partner_2.display_name || couple.partner_2.email?.split('@')[0] || '파트너2';
                    }
                  }
                  
                  // Final fallback
                  return violation.violator_user_id === user?.id ? '나' : '파트너';
                };
                
                const violatorName = getViolatorName();
                const violatorEmoji = violation.violator_user_id === (state.couple as any)?.partner_1_id ? '👩' : '👨';
                const isAdd = violation.amount > 0;
                
                return (
                  <div key={violation.id} className="border border-gray-100 rounded-xl p-4 bg-gradient-to-r from-white to-gray-50 hover:shadow-md transition-all">
                    {editingViolation === violation.id ? (

                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            violation.amount > 0 ? 'bg-red-100' : 'bg-green-100'
                          }`}>
                            <Edit className="w-4 h-4 text-gray-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{rule?.title || 'Unknown Rule'}</p>
                            <p className="text-sm text-gray-500">편집 중...</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">금액 (만원)</label>
                            <input
                              type="number"
                              min="1"
                              value={editAmount || ''}
                              onChange={(e) => setEditAmount(parseInt(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-sm"
                              placeholder="금액"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">메모</label>
                            <input
                              type="text"
                              value={editMemo}
                              onChange={(e) => setEditMemo(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-sm"
                              placeholder="메모 (선택사항)"
                            />
                          </div>
                        </div>

                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={handleCancelEdit}
                            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            취소
                          </button>
                          <button
                            onClick={handleSaveEdit}
                            disabled={editAmount <= 0}
                            className="px-3 py-2 text-sm bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            저장
                          </button>
                        </div>
                      </div>
                    ) : (

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            violation.amount > 0 ? 'bg-red-100' : 'bg-green-100'
                          }`}>
                            {violation.amount > 0 ? (
                              <TrendingUp className="w-4 h-4 text-red-600" />
                            ) : (
                              <TrendingDown className="w-4 h-4 text-green-600" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-gray-900">
                                {rule?.title || 'Unknown Rule'}
                              </p>
                              <span className="text-sm">{violatorEmoji}</span>
                            </div>
                            <p className="text-sm text-gray-600">
                              <span className={`font-medium ${
                                isAdd ? 'text-red-600' : 'text-green-600'
                              }`}>
                                {violatorName}님{isAdd ? '이 받은' : '이 차감한'} 벌금
                              </span>
                              <span className="mx-1">•</span>
                              {new Date(violation.created_at).toLocaleDateString('ko-KR')}
                              {violation.memo && (
                                <>
                                  <span className="mx-1">•</span>
                                  <span>{violation.memo}</span>
                                </>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`font-semibold ${
                            violation.amount > 0 ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {violation.amount > 0 ? '+' : ''}{violation.amount}만원
                          </span>

                          <div className="flex gap-1 ml-3">
                            <button
                              onClick={() => handleEdit(violation)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="편집"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(violation.id, `${rule?.title || 'Unknown'} (${violation.amount}만원)`)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="삭제"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="text-center py-8">
            <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No activity this month</p>
          </div>
        )}
      </div>
    </div>
  );
};