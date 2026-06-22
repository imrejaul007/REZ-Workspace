import { logger } from '../../shared/logger';
/**
 * REZ Workspace Hub Client
 * Work& Productivity Platform
 * Port: 4300
 */

import axios, { AxiosInstance } from 'axios';

// Service configuration
const INTERNAL_KEY = process.env.INTERNAL_SERVICE_TOKEN || 'your-internal-token';
const UNIFIED_HUB = process.env.UNIFIED_HUB_URL || 'http://localhost:4600';

const SERVICES = {
  // RABTUL Services
  AUTH: process.env.AUTH_SERVICE_URL || 'https://rez-auth-service.onrender.com',
  WALLET: process.env.WALLET_SERVICE_URL || 'https://rez-wallet-service.onrender.com',

  // HOJAI AI Services
  HOJAI_GATEWAY: process.env.HOJAI_GATEWAY || 'http://localhost:4500',
  HOJAI_MEMORY: process.env.HOJAI_MEMORY || 'http://localhost:4520',
  HOJAI_INTELLIGENCE: process.env.HOJAI_INTELLIGENCE || 'http://localhost:4530',
  HOJAI_AGENTS: process.env.HOJAI_AGENTS || 'http://localhost:4550',
  HOJAI_WORKFLOWS: process.env.HOJAI_WORKFLOWS || 'http://localhost:4560',

  // Genie Services
  GENIE_MEMORY: process.env.GENIE_MEMORY || 'http://localhost:4703',
  GENIE_BRIEFING: process.env.GENIE_BRIEFING || 'http://localhost:4706',

  // SUTAR OS Services
  SUTAR_TWIN_OS: process.env.SUTAR_TWIN_OS || 'http://localhost:4142',
  SUTAR_GOAL: process.env.SUTAR_GOAL || 'http://localhost:4242',

  // Internal Services
  MEETING_SERVICE: process.env.MEETING_SERVICE || 'http://localhost:4301',
  DOCUMENT_SERVICE: process.env.DOCUMENT_SERVICE || 'http://localhost:4302',
  COLLABORATION: process.env.COLLABORATION || 'http://localhost:4303',

  // CorpPerks Services (HRMS)
  CORPPERKS_GATEWAY: process.env.CORPPERKS_GATEWAY || 'http://localhost:4700',
  CORPPERKS_BACKEND: process.env.CORPPERKS_BACKEND || 'http://localhost:4006',
  CORPPERKS_PAYROLL: process.env.CORPPERKS_PAYROLL || 'http://localhost:4738',
  CORPPERKS_SHIFT: process.env.CORPPERKS_SHIFT || 'http://localhost:4739',
  CORPPERKS_PERFORMANCE: process.env.CORPPERKS_PERFORMANCE || 'http://localhost:4729',
  CORPPERKS_OKR: process.env.CORPPERKS_OKR || 'http://localhost:4730',
  CORPPERKS_MEETING: process.env.CORPPERKS_MEETING || 'http://localhost:4728',
  CORPPERKS_LMS: process.env.CORPPERKS_LMS || 'http://localhost:4734',
  CORPPERKS_ONBOARDING: process.env.CORPPERKS_ONBOARDING || 'http://localhost:4732',
  CORPPERKS_ANALYTICS: process.env.CORPPERKS_ANALYTICS || 'http://localhost:4744',
};

// Type definitions
export interface WorkspaceData {
  name: string;
  description?: string;
  owner_id: string;
  team_ids?: string[];
  settings?: Record<string, unknown>;
}

export interface ChannelData {
  workspace_id: string;
  name: string;
  description?: string;
  type: 'public' | 'private' | 'direct';
  member_ids?: string[];
}

export interface MeetingData {
  title: string;
  description?: string;
  host_id: string;
  start_time: string;
  end_time: string;
  attendee_ids: string[];
  recurring?: boolean;
  recurrence_rule?: string;
  meeting_link?: string;
}

export interface DocumentData {
  title: string;
  content?: string;
  type: 'document' | 'spreadsheet' | 'presentation' | 'file';
  workspace_id: string;
  channel_id?: string;
  created_by: string;
  parent_folder_id?: string;
  tags?: string[];
}

export interface TaskData {
  title: string;
  description?: string;
  workspace_id: string;
  channel_id?: string;
  assignee_id?: string;
  due_date?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'todo' | 'in_progress' | 'review' | 'done';
  labels?: string[];
}

