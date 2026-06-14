/**
 * MyRisa Family Service
 * Integration with Shab AI (Family Intelligence Platform)
 *
 * Provides:
 * - Family health connections
 * - Elder care coordination
 * - Child health monitoring
 * - Care circle sharing
 */

import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

// Shab AI URL
const SHAB_AI_URL = process.env.SHAB_AI_URL || 'http://localhost:4970';

// In-memory storage
class FamilyStore {
  private connections: Map<string, FamilyConnection[]> = new Map(); // userId -> connections
  private sharedHealth: Map<string, SharedHealthRecord[]> = new Map(); // userId -> shared records
  private careTasks: Map<string, CareTask[]> = new Map(); // userId -> tasks

  getConnections(userId: string): FamilyConnection[] {
    return this.connections.get(userId) || [];
  }

  addConnection(connection: FamilyConnection): void {
    const connections = this.getConnections(connection.fromUserId);
    connections.push(connection);
    this.connections.set(connection.fromUserId, connections);
  }

  removeConnection(userId: string, connectionId: string): void {
    const connections = this.getConnections(userId);
    const filtered = connections.filter(c => c.id !== connectionId);
    this.connections.set(userId, filtered);
  }

  getSharedHealth(userId: string): SharedHealthRecord[] {
    return this.sharedHealth.get(userId) || [];
  }

  addSharedHealth(record: SharedHealthRecord): void {
    const records = this.getSharedHealth(record.userId);
    records.push(record);
    this.sharedHealth.set(record.userId, records);
  }

  getCareTasks(userId: string): CareTask[] {
    return this.careTasks.get(userId) || [];
  }

  addCareTask(task: CareTask): void {
    const tasks = this.getCareTasks(task.assignedTo);
    tasks.push(task);
    this.careTasks.set(task.assignedTo, tasks);
  }

  updateCareTask(taskId: string, userId: string, updates: Partial<CareTask>): CareTask | null {
    const tasks = this.getCareTasks(userId);
    const index = tasks.findIndex(t => t.id === taskId);
    if (index >= 0) {
      tasks[index] = { ...tasks[index], ...updates };
      return tasks[index];
    }
    return null;
  }
}

interface FamilyConnection {
  id: string;
  fromUserId: string;
  toUserId: string;
  relation: 'parent' | 'child' | 'spouse' | 'sibling' | 'caregiver' | 'other';
  permission: 'view' | 'edit' | 'full';
  status: 'pending' | 'active' | 'revoked';
  sharedDomains: string[];
  createdAt: string;
}

interface SharedHealthRecord {
  id: string;
  userId: string;
  familyMemberId: string;
  domain: string;
  data: any;
  sharedAt: string;
}

interface CareTask {
  id: string;
  userId: string;
  assignedTo: string;
  type: 'medication' | 'appointment' | 'checkup' | 'exercise' | 'meal' | 'other';
  title: string;
  description: string;
  dueDate: string;
  completed: boolean;
  completedAt?: string;
  reminderEnabled: boolean;
}

const store = new FamilyStore();

export class ShabIntegrationService {

  // ============================================
  // SHAB AI INTEGRATION
  // ============================================

  /**
   * Connect to Shab AI family graph
   */
  async connectToShabFamily(userId: string): Promise<{
    success: boolean;
    familyMembers?: FamilyMember[];
    error?: string;
  }> {
    try {
      // Try to get family from Shab AI
      const response = await axios.get(`${SHAB_AI_URL}/api/family/${userId}`, {
        timeout: 5000
      });

      return {
        success: true,
        familyMembers: response.data.familyMembers
      };
    } catch (error) {
      // Shab not available, use local storage
      return {
        success: true,
        familyMembers: store.getConnections(userId).map(c => ({
          id: c.toUserId,
          relation: c.relation,
          status: c.status
        }))
      };
    }
  }

  /**
   * Get family health summary
   */
  async getFamilyHealthSummary(userId: string): Promise<{
    myHealth: any;
    familyMembers: FamilyHealthSummary[];
  }> {
    // Get own health
    const myHealth = await this.getMyHealthSummary(userId);

    // Get family members
    const connections = store.getConnections(userId);
    const familyMembers: FamilyHealthSummary[] = [];

    for (const connection of connections) {
      if (connection.status === 'active') {
        const memberHealth = await this.getMyHealthSummary(connection.toUserId);
        familyMembers.push({
          memberId: connection.toUserId,
          relation: connection.relation,
          healthSummary: memberHealth,
          sharedDomains: connection.sharedDomains
        });
      }
    }

    return { myHealth, familyMembers };
  }

  private async getMyHealthSummary(userId: string): Promise<any> {
    try {
      // Gather from MyRisa services
      const responses = await Promise.allSettled([
        axios.get(`http://localhost:4820/api/insights/${userId}`, { timeout: 3000 }),
        axios.get(`http://localhost:4824/api/v1/twin/${userId}/score`, { timeout: 3000 }),
        axios.get(`http://localhost:4722/api/mood/${userId}/insights`, { timeout: 3000 }),
        axios.get(`http://localhost:4729/api/sleep/${userId}/analysis`, { timeout: 3000 })
      ]);

      const summary: any = {};
      const keys = ['womensHealth', 'twin', 'mental', 'sleep'];

      responses.forEach((result, i) => {
        if (result.status === 'fulfilled') {
          summary[keys[i]] = result.value.data?.data || result.value.data;
        }
      });

      return summary;
    } catch {
      return { status: 'unavailable' };
    }
  }

  // ============================================
  // FAMILY CONNECTIONS
  // ============================================

