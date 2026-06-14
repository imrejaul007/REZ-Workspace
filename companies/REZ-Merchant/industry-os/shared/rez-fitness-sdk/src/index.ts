/**
 * REZ Fitness OS - Unified SDK
 */

import axios, { AxiosInstance } from 'axios';

export interface FitnessSDKConfig {
  baseURL?: string;
  apiKey?: string;
}

class BaseClient {
  protected client: AxiosInstance;

  constructor(baseURL: string, config: FitnessSDKConfig) {
    this.client = axios.create({
      baseURL,
      timeout: config.timeout || 30000,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  protected async get<T>(path: string, params?: object): Promise<T> {
    const response = await this.client.get(path, { params });
    return response.data;
  }

  protected async post<T>(path: string, data?: object): Promise<T> {
    const response = await this.client.post(path, data);
    return response.data;
  }
}

// =============================================================================
// Fitness Main
// =============================================================================

export interface Member {
  id: string;
  name: string;
  phone: string;
  plan: string;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'expired' | 'cancelled';
}

export interface Class {
  id: string;
  name: string;
  trainer: string;
  duration: number;
  capacity: number;
  enrolled: number;
}

export class FitnessClient extends BaseClient {
  constructor(config: FitnessSDKConfig) {
    super(config.baseURL || 'http://localhost:4551', config);
  }

  async getMembers(): Promise<Member[]> {
    return this.get('/api/members');
  }

  async getClasses(date?: string): Promise<Class[]> {
    return this.get('/api/classes', { date });
  }

  async enrollMember(classId: string, memberId: string): Promise<void> {
    await this.post('/api/classes/${classId}/enroll', { memberId });
  }
}

// =============================================================================
// Gym Access
// =============================================================================

export interface AccessLog {
  id: string;
  memberId: string;
  timestamp: Date;
  type: 'entry' | 'exit';
}

export class GymClient extends BaseClient {
  constructor(config: FitnessSDKConfig) {
    super(config.baseURL || 'http://localhost:4552', config);
  }

  async checkIn(memberId: string): Promise<void> {
    await this.post('/api/access/checkin', { memberId });
  }

  async checkOut(memberId: string): Promise<void> {
    await this.post('/api/access/checkout', { memberId });
  }

  async getLogs(memberId: string, date: string): Promise<AccessLog[]> {
    return this.get('/api/access/logs', { memberId, date });
  }
}

// =============================================================================
// Factory
// =============================================================================

export function createFitnessSDK(config: FitnessSDKConfig = {}): {
  fitness: FitnessClient;
  gym: GymClient;
} {
  return {
    fitness: new FitnessClient(config),
    gym: new GymClient(config),
  };
}

export default createFitnessSDK;
