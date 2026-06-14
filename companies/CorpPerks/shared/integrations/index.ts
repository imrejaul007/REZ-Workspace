/**
 * CorpPerks Unified Integration Hub
 * Connects all services, bridges, and external APIs
 */

// ============================================================
// SERVICE CLIENTS
// ============================================================

import { create } from 'zustand';

// API Base URLs - Update for production
const API = {
  gateway: process.env.API_GATEWAY_URL || 'http://localhost:4700',
  backend: process.env.BACKEND_URL || 'http://localhost:4006',

  // HR Services
  projectos: process.env.PROJECTOS_URL || 'http://localhost:4715',
  teamCollab: process.env.TEAM_COLLAB_URL || 'http://localhost:4716',
  meeting: process.env.MEETING_URL || 'http://localhost:4728',
  performance: process.env.PERFORMANCE_URL || 'http://localhost:4729',
  okr: process.env.OKR_URL || 'http://localhost:4730',
  workflow: process.env.WORKFLOW_URL || 'http://localhost:4731',
  onboarding: process.env.ONBOARDING_URL || 'http://localhost:4732',
  exit: process.env.EXIT_URL || 'http://localhost:4733',
  lms: process.env.LMS_URL || 'http://localhost:4734',
  reports: process.env.REPORTS_URL || 'http://localhost:4735',
  calendar: process.env.CALENDAR_URL || 'http://localhost:4736',
  sso: process.env.SSO_URL || 'http://localhost:4737',
  payroll: process.env.PAYROLL_URL || 'http://localhost:4738',
  shift: process.env.SHIFT_URL || 'http://localhost:4739',
  compensation: process.env.COMPENSATION_URL || 'http://localhost:4740',
  document: process.env.DOCUMENT_URL || 'http://localhost:4741',
  video: process.env.VIDEO_URL || 'http://localhost:4742',

  // CRM
  corpCrm: process.env.CORP_CRM_URL || 'http://localhost:4725',

  // Analytics
  analytics: process.env.ANALYTICS_URL || 'http://localhost:4744',
  push: process.env.PUSH_URL || 'http://localhost:4743',
  whatsapp: process.env.WHATSAPP_URL || 'http://localhost:4745',

  // CorpID
  corpId: process.env.CORPID_URL || 'http://localhost:4701',
  corpIdProfile: process.env.CORPID_PROFILE_URL || 'http://localhost:4723',

  // CorpPerks Intel
  corpIntel: process.env.CORP_INTEL_URL || 'http://localhost:4135',
};

// External Services
const EXTERNAL = {
  // RABTUL Services
  rabtul: {
    auth: process.env.RABTUL_AUTH_URL || 'https://rez-auth-service.onrender.com',
    profile: process.env.RABTUL_PROFILE_URL || 'https://rez-profile-service.onrender.com',
    wallet: process.env.RABTUL_WALLET_URL || 'https://rez-wallet-service.onrender.com',
    payment: process.env.RABTUL_PAYMENT_URL || 'https://rez-payment-service.onrender.com',
    notification: process.env.RABTUL_NOTIFICATION_URL || 'https://rez-notifications-service.onrender.com',
  },

  // REZ Merchant
  rezMerchant: process.env.REZ_MERCHANT_URL || 'http://localhost:4008',

  // REZ Intelligence
  rezIntelligence: {
    intent: process.env.REZ_INTENT_URL || 'http://localhost:4018',
    predictive: process.env.REZ_PREDICTIVE_URL || 'http://localhost:4123',
    signal: process.env.REZ_SIGNAL_URL || 'http://localhost:4142',
    identity: process.env.REZ_IDENTITY_URL || 'http://localhost:4050',
  },

  // Hojai AI
  hojai: {
    agents: process.env.HOJAI_AGENTS_URL || 'http://localhost:4550',
    communications: process.env.HOJAI_COMM_URL || 'http://localhost:4590',
    flow: process.env.HOJAI_FLOW_URL || 'http://localhost:4560',
  },

  // RidZa
  ridza: process.env.RIDZA_URL || 'http://localhost:4600',

  // RisnaEstate
  risnaEstate: process.env.RISNAESTATE_URL || 'http://localhost:4700',
};