  /**
   * Add family member
   */
  async addFamilyMember(userId: string, data: {
    toUserId: string;
    relation: 'parent' | 'child' | 'spouse' | 'sibling' | 'caregiver' | 'other';
    permission: 'view' | 'edit' | 'full';
    sharedDomains?: string[];
  }): Promise<FamilyConnection> {
    const connection: FamilyConnection = {
      id: uuidv4(),
      fromUserId: userId,
      toUserId: data.toUserId,
      relation: data.relation,
      permission: data.permission,
      status: 'pending',
      sharedDomains: data.sharedDomains || ['basic_health'],
      createdAt: new Date().toISOString()
    };

    store.addConnection(connection);

    return connection;
  }

  /**
   * Get family connections
   */
  async getFamilyConnections(userId: string): Promise<FamilyConnection[]> {
    return store.getConnections(userId);
  }

  /**
   * Accept family connection
   */
  async acceptConnection(userId: string, connectionId: string): Promise<boolean> {
    const connections = store.getConnections(userId);
    const connection = connections.find(c => c.id === connectionId);

    if (connection) {
      connection.status = 'active';
      return true;
    }

    return false;
  }

  /**
   * Revoke family connection
   */
  async revokeConnection(userId: string, connectionId: string): Promise<boolean> {
    const connections = store.getConnections(userId);
    const connection = connections.find(c => c.id === connectionId);

    if (connection) {
      connection.status = 'revoked';
      return true;
    }

    return false;
  }

  // ============================================
  // HEALTH SHARING
  // ============================================

  /**
   * Share health data with family
   */
  async shareHealthData(userId: string, data: {
    familyMemberId: string;
    domain: string;
    healthData: any;
  }): Promise<SharedHealthRecord> {
    const record: SharedHealthRecord = {
      id: uuidv4(),
      userId,
      familyMemberId: data.familyMemberId,
      domain: data.domain,
      data: data.healthData,
      sharedAt: new Date().toISOString()
    };

    store.addSharedHealth(record);

    return record;
  }

  /**
   * Get shared health from family
   */
  async getSharedHealth(userId: string): Promise<SharedHealthRecord[]> {
    return store.getSharedHealth(userId);
  }

  // ============================================
  // CARE TASKS
  // ============================================

  /**
   * Create care task for family member
   */
  async createCareTask(userId: string, data: {
    assignedTo: string;
    type: 'medication' | 'appointment' | 'checkup' | 'exercise' | 'meal' | 'other';
    title: string;
    description?: string;
    dueDate: string;
    reminderEnabled?: boolean;
  }): Promise<CareTask> {
    const task: CareTask = {
      id: uuidv4(),
      userId,
      assignedTo: data.assignedTo,
      type: data.type,
      title: data.title,
      description: data.description || '',
      dueDate: data.dueDate,
      completed: false,
      reminderEnabled: data.reminderEnabled ?? true
    };

    store.addCareTask(task);

    return task;
  }

  /**
   * Get care tasks
   */
  async getCareTasks(userId: string): Promise<CareTask[]> {
    return store.getCareTasks(userId);
  }

  /**
   * Complete care task
   */
  async completeCareTask(userId: string, taskId: string): Promise<boolean> {
    const task = store.updateCareTask(taskId, userId, {
      completed: true,
      completedAt: new Date().toISOString()
    });

    return !!task;
  }

  // ============================================
  // ELDER CARE
  // ============================================

  /**
   * Get elder care summary
   */
  async getElderCareSummary(userId: string, elderId: string): Promise<{
    elder: any;
    recentHealth: any;
    upcomingAppointments: any[];
    careGivers: FamilyConnection[];
    alerts: string[];
  }> {
    const connections = store.getConnections(userId).filter(c =>
      c.toUserId === elderId && c.relation === 'parent'
    );

    if (connections.length === 0) {
      return {
        elder: null,
        recentHealth: null,
        upcomingAppointments: [],
        careGivers: [],
        alerts: ['No elder connection found']
      };
    }

    const alerts: string[] = [];

    // Get elder health
    try {
      const health = await axios.get(`http://localhost:4721/api/elder/${elderId}/status`, {
        timeout: 3000
      });

      if (health.data?.fallRisk === 'high') {
        alerts.push('Fall risk is high');
      }

      if (health.data?.medicationAdherence < 80) {
        alerts.push('Medication adherence is low');
      }
    } catch {
      // Elder care service not available
    }

    // Get upcoming appointments
    let appointments: any[] = [];
    try {
      const appts = await axios.get(`http://localhost:4825/api/consultations/upcoming`, {
        headers: { 'x-user-id': elderId },
        timeout: 3000
      });
      appointments = appts.data?.data || [];
    } catch {
      // No appointments
    }

    return {
      elder: { id: elderId, relation: 'parent' },
      recentHealth: await this.getMyHealthSummary(elderId),
      upcomingAppointments: appointments,
      careGivers: connections,
      alerts
    };
  }

  // ============================================
  // CHILD HEALTH
  // ============================================

  /**
   * Get child health summary
   */
  async getChildHealthSummary(userId: string, childId: string): Promise<{
    child: any;
    vaccinations: any[];
    growthChart: any;
    upcomingCheckups: any[];
    alerts: string[];
  }> {
    const alerts: string[] = [];

    // Get child data
    const childData = await this.getMyHealthSummary(childId);

    // Check for upcoming vaccinations (placeholder)
    const vaccinations: any[] = [];

    return {
      child: { id: childId, relation: 'child' },
      vaccinations,
      growthChart: {},
      upcomingCheckups: [],
      alerts
    };
  }
}

interface FamilyMember {
  id: string;
  relation: string;
  status: string;
}

interface FamilyHealthSummary {
  memberId: string;
  relation: string;
  healthSummary: any;
  sharedDomains: string[];
}

export const shabIntegrationService = new ShabIntegrationService();