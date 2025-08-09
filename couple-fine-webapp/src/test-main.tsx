import React from 'react';
import ReactDOM from 'react-dom/client';
import TestApp from './TestApp.tsx';
import './index.css';

// 테스트 모드 표시
console.log('🧪 COUPLE FINE - 테스트 모드 시작');
console.log('📧 이메일 인증 우회 활성화');
console.log('👥 테스트 사용자: ABC@NAVER.COM, DDD@GMAIL.COM');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TestApp />
  </React.StrictMode>,
);