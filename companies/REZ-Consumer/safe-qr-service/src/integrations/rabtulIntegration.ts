/**
 * REZ Safe QR - RABTUL Integration
 * Uses environment variables for service URLs
 */

// Service URLs from environment
const AUTH_URL = process.env.AUTH_SERVICE_URL || 'https://rez-auth-service.onrender.com';
const PAYMENT_URL = process.env.PAYMENT_SERVICE_URL || 'https://rez-payment-service.onrender.com';
const WALLET_URL = process.env.WALLET_SERVICE_URL || 'https://rez-wallet-service.onrender.com';
const NOTIFY_URL = process.env.NOTIFICATIONS_SERVICE_URL || 'https://rez-notifications-service.onrender.com';
const AGENT_URL = process.env.AGENT_SERVICE_URL || 'https://rez-agent-os.onrender.com';
const CARE_URL = process.env.CARE_SERVICE_URL || 'https://rez-care-service.onrender.com';
const MIND_URL = process.env.MIND_SERVICE_URL || 'https://rez-mind.rezapp.com';
const INTELLIGENCE_URL = process.env.INTELLIGENCE_SERVICE_URL || 'https://rez-intelligence.rezapp.com';
const DELIVERY_URL = process.env.DELIVERY_SERVICE_URL || 'https://rez-delivery-service.onrender.com';
const MERCHANT_URL = process.env.MERCHANT_SERVICE_URL || 'https://rez-merchant-service.onrender.com';

const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || '';

async function fetchJson(url: string, options: RequestInit = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Token': INTERNAL_TOKEN,
      ...options.headers,
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.json();
}

export const auth = {
  verifyToken: (token: string) => fetchJson(`${AUTH_URL}/api/auth/verify`, {
    method: 'POST',
    body: JSON.stringify({ token })
  })
};

export const payment = {
  process: (data: unknown) => fetchJson(`${PAYMENT_URL}/api/payments/process`, {
    method: 'POST',
    body: JSON.stringify(data)
  })
};

export const wallet = {
  addCoins: (userId: string, amount: number, source: string) => fetchJson(`${WALLET_URL}/api/coins/add`, {
    method: 'POST',
    body: JSON.stringify({ userId, amount, source })
  })
};

export const notifications = {
  send: (userId: string, type: string, message: string) => fetchJson(`${NOTIFY_URL}/api/send`, {
    method: 'POST',
    body: JSON.stringify({ userId, type, message })
  })
};

export const agent = {
  classify: (text: string) => fetchJson(`${AGENT_URL}/api/classify`, {
    method: 'POST',
    body: JSON.stringify({ text })
  })
};

export const care = {
  createTicket: (data: unknown) => fetchJson(`${CARE_URL}/api/auto-tickets`, {
    method: 'POST',
    body: JSON.stringify(data)
  })
};

export const mind = {
  analyze: (data: unknown) => fetchJson(`${MIND_URL}/api/analyze`, {
    method: 'POST',
    body: JSON.stringify(data)
  })
};

export const intelligence = {
  predict: (userId: string, features: unknown) => fetchJson(`${INTELLIGENCE_URL}/api/predict/${userId}`, {
    method: 'POST',
    body: JSON.stringify({ features })
  })
};

export const delivery = {
  track: (orderId: string) => fetchJson(`${DELIVERY_URL}/api/track/${orderId}`, {
    method: 'GET'
  })
};

export const merchant = {
  getProfile: (merchantId: string) => fetchJson(`${MERCHANT_URL}/api/profile/${merchantId}`, {
    method: 'GET'
  })
};

export default { auth, payment, wallet, notifications, agent, care, mind, intelligence, delivery, merchant };
