import { TeacherTwin } from '../schemas/teacher.schema';
import { TeacherModel } from '../models/teacher.model';
import Redis from 'redis';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});

export class TeacherService {
  private redisClient: Redis.RedisType | null = null;
  private teachers: Map<string, TeacherTwin> = new Map();

  constructor(redisUrl?: string) {
    if (redisUrl) {
      this.redisClient = Redis.createClient({ url: redisUrl });
    }
  }

  async initialize(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.connect();
    }
    logger.info('Teacher twin service initialized');
  }

  async createTeacher(data: { identity: TeacherTwin['identity']; metadata: TeacherTwin['metadata'] }): Promise<TeacherTwin> {
    const existing = await this.findTeacherByEmail(data.identity.contact.email);
    if (existing) {
      throw new Error(`Teacher with email ${data.identity.contact.email} already exists`);
    }
    const teacher = TeacherModel.createTeacher(data);
    await this.saveTeacher(teacher);
    logger.info(`Created teacher twin: ${teacher.twinId}`);
    return teacher;
  }

  async getTeacher(twinId: string): Promise<TeacherTwin | null> {
    const cached = await this.getFromCache(twinId);
    if (cached) return cached;
    const teacher = this.teachers.get(twinId);
    if (teacher) {
      await this.setCache(twinId, teacher);
      return teacher;
    }
    return null;
  }

  async findTeacherByEmail(email: string): Promise<TeacherTwin | null> {
    for (const teacher of this.teachers.values()) {
      if (teacher.identity.contact.email === email) return teacher;
    }
    return null;
  }

  async updateTeacher(twinId: string, updates: Partial<TeacherTwin>): Promise<TeacherTwin | null> {
    const teacher = await this.getTeacher(twinId);
    if (!teacher) return null;
    const updated = TeacherModel.updateTeacher(teacher, updates);
    await this.saveTeacher(updated);
    logger.info(`Updated teacher twin: ${twinId}`);
    return updated;
  }

  async deleteTeacher(twinId: string): Promise<boolean> {
    const existed = this.teachers.has(twinId);
    if (existed) {
      this.teachers.delete(twinId);
      await this.invalidateCache(twinId);
    }
    return existed;
  }

  async listTeachers(filter?: { status?: string; institutionId?: string; department?: string }): Promise<TeacherTwin[]> {
    let teachers = Array.from(this.teachers.values());
    if (filter?.status) teachers = teachers.filter(t => t.metadata.status === filter.status);
    if (filter?.institutionId) teachers = teachers.filter(t => t.relationships.institutionId === filter.institutionId);
    if (filter?.department) teachers = teachers.filter(t => t.relationships.department === filter.department);
    return teachers;
  }

  async addSubjectExpertise(twinId: string, subject: TeacherTwin['expertise']['subjects'][0]): Promise<TeacherTwin | null> {
    const teacher = await this.getTeacher(twinId);
    if (!teacher) return null;
    const updated = TeacherModel.addSubjectExpertise(teacher, subject);
    await this.saveTeacher(updated);
    return updated;
  }

  async addStudent(twinId: string, studentTwinId: string): Promise<TeacherTwin | null> {
    const teacher = await this.getTeacher(twinId);
    if (!teacher) return null;
    const updated = TeacherModel.addStudent(teacher, studentTwinId);
    await this.saveTeacher(updated);
    return updated;
  }

  async addCourse(twinId: string, courseTwinId: string): Promise<TeacherTwin | null> {
    const teacher = await this.getTeacher(twinId);
    if (!teacher) return null;
    const updated = TeacherModel.addCourse(teacher, courseTwinId);
    await this.saveTeacher(updated);
    return updated;
  }

  async getTeacherPerformance(twinId: string): Promise<TeacherTwin['performance'] | null> {
    const teacher = await this.getTeacher(twinId);
    return teacher ? teacher.performance : null;
  }

  private async saveTeacher(teacher: TeacherTwin): Promise<void> {
    this.teachers.set(teacher.twinId, teacher);
    await this.setCache(teacher.twinId, teacher);
  }

  private async getFromCache(twinId: string): Promise<TeacherTwin | null> {
    if (!this.redisClient) return null;
    try {
      const cached = await this.redisClient.get(`teacher:${twinId}`);
      return cached ? JSON.parse(cached) : null;
    } catch { return null; }
  }

  private async setCache(twinId: string, teacher: TeacherTwin): Promise<void> {
    if (!this.redisClient) return;
    try {
      await this.redisClient.setEx(`teacher:${twinId}`, 3600, JSON.stringify(teacher));
    } catch { logger.error('Cache write error'); }
  }

  private async invalidateCache(twinId: string): Promise<void> {
    if (!this.redisClient) return;
    try { await this.redisClient.del(`teacher:${twinId}`); } catch {}
  }

  async close(): Promise<void> {
    if (this.redisClient) await this.redisClient.quit();
  }
}
