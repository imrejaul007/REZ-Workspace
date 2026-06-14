import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import axios from 'axios';
import { Merchant, QRCode as QRCodeModel, Category, MenuItem, Order, ScanEvent, Offer } from '../models';
import { config } from '../config';
import { logger } from '../utils/logger';
import type {
  Merchant as MerchantType,
  QRCode as QRCodeType,
  Order as OrderType,
  OrderStatus,
  QRType,
  MenuItem as MenuItemType,
  Category as CategoryType,
  CreateOrderRequest
} from '../types';
import { emitOrderEvent, emitScanEvent } from '../websocket';
import { paymentService } from './paymentService';

// ============================================
// QR CLOUD SERVICE - STABILIZED VERSION
// With MongoDB, Auth, Payments, Wallet
// ============================================

export class QRCloudService {

  // ============================================
  // MERCHANT OPERATIONS
  // ============================================

  async createMerchant(data: CreateMerchantRequest): Promise<any> {
    // Check if slug exists
    const existing = await Merchant.findOne({ slug: data.slug });
    if (existing) {
      throw new Error('Merchant slug already exists');
    }

    // Generate API key
    const apiKey = `qr_${crypto.randomBytes(24).toString('hex')}`;

    const merchant = new Merchant({
      name: data.name,
      slug: data.slug,
      type: data.type,
      phone: data.phone,
      email: data.email,
      address: data.address,
      apiKey,
      settings: {
        acceptOrders: true,
        deliveryEnabled: data.type === 'restaurant' ? true : false,
        takeawayEnabled: true,
        tablesEnabled: data.type === 'restaurant' ? true : false,
      },
    });

    await merchant.save();
    return merchant;
  }

  async getMerchantByApiKey(apiKey: string): Promise<any> {
    const merchant = await Merchant.findOne({ apiKey, isActive: true });
    if (!merchant) {
      throw new Error('Invalid API key');
    }
    return merchant;
  }

  async getMerchant(idOrSlug: string): Promise<any> {
    let merchant = await Merchant.findById(idOrSlug);
    if (!merchant) {
      merchant = await Merchant.findOne({ slug: idOrSlug });
    }
    return merchant;
  }

  async updateMerchant(id: string, data: Partial<any>): Promise<any> {
    const merchant = await Merchant.findByIdAndUpdate(
      id,
      { $set: { ...data, updatedAt: new Date() } },
      { new: true }
    );
    if (!merchant) {
      throw new Error('Merchant not found');
    }
    return merchant;
  }

  async listMerchants(): Promise<any[]> {
    return Merchant.find({ isActive: true }).sort({ createdAt: -1 });
  }

  // ============================================
  // QR CODE OPERATIONS
  // ============================================

  async createQR(merchantId: string, data: CreateQRRequest): Promise<any> {
    const merchant = await Merchant.findById(merchantId);
    if (!merchant) {
      throw new Error('Merchant not found');
    }

    const shortCode = this.generateShortCode();

    // Generate URL based on type
    const url = this.generateQRUrl(merchant.slug, data.type, data.targetId);

    // QR payload for embedded data
    const payload = JSON.stringify({
      v: 1,
      m: merchantId,
      s: merchant.slug,
      t: data.type,
      c: shortCode,
    });

    // Generate QR code
    const qrCodeDataUrl = await QRCode.toDataURL(payload, {
      width: config.qrCode.defaultWidth,
      margin: 2,
      color: { dark: '#000000', light: '#FFFFFF' },
      errorCorrectionLevel: config.qrCode.errorCorrectionLevel,
    });

    const qr = new QRCodeModel({
      merchantId: merchant._id,
      type: data.type,
      targetId: data.targetId,
      name: data.name,
      url,
      shortCode,
      qrCodeDataUrl,
      metadata: data.metadata,
      isActive: true,
      scans: 0,
    });

    await qr.save();

    // Emit event
    await this.emitEvent('qr.created', { merchantId, qrId: qr._id, type: data.type });

    return qr;
  }

  async getQR(idOrCode: string): Promise<any> {
    let qr = await QRCodeModel.findById(idOrCode).populate('merchantId');
    if (!qr) {
      qr = await QRCodeModel.findOne({ shortCode: idOrCode }).populate('merchantId');
    }
    return qr;
  }

