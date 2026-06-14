// CorpID Web Dashboard Mock Data

export const mockStats = {
  totalIdentities: 15420,
  totalVerified: 12850,
  verificationRate: 83,
  pendingVerifications: 342,
  averageCIScore: 724,
  topScore: 980,
  documentsProcessed: 45892,
  riskAlerts: 23,
  activePartners: 156,
  monthlyGrowth: 12.5,
};

export const mockVerifications = [
  {
    id: 'VRF-001',
    corpId: 'CI-IND-78234',
    name: 'Rejaul Karim',
    type: 'identity',
    status: 'approved',
    submittedAt: '2026-05-28T10:30:00Z',
    verifiedAt: '2026-05-28T14:00:00Z',
    documents: ['Aadhaar Card', 'PAN Card'],
    verifiedBy: 'System',
  },
  {
    id: 'VRF-002',
    corpId: 'CI-IND-45678',
    name: 'Priya Sharma',
    type: 'employment',
    status: 'pending',
    submittedAt: '2026-05-29T09:00:00Z',
    documents: ['Employment Letter', 'Salary Slips'],
  },
  {
    id: 'VRF-003',
    corpId: 'CI-BIZ-00123',
    name: 'TechCorp India Pvt Ltd',
    type: 'business',
    status: 'approved',
    submittedAt: '2026-05-27T15:00:00Z',
    verifiedAt: '2026-05-28T11:00:00Z',
    documents: ['GST Certificate', 'Incorporation Certificate'],
    verifiedBy: 'Admin',
  },
  {
    id: 'VRF-004',
    corpId: 'CI-IND-56789',
    name: 'Rahul Verma',
    type: 'education',
    status: 'pending',
    submittedAt: '2026-05-29T08:00:00Z',
    documents: ['University Degree', 'Marksheets'],
  },
  {
    id: 'VRF-005',
    corpId: 'CI-IND-67890',
    name: 'Neha Patel',
    type: 'skills',
    status: 'rejected',
    submittedAt: '2026-05-26T12:00:00Z',
    documents: ['AWS Certificate'],
    rejectionReason: 'Certificate expired',
  },
];

export const mockCIScores = [
  { corpId: 'CI-IND-AB123', name: 'Amit Singh', score: 980, tier: 'ELITE', trend: 'up', trendValue: 15 },
  { corpId: 'CI-BIZ-XY456', name: 'TechCorp India', score: 945, tier: 'ELITE', trend: 'stable', trendValue: 0 },
  { corpId: 'CI-SUP-ZW789', name: 'Rahul Kumar', score: 890, tier: 'PREMIUM', trend: 'up', trendValue: 8 },
  { corpId: 'CI-MER-UV012', name: 'Neha Sharma', score: 875, tier: 'PREMIUM', trend: 'down', trendValue: -5 },
  { corpId: 'CI-DRV-RS345', name: 'Vikram Singh', score: 860, tier: 'PREMIUM', trend: 'up', trendValue: 12 },
  { corpId: 'CI-IND-DEF78', name: 'Priya Patel', score: 845, tier: 'PREMIUM', trend: 'stable', trendValue: 0 },
  { corpId: 'CI-IND-GHI90', name: 'Arun Kumar', score: 780, tier: 'VERIFIED', trend: 'up', trendValue: 20 },
  { corpId: 'CI-IND-JKL12', name: 'Sunita Devi', score: 720, tier: 'VERIFIED', trend: 'down', trendValue: -3 },
  { corpId: 'CI-IND-MNO34', name: 'Rajesh Verma', score: 650, tier: 'VERIFIED', trend: 'up', trendValue: 10 },
];

export const mockPassports = [
  {
    id: 'PP-001',
    corpId: 'CI-IND-78234',
    name: 'Rejaul Karim',
    entries: 5,
    verified: 4,
    lastUpdated: '2026-05-28T10:00:00Z',
  },
  {
    id: 'PP-002',
    corpId: 'CI-IND-45678',
    name: 'Priya Sharma',
    entries: 3,
    verified: 2,
    lastUpdated: '2026-05-27T15:00:00Z',
  },
  {
    id: 'PP-003',
    corpId: 'CI-BIZ-00123',
    name: 'TechCorp India Pvt Ltd',
    entries: 8,
    verified: 8,
    lastUpdated: '2026-05-26T12:00:00Z',
  },
];

