// Mock Data for CorpID Mobile App Demo

import { CorpIdUser, CIScore, VerificationRequest, PassportEntry, Badge, TrustConnection } from '../types';

export const mockUser: CorpIdUser = {
  corpId: 'CI-IND-78234',
  entityType: 'INDIVIDUAL',
  status: 'VERIFIED',
  verificationLevel: 4,
  name: 'Rejaul Karim',
  email: 'rejaul@corpid.io',
  phone: '+91 98765 43210',
  createdAt: '2025-01-15T10:00:00Z',
};

export const mockCIScore: CIScore = {
  corpId: 'CI-IND-78234',
  score: 847,
  tier: 'PREMIUM',
  breakdown: {
    identity: 195,
    employment: 178,
    skills: 165,
    reputation: 142,
    compliance: 89,
    references: 78,
  },
  lastUpdated: '2026-05-29T12:00:00Z',
  trend: 'up',
};

export const mockVerifications: VerificationRequest[] = [
  {
    id: 'VRF-001',
    type: 'identity',
    status: 'approved',
    submittedAt: '2025-01-15T10:30:00Z',
    verifiedAt: '2025-01-15T14:00:00Z',
    documents: ['Aadhaar Card', 'PAN Card'],
    verifiedBy: 'System',
  },
  {
    id: 'VRF-002',
    type: 'employment',
    status: 'approved',
    submittedAt: '2025-02-20T09:00:00Z',
    verifiedAt: '2025-02-21T11:00:00Z',
    documents: ['Employment Letter', 'Salary Slips'],
    verifiedBy: 'CorpID HR Team',
  },
  {
    id: 'VRF-003',
    type: 'skills',
    status: 'approved',
    submittedAt: '2025-03-10T15:00:00Z',
    verifiedAt: '2025-03-11T10:00:00Z',
    documents: ['AWS Certification', 'Coursera Certificate'],
    verifiedBy: 'SkillsVerify API',
  },
  {
    id: 'VRF-004',
    type: 'education',
    status: 'approved',
    submittedAt: '2025-01-20T11:00:00Z',
    verifiedAt: '2025-01-22T16:00:00Z',
    documents: ['University Degree', 'Marksheets'],
    verifiedBy: 'National Academic Depository',
  },
];

export const mockPassportEntries: PassportEntry[] = [
  {
    id: 'PP-001',
    type: 'education',
    title: 'Master of Computer Applications',
    organization: 'Indian Institute of Technology',
    startDate: '2018-07-01',
    endDate: '2020-06-30',
    description: 'Specialized in Artificial Intelligence and Machine Learning',
    verified: true,
    verifiedAt: '2025-01-22T16:00:00Z',
  },
  {
    id: 'PP-002',
    type: 'employment',
    title: 'Senior Software Engineer',
    organization: 'TechCorp India Pvt Ltd',
    startDate: '2020-07-15',
    description: 'Leading frontend development team, building scalable web applications',
    verified: true,
    verifiedAt: '2025-02-21T11:00:00Z',
  },
  {
    id: 'PP-003',
    type: 'certification',
    title: 'AWS Solutions Architect Professional',
    organization: 'Amazon Web Services',
    startDate: '2023-03-01',
    description: 'Advanced cloud architecture and design patterns',
    verified: true,
    verifiedAt: '2025-03-11T10:00:00Z',
  },
  {
    id: 'PP-004',
    type: 'award',
    title: 'Best Innovator Award 2024',
    organization: 'TechCorp India',
    startDate: '2024-12-01',
    description: 'Recognized for developing AI-powered code review system',
    verified: true,
  },
  {
    id: 'PP-005',
    type: 'project',
    title: 'ReZ Ecosystem Platform',
    organization: 'RTNM Group',
    startDate: '2024-01-01',
    description: 'Built India\'s largest unified commerce and mobility platform',
    verified: true,
  },
];