  async listQRCodes(merchantId: string): Promise<any[]> {
    return QRCodeModel.find({ merchantId }).sort({ createdAt: -1 });
  }

  async deleteQR(id: string): Promise<void> {
    await QRCodeModel.findByIdAndDelete(id);
  }

  async toggleQR(id: string, isActive: boolean): Promise<any> {
    const qr = await QRCodeModel.findByIdAndUpdate(
      id,
      { $set: { isActive, updatedAt: new Date() } },
      { new: true }
    );
    if (!qr) {
      throw new Error('QR not found');
    }
    return qr;
  }

  // ============================================
  // MENU OPERATIONS
  // ============================================

  async createCategory(merchantId: string, data: { name: string; description?: string; image?: string }): Promise<any> {
    const category = new Category({
      merchantId,
      name: data.name,
      description: data.description,
      image: data.image,
      sortOrder: 0,
      isActive: true,
    });
    await category.save();
    return category;
  }

  async createMenuItem(merchantId: string, data: any): Promise<any> {
    const item = new MenuItem({
      merchantId,
      ...data,
    });
    await item.save();
    return item;
  }

  async getMenu(merchantId: string): Promise<{ categories: any[]; items: any[] }> {
    const categories = await Category.find({ merchantId, isActive: true }).sort({ sortOrder: 1 });
    const items = await MenuItem.find({ merchantId, isAvailable: true });
    return { categories, items };
  }

  async updateMenuItem(id: string, data: Partial<any>): Promise<any> {
    const item = await MenuItem.findByIdAndUpdate(id, { $set: data }, { new: true });
    if (!item) {
      throw new Error('Menu item not found');
    }
    return item;
  }

  async deleteMenuItem(id: string): Promise<void> {
    await MenuItem.findByIdAndDelete(id);
  }

  // ============================================
  // ORDER OPERATIONS
  // ============================================

  async createOrder(merchantId: string, data: CreateOrderRequest): Promise<any> {
    const merchant = await Merchant.findById(merchantId);
    if (!merchant) {
      throw new Error('Merchant not found');
    }

    // Calculate totals
    const { subtotal, tax, total } = this.calculateOrderTotals(data.items);

    const order = new Order({
      merchantId,
      customerPhone: data.customerPhone,
      customerName: data.customerName,
      type: data.type,
      tableNumber: data.tableNumber,
      qrId: data.qrId,
      items: data.items,
      subtotal,
      tax,
      total,
      deliveryFee: data.type === 'delivery' ? 50 : 0,
      total: total + (data.type === 'delivery' ? 50 : 0),
      status: 'pending',
      paymentStatus: 'pending',
      deliveryAddress: data.deliveryAddress,
    });

    await order.save();

    // Emit event
    await this.emitEvent('order.created', { merchantId, orderId: order._id });

    // WebSocket - notify merchant
    emitOrderEvent(merchantId, 'order:new', { orderId: order._id, total: order.total, status: order.status });

    // Send notification to merchant
    await this.sendOrderNotification(merchant, order);

    return order;
  }

  async getOrder(id: string): Promise<any> {
    return Order.findById(id).populate('merchantId');
  }

  async updateOrderStatus(id: string, status: OrderStatus): Promise<any> {
    const order = await Order.findByIdAndUpdate(
      id,
      { $set: { status, updatedAt: new Date() } },
      { new: true }
    );
    if (!order) {
      throw new Error('Order not found');
    }

    // Emit event
    await this.emitEvent('order.statusChanged', { orderId: id, status });

    // WebSocket - notify customer
    emitOrderEvent(order.merchantId.toString(), 'order:statusChanged', { orderId: id, status });

    // Send notification to customer
    if (status === 'confirmed' || status === 'ready') {
      await this.sendStatusNotification(order, status);
    }

    return order;
  }

  async listOrders(merchantId: string, status?: OrderStatus): Promise<any[]> {
    const query: any = { merchantId };
    if (status) {
      query.status = status;
    }
    return Order.find(query).sort({ createdAt: -1 });
  }

  // ============================================
  // PAYMENT OPERATIONS
  // ============================================

