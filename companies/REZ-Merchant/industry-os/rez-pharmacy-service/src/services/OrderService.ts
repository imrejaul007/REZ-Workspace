import mongoose, { ClientSession } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Order, IOrder, OrderStatus, PaymentStatus, OrderType, IOrderItem } from '../models/Order';
import { Prescription, PrescriptionStatus, IPrescription } from '../models/Prescription';
import { Medicine, IMedicine, MedicineStatus } from '../models/Medicine';
import { inventoryService } from './InventoryService';

export interface CreateOrderInput {
  orderType: OrderType;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  items: {
    medicineId: string;
    quantity: number;
    prescriptionId?: string;
  }[];
  shippingAddress?: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country?: string;
    phone: string;
    instructions?: string;
  };
  prescriptionId?: string;
  paymentMethod?: 'CASH' | 'CARD' | 'UPI' | 'INSURANCE' | 'CORPORATE_BILLING';
  notes?: string;
}

export interface OrderUpdateInput {
  orderId: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  pharmacistNotes?: string;
  trackingNumber?: string;
  cancellationReason?: string;
  cancelledBy?: string;
}

export class OrderService {
  /**
   * Create a new pharmacy order
   */
  async createOrder(input: CreateOrderInput): Promise<IOrder> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const orderId = `ORD-${uuidv4().substring(0, 8).toUpperCase()}`;
      const orderNumber = `RX-${Date.now().toString(36).toUpperCase()}`;

      // Validate and process items
      const processedItems: IOrderItem[] = [];
      let subtotal = 0;
      let totalTax = 0;

      for (const item of input.items) {
        const medicine = await Medicine.findOne({ medicineId: item.medicineId }).session(session);

        if (!medicine) {
          throw new Error(`Medicine ${item.medicineId} not found`);
        }

        if (medicine.status !== 'ACTIVE') {
          throw new Error(`Medicine ${medicine.name} is not available`);
        }

        if (medicine.stock < item.quantity) {
          throw new Error(`Insufficient stock for ${medicine.name}. Available: ${medicine.stock}`);
        }

        const tax = Math.round(item.quantity * medicine.sellingPrice * 0.05 * 100) / 100; // 5% GST
        const itemTotal = item.quantity * medicine.sellingPrice + tax;

        processedItems.push({
          medicineId: medicine.medicineId,
          medicineName: medicine.name,
          batchNumber: medicine.batchNumber,
          expiryDate: medicine.expiryDate,
          quantity: item.quantity,
          unitPrice: medicine.sellingPrice,
          totalPrice: item.quantity * medicine.sellingPrice,
          discount: 0,
          tax,
          requiresPrescription: medicine.requiresPrescription,
          prescriptionId: item.prescriptionId
        });

        subtotal += item.quantity * medicine.sellingPrice;
        totalTax += tax;

        // Deduct stock
        medicine.stock -= item.quantity;
        if (medicine.stock === 0) {
          medicine.status = MedicineStatus.OUT_OF_STOCK;
        }
        await medicine.save({ session });
      }

      // Calculate delivery charge
      const deliveryCharge = input.orderType === OrderType.DELIVERY ? 50 : 0;

      // Calculate total
      const totalAmount = subtotal + totalTax + deliveryCharge;

      // Create order
      const order = new Order({
        orderId,
        orderNumber,
        orderType: input.orderType,
        customerId: input.customerId,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        customerEmail: input.customerEmail,
        items: processedItems,
        subtotal,
        discountTotal: 0,
        taxTotal: totalTax,
        deliveryCharge,
        totalAmount,
        paymentStatus: PaymentStatus.PENDING,
        paymentMethod: input.paymentMethod || 'CASH',
        orderStatus: OrderStatus.PENDING,
        prescriptionId: input.prescriptionId,
        shippingAddress: input.shippingAddress,
        notes: input.notes
      });

      await order.save({ session });

      // Update prescription status if linked
      if (input.prescriptionId) {
        await this.updatePrescriptionAfterOrder(input.prescriptionId, input.items, session);
      }

