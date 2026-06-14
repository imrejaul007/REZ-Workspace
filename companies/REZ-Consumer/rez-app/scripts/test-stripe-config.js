import logger from './utils/logger';

/**
 * Stripe Configuration Test Script
 * Run this to verify your Stripe setup is correct
 */

const FRONTEND_KEY = 'pk_test_51PQsD1A3bD41AFFrCYnvxrNlg2dlljlcLaEyI9OajniOFvCSXjbhCkUcPqxDw4atsYQBsP042AmCZf37Uhq1wxZq00HE39FdK5';

logger.info('\n=================================');
logger.info('STRIPE CONFIGURATION CHECK');
logger.info('=================================\n');

// 1. Check frontend key format
logger.info('1. Frontend Stripe Key Check:');
console.log('   Key:', FRONTEND_KEY.substring(0, 32) + '...');

if (FRONTEND_KEY.startsWith('pk_test_')) {
  logger.info('   ✅ Using TEST mode key (correct for development)');
} else if (FRONTEND_KEY.startsWith('pk_live_')) {
  logger.info('   ⚠️  Using LIVE mode key (should be test for development)');
} else {
  logger.info('   ❌ Invalid key format');
}

// 2. Extract account ID from key
const keyParts = FRONTEND_KEY.split('_');
if (keyParts.length >= 3) {
  const accountIndicator = keyParts[2].substring(0, 10);
  console.log('   Account ID indicator:', accountIndicator);
}

logger.info('\n2. Backend Configuration:');
logger.info('   ⚠️  IMPORTANT: The backend MUST use the matching SECRET key from the SAME Stripe account');
logger.info('   The backend secret key should start with: sk_test_ (for test mode)');
logger.info('   Both keys must be from the SAME Stripe account\n');

logger.info('3. Common Issues:');
logger.info('   ❌ 401 Error Causes:');
logger.info('      - Backend using different Stripe account than frontend');
logger.info('      - Backend using live key while frontend uses test key (or vice versa)');
logger.info('      - Payment intent created with different key than confirmation');
logger.info('      - Expired payment intent (older than 24 hours)');

logger.info('\n4. How to Fix:');
logger.info('   1. Log into your Stripe Dashboard: https://dashboard.stripe.com');
console.log('   2. Ensure you\'re in TEST mode (toggle in top-right)');
logger.info('   3. Go to Developers → API Keys');
logger.info('   4. Copy BOTH keys from the SAME account:');
logger.info('      - Publishable key (pk_test_...) → Frontend .env');
logger.info('      - Secret key (sk_test_...) → Backend .env');
logger.info('   5. Restart both frontend and backend servers');

logger.info('\n5. Verify Backend:');
logger.info('   Check your backend .env file for:');
logger.info('   STRIPE_SECRET_KEY=sk_test_... (should match the account of the publishable key)');

logger.info('\n6. Test Payment Intent:');
logger.info('   To test if keys match, try creating a payment intent via backend');
logger.info('   and check Stripe Dashboard → Payments to see if it appears');

logger.info('\n=================================\n');

// Test API connection
logger.info('Testing backend connection...');
fetch('http://localhost:5001/api/wallet/paybill/test-stripe', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  }
})
  .then(res => res.json())
  .then(data => {
    console.log('✅ Backend response:', data);
  })
  .catch(err => {
    console.log('❌ Backend not responding or endpoint doesn\'t exist');
    console.log('   This is normal if the test endpoint hasn\'t been created');
  });