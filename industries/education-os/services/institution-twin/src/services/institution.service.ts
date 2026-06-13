import { InstitutionTwin, Program } from '../schemas/institution.schema';
import { InstitutionModel } from '../models/institution.model';
import Redis from 'redis';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});

export class InstitutionService {
  private redisClient: Redis.RedisType | null = null;
  private institutions: Map<string, InstitutionTwin> = new Map();

  constructor(redisUrl?: string) {
    if (redisUrl) {
      this.redisClient = Redis.createClient({ url: redisUrl });
    }
  }

  async initialize(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.connect();
    }
    logger.info('Institution twin service initialized');
  }

  async createInstitution(data: {
    identity: InstitutionTwin['identity'];
    metadata: InstitutionTwin['metadata'];
  }): Promise<InstitutionTwin> {
    const inst = InstitutionModel.createInstitution(data);
    await this.saveInstitution(inst);
    logger.info(`Created institution twin: ${inst.twinId}`);
    return inst;
  }

  async getInstitution(twinId: string): Promise<InstitutionTwin | null> {
    const cached = await this.getFromCache(twinId);
    if (cached) return cached;
    const inst = this.institutions.get(twinId);
    if (inst) {
      await this.setCache(twinId, inst);
      return inst;
    }
    return null;
  }

  async getInstitutionByMerchantId(merchantId: string): Promise<InstitutionTwin | null> {
    for (const inst of this.institutions.values()) {
      if (inst.merchantId === merchantId) return inst;
    }
    return null;
  }

  async updateInstitution(twinId: string, updates: Partial<InstitutionTwin>): Promise<InstitutionTwin | null> {
    const inst = await this.getInstitution(twinId);
    if (!inst) return null;
    const updated = InstitutionModel.updateInstitution(inst, updates);
    await this.saveInstitution(updated);
    return updated;
  }

  async deleteInstitution(twinId: string): Promise<boolean> {
    const existed = this.institutions.has(twinId);
    if (existed) {
      this.institutions.delete(twinId);
      await this.invalidateCache(twinId);
    }
    return existed;
  }

  async listInstitutions(filter?: { status?: string; type?: string }): Promise<InstitutionTwin[]> {
    let insts = Array.from(this.institutions.values());
    if (filter?.status) insts = insts.filter(i => i.metadata.status === filter.status);
    if (filter?.type) insts = insts.filter(i => i.identity.type === filter.type);
    return insts;
  }

  async addStudent(twinId: string): Promise<InstitutionTwin | null> {
    const inst = await this.getInstitution(twinId);
    if (!inst) return null;
    const updated = InstitutionModel.addStudent(inst);
    await this.saveInstitution(updated);
    return updated;
  }

  async addTeacher(twinId: string): Promise<InstitutionTwin | null> {
    const inst = await this.getInstitution(twinId);
    if (!inst) return null;
    const updated = InstitutionModel.addTeacher(inst);
    await this.saveInstitution(updated);
    return updated;
  }

  async addDepartment(twinId: string, dept: InstitutionTwin['structure']['departments'][0]): Promise<InstitutionTwin | null> {
    const inst = await this.getInstitution(twinId);
    if (!inst) return null;
    const updated = InstitutionModel.addDepartment(inst, dept);
    await this.saveInstitution(updated);
    return updated;
  }

  async addProgram(twinId: string, program: Program, category: 'academic' | 'vocational' | 'corporate' | 'online'): Promise<InstitutionTwin | null> {
    const inst = await this.getInstitution(twinId);
    if (!inst) return null;
    const updated = InstitutionModel.addProgram(inst, program, category);
    await this.saveInstitution(updated);
    return updated;
  }

  async updatePerformance(twinId: string, perf: Partial<InstitutionTwin['performance']>): Promise<InstitutionTwin | null> {
    const inst = await this.getInstitution(twinId);
    if (!inst) return null;
    const updated = InstitutionModel.updatePerformance(inst, perf);
    await this.saveInstitution(updated);
    return updated;
  }

  async setIntegration(twinId: string, integrationType: 'erp' | 'lms' | 'payment', url: string): Promise<InstitutionTwin | null> {
    const inst = await this.getInstitution(twinId);
    if (!inst) return null;
    const updated = InstitutionModel.setIntegration(inst, integrationType, url);
    await this.saveInstitution(updated);
    return updated;
  }

  async getInstitutionPerformance(twinId: string): Promise<InstitutionTwin['performance'] | null> {
    const inst = await this.getInstitution(twinId);
    return inst ? inst.performance : null;
  }

  async getInstitutionPeople(twinId: string): Promise<InstitutionTwin['people'] | null> {
    const inst = await this.getInstitution(twinId);
    return inst ? inst.people : null;
  }

  private async saveInstitution(inst: InstitutionTwin): Promise<void> {
    this.institutions.set(inst.twinId, inst);
    await this.setCache(inst.twinId, inst);
  }

  private async getFromCache(twinId: string): Promise<InstitutionTwin | null> {
    if (!this.redisClient) return null;
    try {
      const cached = await this.redisClient.get(`institution:${twinId}`);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  }

  private async setCache(twinId: string, inst: InstitutionTwin): Promise<void> {
    if (!this.redisClient) return;
    try {
      await this.redisClient.setEx(`institution:${twinId}`, 3600, JSON.stringify(inst));
    } catch {}
  }

  private async invalidateCache(twinId: string): Promise<void> {
    if (!this.redisClient) return;
    try {
      await this.redisClient.del(`institution:${twinId}`);
    } catch {}
  }

  async close(): Promise<void> {
    if (this.redisClient) await this.redisClient.quit();
  }
}