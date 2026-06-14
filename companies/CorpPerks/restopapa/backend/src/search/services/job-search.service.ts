import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface JobSearchFilters {
  query?: string;
  location?: string;
  position?: string;
  department?: string;
  employmentType?: string;
  salaryMin?: number;
  salaryMax?: number;
  experienceMin?: number;
  experienceMax?: number;
  isPremium?: boolean;
  restaurantId?: string;
  status?: string;
}

interface JobSearchOptions {
  page?: number;
  limit?: number;
  sortBy?: 'relevance' | 'date' | 'salary' | 'experience';
  sortOrder?: 'asc' | 'desc';
}

@Injectable()
export class JobSearchService {
  constructor(private prisma: PrismaService) {}

  async searchJobs(filters: JobSearchFilters, options: JobSearchOptions = {}) {
    const {
      query,
      location,
      position,
      department,
      employmentType,
      salaryMin,
      salaryMax,
      experienceMin,
      experienceMax,
      isPremium,
      restaurantId,
      status = 'open'
    } = filters;

    const {
      page = 1,
      limit = 20,
      sortBy = 'date',
      sortOrder = 'desc'
    } = options;

    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {
      status,
      ...(restaurantId && { restaurantId }),
      ...(employmentType && { employmentType }),
      ...(department && { department }),
      ...(isPremium !== undefined && { isPremium }),
    };

    // Add salary range filter
    if (salaryMin !== undefined || salaryMax !== undefined) {
      whereClause.AND = [
        ...(salaryMin !== undefined ? [{ salaryMin: { gte: salaryMin } }] : []),
        ...(salaryMax !== undefined ? [{ salaryMax: { lte: salaryMax } }] : []),
      ];
    }

    // Add experience range filter
    if (experienceMin !== undefined) {
      whereClause.experienceMin = { gte: experienceMin };
    }
    if (experienceMax !== undefined) {
      whereClause.experienceMax = { lte: experienceMax };
    }

    // Add text search filters
    if (query || position || location) {
      const textFilters: any[] = [];

      if (query) {
        textFilters.push(
          { title: { contains: query } },
          { description: { contains: query } },
          { position: { contains: query } },
        );
      }

      if (position) {
        textFilters.push({ position: { contains: position } });
      }

      if (location) {
        textFilters.push({ location: { contains: location } });
      }

      if (textFilters.length > 0) {
        whereClause.AND = (whereClause.AND || []).concat(textFilters);
      }
    }

    // Build order by clause
    let orderBy: any = {};
    switch (sortBy) {
      case 'date':
        orderBy = { createdAt: sortOrder };
        break;
      case 'salary':
        orderBy = [
          { isPremium: 'desc' },
          { salaryMax: sortOrder },
        ];
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }

    const [jobs, total] = await Promise.all([
      this.prisma.job.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy,
        include: {
          restaurant: {
            select: {
              id: true,
              businessName: true,
              logoUrl: true,
              isVerified: true,
            }
          },
          _count: {
            select: { applications: true }
          }
        }
      }),
      this.prisma.job.count({ where: whereClause }),
    ]);

    return {
      jobs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    };
  }
}
