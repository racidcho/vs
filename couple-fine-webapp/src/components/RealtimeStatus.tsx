import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

export const RealtimeStatus: React.FC = () => {
  const { state, isRealtimeConnected } = useApp();

  if (!state.couple) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className={`flex items-center gap-2 px-2 py-1 rounded-full shadow-lg transition-all text-xs ${
        isRealtimeConnected
          ? 'bg-green-500 text-white'
          : 'bg-red-500 text-white'
      }`}>
        {isRealtimeConnected ? (
          <>
            <Wifi className="w-3 h-3" />
            <span className="text-xs font-medium">실시간 연결됨</span>
          </>
        ) : (
          <>
            <WifiOff className="w-3 h-3" />
            <span className="text-xs font-medium">연결 끊어짐</span>
          </>
        )}
      </div>
    </div>
  );
};