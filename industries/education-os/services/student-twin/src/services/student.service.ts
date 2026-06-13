import { StudentTwin, SkillProficiency, SkillGap, Goal, Scholarship } from '../schemas/student.schema';
import { StudentModel } from '../models/student.model';
import Redis from 'redis';
import axios from 'axios';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()],
});

export class StudentService {
  private redisClient: Redis.RedisType | null = null;
  private students: Map<string, StudentTwin> = new Map();

  // Integration URLs
  private memoryOSUrl: string;
  private skillNetUrl: string;
  private businessCopilotUrl: string;

  constructor(config?: {
    redisUrl?: string;
    memoryOSUrl?: string;
    skillNetUrl?: string;
    businessCopilotUrl?: string;
  }) {
    if (config?.redisUrl) {
      this.redisClient = Redis.createClient({ url: config.redisUrl });
    }
    this.memoryOSUrl = config?.memoryOSUrl || process.env.MEMORY_OS_URL || 'http://localhost:4520';
    this.skillNetUrl = config?.skillNetUrl || process.env.SKILLNET_URL || 'http://localhost:5120';
    this.businessCopilotUrl = config?.businessCopilotUrl || process.env.BUSINESS_COPILOT_URL || 'http://localhost:4100';
  }

  async initialize(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.connect();
      logger.info('Student twin connected to Redis');
    }
    logger.info('Student twin service initialized');
  }

  /**
   * Create a new student twin
   */
  async createStudent(data: {
    identity: StudentTwin['identity'];
    metadata: StudentTwin['metadata'];
  }): Promise<StudentTwin> {
    // Check for existing student
    const existingStudent = await this.findStudentByEmail(data.identity.contact.email);
    if (existingStudent) {
      throw new Error(`Student with email ${data.identity.contact.email} already exists`);
    }

    const student = StudentModel.createStudent(data);
    await this.saveStudent(student);

    // Sync to MemoryOS
    await this.syncToMemoryOS(student);

    // Sync to SkillNet
    await this.syncToSkillNet(student);

    logger.info(`Created student twin: ${student.twinId}`);
    return student;
  }

  /**
   * Get student by twin ID
   */
  async getStudent(twinId: string): Promise<StudentTwin | null> {
    const cached = await this.getFromCache(twinId);
    if (cached) {
      return cached;
    }

    const student = this.students.get(twinId);
    if (student) {
      await this.setCache(twinId, student);
      return student;
    }

    return null;
  }

  /**
   * Get student by student ID
   */
  async getStudentByStudentId(studentId: string): Promise<StudentTwin | null> {
    for (const student of this.students.values()) {
      if (student.studentId === studentId) {
        return student;
      }
    }
    return null;
  }

  /**
   * Find student by email
   */
  async findStudentByEmail(email: string): Promise<StudentTwin | null> {
    for (const student of this.students.values()) {
      if (student.identity.contact.email === email) {
        return student;
      }
    }
    return null;
  }

  /**
   * Update student
   */
  async updateStudent(
    twinId: string,
    updates: Partial<StudentTwin>
  ): Promise<StudentTwin | null> {
    const student = await this.getStudent(twinId);
    if (!student) {
      return null;
    }

    const updated = StudentModel.updateStudent(student, updates);
    await this.saveStudent(updated);

    // Notify MemoryOS of update
    await this.notifyMemoryOS(updated, 'student.updated');

    logger.info(`Updated student twin: ${twinId}`);
    return updated;
  }

  /**
   * Delete student
   */
  async deleteStudent(twinId: string): Promise<boolean> {
    const existed = this.students.has(twinId);
    if (existed) {
      this.students.delete(twinId);
      await this.invalidateCache(twinId);
      logger.info(`Deleted student twin: ${twinId}`);
    }
    return existed;
  }

  /**
   * List students with optional filters
   */
  async listStudents(filter?: {
    status?: StudentTwin['metadata']['status'];
    institutionId?: string;
    cohort?: string;
    minChurnRisk?: number;
    maxChurnRisk?: number;
  }): Promise<StudentTwin[]> {
    let students = Array.from(this.students.values());

    if (filter?.status) {
      students = students.filter(s => s.metadata.status === filter.status);
    }
    if (filter?.institutionId) {
      students = students.filter(s => s.relationships.institutionId === filter.institutionId);
    }
    if (filter?.cohort) {
      students = students.filter(s => s.metadata.cohort === filter.cohort);
    }
    if (filter?.minChurnRisk !== undefined) {
      students = students.filter(s => s.predictions.churnRisk >= filter.minChurnRisk);
    }
    if (filter?.maxChurnRisk !== undefined) {
      students = students.filter(s => s.predictions.churnRisk <= filter.maxChurnRisk);
    }

    return students;
  }

  /**
   * Update learning profile
   */
  async updateLearningProfile(
    twinId: string,
    updates: {
      learningStyle?: StudentTwin['learning']['profile']['learningStyle'];
      pace?: StudentTwin['learning']['profile']['pace'];
      preferences?: Partial<StudentTwin['learning']['profile']['preferences']>;
    }
  ): Promise<StudentTwin | null> {
    const student = await this.getStudent(twinId);
    if (!student) {
      return null;
    }

    const updated = StudentModel.updateLearningProfile(student, updates);
    await this.saveStudent(updated);
    await this.notifyMemoryOS(updated, 'student.learning_profile_updated');

    return updated;
  }

  /**
   * Add skill proficiency
   */
  async addSkillProficiency(
    twinId: string,
    skill: SkillProficiency,
    type: 'current' | 'demonstrated' | 'required' = 'current'
  ): Promise<StudentTwin | null> {
    const student = await this.getStudent(twinId);
    if (!student) {
      return null;
    }

    const updated = StudentModel.addSkillProficiency(student, skill, type);
    await this.saveStudent(updated);
    await this.syncToSkillNet(updated);

    return updated;
  }

  /**
   * Add skill gap
   */
  async addSkillGap(twinId: string, gap: SkillGap): Promise<StudentTwin | null> {
    const student = await this.getStudent(twinId);
    if (!student) {
      return null;
    }

    const updated = StudentModel.addSkillGap(student, gap);
    await this.saveStudent(updated);
    await this.notifyMemoryOS(updated, 'student.skill_gap_identified');

    return updated;
  }

  /**
   * Update progress
   */
  async updateProgress(
    twinId: string,
    progress: {
      coursesEnrolled?: number;
      coursesCompleted?: number;
      avgScore?: number;
      totalLearningHours?: number;
    }
  ): Promise<StudentTwin | null> {
    const student = await this.getStudent(twinId);
    if (!student) {
      return null;
    }

    const updated = StudentModel.updateProgress(student, progress);
    await this.saveStudent(updated);

    return updated;
  }

  /**
   * Update predictions
   */
  async updatePredictions(
    twinId: string,
    predictions: Partial<StudentTwin['predictions']>
  ): Promise<StudentTwin | null> {
    const student = await this.getStudent(twinId);
    if (!student) {
      return null;
    }

    const updated = StudentModel.updatePredictions(student, predictions);
    await this.saveStudent(updated);

    // Notify Business Copilot if churn risk changed significantly
    if (predictions.churnRisk !== undefined) {
      await this.notifyBusinessCopilot(updated, 'churn_risk_changed');
    }

    return updated;
  }

  /**
   * Update engagement
   */
  async updateEngagement(
    twinId: string,
    engagement: Partial<StudentTwin['behavior']['engagement']>
  ): Promise<StudentTwin | null> {
    const student = await this.getStudent(twinId);
    if (!student) {
      return null;
    }

    const updated = StudentModel.updateEngagement(student, engagement);
    await this.saveStudent(updated);

    return updated;
  }

  /**
   * Update attendance
   */
  async updateAttendance(
    twinId: string,
    attendance: { present?: boolean; onTime?: boolean }
  ): Promise<StudentTwin | null> {
    const student = await this.getStudent(twinId);
    if (!student) {
      return null;
    }

    const updated = StudentModel.updateAttendance(student, attendance);
    await this.saveStudent(updated);

    return updated;
  }

  /**
   * Enroll in course
   */
  async enrollInCourse(twinId: string, courseTwinId: string): Promise<StudentTwin | null> {
    const student = await this.getStudent(twinId);
    if (!student) {
      return null;
    }

    const updated = StudentModel.enrollInCourse(student, courseTwinId);
    await this.saveStudent(updated);
    await this.notifyMemoryOS(updated, 'student.enrolled_in_course');

    return updated;
  }

  /**
   * Complete course
   */
  async completeCourse(twinId: string, courseTwinId: string): Promise<StudentTwin | null> {
    const student = await this.getStudent(twinId);
    if (!student) {
      return null;
    }

    const updated = StudentModel.completeCourse(student, courseTwinId);
    await this.saveStudent(updated);
    await this.notifyMemoryOS(updated, 'student.course_completed');

    return updated;
  }

  /**
   * Add scholarship
   */
  async addScholarship(
    twinId: string,
    scholarship: Scholarship
  ): Promise<StudentTwin | null> {
    const student = await this.getStudent(twinId);
    if (!student) {
      return null;
    }

    const updated = StudentModel.addScholarship(student, scholarship);
    await this.saveStudent(updated);

    return updated;
  }

  /**
   * Add goal
   */
  async addGoal(
    twinId: string,
    goal: Goal,
    type: 'shortTerm' | 'longTerm'
  ): Promise<StudentTwin | null> {
    const student = await this.getStudent(twinId);
    if (!student) {
      return null;
    }

    const updated = StudentModel.addGoal(student, goal, type);
    await this.saveStudent(updated);

    return updated;
  }

  /**
   * Get at-risk students
   */
  async getAtRiskStudents(threshold: number = 0.5): Promise<StudentTwin[]> {
    const students = await this.listStudents({ status: 'active' });
    return students.filter(s => s.predictions.churnRisk >= threshold);
  }

  /**
   * Get student insights
   */
  async getStudentInsights(twinId: string): Promise<{
    student: StudentTwin;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    engagementLevel: 'low' | 'medium' | 'high';
    skillGapCount: number;
    recommendedActions: string[];
  } | null> {
    const student = await this.getStudent(twinId);
    if (!student) {
      return null;
    }

    const riskLevel = student.predictions.churnRisk >= 0.7 ? 'critical' :
      student.predictions.churnRisk >= 0.5 ? 'high' :
        student.predictions.churnRisk >= 0.3 ? 'medium' : 'low';

    const engagementLevel = student.behavior.engagement.engagementScore >= 70 ? 'high' :
      student.behavior.engagement.engagementScore >= 40 ? 'medium' : 'low';

    const recommendedActions: string[] = [];

    if (riskLevel === 'high' || riskLevel === 'critical') {
      recommendedActions.push('Schedule immediate intervention');
      recommendedActions.push('Contact guardian');
    }

    if (student.learning.skills.gaps.length > 3) {
      recommendedActions.push('Provide targeted tutoring');
    }

    if (student.behavior.attendance.rate < 0.8) {
      recommendedActions.push('Implement attendance improvement plan');
    }

    if (student.assessment.scores.trend === 'declining') {
      recommendedActions.push('Review learning approach');
    }

    return {
      student,
      riskLevel,
      engagementLevel,
      skillGapCount: student.learning.skills.gaps.length,
      recommendedActions
    };
  }

  // Private helper methods

  private async saveStudent(student: StudentTwin): Promise<void> {
    this.students.set(student.twinId, student);
    await this.setCache(student.twinId, student);
  }

  private async getFromCache(twinId: string): Promise<StudentTwin | null> {
    if (!this.redisClient) return null;
    try {
      const cached = await this.redisClient.get(`student:${twinId}`);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      logger.error(`Cache read error: ${error}`);
      return null;
    }
  }

  private async setCache(twinId: string, student: StudentTwin): Promise<void> {
    if (!this.redisClient) return;
    try {
      await this.redisClient.setEx(`student:${twinId}`, 3600, JSON.stringify(student));
    } catch (error) {
      logger.error(`Cache write error: ${error}`);
    }
  }

  private async invalidateCache(twinId: string): Promise<void> {
    if (!this.redisClient) return;
    try {
      await this.redisClient.del(`student:${twinId}`);
    } catch (error) {
      logger.error(`Cache invalidation error: ${error}`);
    }
  }

  private async syncToMemoryOS(student: StudentTwin): Promise<void> {
    try {
      await axios.post(`${this.memoryOSUrl}/api/memory/student`, {
        twinId: student.twinId,
        studentId: student.studentId,
        learningStyle: student.learning.profile.learningStyle,
        pace: student.learning.profile.pace,
        preferences: student.learning.profile.preferences,
        engagement: student.behavior.engagement
      });
      logger.info(`Synced student ${student.twinId} to MemoryOS`);
    } catch (error) {
      logger.error(`Failed to sync to MemoryOS: ${error}`);
    }
  }

  private async syncToSkillNet(student: StudentTwin): Promise<void> {
    try {
      await axios.post(`${this.skillNetUrl}/api/skill-profile`, {
        twinId: student.twinId,
        studentId: student.studentId,
        skills: {
          current: student.learning.skills.current,
          demonstrated: student.learning.skills.demonstrated,
          required: student.learning.skills.required
        }
      });
      logger.info(`Synced student ${student.twinId} to SkillNet`);
    } catch (error) {
      logger.error(`Failed to sync to SkillNet: ${error}`);
    }
  }

  private async notifyMemoryOS(
    student: StudentTwin,
    eventType: string
  ): Promise<void> {
    try {
      await axios.post(`${this.memoryOSUrl}/api/events`, {
        eventType,
        twinId: student.twinId,
        studentId: student.studentId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error(`Failed to notify MemoryOS: ${error}`);
    }
  }

  private async notifyBusinessCopilot(
    student: StudentTwin,
    alertType: string
  ): Promise<void> {
    try {
      await axios.post(`${this.businessCopilotUrl}/api/alerts`, {
        alertType,
        twinId: student.twinId,
        studentId: student.studentId,
        churnRisk: student.predictions.churnRisk,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error(`Failed to notify Business Copilot: ${error}`);
    }
  }

  async close(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.quit();
    }
  }
}
