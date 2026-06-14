import { logger } from '../../shared/logger';
/**
 * MyRisa App - Service Integration Client
 * Connects all MyRisa and RisaCare services
 */

import axios, { AxiosInstance } from 'axios';
import { ServiceUrls } from '../types/index.js';

export class MyRisaServiceClient {
  private clients: Map<string, AxiosInstance> = new Map();

  constructor() {
    this.initializeClients();
  }

  private initializeClients() {
    // MyRisa Services
    this.addClient('womensHealth', ServiceUrls.womensHealth);
    this.addClient('sexualWellness', ServiceUrls.sexualWellness);
    this.addClient('workLife', ServiceUrls.workLife);
    this.addClient('relationships', ServiceUrls.relationships);
    this.addClient('humanTwin', ServiceUrls.humanTwin);
    this.addClient('consultationCopilot', ServiceUrls.consultationCopilot);
    this.addClient('universalMemory', ServiceUrls.universalMemory);

    // Existing RisaCare Services
    this.addClient('wellness', ServiceUrls.wellness);
    this.addClient('mentalHealth', ServiceUrls.mentalHealth);
    this.addClient('sleep', ServiceUrls.sleep);
    this.addClient('careCircle', ServiceUrls.careCircle);
  }

  private addClient(name: string, baseURL: string) {
    const client = axios.create({
      baseURL,
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' }
    });
    this.clients.set(name, client);
  }

  private getClient(name: string): AxiosInstance {
    const client = this.clients.get(name);
    if (!client) {
      throw new Error(`Service ${name} not found`);
    }
    return client;
  }

  // ============================================
  // USER MANAGEMENT
  // ============================================

  async getUser(corpId: string) {
    const client = this.getClient('universalMemory');
    const response = await client.get(`/person/${corpId}`);
    return response.data;
  }

  async createUser(data: { corpId: string; name?: string; email?: string }) {
    const client = this.getClient('universalMemory');
    const response = await client.post('/api/person', data);
    return response.data;
  }

  // ============================================
  // WOMEN'S HEALTH (Port 4820)
  // ============================================

  async getWomensHealthProfile(userId: string) {
    const client = this.getClient('womensHealth');
    const response = await client.get(`/api/profile/${userId}`);
    return response.data;
  }

  async logPeriod(userId: string, data: {
    startDate: string;
    endDate?: string;
    flowIntensity?: 'light' | 'medium' | 'heavy';
  }) {
    const client = this.getClient('womensHealth');
    const response = await client.post('/api/cycles', { userId, ...data });
    return response.data;
  }

  async getCyclePrediction(userId: string) {
    const client = this.getClient('womensHealth');
    const response = await client.get(`/api/cycles/${userId}/prediction`);
    return response.data;
  }

  async getPregnancyWeek(userId: string) {
    const client = this.getClient('womensHealth');
    const response = await client.get(`/api/pregnancy/${userId}/week`);
    return response.data;
  }

  async getWomensHealthInsights(userId: string) {
    const client = this.getClient('womensHealth');
    const response = await client.get(`/api/insights/${userId}`);
    return response.data;
  }

  // ============================================
  // SEXUAL WELLNESS (Port 4821)
  // ============================================

  async logSexualActivity(userId: string, data: {
    date: string;
    satisfaction?: number;
    notes?: string;
  }) {
    const client = this.getClient('sexualWellness');
    const response = await client.post('/api/activity', { userId, ...data });
    return response.data;
  }

  async logLibido(userId: string, data: {
    date: string;
    level: number;
    factors?: string[];
  }) {
    const client = this.getClient('sexualWellness');
    const response = await client.post('/api/libido', { userId, ...data });
    return response.data;
  }

  async getSexualWellnessInsights(userId: string) {
    const client = this.getClient('sexualWellness');
    const response = await client.get(`/api/insights/${userId}`);
    return response.data;
  }

  async getActiveContraception(userId: string) {
    const client = this.getClient('sexualWellness');
    const response = await client.get(`/api/contraception/${userId}/active`);
    return response.data;
  }

  // ============================================
  // WORK-LIFE BALANCE (Port 4822)
  // ============================================

  async logWorkDay(userId: string, data: {
    date: string;
    workHours: number;
    meetingHours?: number;
    energyLevel?: number;
  }) {
    const client = this.getClient('workLife');
    const response = await client.post('/api/work', { userId, ...data });
    return response.data;
  }

  async getWorkLifeScore(userId: string) {
    const client = this.getClient('workLife');
    const response = await client.get(`/api/score/${userId}`);
    return response.data;
  }

  async getBurnoutRisk(userId: string) {
    const client = this.getClient('workLife');
    const response = await client.get(`/api/burnout/${userId}`);
    return response.data;
  }

  async getWorkInsights(userId: string) {
    const client = this.getClient('workLife');
    const response = await client.get(`/api/insights/${userId}`);
    return response.data;
  }

  // ============================================
  // RELATIONSHIPS (Port 4823)
  // ============================================

  async getRelationships(userId: string) {
    const client = this.getClient('relationships');
    const response = await client.get('/api/relationships', {
      headers: { 'x-user-id': userId }
    });
    return response.data;
  }

