/**
 * RABTUL Integration for CorpPerks/RestoPapa
 *
 * Uses RABTUL as the central authentication and payment provider.
 */

// Configuration
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'https://rez-auth-service.onrender.com';
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'https://rez-payment-service.onrender.com';
const WALLET_SERVICE_URL = process.env.WALLET_SERVICE_URL || 'https://rez-wallet-service-36vo.onrender.com';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || '';

/**
 * Verify JWT token via RABTUL Auth Service
 */
async function verifyToken(token) {
  try {
    const res = await fetch(`${AUTH_SERVICE_URL}/api/auth/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Internal-Token': INTERNAL_TOKEN,
      },
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    if (data.success && data.user) {
      return {
        id: data.user.id,
        phone: data.user.phone,
        email: data.user.email,
        role: data.user.role || 'user',
        companyId: data.user.companyId,
      };
    }

    return null;
  } catch (error) {
    console.error('[Auth] RABTUL verify failed:', error);
    return null;
  }
}

/**
 * Send OTP via RABTUL
 */
async function sendOTP(phone) {
  try {
    const res = await fetch(`${AUTH_SERVICE_URL}/api/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    return { success: res.ok, ...(await res.json()) };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Verify OTP via RABTUL
 */
async function verifyOTP(phone, otp) {
  try {
    const res = await fetch(`${AUTH_SERVICE_URL}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp }),
    });
    const data = await res.json();
    return { success: res.ok, ...data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Create payment via RABTUL Payment Service
 */
async function createPayment(params) {
  try {
    const res = await fetch(`${PAYMENT_SERVICE_URL}/api/payments/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': INTERNAL_TOKEN,
      },
      body: JSON.stringify({
        userId: params.userId,
        amount: params.amount,
        currency: params.currency || 'INR',
        description: params.description || 'RestoPapa Order',
        metadata: {
          source: 'corpperks',
          ...params.metadata,
        },
      }),
    });
    const data = await res.json();
    return { success: res.ok, ...data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Verify payment via RABTUL
 */
async function verifyPayment(paymentId) {
  try {
    const res = await fetch(`${PAYMENT_SERVICE_URL}/api/payments/${paymentId}`, {
      headers: { 'X-Internal-Token': INTERNAL_TOKEN },
    });
    const data = await res.json();
    return { success: res.ok, payment: data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Get wallet balance via RABTUL
 */
async function getWalletBalance(userId) {
  try {
    const res = await fetch(`${WALLET_SERVICE_URL}/api/wallet/${userId}/balance`, {
      headers: { 'X-Internal-Token': INTERNAL_TOKEN },
    });
    const data = await res.json();
    return { success: res.ok, balance: data.balance || 0 };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Add to wallet via RABTUL
 */
async function addToWallet(userId, amount, reason) {
  try {
    const res = await fetch(`${WALLET_SERVICE_URL}/api/wallet/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': INTERNAL_TOKEN,
      },
      body: JSON.stringify({ userId, amount, reason }),
    });
    const data = await res.json();
    return { success: res.ok, ...data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Deduct from wallet via RABTUL
 */
async function deductFromWallet(userId, amount, reason) {
  try {
    const res = await fetch(`${WALLET_SERVICE_URL}/api/wallet/deduct`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': INTERNAL_TOKEN,
      },
      body: JSON.stringify({ userId, amount, reason }),
    });
    const data = await res.json();
    return { success: res.ok, ...data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = {
  verifyToken,
  sendOTP,
  verifyOTP,
  createPayment,
  verifyPayment,
  getWalletBalance,
  addToWallet,
  deductFromWallet,
  config: {
    AUTH_SERVICE_URL,
    PAYMENT_SERVICE_URL,
    WALLET_SERVICE_URL,
  },
};
