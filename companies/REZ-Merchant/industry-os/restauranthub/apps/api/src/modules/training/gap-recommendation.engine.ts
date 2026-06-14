import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import {
  CourseFilters,
  OperationalGap,
  RecommendedModule,
  TrainingModule,
} from './training.dto';
import {
  TRAINING_CATALOG,
  getCatalogBySlug,
  getGeneralCourses,
} from './training-catalog';

@Injectable()
export class GapRecommendationEngine {
  private readonly logger = new Logger(GapRecommendationEngine.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Fetches operational gaps from Agent A6's analytics endpoint,
   * maps them to catalog entries, and returns a prioritised list.
   * Falls back to general courses when no REZ data is available.
   */
  async getPersonalizedRecommendations(
    rezMerchantId: string,
  ): Promise<RecommendedModule[]> {
    let gaps: OperationalGap[] = [];

    try {
      const analyticsBase = this.configService.get<string>('ANALYTICS_API_URL');
      if (!analyticsBase) {
        this.logger.warn('ANALYTICS_API_URL not set — skipping gap-driven recommendations');
        return this.buildGeneralRecommendations();
      }

      const { data } = await firstValueFrom(
        this.httpService.get<OperationalGap[]>(`${analyticsBase}/analytics/gaps`, {
          params: { rezMerchantId },
          timeout: 5000,
        }),
      );
      gaps = data;
    } catch (err) {
      this.logger.warn(
        `Could not fetch operational gaps for ${rezMerchantId}: ${(err as Error).message}`,
      );
    }

    if (!gaps.length) {
      return this.buildGeneralRecommendations();
    }

    return this.buildGapDrivenRecommendations(gaps);
  }

  private buildGapDrivenRecommendations(gaps: OperationalGap[]): RecommendedModule[] {
    const severityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };

    const sorted = [...gaps].sort(
      (a, b) => severityOrder[a.severity] - severityOrder[b.severity],
    );

    const seen = new Set<string>();
    const recommended: RecommendedModule[] = [];

    for (const gap of sorted) {
      const course = getCatalogBySlug(gap.trainingModuleSlug);
      if (!course || seen.has(course.slug)) continue;
      seen.add(course.slug);

      recommended.push({
        ...course,
        gapContext: this.buildGapContext(gap),
        severity: gap.severity,
        isGeneral: false,
      });
    }

    // Pad with general courses so there is always content to show
    for (const general of getGeneralCourses()) {
      if (seen.has(general.slug)) continue;
      seen.add(general.slug);
      recommended.push({ ...general, isGeneral: true });
    }

    return recommended;
  }

  private buildGeneralRecommendations(): RecommendedModule[] {
    return TRAINING_CATALOG.map((course) => ({
      ...course,
      isGeneral: true,
    }));
  }

  private buildGapContext(gap: OperationalGap): string {
    const diff = Math.abs(gap.yourValue - gap.peerAvg);
    const direction = gap.yourValue > gap.peerAvg ? 'above' : 'below';
    const label = this.metricLabel(gap.metric);
    return `Your ${label} is ${diff.toFixed(1)}% ${direction} your peers`;
  }

  private metricLabel(metric: string): string {
    const labels: Record<string, string> = {
      foodCostPct: 'food cost',
      staffTurnoverRate: 'staff turnover rate',
      avgOrderValue: 'average order value',
      kitchenLatency: 'kitchen ticket time',
      repeatCustomerRate: 'repeat customer rate',
      supplierCostPct: 'supplier cost percentage',
    };
    return labels[metric] ?? metric;
  }

  getAllCourses(filters?: CourseFilters): TrainingModule[] {
    let courses = [...TRAINING_CATALOG];

    if (filters?.tag) {
      courses = courses.filter((c) => c.tags.includes(filters.tag!));
    }

    if (filters?.level) {
      courses = courses.filter((c) => c.level === filters.level);
    }

    return courses;
  }
}
