// ==========================================
// MyTalent Employee Life OS - Type Definitions
// ==========================================

// Employee Types
export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  companyId: string;
  companyName: string;
  corpId?: string;
  ciScore?: number;
  avatar?: string;
  joinDate: string;
  status: 'active' | 'inactive' | 'on-leave';
}

// Attendance Types
export interface AttendanceRecord {
  id: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  hoursWorked: number;
  type: 'GPS' | 'QR' | 'FACE' | 'WFH';
  status: 'present' | 'absent' | 'late' | 'half-day' | 'week-off' | 'holiday';
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface AttendanceSummary {
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  totalHours: number;
  onTimeRate: number;
}

// Leave Types
export interface LeaveBalance {
  sick: number;
  casual: number;
  earned: number;
  wfh: number;
}

export interface LeaveRequest {
  id: string;
  type: 'sick' | 'casual' | 'earned' | 'wfh';
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedOn: string;
  reviewedBy?: string;
  reviewedOn?: string;
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
  type: 'national' | 'state' | 'company';
}

// Payroll Types
export interface Payslip {
  id: string;
  month: string;
  year: number;
  basic: number;
  allowances: {
    hra: number;
    transport: number;
    medical: number;
    other: number;
    total: number;
  };
  deductions: {
    pf: number;
    esic: number;
    tds: number;
    other: number;
    total: number;
  };
  grossPay: number;
  netPay: number;
  daysPaid: number;
  status: 'paid' | 'pending' | 'processing';
  paymentDate?: string;
}

export interface TaxDetail {
  financialYear: string;
  totalIncome: number;
  totalDeductions: number;
  taxableIncome: number;
  taxSlab: string;
  estimatedTax: number;
}

// Benefits Types
export interface Benefit {
  id: string;
  title: string;
  description: string;
  icon: string;
  value: string;
  category: 'health' | 'wellness' | 'meal' | 'travel' | 'learning' | 'insurance' | 'perks';
  status: 'active' | 'pending' | 'expired' | 'not-enrolled';
  expiry?: string;
  partner?: string;
  remainingValue?: number;
  usagePercentage?: number;
  coverage?: string;
}

export interface PartnerOffer {
  id: string;
  brand: string;
  brandIcon: string;
  discount: string;
  discountValue: number;
  description?: string;
  expiry: string;
  category: string;
  claimUrl?: string;
}

export interface BenefitsSummary {
  totalValue: number;
  activeCount: number;
  healthValue: number;
  wellnessValue: number;
  mealValue: number;
  travelValue: number;
  learningValue: number;
  insuranceValue: number;
}

// CorpID Types
export interface CorpIDProfile {
  corpId: string;
  ciScore: number;
  tier: 'Elite' | 'Premium' | 'Verified' | 'Basic' | 'Unverified';
  scoreBreakdown: {
    identityScore: number;
    employmentScore: number;
    financialScore: number;
    socialScore: number;
    skillScore: number;
  };
  verificationStatus: {
    identity: boolean;
    employment: boolean;
    education: boolean;
    skills: boolean;
    address: boolean;
    documents: boolean;
  };
  badges: TrustBadge[];
  createdAt: string;
  lastUpdated: string;
}

export interface TrustBadge {
  id: string;
  name: string;
  icon: string;
  description: string;
  earnedAt: string;
  category: 'identity' | 'employment' | 'skills' | 'achievement' | 'verification';
}

// Task Types
export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  category: 'personal' | 'work' | 'meeting' | 'deadline';
  progress?: number;
  assignedBy?: string;
}

export interface ProductivityStats {
  overallScore: number;
  attendanceScore: number;
  taskCompletionScore: number;
  deadlineAdherenceScore: number;
  teamRanking: {
    position: number;
    total: number;
  };
  weeklyInsights: {
    day: string;
    productivity: number;
  }[];
}

// Money (RidZa) Types
export interface FinancialHealth {
  score: number;
  incomeHealth: number;
  debtHealth: number;
  savingsHealth: number;
  investmentHealth: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
  debtToIncomeRatio: number;
}

export interface SalaryAdvance {
  id: string;
  amount: number;
  requestedOn: string;
  status: 'pending' | 'approved' | 'disbursed' | 'rejected';
  repaymentDate: string;
}

