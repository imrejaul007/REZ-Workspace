import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreateProductDto {
  categoryId: string;
  name: string;
  slug: string;
  description?: string;
  images?: string[];
  sku: string;
  price: number;
  comparePrice?: number;
  costPrice?: number;
  quantity?: number;
  unit: string;
  minOrderQuantity?: number;
  maxOrderQuantity?: number;
  gstRate?: number;
  hsnCode?: string;
  tags?: string[];
}

export interface UpdateProductDto {
  categoryId?: string;
  name?: string;
  slug?: string;
  description?: string;
  images?: string[];
  price?: number;
  comparePrice?: number;
  costPrice?: number;
  quantity?: number;
  unit?: string;
  minOrderQuantity?: number;
  maxOrderQuantity?: number;
  gstRate?: number;
  hsnCode?: string;
  tags?: string[];
  status?: 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK';
}

@Injectable()
export class VendorProductsService {
  private readonly logger = new Logger(VendorProductsService.name);

  constructor(private readonly prisma: PrismaService) {}

  private async resolveVendorId(userId: string): Promise<string> {
    const vendor = await this.prisma.vendor.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!vendor) {
      throw new ForbiddenException('Vendor profile not found for this user');
    }
    return vendor.id;
  }

  async listProducts(
    userId: string,
    page = 1,
    limit = 20,
  ) {
    const vendorId = await this.resolveVendorId(userId);
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where: { vendorId, deletedAt: null },
        include: { category: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.product.count({ where: { vendorId, deletedAt: null } }),
    ]);

    return { data, total, page, limit };
  }

  async createProduct(userId: string, dto: CreateProductDto) {
    const vendorId = await this.resolveVendorId(userId);

    const product = await this.prisma.product.create({
      data: {
        vendorId,
        categoryId: dto.categoryId,
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        images: dto.images ?? [],
        sku: dto.sku,
        price: dto.price,
        comparePrice: dto.comparePrice,
        costPrice: dto.costPrice,
        quantity: dto.quantity ?? 0,
        unit: dto.unit,
        minOrderQuantity: dto.minOrderQuantity ?? 1,
        maxOrderQuantity: dto.maxOrderQuantity,
        gstRate: dto.gstRate ?? 18,
        hsnCode: dto.hsnCode,
        tags: dto.tags ?? [],
        status: 'ACTIVE',
      },
      include: { category: { select: { id: true, name: true } } },
    });

    this.logger.log(`Product created: ${product.id} by vendor ${vendorId}`);
    return product;
  }

  async getProduct(userId: string, productId: string) {
    const vendorId = await this.resolveVendorId(userId);

    const product = await this.prisma.product.findFirst({
      where: { id: productId, vendorId, deletedAt: null },
      include: { category: { select: { id: true, name: true } } },
    });

    if (!product) {
      throw new NotFoundException(`Product ${productId} not found`);
    }
    return product;
  }

  async updateProduct(
    userId: string,
    productId: string,
    dto: UpdateProductDto,
  ) {
    const vendorId = await this.resolveVendorId(userId);

    const existing = await this.prisma.product.findFirst({
      where: { id: productId, vendorId, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundException(`Product ${productId} not found`);
    }

    const updated = await this.prisma.product.update({
      where: { id: productId },
      data: {
        ...dto,
        updatedAt: new Date(),
      },
      include: { category: { select: { id: true, name: true } } },
    });

    this.logger.log(`Product updated: ${productId} by vendor ${vendorId}`);
    return updated;
  }

  async deleteProduct(userId: string, productId: string) {
    const vendorId = await this.resolveVendorId(userId);

    const existing = await this.prisma.product.findFirst({
      where: { id: productId, vendorId, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundException(`Product ${productId} not found`);
    }

    await this.prisma.product.update({
      where: { id: productId },
      data: { deletedAt: new Date(), status: 'INACTIVE' },
    });

    this.logger.log(`Product soft-deleted: ${productId} by vendor ${vendorId}`);
    return { success: true, message: 'Product deleted' };
  }

  async getVendorStats(userId: string) {
    const vendorId = await this.resolveVendorId(userId);

    const productCount = await this.prisma.product.count({
      where: { vendorId, deletedAt: null },
    });

    return {
      productCount,
      totalViews: 0,
      pendingOrders: 0,
      revenue: 0,
    };
  }
}