  async addRelationship(userId: string, data: {
    partnerName: string;
    type: 'partner' | 'spouse' | 'close_friend' | 'family';
  }) {
    const client = this.getClient('relationships');
    const response = await client.post('/api/relationships', data, {
      headers: { 'x-user-id': userId }
    });
    return response.data;
  }

  async logInteraction(relationshipId: string, userId: string, data: {
    date: string;
    type: 'call' | 'video' | 'in_person' | 'message';
    quality?: 'poor' | 'neutral' | 'good' | 'great' | 'excellent';
    duration?: number;
  }) {
    const client = this.getClient('relationships');
    const response = await client.post(`/api/relationships/${relationshipId}/interactions`, data, {
      headers: { 'x-user-id': userId }
    });
    return response.data;
  }

  async getRelationshipHealth(userId: string) {
    const client = this.getClient('relationships');
    const response = await client.get('/api/health', {
      headers: { 'x-user-id': userId }
    });
    return response.data;
  }

  // ============================================
  // HUMAN TWIN (Port 4824)
  // ============================================

  async getHumanTwin(userId: string) {
    const client = this.getClient('humanTwin');
    const response = await client.get(`/api/v1/twin/${userId}`);
    return response.data;
  }

  async getTwinScore(userId: string) {
    const client = this.getClient('humanTwin');
    const response = await client.get(`/api/v1/twin/${userId}/score`);
    return response.data;
  }

  async getTwinInsights(userId: string) {
    const client = this.getClient('humanTwin');
    const response = await client.get(`/api/v1/twin/${userId}/insights`);
    return response.data;
  }

  async getTwinTimeline(userId: string) {
    const client = this.getClient('humanTwin');
    const response = await client.get(`/api/v1/twin/${userId}/timeline`);
    return response.data;
  }

  // ============================================
  // CONSULTATION COPILOT (Port 4825)
  // ============================================

  async scheduleConsultation(userId: string, data: {
    providerName: string;
    providerType: string;
    date: string;
    reason: string;
  }) {
    const client = this.getClient('consultationCopilot');
    const response = await client.post('/api/consultations', data, {
      headers: { 'x-user-id': userId }
    });
    return response.data;
  }

  async getUpcomingConsultations(userId: string) {
    const client = this.getClient('consultationCopilot');
    const response = await client.get('/api/consultations/upcoming', {
      headers: { 'x-user-id': userId }
    });
    return response.data;
  }

  async generatePreVisitBrief(userId: string, consultationId: string) {
    const client = this.getClient('consultationCopilot');
    const response = await client.post(`/api/consultations/${consultationId}/pre-visit`, {}, {
      headers: { 'x-user-id': userId }
    });
    return response.data;
  }

  async generateQuestions(userId: string, consultationId: string) {
    const client = this.getClient('consultationCopilot');
    const response = await client.post(`/api/consultations/${consultationId}/questions`, {}, {
      headers: { 'x-user-id': userId }
    });
    return response.data;
  }

  // ============================================
  // MENTAL HEALTH (Port 4722)
  // ============================================

  async logMood(userId: string, data: {
    mood: number;
    energy: number;
    anxiety: number;
    sleep: number;
    stress: number;
  }) {
    const client = this.getClient('mentalHealth');
    const response = await client.post('/api/mood', { userId, ...data });
    return response.data;
  }

  async getMoodTrends(userId: string, period: 'day' | 'week' | 'month' | 'year' = 'week') {
    const client = this.getClient('mentalHealth');
    const response = await client.get(`/api/mood/${userId}/trends`, {
      params: { period }
    });
    return response.data;
  }

  async getMentalInsights(userId: string) {
    const client = this.getClient('mentalHealth');
    const response = await client.get(`/api/mood/${userId}/insights`);
    return response.data;
  }

  // ============================================
  // SLEEP (Port 4729)
  // ============================================

  async logSleep(userId: string, data: {
    date: string;
    bedtime: string;
    wakeTime: string;
    quality: number;
  }) {
    const client = this.getClient('sleep');
    const response = await client.post('/api/sleep', { userId, ...data });
    return response.data;
  }

  async getSleepAnalysis(userId: string, days: number = 30) {
    const client = this.getClient('sleep');
    const response = await client.get(`/api/sleep/${userId}/analysis`, {
      params: { days }
    });
    return response.data;
  }

  // ============================================
  // WELLNESS (Port 4703)
  // ============================================

  async logActivity(userId: string, data: {
    type: string;
    duration?: number;
    steps?: number;
    caloriesBurned?: number;
  }) {
    const client = this.getClient('wellness');
    const response = await client.post('/api/activity', { userId, ...data });
    return response.data;
  }

  async getWellnessScore(userId: string) {
    const client = this.getClient('wellness');
    const response = await client.get(`/api/wellness/${userId}/score`);
    return response.data;
  }

  // ============================================
  // CARE CIRCLE (Port 4706)
  // ============================================

  async getCareCircle(userId: string) {
    const client = this.getClient('careCircle');
    const response = await client.get(`/api/circles/${userId}`);
    return response.data;
  }

