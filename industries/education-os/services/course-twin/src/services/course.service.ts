import { CourseTwin } from '../schemas/course.schema';
import { CourseModel } from '../models/course.model';
import Redis from 'redis';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});

export class CourseService {
  private redisClient: Redis.RedisType | null = null;
  private courses: Map<string, CourseTwin> = new Map();

  constructor(redisUrl?: string) {
    if (redisUrl) {
      this.redisClient = Redis.createClient({ url: redisUrl });
    }
  }

  async initialize(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.connect();
    }
    logger.info('Course twin service initialized');
  }

  async createCourse(data: { identity: CourseTwin['identity']; metadata: CourseTwin['metadata'] }): Promise<CourseTwin> {
    const course = CourseModel.createCourse(data);
    await this.saveCourse(course);
    logger.info(`Created course twin: ${course.twinId}`);
    return course;
  }

  async getCourse(twinId: string): Promise<CourseTwin | null> {
    const cached = await this.getFromCache(twinId);
    if (cached) return cached;
    const course = this.courses.get(twinId);
    if (course) {
      await this.setCache(twinId, course);
      return course;
    }
    return null;
  }

  async getCourseByCode(code: string): Promise<CourseTwin | null> {
    for (const course of this.courses.values()) {
      if (course.identity.code === code) return course;
    }
    return null;
  }

  async updateCourse(twinId: string, updates: Partial<CourseTwin>): Promise<CourseTwin | null> {
    const course = await this.getCourse(twinId);
    if (!course) return null;
    const updated = CourseModel.updateCourse(course, updates);
    await this.saveCourse(updated);
    return updated;
  }

  async deleteCourse(twinId: string): Promise<boolean> {
    const existed = this.courses.has(twinId);
    if (existed) {
      this.courses.delete(twinId);
      await this.invalidateCache(twinId);
    }
    return existed;
  }

  async listCourses(filter?: { status?: string; category?: string; level?: string; institutionId?: string }): Promise<CourseTwin[]> {
    let courses = Array.from(this.courses.values());
    if (filter?.status) courses = courses.filter(c => c.metadata.status === filter.status);
    if (filter?.category) courses = courses.filter(c => c.identity.category === filter.category);
    if (filter?.level) courses = courses.filter(c => c.identity.level === filter.level);
    if (filter?.institutionId) courses = courses.filter(c => c.relationships.institutionId === filter.institutionId);
    return courses;
  }

  async addModule(twinId: string, module: CourseTwin['content']['modules'][0]): Promise<CourseTwin | null> {
    const course = await this.getCourse(twinId);
    if (!course) return null;
    const updated = CourseModel.addModule(course, module);
    await this.saveCourse(updated);
    return updated;
  }

  async enrollStudent(twinId: string): Promise<CourseTwin | null> {
    const course = await this.getCourse(twinId);
    if (!course) return null;
    const updated = CourseModel.enrollStudent(course);
    await this.saveCourse(updated);
    return updated;
  }

  async setInstructor(twinId: string, instructorType: 'primary' | 'secondary' | 'ta', teacherTwinId: string): Promise<CourseTwin | null> {
    const course = await this.getCourse(twinId);
    if (!course) return null;
    const updated = CourseModel.setInstructor(course, instructorType, teacherTwinId);
    await this.saveCourse(updated);
    return updated;
  }

  async getCourseEnrollment(twinId: string): Promise<CourseTwin['enrollment'] | null> {
    const course = await this.getCourse(twinId);
    return course ? course.enrollment : null;
  }

  async getCourseContent(twinId: string): Promise<CourseTwin['content'] | null> {
    const course = await this.getCourse(twinId);
    return course ? course.content : null;
  }

  private async saveCourse(course: CourseTwin): Promise<void> {
    this.courses.set(course.twinId, course);
    await this.setCache(course.twinId, course);
  }

  private async getFromCache(twinId: string): Promise<CourseTwin | null> {
    if (!this.redisClient) return null;
    try {
      const cached = await this.redisClient.get(`course:${twinId}`);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  }

  private async setCache(twinId: string, course: CourseTwin): Promise<void> {
    if (!this.redisClient) return;
    try {
      await this.redisClient.setEx(`course:${twinId}`, 3600, JSON.stringify(course));
    } catch {}
  }

  private async invalidateCache(twinId: string): Promise<void> {
    if (!this.redisClient) return;
    try {
      await this.redisClient.del(`course:${twinId}`);
    } catch {}
  }

  async close(): Promise<void> {
    if (this.redisClient) await this.redisClient.quit();
  }
}