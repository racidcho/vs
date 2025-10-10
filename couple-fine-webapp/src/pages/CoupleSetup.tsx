import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { Heart, Users, ArrowRight, Loader2, ArrowLeft, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

type Step = 'choose' | 'create' | 'join';

type CoupleSetupProps = {
  previewMode?: boolean;
};


export const CoupleSetup: React.FC<CoupleSetupProps> = ({ previewMode = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { createCouple, joinCouple } = useApp();
  const { user, refreshUser, signOut } = useAuth();

  const [step, setStep] = useState<Step>('choose');
  const [coupleCode, setCoupleCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const isPreview = previewMode || new URLSearchParams(location.search).get('preview') === 'true';

  const handleCreateCouple = async () => {
    if (isPreview) {
      toast('미리보기에서는 새로운 커플을 생성할 수 없어요. 🥰');
      return;
    }

    setIsLoading(true);

    try {
      const result = await createCouple('우리');

      if ('error' in result) {
        toast.error(result.error);
      } else {
        // Refresh user to get updated couple_id
        await refreshUser();
        if (result.isNewCouple) {
          toast.success('커플이 생성되었고, 기본 규칙과 보상이 추가되었어요! 🎉');
        } else {
          toast.success('커플이 성공적으로 생성되었어요! 💕');
        }

        // 커플 생성 후 바로 이름 설정 페이지로 이동
        navigate('/name-setup');
      }
    } catch (error) {
      toast.error('커플 생성에 실패했어요 😢');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinCouple = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isPreview) {
      toast('미리보기에서는 커플 참여를 체험만 할 수 있어요. 💖');
      return;
    }

    if (!coupleCode.trim()) {
      toast.error('커플 코드를 입력해주세요! 📝');
      return;
    }

    setIsLoading(true);

    try {
      const result = await joinCouple(coupleCode.toUpperCase());

      if (result.error) {
        toast.error(result.error);
      } else {
        // Refresh user to get updated couple_id
        await refreshUser();
        toast.success('커플 연결이 완료되었어요! 💕');
        // 바로 이름 설정 페이지로 이동
        navigate('/name-setup');
      }
    } catch (error) {
      toast.error('커플 연결에 실패했어요 😢');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeEmail = async () => {
    await signOut();
    navigate('/login');
  };

  if (step === 'create') {
    return (
      <div className="max-w-md mx-auto">
        <div className="card">
          {isPreview && (
            <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border border-pink-100 text-center text-sm text-purple-600 font-medium">
              미리보기 모드에서는 버튼이 비활성화돼요. ✨
            </div>
          )}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-coral-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">커플 계정 생성</h2>
            <p className="text-gray-600">파트너와 공유할 수 있는 고유 코드를 받게 되요</p>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">다음 단계:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• 고유한 커플 코드를 생성해드려요</li>
                <li>• 이 코드를 파트너와 공유하세요</li>
                <li>• 파트너가 코드로 참여할 수 있어요</li>
                <li>• 함께 벌금 관리를 시작할 수 있어요!</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('choose')}
                className="btn-secondary flex-1"
              >
                이전
              </button>

              <button
                onClick={handleCreateCouple}
                disabled={isLoading || isPreview}
                className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Users className="w-4 h-4" />
                )}
                커플 생성
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'join') {
    return (
      <div className="max-w-md mx-auto">
        <div className="card">
          {isPreview && (
            <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border border-pink-100 text-center text-sm text-purple-600 font-medium">
              미리보기 모드에서는 입력과 버튼이 비활성화돼요. ✨
            </div>
          )}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-coral-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <ArrowRight className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">커플 참여</h2>
            <p className="text-gray-600">파트너가 공유한 코드를 입력해주세요</p>
          </div>

          <form onSubmit={handleJoinCouple} className="space-y-4">
            <div>
              <label htmlFor="coupleCode" className="block text-sm font-medium text-gray-700 mb-2">
                커플 코드
              </label>
              <input
                id="coupleCode"
                type="text"
                value={coupleCode}
                onChange={(e) => setCoupleCode(e.target.value.toUpperCase())}
                placeholder="코드를 입력하세요 (예: ABCD12)"
                className="input-field text-center text-lg font-mono tracking-wider"
                maxLength={8}
                autoComplete="off"
                disabled={isPreview}
                required
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep('choose')}
                className="btn-secondary flex-1"
              >
                이전
              </button>

              <button
                type="submit"
                disabled={isLoading || !coupleCode.trim() || isPreview}
                className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
                커플 참여
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="card">
        {isPreview && (
          <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border border-pink-100 text-center text-sm text-purple-600 font-medium">
            미리보기 모드예요. 실제 계정에는 변화가 없어요. 🌸
          </div>
        )}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-pink-400 via-purple-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse shadow-lg">
            <Heart className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent mb-3">
            {user?.display_name || '사랑하는 당신'}님, 환영해요! 💕
          </h1>
          <p className="text-gray-600 mb-2">커플 계정을 설정하고 함께 벌금 관리를 시작해보세요</p>
          
          {/* Current logged in email */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full text-sm text-gray-600 mt-2">
            <Mail className="w-4 h-4" />
            <span>{user?.email}</span>
          </div>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => setStep('create')}
            className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-pink-300 hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 transition-all text-left group transform hover:scale-[1.02] hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-100 to-purple-100 group-hover:from-pink-200 group-hover:to-purple-200 rounded-xl flex items-center justify-center shadow-sm">
                <Users className="w-6 h-6 text-pink-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">새 커플 생성 ✨</h3>
                <p className="text-sm text-gray-600">새로 시작하고 파트너를 초대하세요</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-pink-500 transition-colors" />
              {isPreview && (
                <span className="text-xs text-pink-500 font-medium">미리보기</span>
              )}
            </div>
          </button>

          <button
            onClick={() => setStep('join')}
            className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-purple-300 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all text-left group transform hover:scale-[1.02] hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 group-hover:from-purple-200 group-hover:to-pink-200 rounded-xl flex items-center justify-center shadow-sm">
                <Heart className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">기존 커플 참여 💝</h3>
                <p className="text-sm text-gray-600">파트너의 커플 코드를 입력하세요</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-500 transition-colors" />
              {isPreview && (
                <span className="text-xs text-purple-500 font-medium">미리보기</span>
              )}
            </div>
          </button>

          {/* Divider */}
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-white text-xs text-gray-500">또는</span>
            </div>
          </div>

          {/* Change Email Button */}
          <button
            onClick={handleChangeEmail}
            className="w-full p-3 border border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all text-center group"
          >
            <div className="flex items-center justify-center gap-2 text-gray-600 group-hover:text-gray-800">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">다른 이메일로 로그인하기</span>
            </div>
          </button>
        </div>

        {/* Cute tip */}
        <div className="mt-6 p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl">
          <div className="flex items-start gap-3">
            <span className="text-xl">💡</span>
            <div>
              <p className="text-sm font-medium text-purple-900 mb-1">처음이신가요?</p>
              <p className="text-xs text-purple-700">
                '새 커플 생성'을 선택하고 생성된 코드를 파트너에게 공유하면 돼요!
                서로의 애칭을 설정하고 재미있는 벌금 관리를 시작해보세요 🎉
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
