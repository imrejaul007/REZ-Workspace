/**
 * TalentOS - Complete App Structure
 * Built: May 31, 2026
 */

/**
 * MyTalent OS - Complete Employee Lifecycle OS
 * All modules, integrations, AI agents
 */

// ==================== MODULES ====================

/**
 * 1. CORE HR MODULES
 */

// Attendance & Leave
interface LeaveBalance {
  casual: number;
  sick: number;
  earned: number;
  unpaid: number;
}

interface AttendanceRecord {
  userId: string;
  date: Date;
  checkIn: string;
  checkOut: string;
  hoursWorked: number;
  location: { lat: number; lng: number };
  device: string;
}

// ==================== DEPARTMENTS ====================

/**
 * All departments covered
 */

const DEPARTMENTS = [
  'Engineering',
  'Sales',
  'Marketing',
  'HR',
  'Finance',
  'Operations',
  'Legal',
  'Support',
  'Product',
  'Design'
];

/**
 * Role hierarchy
 */

const ROLES = {
  // Leadership
  CEO: ['all'],
  CFO: ['finance', 'reports'],
  CTO: ['engineering', 'product'],
  COO: ['operations'],
  CMO: ['marketing', 'sales'],

  // Managers
  Engineering_Manager: ['team', 'projects'],
  Sales_Manager: ['leads', 'targets'],

  // IC
  Engineer: ['tasks', 'attendance'],
  Sales_Rep: ['leads', 'opportunities'],

  // HR
  HR_Lead: ['employees', 'policies'],
  Recruiter: ['candidates', 'interviews'],

  // Finance
  Accountant: ['invoices', 'expenses'],
  Finance_Analyst: ['reports', 'forecasts']
};

/**
 * Permissions matrix
 */

const PERMISSIONS = {
  leave: {
    apply: ['employee', 'manager', 'admin'],
    approve: ['manager', 'admin'],
    reports: ['manager', 'admin', 'finance']
  },
  attendance: {
    checkIn: ['employee'],
    view: ['employee'],
    reports: ['manager', 'admin']
  },
  payroll: {
    view: ['employee'],
    process: ['finance'],
    reports: ['admin', 'finance']
  }
};

/**
 * Leave workflows
 */

const LEAVE_WORKFLOW = {
  apply: 'employee',
  manager_approval: 'manager',
  hr_review: 'hr_lead',
  final_approval: 'admin'
};

/**
 * Attendance modes
 */

const ATTENDANCE_MODES = [
  { id: 'gps', label: 'GPS Check-in' },
  { id: 'qr', label: 'QR Code' },
  { id: 'wifi', label: 'WiFi Check-in' },
  { id: 'manual', label: 'Manual' }
];

/**
 * Expense categories
 */

const EXPENSE_CATEGORIES = [
  'Travel',
  'Food',
  'Software',
  'Hardware',
  'Training',
  'Office Supplies',
  'Client Entertainment'
];

/**
 * Integration status
 */

const INTEGRATIONS = [
  { name: 'HOJAI Memory', icon: '🧠' },
  { name: 'WhatsApp Business', icon: '💬' },
  { name: 'Google Workspace', icon: '📅' },
  { name: 'CorpID', icon: '🔐' }
];

/**
 * AI Agents available
 */

const AI_AGENTS = [
  { name: 'Recruiter', capabilities: ['source', 'screen', 'schedule'] },
  { name: 'HR Helpdesk', capabilities: ['faq', 'leave', 'policy'] },
  { name: 'Payroll', capabilities: ['calculate', 'disburse', 'reports'] },
  { name: 'Career Coach', capabilities: ['path', 'skills', 'interview'] }
];

export {
  DEPARTMENTS,
  ROLES,
  PERMISSIONS,
  LEAVE_WORKFLOW,
  ATTENDANCE_MODES,
  EXPENSE_CATEGORIES,
  INTEGRATIONS,
  AI_AGENTS
};
