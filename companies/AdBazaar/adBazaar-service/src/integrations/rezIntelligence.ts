/**
 * REZ Intelligence Integration for AdBazaar
 * Attribution, targeting, prediction
 */
const INTELLIGENCE_URL = process.env.REZ_INTELLIGENCE_URL || 'http://localhost:4018';

export const adIntelligence = {
  async trackAttribution(userId: string, event: string, data: Record<string, unknown>) {
    await fetch(`${INTELLIGENCE_URL}/api/attribution/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': process.env.REZ_INTELLIGENCE_API_KEY || '' },
      body: JSON.stringify({ userId, event, ...data }),
    });
  },
  async getSegments(userId: string) {
    const res = await fetch(`${INTELLIGENCE_URL}/api/segments/${userId}`, {
      headers: { 'X-API-Key': process.env.REZ_INTELLIGENCE_API_KEY || '' },
    });
    return res.json();
  },
  async predictConversion(userId: string) {
    const res = await fetch(`${INTELLIGENCE_URL}/api/predict/conversion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': process.env.REZ_INTELLIGENCE_API_KEY || '' },
      body: JSON.stringify({ userId }),
    });
    return res.json();
  },
};
export default adIntelligence;
