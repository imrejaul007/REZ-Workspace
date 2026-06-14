/**
 * MyRisa API Service
 * Connects to MyRisa App backend
 */

import axios from 'axios';

const API_BASE = 'http://localhost:4900/api';

class ApiService {
  private client = axios.create({
    baseURL: API_BASE,
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' },
  });

  // ============================================
  // DASHBOARD
  // ============================================

  async getDashboard(userId: string) {
    const response = await this.client.get(`/dashboard/${userId}`);
    return response.data.data;
  }

  // ============================================
  // WOMEN'S HEALTH
  // ============================================

  async getWomensHealthProfile(userId: string) {
    const response = await this.client.get(`/womens-health/profile/${userId}`);
    return response.data.data;
  }

  async logPeriod(userId: string, data: {
    startDate: string;
    endDate?: string;
    flowIntensity?: 'light' | 'medium' | 'heavy';
  }) {
    const response = await this.client.post('/womens-health/period', { userId, ...data });
    return response.data.data;
  }

  async getCyclePrediction(userId: string) {
    const response = await this.client.get(`/womens-health/prediction/${userId}`);
    return response.data.data;
  }

  async getWomensHealthInsights(userId: string) {
    const response = await this.client.get(`/womens-health/insights/${userId}`);
    return response.data.data;
  }

  // ============================================
  // SEXUAL WELLNESS
  // ============================================

  async logSexualActivity(userId: string, data: {
    date: string;
    satisfaction?: number;
    notes?: string;
  }) {
    const response = await this.client.post('/sexual-wellness/activity', { userId, ...data });
    return response.data.data;
  }

  async logLibido(userId: string, data: {
    date: string;
    level: number;
    factors?: string[];
  }) {
    const response = await this.client.post('/sexual-wellness/libido', { userId, ...data });
    return response.data.data;
  }

  async getSexualWellnessInsights(userId: string) {
    const response = await this.client.get(`/sexual-wellness/insights/${userId}`);
    return response.data.data;
  }

  // ============================================
  // WORK-LIFE
  // ============================================

  async logWorkDay(userId: string, data: {
    date: string;
    workHours: number;
    meetingHours?: number;
    energyLevel?: number;
  }) {
    const response = await this.client.post('/worklife/work', { userId, ...data });
    return response.data.data;
  }

  async getWorkLifeScore(userId: string) {
    const response = await this.client.get(`/worklife/score/${userId}`);
    return response.data.data;
  }

  async getBurnoutRisk(userId: string) {
    const response = await this.client.get(`/worklife/burnout/${userId}`);
    return response.data.data;
  }

  async getWorkInsights(userId: string) {
    const response = await this.client.get(`/worklife/insights/${userId}`);
    return response.data.data;
  }

  // ============================================
  // RELATIONSHIPS
  // ============================================

  async getRelationships(userId: string) {
    const response = await this.client.get(`/relationships/${userId}`);
    return response.data.data;
  }

  async addRelationship(userId: string, data: {
    partnerName: string;
    type: 'partner' | 'spouse' | 'close_friend' | 'family';
  }) {
    const response = await this.client.post('/relationships', data, {
      headers: { 'x-user-id': userId }
    });
    return response.data.data;
  }

  async logInteraction(relationshipId: string, userId: string, data: {
    date: string;
    type: 'call' | 'video' | 'in_person' | 'message';
    quality?: 'poor' | 'neutral' | 'good' | 'great' | 'excellent';
    duration?: number;
  }) {
    const response = await this.client.post(`/relationships/${relationshipId}/interactions`, data, {
      headers: { 'x-user-id': userId }
    });
    return response.data.data;
  }

  // ============================================
  // HUMAN TWIN
  // ============================================

  async getHumanTwin(userId: string) {
    const response = await this.client.get(`/twin/${userId}`);
    return response.data.data;
  }

  async getTwinScore(userId: string) {
    const response = await this.client.get(`/twin/${userId}/score`);
    return response.data.data;
  }

  async getTwinInsights(userId: string) {
    const response = await this.client.get(`/twin/${userId}/insights`);
    return response.data.data;
  }

  // ============================================
  // MENTAL HEALTH
  // ============================================

  async logMood(userId: string, data: {
    mood: number;
    energy: number;
    anxiety: number;
    sleep: number;
    stress: number;
  }) {
    const response = await this.client.post('/mental/mood', { userId, ...data });
    return response.data.data;
  }

  async getMoodTrends(userId: string, period: 'day' | 'week' | 'month' | 'year' = 'week') {
    const response = await this.client.get(`/mental/trends/${userId}`, {
      params: { period }
    });
    return response.data.data;
  }

  async getMentalInsights(userId: string) {
    const response = await this.client.get(`/mental/insights/${userId}`);
    return response.data.data;
  }

  // ============================================
  // SLEEP
  // ============================================

  async logSleep(userId: string, data: {
    date: string;
    bedtime: string;
    wakeTime: string;
    quality: number;
  }) {
    const response = await this.client.post('/sleep', { userId, ...data });
    return response.data.data;
  }

  async getSleepAnalysis(userId: string, days: number = 30) {
    const response = await this.client.get(`/sleep/analysis/${userId}`, {
      params: { days }
    });
    return response.data.data;
  }

  // ============================================
  // CONSULTATIONS
  // ============================================

  async scheduleConsultation(userId: string, data: {
    providerName: string;
    providerType: string;
    date: string;
    reason: string;
  }) {
    const response = await this.client.post('/consultations', data, {
      headers: { 'x-user-id': userId }
    });
    return response.data.data;
  }

  async getUpcomingConsultations(userId: string) {
    const response = await this.client.get('/consultations/upcoming', {
      headers: { 'x-user-id': userId }
    });
    return response.data.data;
  }
}

export const apiService = new ApiService();