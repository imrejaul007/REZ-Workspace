import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsNumber,
  IsBoolean,
  IsPhoneNumber,
  ValidateNested,
  IsInt,
  Min,
  Max,
  MinLength,
  MaxLength,
  IsISO8601,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

// ==========================================
// Enums
// ==========================================

/**
 * WhatsApp message template types for restaurant use cases
 */
export enum WhatsAppTemplateType {
  ORDER_CONFIRMATION = 'order_confirmation',
  ORDER_STATUS_UPDATE = 'order_status_update',
  RESERVATION_CONFIRMATION = 'reservation_confirmation',
  RESERVATION_REMINDER = 'reservation_reminder',
  WAIT_TIME_NOTIFICATION = 'wait_time_notification',
  REVIEW_REQUEST = 'review_request',
  CAMPAIGN_PROMOTIONAL = 'campaign_promotional',
  CAMPAIGN_LOYALTY = 'campaign_loyalty',
  CAMPAIGN_SEASONAL = 'campaign_seasonal',
  DELIVERY_UPDATE = 'delivery_update',
  PAYMENT_CONFIRMATION = 'payment_confirmation',
  CUSTOM = 'custom',
}

/**
 * Order status values
 */
export enum OrderStatusEnum {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  PROCESSING = 'PROCESSING',
  READY = 'READY',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

/**
 * Message delivery status
 */
export enum MessageDeliveryStatus {
  PENDING = 'PENDING',
  QUEUED = 'QUEUED',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED',
  BOUNCED = 'BOUNCED',
}

/**
 * Campaign status
 */
export enum CampaignStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  SENDING = 'SENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

/**
 * Priority levels for message delivery
 */
export enum MessagePriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

// ==========================================
// Order DTOs
// ==========================================

/**
 * Order item for WhatsApp message
 */
export class OrderItemDto {
  @IsString()
  productId: string;

  @IsString()
  @IsOptional()
  productName?: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  totalAmount?: number;
}

/**
 * Order data for WhatsApp notifications
 */
export class OrderWhatsAppDto {
  @IsString()
  @MinLength(1)
  orderId: string;

  @IsString()
  @MinLength(1)
  orderNumber: string;

  @IsString()
  @MinLength(1)
  restaurantId: string;

  @IsString()
  @IsOptional()
  restaurantName?: string;

  @IsString()
  @IsPhoneNumber('IN')
  customerPhone: string;

  @IsString()
  @IsOptional()
  customerName?: string;

  @IsEnum(OrderStatusEnum)
  status: OrderStatusEnum;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsNumber()
  @Min(0)
  subtotal: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  gstAmount?: number;

  @IsNumber()
  @Min(0)
  totalAmount: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  discountAmount?: number;

  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @IsEnum(PaymentStatus)
  @IsOptional()
  paymentStatus?: 'PENDING' | 'COMPLETED' | 'FAILED';

  @IsString()
  @IsOptional()
  deliveryAddress?: string;

  @IsISO8601()
  @IsOptional()
  estimatedDeliveryTime?: string;

  @IsString()
  @IsOptional()
  specialInstructions?: string;

  @IsEnum(MessagePriority)
  @IsOptional()
  priority?: MessagePriority;

  @IsBoolean()
  @IsOptional()
  sendToKitchen?: boolean;
}

/**
 * Status update DTO
 */
export class StatusUpdateDto {
  @IsString()
  @MinLength(1)
  orderId: string;

  @IsString()
  @MinLength(1)
  restaurantId: string;

  @IsEnum(OrderStatusEnum)
  status: OrderStatusEnum;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  message?: string;

  @IsISO8601()
  @IsOptional()
  estimatedTime?: string;

  @IsBoolean()
  @IsOptional()
  notifyKitchen?: boolean;

  @IsEnum(MessagePriority)
  @IsOptional()
  priority?: MessagePriority;
}

// ==========================================
// Reservation DTOs
// ==========================================

/**
 * Customer info for reservation
 */
export class ReservationCustomerDto {
  @IsString()
  @MinLength(1)
  customerId: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsPhoneNumber('IN')
  phone: string;

  @IsString()
  @IsOptional()
  email?: string;
}

/**
 * Reservation data for WhatsApp notifications
 */
export class ReservationWhatsAppDto {
  @IsString()
  @MinLength(1)
  reservationId: string;

  @IsString()
  @MinLength(1)
  restaurantId: string;

  @IsString()
  @IsOptional()
  restaurantName?: string;

  @IsString()
  @IsPhoneNumber('IN')
  customerPhone: string;

  @IsString()
  @IsOptional()
  customerName?: string;

  @IsInt()
  @Min(1)
  @Max(1000)
  partySize: number;

  @IsISO8601()
  reservationTime: string;

  @IsString()
  @IsOptional()
  tableNumber?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;

