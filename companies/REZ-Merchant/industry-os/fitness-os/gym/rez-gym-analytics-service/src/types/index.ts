export interface GymAnalytics {
  totalMembers: number;
  activeMembers: number;
  newMembersThisMonth: number;
  churnedMembers: number;
  averageVisitsPerDay: number;
  peakHours: Array<{ hour: number; count: number }>;
  revenueThisMonth: number;
  topClasses: Array<{ classType: string; bookings: number }>;
}

export interface MemberAnalytics {
  totalVisits: number;
  averageSessionDuration: number;
  favoriteClassType: string;
  memberSince: string;
  lastVisit: string;
}
