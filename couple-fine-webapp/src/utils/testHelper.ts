// Test Helper for Development Mode
// This allows testing without OTP authentication in development mode

export const isTestMode = () => {
  if (typeof window === 'undefined') {
    return false;
  }
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('test') === 'true';
};

export const getTestUser = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get('user');
  
  if (!isTestMode() || !userId) return null;
  
  // Test accounts configuration
  const TEST_ACCOUNTS = {
    '1': {
      id: 'd35ee66f-edef-440d-ace1-acf089a34381',
      email: 'test1@joanddo.com',
      display_name: '테스트1',
      couple_id: '96e3ffc4-fc47-418c-81c5-2a020701a95b'
    },
    '2': {
      id: '10969e2b-35e8-40c7-9a38-598159ff47e8',
      email: 'test2@joanddo.com',
      display_name: '테스트2',
      couple_id: '96e3ffc4-fc47-418c-81c5-2a020701a95b'
    }
  };
  
  return TEST_ACCOUNTS[userId as '1' | '2'] || null;
};

export const showTestModeIndicator = () => {
  if (!isTestMode() || typeof document === 'undefined') return;
  
  // Create test mode indicator
  const indicator = document.createElement('div');
  indicator.id = 'test-mode-indicator';
  indicator.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: #ff6b6b;
    color: white;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: bold;
    z-index: 9999;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  `;
  
  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get('user');
  indicator.textContent = `🧪 TEST MODE - User ${userId}`;
  
  document.body.appendChild(indicator);
};

// Quick login function for test mode
export const quickTestLogin = async (supabase: any, userId: string) => {
  if (!isTestMode()) {
    console.error('Quick login only available in test mode');
    return null;
  }

  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    console.error('Quick login requires a browser environment');
    return null;
  }
  
  const testUser = getTestUser();
  if (!testUser) {
    console.error('Invalid test user');
    return null;
  }
  
  // Create a mock session for testing
  const mockSession = {
    access_token: 'test-token-' + userId,
    refresh_token: 'test-refresh-' + userId,
    expires_in: 3600,
    expires_at: Date.now() + 3600000,
    user: {
      id: testUser.id,
      email: testUser.email,
      app_metadata: {},
      user_metadata: { display_name: testUser.display_name },
      aud: 'authenticated',
      created_at: new Date().toISOString()
    }
  };
  
  // Store in localStorage to simulate login
  localStorage.setItem('sb-auth-token', JSON.stringify({
    currentSession: mockSession,
    expiresAt: mockSession.expires_at
  }));
  
  return mockSession;
};