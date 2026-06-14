// ==========================================
// PeopleOS - Manager Intelligence Mock Data
// ==========================================

export interface TeamMember {
  id: string;
  name: string;
  designation: string;
  riskScore: number;
  riskFactors: string[];
}

export interface PromotionCandidate {
  id: string;
  name: string;
  currentRole: string;
  targetRole: string;
  readinessScore: number;
  keyStrengths: string[];
}

export interface SkillGapAnalysis {
  skill: string;
  demandLevel: number;
  supplyLevel: number;
  gapSize: number;
  teamMembersWithSkill: string[];
  recommendedAction: string;
}

export interface TeamHealth {
  teamId: string;
  teamName: string;
  managerId: string;
  managerName: string;
  memberCount: number;
  burnoutRisk: number;
  attritionRisk: number;
  moraleScore: number;
  avgProductivity: number;
  overloadedMembers: TeamMember[];
  underperforming: TeamMember[];
  promotionReady: PromotionCandidate[];
  skillGaps: SkillGapAnalysis[];
}

export interface BurnoutAlert {
  id: string;
  employeeId: string;
  employeeName: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  riskFactors: string[];
  recommendations: string[];
  lastUpdated: string;
}

export interface AttritionRisk {
  id: string;
  employeeId: string;
  employeeName: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  tenure: string;
  flightRiskFactors: string[];
  retentionActions: string[];
  lastUpdated: string;
}

export const mockTeamHealth: TeamHealth = {
  teamId: 'team-1',
  teamName: 'Platform Engineering',
  managerId: 'mgr-1',
  managerName: 'Priya Patel',
  memberCount: 12,
  burnoutRisk: 35,
  attritionRisk: 25,
  moraleScore: 78,
  avgProductivity: 82,
  overloadedMembers: [
    { id: 'emp-1', name: 'Amit Kumar', designation: 'Senior Engineer', riskScore: 78, riskFactors: ['High task load', 'Overtime hours'] },
    { id: 'emp-2', name: 'Sneha Reddy', designation: 'Engineer', riskScore: 72, riskFactors: ['Tight deadlines', 'Multiple projects'] },
  ],
  underperforming: [
    { id: 'emp-3', name: 'Vikram Singh', designation: 'Junior Engineer', riskScore: 45, riskFactors: ['Skill gaps', 'Learning curve'] },
  ],
  promotionReady: [
    { id: 'emp-1', name: 'Amit Kumar', currentRole: 'Senior Engineer', targetRole: 'Staff Engineer', readinessScore: 85, keyStrengths: ['Technical depth', 'Mentoring', 'Architecture'] },
    { id: 'emp-4', name: 'Neha Gupta', currentRole: 'Engineer', targetRole: 'Senior Engineer', readinessScore: 78, keyStrengths: ['Consistency', 'Team collaboration', 'Delivery'] },
  ],
  skillGaps: [
    { skill: 'Cloud Architecture', demandLevel: 90, supplyLevel: 40, gapSize: 50, teamMembersWithSkill: ['Rahul', 'Priya'], recommendedAction: 'Send 3 team members for AWS certification' },
    { skill: 'Machine Learning', demandLevel: 75, supplyLevel: 30, gapSize: 45, teamMembersWithSkill: ['Rahul'], recommendedAction: 'Hire ML specialist or partner with REZ Intelligence' },
  ],
};

export const mockBurnoutAlerts: BurnoutAlert[] = [
  {
    id: 'burn-1',
    employeeId: 'emp-1',
    employeeName: 'Amit Kumar',
    riskLevel: 'high',
    riskScore: 78,
    riskFactors: ['Working >10 hrs/day consistently', '3 concurrent projects', 'No vacation in 6 months'],
    recommendations: ['Schedule mandatory time off', 'Redistribute workload', '1-on-1 with manager'],
    lastUpdated: '2026-05-28',
  },
  {
    id: 'burn-2',
    employeeId: 'emp-2',
    employeeName: 'Sneha Reddy',
    riskLevel: 'medium',
    riskScore: 62,
    riskFactors: ['Approaching deadline pressure', 'Multiple stakeholder management'],
    recommendations: ['Prioritize task delegation', 'Weekly check-ins with manager'],
    lastUpdated: '2026-05-27',
  },
];

export const mockAttritionRisks: AttritionRisk[] = [
  {
    id: 'attr-1',
    employeeId: 'emp-5',
    employeeName: 'Rajesh Verma',
    riskLevel: 'critical',
    riskScore: 85,
    tenure: '3 years',
    flightRiskFactors: ['Counter offer from competitor', 'Salary expectation gap', 'Limited growth path'],
    retentionActions: ['Immediate salary review', 'Promotion consideration', 'Role change discussion'],
    lastUpdated: '2026-05-28',
  },
  {
    id: 'attr-2',
    employeeId: 'emp-6',
    employeeName: 'Meera Joshi',
    riskLevel: 'medium',
    riskScore: 55,
    tenure: '18 months',
    flightRiskFactors: ['Work-life balance concerns', 'Project monotony'],
    retentionActions: ['Project rotation discussion', 'Flexible work arrangement'],
    lastUpdated: '2026-05-26',
  },
];
