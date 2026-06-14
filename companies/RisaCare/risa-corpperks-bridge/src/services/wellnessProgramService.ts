import { WellnessProgram, IWellnessProgram, Enrollment } from '../models';
import { WellnessProgram as WellnessProgramType } from '../types';

export class WellnessProgramService {
  /**
   * Get all wellness programs
   */
  async getAllPrograms(options?: {
    category?: string;
    targetAudience?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ programs: IWellnessProgram[]; total: number }> {
    const filter: Record<string, unknown> = {};

    if (options?.category) filter.category = options.category;
    if (options?.targetAudience) filter.targetAudience = options.targetAudience;
    if (options?.status) filter.status = options.status;

    const [programs, total] = await Promise.all([
      WellnessProgram.find(filter)
        .skip(options?.offset || 0)
        .limit(options?.limit || 50)
        .sort({ name: 1 }),
      WellnessProgram.countDocuments(filter),
    ]);

    return { programs, total };
  }

  /**
   * Get program by ID
   */
  async getProgram(programId: string): Promise<IWellnessProgram | null> {
    return WellnessProgram.findOne({ programId });
  }

  /**
   * Create or update program
   */
  async upsertProgram(data: WellnessProgramType): Promise<IWellnessProgram> {
    const existing = await WellnessProgram.findOne({ programId: data.programId });

    if (existing) {
      Object.assign(existing, {
        name: data.name,
        description: data.description,
        category: data.category,
        targetAudience: data.targetAudience,
        duration: data.duration,
        frequency: data.frequency,
        pointsReward: data.pointsReward,
        completionCertificate: data.completionCertificate,
        prerequisites: data.prerequisites || [],
        features: data.features,
        status: data.status,
      });
      await existing.save();
      return existing;
    }

    const program = new WellnessProgram(data);
    await program.save();
    return program;
  }

  /**
   * Get programs by category
   */
  async getByCategory(category: string): Promise<IWellnessProgram[]> {
    return WellnessProgram.find({ category, status: 'active' }).sort({ name: 1 });
  }

  /**
   * Update program status
   */
  async updateStatus(
    programId: string,
    status: IWellnessProgram['status']
  ): Promise<IWellnessProgram | null> {
    return WellnessProgram.findOneAndUpdate(
      { programId },
      { status },
      { new: true }
    );
  }

  /**
   * Enroll employee in program
   */
  async enrollEmployee(
    employeeId: string,
    programId: string,
    companyId: string
  ): Promise<Enrollment> {
    const enrollment = new Enrollment({
      enrollmentId: `ENR-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      employeeId,
      programId,
      companyId,
      enrolledAt: new Date(),
      status: 'enrolled',
      progress: 0,
    });

    await enrollment.save();
    return enrollment;
  }

  /**
   * Update enrollment progress
   */
  async updateProgress(
    enrollmentId: string,
    progress: number
  ): Promise<Enrollment | null> {
    const update: Record<string, unknown> = { progress };

    if (progress >= 100) {
      update.status = 'completed';
      update.completedAt = new Date();
    } else {
      update.status = 'in_progress';
    }

    return Enrollment.findOneAndUpdate(
      { enrollmentId },
      update,
      { new: true }
    );
  }

  /**
   * Get enrollments by employee
   */
  async getEmployeeEnrollments(
    employeeId: string,
    options?: { status?: string }
  ): Promise<Enrollment[]> {
    const filter: Record<string, unknown> = { employeeId };
    if (options?.status) filter.status = options.status;

    return Enrollment.find(filter).sort({ enrolledAt: -1 });
  }

  /**
   * Get program statistics
   */
  async getProgramStats(programId: string): Promise<{
    totalEnrollments: number;
    completed: number;
    inProgress: number;
    averageProgress: number;
    completionRate: number;
  }> {
    const enrollments = await Enrollment.find({ programId });

    const completed = enrollments.filter((e) => e.status === 'completed').length;
    const inProgress = enrollments.filter((e) => e.status === 'in_progress').length;
    const progressSum = enrollments.reduce((sum, e) => sum + e.progress, 0);

    return {
      totalEnrollments: enrollments.length,
      completed,
      inProgress,
      averageProgress: enrollments.length > 0 ? progressSum / enrollments.length : 0,
      completionRate: enrollments.length > 0 ? (completed / enrollments.length) * 100 : 0,
    };
  }

  /**
   * Get wellness statistics
   */
  async getStats(companyId?: string): Promise<{
    totalEnrollments: number;
    completed: number;
    inProgress: number;
    averageProgress: number;
    topPrograms: Array<{ programId: string; name: string; enrollments: number }>;
  }> {
    const filter = companyId ? { companyId } : {};

    const [enrollments, programEnrollments] = await Promise.all([
      Enrollment.find(filter),
      Enrollment.aggregate([
        { $match: filter },
        { $group: { _id: '$programId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
    ]);

    const completed = enrollments.filter((e) => e.status === 'completed').length;
    const inProgress = enrollments.filter((e) => e.status === 'in_progress').length;
    const progressSum = enrollments.reduce((sum, e) => sum + e.progress, 0);

    const topPrograms = await Promise.all(
      programEnrollments.map(async (pe) => {
        const program = await WellnessProgram.findOne({ programId: pe._id });
        return {
          programId: pe._id,
          name: program?.name || 'Unknown',
          enrollments: pe.count,
        };
      })
    );

    return {
      totalEnrollments: enrollments.length,
      completed,
      inProgress,
      averageProgress: enrollments.length > 0 ? progressSum / enrollments.length : 0,
      topPrograms,
    };
  }
}

export const wellnessProgramService = new WellnessProgramService();
