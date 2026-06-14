import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DiscussionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(page = 1, limit = 20, filters?: any) {
    const skip = (page - 1) * limit;
    const where: any = { isActive: true };

    if (filters?.category) {
      where.category = filters.category;
    }

    const [discussions, total] = await Promise.all([
      this.prisma.discussion.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
              restaurant: { select: { businessName: true } },
              vendor: { select: { businessName: true } },
            },
          },
          _count: {
            select: {
              comments: true,
            },
          },
        },
        orderBy: [
          { isPremium: 'desc' },
          { createdAt: 'desc' },
        ],
      }),
      this.prisma.discussion.count({ where }),
    ]);

    return {
      discussions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }
}