export interface TeamMemberData {
  user_id: string;
  workspace_id: string;
  role: 'owner' | 'admin' | 'member' | 'guest';
  department?: string;
  title?: string;
}

class REZWorkspaceHubClient {
  private clients: Map<string, AxiosInstance> = new Map();
  private hubClient: AxiosInstance;

  constructor() {
    this.hubClient = axios.create({
      baseURL: UNIFIED_HUB,
      headers: { 'X-Internal-Token': INTERNAL_KEY, 'X-Service-Name': 'REZ-Workspace' },
    });

    Object.keys(SERVICES).forEach((service) => {
      this.clients.set(service, axios.create({
        baseURL: SERVICES[service as keyof typeof SERVICES],
        headers: { 'X-Internal-Token': INTERNAL_KEY, 'X-Service-Name': 'REZ-Workspace' },
      }));
    });
  }

  private async callViaHub(service: string, endpoint: string, method = 'POST', data?: unknown) {
    try {
      return (await this.hubClient.request({ method, url: `/api/${service}${endpoint}`, data })).data;
    } catch (error) {
      logger.error(`[REZ-Workspace] Hub ${service}${endpoint} failed:`, error);
      return null;
    }
  }

  private async callDirect(service: string, endpoint: string, method = 'POST', data?: unknown) {
    const client = this.clients.get(service);
    if (!client) return null;
    try {
      return (await client.request({ method, url: endpoint, data })).data;
    } catch (error) {
      logger.error(`[REZ-Workspace] Direct ${service}${endpoint} failed:`, error);
      return null;
    }
  }

  // ============================================
  // RABTUL SERVICES (Auth, Wallet, Payments)
  // ============================================

  async getWalletBalance(userId: string) {
    return this.callViaHub('wallet', '/balance', 'POST', { user_id: userId });
  }

  async getLoyaltyPoints(userId: string) {
    return this.callViaHub('wallet', '/points', 'POST', { user_id: userId });
  }

  async verifyUser(token: string) {
    return this.callViaHub('auth', '/verify', 'POST', { token });
  }

  async getUserProfile(userId: string) {
    return this.callViaHub('auth', '/profile', 'POST', { user_id: userId });
  }

  // ============================================
  // HOJAI AI SERVICES (Intelligence, Memory, Agents)
  // ============================================

  async storeWorkspaceMemory(workspaceId: string, memory: string) {
    return this.callDirect('HOJAI_MEMORY', '/api/v1/memory/store', 'POST', {
      user_id: workspaceId,
      type: 'workspace_knowledge',
      data: memory,
    });
  }

  async getWorkspaceMemory(workspaceId: string, query: string) {
    return this.callDirect('HOJAI_MEMORY', '/api/v1/memory/search', 'POST', {
      user_id: workspaceId,
      query,
      type: 'workspace_knowledge',
    });
  }

  async generateMeetingSummary(meetingId: string, transcript: string) {
    return this.callDirect('HOJAI_INTELLIGENCE', '/api/v1/summarize', 'POST', {
      content: transcript,
      type: 'meeting_notes',
      context: { meeting_id: meetingId },
    });
  }

  async extractActionItems(meetingNotes: string) {
    return this.callDirect('HOJAI_INTELLIGENCE', '/api/v1/extract/actions', 'POST', {
      content: meetingNotes,
      type: 'action_items',
    });
  }

  async analyzeDocument(documentId: string, content: string) {
    return this.callDirect('HOJAI_INTELLIGENCE', '/api/v1/analyze/document', 'POST', {
      document_id: documentId,
      content,
      analysis_type: 'comprehensive',
    });
  }

  async searchDocuments(query: string, workspaceId: string) {
    return this.callDirect('HOJAI_MEMORY', '/api/v1/memory/search', 'POST', {
      user_id: workspaceId,
      query,
      type: 'document_content',
    });
  }

  async generateDocumentEmbedding(documentId: string, content: string) {
    return this.callDirect('HOJAI_INTELLIGENCE', '/api/v1/embed', 'POST', {
      document_id: documentId,
      content,
    });
  }

  async getAIAssistantResponse(userId: string, message: string, context?: unknown) {
    return this.callDirect('HOJAI_AGENTS', '/api/v1/chat', 'POST', {
      user_id: userId,
      message,
      context,
      agent_type: 'workspace_assistant',
    });
  }

