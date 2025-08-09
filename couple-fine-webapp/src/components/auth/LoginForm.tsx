import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Heart, Mail, Loader2, Key } from 'lucide-react';
import toast from 'react-hot-toast';

interface LoginFormProps {
  className?: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({ className = '' }) => {
  const { signIn, verifyOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      toast.error('올바른 이메일 주소를 입력해주세요');
      return;
    }

    setIsLoading(true);

    try {
      const result = await signIn(email);

      if (result.error) {
        console.error('❌ SignIn error:', result.error);
        toast.error(result.error);
      } else if (result.success) {
        // OTP 전송 성공 - OTP 입력 화면 표시

        setOtpSent(true);
        toast.success('📧 인증 코드를 보냈어요! 이메일을 확인해주세요');
      } else {
        console.error('⚠️ Unexpected signIn result:', result);
        toast.error('알 수 없는 오류가 발생했습니다.');
      }
    } catch (error) {
      toast.error('문제가 발생했어요. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otp || otp.length !== 6) {
      toast.error('6자리 인증 코드를 입력해주세요');
      return;
    }

    setIsLoading(true);

    try {
      const { error, success } = await verifyOtp(email, otp);

      if (error) {
        console.error('❌ OTP verification failed:', error);
        toast.error(error);
      } else if (success) {

        toast.success('🎉 로그인 성공!');
        // 로그인 성공 후 즉시 리디렉션
        // URL 파라미터 유지 (예: ?debug=true)
        const searchParams = location.search;
        navigate('/' + searchParams);
      }
    } catch (error) {
      console.error('❌ Unexpected error:', error);
      toast.error('인증 코드가 올바르지 않아요. 다시 확인해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    try {
      const { error } = await signIn(email);
      if (error) {
        toast.error(error);
      } else {
        toast.success('📧 새로운 인증 코드를 보냈어요!');
        setOtp('');
      }
    } catch (error) {
      toast.error('문제가 발생했어요. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  // OTP 입력 화면
  if (otpSent) {
    return (
      <div className={`max-w-md mx-auto ${className}`}>
        <div className="card text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Key className="w-8 h-8 text-primary-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">인증 코드 입력</h2>
            <p className="text-gray-600">
              <strong>{email}</strong>로 6자리 코드를 보냈어요
            </p>
          </div>

          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                value={otp}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setOtp(value);
                }}
                placeholder="000000"
                className="input-field text-center text-2xl font-mono tracking-widest"
                maxLength={6}
                pattern="[0-9]{6}"
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                required
              />
              <p className="text-xs text-gray-500 mt-2">
                이메일에서 6자리 숫자 코드를 확인하세요
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading || otp.length !== 6}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Key className="w-4 h-4" />
              )}
              확인
            </button>
          </form>

          <div className="mt-4 space-y-2">
            <button
              onClick={handleResendOtp}
              disabled={isLoading}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              인증 코드 다시 받기
            </button>
            <br />
            <button
              onClick={() => {
                setOtpSent(false);
                setOtp('');
              }}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              다른 이메일 사용하기
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 이메일 입력 화면
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
            인증 코드 받기
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            이메일로 6자리 인증 코드를 보내드려요.<br />
            어떤 기기에서든 로그인할 수 있어요!
          </p>
        </div>
      </div>
    </div>
  );
};