  @IsEnum(MessagePriority)
  @IsOptional()
  priority?: MessagePriority;
}

/**
 * Wait time notification DTO
 */
export class WaitTimeNotificationDto {
  @IsString()
  @MinLength(1)
  restaurantId: string;

  @IsString()
  @IsOptional()
  restaurantName?: string;

  @IsArray()
  @IsPhoneNumber('IN', { each: true })
  customerPhones: string[];

  @IsInt()
  @Min(0)
  estimatedWaitMinutes: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  currentQueuePosition?: number;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  message?: string;

  @IsBoolean()
  @IsOptional()
  isWalkIn?: boolean;
}

// ==========================================
// Review Request DTOs
// ==========================================

/**
 * Review request DTO
 */
export class ReviewRequestDto {
  @IsString()
  @MinLength(1)
  orderId: string;

  @IsString()
  @MinLength(1)
  orderNumber: string;

  @IsString()
  @MinLength(1)
  restaurantId: string;

  @IsString()
  @IsOptional()
  restaurantName?: string;

  @IsString()
  @IsPhoneNumber('IN')
  customerPhone: string;

  @IsString()
  @IsOptional()
  customerName?: string;

  @IsString()
  @IsOptional()
  reviewLink?: string;

  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  orderRating?: number;

  @IsBoolean()
  @IsOptional()
  requestPhotoReview?: boolean;
}

// ==========================================
// Campaign DTOs
// ==========================================

/**
 * Campaign target segment
 */
export enum CampaignTargetSegment {
  ALL_CUSTOMERS = 'all_customers',
  NEW_CUSTOMERS = 'new_customers',
  REGULAR_CUSTOMERS = 'regular_customers',
  VIP_CUSTOMERS = 'vip_customers',
  INACTIVE_CUSTOMERS = 'inactive_customers',
  BIRTHDAY_TODAY = 'birthday_today',
  ANNIVERSARY_TODAY = 'anniversary_today',
  ORDER_HISTORY = 'order_history',
}

/**
 * Campaign type
 */
export enum CampaignType {
  PROMOTIONAL = 'promotional',
  LOYALTY = 'loyalty',
  SEASONAL = 'seasonal',
  RE_ENGAGEMENT = 're_engagement',
  NEW_ITEM = 'new_item',
  SPECIAL_OFFER = 'special_offer',
}

/**
 * Campaign media content
 */
export class CampaignMediaDto {
  @IsString()
  @IsOptional()
  mediaUrl?: string;

  @IsString()
  @IsOptional()
  mediaType?: 'image' | 'video' | 'document';

  @IsString()
  @IsOptional()
  caption?: string;
}

/**
 * Campaign DTO
 */
export class CampaignDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsString()
  @MinLength(1)
  restaurantId: string;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  messageTemplate: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  mediaUrls?: string[];

  @IsEnum(CampaignType)
  campaignType: CampaignType;

  @IsEnum(CampaignTargetSegment)
  targetSegment: CampaignTargetSegment;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  customerIds?: string[];

  @IsISO8601()
  @IsOptional()
  scheduledAt?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsInt()
  @Min(0)
  @IsOptional()
  discountPercentage?: number;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  promoCode?: string;

  @IsISO8601()
  @IsOptional()
  validUntil?: string;
}

/**
 * Campaign result
 */
export interface CampaignResult {
  success: boolean;
  campaignId?: string;
  totalRecipients: number;
  sent: number;
  failed: number;
  queued: number;
  message?: string;
  errors?: string[];
}

// ==========================================
// Query DTOs
// ==========================================

/**
 * Query parameters for fetching messages
 */
export class MessageQueryDto {
  @IsInt()
  @Min(1)
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  page?: number = 1;

  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 20;

  @IsString()
  @IsOptional()
  restaurantId?: string;

  @IsString()
  @IsOptional()
  customerPhone?: string;

  @IsEnum(MessageDeliveryStatus)
  @IsOptional()
  status?: MessageDeliveryStatus;

  @IsEnum(WhatsAppTemplateType)
  @IsOptional()
  templateType?: WhatsAppTemplateType;

  @IsISO8601()
  @IsOptional()
  fromDate?: string;

  @IsISO8601()
  @IsOptional()
  toDate?: string;
}

// ==========================================
// Response DTOs
// ==========================================

/**
 * WhatsApp message send result
 */
export interface SendMessageResult {
  success: boolean;
  messageId?: string;
  phone: string;
  status: MessageDeliveryStatus;
  sentAt?: Date;
  queuedAt?: Date;
  error?: string;
  retryCount?: number;
  templateType?: WhatsAppTemplateType;
}

/**
 * Batch send result
 */
export interface BatchSendResult {
  total: number;
  successful: number;
  failed: number;
  queued: number;
  results: SendMessageResult[];
  processedAt: Date;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
