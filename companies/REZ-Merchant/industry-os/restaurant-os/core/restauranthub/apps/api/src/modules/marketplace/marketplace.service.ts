import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RezCatalogClient, RezMerchantClient } from '@restopapa/rez-client';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  MarketplaceCategory,
  MarketplaceSupplier,
  DemandSignal,
  PastOrder,
  SubmitRfqDto,
  Rfq,
  SuppliersQueryDto,
  RegisterVendorDto,
} from './marketplace.dto';

@Injectable()
export class MarketplaceService {
  private readonly logger = new Logger(MarketplaceService.name);

  constructor(
    private readonly catalogClient: RezCatalogClient,
    private readonly merchantClient: RezMerchantClient,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async getCategories(merchantId: string): Promise<MarketplaceCategory[]> {
    const categories = await this.catalogClient.getCategories(merchantId);
    return categories.map((c) => ({
      id: c.id,
      name: c.name,
    }));
  }

  async getSuppliers(filters: SuppliersQueryDto, merchantId: string): Promise<MarketplaceSupplier[]> {
    const suppliers = await this.catalogClient.getSuppliers(merchantId);

    let filtered = suppliers.map((s) => this.toMarketplaceSupplier(s));

    if (filters.city) {
      const cityLower = filters.city.toLowerCase();
      filtered = filtered.filter((s) =>
        s.cities.some((c) => c.toLowerCase().includes(cityLower)),
      );
    }

    if (filters.category) {
      const catLower = filters.category.toLowerCase();
      filtered = filtered.filter((s) =>
        s.category.toLowerCase().includes(catLower),
      );
    }

    // Validate pagination bounds
    let page = filters.page ?? 1;
    let limit = filters.limit ?? 20;

    if (!Number.isInteger(page) || page < 1) page = 1;
    if (!Number.isInteger(limit) || limit < 1) limit = 20;
    if (limit > 100) limit = 100; // Cap max limit

    const start = (page - 1) * limit;

    return filtered.slice(start, start + limit);
  }

  async getSupplierById(supplierId: string, merchantId: string): Promise<MarketplaceSupplier> {
    const suppliers = await this.catalogClient.getSuppliers(merchantId);
    const supplier = suppliers.find((s) => s.id === supplierId);
    if (!supplier) {
      throw new NotFoundException(`Supplier ${supplierId} not found`);
    }
    return this.toMarketplaceSupplier(supplier);
  }

  async getDemandSignals(city?: string, category?: string): Promise<DemandSignal[]> {
    if (!city && !category) return [];

    const demandUrl = this.config.get<string>('REZ_MERCHANT_SERVICE_URL');
    if (!demandUrl) {
      this.logger.warn('REZ_MERCHANT_SERVICE_URL not configured — demand signals unavailable');
      return [];
    }
    const internalToken = this.config.get<string>('INTERNAL_SERVICE_TOKEN', '');

    const params = new URLSearchParams();
    if (city) params.set('city', city);
    if (category) params.set('category', category);

    try {
      const response = await fetch(
        `${demandUrl}/demand-signals?${params.toString()}`,
        {
          headers: {
            'x-internal-token': internalToken,
          },
        },
      );

      if (!response.ok) {
        this.logger.warn(`Demand signals endpoint returned ${response.status}`);
        return [];
      }

      const json: unknown = await response.json();
      return (json.data as DemandSignal[]) ?? [];
    } catch (err: unknown) {
      this.logger.error('Failed to fetch demand signals', err instanceof Error ? err.message : String(err));
      return [];
    }
  }

  async submitRfq(dto: SubmitRfqDto, merchantId: string, restopapaUserId = 'anonymous'): Promise<Rfq> {
    const record = await this.prisma.rfq.create({
      data: {
        supplierId: dto.supplierId,
        merchantId,
        restauranthubUserId: restopapaUserId,
        category: dto.category,
        quantity: dto.quantity,
        unit: dto.unit ?? 'kg',
        deliveryFrequency: dto.deliveryFrequency,
        city: dto.city,
        notes: dto.notes,
        status: 'PENDING',
      },
    });

    this.logger.log(`RFQ submitted: ${record.id} by merchant ${merchantId}`);

    return {
      id: record.id,
      supplierId: record.supplierId,
      merchantId: record.merchantId,
      category: record.category,
      quantity: record.quantity,
      unit: record.unit,
      deliveryFrequency: record.deliveryFrequency ?? undefined,
      city: record.city ?? '',
      notes: record.notes ?? undefined,
      status: record.status as Rfq['status'],
      createdAt: record.createdAt.toISOString(),
    };
  }

  async getOrderHistory(merchantId: string): Promise<PastOrder[]> {
    const orders = await this.merchantClient.getPurchaseOrders(merchantId, 90);
    return orders.map((o) => ({
      id: o.id,
      supplierId: o.supplierId,
      status: o.status,
      totalAmount: o.totalAmount,
      currency: o.currency,
      items: o.items.map((i) => ({
        productId: i.productId,
        productName: i.productName,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        totalPrice: i.totalPrice,
      })),
      createdAt: o.createdAt,
      deliveryDate: o.deliveryDate,
    }));
  }

  async getVendorApplications(filters: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: unknown[]; total: number; page: number; limit: number }> {
    // Validate pagination
    let page = filters.page ?? 1;
    let limit = filters.limit ?? 20;

    if (!Number.isInteger(page) || page < 1) page = 1;
    if (!Number.isInteger(limit) || limit < 1) limit = 20;
    if (limit > 100) limit = 100; // Cap max limit

    const skip = (page - 1) * limit;

    // Validate status filter
    let status: string | undefined;
    if (filters.status) {
      const upperStatus = filters.status.toUpperCase();
      const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'ONBOARDED'];
      if (validStatuses.includes(upperStatus)) {
        status = upperStatus;
      }
    }

    const where = status ? { status } : {};

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

  async registerVendor(dto: RegisterVendorDto): Promise<{ id: string; status: 'pending_review' }> {
    const record = await this.prisma.vendorApplication.create({
      data: {
        businessName: dto.businessName,
        category: dto.category,
        cities: JSON.stringify(dto.citiesServed ?? []),
        contactName: dto.businessName,
        contactEmail: dto.contactEmail,
        contactPhone: dto.contactPhone,
        status: 'PENDING',
      },
    });

    this.logger.log(`Vendor registration submitted: ${record.id} — ${dto.businessName}`);
    return { id: record.id, status: 'pending_review' };
  }

  private toMarketplaceSupplier(s): MarketplaceSupplier {
    return {
      id: s.id,
      name: s.name,
      category: s.category ?? 'General',
      cities: s.cities ?? (s.address ? [s.address] : []),
      rating: s.rating,
      verified: s.isActive ?? true,
      rezVerified: true,
      productCount: s.productCount ?? 0,
      contactEmail: s.contactEmail,
      contactPhone: s.contactPhone,
      address: s.address,
    };
  }
}
