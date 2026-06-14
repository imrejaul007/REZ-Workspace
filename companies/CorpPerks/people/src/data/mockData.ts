// ==========================================
// MyTalent - Comprehensive Mock Data
// Employee Life OS Demo Data
// ==========================================

import {
  Employee,
  AttendanceRecord,
  AttendanceSummary,
  LeaveBalance,
  LeaveRequest,
  Holiday,
  Payslip,
  TaxDetail,
  Benefit,
  PartnerOffer,
  BenefitsSummary,
  CorpIDProfile,
  TrustBadge,
  Task,
  ProductivityStats,
  FinancialHealth,
  SalaryAdvance,
  CareerProgress,
  SkillGap,
  CareerPath,
  Course,
  InternalJob,
} from '../types';

// ==========================================
// Employee Data
// ==========================================

export const mockEmployee: Employee = {
  id: 'EMP001',
  name: 'Rahul Sharma',
  email: 'rahul.sharma@corpperks.com',
  phone: '+91 98765 43210',
  department: 'Engineering',
  designation: 'Senior Software Engineer',
  companyId: 'CP001',
  companyName: 'CorpPerks',
  corpId: 'CI-IND-RAHUL-2024001',
  ciScore: 785,
  avatar: 'RS',
  joinDate: '2023-01-15',
  status: 'active',
};

// ==========================================
// Attendance Data
// ==========================================

export const mockAttendanceHistory: AttendanceRecord[] = [
  {
    id: 'att-1',
    date: new Date().toISOString().split('T')[0],
    checkIn: '09:15 AM',
    checkOut: null,
    hoursWorked: 0,
    type: 'GPS',
    status: 'present',
    location: { latitude: 28.6139, longitude: 77.2090 },
  },
  {
    id: 'att-2',
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    checkIn: '09:00 AM',
    checkOut: '06:30 PM',
    hoursWorked: 9.5,
    type: 'GPS',
    status: 'present',
  },
  {
    id: 'att-3',
    date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
    checkIn: '09:45 AM',
    checkOut: '06:00 PM',
    hoursWorked: 8.25,
    type: 'GPS',
    status: 'late',
  },
  {
    id: 'att-4',
    date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
    checkIn: null,
    checkOut: null,
    hoursWorked: 0,
    type: 'WFH',
    status: 'present',
  },
  {
    id: 'att-5',
    date: new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0],
    checkIn: null,
    checkOut: null,
    hoursWorked: 0,
    type: 'GPS',
    status: 'absent',
  },
  {
    id: 'att-6',
    date: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
    checkIn: '09:10 AM',
    checkOut: '06:15 PM',
    hoursWorked: 9.08,
    type: 'GPS',
    status: 'present',
  },
  {
    id: 'att-7',
    date: new Date(Date.now() - 8 * 86400000).toISOString().split('T')[0],
    checkIn: '09:05 AM',
    checkOut: '06:20 PM',
    hoursWorked: 9.25,
    type: 'GPS',
    status: 'present',
  },
];

export const mockAttendanceSummary: AttendanceSummary = {
  present: 18,
  absent: 1,
  late: 2,
  halfDay: 1,
  totalHours: 168,
  onTimeRate: 88,
};

// ==========================================
// Leave Data
// ==========================================

export const mockLeaveBalance: LeaveBalance = {
  sick: 6,
  casual: 5,
  earned: 12,
  wfh: 8,
};

export const mockLeaveRequests: LeaveRequest[] = [
  {
    id: 'leave-1',
    type: 'wfh',
    startDate: '2026-05-25',
    endDate: '2026-05-25',
    reason: 'Plumber coming for home repairs',
    status: 'pending',
    appliedOn: '2026-05-20',
  },
  {
    id: 'leave-2',
    type: 'sick',
    startDate: '2026-05-18',
    endDate: '2026-05-18',
    reason: 'Medical appointment',
    status: 'approved',
    appliedOn: '2026-05-15',
    reviewedBy: 'Priya Patel',
    reviewedOn: '2026-05-16',
  },
  {
    id: 'leave-3',
    type: 'casual',
    startDate: '2026-05-10',
    endDate: '2026-05-10',
    reason: 'Personal work',
    status: 'approved',
    appliedOn: '2026-05-07',
    reviewedBy: 'Priya Patel',
    reviewedOn: '2026-05-08',
  },
  {
    id: 'leave-4',
    type: 'earned',
    startDate: '2026-04-20',
    endDate: '2026-04-25',
    reason: 'Family vacation',
    status: 'approved',
    appliedOn: '2026-04-10',
    reviewedBy: 'Priya Patel',
    reviewedOn: '2026-04-12',
  },
];