export interface CreditCard {
  id: string;
  name: string;
  bank: string;
  annualFee: number;
  cashbackRate: number;
  rewardRate: number;
  features: string[];
  eligibility: string;
  applyUrl: string;
}

export interface LoanOffer {
  id: string;
  type: 'personal' | 'salary-based' | 'home' | 'education' | 'business';
  name: string;
  minAmount: number;
  maxAmount: number;
  minTenure: number;
  maxTenure: number;
  interestRate: number;
  processingFee: number;
  features: string[];
  eligibility: string;
  applyUrl: string;
}

// Career Types
export interface CareerProgress {
  readinessScore: number;
  promotionReadiness: 'Ready' | 'In Progress' | 'Not Ready';
  yearsInCurrentRole: number;
  avgPerformanceScore: number;
  skillsMatchPercentage: number;
}

export interface SkillGap {
  skill: string;
  currentLevel: 'none' | 'basic' | 'intermediate' | 'advanced' | 'expert';
  requiredLevel: 'basic' | 'intermediate' | 'advanced' | 'expert';
  gap: 'critical' | 'moderate' | 'minor' | 'met';
  recommendedCourses: Course[];
}

export interface CareerPath {
  currentRole: string;
  nextRoles: {
    role: string;
    timeToPromote: string;
    skillsRequired: string[];
    probability: number;
  }[];
  timeline: {
    year: number;
    expectedRole: string;
  }[];
}

export interface Course {
  id: string;
  title: string;
  provider: string;
  duration: string;
  level: string;
  url: string;
  free: boolean;
  rating?: number;
}

export interface InternalJob {
  id: string;
  title: string;
  department: string;
  location: string;
  type: 'full-time' | 'part-time' | 'contract';
  experience: string;
  description: string;
  requirements: string[];
  postedOn: string;
  deadline: string;
  matchScore?: number;
}

export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  suggestions?: string[];
}

// ==========================================
// Opportunity Hub Types
// ==========================================

export type OpportunityType = 'internal_job' | 'gig' | 'mentorship' | 'advisory' | 'freelance' | 'part_time';

export interface Opportunity {
  id: string;
  type: OpportunityType;
  title: string;
  company: string;
  department?: string;
  location: string;
  salary?: string;
  pay?: string;
  equity?: string;
  experience?: string;
  description: string;
  requirements: string[];
  postedOn: string;
  deadline: string;
  matchScore?: number;
  mentor?: string;
  duration?: string;
  commitment?: string;
  status?: 'open' | 'closed' | 'filled';
}

export interface OpportunityApplication {
  id: string;
  opportunityId: string;
  opportunityTitle: string;
  opportunityType: OpportunityType;
  appliedOn: string;
  status: 'applied' | 'screening' | 'interview' | 'offer' | 'rejected' | 'withdrawn';
  notes?: string;
}

// ==========================================
// Wealth Dashboard Types
// ==========================================

export interface Property {
  id: string;
  type: 'apartment' | 'house' | 'land' | 'commercial' | 'other';
  name: string;
  address: string;
  purchaseValue: number;
  currentValue: number;
  ownership: number; // percentage
  rentalIncome?: number;
  emi?: number;
  emiRemaining?: number;
  imageUrl?: string;
}

export interface Investment {
  id: string;
  type: 'stocks' | 'mutual_funds' | 'fixed_deposit' | 'ppf' | 'nps' | 'gold' | 'crypto' | 'other';
  name: string;
  provider: string;
  amount: number;
  currentValue: number;
  returns: number;
  returnsPercent: number;
  lastUpdated: string;
}

export interface InsurancePolicy {
  id: string;
  type: 'life' | 'health' | 'term' | 'ulip' | 'vehicle' | 'home';
  name: string;
  provider: string;
  sumAssured: number;
  premium: number;
  premiumFrequency: 'monthly' | 'quarterly' | 'yearly';
  nextDueDate: string;
  maturityDate?: string;
  status: 'active' | 'lapsed' | 'matured';
}

export interface WealthData {
  netWorth: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
  properties: Property[];
  investments: Investment[];
  insurance: InsurancePolicy[];
  retirementScore: number;
  retirementAge: number;
  retirementCorpus: number;
  targetCorpus: number;
}

