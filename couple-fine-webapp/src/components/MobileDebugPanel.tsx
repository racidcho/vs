import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { 
  runFullDiagnostics, 
  checkSupabaseConnection, 
  checkAuthStatus, 
  testRLSPolicies, 
  testRealtimeSubscription, 
  testCRUDOperations, 
  checkCoupleConnection 
} from '../utils/debugSupabase';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';

export const MobileDebugPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<Array<{ time: string; type: string; message: string; color: string }>>([]);
  const [isRunning, setIsRunning] = useState(false);
  const { user } = useAuth();
  const { state, createRule, createViolation, createReward, loadCoupleData } = useApp();

  // 로그 추가 함수
  const addLog = (type: string, message: string, color: string = 'text-gray-600') => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { time, type, message, color }]);
  };

  // 전체 진단 실행
  const runDiagnostics = async () => {
    setIsRunning(true);
    setLogs([]);
    addLog('시작', '🔍 전체 진단을 시작합니다...', 'text-blue-600');

    try {
      // 1. 연결 확인
      addLog('연결', '🔌 Supabase 연결 확인 중...', 'text-gray-600');
      const connected = await checkSupabaseConnection();
      if (connected) {
        addLog('연결', '✅ Supabase 연결 성공', 'text-green-600');
      } else {
        addLog('연결', '❌ Supabase 연결 실패', 'text-red-600');
        return;
      }

      // 2. 인증 확인
      addLog('인증', '🔐 인증 상태 확인 중...', 'text-gray-600');
      const authUser = await checkAuthStatus();
      if (authUser) {
        addLog('인증', `✅ 로그인됨: ${authUser.email}`, 'text-green-600');
      } else {
        addLog('인증', '❌ 로그인 필요', 'text-red-600');
        return;
      }

      // 3. 커플 연결 확인
      addLog('커플', '💑 커플 연결 확인 중...', 'text-gray-600');
      const couple = await checkCoupleConnection(authUser.id);
      if (couple) {
        addLog('커플', `✅ 커플 연결됨: ${couple.couple_code}`, 'text-green-600');
      } else {
        addLog('커플', '⚠️ 커플 연결 안됨', 'text-yellow-600');
      }

      // 4. RLS 테스트
      addLog('RLS', '🛡️ RLS 정책 테스트 중...', 'text-gray-600');
      // RLS 테스트는 콘솔 로그를 수집해서 표시
      const originalLog = console.log;
      const rlsLogs: string[] = [];
      console.log = (...args) => {
        rlsLogs.push(args.join(' '));
        originalLog(...args);
      };
      
      await testRLSPolicies(authUser.id, couple?.id);
      
      console.log = originalLog;
      
      // RLS 결과 파싱
      rlsLogs.forEach(log => {
        if (log.includes('✅')) {
          addLog('RLS', log, 'text-green-600');
        } else if (log.includes('❌')) {
          addLog('RLS', log, 'text-red-600');
        }
      });

      // 5. CRUD 테스트
      if (couple) {
        addLog('CRUD', '📝 CRUD 작업 테스트 중...', 'text-gray-600');
        
        // CRUD 테스트도 콘솔 로그 수집
        const crudLogs: string[] = [];
        console.log = (...args) => {
          crudLogs.push(args.join(' '));
          originalLog(...args);
        };
        
        await testCRUDOperations(authUser.id, couple.id);
        
        console.log = originalLog;
        
        // CRUD 결과 파싱
        crudLogs.forEach(log => {
          if (log.includes('CREATE 성공')) {
            addLog('CRUD', '✅ 규칙 생성 가능', 'text-green-600');
          } else if (log.includes('CREATE 실패')) {
            addLog('CRUD', '❌ 규칙 생성 불가', 'text-red-600');
          } else if (log.includes('UPDATE 성공')) {
            addLog('CRUD', '✅ 규칙 수정 가능', 'text-green-600');
          } else if (log.includes('DELETE 성공')) {
            addLog('CRUD', '✅ 규칙 삭제 가능', 'text-green-600');
          }
        });
      }

      addLog('완료', '🎉 진단 완료!', 'text-green-600 font-bold');
    } catch (error) {
      addLog('오류', `💥 진단 중 오류: ${error}`, 'text-red-600');
    } finally {
      setIsRunning(false);
    }
  };

  // 실시간 테스트
  const testRealtime = (table: string) => {
    addLog('실시간', `📡 ${table} 테이블 실시간 구독 시작...`, 'text-blue-600');
    
    // 콘솔 로그 수집
    const originalLog = console.log;
    const realtimeLogs: string[] = [];
    console.log = (...args) => {
      realtimeLogs.push(args.join(' '));
      originalLog(...args);
    };
    
    const channel = testRealtimeSubscription(table);
    
    setTimeout(() => {
      console.log = originalLog;
      
      // 실시간 결과 파싱
      realtimeLogs.forEach(log => {
        if (log.includes('구독 성공')) {
          addLog('실시간', `✅ ${table} 구독 성공`, 'text-green-600');
        } else if (log.includes('구독 실패')) {
          addLog('실시간', `❌ ${table} 구독 실패`, 'text-red-600');
        } else if (log.includes('채널 상태')) {
          if (log.includes('joined')) {
            addLog('실시간', `✅ ${table} 채널 연결됨`, 'text-green-600');
          } else {
            addLog('실시간', `⚠️ ${table} 채널 대기 중`, 'text-yellow-600');
          }
        }
      });
    }, 3500);
  };

  // 테스트 데이터 생성
  const createTestData = async () => {
    setIsRunning(true);
    try {
      addLog('테스트', '🧪 테스트 규칙 생성 중...', 'text-blue-600');
      const result = await createRule({
        title: `테스트 규칙 ${Date.now()}`,
        description: '모바일 디버깅 테스트',
        fine_amount: 5000,
        created_by_user_id: user?.id || ''
      });
      
      if (result.error) {
        addLog('테스트', `❌ 규칙 생성 실패: ${result.error}`, 'text-red-600');
      } else {
        addLog('테스트', '✅ 규칙 생성 성공', 'text-green-600');
      }
    } catch (error) {
      addLog('테스트', `💥 오류: ${error}`, 'text-red-600');
    } finally {
      setIsRunning(false);
    }
  };

  // 상태 정보
  const getStateInfo = () => {
    return {
      '사용자 ID': user?.id?.substring(0, 8) + '...' || '없음',
      '이메일': user?.email || '없음',
      '커플 ID': user?.couple_id?.substring(0, 8) + '...' || '없음',
      '규칙 수': state.rules.length,
      '벌금 수': state.violations.length,
      '보상 수': state.rewards.length
    };
  };

  // 프로덕션에서도 특정 조건으로 활성화 (예: URL 파라미터)
  const urlParams = new URLSearchParams(window.location.search);
  const debugMode = urlParams.get('debug') === 'true';
  
  // debug=true 파라미터가 없으면 표시 안함
  if (!debugMode && import.meta.env.PROD) return null;

  return (
    <>
      {/* 플로팅 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-20 right-4 z-50 bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 transition-colors"
      >
        🐛
      </button>

      {/* 디버그 패널 */}
      {isOpen && (
        <div className="fixed inset-x-0 bottom-0 z-50 bg-white border-t-2 border-purple-600 shadow-2xl max-h-[70vh] overflow-hidden flex flex-col">
          {/* 헤더 */}
          <div className="bg-purple-600 text-white p-3 flex items-center justify-between">
            <h3 className="font-bold">🔍 디버깅 패널</h3>
            <button onClick={() => setIsOpen(false)} className="p-1">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* 상태 정보 */}
          <div className="bg-gray-50 p-3 border-b">
            <h4 className="font-semibold text-sm mb-2">📊 현재 상태</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(getStateInfo()).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-gray-600">{key}:</span>
                  <span className="font-mono text-gray-800">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 액션 버튼들 */}
          <div className="p-3 border-b bg-gray-50">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={runDiagnostics}
                disabled={isRunning}
                className="bg-blue-500 text-white px-3 py-2 rounded text-sm font-medium disabled:opacity-50"
              >
                {isRunning ? '실행 중...' : '🔍 전체 진단'}
              </button>
              
              <button
                onClick={() => loadCoupleData()}
                disabled={isRunning}
                className="bg-green-500 text-white px-3 py-2 rounded text-sm font-medium disabled:opacity-50"
              >
                🔄 데이터 새로고침
              </button>
              
              <button
                onClick={createTestData}
                disabled={isRunning}
                className="bg-purple-500 text-white px-3 py-2 rounded text-sm font-medium disabled:opacity-50"
              >
                🧪 테스트 규칙 생성
              </button>
              
              <button
                onClick={() => testRealtime('rules')}
                disabled={isRunning}
                className="bg-yellow-500 text-white px-3 py-2 rounded text-sm font-medium disabled:opacity-50"
              >
                📡 실시간 테스트
              </button>
            </div>
          </div>

          {/* 로그 출력 */}
          <div className="flex-1 overflow-y-auto p-3 bg-gray-900">
            <h4 className="font-semibold text-sm mb-2 text-white">📝 로그</h4>
            <div className="space-y-1 font-mono text-xs">
              {logs.length === 0 ? (
                <div className="text-gray-400">로그가 없습니다. 진단을 실행하세요.</div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className={`${log.color}`}>
                    <span className="text-gray-500">[{log.time}]</span>
                    <span className="font-semibold ml-2">{log.type}:</span>
                    <span className="ml-2">{log.message}</span>
                  </div>
                ))
              )}
            </div>
            {logs.length > 0 && (
              <button
                onClick={() => setLogs([])}
                className="mt-3 text-gray-400 hover:text-gray-200 text-xs"
              >
                🗑️ 로그 지우기
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};