export const mockHolidays: Holiday[] = [
  { id: 'hol-1', name: 'Republic Day', date: '2026-01-26', type: 'national' },
  { id: 'hol-2', name: 'Holi', date: '2026-03-14', type: 'national' },
  { id: 'hol-3', name: 'Good Friday', date: '2026-04-03', type: 'national' },
  { id: 'hol-4', name: 'Independence Day', date: '2026-08-15', type: 'national' },
  { id: 'hol-5', name: 'Gandhi Jayanti', date: '2026-10-02', type: 'national' },
  { id: 'hol-6', name: 'Diwali', date: '2026-10-20', type: 'national' },
  { id: 'hol-7', name: 'Christmas', date: '2026-12-25', type: 'national' },
  { id: 'hol-8', name: 'Company Foundation Day', date: '2026-03-01', type: 'company' },
];

// ==========================================
// Payroll Data
// ==========================================

export const mockPayslips: Payslip[] = [
  {
    id: 'pay-1',
    month: 'May',
    year: 2026,
    basic: 45000,
    allowances: {
      hra: 18000,
      transport: 2000,
      medical: 1250,
      other: 3750,
      total: 25000,
    },
    deductions: {
      pf: 5400,
      esic: 1050,
      tds: 3500,
      other: 0,
      total: 9950,
    },
    grossPay: 70000,
    netPay: 60050,
    daysPaid: 31,
    status: 'pending',
    paymentDate: '2026-06-01',
  },
  {
    id: 'pay-2',
    month: 'April',
    year: 2026,
    basic: 45000,
    allowances: {
      hra: 18000,
      transport: 2000,
      medical: 1250,
      other: 3750,
      total: 25000,
    },
    deductions: {
      pf: 5400,
      esic: 1050,
      tds: 3500,
      other: 0,
      total: 9950,
    },
    grossPay: 70000,
    netPay: 60050,
    daysPaid: 30,
    status: 'paid',
    paymentDate: '2026-05-01',
  },
  {
    id: 'pay-3',
    month: 'March',
    year: 2026,
    basic: 42000,
    allowances: {
      hra: 16800,
      transport: 2000,
      medical: 1250,
      other: 3500,
      total: 23500,
    },
    deductions: {
      pf: 5040,
      esic: 980,
      tds: 3000,
      other: 0,
      total: 9020,
    },
    grossPay: 65500,
    netPay: 56480,
    daysPaid: 31,
    status: 'paid',
    paymentDate: '2026-04-01',
  },
];

export const mockTaxDetail: TaxDetail = {
  financialYear: '2025-26',
  totalIncome: 840000,
  totalDeductions: 180000,
  taxableIncome: 660000,
  taxSlab: '5,00,001 - 10,00,000',
  estimatedTax: 32500,
};

// ==========================================
// Benefits Data
// ==========================================

export const mockBenefits: Benefit[] = [
  {
    id: 'ben-1',
    title: 'Health Insurance',
    description: 'Comprehensive health coverage for you and your family',
    icon: '🏥',
    value: '₹5L coverage',
    category: 'health',
    status: 'active',
    expiry: '2027-01-15',
    partner: 'ICICI Lombard',
    coverage: '₹5,00,000',
  },
  {
    id: 'ben-2',
    title: 'Life Insurance',
    description: 'Term life insurance coverage',
    icon: '🛡️',
    value: '₹20L coverage',
    category: 'insurance',
    status: 'active',
    expiry: '2027-12-01',
    partner: 'HDFC Life',
    coverage: '₹20,00,000',
  },
  {
    id: 'ben-3',
    title: 'Gym & Fitness',
    description: 'Monthly fitness allowance',
    icon: '💪',
    value: '₹1,500/month',
    category: 'wellness',
    status: 'active',
    usagePercentage: 65,
    remainingValue: 9750,
  },
  {
    id: 'ben-4',
    title: 'Meal Allowance',
    description: 'Daily meal subsidy',
    icon: '🍽️',
    value: '₹500/day',
    category: 'meal',
    status: 'active',
    usagePercentage: 80,
    remainingValue: 6000,
  },
  {
    id: 'ben-5',
    title: 'Travel Allowance',
    description: 'Monthly travel stipend',
    icon: '🚗',
    value: '₹2,000/month',
    category: 'travel',
    status: 'active',
    remainingValue: 16000,
  },
  {
    id: 'ben-6',
    title: 'Learning & Development',
    description: 'Annual learning budget for courses and certifications',
    icon: '📚',
    value: '₹50,000/year',
    category: 'learning',
    status: 'active',
    usagePercentage: 30,
    remainingValue: 35000,
  },
  {
    id: 'ben-7',
    title: 'Mental Wellness',
    description: 'Therapy and counseling sessions',
    icon: '🧠',
    value: '6 sessions/year',
    category: 'wellness',
    status: 'active',
    usagePercentage: 33,
    remainingValue: 4,
  },
  {
    id: 'ben-8',
    title: 'Corporate Discounts',
    description: 'Discounts on partner brands',
    icon: '🏷️',
    value: '10-40% off',
    category: 'perks',
    status: 'active',
  },
];

