import React, { useState } from 'react';
import { useTestAuth } from '../contexts/TestAuthContext';

const TestLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { signInDirectly } = useTestAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      const result = await signInDirectly(email);
      if (result.error) {
        setError(result.error);
      }
    } catch (err) {
      setError('로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (testEmail: string) => {
    setEmail(testEmail);
    signInDirectly(testEmail);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">🧪 테스트 로그인</h1>
          <p className="text-gray-600">이메일 인증 없이 바로 테스트</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              테스트 이메일
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ABC@NAVER.COM 또는 DDD@GMAIL.COM"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !email.trim()}
            className="w-full bg-pink-500 text-white py-3 px-4 rounded-xl font-medium hover:bg-pink-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? '로그인 중...' : '테스트 로그인'}
          </button>
        </form>

        <div className="mt-8 border-t pt-6">
          <p className="text-sm text-gray-600 mb-4 text-center">빠른 로그인</p>
          <div className="space-y-3">
            <button
              onClick={() => handleQuickLogin('ABC@NAVER.COM')}
              disabled={isLoading}
              className="w-full bg-blue-100 text-blue-700 py-2 px-4 rounded-lg hover:bg-blue-200 disabled:opacity-50 transition-colors text-sm"
            >
              👤 테스트사용자A (ABC@NAVER.COM)
            </button>
            <button
              onClick={() => handleQuickLogin('DDD@GMAIL.COM')}
              disabled={isLoading}
              className="w-full bg-green-100 text-green-700 py-2 px-4 rounded-lg hover:bg-green-200 disabled:opacity-50 transition-colors text-sm"
            >
              👤 테스트사용자B (DDD@GMAIL.COM)
            </button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
            <p className="font-semibold mb-2">🔧 테스트 환경 안내</p>
            <ul className="space-y-1 text-left">
              <li>• 이메일 인증 단계를 건너뜀</li>
              <li>• 두 개의 테스트 계정으로 커플 연결 테스트</li>
              <li>• 리얼타임 동기화와 CRUD 기능 검증</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestLogin;