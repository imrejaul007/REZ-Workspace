const MERCHANT_COPILOT_URL =
  process.env.REZ_MERCHANT_COPILOT_URL || 'https://REZ-merchant-copilot.onrender.com';

export async function getMerchantInsights(merchantId: string) {
  const response = await fetch(`${MERCHANT_COPILOT_URL}/api/merchant/${merchantId}/insights`);
  return response.json();
}

export async function getAIRecommendations(merchantId: string) {
  const response = await fetch(
    `${MERCHANT_COPILOT_URL}/api/merchant/${merchantId}/recommendations`
  );
  return response.json();
}

export async function getHealthScore(merchantId: string) {
  const response = await fetch(`${MERCHANT_COPILOT_URL}/api/merchant/${merchantId}/health`);
  return response.json();
}