export const mockPartnerOffers: PartnerOffer[] = [
  {
    id: 'offer-1',
    brand: 'Swiggy',
    brandIcon: '🍔',
    discount: '30% OFF',
    discountValue: 30,
    description: 'On your first 5 orders',
    expiry: '2026-06-30',
    category: 'food',
    claimUrl: 'https://swiggy.example.com/corpperks',
  },
  {
    id: 'offer-2',
    brand: 'Myntra',
    brandIcon: '👕',
    discount: '25% OFF',
    discountValue: 25,
    description: 'On all fashion items',
    expiry: '2026-06-15',
    category: 'shopping',
    claimUrl: 'https://myntra.example.com/corpperks',
  },
  {
    id: 'offer-3',
    brand: 'Practo',
    brandIcon: '🩺',
    discount: '20% OFF',
    discountValue: 20,
    description: 'On doctor consultations',
    expiry: '2026-12-31',
    category: 'health',
    claimUrl: 'https://practo.example.com/corpperks',
  },
  {
    id: 'offer-4',
    brand: 'Coursera',
    brandIcon: '🎓',
    discount: '40% OFF',
    discountValue: 40,
    description: 'Annual subscription',
    expiry: '2026-08-31',
    category: 'learning',
    claimUrl: 'https://coursera.example.com/corpperks',
  },
  {
    id: 'offer-5',
    brand: 'MakeMyTrip',
    brandIcon: '✈️',
    discount: '15% OFF',
    discountValue: 15,
    description: 'On flights and hotels',
    expiry: '2026-07-31',
    category: 'travel',
    claimUrl: 'https://mmt.example.com/corpperks',
  },
];

export const mockBenefitsSummary: BenefitsSummary = {
  totalValue: 150000,
  activeCount: 8,
  healthValue: 60000,
  wellnessValue: 25000,
  mealValue: 18000,
  travelValue: 24000,
  learningValue: 15000,
  insuranceValue: 8000,
};

// ==========================================
// CorpID Data
// ==========================================

export const mockTrustBadges: TrustBadge[] = [
  {
    id: 'badge-1',
    name: 'Identity Verified',
    icon: '✅',
    description: 'Government ID verified',
    earnedAt: '2024-01-15',
    category: 'verification',
  },
  {
    id: 'badge-2',
    name: 'Employment Verified',
    icon: '💼',
    description: 'Employment history confirmed',
    earnedAt: '2024-01-15',
    category: 'verification',
  },
  {
    id: 'badge-3',
    name: 'Education Verified',
    icon: '🎓',
    description: 'Educational credentials verified',
    earnedAt: '2024-02-01',
    category: 'verification',
  },
  {
    id: 'badge-4',
    name: 'High Performer',
    icon: '🌟',
    description: 'Top 10% performer badge',
    earnedAt: '2026-04-01',
    category: 'achievement',
  },
  {
    id: 'badge-5',
    name: 'Team Player',
    icon: '🤝',
    description: 'Excellent collaboration',
    earnedAt: '2026-03-15',
    category: 'achievement',
  },
  {
    id: 'badge-6',
    name: 'Quick Learner',
    icon: '📚',
    description: 'Completed 10+ courses',
    earnedAt: '2026-05-01',
    category: 'skills',
  },
];

export const mockCorpIDProfile: CorpIDProfile = {
  corpId: 'CI-IND-RAHUL-2024001',
  ciScore: 785,
  tier: 'Premium',
  scoreBreakdown: {
    identityScore: 95,
    employmentScore: 90,
    financialScore: 75,
    socialScore: 80,
    skillScore: 70,
  },
  verificationStatus: {
    identity: true,
    employment: true,
    education: true,
    skills: true,
    address: true,
    documents: true,
  },
  badges: mockTrustBadges,
  createdAt: '2024-01-15',
  lastUpdated: '2026-05-28',
};

// ==========================================
// Tasks Data
// ==========================================

