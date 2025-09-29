import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Heart, Mail, Loader2, Lock, Eye, EyeOff, UserPlus, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';

interface LoginFormProps {
  className?: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({ className = '' }) => {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSignUpMode, setIsSignUpMode] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!email || !email.includes('@')) {
      toast.error('올바른 이메일 주소를 입력해주세요');
      return;
    }

    if (!password || password.length < 6) {
      toast.error('비밀번호는 6자 이상이어야 해요');
      return;
    }

    if (isSignUpMode && password !== confirmPassword) {
      toast.error('비밀번호가 일치하지 않아요');
      return;
    }

    setIsLoading(true);

    try {
      let result;
      
      if (isSignUpMode) {
        // Sign up
        result = await signUp(email, password);
      } else {
        // Sign in
        result = await signIn(email, password);
      }

      if (result.error) {
        console.error('❌ Auth error:', result.error);
        
        // Error message handling
        if (result.error.includes('User already registered')) {
          toast.error('이미 가입된 이메일이에요');
        } else if (result.error.includes('Invalid login credentials')) {
          toast.error('이메일 또는 비밀번호가 올바르지 않아요');
        } else if (result.error.includes('Email not confirmed')) {
          toast.error('이메일 인증이 필요해요. 받은 편지를 확인해주세요.');
        } else {
          toast.error(result.error);
        }
      } else if (result.success) {
        const defaultMessage = isSignUpMode ? '회원가입 성공! 로그인되었어요 🎉' : '로그인 성공! 🎉';
        const successMessage = result.message || defaultMessage;
        toast.success(successMessage);

        // 이메일 인증이 필요한 경우에는 이동하지 않고 폼에 남겨둡니다.
        if (isSignUpMode && successMessage.includes('이메일을 확인')) {
          return;
        }

        // Navigate to home
        const searchParams = location.search;
        navigate('/' + searchParams);
      }
    } catch (error) {
      console.error('💥 Unexpected error:', error);
      toast.error('문제가 발생했어요. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUpMode(!isSignUpMode);
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className={`max-w-md mx-auto ${className}`}>
      <div className="card">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-coral-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent mb-2">
            우리 벌금통
          </h1>
          <p className="text-gray-600">
            {isSignUpMode ? '새로운 계정을 만들어요' : '사랑하는 사람과 함께 만드는 행복한 약속 💕'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field */}
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

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              비밀번호
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="6자 이상"
                className="input-field pl-10 pr-10"
                required
                autoComplete={isSignUpMode ? 'new-password' : 'current-password'}
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Confirm Password Field (Sign Up Only) */}
          {isSignUpMode && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호 확인
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="비밀번호를 다시 입력해주세요"
                  className="input-field pl-10 pr-10"
                  required={isSignUpMode}
                  autoComplete="new-password"
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          )}

          {/* Forgot Password Link */}
          {!isSignUpMode && (
            <div className="text-right">
              <Link 
                to="/reset-password" 
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                비밀번호를 잊으셨나요?
              </Link>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isSignUpMode ? (
              <>
                <UserPlus className="w-4 h-4" />
                회원가입
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                로그인
              </>
            )}
          </button>
        </form>

        {/* Mode Toggle */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            {isSignUpMode ? '이미 계정이 있으신가요?' : '처음 사용하시나요?'}
            <button
              type="button"
              onClick={toggleMode}
              className="ml-2 text-primary-600 hover:text-primary-700 font-medium"
            >
              {isSignUpMode ? '로그인' : '회원가입'}
            </button>
          </p>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            안전한 비밀번호를 사용해주세요.<br />
            비밀번호는 암호화되어 저장됩니다.
          </p>
        </div>
      </div>
    </div>
  );
};