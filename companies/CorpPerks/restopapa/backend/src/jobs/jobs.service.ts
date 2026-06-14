import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JobsService {
  constructor(private prisma: PrismaService) {}

  async findAll(page = 1, limit = 20, filters?: any) {
    const skip = (page - 1) * limit;
    const where: any = { status: 'open' };

    if (filters?.position) {
      where.position = {
        contains: filters.position,
        mode: 'insensitive',
      };
    }
    if (filters?.location) {
      where.location = {
        contains: filters.location,
        mode: 'insensitive',
      };
    }

    const [jobs, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
        skip,
        take: limit,
        include: {
          restaurant: {
            select: {
              businessName: true,
              category: true,
              trustScore: true,
              addresses: {
                where: { isPrimary: true },
                select: { city: true, state: true },
                take: 1,
              },
            },
          },
          _count: {
            select: { applications: true },
          },
        },
        orderBy: [
          { isPremium: 'desc' },
          { createdAt: 'desc' },
        ],
      }),
      this.prisma.job.count({ where }),
    ]);

    return {
      jobs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }
}