  async getFamilyMembers(userId: string) {
    const client = this.getClient('careCircle');
    const response = await client.get(`/api/circles/${userId}/members`);
    return response.data;
  }

  // ============================================
  // UNIVERSAL MEMORY (Port 4800)
  // ============================================

  async getHumanMemorySummary(userId: string) {
    const client = this.getClient('universalMemory');
    const response = await client.get('/api/summary', {
      headers: { 'x-person-id': userId }
    });
    return response.data;
  }

  async recordLifeEvent(userId: string, data: {
    eventType: string;
    eventDate: string;
    title: string;
    description?: string;
  }) {
    const client = this.getClient('universalMemory');
    const response = await client.post('/api/life-events', data, {
      headers: { 'x-person-id': userId }
    });
    return response.data;
  }

  // ============================================
  // UNIFIED DASHBOARD
  // ============================================

  async getDashboard(userId: string): Promise<{
    overallScore: number;
    greeting: string;
    todayFocus: string;
    highlights: any[];
    quickActions: any[];
    domainScores: any[];
    reminders: any[];
    insights: any[];
  }> {
    try {
      // Fetch data from multiple services in parallel
      const [
        mentalInsights,
        workInsights,
        twinScore,
        sleepAnalysis,
        relationships
      ] = await Promise.allSettled([
        this.getMentalInsights(userId),
        this.getWorkInsights(userId),
        this.getTwinScore(userId),
        this.getSleepAnalysis(userId, 7),
        this.getRelationships(userId)
      ]);

      // Calculate overall score
      let overallScore = 75;
      if (workInsights.status === 'fulfilled') {
        overallScore = workInsights.value.data?.workLifeScore?.overall || 75;
      }

      // Generate greeting based on time
      const hour = new Date().getHours();
      const greeting = hour < 12 ? 'Good morning'
        : hour < 17 ? 'Good afternoon'
        : 'Good evening';

      // Determine today's focus
      let todayFocus = 'Stay balanced and healthy today!';
      if (workInsights.status === 'fulfilled') {
        const burnoutRisk = workInsights.value.data?.burnoutRisk?.overallRisk;
        if (burnoutRisk === 'high' || burnoutRisk === 'severe') {
          todayFocus = '⚠️ Consider taking a break today to prevent burnout.';
        }
      }

      // Build highlights
      const highlights: any[] = [];
      if (workInsights.status === 'fulfilled' && workInsights.value.data?.PTOUsed) {
        highlights.push({
          type: 'work',
          title: 'PTO Balance',
          description: `${workInsights.value.data.PTOUsed} days used this year`,
          actionUrl: '/worklife'
        });
      }

      // Quick actions
      const quickActions = [
        { id: '1', label: 'Log Mood', icon: '😊', color: '#FFB74D', action: 'logMood' },
        { id: '2', label: 'Track Sleep', icon: '😴', color: '#7986CB', action: 'logSleep' },
        { id: '3', label: 'Log Period', icon: '🌸', color: '#E57373', action: 'logPeriod' },
        { id: '4', label: 'Work Check-in', icon: '⚡', color: '#4DB6AC', action: 'logWork' }
      ];

      // Domain scores
      const domainScores = [
        { domain: 'mental', score: mentalInsights.status === 'fulfilled' ? 75 : 50, trend: 'stable' as const, label: 'Mental Wellness' },
        { domain: 'work', score: overallScore, trend: workInsights.status === 'fulfilled' && workInsights.value.data?.workLifeScore?.workHoursTrend === 'increasing' ? 'down' as const : 'stable' as const, label: 'Work-Life' },
        { domain: 'sleep', score: sleepAnalysis.status === 'fulfilled' ? 70 : 50, trend: 'stable' as const, label: 'Sleep' },
        { domain: 'relationships', score: relationships.status === 'fulfilled' ? 75 : 50, trend: 'stable' as const, label: 'Relationships' }
      ];

      // Insights
      const insights: any[] = [];
      if (mentalInsights.status === 'fulfilled' && mentalInsights.value.data?.recentInsights?.length > 0) {
        mentalInsights.value.data.recentInsights.slice(0, 2).forEach((insight: string) => {
          insights.push({ id: uuid(), type: 'info', title: insight });
        });
      }

      return {
        overallScore,
        greeting,
        todayFocus,
        highlights,
        quickActions,
        domainScores,
        reminders: [],
        insights
      };
    } catch (error) {
      logger.error('Error fetching dashboard:', error);
      return {
        overallScore: 75,
        greeting: 'Welcome back!',
        todayFocus: 'Track your wellbeing today.',
        highlights: [],
        quickActions: [
          { id: '1', label: 'Log Mood', icon: '😊', color: '#FFB74D', action: 'logMood' },
          { id: '2', label: 'Track Sleep', icon: '😴', color: '#7986CB', action: 'logSleep' }
        ],
        domainScores: [],
        reminders: [],
        insights: []
      };
    }
  }
}

// Helper function
function uuid(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export const myRisaClient = new MyRisaServiceClient();