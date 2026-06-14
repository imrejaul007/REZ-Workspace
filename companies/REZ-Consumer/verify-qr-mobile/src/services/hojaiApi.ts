/**
 * verify-qr-mobile - HOJAI Mind Integration
 * Intent tracking and prediction
 */

const HOJAI_API_URL = process.env.EXPO_PUBLIC_HOJAI_API_URL || 'https://rez-mind.onrender.com';

interface Intent {
  intent: string;
  confidence: number;
  entities: Record<string, any>;
}

export async function trackIntent(
  userId: string,
  action: string,
  entities: Record<string, any>
): Promise<{ success: boolean; intent?: Intent }> {
  try {
    const response = await fetch(`${HOJAI_API_URL}/api/intent/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action, entities }),
    });
    return await response.json();
  } catch (error) {
    console.error('HOJAI API Error:', error);
    return { success: false };
  }
}

export async function predictIntent(
  userId: string,
  context: Record<string, any>
): Promise<{ success: boolean; intent?: Intent }> {
  try {
    const response = await fetch(`${HOJAI_API_URL}/api/intent/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, context }),
    });
    return await response.json();
  } catch (error) {
    console.error('HOJAI API Error:', error);
    return { success: false };
  }
}
