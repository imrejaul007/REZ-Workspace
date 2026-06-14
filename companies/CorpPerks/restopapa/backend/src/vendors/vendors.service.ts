import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VendorsService {
  constructor(private prisma: PrismaService) {}

  async findAll(page = 1, limit = 20, filters?: any) {
    const skip = (page - 1) * limit;
    const where: any = { isVerified: true };

    if (filters?.category) {
      where.category = filters.category;
    }

    const [vendors, total] = await Promise.all([
      this.prisma.vendor.findMany({
        where,
        skip,
        take: limit,
        include: {
          addresses: true,
          offerings: {
            where: { isActive: true },
            take: 5,
          },
          _count: {
            select: {
              reviews: true,
              offerings: { where: { isActive: true } },
            },
          },
        },
        orderBy: [
          { isPremium: 'desc' },
          { trustScore: 'desc' },
          { createdAt: 'desc' },
        ],
      }),
      this.prisma.vendor.count({ where }),
    ]);

    return {
      vendors,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }
}