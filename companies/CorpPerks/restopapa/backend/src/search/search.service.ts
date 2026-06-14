import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async searchJobs(query: any) {
    const { q, location, department, salaryMin } = query;

    return this.prisma.job.findMany({
      where: {
        AND: [
          q ? {
            OR: [
              { title: { contains: q } },
              { position: { contains: q } },
              { description: { contains: q } }
            ]
          } : {},
          location ? { location: { contains: location } } : {},
          department ? { department: department } : {},
          salaryMin ? { salaryMin: { gte: parseInt(salaryMin, 10) } } : {}
        ]
      },
      include: {
        restaurant: {
          select: {
            businessName: true,
            logoUrl: true,
            isVerified: true
          }
        }
      }
    });
  }

  async searchEmployees(query: any) {
    const { q, skills, experience } = query;

    return this.prisma.employee.findMany({
      where: {
        AND: [
          q ? {
            OR: [
              { fullName: { contains: q } },
              { skills: { contains: q } }
            ]
          } : {},
          skills ? { skills: { contains: skills } } : {},
          experience ? { totalExperienceMonths: { gte: parseInt(experience, 10) * 12 } } : {}
        ]
      },
      include: {
        user: {
          select: {
            email: true,
            phone: true
          }
        }
      }
    });
  }

  async searchProducts(query: any) {
    const { q, category, vendor } = query;

    return this.prisma.vendorOffering.findMany({
      where: {
        AND: [
          q ? {
            OR: [
              { title: { contains: q } },
              { description: { contains: q } }
            ]
          } : {},
          category ? { category: category } : {},
          vendor ? { vendor: { businessName: { contains: vendor } } } : {}
        ]
      },
      include: {
        vendor: {
          select: {
            businessName: true,
            logoUrl: true,
            isVerified: true
          }
        }
      }
    });
  }

  async searchRestaurants(query: any) {
    const { q, city, category } = query;

    return this.prisma.restaurant.findMany({
      where: {
        AND: [
          q ? {
            OR: [
              { businessName: { contains: q } },
              { description: { contains: q } }
            ]
          } : {},
          city ? { addresses: { some: { city: { contains: city } } } } : {},
          category ? { category: category } : {}
        ]
      },
      select: {
        id: true,
        businessName: true,
        logoUrl: true,
        description: true,
        isVerified: true,
        addresses: {
          take: 1
        }
      }
    });
  }
}
