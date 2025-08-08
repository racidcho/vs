import { useState, useEffect } from 'react';

interface AppLockState {
  isLocked: boolean;
  hasPin: boolean;
  attemptCount: number;
  isBlocked: boolean;
  blockEndTime: number | null;
}

const PIN_KEY = 'couple-fine-pin-hash';
const LOCK_STATE_KEY = 'couple-fine-lock-state';
const MAX_ATTEMPTS = 5;
const BLOCK_DURATION = 5 * 60 * 1000; // 5 minutes

// SHA-256 hash function
async function hashPin(pin: string): Promise<string> {
  // Check if crypto.subtle is available (HTTPS or localhost)
  if (!crypto?.subtle) {
    throw new Error('Crypto API not available. Please use HTTPS.');
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(pin + 'couple-fine-salt'); // Add salt
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function useAppLock() {
  const [state, setState] = useState<AppLockState>(() => {
    try {
      const savedState = localStorage.getItem(LOCK_STATE_KEY);
      const hasPin = !!localStorage.getItem(PIN_KEY);

      if (savedState) {
        const parsed = JSON.parse(savedState);
        // Check if block has expired
        if (parsed.isBlocked && parsed.blockEndTime && Date.now() > parsed.blockEndTime) {
          return {
            isLocked: hasPin, // Always lock if PIN exists
            hasPin,
            attemptCount: 0,
            isBlocked: false,
            blockEndTime: null
          };
        }
        return {
          ...parsed,
          hasPin,
          isLocked: hasPin ? true : parsed.isLocked // Force lock if PIN exists
        };
      }

      return {
        isLocked: hasPin, // Lock immediately if PIN exists
        hasPin,
        attemptCount: 0,
        isBlocked: false,
        blockEndTime: null
      };
    } catch (error) {
      // If localStorage is not available or corrupted, return safe defaults
      console.error('Failed to load app lock state:', error);
      return {
        isLocked: false,
        hasPin: false,
        attemptCount: 0,
        isBlocked: false,
        blockEndTime: null
      };
    }
  });

  // Save state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(LOCK_STATE_KEY, JSON.stringify({
        isLocked: state.isLocked,
        attemptCount: state.attemptCount,
        isBlocked: state.isBlocked,
        blockEndTime: state.blockEndTime
      }));
    } catch (error) {
      console.error('Failed to save app lock state:', error);
    }
  }, [state]);

  // Auto-unlock when block expires
  useEffect(() => {
    if (state.isBlocked && state.blockEndTime) {
      const timeUntilUnblock = state.blockEndTime - Date.now();
      if (timeUntilUnblock > 0) {
        const timer = setTimeout(() => {
          setState(prev => ({
            ...prev,
            isBlocked: false,
            blockEndTime: null,
            attemptCount: 0
          }));
        }, timeUntilUnblock);

        return () => clearTimeout(timer);
      }
    }
  }, [state.isBlocked, state.blockEndTime]);

  const setPin = async (pin: string): Promise<{ success: boolean; error?: string }> => {
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return { success: false, error: 'PIN must be exactly 4 digits' };
    }

    try {
      const hash = await hashPin(pin);
      localStorage.setItem(PIN_KEY, hash);

      setState(prev => ({
        ...prev,
        hasPin: true,
        isLocked: false
      }));

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to set PIN' };
    }
  };

  const verifyPin = async (pin: string): Promise<{ success: boolean; error?: string }> => {
    if (state.isBlocked) {
      const remainingTime = state.blockEndTime ? Math.max(0, state.blockEndTime - Date.now()) : 0;
      const minutes = Math.ceil(remainingTime / 60000);
      return {
        success: false,
        error: `Too many failed attempts. Try again in ${minutes} minutes.`
      };
    }

    if (!state.hasPin) {
      return { success: false, error: 'No PIN set' };
    }

    try {
      const hash = await hashPin(pin);
      const storedHash = localStorage.getItem(PIN_KEY);

      if (hash === storedHash) {
        setState(prev => ({
          ...prev,
          isLocked: false,
          attemptCount: 0,
          isBlocked: false,
          blockEndTime: null
        }));
        return { success: true };
      } else {
        const newAttemptCount = state.attemptCount + 1;

        if (newAttemptCount >= MAX_ATTEMPTS) {
          const blockEndTime = Date.now() + BLOCK_DURATION;
          setState(prev => ({
            ...prev,
            attemptCount: newAttemptCount,
            isBlocked: true,
            blockEndTime
          }));
          return {
            success: false,
            error: `Too many failed attempts. App locked for 5 minutes.`
          };
        } else {
          setState(prev => ({
            ...prev,
            attemptCount: newAttemptCount
          }));
          const remaining = MAX_ATTEMPTS - newAttemptCount;
          return {
            success: false,
            error: `Wrong PIN. ${remaining} attempts remaining.`
          };
        }
      }
    } catch (error) {
      return { success: false, error: 'Failed to verify PIN' };
    }
  };

  const removePin = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      localStorage.removeItem(PIN_KEY);
      setState(prev => ({
        ...prev,
        hasPin: false,
        isLocked: false,
        attemptCount: 0,
        isBlocked: false,
        blockEndTime: null
      }));
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to remove PIN' };
    }
  };

  const lock = () => {
    if (state.hasPin) {
      setState(prev => ({ ...prev, isLocked: true }));
    }
  };

  const unlock = () => {
    setState(prev => ({ ...prev, isLocked: false }));
  };

  const getRemainingBlockTime = (): number => {
    if (!state.isBlocked || !state.blockEndTime) return 0;
    return Math.max(0, state.blockEndTime - Date.now());
  };

  // Auto-lock on app start/refresh if PIN is set
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && state.hasPin) {
        // App goes to background - lock it
        setState(prev => ({ ...prev, isLocked: true }));
      }
    };

    const handleFocus = () => {
      if (state.hasPin) {
        // App comes back to focus - lock it
        setState(prev => ({ ...prev, isLocked: true }));
      }
    };

    // Lock on page load if PIN is set
    if (state.hasPin && !state.isLocked && !state.isBlocked) {
      setState(prev => ({ ...prev, isLocked: true }));
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [state.hasPin]);

  return {
    ...state,
    setPin,
    verifyPin,
    removePin,
    lock,
    unlock,
    getRemainingBlockTime,
    remainingAttempts: MAX_ATTEMPTS - state.attemptCount
  };
}