export const mockPartners = [
  {
    id: 'PRTN-001',
    name: 'TechCorp India',
    type: 'employer',
    status: 'active',
    employees: 1250,
    verificationRate: 94,
    joinedAt: '2025-01-15T00:00:00Z',
  },
  {
    id: 'PRTN-002',
    name: 'IIT Delhi',
    type: 'institution',
    status: 'active',
    students: 8500,
    verificationRate: 100,
    joinedAt: '2024-06-01T00:00:00Z',
  },
  {
    id: 'PRTN-003',
    name: 'Infosys',
    type: 'employer',
    status: 'active',
    employees: 5200,
    verificationRate: 88,
    joinedAt: '2025-03-10T00:00:00Z',
  },
  {
    id: 'PRTN-004',
    name: 'TCS',
    type: 'employer',
    status: 'active',
    employees: 15000,
    verificationRate: 91,
    joinedAt: '2024-09-01T00:00:00Z',
  },
  {
    id: 'PRTN-005',
    name: 'Wipro',
    type: 'employer',
    status: 'pending',
    employees: 8500,
    verificationRate: 0,
    joinedAt: '2026-05-20T00:00:00Z',
  },
];

export const mockTrustGraph = {
  nodes: [
    { id: 'CI-IND-78234', type: 'individual', label: 'Rejaul Karim', score: 847 },
    { id: 'CI-IND-45678', type: 'individual', label: 'Priya Sharma', score: 812 },
    { id: 'CI-BIZ-00123', type: 'employer', label: 'TechCorp India', score: 890 },
    { id: 'CI-IND-56789', type: 'individual', label: 'Rahul Verma', score: 756 },
    { id: 'CI-INS-001', type: 'institution', label: 'IIT Delhi', score: 950 },
  ],
  edges: [
    { source: 'CI-IND-78234', target: 'CI-BIZ-00123', type: 'employment', trust: 95 },
    { source: 'CI-IND-45678', target: 'CI-BIZ-00123', type: 'employment', trust: 88 },
    { source: 'CI-IND-78234', target: 'CI-IND-45678', type: 'colleague', trust: 85 },
    { source: 'CI-IND-56789', target: 'CI-INS-001', type: 'education', trust: 100 },
    { source: 'CI-IND-78234', target: 'CI-INS-001', type: 'education', trust: 100 },
  ],
};

export const scoreDistribution = [
  { range: '900-1000', count: 234, percentage: 1.5 },
  { range: '800-899', count: 1567, percentage: 10.2 },
  { range: '700-799', count: 4234, percentage: 27.5 },
  { range: '600-699', count: 5123, percentage: 33.2 },
  { range: '500-599', count: 3456, percentage: 22.4 },
  { range: '400-499', count: 678, percentage: 4.4 },
  { range: '0-399', count: 128, percentage: 0.8 },
];

export const recentActivity = [
  { action: 'Identity Verified', entity: 'CI-IND-ABC12', time: '2 min ago', type: 'success' },
  { action: 'Document Uploaded', entity: 'CI-BIZ-XYZ34', time: '5 min ago', type: 'info' },
  { action: 'Score Updated', entity: 'CI-IND-DEF56', time: '10 min ago', type: 'success' },
  { action: 'Alert Triggered', entity: 'CI-SUP-GHI78', time: '15 min ago', type: 'warning' },
  { action: 'Verification Pending', entity: 'CI-MER-JKL90', time: '30 min ago', type: 'info' },
  { action: 'Partner Added', entity: 'Wipro Ltd', time: '1 hour ago', type: 'success' },
  { action: 'Score Decreased', entity: 'CI-IND-MNO34', time: '2 hours ago', type: 'warning' },
];

export const verificationTypeLabels: Record<string, string> = {
  identity: 'Identity Verification',
  employment: 'Employment Verification',
  skills: 'Skills Verification',
  education: 'Education Verification',
  reference: 'Reference Check',
  business: 'Business Verification',
};

export const tierColors: Record<string, string> = {
  ELITE: '#FFD700',
  PREMIUM: '#C0C0C0',
  VERIFIED: '#3B82F6',
  BASIC: '#9CA3AF',
  UNVERIFIED: '#EF4444',
};