  async createWorkflow(workflowData: unknown) {
    return this.callDirect('HOJAI_WORKFLOWS', '/api/v1/workflows', 'POST', workflowData);
  }

  async executeWorkflow(workflowId: string, input: unknown) {
    return this.callDirect('HOJAI_WORKFLOWS', '/api/v1/workflows/execute', 'POST', {
      workflow_id: workflowId,
      input,
    });
  }

  // ============================================
  // GENIE SERVICES (Personal AI)
  // ============================================

  async storePersonalMemory(userId: string, memory: string) {
    return this.callDirect('GENIE_MEMORY', '/api/v1/memory/store', 'POST', {
      user_id: userId,
      type: 'work_memory',
      data: memory,
    });
  }

  async getPersonalMemory(userId: string, query: string) {
    return this.callDirect('GENIE_MEMORY', '/api/v1/memory/search', 'POST', {
      user_id: userId,
      query,
      type: 'work_memory',
    });
  }

  async generateDailyBriefing(userId: string, context: unknown) {
    return this.callDirect('GENIE_BRIEFING', '/api/v1/briefing/generate', 'POST', {
      user_id: userId,
      context,
      type: 'daily_work',
    });
  }

  // ============================================
  // SUTAR OS SERVICES (Digital Twins, Goals)
  // ============================================

  async getUserTwin(userId: string) {
    return this.callDirect('SUTAR_TWIN_OS', '/api/v1/twins/retrieve', 'POST', {
      entity_id: userId,
      type: 'user',
    });
  }

  async updateUserTwin(userId: string, twinData: unknown) {
    return this.callDirect('SUTAR_TWIN_OS', '/api/v1/twins/update', 'POST', {
      entity_id: userId,
      type: 'user',
      data: twinData,
    });
  }

  async getWorkspaceTwin(workspaceId: string) {
    return this.callDirect('SUTAR_TWIN_OS', '/api/v1/twins/retrieve', 'POST', {
      entity_id: workspaceId,
      type: 'workspace',
    });
  }

  async createWorkspaceTwin(workspaceId: string, workspaceData: unknown) {
    return this.callDirect('SUTAR_TWIN_OS', '/api/v1/twins/create', 'POST', {
      entity_id: workspaceId,
      type: 'workspace',
      data: workspaceData,
    });
  }

  async trackGoal(goalId: string, progress: number) {
    return this.callDirect('SUTAR_GOAL', '/api/v1/goals/track', 'POST', {
      goal_id: goalId,
      progress,
    });
  }

  async createGoal(goalData: unknown) {
    return this.callDirect('SUTAR_GOAL', '/api/v1/goals', 'POST', goalData);
  }

  // ============================================
  // INTERNAL SERVICES
  // ============================================

  async createMeeting(meetingData: MeetingData) {
    return this.callDirect('MEETING_SERVICE', '/api/v1/meetings', 'POST', meetingData);
  }

  async getMeeting(meetingId: string) {
    return this.callDirect('MEETING_SERVICE', `/api/v1/meetings/${meetingId}`, 'GET');
  }

  async updateMeeting(meetingId: string, data: Partial<MeetingData>) {
    return this.callDirect('MEETING_SERVICE', `/api/v1/meetings/${meetingId}`, 'PATCH', data);
  }

  async deleteMeeting(meetingId: string) {
    return this.callDirect('MEETING_SERVICE', `/api/v1/meetings/${meetingId}`, 'DELETE');
  }

  async createDocument(documentData: DocumentData) {
    return this.callDirect('DOCUMENT_SERVICE', '/api/v1/documents', 'POST', documentData);
  }

  async getDocument(documentId: string) {
    return this.callDirect('DOCUMENT_SERVICE', `/api/v1/documents/${documentId}`, 'GET');
  }

  async updateDocument(documentId: string, data: Partial<DocumentData>) {
    return this.callDirect('DOCUMENT_SERVICE', `/api/v1/documents/${documentId}`, 'PATCH', data);
  }

  async deleteDocument(documentId: string) {
    return this.callDirect('DOCUMENT_SERVICE', `/api/v1/documents/${documentId}`, 'DELETE');
  }

  async getDocumentVersion(documentId: string, versionId: string) {
    return this.callDirect('DOCUMENT_SERVICE', `/api/v1/documents/${documentId}/versions/${versionId}`, 'GET');
  }

