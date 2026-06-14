export class CreateOrderDto {
  userId: string;
  vendorId: string;
  items: OrderItem[];
  totalAmount: number;
  deliveryAddress: string;
  notes?: string;
  paymentMethod?: string;
  creditUsed?: number;
}

export class OrderItem {
  vendorOfferingId: string;
  quantity: number;
  price: number;
}

export class UpdateOrderStatusDto {
  status: string;
  notes?: string;
  trackingNumber?: string;
  estimatedDelivery?: Date;
}