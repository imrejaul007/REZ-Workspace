const SUPPORT_URL = process.env.REZ_SUPPORT_COPILOT_URL || 'https://REZ-support-copilot.onrender.com';

export interface ChatMessage {
  text: string;
  userId: string;
  merchantId?: string;
}

export async function chatWithAI(message: ChatMessage) {
  const response = await fetch(`${SUPPORT_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: message.text,
      userId: message.userId,
      merchantId: message.merchantId,
      source: 'rez-consumer-app',
    }),
  });
  return response.json();
}

export async function createOrderViaAI(items: unknown[], userId: string) {
  const response = await fetch(`${SUPPORT_URL}/api/order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items, userId, source: 'rez-consumer-app' }),
  });
  return response.json();
}
