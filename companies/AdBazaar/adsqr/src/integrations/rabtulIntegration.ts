/**
 * REZ Ads QR - RABTUL Integration
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

// Service clients (simple fetch-based)
export const auth = {
  verifyToken: (token: string) => fetch(`${AUTH_URL}/api/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN || '' },
    body: JSON.stringify({ token })
  }).then(r => r.json())
};

export const payment = {
  process: (data: unknown) => fetch(`${PAYMENT_URL}/api/payments/process`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN || '' },
    body: JSON.stringify(data)
  }).then(r => r.json())
};

export const wallet = {
  addCoins: (userId: string, amount: number, source: string) => fetch(`${WALLET_URL}/api/coins/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN || '' },
    body: JSON.stringify({ userId, amount, source })
  }).then(r => r.json())
};

export const notifications = {
  send: (userId: string, type: string, message: string) => fetch(`${NOTIFY_URL}/api/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, type, message })
  }).then(r => r.json())
};

export const agent = {
  classify: (text: string) => fetch(`${AGENT_URL}/api/classify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  }).then(r => r.json())
};

export const care = {
  createTicket: (data: unknown) => fetch(`${CARE_URL}/api/auto-tickets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json())
};

export const mind = {
  analyze: (data: unknown) => fetch(`${MIND_URL}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json())
};

export const intelligence = {
  predict: (userId: string, features: unknown) => fetch(`${INTELLIGENCE_URL}/api/predict/${userId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ features })
  }).then(r => r.json())
};

export const delivery = {
  track: (orderId: string) => fetch(`${DELIVERY_URL}/api/track/${orderId}`, {
    method: 'GET',
    headers: { 'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN || '' }
  }).then(r => r.json())
};

export const merchant = {
  getProfile: (merchantId: string) => fetch(`${MERCHANT_URL}/api/profile/${merchantId}`, {
    method: 'GET',
    headers: { 'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN || '' }
  }).then(r => r.json())
};

export default { auth, payment, wallet, notifications, agent, care, mind, intelligence, delivery, merchant };