  async initiatePayment(orderId: string): Promise<any> {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    try {
      // Use payment service (Razorpay or mock)
      const result = await paymentService.initiatePayment(order);

      if (result.success) {
        order.paymentId = result.paymentId;
        await order.save();
      }

      return result;
    } catch (error: any) {
      console.error('Payment initiation failed:', error.message);
      throw new Error('Payment service unavailable');
    }
  }

  async verifyPayment(orderId: string, paymentId: string): Promise<boolean> {
    try {
      const result = await paymentService.verifyPayment(paymentId, orderId, '');
      return result.success;
    } catch (error) {
      return false;
    }
  }

  async getUPIQrCode(order: any): Promise<string | null> {
    try {
      return await paymentService.getUPIQrCode(order);
    } catch (error) {
      console.error('UPI QR failed:', error);
      return null;
    }
  }

  // ============================================
  // WALLET OPERATIONS
  // ============================================

  async creditMerchantWallet(order: any): Promise<void> {
    try {
      await axios.post(`${config.services.wallet.url}/api/wallet/${order.merchantId}/credit`, {
        amount: order.total,
        type: 'order_payment',
        description: `Payment for order ${order._id}`,
      }, {
        headers: {
          'X-Internal-Token': config.apiKeys.internal,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });
    } catch (error) {
      console.error('Wallet credit failed:', error);
    }
  }

  async addCoinsToCustomer(customerPhone: string, amount: number): Promise<void> {
    try {
      await axios.post(`${config.services.wallet.url}/api/wallet/${customerPhone}/coins/add`, {
        coins: Math.floor(amount * 10), // 10% cashback as coins
        source: 'qr_order',
      }, {
        headers: {
          'X-Internal-Token': config.apiKeys.internal,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });
    } catch (error) {
      console.error('Coin addition failed:', error);
    }
  }

  // ============================================
  // SCAN TRACKING
  // ============================================

  async trackScan(qrId: string, customerId?: string, deviceId?: string): Promise<any> {
    const qr = await QRCodeModel.findById(qrId);
    if (!qr) {
      throw new Error('QR not found');
    }

    // Increment scan count
    await QRCodeModel.findByIdAndUpdate(qrId, { $inc: { scans: 1 } });

    const scan = new ScanEvent({
      qrId: qr._id,
      merchantId: qr.merchantId,
      customerId,
      deviceId,
      timestamp: new Date(),
    });

    await scan.save();

    // Emit event
    await this.emitEvent('qr.scanned', { qrId, merchantId: qr.merchantId });

    // WebSocket - notify merchant
    emitScanEvent(qr.merchantId.toString(), 'scan:new', { qrId, scans: qr.scans });

    return scan;
  }

  async getScanEvents(merchantId: string, fromDate?: Date, toDate?: Date): Promise<any[]> {
    const query: any = { merchantId };
    if (fromDate || toDate) {
      query.timestamp = {};
      if (fromDate) query.timestamp.$gte = fromDate;
      if (toDate) query.timestamp.$lte = toDate;
    }
    return ScanEvent.find(query).sort({ timestamp: -1 });
  }

  async resolveQR(shortCode: string): Promise<any> {
    const qr = await QRCodeModel.findOne({ shortCode }).populate('merchantId');
    if (!qr) {
      throw new Error('QR code not found');
    }

    if (!qr.isActive) {
      throw new Error('QR code is no longer active');
    }

    // Track the scan
    await this.trackScan(qr._id.toString());

    return {
      qr,
      merchant: qr.merchantId,
      menuUrl: qr.url,
    };
  }

  // ============================================
  // ANALYTICS
  // ============================================

  async getAnalytics(merchantId: string): Promise<any> {
    const [qrCodes, orders] = await Promise.all([
      QRCodeModel.find({ merchantId }),
      Order.find({ merchantId }),
    ]);

    const totalScans = qrCodes.reduce((sum, qr) => sum + qr.scans, 0);
    const paidOrders = orders.filter(o => o.paymentStatus === 'paid');
    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total, 0);

    const ordersByStatus = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Top QR codes
    const topQRCodes = qrCodes
      .sort((a, b) => b.scans - a.scans)
      .slice(0, 10);

    return {
      totalQRCodes: qrCodes.length,
      totalScans,
      totalOrders: orders.length,
      totalRevenue,
      avgOrderValue: paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0,
      ordersByStatus,
      recentOrders: orders.slice(0, 10),
      topQRCodes,
    };
  }

  async getQRAnalytics(qrId: string): Promise<any> {
    const qr = await QRCodeModel.findById(qrId);
    if (!qr) {
      throw new Error('QR not found');
    }

    const orders = await Order.find({ qrId: qr._id });
    const paidOrders = orders.filter(o => o.paymentStatus === 'paid');
    const totalValue = paidOrders.reduce((sum, o) => sum + o.total, 0);
    const uniqueCustomers = new Set(orders.map(o => o.customerPhone)).size;

    const scansToday = await ScanEvent.countDocuments({
      qrId: qr._id,
      timestamp: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    });

    return {
      qrId,
      totalScans: qr.scans,
      uniqueCustomers,
      totalOrders: orders.length,
      orderValue: totalValue,
      avgOrderValue: paidOrders.length > 0 ? totalValue / paidOrders.length : 0,
      scansToday,
    };
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private generateShortCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  private generateQRUrl(slug: string, type: QRType, targetId?: string): string {
    const baseUrl = config.urls.qrCloudBase;
    switch (type) {
      case 'menu':
        return `${baseUrl}/menu/${slug}`;
      case 'table':
        return `${baseUrl}/menu/${slug}?table=${targetId}`;
      case 'payment':
        return `${baseUrl}/pay`;
      case 'info':
        return `${baseUrl}/info/${slug}`;
      case 'verify':
        return `${baseUrl}/verify/${targetId}`;
      case 'creator':
        return `${baseUrl}/creator/${targetId}`;
      case 'ads':
        return `${baseUrl}/ad/${targetId}`;
      default:
        return `${baseUrl}/${slug}`;
    }
  }

  private calculateOrderTotals(items: any[]): { subtotal: number; tax: number; total: number } {
    const subtotal = items.reduce((sum, item) => {
      let itemPrice = item.price * item.quantity;
      if (item.options) {
        itemPrice += item.options.reduce((optSum: number, opt: any) => optSum + opt.price * item.quantity, 0);
      }
      if (item.addons) {
        itemPrice += item.addons.reduce((addonSum: number, addon: any) => addonSum + addon.price * item.quantity, 0);
      }
      return sum + itemPrice;
    }, 0);

    const tax = Math.round(subtotal * 0.05); // 5% GST
    const total = subtotal + tax;

    return { subtotal, tax, total };
  }

  private async emitEvent(event: string, data: any): Promise<void> {
    // Legacy event emitter - now uses WebSocket instead
    // Keeping for backwards compatibility with Event Bus
    try {
      await axios.post(`${config.services.eventBus}/api/events`, {
        type: event,
        source: 'qr-cloud',
        data,
        timestamp: new Date().toISOString(),
      }, {
        headers: {
          'X-Internal-Token': config.apiKeys.internal,
        },
        timeout: 5000,
      });
    } catch (error) {
      // Silently fail - WebSocket is primary
    }
  }

  private async sendOrderNotification(merchant: any, order: any): Promise<void> {
    try {
      await axios.post(`${config.services.notifications.url}/api/notifications`, {
        userId: merchant._id.toString(),
        channel: 'whatsapp',
        title: 'New Order',
        body: `New order #${order._id.toString().slice(-6)} received! Total: ₹${order.total}`,
        data: { orderId: order._id.toString() },
      }, {
        headers: {
          'X-Internal-Token': config.apiKeys.internal,
        },
        timeout: 5000,
      });
    } catch (error) {
      console.error('Notification failed:', error);
    }
  }

  private async sendStatusNotification(order: any, status: string): Promise<void> {
    try {
      await axios.post(`${config.services.notifications.url}/api/notifications`, {
        userId: order.customerPhone,
        channel: 'whatsapp',
        title: 'Order Update',
        body: `Your order is now ${status}`,
        data: { orderId: order._id.toString() },
      }, {
        headers: {
          'X-Internal-Token': config.apiKeys.internal,
        },
        timeout: 5000,
      });
    } catch (error) {
      console.error('Notification failed:', error);
    }
  }
}

export const qrCloudService = new QRCloudService();