      await session.commitTransaction();
      return order;

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Update prescription after order is placed
   */
  private async updatePrescriptionAfterOrder(
    prescriptionId: string,
    items: { medicineId: string; quantity: number }[],
    session: ClientSession
  ): Promise<void> {
    const prescription = await Prescription.findOne({ prescriptionId }).session(session);

    if (!prescription) return;

    let filledItemsCount = 0;

    for (const item of items) {
      const prescriptionItem = prescription.items.find(
        (i) => i.medicineId === item.medicineId
      );

      if (prescriptionItem) {
        prescriptionItem.filledQuantity += item.quantity;
        if (prescriptionItem.filledQuantity >= prescriptionItem.quantity) {
          filledItemsCount++;
        }
      }
    }

    prescription.filledItems = prescription.items.filter(
      (i) => i.filledQuantity >= i.quantity
    ).length;

    if (prescription.filledItems >= prescription.totalItems) {
      prescription.status = PrescriptionStatus.FILLED;
    } else if (prescription.filledItems > 0) {
      prescription.status = PrescriptionStatus.PARTIALLY_FILLED;
    }

    await prescription.save({ session });
  }

  /**
   * Get order by ID
   */
  async getOrderById(orderId: string): Promise<IOrder | null> {
    return Order.findOne({ orderId });
  }

  /**
   * Get order by order number
   */
  async getOrderByNumber(orderNumber: string): Promise<IOrder | null> {
    return Order.findOne({ orderNumber });
  }

  /**
   * Get orders by customer
   */
  async getOrdersByCustomer(customerId: string, page: number = 1, limit: number = 20): Promise<{
    orders: IOrder[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find({ customerId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments({ customerId })
    ]);

    return {
      orders,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Get orders with filters
   */
  async getOrders(filters: {
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
    orderType?: OrderType;
    fromDate?: Date;
    toDate?: Date;
    page?: number;
    limit?: number;
  }): Promise<{ orders: IOrder[]; total: number }> {
    const { status, paymentStatus, orderType, fromDate, toDate, page = 1, limit = 20 } = filters;

    const filter: unknown = {};

    if (status) filter.orderStatus = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (orderType) filter.orderType = orderType;

    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) filter.createdAt.$gte = fromDate;
      if (toDate) filter.createdAt.$lte = toDate;
    }

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments(filter)
    ]);

