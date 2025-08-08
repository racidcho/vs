import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { Heart, Users, ArrowRight, Loader2, Copy, CheckCircle, ArrowLeft, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

type Step = 'choose' | 'create' | 'join' | 'success' | 'name';

export const CoupleSetup: React.FC = () => {
  const navigate = useNavigate();
  const { createCouple, joinCouple, updateCoupleName } = useApp();
  const { user, refreshUser, signOut } = useAuth();

  const [step, setStep] = useState<Step>('choose');
  const [coupleCode, setCoupleCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [coupleName, setCoupleName] = useState('우리');

  const handleCreateCouple = async () => {
    setIsLoading(true);

    try {
      const result = await createCouple(coupleName);

      if ('error' in result) {
        toast.error(result.error);
      } else {
        setGeneratedCode(result.code);
        // Refresh user to get updated couple_id
        await refreshUser();
        if (result.isNewCouple) {
          toast.success('커플이 생성되었고, 기본 규칙과 보상이 추가되었어요! 🎉');
        } else {
          toast.success('커플이 성공적으로 생성되었어요! 💕');
        }

        // Show couple name step if name is default
        if (coupleName === '우리') {
          setStep('name');
        } else {
          setStep('success');
        }
      }
    } catch (error) {
      toast.error('커플 생성에 실패했어요 😢');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinCouple = async (e: React.FormEvent) => {
    e.preventDefault();

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
        setStep('success');
        // Refresh user to get updated couple_id
        await refreshUser();
        toast.success('커플 연결이 완료되었어요! 💕 이제 함께 벌금을 관리해보세요!');
      }
    } catch (error) {
      toast.error('커플 연결에 실패했어요 😢');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      toast.success('Code copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy code');
    }
  };

  const handleContinue = () => {
    navigate('/name-setup');
  };

  const handleChangeEmail = async () => {
    await signOut();
    navigate('/login');
  };

  const handleSaveCoupleName = async () => {
    if (!coupleName.trim()) {
      toast.error('커플 이름을 입력해주세요! 📝');
      return;
    }

    setIsLoading(true);
    try {
      const result = await updateCoupleName(coupleName.trim());
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('커플 이름이 저장되었어요! 💕');
        setStep('success');
      }
    } catch (error) {
      toast.error('커플 이름 저장에 실패했어요 😢');
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'name') {
    return (
      <div className="max-w-md mx-auto">
        <div className="card">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-purple-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">커플 이름 설정</h2>
            <p className="text-gray-600">둘만의 특별한 이름을 지어주세요</p>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="coupleName" className="block text-sm font-medium text-gray-700 mb-2">
                커플 이름
              </label>
              <input
                id="coupleName"
                type="text"
                value={coupleName}
                onChange={(e) => setCoupleName(e.target.value)}
                placeholder="예: 달콤한 우리, 러브버드 등"
                className="input-field text-center"
                maxLength={20}
                required
              />
              <p className="text-xs text-gray-500 mt-1 text-center">
                나중에 설정에서 변경할 수 있어요
              </p>
            </div>

            <div className="p-4 bg-pink-50 rounded-lg">
              <h3 className="font-medium text-pink-900 mb-2">💡 이름 아이디어:</h3>
              <div className="grid grid-cols-2 gap-2 text-sm text-pink-800">
                <button
                  onClick={() => setCoupleName('달콤한 우리')}
                  className="text-left hover:bg-pink-100 p-2 rounded transition-colors"
                >
                  🍯 달콤한 우리
                </button>
                <button
                  onClick={() => setCoupleName('러브버드')}
                  className="text-left hover:bg-pink-100 p-2 rounded transition-colors"
                >
                  🐦 러브버드
                </button>
                <button
                  onClick={() => setCoupleName('꿀커플')}
                  className="text-left hover:bg-pink-100 p-2 rounded transition-colors"
                >
                  🍯 꿀커플
                </button>
                <button
                  onClick={() => setCoupleName('투게더')}
                  className="text-left hover:bg-pink-100 p-2 rounded transition-colors"
                >
                  💕 투게더
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('success')}
                className="btn-secondary flex-1"
              >
                건너뛰기
              </button>

              <button
                onClick={handleSaveCoupleName}
                disabled={isLoading || !coupleName.trim()}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Heart className="w-4 h-4" />
                )}
                저장
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="max-w-md mx-auto">
        <div className="card text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-coral-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {generatedCode ? '커플 생성 완료! 🎉' : '커플 연결 완료! 💕'}
            </h2>
            <p className="text-gray-600">
              {generatedCode
                ? '아래 코드를 파트너에게 공유하고 서로의 이름을 설정해보세요'
                : '이제 서로를 부를 이름을 설정해보세요'
              }
            </p>
          </div>

          {generatedCode && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">커플 코드:</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl font-mono font-bold text-primary-600 tracking-wider">
                  {generatedCode}
                </span>
                <button
                  onClick={copyToClipboard}
                  className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                  title="클립보드에 복사"
                >
                  {copied ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                파트너가 이 코드로 커플 계정에 참여할 수 있어요
              </p>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-800 font-medium mb-1">🎯 다음 단계:</p>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• 서로를 부를 애칭을 설정해보세요</li>
                  <li>• 기본 규칙과 보상이 자동으로 생성되었어요</li>
                  <li>• 파트너가 연결되면 함께 벌금을 관리할 수 있어요</li>
                </ul>
              </div>
            </div>
          )}

          {!generatedCode && (
            <div className="mb-4 p-3 bg-green-50 rounded-lg">
              <p className="text-xs text-green-800 font-medium mb-1">🎉 연결 완료!</p>
              <ul className="text-xs text-green-700 space-y-1">
                <li>• 이제 서로를 부를 애칭을 설정해보세요</li>
                <li>• 파트너와 함께 벌금 시스템을 사용할 수 있어요</li>
                <li>• 규칙 위반시 서로 벌금을 기록해보세요</li>
              </ul>
            </div>
          )}

          <button
            onClick={handleContinue}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <ArrowRight className="w-4 h-4" />
            이름 설정하기
          </button>
        </div>
      </div>
    );
  }

  if (step === 'create') {
    return (
      <div className="max-w-md mx-auto">
        <div className="card">
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
                disabled={isLoading}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
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
                disabled={isLoading || !coupleCode.trim()}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
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