export const mockTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Complete Q2 Architecture Review',
    description: 'Review and update system architecture for Q2',
    dueDate: new Date(Date.now() + 86400000).toISOString(),
    priority: 'high',
    status: 'in-progress',
    category: 'work',
    progress: 60,
    assignedBy: 'Priya Patel',
  },
  {
    id: 'task-2',
    title: 'Submit Performance Review',
    description: 'Complete self-assessment for annual review',
    dueDate: new Date(Date.now() + 3 * 86400000).toISOString(),
    priority: 'urgent',
    status: 'pending',
    category: 'deadline',
  },
  {
    id: 'task-3',
    title: 'Team Sync Meeting',
    description: 'Weekly engineering team sync',
    dueDate: new Date().toISOString(),
    priority: 'medium',
    status: 'pending',
    category: 'meeting',
  },
  {
    id: 'task-4',
    title: 'Update Documentation',
    description: 'Update API documentation for new endpoints',
    dueDate: new Date(Date.now() + 5 * 86400000).toISOString(),
    priority: 'low',
    status: 'pending',
    category: 'work',
  },
  {
    id: 'task-5',
    title: 'Code Review',
    description: 'Review PR #1234 - Payment integration',
    dueDate: new Date(Date.now() + 86400000).toISOString(),
    priority: 'high',
    status: 'pending',
    category: 'work',
  },
];

export const mockProductivityStats: ProductivityStats = {
  overallScore: 78,
  attendanceScore: 92,
  taskCompletionScore: 85,
  deadlineAdherenceScore: 76,
  teamRanking: {
    position: 5,
    total: 25,
  },
  weeklyInsights: [
    { day: 'Mon', productivity: 85 },
    { day: 'Tue', productivity: 72 },
    { day: 'Wed', productivity: 90 },
    { day: 'Thu', productivity: 68 },
    { day: 'Fri', productivity: 78 },
  ],
};

// ==========================================
// Financial Health Data (RidZa)
// ==========================================

export const mockFinancialHealth: FinancialHealth = {
  score: 72,
  incomeHealth: 85,
  debtHealth: 65,
  savingsHealth: 70,
  investmentHealth: 55,
  monthlyIncome: 70000,
  monthlyExpenses: 42000,
  savingsRate: 40,
  debtToIncomeRatio: 15,
};

export const mockSalaryAdvances: SalaryAdvance[] = [
  {
    id: 'adv-1',
    amount: 15000,
    requestedOn: '2026-04-15',
    status: 'disbursed',
    repaymentDate: '2026-05-15',
  },
  {
    id: 'adv-2',
    amount: 10000,
    requestedOn: '2026-03-10',
    status: 'disbursed',
    repaymentDate: '2026-04-10',
  },
];

// ==========================================
// Career Data
// ==========================================

export const mockCareerProgress: CareerProgress = {
  readinessScore: 75,
  promotionReadiness: 'In Progress',
  yearsInCurrentRole: 2.5,
  avgPerformanceScore: 4.2,
  skillsMatchPercentage: 80,
};

export const mockSkillGaps: SkillGap[] = [
  {
    skill: 'Cloud Architecture',
    currentLevel: 'intermediate',
    requiredLevel: 'advanced',
    gap: 'critical',
    recommendedCourses: [
      { id: 'c1', title: 'AWS Solutions Architect', provider: 'AWS', duration: '40 hours', level: 'Advanced', url: '#', free: false },
    ],
  },
  {
    skill: 'Team Leadership',
    currentLevel: 'basic',
    requiredLevel: 'intermediate',
    gap: 'moderate',
    recommendedCourses: [
      { id: 'c2', title: 'Leadership Fundamentals', provider: 'Coursera', duration: '20 hours', level: 'Intermediate', url: '#', free: true },
    ],
  },
  {
    skill: 'Data Engineering',
    currentLevel: 'intermediate',
    requiredLevel: 'intermediate',
    gap: 'met',
    recommendedCourses: [],
  },
  {
    skill: 'Project Management',
    currentLevel: 'basic',
    requiredLevel: 'intermediate',
    gap: 'moderate',
    recommendedCourses: [
      { id: 'c3', title: 'PMP Certification Prep', provider: 'PMI', duration: '35 hours', level: 'Intermediate', url: '#', free: false },
    ],
  },
];

export const mockCareerPath: CareerPath = {
  currentRole: 'Senior Software Engineer',
  nextRoles: [
    {
      role: 'Staff Engineer',
      timeToPromote: '12-18 months',
      skillsRequired: ['Cloud Architecture', 'Technical Leadership', 'System Design'],
      probability: 75,
    },
    {
      role: 'Tech Lead',
      timeToPromote: '6-12 months',
      skillsRequired: ['Team Leadership', 'Project Management', 'Communication'],
      probability: 80,
    },
    {
      role: 'Engineering Manager',
      timeToPromote: '18-24 months',
      skillsRequired: ['People Management', 'Strategic Thinking', 'Business Acumen'],
      probability: 50,
    },
  ],
  timeline: [
    { year: 2026, expectedRole: 'Senior Software Engineer' },
    { year: 2027, expectedRole: 'Tech Lead / Staff Engineer' },
    { year: 2028, expectedRole: 'Senior Tech Lead / Engineering Manager' },
  ],
};

