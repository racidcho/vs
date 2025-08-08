import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { Heart, Sparkles, Users, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

export const CoupleComplete: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { state, getPartnerInfo } = useApp();
  const [partner, setPartner] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 축하 페이지 본 기록 저장
  useEffect(() => {
    if (user && state.couple) {
      const celebrationKey = `couple_celebrated_${user.id}_${state.couple.id}`;
      localStorage.setItem(celebrationKey, 'true');
    }
  }, [user, state.couple]);

  useEffect(() => {
    // Enhanced fireworks effect with multiple stages
    const duration = 5 * 1000; // Extended to 5 seconds
    const animationEnd = Date.now() + duration;
    const defaults = { 
      startVelocity: 30, 
      spread: 360, 
      ticks: 120, // More ticks for longer lasting particles
      zIndex: 1000,
      gravity: 0.5,
      drift: 0,
      scalar: 1.2
    };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    // Immediate big burst
    confetti({
      ...defaults,
      particleCount: 100,
      origin: { x: 0.5, y: 0.5 },
      colors: ['#ff69b4', '#ff1493', '#ffc0cb', '#9333ea', '#a855f7', '#c084fc', '#ffd700']
    });

    // Continuous smaller bursts
    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 30 + Math.random() * 40;
      
      // Left side bursts
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.4), y: randomInRange(0.2, 0.8) },
        colors: ['#ff69b4', '#ff1493', '#ffc0cb', '#ffb6c1', '#ffd1dc']
      });
      
      // Right side bursts  
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.6, 0.9), y: randomInRange(0.2, 0.8) },
        colors: ['#9333ea', '#a855f7', '#c084fc', '#e9d5ff', '#f3e8ff']
      });

      // Center bursts with gold/yellow
      if (Math.random() > 0.7) {
        confetti({
          ...defaults,
          particleCount: particleCount * 1.5,
          origin: { x: randomInRange(0.4, 0.6), y: randomInRange(0.3, 0.7) },
          colors: ['#ffd700', '#ffff00', '#ffa500', '#ff6347', '#ff69b4']
        });
      }
    }, 200);

    // Additional confetti burst after 2 seconds
    setTimeout(() => {
      confetti({
        ...defaults,
        particleCount: 50,
        origin: { x: 0.5, y: 0.4 },
        colors: ['#ff69b4', '#ff1493', '#ffc0cb']
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadPartnerInfo = async () => {
      if (state.couple) {
        try {
          const result = await getPartnerInfo();
          if (result && !result.error) {
            setPartner(result.partner);
          }
        } catch (error) {
          // Silent fail
        }
      }
      setIsLoading(false);
    };

    loadPartnerInfo();
  }, [state.couple, getPartnerInfo]);

  const handleContinue = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 via-purple-50 to-indigo-50 relative overflow-hidden">
      {/* 배경 하트 애니메이션 */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.3}s`,
              animationDuration: `${2 + Math.random() * 3}s`
            }}
          >
            {i % 4 === 0 ? (
              <span className="text-4xl animate-bounce" style={{ animationDelay: `${i * 0.1}s` }}>💕</span>
            ) : i % 4 === 1 ? (
              <span className="text-3xl animate-pulse" style={{ animationDelay: `${i * 0.2}s` }}>💖</span>
            ) : i % 4 === 2 ? (
              <span className="text-5xl animate-spin" style={{ animationDuration: '8s', animationDelay: `${i * 0.1}s` }}>✨</span>
            ) : (
              <span className="text-4xl animate-bounce" style={{ animationDelay: `${i * 0.15}s` }}>🎉</span>
            )}
          </div>
        ))}
      </div>

      {/* 반짝이는 별들 */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={`star-${i}`}
            className="absolute animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${1 + Math.random() * 2}s`
            }}
          >
            <span className="text-yellow-300 opacity-60 text-xl">⭐</span>
          </div>
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4">
        <div className="max-w-lg w-full">
          {/* 헤더 섹션 */}
          <div className="text-center mb-8 animate-fadeInUp">
            {/* 메인 하트 아이콘 */}
            <div className="relative mb-6">
              <div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-pink-400 via-rose-400 to-purple-500 rounded-full mb-4 animate-bounce shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse"></div>
                <Heart className="w-16 h-16 text-white relative z-10" fill="currentColor" />
              </div>
              {/* 주변 작은 하트들 */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2">
                <span className="text-2xl animate-bounce" style={{animationDelay: '0.5s'}}>💕</span>
              </div>
              <div className="absolute top-4 right-8">
                <span className="text-xl animate-bounce" style={{animationDelay: '1s'}}>💖</span>
              </div>
              <div className="absolute top-4 left-8">
                <span className="text-xl animate-bounce" style={{animationDelay: '1.5s'}}>💝</span>
              </div>
            </div>

            {/* 제목 */}
            <div className="mb-4">
              <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 mb-3 animate-pulse">
                커플 연결 완료! 🎉
              </h1>
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-2xl animate-spin" style={{animationDuration: '3s'}}>✨</span>
                <p className="text-xl text-gray-700 font-medium">
                  축하해요! 이제 둘만의 특별한 여정이 시작됩니다
                </p>
                <span className="text-2xl animate-spin" style={{animationDuration: '3s', animationDelay: '1.5s'}}>✨</span>
              </div>
              <div className="flex items-center justify-center gap-1">
                <span className="text-xl animate-bounce" style={{animationDelay: '0s'}}>💕</span>
                <span className="text-xl animate-bounce" style={{animationDelay: '0.2s'}}>💖</span>
                <span className="text-xl animate-bounce" style={{animationDelay: '0.4s'}}>💑</span>
                <span className="text-xl animate-bounce" style={{animationDelay: '0.6s'}}>💖</span>
                <span className="text-xl animate-bounce" style={{animationDelay: '0.8s'}}>💕</span>
              </div>
            </div>
          </div>

          {/* 이름 카드 섹션 */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            {/* 내 이름 카드 */}
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-2xl border-2 border-pink-100 transform transition-all hover:scale-105 animate-slideInLeft relative overflow-hidden">
              {/* 배경 패턴 */}
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-pink-200/30 to-transparent rounded-full"></div>
              <div className="absolute bottom-0 left-0 w-12 h-12 bg-gradient-to-tr from-rose-200/30 to-transparent rounded-full"></div>
              
              <div className="text-center relative z-10">
                {/* 아바타 */}
                <div className="relative mb-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-pink-300 via-rose-300 to-pink-400 rounded-full flex items-center justify-center mx-auto shadow-lg relative">
                    <span className="text-3xl animate-bounce" style={{animationDelay: '0.5s'}}>👩</span>
                    {/* 반짝이 효과 */}
                    <div className="absolute -top-1 -right-1 text-yellow-300 animate-ping">✨</div>
                  </div>
                  {/* 하트 장식 */}
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                    <span className="text-lg animate-bounce" style={{animationDelay: '1s'}}>💕</span>
                  </div>
                </div>
                
                <div className="mb-3">
                  <p className="text-xs text-pink-600 font-semibold mb-1 uppercase tracking-wider">My Name</p>
                  <p className="text-2xl font-bold text-gray-800 mb-2">
                    {user?.display_name || '사용자'}
                  </p>
                </div>
                
                {/* 하트 애니메이션 */}
                <div className="flex justify-center gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <span
                      key={i}
                      className="text-pink-400 animate-bounce text-lg"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    >
                      💖
                    </span>
                  ))}
                </div>
                
                <div className="text-xs text-pink-500 font-medium">
                  💕 Sweet Partner 💕
                </div>
              </div>
            </div>

            {/* 파트너 이름 카드 */}
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-2xl border-2 border-purple-100 transform transition-all hover:scale-105 animate-slideInRight relative overflow-hidden">
              {/* 배경 패턴 */}
              <div className="absolute top-0 left-0 w-16 h-16 bg-gradient-to-bl from-purple-200/30 to-transparent rounded-full"></div>
              <div className="absolute bottom-0 right-0 w-12 h-12 bg-gradient-to-tl from-indigo-200/30 to-transparent rounded-full"></div>
              
              <div className="text-center relative z-10">
                {/* 아바타 */}
                <div className="relative mb-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-300 via-indigo-300 to-purple-400 rounded-full flex items-center justify-center mx-auto shadow-lg relative">
                    <span className="text-3xl animate-bounce" style={{animationDelay: '0.7s'}}>👨</span>
                    {/* 반짝이 효과 */}
                    <div className="absolute -top-1 -left-1 text-yellow-300 animate-ping" style={{animationDelay: '1s'}}>✨</div>
                  </div>
                  {/* 하트 장식 */}
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                    <span className="text-lg animate-bounce" style={{animationDelay: '1.2s'}}>💜</span>
                  </div>
                </div>
                
                <div className="mb-3">
                  <p className="text-xs text-purple-600 font-semibold mb-1 uppercase tracking-wider">Partner Name</p>
                  <p className="text-2xl font-bold text-gray-800 mb-2">
                    {partner?.display_name || '파트너'}
                  </p>
                </div>
                
                {/* 하트 애니메이션 */}
                <div className="flex justify-center gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <span
                      key={i}
                      className="text-purple-400 animate-bounce text-lg"
                      style={{ animationDelay: `${i * 0.1 + 0.5}s` }}
                    >
                      💜
                    </span>
                  ))}
                </div>
                
                <div className="text-xs text-purple-500 font-medium">
                  💜 Lovely Partner 💜
                </div>
              </div>
            </div>
          </div>

          {/* 중간 연결 아이콘 */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="bg-gradient-to-r from-pink-400 via-rose-400 to-purple-500 rounded-full p-6 animate-pulse shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-white/20 rounded-full animate-ping"></div>
                <Users className="w-12 h-12 text-white relative z-10" />
              </div>
              {/* 주변 하트들 */}
              <div className="absolute -top-2 -left-2">
                <span className="text-xl animate-bounce" style={{animationDelay: '0.5s'}}>💕</span>
              </div>
              <div className="absolute -top-2 -right-2">
                <span className="text-xl animate-bounce" style={{animationDelay: '1s'}}>💖</span>
              </div>
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                <span className="text-xl animate-bounce" style={{animationDelay: '1.5s'}}>💑</span>
              </div>
            </div>
          </div>

          {/* 축하 메시지 */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 mb-8 text-center animate-fadeIn shadow-2xl border-2 border-gradient-to-r from-pink-100 to-purple-100 relative overflow-hidden">
            {/* 배경 패턴 */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-400 via-rose-400 to-purple-400"></div>
            <div className="absolute top-4 right-4 text-2xl animate-spin" style={{animationDuration: '8s'}}>✨</div>
            <div className="absolute bottom-4 left-4 text-2xl animate-spin" style={{animationDuration: '6s', animationDelay: '2s'}}>🌟</div>
            
            <div className="relative z-10">
              <div className="mb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-300 to-yellow-400 rounded-full mb-3 animate-bounce shadow-lg">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
              </div>
              
              <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600 mb-4">
                🎊 연결 완료! 🎊
              </h3>
              
              <div className="space-y-4 text-gray-700">
                <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl p-4 border border-pink-100">
                  <h4 className="text-lg font-bold text-pink-800 mb-3 flex items-center justify-center gap-2">
                    <span>💰</span> 우리 벌금통이란? <span>💰</span>
                  </h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p className="flex items-center gap-2">
                      <span>📝</span> <strong>규칙 만들기:</strong> 서로 지킬 약속들을 정해요
                    </p>
                    <p className="flex items-center gap-2">
                      <span>⚠️</span> <strong>벌금 기록:</strong> 약속을 어기면 벌금을 받아요
                    </p>
                    <p className="flex items-center gap-2">
                      <span>🎁</span> <strong>보상 받기:</strong> 모인 벌금으로 달콤한 보상을!
                    </p>
                    <p className="flex items-center gap-2">
                      <span>📊</span> <strong>대결 현황:</strong> 누가 더 많이 벌금을 받았는지 확인
                    </p>
                  </div>
                </div>
                <p className="text-lg font-medium text-purple-800">
                  이제 서로의 약속을 지키며<br/>
                  더욱 사랑스러운 추억을 만들어가세요! 💕
                </p>
              </div>
              
              {/* 하트 라인 */}
              <div className="flex items-center justify-center gap-2 mt-4">
                {[...Array(7)].map((_, i) => (
                  <span
                    key={i}
                    className="text-pink-400 animate-bounce"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  >
                    {i % 2 === 0 ? '💕' : '💖'}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* 시작하기 버튼 */}
          <button
            onClick={handleContinue}
            className="w-full bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-6 px-8 rounded-3xl shadow-2xl transform transition-all hover:scale-105 hover:shadow-pink-200/50 flex items-center justify-center gap-4 animate-bounceIn relative overflow-hidden group"
          >
            {/* 버튼 배경 효과 */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <span className="text-2xl animate-pulse">💕</span>
            <span className="text-xl font-bold relative z-10">우리들의 벌금통 시작하기</span>
            <ArrowRight className="w-6 h-6 relative z-10 group-hover:translate-x-1 transition-transform" />
            <span className="text-2xl animate-pulse" style={{animationDelay: '0.5s'}}>💖</span>
          </button>

          {/* 하단 팁 */}
          <div className="mt-8 text-center animate-fadeIn">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur-sm rounded-full border border-pink-100">
              <span className="text-yellow-400">💡</span>
              <span className="text-sm text-gray-600 font-medium">설정에서 언제든지 프로필을 수정할 수 있어요</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(10deg); }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes bounceIn {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            transform: scale(1);
          }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-fadeInUp {
          animation: fadeInUp 0.8s ease-out;
        }
        
        .animate-slideInLeft {
          animation: slideInLeft 0.8s ease-out;
        }
        
        .animate-slideInRight {
          animation: slideInRight 0.8s ease-out;
        }
        
        .animate-fadeIn {
          animation: fadeIn 1s ease-out;
        }
        
        .animate-bounceIn {
          animation: bounceIn 0.8s ease-out;
        }
      `}</style>
    </div>
  );
};