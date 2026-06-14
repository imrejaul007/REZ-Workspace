import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MarketplaceSearchService {
  constructor(private prisma: PrismaService) {}

  async searchProducts(query: any) {
    const { q, category, vendor, minPrice, maxPrice } = query;
    
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
          vendor ? { vendor: { businessName: { contains: vendor } } } : {},
          minPrice ? { priceRange: { gte: minPrice } } : {},
          maxPrice ? { priceRange: { lte: maxPrice } } : {}
        ]
      },
      include: {
        vendor: {
          select: {
            businessName: true,
            logoUrl: true,
            isVerified: true,
            user: {
              select: {
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }
}