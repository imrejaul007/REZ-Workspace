import { IsString, IsEnum, IsOptional, IsNumber, Min } from 'class-validator';

/**
 * DTO for updating order status
 */
export class UpdateOrderStatusDto {
  @IsEnum(['pending', 'confirmed', 'preparing', 'ready', 'dispatched', 'delivered', 'cancelled', 'returned'])
  status!: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'dispatched' | 'delivered' | 'cancelled' | 'returned';

  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * DTO for cancelling an order
 */
export class CancelOrderDto {
  @IsString()
  reason!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  refundAmount?: number;
}

/**
 * DTO for querying orders
 */
export class OrderQueryDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit: number = 20;

  @IsOptional()
  @IsEnum(['pending', 'confirmed', 'preparing', 'ready', 'dispatched', 'delivered', 'cancelled'])
  status?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