  async broadcastCollaboration(event: string, data: unknown) {
    return this.callDirect('COLLABORATION', '/api/v1/broadcast', 'POST', { event, data });
  }

  // ============================================
  // WORKSPACE MANAGEMENT
  // ============================================

  async createWorkspace(workspaceData: WorkspaceData) {
    // Create workspace twin
    const twin = await this.createWorkspaceTwin(workspaceData.name, {
      owner_id: workspaceData.owner_id,
      team_count: workspaceData.team_ids?.length || 0,
    });

    // Store initial memory
    await this.storeWorkspaceMemory(workspaceData.name, `Workspace created: ${workspaceData.description || 'No description'}`);

    return twin;
  }

  async getWorkspace(workspaceId: string) {
    return this.getWorkspaceTwin(workspaceId);
  }

  async updateWorkspace(workspaceId: string, data: Partial<WorkspaceData>) {
    return this.callDirect('SUTAR_TWIN_OS', '/api/v1/twins/update', 'POST', {
      entity_id: workspaceId,
      type: 'workspace',
      data,
    });
  }

  // ============================================
  // MEETING INTELLIGENCE
  // ============================================

  async processMeetingWithAI(meetingId: string, transcript: string) {
    // Generate summary
    const summary = await this.generateMeetingSummary(meetingId, transcript);

    // Extract action items
    const actionItems = await this.extractActionItems(transcript);

    // Create tasks from action items
    const tasks = await Promise.all(
      (actionItems?.items || []).map(async (item: { title: string; assignee?: string; due_date?: string }) => {
        return {
          title: item.title,
          status: 'todo',
          priority: 'medium' as const,
          meeting_id: meetingId,
        };
      })
    );

    return {
      meeting_id: meetingId,
      summary,
      action_items: actionItems,
      generated_tasks: tasks,
    };
  }

  // ============================================
  // DOCUMENT INTELLIGENCE
  // ============================================

  async analyzeDocumentWithAI(documentId: string, content: string) {
    // Generate embedding
    const embedding = await this.generateDocumentEmbedding(documentId, content);

    // Analyze content
    const analysis = await this.analyzeDocument(documentId, content);

    // Store in memory for search
    await this.storeWorkspaceMemory(documentId, content);

    return {
      document_id: documentId,
      embedding,
      analysis,
    };
  }

  async intelligentDocumentSearch(query: string, workspaceId: string) {
    // Search in vector memory
    const memoryResults = await this.searchDocuments(query, workspaceId);

    // Get AI-powered search suggestions
    const suggestions = await this.getAIAssistantResponse(workspaceId, `Search for: ${query}`, {
      type: 'document_search',
      workspace_id: workspaceId,
    });

    return {
      query,
      results: memoryResults,
      suggestions,
    };
  }

  // ============================================
  // TASK MANAGEMENT
  // ============================================

  async createTaskFromGoal(taskData: TaskData) {
    // Create in SUTAR Goal
    const goal = await this.createGoal({
      title: taskData.title,
      description: taskData.description,
      target_date: taskData.due_date,
      priority: taskData.priority,
 });

    return goal;
  }

  async trackTaskProgress(taskId: string, progress: number) {
    return this.trackGoal(taskId, progress);
  }

  // ============================================
  // ANALYTICS & INSIGHTS
  // ============================================

  async getWorkspaceAnalytics(workspaceId: string) {
    const twin = await this.getWorkspaceTwin(workspaceId);
    const memory = await this.getWorkspaceMemory(workspaceId, 'workspace analytics');

    return {
      workspace_id: workspaceId,
      twin_data: twin,
      knowledge_base: memory,
    };
  }

  async getProductivityInsights(userId: string) {
    const twin = await this.getUserTwin(userId);
    const briefing = await this.generateDailyBriefing(userId, { type: 'productivity' });

    return {
      user_id: userId,
      twin_data: twin,
      daily_briefing: briefing,
    };
  }

  // ============================================
  // SIGNALING & EVENTS
  // ============================================

  async trackEvent(userId: string | undefined, event: string, data?: unknown) {
    return this.callViaHub('signal', '/collect', 'POST', {
      service: 'REZ-Workspace',
      event,
      user_id: userId || 'anonymous',
      data,
    });
  }

