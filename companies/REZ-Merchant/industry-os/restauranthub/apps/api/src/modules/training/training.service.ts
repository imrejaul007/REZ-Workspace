import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GapRecommendationEngine } from './gap-recommendation.engine';
import {
  Certification,
  CourseFilters,
  TrainingFeed,
} from './training.dto';
import { getCatalogBySlug } from './training-catalog';

@Injectable()
export class TrainingService {
  private readonly logger = new Logger(TrainingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly engine: GapRecommendationEngine,
  ) {}

  async getPersonalizedFeed(
    userId: string,
    rezMerchantId?: string,
  ): Promise<TrainingFeed> {
    const [recommended, allCourses, completedSlugs] = await Promise.all([
      rezMerchantId
        ? this.engine.getPersonalizedRecommendations(rezMerchantId)
        : Promise.resolve(this.engine.getAllCourses().map((c) => ({ ...c, isGeneral: true }))),
      Promise.resolve(this.engine.getAllCourses()),
      this.getCompletedSlugs(userId),
    ]);

    return { recommended, allCourses, completedSlugs };
  }

  async markComplete(userId: string, courseSlug: string): Promise<void> {
    const course = getCatalogBySlug(courseSlug);
    if (!course) {
      throw new NotFoundException(`Course '${courseSlug}' not found in catalog`);
    }

    await (this.prisma as unknown).courseCompletion.upsert({
      where: { userId_courseSlug: { userId, courseSlug } },
      update: { completedAt: new Date() },
      create: { userId, courseSlug },
    });

    this.logger.log(`User ${userId} completed course ${courseSlug}`);
  }

  async getCertifications(userId: string): Promise<Certification[]> {
    const completions = await (this.prisma as unknown).courseCompletion.findMany({
      where: { userId },
      orderBy: { completedAt: 'desc' },
    });

    return completions.map((c) => {
      const course = getCatalogBySlug(c.courseSlug);
      return {
        id: c.id,
        courseSlug: c.courseSlug,
        courseTitle: course?.title ?? c.courseSlug,
        completedAt: c.completedAt,
        userId: c.userId,
      } satisfies Certification;
    });
  }

  getCourseDetail(slug: string) {
    const course = getCatalogBySlug(slug);
    if (!course) {
      throw new NotFoundException(`Course '${slug}' not found`);
    }
    return course;
  }

  getFilteredCourses(filters?: CourseFilters) {
    return this.engine.getAllCourses(filters);
  }

  private async getCompletedSlugs(userId: string): Promise<string[]> {
    try {
      const completions = await (this.prisma as unknown).courseCompletion.findMany({
        where: { userId },
        select: { courseSlug: true },
      });
      return completions.map((c) => c.courseSlug);
    } catch {
      return [];
    }
  }
}
