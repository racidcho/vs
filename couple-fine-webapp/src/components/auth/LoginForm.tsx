import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Heart, Mail, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface LoginFormProps {
  className?: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({ className = '' }) => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast.error('올바른 이메일 주소를 입력해주세요');
      return;
    }

    setIsLoading(true);
    
    try {
      const { error } = await signIn(email);
      
      if (error) {
        toast.error(error);
      } else {
        // 이메일 전송 성공 - 확인 화면 표시
        setEmailSent(true);
        toast.success('📧 매직 링크를 보냈어요! 이메일을 확인해주세요');
      }
    } catch (error) {
      toast.error('문제가 발생했어요. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };


  if (emailSent) {
    return (
      <div className={`max-w-md mx-auto ${className}`}>
        <div className="card text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-primary-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">이메일을 확인해주세요</h2>
            <p className="text-gray-600">
              <strong>{email}</strong>로 매직 링크를 보냈어요
            </p>
          </div>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              이메일에 있는 링크를 클릭하면 로그인됩니다. 링크는 1시간 후 만료돼요.
            </p>
            
            <button
              onClick={() => setEmailSent(false)}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              다른 이메일 사용하기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-md mx-auto ${className}`}>
      <div className="card">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-coral-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent mb-2">우리 벌금통</h1>
          <p className="text-gray-600">사랑하는 사람과 함께 만드는 행복한 약속 💕</p>
        </div>

        <form onSubmit={handleEmailSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              이메일 주소
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="사랑@example.com"
                className="input-field pl-10"
                required
                autoComplete="email"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Mail className="w-4 h-4" />
            )}
            매직 링크 보내기
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            비밀번호 없이 안전하게 로그인할 수 있는 링크를 보내드려요
          </p>
        </div>
      </div>
    </div>
  );
};