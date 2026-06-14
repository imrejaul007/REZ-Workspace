/**
 * REZ Intelligence Integration for PeopleOS
 * Employee insights, performance prediction
 */
const INTELLIGENCE_URL = process.env.REZ_INTELLIGENCE_URL || 'http://localhost:4018';

export const hrIntelligence = {
  async getEmployeeInsights(employeeId: string) {
    const res = await fetch(`${INTELLIGENCE_URL}/api/intel/employee`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': process.env.REZ_INTELLIGENCE_API_KEY || '' },
      body: JSON.stringify({ employeeId }),
    });
    return res.json();
  },
  async predictPerformance(employeeId: string) {
    const res = await fetch(`${INTELLIGENCE_URL}/api/predict/performance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': process.env.REZ_INTELLIGENCE_API_KEY || '' },
      body: JSON.stringify({ employeeId }),
    });
    return res.json();
  },
  async getLearningPath(employeeId: string) {
    const res = await fetch(`${INTELLIGENCE_URL}/api/recommend/learning`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': process.env.REZ_INTELLIGENCE_API_KEY || '' },
      body: JSON.stringify({ employeeId }),
    });
    return res.json();
  },
};
export default hrIntelligence;