export interface RetirementProjection {
  currentAge: number;
  retirementAge: number;
  currentSavings: number;
  monthlyContribution: number;
  expectedReturns: number;
  inflationRate: number;
  targetCorpus: number;
  projectedCorpus: number;
  gap: number;
}

// ==========================================
// Manager Intelligence Types
// ==========================================

export interface TeamHealth {
  teamId: string;
  teamName: string;
  managerId: string;
  managerName: string;
  memberCount: number;
  burnoutRisk: number; // 0-100
  attritionRisk: number; // 0-100
  moraleScore: number; // 0-100
  avgProductivity: number; // 0-100
  overloadedMembers: TeamMember[];
  underperforming: TeamMember[];
  promotionReady: PromotionCandidate[];
  skillGaps: SkillGapAnalysis[];
}

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
  demandLevel: number; // 0-100
  supplyLevel: number; // 0-100
  gapSize: number;
  teamMembersWithSkill: string[];
  recommendedAction: string;
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

// ==========================================
// Professional Passport Types
// ==========================================

export interface ProfessionalPassport {
  employeeId: string;
  careerTimeline: CareerEvent[];
  projectsDelivered: Project[];
  promotions: Promotion[];
  skills: SkillWithDate[];
  certifications: Certification[];
  leadershipScore: number;
  collaborationScore: number;
  reliabilityScore: number;
  trustScore: number;
}

export interface CareerEvent {
  id: string;
  type: 'promotion' | 'role_change' | 'project' | 'award' | 'certification' | 'milestone';
  title: string;
  description: string;
  date: string;
  company?: string;
  verified: boolean;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  role: string;
  startDate: string;
  endDate?: string;
  status: 'completed' | 'in-progress' | 'on-hold';
  impact: string;
  technologies: string[];
  teamSize?: number;
}

export interface Promotion {
  id: string;
  previousRole: string;
  newRole: string;
  date: string;
  reason: string;
  verified: boolean;
}

export interface SkillWithDate {
  skill: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  acquiredDate: string;
  lastUsed?: string;
  endorsements: number;
}

export interface Certification {
  id: string;
  name: string;
  provider: string;
  issuedDate: string;
  expiryDate?: string;
  credentialId?: string;
  verified: boolean;
  credentialUrl?: string;
}

// ==========================================
// Reputation Graph Types
// ==========================================

export interface ReputationScores {
  reliability: number;    // Attendance, deadlines
  leadership: number;      // Team lead, mentoring
  collaboration: number;   // Teamwork, communication
  delivery: number;        // Project completion
  learning: number;        // Skill growth, certifications
  trust: number;          // CorpID verification level
  overall: number;         // Weighted average
}

export interface ReputationHistory {
  date: string;
  reliability: number;
  leadership: number;
  collaboration: number;
  delivery: number;
  learning: number;
  trust: number;
}

// ==========================================
// Team Tab Types
// ==========================================

export interface TeamChat {
  id: string;
  name: string;
  type: 'direct' | 'group';
  members: TeamMember[];
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  avatar?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  author: string;
  authorRole: string;
  postedOn: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  attachments?: string[];
  pinned: boolean;
}

export interface Meeting {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  attendees: string[];
  meetingRoom?: string;
  joinUrl?: string;
  recurring?: boolean;
}

// Navigation Types
export type RootTabParamList = {
  Home: undefined;
  Work: undefined;
  Pay: undefined;
  Benefits: undefined;
  Money: undefined;
  Career: undefined;
  Wealth: undefined;
  Team: undefined;
  Profile: undefined;
};

export type WorkStackParamList = {
  WorkMain: undefined;
  Attendance: undefined;
  Leave: undefined;
  Tasks: undefined;
  Productivity: undefined;
};

export type PayStackParamList = {
  PayMain: undefined;
  PayslipDetail: { payslipId: string };
};

export type BenefitsStackParamList = {
  BenefitsMain: undefined;
  HealthBenefits: undefined;
  Offers: undefined;
};

export type MoneyStackParamList = {
  MoneyMain: undefined;
  SalaryAdvance: undefined;
  CreditCards: undefined;
  Loans: undefined;
  Insurance: undefined;
};

export type CareerStackParamList = {
  CareerMain: undefined;
  SkillGap: undefined;
  CareerPaths: undefined;
  AICoach: undefined;
  InternalMobility: undefined;
  Opportunities: undefined;
  OpportunityDetail: { opportunityId: string };
  MyApplications: undefined;
};

