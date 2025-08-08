// 브라우저 콘솔에서 실행하여 로컬 데이터 정리
// F12 > Console 탭에서 실행

// 모든 localStorage 데이터 삭제
localStorage.clear();

// 또는 특정 키만 삭제
const keysToDelete = [
  'supabase.auth.token',
  'appLocked',
  'appPin',
  'lastActiveTime'
];

// couple_celebrated로 시작하는 모든 키 찾아서 삭제
Object.keys(localStorage).forEach(key => {
  if (key.startsWith('couple_celebrated_')) {
    localStorage.removeItem(key);
    console.log(`Deleted: ${key}`);
  }
});

// 특정 키들 삭제
keysToDelete.forEach(key => {
  if (localStorage.getItem(key)) {
    localStorage.removeItem(key);
    console.log(`Deleted: ${key}`);
  }
});

console.log('✅ 로컬 데이터가 정리되었습니다');
console.log('남은 localStorage 키:', Object.keys(localStorage));