import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase URL 또는 Service Key가 설정되지 않았습니다.');
  console.log('환경변수를 확인해주세요: VITE_SUPABASE_URL, SUPABASE_SERVICE_KEY');
  process.exit(1);
}

// Service role client for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function resetAllData() {
  console.log('🔥 모든 데이터 삭제를 시작합니다...\n');

  try {
    // 1. 벌금 기록 삭제
    console.log('1️⃣ 벌금 기록 삭제 중...');
    const { error: violationsError, count: violationsCount } = await supabase
      .from('violations')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // 모든 행 삭제
    
    if (violationsError) {
      console.error('❌ 벌금 삭제 실패:', violationsError);
    } else {
      console.log(`✅ ${violationsCount || 0}개의 벌금 기록 삭제 완료`);
    }

    // 2. 보상 삭제
    console.log('2️⃣ 보상 삭제 중...');
    const { error: rewardsError, count: rewardsCount } = await supabase
      .from('rewards')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (rewardsError) {
      console.error('❌ 보상 삭제 실패:', rewardsError);
    } else {
      console.log(`✅ ${rewardsCount || 0}개의 보상 삭제 완료`);
    }

    // 3. 규칙 삭제
    console.log('3️⃣ 규칙 삭제 중...');
    const { error: rulesError, count: rulesCount } = await supabase
      .from('rules')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (rulesError) {
      console.error('❌ 규칙 삭제 실패:', rulesError);
    } else {
      console.log(`✅ ${rulesCount || 0}개의 규칙 삭제 완료`);
    }

    // 4. 프로필 업데이트 (커플 연결 정보 제거)
    console.log('4️⃣ 프로필 커플 정보 제거 중...');
    const { error: profilesUpdateError, count: profilesUpdateCount } = await supabase
      .from('profiles')
      .update({ 
        couple_id: null, 
        couple_code: null,
        display_name: null 
      })
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (profilesUpdateError) {
      console.error('❌ 프로필 업데이트 실패:', profilesUpdateError);
    } else {
      console.log(`✅ ${profilesUpdateCount || 0}개의 프로필 업데이트 완료`);
    }

    // 5. 커플 데이터 삭제
    console.log('5️⃣ 커플 데이터 삭제 중...');
    const { error: couplesError, count: couplesCount } = await supabase
      .from('couples')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (couplesError) {
      console.error('❌ 커플 삭제 실패:', couplesError);
    } else {
      console.log(`✅ ${couplesCount || 0}개의 커플 삭제 완료`);
    }

    // 6. Auth 사용자 삭제 (Service Key 필요)
    console.log('6️⃣ 사용자 계정 삭제 중...');
    
    // 먼저 모든 사용자 조회
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ 사용자 목록 조회 실패:', listError);
      console.log('💡 Service Key가 필요합니다. SUPABASE_SERVICE_KEY 환경변수를 설정해주세요.');
    } else if (users && users.users) {
      console.log(`🔍 ${users.users.length}명의 사용자를 찾았습니다.`);
      
      // 각 사용자 삭제
      for (const user of users.users) {
        const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
        if (deleteError) {
          console.error(`❌ 사용자 ${user.email} 삭제 실패:`, deleteError);
        } else {
          console.log(`✅ 사용자 ${user.email} 삭제 완료`);
        }
      }
    }

    // 7. 프로필 테이블 완전 삭제
    console.log('7️⃣ 프로필 데이터 완전 삭제 중...');
    const { error: profilesDeleteError, count: profilesDeleteCount } = await supabase
      .from('profiles')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (profilesDeleteError) {
      console.error('❌ 프로필 삭제 실패:', profilesDeleteError);
    } else {
      console.log(`✅ ${profilesDeleteCount || 0}개의 프로필 삭제 완료`);
    }

    // 8. 최종 확인
    console.log('\n📊 최종 데이터 확인 중...');
    
    const { count: finalViolations } = await supabase.from('violations').select('*', { count: 'exact', head: true });
    const { count: finalRewards } = await supabase.from('rewards').select('*', { count: 'exact', head: true });
    const { count: finalRules } = await supabase.from('rules').select('*', { count: 'exact', head: true });
    const { count: finalCouples } = await supabase.from('couples').select('*', { count: 'exact', head: true });
    const { count: finalProfiles } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    
    console.log('\n✨ 최종 결과:');
    console.log(`- violations: ${finalViolations || 0}개`);
    console.log(`- rewards: ${finalRewards || 0}개`);
    console.log(`- rules: ${finalRules || 0}개`);
    console.log(`- couples: ${finalCouples || 0}개`);
    console.log(`- profiles: ${finalProfiles || 0}개`);
    
    console.log('\n🎉 모든 데이터가 성공적으로 삭제되었습니다!');
    console.log('이제 처음부터 새로 시작할 수 있습니다.');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

// Run the reset
resetAllData();