export type WealthStackParamList = {
  WealthMain: undefined;
  Properties: undefined;
  PropertyDetail: { propertyId: string };
  Investments: undefined;
  InvestmentDetail: { investmentId: string };
  InsurancePolicies: undefined;
  InsuranceDetail: { policyId: string };
  Retirement: undefined;
  EMI: undefined;
};

export type ManagerIntelligenceStackParamList = {
  ManagerIntelligence: undefined;
  TeamHealth: { teamId: string };
  BurnoutAlerts: undefined;
  AttritionRisks: undefined;
  PromotionCandidates: undefined;
  SkillGapTeam: undefined;
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  CorpID: undefined;
  TrustWallet: undefined;
  Documents: undefined;
  Directory: undefined;
  Announcements: undefined;
  Support: undefined;
  AICopilot: undefined;
  Settings: undefined;
};

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ==========================================
// Meeting Types (1:1 Meeting Management)
// ==========================================

export type MeetingType = '1on1' | 'skip_level' | 'team_meeting';
export type MeetingFrequency = 'weekly' | 'biweekly' | 'monthly';
export type MeetingStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type OneOnOneStatus = 'active' | 'paused' | 'ended';
export type ActionItemStatus = 'pending' | 'in_progress' | 'completed';

export interface ActionItem {
  _id: string;
  itemId: string;
  meetingId: string;
  task: string;
  description?: string;
  assigneeId: string;
  assigneeName: string;
  createdById: string;
  createdByName: string;
  dueDate?: string;
  status: ActionItemStatus;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MeetingNote {
  _id: string;
  noteId: string;
  meetingId: string;
  authorId: string;
  authorName: string;
  content: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  discussionSummary?: string;
  decisions: string[];
  keyTakeaways: string[];
  actionItems: string[];
  isPrivate: boolean;
  sharedWith: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Feedback {
  _id: string;
  feedbackId: string;
  meetingId: string;
  reviewerId: string;
  reviewerName: string;
  revieweeId: string;
  revieweeName: string;
  rating: 1 | 2 | 3 | 4 | 5;
  feedbackType: 'meeting_prep' | 'engagement' | 'action_items' | 'communication' | 'overall';
  comment?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  submittedAt: string;
}

export interface Meeting {
  _id: string;
  meetingId: string;
  companyId: string;
  type: MeetingType;
  title: string;
  description?: string;
  scheduledStart: string;
  scheduledEnd: string;
  actualStart?: string;
  actualEnd?: string;
  duration: number;
  hostId: string;
  hostName: string;
  hostAvatar?: string;
  attendeeId: string;
  attendeeName: string;
  attendeeAvatar?: string;
  participantIds: string[];
  location?: string;
  meetingLink?: string;
  status: MeetingStatus;
  cancellationReason?: string;
  notes: MeetingNote[];
  aiSummary?: string;
  actionItems: ActionItem[];
  feedback: Feedback[];
  meetingType: 'video' | 'audio' | 'in_person' | 'phone';
  createdAt: string;
  updatedAt: string;
}

export interface OneOnOne {
  _id: string;
  oneOnOneId: string;
  meetingId: string;
  companyId: string;
  managerId: string;
  managerName: string;
  managerAvatar?: string;
  employeeId: string;
  employeeName: string;
  employeeAvatar?: string;
  type: MeetingType;
  frequency: MeetingFrequency;
  nextScheduled?: string;
  lastMeeting?: string;
  duration: number;
  preferredTime?: string;
  preferredDays: number[];
  status: OneOnOneStatus;
  pausedReason?: string;
  stats: {
    totalMeetings: number;
    completedMeetings: number;
    totalActionItems: number;
    completedActionItems: number;
    averageRating?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface OneOnOneWithStats extends OneOnOne {
  completionRate: number;
  actionItemCompletionRate: number;
  pendingActionItems: number;
}

export interface OneOnOneStats {
  totalPairs: number;
  activePairs: number;
  pausedPairs: number;
  endedPairs: number;
  upcomingMeetings: number;
  meetingsThisWeek: number;
  meetingsThisMonth: number;
  averageRating: number;
  totalActionItems: number;
  completedActionItems: number;
}
