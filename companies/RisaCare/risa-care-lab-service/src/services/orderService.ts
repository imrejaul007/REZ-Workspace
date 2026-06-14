import { v4 as uuidv4 } from 'uuid';
import { Order, OrderSchema, Test } from '../models/lab.js';
import { testService } from './testService.js';
import { sampleService } from './sampleService.js';
import { reportService } from './reportService.js';

class OrderService {
  private orders: Map<string, Order> = new Map();

  createOrder(data: {
    patientId: string;
    doctorId: string;
    testIds: string[];
    priority?: 'routine' | 'urgent' | 'stat';
    diagnosis?: string;
    notes?: string;
  }): { order?: Order; error?: string; invalidTests?: string[] } {
    // Validate all test IDs exist
    const invalidTests: string[] = [];
    const validTests: Array<{ testId: string; testName: string; price: number }> = [];

    for (const testId of data.testIds) {
      const test = testService.getTest(testId);
      if (!test) {
        invalidTests.push(testId);
      } else if (!test.isActive) {
        invalidTests.push(testId);
      } else {
        validTests.push({
          testId: test.testId,
          testName: test.name,
          price: test.price,
        });
      }
    }

    if (invalidTests.length > 0) {
      return { error: 'Some tests are invalid or inactive', invalidTests };
    }

    const now = new Date().toISOString();
    const totalAmount = validTests.reduce((sum, t) => sum + t.price, 0);

    const order: Order = {
      orderId: `ORD-${uuidv4().slice(0, 8).toUpperCase()}`,
      patientId: data.patientId,
      doctorId: data.doctorId,
      tests: validTests,
      priority: data.priority ?? 'routine',
      status: 'pending',
      diagnosis: data.diagnosis,
      notes: data.notes,
      samples: [],
      reports: [],
      totalAmount,
      paidAmount: 0,
      paymentStatus: 'pending',
      orderedAt: now,
      updatedAt: now,
    };

    const validated = OrderSchema.parse(order);
    this.orders.set(validated.orderId, validated);
    return { order: validated };
  }

  getOrder(orderId: string): Order | undefined {
    return this.orders.get(orderId);
  }

  addTests(orderId: string, testIds: string[]): { order?: Order; error?: string } {
    const order = this.orders.get(orderId);
    if (!order) return { error: 'Order not found' };

    if (order.status === 'completed' || order.status === 'cancelled') {
      return { error: 'Cannot modify completed or cancelled orders' };
    }

    const newTests: Array<{ testId: string; testName: string; price: number }> = [];
    let additionalAmount = 0;

    for (const testId of testIds) {
      // Skip if already ordered
      if (order.tests.some((t) => t.testId === testId)) {
        continue;
      }

      const test = testService.getTest(testId);
      if (test && test.isActive) {
        newTests.push({
          testId: test.testId,
          testName: test.name,
          price: test.price,
        });
        additionalAmount += test.price;
      }
    }

    order.tests.push(...newTests);
    order.totalAmount += additionalAmount;
    order.updatedAt = new Date().toISOString();

    return { order: OrderSchema.parse(order) };
  }

  removeTests(orderId: string, testIds: string[]): { order?: Order; error?: string } {
    const order = this.orders.get(orderId);
    if (!order) return { error: 'Order not found' };

    if (order.status === 'completed' || order.status === 'cancelled') {
      return { error: 'Cannot modify completed or cancelled orders' };
    }

    let removedAmount = 0;
    const testIdSet = new Set(testIds);

    order.tests = order.tests.filter((t) => {
      if (testIdSet.has(t.testId)) {
        removedAmount += t.price;
        return false;
      }
      return true;
    });

    order.totalAmount -= removedAmount;
    order.updatedAt = new Date().toISOString();

    return { order: OrderSchema.parse(order) };
  }

  cancelOrder(orderId: string): Order | null {
    const order = this.orders.get(orderId);
    if (!order) return null;

    if (order.status === 'completed') {
      return null; // Cannot cancel completed orders
    }

    order.status = 'cancelled';
    order.updatedAt = new Date().toISOString();
    return OrderSchema.parse(order);
  }

  updateStatus(orderId: string, status: Order['status']): Order | null {
    const order = this.orders.get(orderId);
    if (!order) return null;

    order.status = status;
    order.updatedAt = new Date().toISOString();
    return OrderSchema.parse(order);
  }

