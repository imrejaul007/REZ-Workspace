import { Types } from 'mongoose';
import { LabOrder, ILabOrder, ILabOrderTest, ILabOrderResult } from '../models/LabIntegration';
import { logger } from '../config/logger';

/**
 * Lab Partner interface
 */
export interface LabPartner {
  id: string;
  name: string;
  address: string;
  phone: string;
  email?: string;
  active: boolean;
}

// Predefined lab partners (can be extended to database-driven)
const LAB_PARTNERS: LabPartner[] = [
  {
    id: 'lp_1',
    name: 'HealthLab Diagnostics',
    address: '123 Medical Center Drive',
    phone: '+1-800-555-0101',
    email: 'contact@healthlab.com',
    active: true,
  },
  {
    id: 'lp_2',
    name: 'MedPath Laboratory',
    address: '456 Healthcare Blvd',
    phone: '+1-800-555-0102',
    email: 'info@medpathlab.com',
    active: true,
  },
  {
    id: 'lp_3',
    name: 'QuickTest Labs',
    address: '789 Diagnostic Way',
    phone: '+1-800-555-0103',
    email: 'support@quicktestlabs.com',
    active: true,
  },
];

/**
 * Test input for ordering
 */
export interface TestInput {
  code: string;
  name: string;
  price: number;
}

/**
 * Result input for adding test results
 */
export interface ResultInput {
  testCode: string;
  value: string;
  unit: string;
  referenceRange: string;
  status: 'normal' | 'high' | 'low';
}

/**
 * Lab order input for creating new orders
 */
export interface LabOrderInput {
  patientId: string;
  storeId: string;
  merchantId: string;
  doctorId: string;
  tests: TestInput[];
  labPartner?: string;
}

/**
 * Lean document type for queries (plain objects)
 */
export interface LabOrderLean {
  _id: Types.ObjectId;
  patientId: Types.ObjectId;
  storeId: Types.ObjectId;
  merchantId: Types.ObjectId;
  doctorId: Types.ObjectId;
  tests: ILabOrderTest[];
  labPartner?: string;
  status: 'ordered' | 'sample_collected' | 'processing' | 'ready' | 'delivered';
  results?: ILabOrderResult[];
  reportUrl?: string;
  orderedAt: Date;
  reportAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class LabService {
  /**
   * Order lab tests for a patient
   */
  async orderTests(
    patientId: string,
    tests: TestInput[],
    doctorId: string,
    storeId: string,
    merchantId: string,
    labPartner?: string
  ): Promise<LabOrderLean> {
    if (!Types.ObjectId.isValid(patientId) || !Types.ObjectId.isValid(doctorId)) {
      throw new Error('Invalid patient or doctor ID');
    }

    if (!tests || tests.length === 0) {
      throw new Error('At least one test is required');
    }

    const labOrder = await LabOrder.create({
      patientId: new Types.ObjectId(patientId),
      storeId: new Types.ObjectId(storeId),
      merchantId: new Types.ObjectId(merchantId),
      doctorId: new Types.ObjectId(doctorId),
      tests: tests.map(t => ({
        code: t.code.trim(),
        name: t.name.trim(),
        price: t.price,
      })),
      labPartner: labPartner?.trim(),
      status: 'ordered',
      orderedAt: new Date(),
    });

    logger.info('Lab order created', {
      orderId: labOrder._id,
      patientId,
      doctorId,
      testCount: tests.length,
      labPartner,
    });

    return labOrder.toObject() as LabOrderLean;
  }

  /**
   * Get all lab orders for a patient
   */
  async getOrders(patientId: string, merchantId?: string): Promise<LabOrderLean[]> {
    if (!Types.ObjectId.isValid(patientId)) {
      throw new Error('Invalid patient ID');
    }

    const query: Record<string, unknown> = {
      patientId: new Types.ObjectId(patientId),
    };

    if (merchantId) {
      if (!Types.ObjectId.isValid(merchantId)) {
        throw new Error('Invalid merchant ID');
      }
      query.merchantId = new Types.ObjectId(merchantId);
    }

    const orders = await LabOrder.find(query)
      .sort({ orderedAt: -1 })
      .lean();

    return orders as unknown as LabOrderLean[];
  }

  /**
   * Get a specific lab order by ID
   */
  async getOrder(orderId: string): Promise<LabOrderLean | null> {
    if (!Types.ObjectId.isValid(orderId)) {
      return null;
    }

    const order = await LabOrder.findById(orderId).lean();
    return order as unknown as LabOrderLean | null;
  }

  /**
   * Get lab orders for a store
   */
  async getStoreOrders(
    storeId: string,
    merchantId: string,
    options?: {
      status?: 'ordered' | 'sample_collected' | 'processing' | 'ready' | 'delivered';
      limit?: number;
      page?: number;
    }
  ): Promise<{ orders: LabOrderLean[]; total: number }> {
    if (!Types.ObjectId.isValid(storeId) || !Types.ObjectId.isValid(merchantId)) {
      throw new Error('Invalid store or merchant ID');
    }

    const query: Record<string, unknown> = {
      storeId: new Types.ObjectId(storeId),
      merchantId: new Types.ObjectId(merchantId),
    };

    if (options?.status) {
      query.status = options.status;
    }

    const limit = options?.limit || 20;
    const page = options?.page || 1;
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      LabOrder.find(query)
        .sort({ orderedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      LabOrder.countDocuments(query),
    ]);

    return { orders: orders as unknown as LabOrderLean[], total };
  }

  /**
   * Update lab order status
   */
  async updateStatus(
    orderId: string,
    status: 'ordered' | 'sample_collected' | 'processing' | 'ready' | 'delivered'
  ): Promise<LabOrderLean | null> {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new Error('Invalid order ID');
    }

    const validStatuses = ['ordered', 'sample_collected', 'processing', 'ready', 'delivered'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const order = await LabOrder.findById(orderId);
    if (!order) {
      return null;
    }

    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      ordered: ['sample_collected'],
      sample_collected: ['processing'],
      processing: ['ready'],
      ready: ['delivered'],
      delivered: [],
    };

    if (!validTransitions[order.status]?.includes(status)) {
      throw new Error(`Invalid status transition from ${order.status} to ${status}`);
    }

    order.status = status;

    // Set reportAt when status is 'ready'
    if (status === 'ready') {
      order.reportAt = new Date();
    }

    await order.save();

    logger.info('Lab order status updated', {
      orderId,
      previousStatus: order.status,
      newStatus: status,
    });

    return order.toObject() as LabOrderLean;
  }

