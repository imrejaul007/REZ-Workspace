import {
  IsOptional,
  IsNumber,
  IsString,
  Min,
  Max,
  IsEnum,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

/**
 * DTO for processing the queue
 */
export class ProcessQueueDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 50;
}

/**
 * DTO for getting queue status
 */
export class QueueStatusQueryDto {
  @IsOptional()
  @IsString()
  restaurantId?: string;
}

/**
 * DTO for getting pending orders
 */
export class PendingOrdersQueryDto {
  @IsString()
  restaurantId!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsEnum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'EXPIRED'])
  status?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'EXPIRED';
}

/**
 * DTO for retrying a failed order
 */
export class RetryOrderDto {
  @IsString()
  pendingOrderId!: string;
}

/**
 * DTO for deleting a pending order
 */
export class DeletePendingOrderDto {
  @IsString()
  pendingOrderId!: string;
}

/**
 * DTO for enqueueing an order (used by POS client)
 */
export class EnqueueOrderDto {
  @IsString()
  restaurantId!: string;

  @IsString()
  customerId!: string;

  @IsString()
  fulfillmentType!: 'delivery' | 'pickup' | 'dine_in';

  @IsString()
  paymentMethod!: 'card' | 'wallet' | 'cod' | 'upi';

  // Items are validated in the controller via CreateOrderDto
  items!: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    modifications?: string[];
    notes?: string;
  }>;

  @IsOptional()
  deliveryAddress?: {
    name: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    landmark?: string;
  };

  @IsOptional()
  @IsString()
  specialInstructions?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  creditUsed?: number;

  @IsOptional()
  @IsString()
  promoCode?: string;

  @IsOptional()
  @IsString()
  idempotencyKey?: string;

  @IsOptional()
  @IsString()
  clientOrderId?: string;

  @IsOptional()
  @IsString()
  source?: string = 'pos';
}