  getOrders(filters?: {
    patientId?: string;
    doctorId?: string;
    status?: Order['status'];
    priority?: Order['priority'];
  }): Order[] {
    let results = Array.from(this.orders.values());

    if (filters?.patientId) {
      results = results.filter((o) => o.patientId === filters.patientId);
    }

    if (filters?.doctorId) {
      results = results.filter((o) => o.doctorId === filters.doctorId);
    }

    if (filters?.status) {
      results = results.filter((o) => o.status === filters.status);
    }

    if (filters?.priority) {
      results = results.filter((o) => o.priority === filters.priority);
    }

    return results.sort(
      (a, b) => new Date(b.orderedAt).getTime() - new Date(a.orderedAt).getTime()
    );
  }

  getOrdersByPatient(patientId: string): Order[] {
    return this.getOrders({ patientId });
  }

  getOrdersByDoctor(doctorId: string): Order[] {
    return this.getOrders({ doctorId });
  }

  getPendingOrders(): Order[] {
    return this.getOrders({ status: 'pending' });
  }

  getUrgentOrders(): Order[] {
    return this.getOrders().filter((o) => o.priority === 'urgent' || o.priority === 'stat');
  }

  linkSample(orderId: string, sampleId: string): Order | null {
    const order = this.orders.get(orderId);
    if (!order) return null;

    if (!order.samples.includes(sampleId)) {
      order.samples.push(sampleId);
      order.updatedAt = new Date().toISOString();
    }

    // Update status if sample collected
    if (order.status === 'pending') {
      order.status = 'sample_collected';
    }

    return OrderSchema.parse(order);
  }

  linkReport(orderId: string, reportId: string): Order | null {
    const order = this.orders.get(orderId);
    if (!order) return null;

    if (!order.reports.includes(reportId)) {
      order.reports.push(reportId);
      order.updatedAt = new Date().toISOString();
    }

    // Check if all reports are ready
    const allReportsReleased = order.reports.every((rId) => {
      const report = reportService.getReport(rId);
      return report?.status === 'released';
    });

    if (allReportsReleased && order.reports.length === order.tests.length) {
      order.status = 'completed';
    } else if (order.status === 'sample_collected' && order.reports.length > 0) {
      order.status = 'processing';
    }

    return OrderSchema.parse(order);
  }

  updatePayment(orderId: string, paidAmount: number): Order | null {
    const order = this.orders.get(orderId);
    if (!order) return null;

    order.paidAmount = paidAmount;

    if (paidAmount >= order.totalAmount) {
      order.paymentStatus = 'paid';
    } else if (paidAmount > 0) {
      order.paymentStatus = 'partial';
    }

    order.updatedAt = new Date().toISOString();
    return OrderSchema.parse(order);
  }

  recordPayment(orderId: string, amount: number): Order | null {
    const order = this.orders.get(orderId);
    if (!order) return null;

    order.paidAmount += amount;

    if (order.paidAmount >= order.totalAmount) {
      order.paymentStatus = 'paid';
      order.paidAmount = order.totalAmount; // Cap at total
    } else if (order.paidAmount > 0) {
      order.paymentStatus = 'partial';
    }

    order.updatedAt = new Date().toISOString();
    return OrderSchema.parse(order);
  }

  getOrderStats(): {
    total: number;
    byStatus: Record<Order['status'], number>;
    byPriority: Record<Order['priority'], number>;
    totalRevenue: number;
    collectedRevenue: number;
  } {
    const orders = Array.from(this.orders.values());

    const byStatus: Record<Order['status'], number> = {
      pending: 0,
      sample_collected: 0,
      processing: 0,
      completed: 0,
      cancelled: 0,
    };

    const byPriority: Record<Order['priority'], number> = {
      routine: 0,
      urgent: 0,
      stat: 0,
    };

    let totalRevenue = 0;
    let collectedRevenue = 0;

    orders.forEach((o) => {
      byStatus[o.status]++;
      byPriority[o.priority]++;
      totalRevenue += o.totalAmount;
      collectedRevenue += o.paidAmount;
    });

    return {
      total: orders.length,
      byStatus,
      byPriority,
      totalRevenue,
      collectedRevenue,
    };
  }
}

export const orderService = new OrderService();