// ============================================================
// HTTP CLIENT WITH AUTH
// ============================================================

let authToken: string | null = null;

export const setAuthToken = (token: string) => {
  authToken = token;
};

export const apiRequest = async (
  url: string,
  options: RequestInit = {}
): Promise<any> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
};

// ============================================================
// SERVICE INTEGRATIONS
// ============================================================

export const integrations = {
  // ----------------------------------------
  // Core Services
  // ----------------------------------------

  backend: {
    // Employee Management
    getEmployees: () => apiRequest(`${API.backend}/api/employees`),
    getEmployee: (id: string) => apiRequest(`${API.backend}/api/employees/${id}`),
    createEmployee: (data: any) => apiRequest(`${API.backend}/api/employees`, { method: 'POST', body: JSON.stringify(data) }),
    updateEmployee: (id: string, data: any) => apiRequest(`${API.backend}/api/employees/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

    // Attendance
    getAttendance: (date?: string) => apiRequest(`${API.backend}/api/attendance${date ? `?date=${date}` : ''}`),
    markAttendance: (data: any) => apiRequest(`${API.backend}/api/attendance`, { method: 'POST', body: JSON.stringify(data) }),

    // Leave
    getLeaves: () => apiRequest(`${API.backend}/api/leaves`),
    applyLeave: (data: any) => apiRequest(`${API.backend}/api/leaves`, { method: 'POST', body: JSON.stringify(data) }),
    approveLeave: (id: string) => apiRequest(`${API.backend}/api/leaves/${id}/approve`, { method: 'POST' }),

    // Shifts
    getShifts: () => apiRequest(`${API.backend}/api/shifts`),
    assignShift: (data: any) => apiRequest(`${API.backend}/api/shifts`, { method: 'POST', body: JSON.stringify(data) }),
  },

  // ----------------------------------------
  // ProjectOS
  // ----------------------------------------

  projectOS: {
    getProjects: () => apiRequest(`${API.projectos}/api/projects`),
    getProject: (id: string) => apiRequest(`${API.projectos}/api/projects/${id}`),
    createProject: (data: any) => apiRequest(`${API.projectos}/api/projects`, { method: 'POST', body: JSON.stringify(data) }),
    getTasks: (projectId: string) => apiRequest(`${API.projectos}/api/projects/${projectId}/tasks`),
    createTask: (projectId: string, data: any) => apiRequest(`${API.projectos}/api/projects/${projectId}/tasks`, { method: 'POST', body: JSON.stringify(data) }),

    // AI Predictions
    getDelayPrediction: (projectId: string) => apiRequest(`${API.projectos}/api/ai/delay-prediction/${projectId}`),
    getRiskAnalysis: (projectId: string) => apiRequest(`${API.projectos}/api/ai/risk-analysis/${projectId}`),
    getDeliveryForecast: (projectId: string) => apiRequest(`${API.projectos}/api/ai/delivery-forecast/${projectId}`),
  },

  // ----------------------------------------
  // Team Collaboration
  // ----------------------------------------

  teamCollab: {
    // Channels
    getChannels: () => apiRequest(`${API.teamCollab}/api/channels`),
    createChannel: (data: any) => apiRequest(`${API.teamCollab}/api/channels`, { method: 'POST', body: JSON.stringify(data) }),

    // Messages
    getMessages: (channelId: string) => apiRequest(`${API.teamCollab}/api/channels/${channelId}/messages`),
    sendMessage: (channelId: string, content: string) => apiRequest(`${API.teamCollab}/api/channels/${channelId}/messages`, { method: 'POST', body: JSON.stringify({ content }) }),

    // Announcements
    getAnnouncements: () => apiRequest(`${API.teamCollab}/api/announcements`),
    createAnnouncement: (data: any) => apiRequest(`${API.teamCollab}/api/announcements`, { method: 'POST', body: JSON.stringify(data) }),

    // Meetings
    getMeetings: () => apiRequest(`${API.teamCollab}/api/meetings`),
    createMeeting: (data: any) => apiRequest(`${API.teamCollab}/api/meetings`, { method: 'POST', body: JSON.stringify(data) }),
  },

  // ----------------------------------------
  // 1:1 Meetings
  // ----------------------------------------

  meeting: {
    getOneOnOnes: () => apiRequest(`${API.meeting}/api/1on1`),
    scheduleOneOnOne: (data: any) => apiRequest(`${API.meeting}/api/1on1/schedule`, { method: 'POST', body: JSON.stringify(data) }),
    addNote: (meetingId: string, note: string) => apiRequest(`${API.meeting}/api/1on1/${meetingId}/note`, { method: 'POST', body: JSON.stringify({ note }) }),
    addActionItem: (meetingId: string, data: any) => apiRequest(`${API.meeting}/api/1on1/${meetingId}/action-item`, { method: 'POST', body: JSON.stringify(data) }),
  },

  // ----------------------------------------
  // Performance
  // ----------------------------------------

  performance: {
    // Cycles
    getCycles: () => apiRequest(`${API.performance}/api/reviews/cycles`),
    createCycle: (data: any) => apiRequest(`${API.performance}/api/reviews/cycles`, { method: 'POST', body: JSON.stringify(data) }),

    // Reviews
    getReviews: () => apiRequest(`${API.performance}/api/reviews`),
    submitReview: (data: any) => apiRequest(`${API.performance}/api/reviews`, { method: 'POST', body: JSON.stringify(data) }),
    updateRating: (reviewId: string, rating: any) => apiRequest(`${API.performance}/api/reviews/${reviewId}/rating`, { method: 'PATCH', body: JSON.stringify(rating) }),

    // Goals
    getGoals: () => apiRequest(`${API.performance}/api/goals`),
    createGoal: (data: any) => apiRequest(`${API.performance}/api/goals`, { method: 'POST', body: JSON.stringify(data) }),
    updateProgress: (goalId: string, progress: number) => apiRequest(`${API.performance}/api/goals/${goalId}/progress`, { method: 'PATCH', body: JSON.stringify({ progress }) }),

    // 360 Feedback
    submitFeedback: (data: any) => apiRequest(`${API.performance}/api/feedback`, { method: 'POST', body: JSON.stringify(data) }),
  },

  // ----------------------------------------
  // OKRs
  // ----------------------------------------

  okr: {
    getObjectives: () => apiRequest(`${API.okr}/api/objectives`),
    createObjective: (data: any) => apiRequest(`${API.okr}/api/objectives`, { method: 'POST', body: JSON.stringify(data) }),
    updateProgress: (objectiveId: string, progress: number) => apiRequest(`${API.okr}/api/objectives/${objectiveId}/progress`, { method: 'PATCH', body: JSON.stringify({ progress }) }),
    getDashboard: () => apiRequest(`${API.okr}/api/objectives/dashboard`),
  },

  // ----------------------------------------
  // Payroll
  // ----------------------------------------

  payroll: {
    getPayslips: (employeeId: string) => apiRequest(`${API.payroll}/api/payroll/payslips/${employeeId}`),
    getPayslip: (payslipId: string) => apiRequest(`${API.payroll}/api/payroll/payslip/${payslipId}`),
    requestAdvance: (data: any) => apiRequest(`${API.payroll}/api/payroll/advance`, { method: 'POST', body: JSON.stringify(data) }),
    getTaxDeclarations: (employeeId: string) => apiRequest(`${API.payroll}/api/tax/declarations/${employeeId}`),
    submitTaxDeclaration: (data: any) => apiRequest(`${API.payroll}/api/tax/declarations`, { method: 'POST', body: JSON.stringify(data) }),
    getReimbursements: (employeeId: string) => apiRequest(`${API.payroll}/api/reimbursements/${employeeId}`),
    submitReimbursement: (data: any) => apiRequest(`${API.payroll}/api/reimbursements`, { method: 'POST', body: JSON.stringify(data) }),
  },

  // ----------------------------------------
  // LMS
  // ----------------------------------------

  lms: {
    getCourses: () => apiRequest(`${API.lms}/api/courses`),
    getCourse: (id: string) => apiRequest(`${API.lms}/api/courses/${id}`),
    enroll: (courseId: string) => apiRequest(`${API.lms}/api/enrollments`, { method: 'POST', body: JSON.stringify({ courseId }) }),
    getEnrollments: () => apiRequest(`${API.lms}/api/enrollments/my`),
    updateProgress: (enrollmentId: string, progress: number) => apiRequest(`${API.lms}/api/enrollments/${enrollmentId}/progress`, { method: 'PATCH', body: JSON.stringify({ progress }) }),
    completeCourse: (enrollmentId: string) => apiRequest(`${API.lms}/api/enrollments/${enrollmentId}/complete`, { method: 'POST' }),
    getCertificates: () => apiRequest(`${API.lms}/api/certificates/my`),
  },

  // ----------------------------------------
  // CRM
  // ----------------------------------------

  crm: {
    // Clients
    getClients: () => apiRequest(`${API.corpCrm}/api/clients`),
    getClient: (id: string) => apiRequest(`${API.corpCrm}/api/clients/${id}`),
    createClient: (data: any) => apiRequest(`${API.corpCrm}/api/clients`, { method: 'POST', body: JSON.stringify(data) }),

    // Deals
    getDeals: () => apiRequest(`${API.corpCrm}/api/deals`),
    createDeal: (data: any) => apiRequest(`${API.corpCrm}/api/deals`, { method: 'POST', body: JSON.stringify(data) }),
    updateDealStage: (dealId: string, stage: string) => apiRequest(`${API.corpCrm}/api/deals/${dealId}/stage`, { method: 'POST', body: JSON.stringify({ stage }) }),
    getPipeline: () => apiRequest(`${API.corpCrm}/api/deals/pipeline`),

    // Invoices
    getInvoices: () => apiRequest(`${API.corpCrm}/api/invoices`),
    createInvoice: (data: any) => apiRequest(`${API.corpCrm}/api/invoices`, { method: 'POST', body: JSON.stringify(data) }),
    markInvoicePaid: (invoiceId: string) => apiRequest(`${API.corpCrm}/api/invoices/${invoiceId}/mark-paid`, { method: 'POST' }),
  },

  // ----------------------------------------
  // CorpID
  // ----------------------------------------

  corpId: {
    getIdentity: (userId: string) => apiRequest(`${API.corpId}/api/identity/${userId}`),
    getCIScore: (userId: string) => apiRequest(`${API.corpId}/api/ci-score/${userId}`),
    getVerificationStatus: (userId: string) => apiRequest(`${API.corpId}/api/verification/${userId}`),
    getPassport: (userId: string) => apiRequest(`${API.corpId}/api/passport/${userId}`),
    getTrustReport: (userId: string) => apiRequest(`${API.corpId}/api/trust-report/${userId}`),
  },

  // ----------------------------------------
  // CorpPerks Intel (AI)
  // ----------------------------------------

  intel: {
    getDecisionCards: () => apiRequest(`${API.corpIntel}/api/decisions/cards`),
    getHealthScore: (companyId: string) => apiRequest(`${API.corpIntel}/api/health-score/${companyId}`),
    getForecasts: (type: string) => apiRequest(`${API.corpIntel}/api/forecasts/${type}`),
    getAnomalies: () => apiRequest(`${API.corpIntel}/api/anomalies`),
    chatWithCopilot: (message: string) => apiRequest(`${API.corpIntel}/api/copilot/chat`, { method: 'POST', body: JSON.stringify({ message }) }),
  },

  // ----------------------------------------
  // Push Notifications
  // ----------------------------------------

  push: {
    sendNotification: (data: any) => apiRequest(`${API.push}/api/notifications/send`, { method: 'POST', body: JSON.stringify(data) }),
    getNotifications: (userId: string) => apiRequest(`${API.push}/api/notifications/${userId}`),
    markAsRead: (notificationId: string) => apiRequest(`${API.push}/api/notifications/${notificationId}/read`, { method: 'PATCH' }),
    updatePreferences: (data: any) => apiRequest(`${API.push}/api/notifications/preferences`, { method: 'POST', body: JSON.stringify(data) }),
  },

  // ----------------------------------------
  // WhatsApp
  // ----------------------------------------

  whatsapp: {
    sendMessage: (data: any) => apiRequest(`${API.whatsapp}/api/whatsapp/send`, { method: 'POST', body: JSON.stringify(data) }),
    subscribe: (phone: string) => apiRequest(`${API.whatsapp}/api/whatsapp/subscribe`, { method: 'POST', body: JSON.stringify({ phone }) }),
    sendLeaveNotification: (phone: string, status: string) => apiRequest(`${API.whatsapp}/api/whatsapp/notifications/leave`, { method: 'POST', body: JSON.stringify({ phone, status }) }),
    sendAttendanceNotification: (phone: string, status: string) => apiRequest(`${API.whatsapp}/api/whatsapp/notifications/attendance`, { method: 'POST', body: JSON.stringify({ phone, status }) }),
  },
};

// ============================================================
// EXTERNAL SERVICE INTEGRATIONS
// ============================================================

export const externalIntegrations = {
  // ----------------------------------------
  // RABTUL Services
  // ----------------------------------------

  rabtul: {
    auth: {
      login: (email: string, password: string) => apiRequest(`${EXTERNAL.rabtul.auth}/api/auth/login`, { method: 'POST', body: JSON.stringify({ email, password }) }),
      verifyOTP: (phone: string, otp: string) => apiRequest(`${EXTERNAL.rabtul.auth}/api/auth/verify-otp`, { method: 'POST', body: JSON.stringify({ phone, otp }) }),
      refreshToken: (token: string) => apiRequest(`${EXTERNAL.rabtul.auth}/api/auth/refresh`, { method: 'POST', body: JSON.stringify({ token }) }),
    },

    profile: {
      get: (userId: string) => apiRequest(`${EXTERNAL.rabtul.profile}/api/profiles/${userId}`),
      update: (userId: string, data: any) => apiRequest(`${EXTERNAL.rabtul.profile}/api/profiles/${userId}`, { method: 'PATCH', body: JSON.stringify(data) }),
      getByPhone: (phone: string) => apiRequest(`${EXTERNAL.rabtul.profile}/api/profiles/phone/${phone}`),
    },

    wallet: {
      getBalance: (userId: string) => apiRequest(`${EXTERNAL.rabtul.wallet}/api/wallet/balance/${userId}`),
      getTransactions: (userId: string) => apiRequest(`${EXTERNAL.rabtul.wallet}/api/wallet/transactions/${userId}`),
      addCoins: (userId: string, amount: number) => apiRequest(`${EXTERNAL.rabtul.wallet}/api/wallet/credit`, { method: 'POST', body: JSON.stringify({ userId, amount }) }),
    },

    payment: {
      createOrder: (data: any) => apiRequest(`${EXTERNAL.rabtul.payment}/api/orders`, { method: 'POST', body: JSON.stringify(data) }),
      verifyPayment: (orderId: string) => apiRequest(`${EXTERNAL.rabtul.payment}/api/orders/${orderId}/verify`),
    },

    notification: {
      send: (data: any) => apiRequest(`${EXTERNAL.rabtul.notification}/api/notifications/send`, { method: 'POST', body: JSON.stringify(data) }),
      sendPush: (userId: string, message: string) => apiRequest(`${EXTERNAL.rabtul.notification}/api/push/send`, { method: 'POST', body: JSON.stringify({ userId, message }) }),
      sendSMS: (phone: string, message: string) => apiRequest(`${EXTERNAL.rabtul.notification}/api/sms/send`, { method: 'POST', body: JSON.stringify({ phone, message }) }),
    },
  },

  // ----------------------------------------
  // REZ Merchant (Benefits)
  // ----------------------------------------

  rezMerchant: {
    getBenefits: (employeeId: string) => apiRequest(`${EXTERNAL.rezMerchant}/api/v1/benefits/employee/${employeeId}`),
    getOffers: () => apiRequest(`${EXTERNAL.rezMerchant}/api/v1/offers`),
    redeemBenefit: (benefitId: string, data: any) => apiRequest(`${EXTERNAL.rezMerchant}/api/v1/redemptions`, { method: 'POST', body: JSON.stringify({ benefitId, ...data }) }),
  },

  // ----------------------------------------
  // REZ Intelligence
  // ----------------------------------------

  rezIntelligence: {
    predictIntent: (userId: string) => apiRequest(`${EXTERNAL.rezIntelligence.intent}/api/predict/${userId}`),
    getAttritionRisk: (userId: string) => apiRequest(`${EXTERNAL.rezIntelligence.predictive}/api/attrition/${userId}`),
    getProductivityScore: (userId: string) => apiRequest(`${EXTERNAL.rezIntelligence.signal}/api/productivity/${userId}`),
  },

  // ----------------------------------------
  // Hojai AI
  // ----------------------------------------

  hojai: {
    getBenefitRecommendation: (employeeId: string) => apiRequest(`${EXTERNAL.hojai.agents}/api/benefit-recommendation/${employeeId}`),
    getAssistantResponse: (message: string, context: any) => apiRequest(`${EXTERNAL.hojai.agents}/api/assistant`, { method: 'POST', body: JSON.stringify({ message, context }) }),
    triggerWorkflow: (workflowId: string, data: any) => apiRequest(`${EXTERNAL.hojai.flow}/api/trigger/${workflowId}`, { method: 'POST', body: JSON.stringify(data) }),
  },

  // ----------------------------------------
  // RidZa (Financial Wellness)
  // ----------------------------------------

  ridza: {
    getSalaryAdvance: (employeeId: string) => apiRequest(`${EXTERNAL.ridza}/api/salary-advance/${employeeId}`),
    applyAdvance: (data: any) => apiRequest(`${EXTERNAL.ridza}/api/salary-advance/apply`, { method: 'POST', body: JSON.stringify(data) }),
    getLoanOffers: (employeeId: string) => apiRequest(`${EXTERNAL.ridza}/api/loans/${employeeId}`),
    applyLoan: (data: any) => apiRequest(`${EXTERNAL.ridza}/api/loans/apply`, { method: 'POST', body: JSON.stringify(data) }),
  },

  // ----------------------------------------
  // RisnaEstate (Wealth)
  // ----------------------------------------

  risnaEstate: {
    getProperties: () => apiRequest(`${EXTERNAL.risnaEstate}/api/properties`),
    getInvestments: (userId: string) => apiRequest(`${EXTERNAL.risnaEstate}/api/investments/${userId}`),
    getNetWorth: (userId: string) => apiRequest(`${EXTERNAL.risnaEstate}/api/networth/${userId}`),
  },
};

// ============================================================
// ZUSTAND STORE FOR INTEGRATION STATE
// ============================================================

interface IntegrationState {
  isConnected: Record<string, boolean>;
  lastSync: Record<string, Date>;
  errors: Record<string, string>;

  checkConnection: (service: string) => Promise<boolean>;
  syncAll: () => Promise<void>;
}

export const useIntegrationStore = create<IntegrationState>((set, get) => ({
  isConnected: {},
  lastSync: {},
  errors: {},

  checkConnection: async (service: string) => {
    try {
      const urls: Record<string, string> = {
        backend: `${API.backend}/health`,
        projectos: `${API.projectos}/health`,
        corpId: `${API.corpId}/health`,
        corpIntel: `${API.corpIntel}/health`,
      };

      if (urls[service]) {
        await fetch(urls[service]);
        set((state) => ({ isConnected: { ...state.isConnected, [service]: true } }));
        return true;
      }
      return false;
    } catch {
      set((state) => ({ isConnected: { ...state.isConnected, [service]: false } }));
      return false;
    }
  },

  syncAll: async () => {
    const services = ['backend', 'projectos', 'corpId', 'corpIntel'];
    for (const service of services) {
      await get().checkConnection(service);
    }
  },
}));

// ============================================================
// EXPORTS
// ============================================================

export { API, EXTERNAL };
export default integrations;
