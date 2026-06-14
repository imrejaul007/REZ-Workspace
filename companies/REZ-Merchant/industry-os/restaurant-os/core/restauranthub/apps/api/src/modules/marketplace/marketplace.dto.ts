import { IsString, IsNumber, IsOptional, IsArray, IsEmail, Min } from 'class-validator';

export interface MarketplaceCategory {
  id: string;
  name: string;
  icon?: string;
  productCount?: number;
}

export interface MarketplaceSupplier {
  id: string;
  name: string;
  category: string;
  cities: string[];
  rating?: number;
  verified: boolean;
  rezVerified: boolean;
  productCount: number;
  demandSignal?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
}

export interface DemandSignal {
  category: string;
  city: string;
  merchantCount: number;
  avgMonthlyQuantity: number;
  avgUnitPrice: number;
  lastUpdated: string;
}

export interface PastOrder {
  id: string;
  supplierId?: string;
  status: string;
  totalAmount: number;
  currency: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  createdAt: string;
  deliveryDate?: string;
}

export class SubmitRfqDto {
  @IsString()
  supplierId!: string;

  @IsString()
  category!: string;

  @IsNumber()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsString()
  deliveryFrequency?: string;

  @IsString()
  city!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export interface Rfq {
  id: string;
  supplierId: string;
  merchantId: string;
  category: string;
  quantity: number;
  unit?: string;
  deliveryFrequency?: string;
  city: string;
  notes?: string;
  status: 'PENDING' | 'RESPONDED' | 'ACCEPTED';
  createdAt: string;
}

export class RegisterVendorDto {
  @IsString()
  businessName!: string;

  @IsString()
  category!: string;

  @IsArray()
  @IsString({ each: true })
  citiesServed!: string[];

  @IsEmail()
  contactEmail!: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export interface SuppliersQueryDto {
  city?: string;
  category?: string;
  page?: number;
  limit?: number;
}