export const mockInternalJobs: InternalJob[] = [
  {
    id: 'job-1',
    title: 'Staff Engineer',
    department: 'Engineering',
    location: 'Bangalore',
    type: 'full-time',
    experience: '6+ years',
    description: 'Lead technical architecture decisions across multiple teams',
    requirements: ['Cloud Architecture', 'System Design', 'Leadership'],
    postedOn: '2026-05-20',
    deadline: '2026-06-15',
    matchScore: 78,
  },
  {
    id: 'job-2',
    title: 'Tech Lead - Payments',
    department: 'Engineering',
    location: 'Bangalore',
    type: 'full-time',
    experience: '5+ years',
    description: 'Lead the payments team and drive technical decisions',
    requirements: ['Payment Systems', 'Team Leadership', 'SQL'],
    postedOn: '2026-05-18',
    deadline: '2026-06-10',
    matchScore: 85,
  },
  {
    id: 'job-3',
    title: 'Product Manager',
    department: 'Product',
    location: 'Remote',
    type: 'full-time',
    experience: '4+ years',
    description: 'Drive product strategy for core platform features',
    requirements: ['Product Management', 'Analytics', 'Communication'],
    postedOn: '2026-05-15',
    deadline: '2026-06-05',
    matchScore: 55,
  },
  {
    id: 'job-4',
    title: 'Engineering Manager',
    department: 'Engineering',
    location: 'Bangalore',
    type: 'full-time',
    experience: '7+ years',
    description: 'Manage and grow a team of 8-10 engineers',
    requirements: ['People Management', 'Technical Background', 'Agile'],
    postedOn: '2026-05-10',
    deadline: '2026-05-30',
    matchScore: 45,
  },
];

// ==========================================
// Additional Mock Data Helpers
// ==========================================

export const mockUpcomingEvents = [
  { id: 'evt-1', title: 'Team Meeting', time: '11:00 AM', date: 'Today', type: 'meeting' },
  { id: 'evt-2', title: 'Project Review', time: '03:00 PM', date: 'Tomorrow', type: 'work' },
  { id: 'evt-3', title: 'Sprint Planning', time: '10:00 AM', date: 'May 25', type: 'meeting' },
  { id: 'evt-4', title: 'Performance Review', time: '02:00 PM', date: 'May 28', type: 'personal' },
];

export const mockRecognitionReceived = [
  { id: 'rec-1', from: 'Priya Patel', message: 'Great work on the payment integration!', date: 'Today', type: 'kudos' },
  { id: 'rec-2', from: 'Amit Kumar', message: 'Thanks for the code review', date: 'Yesterday', type: 'thanks' },
];

export const mockAIInsights = [
  { type: 'productivity', title: 'Peak Hours', description: 'You\'re most productive between 10 AM - 12 PM', icon: '📈' },
  { type: 'engagement', title: 'Team Collaboration', description: '15 team collaborations this month', icon: '🤝' },
  { type: 'growth', title: 'Learning Streak', description: '3 courses completed this quarter!', icon: '🎓' },
];

export const mockQuickActions = [
  { id: 'qa-1', title: 'Check In', icon: '📍', color: '#8b5cf6' },
  { id: 'qa-2', title: 'Apply Leave', icon: '📝', color: '#22c55e' },
  { id: 'qa-3', title: 'View Payslip', icon: '💰', color: '#f59e0b' },
  { id: 'qa-4', title: 'Tasks', icon: '✅', color: '#3b82f6' },
  { id: 'qa-5', title: 'Benefits', icon: '🎁', color: '#ec4899' },
  { id: 'qa-6', title: 'AI Coach', icon: '🤖', color: '#6366f1' },
];

// ==========================================
// Opportunity Hub Mock Data
// ==========================================

