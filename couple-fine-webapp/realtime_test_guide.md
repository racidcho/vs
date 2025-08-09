# 🔄 실시간 동기화 테스트 가이드

## 📝 적용해야 할 작업들

### 1. Supabase 마이그레이션 적용
```bash
# 터미널에서 실행
cd couple-fine-webapp

# 마이그레이션 적용
npx supabase db push

# 또는 Supabase Dashboard에서 SQL Editor로 직접 실행:
# 1. 20250808_ultra_simple_rls_fix.sql 내용 복사
# 2. 20250808_enable_realtime.sql 내용 복사
# 3. SQL Editor에서 실행
```

### 2. Supabase Dashboard에서 Realtime 활성화
1. [Supabase Dashboard](https://app.supabase.com) 접속
2. 프로젝트 선택
3. **Database** → **Replication** 메뉴로 이동
4. 다음 테이블들의 **Realtime** 토글 켜기:
   - ✅ profiles
   - ✅ couples  
   - ✅ rules
   - ✅ violations
   - ✅ rewards
   - ✅ activity_logs
5. 각 테이블에서 **Source** 옆의 **0 tables** 클릭
6. **Enable All** 또는 각각 INSERT, UPDATE, DELETE 체크

## 🧪 테스트 시나리오

### 테스트 준비
1. **두 개의 브라우저** 준비 (Chrome + Chrome Incognito 또는 Chrome + Safari)
2. 각 브라우저에서 다른 계정으로 로그인
3. 개발자 도구(F12) 열어서 Console 탭 확인

### 테스트 1: 커플 연결 테스트
**브라우저 A (첫 번째 사용자)**
1. 로그인 → 커플 설정 페이지
2. "새로운 커플 만들기" 클릭
3. 생성된 6자리 코드 복사

**브라우저 B (두 번째 사용자)**
1. 로그인 → 커플 설정 페이지
2. 커플 코드 입력
3. "커플 코드로 연결하기" 클릭

**확인 사항**
- ✅ 양쪽 모두 축하 페이지 표시
- ✅ 홈 화면에서 파트너 이름 표시
- ✅ Console에 `APPCONTEXT REALTIME` 로그 확인

### 테스트 2: 규칙 생성 실시간 동기화
**브라우저 A**
1. Rules 페이지로 이동
2. 새 규칙 추가 (예: "지각 금지")

**브라우저 B**
1. Rules 페이지 열어두기
2. **새로고침 없이** 자동으로 새 규칙 나타나는지 확인

**확인 사항**
- ✅ 5초 이내에 규칙 자동 표시
- ✅ Console: `🔄 APPCONTEXT REALTIME [RULES]: INSERT` 로그

### 테스트 3: 벌금 기록 실시간 동기화
**브라우저 A**
1. "벌금 기록하기" 페이지
2. 벌금 추가 (파트너 선택, 금액 입력)
3. 저장

**브라우저 B**
1. Dashboard 페이지 열어두기
2. **새로고침 없이** 벌금 기록 나타나는지 확인

**확인 사항**
- ✅ 최근 활동에 즉시 표시
- ✅ 총 벌금 금액 자동 업데이트
- ✅ Console: `🔄 APPCONTEXT REALTIME [VIOLATIONS]` 로그

### 테스트 4: 파트너 이름 변경 실시간 동기화
**브라우저 A**
1. Settings 페이지
2. "내 이름" 편집 → 새 이름 입력 → 저장

**브라우저 B**
1. Settings 페이지 열어두기
2. **새로고침 없이** 파트너 이름 변경되는지 확인

**확인 사항**
- ✅ 파트너 이름 자동 업데이트
- ✅ Console: `🔄 APPCONTEXT REALTIME [PROFILES]: UPDATE` 로그
- ✅ Console: `👤 APPCONTEXT REALTIME: Partner profile updated` 로그

## 🔍 디버깅 명령어

브라우저 콘솔에서 실행:

```javascript
// 현재 Realtime 채널 확인
console.log('Active channels:', window.supabase.realtime.channels);

// 현재 커플 정보 확인
const { data: couple } = await window.supabase
  .from('couples')
  .select('*, partner_1:profiles!couples_partner_1_id_fkey(*), partner_2:profiles!couples_partner_2_id_fkey(*)')
  .single();
console.log('Couple data:', couple);

// RLS 정책 테스트
const { data: profiles } = await window.supabase.from('profiles').select('*');
console.log('Can access profiles:', profiles?.length > 0);

const { data: rules } = await window.supabase.from('rules').select('*');
console.log('Can access rules:', rules?.length >= 0);

// 규칙 생성 테스트
const { data: newRule, error } = await window.supabase
  .from('rules')
  .insert({
    couple_id: couple.id,
    title: 'Test Rule ' + Date.now(),
    fine_amount: 1000,
    created_by_user_id: (await window.supabase.auth.getUser()).data.user.id,
    is_active: true
  })
  .select()
  .single();
console.log('Rule creation:', error ? '❌ Failed' : '✅ Success', error || newRule);
```

## ⚠️ 문제 해결

### "Row level security is enabled" 오류
```sql
-- Supabase SQL Editor에서 실행
SELECT * FROM pg_policies WHERE schemaname = 'public';
-- 정책이 없으면 20250808_ultra_simple_rls_fix.sql 다시 실행
```

### Realtime이 작동하지 않음
1. Supabase Dashboard → Database → Replication 확인
2. 모든 테이블의 Realtime 토글이 켜져 있는지 확인
3. 브라우저 콘솔에서 `window.supabase.realtime.channels` 확인
4. 네트워크 탭에서 WebSocket 연결 확인

### 파트너 이름이 안 보임
```javascript
// 브라우저 콘솔에서
const { data: profiles } = await window.supabase
  .from('profiles')
  .select('*');
console.log('Profiles access:', profiles);
// 빈 배열이면 RLS 정책 문제
```

### CRUD 작업 실패
```javascript
// debug_backend_issues.js 스크립트 실행
runDebugScript()
// 또는
testRLS()
```

## ✅ 성공 기준

1. **파트너 연결**: 양쪽 모두 "연결됨" 상태
2. **CRUD 작업**: 양쪽 모두 생성/수정/삭제 가능
3. **실시간 동기화**: 5초 이내 자동 업데이트
4. **파트너 이름**: Settings에서 정상 표시
5. **홈 화면**: 커플 정보 완전 표시

## 📌 중요 사항

- **캐시 비우기**: 문제 발생 시 Ctrl+Shift+R (강력 새로고침)
- **로그 확인**: Console 탭에서 REALTIME 관련 로그 확인
- **네트워크 확인**: Network 탭에서 WebSocket 연결 상태 확인
- **두 브라우저 사용**: 같은 브라우저의 다른 탭은 세션 공유로 테스트 부정확

---

*테스트 완료 후 모든 항목이 정상 작동하면 실시간 동기화 구현 완료!* 🎉