import React from 'react';
import { useTestApp } from '../contexts/TestAppContext';

export const TestRealtimeStatus: React.FC = () => {
  const { isRealtimeConnected } = useTestApp();

  return (
    <div 
      className="fixed bottom-4 right-4 bg-white border rounded-lg shadow-lg p-3 text-sm z-50"
      id="realtime-status"
    >
      <div className="flex items-center space-x-2">
        <div className={`w-3 h-3 rounded-full ${isRealtimeConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className={isRealtimeConnected ? 'text-green-600' : 'text-red-600'}>
          {isRealtimeConnected ? '🟢 실시간 연결됨' : '🔴 연결 끊김'}
        </span>
      </div>
      <div className="text-xs text-gray-500 mt-1">
        🧪 테스트 모드
      </div>
    </div>
  );
};