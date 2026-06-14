export interface AnalyticsData {
  totalMembers: number;
  activeMembers: number;
  totalRevenue: number;
  averageCheckInDuration: number;
}

export async function getGymAnalytics(gymId: string): Promise<AnalyticsData> {
  // Simulated data
  return {
    totalMembers: 245,
    activeMembers: 198,
    totalRevenue: 125000,
    averageCheckInDuration: 65,
  };
}

export async function getMemberAnalytics(userId: string) {
  return {
    totalVisits: 45,
    averageSessionDuration: 55,
    favoriteClassType: 'yoga',
    memberSince: '2023-06-15',
    lastVisit: '2024-01-12',
  };
}