    return { orders, total };
  }

  /**
   * Update order status
   */
  async updateOrderStatus(update: OrderUpdateInput): Promise<IOrder | null> {
    const order = await Order.findOne({ orderId: update.orderId });

    if (!order) {
      throw new Error(`Order ${update.orderId} not found`);
    }

    // Validate status transition
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
      [OrderStatus.PROCESSING]: [OrderStatus.READY_FOR_PICKUP, OrderStatus.DISPATCHED, OrderStatus.ON_HOLD],
      [OrderStatus.READY_FOR_PICKUP]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
      [OrderStatus.DISPATCHED]: [OrderStatus.DELIVERED, OrderStatus.ON_HOLD],
      [OrderStatus.DELIVERED]: [OrderStatus.REFUNDED],
      [OrderStatus.CANCELLED]: [],
      [OrderStatus.REFUNDED]: [],
      [OrderStatus.ON_HOLD]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED]
    };

    if (update.status && !validTransitions[order.orderStatus].includes(update.status)) {
      throw new Error(`Invalid status transition from ${order.orderStatus} to ${update.status}`);
    }

    // Handle cancellation
    if (update.status === OrderStatus.CANCELLED) {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Restore stock for cancelled orders
        for (const item of order.items) {
          await inventoryService.updateStock({
            medicineId: item.medicineId,
            quantity: item.quantity,
            reason: 'RETURN',
            reference: order.orderId
          });
        }

        order.cancelledAt = new Date();
        order.cancellationReason = update.cancellationReason;
        order.cancelledBy = update.cancelledBy;

        await session.commitTransaction();
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    }

    // Handle delivery
    if (update.status === OrderStatus.DELIVERED) {
      order.deliveredAt = new Date();
    }

    // Update fields
    if (update.status) order.orderStatus = update.status;
    if (update.paymentStatus) order.paymentStatus = update.paymentStatus;
    if (update.pharmacistNotes) order.pharmacistNotes = update.pharmacistNotes;
    if (update.trackingNumber) order.trackingNumber = update.trackingNumber;

    await order.save();
    return order;
  }

  /**
   * Process payment for order
   */
  async processPayment(orderId: string, paymentData: {
    method: 'CASH' | 'CARD' | 'UPI' | 'INSURANCE' | 'CORPORATE_BILLING';
    transactionId?: string;
    insuranceId?: string;
  }): Promise<IOrder | null> {
    const order = await Order.findOne({ orderId });

    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new Error('Order is already paid');
    }

    order.paymentStatus = PaymentStatus.PAID;
    order.paymentMethod = paymentData.method;

    if (paymentData.insuranceId) {
      order.insuranceId = paymentData.insuranceId;
    }

    await order.save();
    return order;
  }

  /**
   * Cancel order
   */
  async cancelOrder(orderId: string, reason: string, cancelledBy: string): Promise<IOrder | null> {
    return this.updateOrderStatus({
      orderId,
      status: OrderStatus.CANCELLED,
      cancellationReason: reason,
      cancelledBy
    });
  }

  /**
   * Get daily sales report
   */
  async getDailySalesReport(date: Date): Promise<{
    totalOrders: number;
    totalAmount: number;
    totalItems: number;
    ordersByStatus: Record<string, number>;
    topMedicines: { medicineId: string; medicineName: string; quantity: number; amount: number }[];
  }> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const orders = await Order.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });

    const result = {
      totalOrders: orders.length,
      totalAmount: 0,
      totalItems: 0,
      ordersByStatus: {} as Record<string, number>,
      topMedicines: [] as { medicineId: string; medicineName: string; quantity: number; amount: number }[]
    };

    const medicineTotals: Record<string, { name: string; quantity: number; amount: number }> = {};

    for (const order of orders) {
      result.totalAmount += order.totalAmount;
      result.totalItems += order.items.reduce((sum, item) => sum + item.quantity, 0);
      result.ordersByStatus[order.orderStatus] = (result.ordersByStatus[order.orderStatus] || 0) + 1;

      for (const item of order.items) {
        if (!medicineTotals[item.medicineId]) {
          medicineTotals[item.medicineId] = {
            name: item.medicineName,
            quantity: 0,
            amount: 0
          };
        }
        medicineTotals[item.medicineId].quantity += item.quantity;
        medicineTotals[item.medicineId].amount += item.totalPrice;
      }
    }

    result.topMedicines = Object.entries(medicineTotals)
      .map(([id, data]) => ({
        medicineId: id,
        medicineName: data.name,
        quantity: data.quantity,
        amount: data.amount
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    return result;
  }

  /**
   * Get order statistics
   */
  async getOrderStats(days: number = 30): Promise<{
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    ordersByStatus: Record<string, number>;
    ordersByType: Record<string, number>;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const orders = await Order.find({
      createdAt: { $gte: startDate }
    });

    const stats = {
      totalOrders: orders.length,
      totalRevenue: 0,
      averageOrderValue: 0,
      ordersByStatus: {} as Record<string, number>,
      ordersByType: {} as Record<string, number>
    };

    for (const order of orders) {
      stats.totalRevenue += order.totalAmount;
      stats.ordersByStatus[order.orderStatus] = (stats.ordersByStatus[order.orderStatus] || 0) + 1;
      stats.ordersByType[order.orderType] = (stats.ordersByType[order.orderType] || 0) + 1;
    }

    stats.averageOrderValue = stats.totalOrders > 0
      ? Math.round(stats.totalRevenue / stats.totalOrders * 100) / 100
      : 0;

    return stats;
  }
}

export const orderService = new OrderService();
