import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Filter, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

export const Calendar: React.FC = () => {
  const { state } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filter, setFilter] = useState<'all' | 'add' | 'subtract'>('all');

  // Get current month/year
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Filter violations by current month
  const monthlyViolations = state.violations?.filter(violation => {
    const violationDate = new Date(violation.created_at);
    return violationDate.getMonth() === currentMonth && 
           violationDate.getFullYear() === currentYear &&
           (filter === 'all' || violation.type === filter);
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
    penalties: monthlyViolations.filter(v => v.type === 'add').reduce((sum, v) => sum + v.amount, 0),
    reductions: monthlyViolations.filter(v => v.type === 'subtract').reduce((sum, v) => sum + v.amount, 0)
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
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
            const penalties = dayViolations.filter(v => v.type === 'add').length;
            const reductions = dayViolations.filter(v => v.type === 'subtract').length;

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
          <div className="space-y-3">
            {monthlyViolations
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .slice(0, 10)
              .map((violation) => {
                const rule = state.rules?.find(r => r.id === violation.rule_id);
                return (
                  <div key={violation.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        violation.type === 'add' ? 'bg-red-100' : 'bg-green-100'
                      }`}>
                        {violation.type === 'add' ? (
                          <TrendingUp className="w-4 h-4 text-red-600" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {rule?.title || 'Unknown Rule'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(violation.created_at).toLocaleDateString('ko-KR')} • 
                          {violation.note && ` ${violation.note}`}
                        </p>
                      </div>
                    </div>
                    <span className={`font-semibold ${
                      violation.type === 'add' ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {violation.type === 'add' ? '+' : '-'}{violation.amount}만원
                    </span>
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