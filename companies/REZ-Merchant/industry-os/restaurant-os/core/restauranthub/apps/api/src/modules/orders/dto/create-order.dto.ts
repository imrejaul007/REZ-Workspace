import { IsString, IsNumber, IsArray, IsOptional, IsEnum, ValidateNested, Min, Max, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for creating an individual order item
 */
export class OrderItemDto {
  @IsString()
  productId!: string;

  @IsString()
  productName!: string;

  @IsNumber()
  @Min(1)
  quantity!: number;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsOptional()
  @IsArray()
  modifications?: string[];

  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * DTO for address information
 */
export class AddressDto {
  @IsString()
  name!: string;

  @IsString()
  phone!: string;

  @IsString()
  addressLine1!: string;

  @IsOptional()
  @IsString()
  addressLine2?: string;

  @IsString()
  city!: string;

  @IsString()
  state!: string;

  @IsString()
  pincode!: string;

  @IsOptional()
  @IsString()
  landmark?: string;
}

/**
 * DTO for creating an order
 */
export class CreateOrderDto {
  @IsString()
  customerId!: string;

  @IsString()
  restaurantId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];

  @IsEnum(['delivery', 'pickup', 'dine_in'])
  fulfillmentType!: 'delivery' | 'pickup' | 'dine_in';

  @ValidateNested()
  @Type(() => AddressDto)
  deliveryAddress!: AddressDto;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  specialInstructions?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  creditUsed?: number;

  @IsEnum(['card', 'wallet', 'cod', 'upi'])
  paymentMethod!: 'card' | 'wallet' | 'cod' | 'upi';

  @IsOptional()
  @IsString()
  promoCode?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  rezCoinsUsed?: number;

  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}
