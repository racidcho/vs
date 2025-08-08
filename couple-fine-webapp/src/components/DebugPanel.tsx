import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, XCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { supabase, getConnectionStatus, healthCheck } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';

export const DebugPanel: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [health, setHealth] = useState<{
    database: boolean;
    realtime: boolean;
    auth: boolean;
  }>({ database: false, realtime: false, auth: false });
  const [connectionStatus, setConnectionStatus] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(false);
  
  const { user, session } = useAuth();
  const { state } = useApp();

  // Development mode only
  const isDev = import.meta.env.DEV || window.location.hostname === 'localhost';

  useEffect(() => {
    if (isDev) {
      checkHealth();
      const interval = setInterval(checkHealth, 10000); // Check every 10 seconds
      return () => clearInterval(interval);
    }
  }, [isDev]);

  const checkHealth = async () => {
    setIsChecking(true);
    try {
      const healthStatus = await healthCheck();
      setHealth(healthStatus);
      setConnectionStatus(getConnectionStatus());
    } catch (error) {
      console.error('Health check failed:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleRetry = async () => {
    window.location.reload();
  };

  if (!isDev) return null;

  return (
    <>
      {/* Debug Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-20 right-4 z-50 bg-gray-800 text-white p-2 rounded-full shadow-lg hover:bg-gray-700"
        title="Toggle Debug Panel"
      >
        {isVisible ? <XCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
      </button>

      {/* Debug Panel */}
      {isVisible && (
        <div className="fixed bottom-32 right-4 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-4 w-80 max-h-96 overflow-y-auto">
          <h3 className="font-bold text-sm mb-3 flex items-center justify-between">
            Debug Panel
            <button
              onClick={checkHealth}
              disabled={isChecking}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
            </button>
          </h3>

          {/* Connection Status */}
          <div className="space-y-2 text-xs">
            <div className="border-b pb-2 mb-2">
              <h4 className="font-semibold mb-1">연결 상태</h4>
              <div className="space-y-1">
                <StatusItem
                  label="Database"
                  status={health.database}
                  icon={health.database ? <CheckCircle className="w-3 h-3 text-green-500" /> : <XCircle className="w-3 h-3 text-red-500" />}
                />
                <StatusItem
                  label="Realtime"
                  status={health.realtime}
                  icon={health.realtime ? <Wifi className="w-3 h-3 text-green-500" /> : <WifiOff className="w-3 h-3 text-red-500" />}
                />
                <StatusItem
                  label="Auth"
                  status={health.auth}
                  icon={health.auth ? <CheckCircle className="w-3 h-3 text-green-500" /> : <XCircle className="w-3 h-3 text-red-500" />}
                />
              </div>
            </div>

            {/* User Info */}
            <div className="border-b pb-2 mb-2">
              <h4 className="font-semibold mb-1">사용자 정보</h4>
              <div className="space-y-1 text-gray-600 dark:text-gray-400">
                <div>Email: {user?.email || 'None'}</div>
                <div>User ID: {user?.id?.slice(0, 8) || 'None'}</div>
                <div>Session: {session ? 'Active' : 'None'}</div>
                <div>Couple ID: {user?.couple_id?.slice(0, 8) || 'None'}</div>
              </div>
            </div>

            {/* App State */}
            <div className="border-b pb-2 mb-2">
              <h4 className="font-semibold mb-1">앱 상태</h4>
              <div className="space-y-1 text-gray-600 dark:text-gray-400">
                <div>Theme: {state.theme}</div>
                <div>Rules: {state.rules.length}</div>
                <div>Violations: {state.violations.length}</div>
                <div>Rewards: {state.rewards.length}</div>
                <div>Online: {state.isOnline ? 'Yes' : 'No'}</div>
              </div>
            </div>

            {/* Realtime Channels */}
            {connectionStatus && (
              <div className="border-b pb-2 mb-2">
                <h4 className="font-semibold mb-1">Realtime Channels</h4>
                <div className="space-y-1 text-gray-600 dark:text-gray-400">
                  <div>Connected: {connectionStatus.isConnected ? 'Yes' : 'No'}</div>
                  <div>Channels: {connectionStatus.channels.length || 0}</div>
                  {connectionStatus.channels.map((channel: string, idx: number) => (
                    <div key={idx} className="pl-2 text-xs">{channel}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="pt-2 space-y-2">
              <button
                onClick={handleRetry}
                className="w-full bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600"
              >
                새로고침
              </button>
              <button
                onClick={() => {
                  localStorage.clear();
                  sessionStorage.clear();
                  window.location.reload();
                }}
                className="w-full bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600"
              >
                캐시 초기화 & 새로고침
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const StatusItem: React.FC<{ label: string; status: boolean; icon: React.ReactNode }> = ({ label, status, icon }) => (
  <div className="flex items-center justify-between">
    <span>{label}</span>
    <div className="flex items-center gap-1">
      <span className={status ? 'text-green-600' : 'text-red-600'}>
        {status ? 'Connected' : 'Disconnected'}
      </span>
      {icon}
    </div>
  </div>
);