export const mockOpportunities: import('../types').Opportunity[] = [
  // Internal Jobs
  {
    id: 'opp-1',
    type: 'internal_job',
    title: 'Staff Engineer',
    company: 'CorpPerks',
    department: 'Engineering',
    location: 'Bangalore',
    salary: '₹35-45 LPA',
    experience: '6+ years',
    description: 'Lead technical architecture decisions across multiple teams and drive engineering excellence.',
    requirements: ['Cloud Architecture', 'System Design', '10+ years experience', 'Leadership'],
    postedOn: '2026-05-20',
    deadline: '2026-06-15',
    matchScore: 78,
  },
  {
    id: 'opp-2',
    type: 'internal_job',
    title: 'Product Manager',
    company: 'CorpPerks',
    department: 'Product',
    location: 'Mumbai',
    salary: '₹28-35 LPA',
    experience: '4+ years',
    description: 'Drive product strategy for core platform features and user experience.',
    requirements: ['Product Management', 'Analytics', 'Communication', 'B2B SaaS experience'],
    postedOn: '2026-05-18',
    deadline: '2026-06-10',
    matchScore: 55,
  },
  // Gigs
  {
    id: 'opp-3',
    type: 'gig',
    title: 'UI Design for Mobile App Redesign',
    company: 'Marketing',
    department: 'Design',
    location: 'Remote',
    pay: '₹80,000',
    duration: '4 weeks',
    commitment: '15-20 hrs/week',
    description: 'Redesign the mobile app UI for our new product launch. Includes wireframes, prototypes, and final designs.',
    requirements: ['Figma', 'Mobile UI', 'Portfolio required', '3+ years experience'],
    postedOn: '2026-05-22',
    deadline: '2026-06-05',
    matchScore: 82,
  },
  {
    id: 'opp-4',
    type: 'gig',
    title: 'Data Analysis for Q2 Review',
    company: 'Finance',
    department: 'Analytics',
    location: 'Remote',
    pay: '₹50,000',
    duration: '2 weeks',
    commitment: '20 hrs/week',
    description: 'Analyze Q2 business metrics and prepare executive presentation.',
    requirements: ['SQL', 'Python', 'Data visualization', 'Excel'],
    postedOn: '2026-05-25',
    deadline: '2026-06-08',
    matchScore: 68,
  },
  // Mentorship
  {
    id: 'opp-5',
    type: 'mentorship',
    title: 'Learn React Native Development',
    company: 'Engineering',
    location: 'Remote',
    mentor: 'Rahul Sharma',
    duration: '3 months',
    commitment: '1 hr/week',
    description: 'Get 1-on-1 mentorship on React Native development, state management, and mobile app best practices.',
    requirements: ['Basic JavaScript', 'Interest in mobile development', 'Commit 2 hrs/week'],
    postedOn: '2026-05-15',
    deadline: '2026-06-30',
    matchScore: 90,
  },
  {
    id: 'opp-6',
    type: 'mentorship',
    title: 'Career Growth & Leadership',
    company: 'HR',
    location: 'In-person',
    mentor: 'Priya Patel',
    duration: '6 months',
    commitment: '30 min/week',
    description: 'Guidance on career transitions, leadership skills, and professional development.',
    requirements: ['Mid-senior level', 'Interest in leadership', 'Open to feedback'],
    postedOn: '2026-05-10',
    deadline: '2026-07-15',
    matchScore: 75,
  },
  // Advisory
  {
    id: 'opp-7',
    type: 'advisory',
    title: 'Technical Advisor - AI Initiatives',
    company: 'TechStartup XYZ',
    location: 'Remote',
    equity: '0.5%',
    commitment: '4 hrs/month',
    description: 'Provide strategic guidance on AI/ML implementation and technical architecture for a Series A startup.',
    requirements: ['10+ years experience', 'AI/ML expertise', 'Startup experience preferred'],
    postedOn: '2026-05-18',
    deadline: '2026-06-20',
    matchScore: 40,
  },
  // Freelance
  {
    id: 'opp-8',
    type: 'freelance',
    title: 'Website Development for NGO Partner',
    company: 'CSR Initiative',
    location: 'Remote',
    pay: '₹1,20,000',
    duration: '6 weeks',
    commitment: '20 hrs/week',
    description: 'Build a donation portal and volunteer management website for our CSR partner NGO.',
    requirements: ['React/Next.js', 'Payment integration', 'NGO project experience'],
    postedOn: '2026-05-20',
    deadline: '2026-06-15',
    matchScore: 65,
  },
  // Part-time
  {
    id: 'opp-9',
    type: 'part_time',
    title: 'Content Writer - Tech Blog',
    company: 'CorpPerks',
    department: 'Marketing',
    location: 'Remote',
    pay: '₹25,000/month',
    commitment: '10 hrs/week',
    description: 'Write technical blog posts about engineering practices, culture, and innovation.',
    requirements: ['Strong English', 'Technical background', 'Blogging experience'],
    postedOn: '2026-05-24',
    deadline: '2026-06-10',
    matchScore: 72,
  },
];

export const mockApplications: import('../types').OpportunityApplication[] = [
  {
    id: 'app-1',
    opportunityId: 'opp-3',
    opportunityTitle: 'UI Design for Mobile App Redesign',
    opportunityType: 'gig',
    appliedOn: '2026-05-23',
    status: 'screening',
    notes: 'Your profile matches 82% of requirements',
  },
  {
    id: 'app-2',
    opportunityId: 'opp-9',
    opportunityTitle: 'Content Writer - Tech Blog',
    opportunityType: 'part_time',
    appliedOn: '2026-05-25',
    status: 'interview',
    notes: 'Interview scheduled for June 2nd',
  },
];

// ==========================================
// Wealth Dashboard Mock Data
// ==========================================

