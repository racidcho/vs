import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { Trophy, TrendingUp, Heart, Users } from 'lucide-react';

interface PartnerStats {
  id: string;
  name: string;
  totalFines: number;
  violationCount: number;
  avatar?: string | null;
}

export const VersusWidget: React.FC = () => {
  const { state } = useApp();
  const { user } = useAuth();
  const [partner1Stats, setPartner1Stats] = useState<PartnerStats | null>(null);
  const [partner2Stats, setPartner2Stats] = useState<PartnerStats | null>(null);

  useEffect(() => {
    if (!state.couple || !user) return;

    // Get partner info from couple data
    const couple = state.couple as any;
    const currentUserId = user.id;
    
    // Determine partners
    const partner1Id = couple.partner_1?.id || couple.partner_1_id;
    const partner2Id = couple.partner_2?.id || couple.partner_2_id;
    
    if (!partner1Id || !partner2Id) return;

    // Calculate stats for each partner
    const calculateStats = (partnerId: string): PartnerStats => {
      const allViolations = state.violations || [];
      console.log('🔍 VERSUS: Calculating for partner', partnerId, 'from', allViolations.length, 'violations');
      const violations = allViolations.filter(v => v.violator_user_id === partnerId);
      console.log('📊 VERSUS: Found', violations.length, 'violations for', partnerId);
      const totalFines = violations.reduce((sum, v) => sum + Math.abs(v.amount), 0);
      console.log('💰 VERSUS: Total fines for', partnerId, ':', totalFines);
      
      // Get partner name
      let partnerName = '';
      let partnerAvatar = null;
      
      if (partnerId === partner1Id && couple.partner_1) {
        partnerName = couple.partner_1.display_name || couple.partner_1.email?.split('@')[0] || '파트너1';
        partnerAvatar = couple.partner_1.avatar_url;
      } else if (partnerId === partner2Id && couple.partner_2) {
        partnerName = couple.partner_2.display_name || couple.partner_2.email?.split('@')[0] || '파트너2';
        partnerAvatar = couple.partner_2.avatar_url;
      } else if (partnerId === currentUserId) {
        partnerName = user.display_name || user.email?.split('@')[0] || '나';
        partnerAvatar = user.avatar_url;
      }

      return {
        id: partnerId,
        name: partnerName,
        totalFines,
        violationCount: violations.length,
        avatar: partnerAvatar
      };
    };

    if (partner1Id) {
      const stats1 = calculateStats(partner1Id);
      setPartner1Stats(stats1);
    }
    
    if (partner2Id) {
      const stats2 = calculateStats(partner2Id);
      setPartner2Stats(stats2);
    }
  }, [state.couple, state.violations, user]);

  // Don't render if we don't have both partners
  if (!partner1Stats || !partner2Stats) {
    return null;
  }

  const total = partner1Stats.totalFines + partner2Stats.totalFines;
  const partner1Percentage = total > 0 ? (partner1Stats.totalFines / total) * 100 : 50;
  const partner2Percentage = total > 0 ? (partner2Stats.totalFines / total) * 100 : 50;

  // Determine who has more fines
  const leader = partner1Stats.totalFines > partner2Stats.totalFines ? partner1Stats : 
                 partner2Stats.totalFines > partner1Stats.totalFines ? partner2Stats : null;
  const follower = leader === partner1Stats ? partner2Stats : 
                   leader === partner2Stats ? partner1Stats : null;

  const getMessage = () => {
    if (!leader || partner1Stats.totalFines === partner2Stats.totalFines) {
      return "둘 다 똑같이 착해요! 완벽한 균형 💕";
    }
    
    const difference = leader.totalFines - (follower?.totalFines || 0);
    const diffPercent = total > 0 ? (difference / total) * 100 : 0;
    
    if (diffPercent < 20) {
      return `${follower?.name}님이 조금 더 착해요! 💙`;
    } else if (diffPercent < 50) {
      return `${follower?.name}님이 더 착해요! 대단해요 💚`;
    } else {
      return `${follower?.name}님이 압도적으로 착해요! 👑`;
    }
  };

  const getLeaderIcon = () => {
    if (!leader) return "👫";
    return leader.id === partner1Stats.id ? "👩" : "👨";
  };

  const getFollowerIcon = () => {
    if (!follower) return "👫";
    return follower.id === partner1Stats.id ? "👩" : "👨";
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-pink-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <Users className="w-5 h-5 text-purple-500" />
          우리의 대결
        </h3>
        <Trophy className="w-5 h-5 text-yellow-500 animate-pulse" />
      </div>

      {/* VS Display */}
      <div className="space-y-4">
        {/* Partner Stats Row */}
        <div className="flex items-center justify-between">
          {/* Partner 1 */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-rose-400 rounded-full flex items-center justify-center shadow-md">
              <span className="text-xl">{getLeaderIcon()}</span>
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">{partner1Stats.name}</p>
              <p className="text-xs text-gray-500">{partner1Stats.violationCount}번 기록</p>
            </div>
          </div>

          {/* VS */}
          <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full">
            <span className="text-sm font-bold text-purple-600">VS</span>
          </div>

          {/* Partner 2 */}
          <div className="flex items-center gap-3">
            <div>
              <p className="font-bold text-gray-900 text-sm text-right">{partner2Stats.name}</p>
              <p className="text-xs text-gray-500 text-right">{partner2Stats.violationCount}번 기록</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full flex items-center justify-center shadow-md">
              <span className="text-xl">{getFollowerIcon()}</span>
            </div>
          </div>
        </div>

        {/* Amount Display */}
        <div className="flex items-center justify-between">
          <div className="text-center">
            <p className="text-2xl font-bold text-pink-600">
              {Math.floor(partner1Stats.totalFines / 10000)}
              <span className="text-sm font-normal text-gray-600 ml-1">만원</span>
            </p>
          </div>
          
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {Math.floor(partner2Stats.totalFines / 10000)}
              <span className="text-sm font-normal text-gray-600 ml-1">만원</span>
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex h-3 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-pink-400 to-rose-400 transition-all duration-700"
              style={{ width: `${partner1Percentage}%` }}
            />
            <div 
              className="bg-gradient-to-r from-blue-400 to-cyan-400 transition-all duration-700"
              style={{ width: `${partner2Percentage}%` }}
            />
          </div>
          
          {/* Encouraging Message */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-3">
            <div className="flex items-center justify-center gap-2">
              <Heart className="w-4 h-4 text-purple-500" />
              <p className="text-sm font-medium text-purple-700 text-center">{getMessage()}</p>
            </div>
            <p className="text-xs text-purple-600 text-center mt-1">
              "작은 약속도 소중히, 사랑은 더욱 단단해져요!"
            </p>
          </div>
        </div>

        {/* Total Stats */}
        <div className="flex items-center justify-center gap-4 pt-2 border-t border-gray-100">
          <div className="text-center">
            <div className="flex items-center gap-1 justify-center mb-1">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-xs font-medium text-gray-600">총 벌금</span>
            </div>
            <p className="text-lg font-bold text-green-600">
              {Math.floor(total / 10000)}만원
            </p>
          </div>
          <div className="w-px h-8 bg-gray-200"></div>
          <div className="text-center">
            <div className="flex items-center gap-1 justify-center mb-1">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <span className="text-xs font-medium text-gray-600">총 기록</span>
            </div>
            <p className="text-lg font-bold text-yellow-600">
              {partner1Stats.violationCount + partner2Stats.violationCount}번
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};