  async awardPoints(userId: string, points: number, action: string) {
    return this.callViaHub('karma', '/award', 'POST', {
      user_id: userId,
      points,
      action,
      source: 'REZ-Workspace',
    });
  }

  // ============================================
  // CORPPERKS SERVICES (HRMS Integration)
  // ============================================

  // Get employees from CorpPerks
  async getCorpPerksEmployees(tenantId?: string) {
    return this.callDirect('CORPPERKS_BACKEND', '/api/v1/employees', 'GET', { tenant_id: tenantId });
  }

  // Get employee by ID
  async getCorpPerksEmployee(employeeId: string, tenantId?: string) {
    return this.callDirect('CORPPERKS_BACKEND', `/api/v1/employees/${employeeId}`, 'GET', { tenant_id: tenantId });
  }

  // Get payroll data
  async getCorpPerksPayroll(employeeId: string, month?: string, year?: number) {
    return this.callDirect('CORPPERKS_PAYROLL', '/api/v1/payroll', 'POST', {
      employee_id: employeeId,
      month,
      year,
    });
  }

  // Get payslip
  async getCorpPerksPayslip(employeeId: string, payslipId: string) {
    return this.callDirect('CORPPERKS_PAYROLL', '/api/v1/payslip', 'POST', {
      employee_id: employeeId,
      payslip_id: payslipId,
    });
  }

  // Get leave balance
  async getCorpPerksLeaveBalance(employeeId: string) {
    return this.callDirect('CORPPERKS_BACKEND', '/api/v1/leave/balance', 'POST', {
      employee_id: employeeId,
    });
  }

  // Get leave requests
  async getCorpPerksLeaveRequests(employeeId?: string, status?: string) {
    return this.callDirect('CORPPERKS_BACKEND', '/api/v1/leave/requests', 'POST', {
      employee_id: employeeId,
      status,
    });
  }

  // Get attendance records
  async getCorpPerksAttendance(employeeId: string, startDate: string, endDate: string) {
    return this.callDirect('CORPPERKS_BACKEND', '/api/v1/attendance', 'POST', {
      employee_id: employeeId,
      start_date: startDate,
      end_date: endDate,
    });
  }

  // Get performance review
  async getCorpPerksPerformance(employeeId: string, cycleId?: string) {
    return this.callDirect('CORPPERKS_PERFORMANCE', '/api/v1/reviews', 'POST', {
      employee_id: employeeId,
      cycle_id: cycleId,
    });
  }

  // Get OKRs
  async getCorpPerksOKRs(employeeId: string, period?: string) {
    return this.callDirect('CORPPERKS_OKR', '/api/v1/objectives', 'POST', {
      employee_id: employeeId,
      period,
    });
  }

  // Get training/courses
  async getCorpPerksTraining(employeeId?: string) {
    return this.callDirect('CORPPERKS_LMS', '/api/v1/courses', 'POST', {
      employee_id: employeeId,
    });
  }

  // Get onboarding progress
  async getCorpPerksOnboarding(employeeId: string) {
    return this.callDirect('CORPPERKS_ONBOARDING', '/api/v1/progress', 'POST', {
      employee_id: employeeId,
    });
  }

  // Get workforce analytics
  async getCorpPerksAnalytics(startDate?: string, endDate?: string) {
    return this.callDirect('CORPPERKS_ANALYTICS', '/api/v1/analytics', 'POST', {
      start_date: startDate,
      end_date: endDate,
    });
  }

  // Get shifts
  async getCorpPerksShifts(employeeId?: string, startDate?: string, endDate?: string) {
    return this.callDirect('CORPPERKS_SHIFT', '/api/v1/shifts', 'POST', {
      employee_id: employeeId,
      start_date: startDate,
      end_date: endDate,
    });
  }

  // Sync employee data
  async syncCorpPerksEmployee(employeeId: string) {
    return this.callDirect('CORPPERKS_BACKEND', '/api/v1/sync', 'POST', {
      employee_id: employeeId,
    });
  }

  // Get meetings from CorpPerks
  async getCorpPerksMeetings(employeeId?: string, startDate?: string, endDate?: string) {
    return this.callDirect('CORPPERKS_MEETING', '/api/v1/meetings', 'POST', {
      employee_id: employeeId,
      start_date: startDate,
      end_date: endDate,
    });
  }
}

export const rezWorkspaceHub = new REZWorkspaceHubClient();
export default rezWorkspaceHub;
