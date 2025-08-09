import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import TestApp from './TestApp.tsx'
import { initSafariCompat } from './utils/safariCompat'

// Initialize Safari compatibility fixes before app starts
initSafariCompat();

// 테스트 모드 활성화 (임시)
const isTestMode = true;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isTestMode ? <TestApp /> : <App />}
  </StrictMode>,
)