export const mockWealthData: import('../types').WealthData = {
  netWorth: 12500000,
  monthlyIncome: 70000,
  monthlyExpenses: 42000,
  savingsRate: 40,
  retirementScore: 68,
  retirementAge: 60,
  retirementCorpus: 8500000,
  targetCorpus: 12000000,
  properties: [
    {
      id: 'prop-1',
      type: 'apartment',
      name: '2BHK in Whitefield',
      address: 'Prestige Alpha, Whitefield, Bangalore',
      purchaseValue: 6500000,
      currentValue: 8500000,
      ownership: 100,
      rentalIncome: 28000,
      emi: 45000,
      emiRemaining: 156,
    },
    {
      id: 'prop-2',
      type: 'land',
      name: 'Plot in Mysore Road',
      address: 'Mysore Road, Bangalore',
      purchaseValue: 2000000,
      currentValue: 3200000,
      ownership: 50,
    },
  ],
  investments: [
    {
      id: 'inv-1',
      type: 'mutual_funds',
      name: 'HDFC Top 100 Fund',
      provider: 'HDFC AMC',
      amount: 500000,
      currentValue: 680000,
      returns: 180000,
      returnsPercent: 36,
      lastUpdated: '2026-05-28',
    },
    {
      id: 'inv-2',
      type: 'stocks',
      name: 'Tech Portfolio',
      provider: 'Zerodha',
      amount: 300000,
      currentValue: 425000,
      returns: 125000,
      returnsPercent: 41.7,
      lastUpdated: '2026-05-28',
    },
    {
      id: 'inv-3',
      type: 'ppf',
      name: 'Public Provident Fund',
      provider: 'SBI',
      amount: 150000,
      currentValue: 195000,
      returns: 45000,
      returnsPercent: 30,
      lastUpdated: '2026-03-31',
    },
    {
      id: 'inv-4',
      type: 'fixed_deposit',
      name: 'Fixed Deposit',
      provider: 'HDFC Bank',
      amount: 500000,
      currentValue: 545000,
      returns: 45000,
      returnsPercent: 9,
      lastUpdated: '2026-05-01',
    },
    {
      id: 'inv-5',
      type: 'nps',
      name: 'NPS Tier-1',
      provider: 'CRA',
      amount: 100000,
      currentValue: 145000,
      returns: 45000,
      returnsPercent: 45,
      lastUpdated: '2026-04-30',
    },
    {
      id: 'inv-6',
      type: 'gold',
      name: 'Gold ETFs',
      provider: 'SBI Gold ETF',
      amount: 200000,
      currentValue: 235000,
      returns: 35000,
      returnsPercent: 17.5,
      lastUpdated: '2026-05-28',
    },
  ],
  insurance: [
    {
      id: 'ins-1',
      type: 'term',
      name: 'Term Life Insurance',
      provider: 'HDFC Life',
      sumAssured: 10000000,
      premium: 12000,
      premiumFrequency: 'yearly',
      nextDueDate: '2026-12-15',
      maturityDate: '2045-12-15',
      status: 'active',
    },
    {
      id: 'ins-2',
      type: 'health',
      name: 'Health Insurance - Family Floater',
      provider: 'ICICI Lombard',
      sumAssured: 500000,
      premium: 25000,
      premiumFrequency: 'yearly',
      nextDueDate: '2026-08-20',
      status: 'active',
    },
  ],
};

export const mockRetirementProjection: import('../types').RetirementProjection = {
  currentAge: 28,
  retirementAge: 60,
  currentSavings: 1200000,
  monthlyContribution: 25000,
  expectedReturns: 12,
  inflationRate: 6,
  targetCorpus: 12000000,
  projectedCorpus: 15000000,
  gap: -3000000,
};

// ==========================================
// Manager Intelligence Mock Data
// ==========================================

