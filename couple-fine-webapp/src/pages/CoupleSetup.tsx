import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { Heart, Users, ArrowRight, Loader2, Copy, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

type Step = 'choose' | 'create' | 'join' | 'success' | 'name';

export const CoupleSetup: React.FC = () => {
  const navigate = useNavigate();
  const { createCouple, joinCouple, updateCoupleName } = useApp();
  const { user, refreshUser } = useAuth();

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
    navigate('/');
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
                ? '아래 코드를 파트너에게 공유해주세요'
                : '커플 연결이 성공적으로 완료되었어요'
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
                  <li>• 기본 규칙과 보상이 자동으로 생성되었어요</li>
                  <li>• 파트너가 연결되면 함께 벌금을 관리할 수 있어요</li>
                  <li>• 설정에서 언제든 규칙과 보상을 수정할 수 있어요</li>
                </ul>
              </div>
            </div>
          )}

          {!generatedCode && (
            <div className="mb-4 p-3 bg-green-50 rounded-lg">
              <p className="text-xs text-green-800 font-medium mb-1">🎉 연결 완료!</p>
              <ul className="text-xs text-green-700 space-y-1">
                <li>• 파트너와 함께 벌금 시스템을 사용할 수 있어요</li>
                <li>• 규칙 위반시 서로 벌금을 기록해보세요</li>
                <li>• 목표 달성시 보상을 받을 수 있어요</li>
              </ul>
            </div>
          )}

          <button
            onClick={handleContinue}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <ArrowRight className="w-4 h-4" />
            대시보드로 이동
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
          <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-coral-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{user?.display_name}님, 환영해요!</h1>
          <p className="text-gray-600">커플 계정을 설정하고 함께 벌금 관리를 시작해보세요</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => setStep('create')}
            className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors text-left group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-100 group-hover:bg-primary-200 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">새 커플 생성</h3>
                <p className="text-sm text-gray-600">새로 시작하고 파트너를 초대하세요</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 ml-auto" />
            </div>
          </button>

          <button
            onClick={() => setStep('join')}
            className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors text-left group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-coral-100 group-hover:bg-coral-200 rounded-lg flex items-center justify-center">
                <ArrowRight className="w-6 h-6 text-coral-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">기존 커플 참여</h3>
                <p className="text-sm text-gray-600">파트너의 커플 코드를 입력하세요</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 ml-auto" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};