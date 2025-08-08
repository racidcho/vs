import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, Shield, AlertTriangle } from 'lucide-react';
import { useAppLock } from '../../hooks/useAppLock';
import toast from 'react-hot-toast';

interface PinLockScreenProps {
  onUnlock: () => void;
}

export const PinLockScreen: React.FC<PinLockScreenProps> = ({ onUnlock }) => {
  const { verifyPin, isBlocked, getRemainingBlockTime, remainingAttempts } = useAppLock();
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [blockTimeLeft, setBlockTimeLeft] = useState(0);

  // Update block time countdown
  useEffect(() => {
    if (isBlocked) {
      const updateBlockTime = () => {
        const remaining = getRemainingBlockTime();
        setBlockTimeLeft(remaining);

        if (remaining <= 0) {
          // Block has expired, allow trying again
          setPin('');
        }
      };

      updateBlockTime();
      const interval = setInterval(updateBlockTime, 1000);
      return () => clearInterval(interval);
    }
  }, [isBlocked]); // Removed getRemainingBlockTime from dependencies to prevent unnecessary re-renders

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (pin.length !== 4) {
      toast.error('4자리 PIN을 입력해주세요');
      return;
    }

    if (isBlocked) {
      const minutes = Math.ceil(blockTimeLeft / 60000);
      toast.error(`${minutes}분 후에 다시 시도해주세요`);
      return;
    }

    setIsVerifying(true);
    try {
      const result = await verifyPin(pin);

      if (result.success) {
        toast.success('잠금 해제되었어요! 🔓');
        // Call the onUnlock callback to notify parent
        onUnlock();
      } else {
        toast.error(result.error || 'PIN이 올바르지 않아요');
        setPin('');
      }
    } catch (error) {
      toast.error('PIN 확인 중 오류가 발생했어요');
      setPin('');
    } finally {
      setIsVerifying(false);
    }
  };

  const handlePinChange = (value: string) => {
    // Only allow numeric input
    const numericValue = value.replace(/\D/g, '').slice(0, 4);
    setPin(numericValue);
  };

  const formatBlockTime = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-purple-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">앱이 잠겨있어요</h1>
            <p className="text-gray-600">PIN을 입력하여 잠금을 해제하세요</p>
          </div>

          {/* Warning for blocked state */}
          {isBlocked && blockTimeLeft > 0 && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">
                  너무 많은 시도로 인해 잠시 차단되었어요
                </p>
                <p className="text-sm text-red-600">
                  {formatBlockTime(blockTimeLeft)} 후에 다시 시도해주세요
                </p>
              </div>
            </div>
          )}

          {/* PIN Input Form */}
          <form onSubmit={handlePinSubmit} className="space-y-6">
            <div>
              <label htmlFor="pin" className="sr-only">PIN</label>
              <div className="relative">
                <input
                  id="pin"
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  value={pin}
                  onChange={(e) => handlePinChange(e.target.value)}
                  placeholder="PIN 4자리"
                  className="w-full px-4 py-4 text-center text-2xl font-mono tracking-widest border-2 border-gray-200 rounded-xl focus:border-pink-400 focus:outline-none transition-colors"
                  maxLength={4}
                  disabled={isBlocked || isVerifying}
                  autoComplete="off"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPin ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* PIN dots indicator */}
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    pin.length >= i ? 'bg-pink-400' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={pin.length !== 4 || isBlocked || isVerifying}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-4 px-6 rounded-xl hover:from-pink-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isVerifying ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  확인 중...
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  잠금 해제
                </>
              )}
            </button>
          </form>

          {/* Attempts remaining */}
          {!isBlocked && remainingAttempts < 5 && (
            <div className="mt-4 text-center">
              <p className="text-sm text-orange-600">
                ⚠️ 남은 시도 횟수: {remainingAttempts}회
              </p>
            </div>
          )}

          {/* Security info */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 text-blue-800">
              <Shield className="w-4 h-4" />
              <span className="text-sm font-medium">보안 정보</span>
            </div>
            <ul className="text-xs text-blue-700 mt-2 space-y-1">
              <li>• PIN은 안전하게 암호화되어 저장됩니다</li>
              <li>• 5회 틀리면 5분간 차단됩니다</li>
              <li>• 설정에서 PIN을 변경할 수 있습니다</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};