export const mockTeamHealth: import('../types').TeamHealth = {
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

export const mockBurnoutAlerts: import('../types').BurnoutAlert[] = [
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

export const mockAttritionRisks: import('../types').AttritionRisk[] = [
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

// ==========================================
// Professional Passport Mock Data
// ==========================================

export const mockProfessionalPassport: import('../types').ProfessionalPassport = {
  employeeId: 'EMP001',
  careerTimeline: [
    { id: 'evt-1', type: 'milestone', title: 'Joined CorpPerks', description: 'Started as Software Engineer', date: '2023-01-15', company: 'CorpPerks', verified: true },
    { id: 'evt-2', type: 'project', title: 'Payment Gateway Integration', description: 'Led Razorpay integration for 10+ merchants', date: '2023-06-15', company: 'CorpPerks', verified: true },
    { id: 'evt-3', type: 'certification', title: 'AWS Solutions Architect', description: 'Completed AWS certification', date: '2023-09-01', company: 'CorpPerks', verified: true },
    { id: 'evt-4', type: 'award', title: 'Best Team Player Award', description: 'Recognized for excellent collaboration', date: '2024-01-10', company: 'CorpPerks', verified: true },
    { id: 'evt-5', type: 'promotion', title: 'Promoted to Senior Engineer', description: 'Recognized for technical leadership', date: '2024-03-01', company: 'CorpPerks', verified: true },
    { id: 'evt-6', type: 'project', title: 'REZ Platform Migration', description: 'Led 3-team migration to REZ infrastructure', date: '2024-08-15', company: 'CorpPerks', verified: true },
    { id: 'evt-7', type: 'role_change', title: 'Tech Lead - Payments', description: 'Transitioned to tech lead role', date: '2025-01-01', company: 'CorpPerks', verified: true },
    { id: 'evt-8', type: 'certification', title: 'Google Cloud Professional', description: 'Completed GCP certification', date: '2025-04-15', company: 'CorpPerks', verified: true },
  ],
  projectsDelivered: [
    {
      id: 'proj-1',
      name: 'Payment Gateway Integration',
      description: 'Integrated Razorpay, Paytm, and UPI for merchant checkout',
      role: 'Lead Developer',
      startDate: '2023-03-01',
      endDate: '2023-08-15',
      status: 'completed',
      impact: '40% increase in payment success rate',
      technologies: ['Node.js', 'Razorpay API', 'PostgreSQL'],
      teamSize: 4,
    },
    {
      id: 'proj-2',
      name: 'REZ Platform Migration',
      description: 'Migrated legacy systems to REZ infrastructure',
      role: 'Technical Lead',
      startDate: '2024-06-01',
      endDate: '2024-12-31',
      status: 'completed',
      impact: '60% reduction in infrastructure costs',
      technologies: ['React', 'Node.js', 'MongoDB', 'Redis'],
      teamSize: 8,
    },
    {
      id: 'proj-3',
      name: 'Mobile App - MyTalent',
      description: 'Building the MyTalent employee super app',
      role: 'Senior Engineer',
      startDate: '2025-02-01',
      status: 'in-progress',
      impact: 'Serving 5000+ employees',
      technologies: ['React Native', 'TypeScript', 'Zustand'],
      teamSize: 6,
    },
  ],
  promotions: [
    { id: 'promo-1', previousRole: 'Software Engineer', newRole: 'Senior Software Engineer', date: '2024-03-01', reason: 'Technical excellence & leadership', verified: true },
  ],
  skills: [
    { skill: 'JavaScript', level: 'expert', acquiredDate: '2018-06-01', lastUsed: '2026-05-28', endorsements: 25 },
    { skill: 'TypeScript', level: 'advanced', acquiredDate: '2020-03-01', lastUsed: '2026-05-28', endorsements: 20 },
    { skill: 'React', level: 'advanced', acquiredDate: '2019-08-01', lastUsed: '2026-05-28', endorsements: 22 },
    { skill: 'Node.js', level: 'advanced', acquiredDate: '2019-01-01', lastUsed: '2026-05-28', endorsements: 18 },
    { skill: 'AWS', level: 'intermediate', acquiredDate: '2023-09-01', lastUsed: '2026-05-20', endorsements: 12 },
    { skill: 'System Design', level: 'advanced', acquiredDate: '2022-06-01', lastUsed: '2026-05-28', endorsements: 15 },
    { skill: 'Team Leadership', level: 'intermediate', acquiredDate: '2024-01-01', lastUsed: '2026-05-28', endorsements: 10 },
  ],
  certifications: [
    { id: 'cert-1', name: 'AWS Solutions Architect Associate', provider: 'Amazon Web Services', issuedDate: '2023-09-01', credentialId: 'AWS-SAA-12345', verified: true },
    { id: 'cert-2', name: 'Google Cloud Professional Developer', provider: 'Google', issuedDate: '2025-04-15', credentialId: 'GCP-PCD-67890', verified: true },
    { id: 'cert-3', name: 'MongoDB Certified Developer', provider: 'MongoDB', issuedDate: '2022-12-01', credentialId: 'MCD-11111', verified: true },
  ],
  leadershipScore: 78,
  collaborationScore: 92,
  reliabilityScore: 88,
  trustScore: 95,
};

export const mockReputationScores: import('../types').ReputationScores = {
  reliability: 88,
  leadership: 78,
  collaboration: 92,
  delivery: 85,
  learning: 82,
  trust: 95,
  overall: 86,
};

export const mockReputationHistory: import('../types').ReputationHistory[] = [
  { date: '2026-03', reliability: 85, leadership: 72, collaboration: 88, delivery: 80, learning: 75, trust: 93 },
  { date: '2026-04', reliability: 86, leadership: 74, collaboration: 90, delivery: 82, learning: 78, trust: 94 },
  { date: '2026-05', reliability: 88, leadership: 78, collaboration: 92, delivery: 85, learning: 82, trust: 95 },
];