  /**
   * Add results to a lab order
   */
  async addResults(orderId: string, results: ResultInput[]): Promise<LabOrderLean | null> {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new Error('Invalid order ID');
    }

    if (!results || results.length === 0) {
      throw new Error('At least one result is required');
    }

    const order = await LabOrder.findById(orderId);
    if (!order) {
      return null;
    }

    // Validate all test codes exist in the order
    const orderTestCodes = new Set(order.tests.map(t => t.code));
    for (const result of results) {
      if (!orderTestCodes.has(result.testCode)) {
        throw new Error(`Test code ${result.testCode} not found in order`);
      }
    }

    // Use $set to replace results or $push to add
    order.results = results.map(r => ({
      testCode: r.testCode.trim(),
      value: r.value.trim(),
      unit: r.unit.trim(),
      referenceRange: r.referenceRange.trim(),
      status: r.status,
    }));

    // Auto-update status to 'ready' if all tests have results
    if (order.results.length === order.tests.length) {
      order.status = 'ready';
      order.reportAt = new Date();
    }

    await order.save();

    logger.info('Lab results added', {
      orderId,
      resultCount: results.length,
      totalResults: order.results.length,
      status: order.status,
    });

    return order.toObject() as LabOrderLean;
  }

  /**
   * Generate a report URL for the lab order
   */
  async generateReport(orderId: string): Promise<string> {
    const order = await this.getOrder(orderId);
    if (!order) {
      throw new Error('Lab order not found');
    }

    if (!order.results || order.results.length === 0) {
      throw new Error('No results available to generate report');
    }

    // Generate a simple report URL (in production, this would generate PDF/HTML)
    const reportUrl = `/api/v1/merchant/lab/orders/${orderId}/report`;
    const fullUrl = `${process.env.BASE_URL || 'https://api.example.com'}${reportUrl}`;

    // Update the order with the report URL
    await LabOrder.findByIdAndUpdate(orderId, { reportUrl: fullUrl });

    logger.info('Lab report URL generated', {
      orderId,
      reportUrl: fullUrl,
    });

    return fullUrl;
  }

  /**
   * Get printable HTML report for a lab order
   */
  async printReport(orderId: string): Promise<string> {
    const order = await this.getOrder(orderId);
    if (!order) {
      throw new Error('Lab order not found');
    }

    if (!order.results || order.results.length === 0) {
      throw new Error('No results available for report');
    }

    const resultsHtml = order.results.map((result, index) => `
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd;">${index + 1}</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${result.testCode}</td>
        <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">${result.value} ${result.unit}</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${result.referenceRange}</td>
        <td style="padding: 10px; border: 1px solid #ddd;">
          <span class="status-badge status-${result.status}">${result.status.toUpperCase()}</span>
        </td>
      </tr>
    `).join('');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Lab Report #${order._id}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #059669; padding-bottom: 20px; }
    .header h1 { margin: 0; color: #059669; }
    .header p { margin: 5px 0; color: #666; }
    .section { margin-bottom: 25px; }
    .section h3 { color: #059669; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 15px; }
    .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
    .info-item { background: #f9fafb; padding: 12px; border-radius: 6px; }
    .info-label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
    .info-value { font-size: 14px; font-weight: 600; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    th { background: #059669; color: white; padding: 12px; text-align: left; }
    .status-badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
    .status-normal { background: #d1fae5; color: #065f46; }
    .status-high { background: #fee2e2; color: #991b1b; }
    .status-low { background: #fef3c7; color: #92400e; }
    .summary-box { background: #f0fdf4; border: 1px solid #059669; padding: 15px; border-radius: 6px; margin: 15px 0; }
    .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #9ca3af; }
    @media print { body { margin: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>Laboratory Test Report</h1>
    <p>Order ID: ${order._id}</p>
    <p>Ordered: ${new Date(order.orderedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
    ${order.reportAt ? `<p>Report Date: ${new Date(order.reportAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>` : ''}
  </div>

  <div class="section">
    <h3>Order Information</h3>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Patient ID</div>
        <div class="info-value">${order.patientId}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Store ID</div>
        <div class="info-value">${order.storeId}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Doctor ID</div>
        <div class="info-value">${order.doctorId}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Lab Partner</div>
        <div class="info-value">${order.labPartner || 'Internal'}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <h3>Tests Ordered (${order.tests.length})</h3>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Code</th>
          <th>Test Name</th>
          <th>Price</th>
        </tr>
      </thead>
      <tbody>
        ${order.tests.map((test, index) => `
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;">${index + 1}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${test.code}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${test.name}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">$${test.price.toFixed(2)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <div class="section">
    <h3>Test Results (${order.results.length})</h3>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Test Code</th>
          <th>Value</th>
          <th>Reference Range</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${resultsHtml}
      </tbody>
    </table>
  </div>

  <div class="summary-box">
    <strong>Summary:</strong> ${order.results.filter(r => r.status === 'normal').length} Normal,
    ${order.results.filter(r => r.status === 'high').length} High,
    ${order.results.filter(r => r.status === 'low').length} Low
  </div>

  <div class="footer">
    <p>This report was generated electronically. Please consult your healthcare provider for unknown clarifications.</p>
    <p>Generated: ${new Date().toISOString()}</p>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Get available lab partners
   */
  async getLabPartners(): Promise<LabPartner[]> {
    return LAB_PARTNERS.filter(p => p.active);
  }

  /**
   * Get a specific lab partner
   */
  async getLabPartner(id: string): Promise<LabPartner | null> {
    return LAB_PARTNERS.find(p => p.id === id && p.active) || null;
  }

  /**
   * Get orders by status for a merchant
   */
  async getOrdersByStatus(
    merchantId: string,
    status: 'ordered' | 'sample_collected' | 'processing' | 'ready' | 'delivered',
    limit: number = 50
  ): Promise<LabOrderLean[]> {
    if (!Types.ObjectId.isValid(merchantId)) {
      throw new Error('Invalid merchant ID');
    }

    const orders = await LabOrder.find({
      merchantId: new Types.ObjectId(merchantId),
      status,
    })
      .sort({ orderedAt: -1 })
      .limit(limit)
      .lean();

    return orders as unknown as LabOrderLean[];
  }
}

// Singleton instance
export const labService = new LabService();