export const mockBadges: Badge[] = [
  {
    id: 'BDG-001',
    name: 'Identity Verified',
    description: 'Your identity has been verified through government documents',
    icon: 'shield-check',
    earnedAt: '2025-01-15T14:00:00Z',
    category: 'verification',
    tier: 'platinum',
  },
  {
    id: 'BDG-002',
    name: 'Employment Confirmed',
    description: 'Your employment history has been verified',
    icon: 'briefcase',
    earnedAt: '2025-02-21T11:00:00Z',
    category: 'verification',
    tier: 'gold',
  },
  {
    id: 'BDG-003',
    name: 'Skills Expert',
    description: 'Verified professional skills and certifications',
    icon: 'award',
    earnedAt: '2025-03-11T10:00:00Z',
    category: 'verification',
    tier: 'gold',
  },
  {
    id: 'BDG-004',
    name: 'Early Adopter',
    description: 'Joined CorpID within first 3 months of launch',
    icon: 'rocket',
    earnedAt: '2025-01-15T10:00:00Z',
    category: 'achievement',
    tier: 'silver',
  },
  {
    id: 'BDG-005',
    name: 'Trust Builder',
    description: 'Maintained 90%+ trust score for 6 consecutive months',
    icon: 'heart',
    earnedAt: '2025-07-15T10:00:00Z',
    category: 'trust',
    tier: 'gold',
  },
  {
    id: 'BDG-006',
    name: 'Network Connector',
    description: 'Connected with 50+ verified professionals',
    icon: 'users',
    earnedAt: '2025-11-20T10:00:00Z',
    category: 'engagement',
    tier: 'silver',
  },
  {
    id: 'BDG-007',
    name: 'Top Performer',
    description: 'Ranked in top 10% of CorpID users by CI Score',
    icon: 'trending-up',
    earnedAt: '2026-01-01T00:00:00Z',
    category: 'achievement',
    tier: 'platinum',
  },
  {
    id: 'BDG-008',
    name: 'Document Champion',
    description: 'Verified 10+ documents across all categories',
    icon: 'file-check',
    earnedAt: '2025-06-15T10:00:00Z',
    category: 'verification',
    tier: 'silver',
  },
];

export const mockTrustConnections: TrustConnection[] = [
  {
    corpId: 'CI-EMP-001',
    name: 'TechCorp India Pvt Ltd',
    relationship: 'employer',
    trustLevel: 95,
    connectedAt: '2020-07-15T00:00:00Z',
  },
  {
    corpId: 'CI-IND-45678',
    name: 'Priya Sharma',
    relationship: 'colleague',
    trustLevel: 88,
    connectedAt: '2021-03-10T00:00:00Z',
  },
  {
    corpId: 'CI-IND-56789',
    name: 'Rahul Verma',
    relationship: 'colleague',
    trustLevel: 85,
    connectedAt: '2021-03-10T00:00:00Z',
  },
  {
    corpId: 'CI-IND-67890',
    name: 'Neha Patel',
    relationship: 'colleague',
    trustLevel: 82,
    connectedAt: '2022-06-20T00:00:00Z',
  },
  {
    corpId: 'CI-INS-001',
    name: 'IIT Delhi',
    relationship: 'institution',
    trustLevel: 100,
    connectedAt: '2018-07-01T00:00:00Z',
  },
];

export const scoreColorMap: Record<string, { primary: string; secondary: string }> = {
  ELITE: { primary: '#FFD700', secondary: '#FFA500' },
  PREMIUM: { primary: '#C0C0C0', secondary: '#A0A0A0' },
  VERIFIED: { primary: '#3B82F6', secondary: '#2563EB' },
  BASIC: { primary: '#9CA3AF', secondary: '#6B7280' },
  UNVERIFIED: { primary: '#EF4444', secondary: '#DC2626' },
};

export const verificationTypeLabels: Record<string, string> = {
  identity: 'Identity Verification',
  employment: 'Employment Verification',
  skills: 'Skills Verification',
  education: 'Education Verification',
  reference: 'Reference Check',
};

export const entityTypeLabels: Record<string, string> = {
  INDIVIDUAL: 'Individual',
  EMPLOYER: 'Employer',
  INSTITUTION: 'Institution',
  GOVERNMENT: 'Government',
};
