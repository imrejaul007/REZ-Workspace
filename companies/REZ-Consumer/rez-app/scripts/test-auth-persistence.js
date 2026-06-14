import logger from './utils/logger';

#!/usr/bin/env node

/**
 * Test Script for Authentication Persistence
 * Tests if auth state survives app refreshes
 */

// This would be run in browser console to test auth persistence
const testAuthPersistence = `
// Test Authentication Persistence in Browser Console
logger.info('🧪 Testing Authentication Persistence');
logger.info('=====================================');

// Check if AsyncStorage has auth data
const checkStoredAuth = async () => {
  try {
    // Get stored auth data (web uses localStorage, mobile uses AsyncStorage)
    const getStorageData = () => {
      if (typeof window !== 'undefined' && window.localStorage) {
        // Web environment
        return {
          accessToken: localStorage.getItem('access_token'),
          refreshToken: localStorage.getItem('refresh_token'),
          user: localStorage.getItem('auth_user')
        };
      } else if (global.AsyncStorage) {
        // Mobile environment
        return global.AsyncStorage.multiGet([
          'access_token',
          'refresh_token', 
          'auth_user'
        ]);
      }
      return null;
    };

    const storedData = getStorageData();
    console.log('📦 Stored Auth Data:', {
      hasAccessToken: !!storedData?.accessToken,
      hasRefreshToken: !!storedData?.refreshToken,
      hasUser: !!storedData?.user,
      userData: storedData?.user ? JSON.parse(storedData.user) : null
    });

    // Check current auth context state
    logger.info('🔍 Current Auth State: Check your app context');
    
    return storedData;
  } catch (error) {
    console.error('❌ Error checking stored auth:', error);
    return null;
  }
};

// Run the test
checkStoredAuth();

logger.info('');
logger.info('📋 Manual Testing Steps:');
logger.info('1. Login with valid OTP');
logger.info('2. Complete onboarding');
logger.info('3. Reach home screen');
logger.info('4. Refresh page (Ctrl+R or F5)');
logger.info('5. Should stay on home screen, NOT redirect to splash');
logger.info('');
logger.info('✅ Expected: User stays authenticated');
logger.info('❌ Bug: User gets logged out and redirected to splash');
`;

console.log(testAuthPersistence);

logger.info('\n🧪 Authentication Persistence Test');
logger.info('=====================================');
logger.info('\n📋 To test auth persistence:');
logger.info('1. Copy the above code');
logger.info('2. Open browser dev tools (F12)'); 
logger.info('3. Go to Console tab');
logger.info('4. Paste and run the code');
logger.info('5. Follow the manual testing steps');
logger.info('\n✅ Expected Result: User should stay logged in after refresh');
logger.info('❌ Bug: User gets redirected to splash/onboarding screens');

// Also create a simple auth test for developers
logger.info('\n🛠️  Quick Auth State Check:');
logger.info('==========================================');
logger.info('In browser console, run: localStorage.getItem("auth_user")');
logger.info('Should return: User object JSON if logged in, null if not');