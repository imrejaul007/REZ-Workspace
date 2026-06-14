import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private readonly prisma: PrismaService) {}

  async listUsers(filters: {
    search?: string;
    role?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: unknown = {};
    if (filters.role) where.role = filters.role.toUpperCase();
    if (filters.status !== undefined) {
      where.isActive = filters.status === 'active';
    }
    if (filters.search) {
      where.OR = [
        { email: { contains: filters.search, mode: 'insensitive' } },
        { profile: { firstName: { contains: filters.search, mode: 'insensitive' } } },
        { profile: { lastName: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: { profile: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async getUserById(id: string) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id },
      include: { profile: true },
    });
  }

  async updateUserStatus(id: string, isActive: boolean) {
    this.logger.log(`Admin updating user ${id} isActive=${isActive}`);
    return this.prisma.user.update({
      where: { id },
      data: { isActive },
      include: { profile: true },
    });
  }

  async listRestaurants(filters: {
    search?: string;
    status?: string;
    verificationStatus?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: unknown = {};
    if (filters.status !== undefined) {
      where.isActive = filters.status === 'active';
    }
    if (filters.verificationStatus) {
      where.verificationStatus = filters.verificationStatus.toUpperCase();
    }
    if (filters.search) {
      where.name = { contains: filters.search, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      this.prisma.restaurant.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.restaurant.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async getRestaurantById(id: string) {
    return this.prisma.restaurant.findUniqueOrThrow({ where: { id } });
  }

  async updateRestaurantStatus(id: string, dto: { status?: string; verificationStatus?: string }) {
    this.logger.log(`Admin updating restaurant ${id} status`);
    const data: unknown = {};
    if (dto.status !== undefined) data.isActive = dto.status === 'active';
    if (dto.verificationStatus) data.verificationStatus = dto.verificationStatus.toUpperCase();
    return this.prisma.restaurant.update({ where: { id }, data });
  }

  async listVerifications(filters: {
    search?: string;
    status?: string;
    type?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: unknown = {};
    if (filters.status) where.status = filters.status.toUpperCase();
    if (filters.type) where.category = { contains: filters.type, mode: 'insensitive' };
    if (filters.search) {
      where.OR = [
        { businessName: { contains: filters.search, mode: 'insensitive' } },
        { contactEmail: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.vendorApplication.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.vendorApplication.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async updateVerificationStatus(id: string, status: string) {
    this.logger.log(`Admin updating VendorApplication ${id} status=${status}`);
    return this.prisma.vendorApplication.update({
      where: { id },
      data: { status: status.toUpperCase() },
    });
  }
}
