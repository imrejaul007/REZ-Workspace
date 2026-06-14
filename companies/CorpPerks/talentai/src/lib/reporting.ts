/**
 * Analytics & Reporting
 * Dashboards, Insights, Trends
 */

export async function getDashboard(companyId: string, range: string) {
  return {
    headcount: 45,
    attendance: 92,
    leaves: { pending: 5, approved: 40 },
    expenses: { pending: 12000, approved: 50000 },
    performance: { avg: 3.8, trend: 'up' }
  };
}

export async function getInsights(companyId: string) {
  return {
    recommendations: ['Promote top performer', 'Address attendance'],
    trends: [{ metric: 'Productivity', direction: 'up', value: 15 }]
  };
}
