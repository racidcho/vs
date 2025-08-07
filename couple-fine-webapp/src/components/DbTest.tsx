import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getDashboardStats } from '../lib/supabaseApi';

interface DbTestProps {
  onClose?: () => void;
}

export const DbTest: React.FC<DbTestProps> = ({ onClose }) => {
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [testResults, setTestResults] = useState<any[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    testDatabaseConnection();
  }, []);

  const testDatabaseConnection = async () => {
    const results: any[] = [];

    try {
      // 1. Supabase 클라이언트 연결 테스트
      results.push({ test: 'Supabase 클라이언트', status: '✅', message: 'OK' });

      // 2. 인증 상태 확인
      const { data: { session } } = await supabase.auth.getSession();
      results.push({ 
        test: '인증 세션', 
        status: session ? '✅' : '⚠️', 
        message: session ? `사용자: ${session.user?.email}` : '로그인 필요'
      });

      // 3. 데이터베이스 테이블 접근 테스트
      const tables = ['profiles', 'couples', 'rules', 'violations', 'rewards'];
      for (const table of tables) {
        try {
          const { data, error } = await supabase
            .from(table)
            .select('id')
            .limit(1);
          
          if (error) {
            results.push({ 
              test: `테이블 ${table}`, 
              status: '❌', 
              message: error.message 
            });
          } else {
            results.push({ 
              test: `테이블 ${table}`, 
              status: '✅', 
              message: `데이터 ${data?.length || 0}개` 
            });
          }
        } catch (err: any) {
          results.push({ 
            test: `테이블 ${table}`, 
            status: '❌', 
            message: err.message 
          });
        }
      }

      // 4. API 함수 테스트 (로그인된 경우만)
      if (session?.user?.id) {
        try {
          await getDashboardStats('test-couple-id');
          results.push({ 
            test: 'API 함수 getDashboardStats', 
            status: '✅', 
            message: `통계 조회 성공` 
          });
        } catch (err: any) {
          results.push({ 
            test: 'API 함수 getDashboardStats', 
            status: '⚠️', 
            message: err.message 
          });
        }
      }

      setConnectionStatus('connected');
      setTestResults(results);

    } catch (error: any) {
      console.error('데이터베이스 테스트 실패:', error);
      setConnectionStatus('error');
      setErrorMessage(error.message);
      setTestResults(results);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-96 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">🔍 데이터베이스 연결 테스트</h2>
          {onClose && (
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-xl"
            >
              ✕
            </button>
          )}
        </div>

        <div className="space-y-3">
          {connectionStatus === 'checking' && (
            <div className="text-center py-4">
              <div className="animate-spin text-2xl">⏳</div>
              <p className="mt-2">데이터베이스 연결 테스트 중...</p>
            </div>
          )}

          {testResults.map((result, index) => (
            <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="font-medium">{result.test}</span>
              <div className="text-right">
                <span className="text-lg">{result.status}</span>
                <div className="text-xs text-gray-600">{result.message}</div>
              </div>
            </div>
          ))}

          {connectionStatus === 'error' && errorMessage && (
            <div className="bg-red-50 p-3 rounded-lg">
              <h3 className="font-bold text-red-800">❌ 연결 실패</h3>
              <p className="text-red-600 text-sm mt-1">{errorMessage}</p>
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-center">
          <button
            onClick={testDatabaseConnection}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90"
          >
            🔄 다시 테스트
          </button>
        </div>

        {connectionStatus === 'connected' && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg">
            <p className="text-green-800 font-medium">🎉 데이터베이스 연결 성공!</p>
            <p className="text-green-600 text-sm">실제 CRUD 테스트를 진행할 수 있습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
};