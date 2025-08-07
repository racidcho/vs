import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

export const RealtimeStatus: React.FC = () => {
  const { state, isRealtimeConnected } = useApp();

  if (!state.couple) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`flex items-center gap-2 px-3 py-2 rounded-full shadow-lg transition-all ${
        isRealtimeConnected 
          ? 'bg-green-500 text-white' 
          : 'bg-red-500 text-white'
      }`}>
        {isRealtimeConnected ? (
          <>
            <Wifi className="w-4 h-4" />
            <span className="text-sm font-medium">실시간 연결됨</span>
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4" />
            <span className="text-sm font-medium">연결 끊어짐</span>
          </>
        )}
      </div>
    </div>
  );
};