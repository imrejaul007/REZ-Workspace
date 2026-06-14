/**
 * B2B to Consumer Employee Linker
 *
 * Links corporate employee IDs to REZ customer profiles
 * Enables visibility into corporate vs walk-in customers
 */

import axios from 'axios';
import mongoose from 'mongoose';

interface EmployeeLink {
  employeeId: string;
  corporateId: string;
  merchantId: string;
  customerId?: string;
  email?: string;
  phone?: string;
  department?: string;
  designation?: string;
  linkedAt: Date;
  source: 'api' | 'checkout' | 'manual';
}

// MongoDB Schema
const EmployeeLinkSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, unique: true },
  corporateId: { type: String, required: true, index: true },
  merchantId: { type: String, required: true, index: true },
  customerId: { type: String, sparse: true, index: true },
  email: { type: String },
  phone: { type: String },
  department: { type: String },
  designation: { type: String },
  linkedAt: { type: Date, default: Date.now },
  source: { type: String, enum: ['api', 'checkout', 'manual'], default: 'api' }
});

EmployeeLinkSchema.index({ corporateId: 1, merchantId: 1 });
EmployeeLinkSchema.index({ customerId: 1 });

const EmployeeLink = mongoose.model('EmployeeLink', EmployeeLinkSchema);

// Configuration
const MERCHANT_SERVICE_URL = process.env.MERCHANT_SERVICE_URL || 'https://rez-merchant-service.onrender.com';
const CONSUMER_SERVICE_URL = process.env.CONSUMER_SERVICE_URL || 'https://rez-consumer-service.onrender.com';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || '';

export class EmployeeLinker {
  /**
   * Link employee to customer profile
   */
  async linkEmployee(data: {
    employeeId: string;
    corporateId: string;
    merchantId: string;
    customerId?: string;
    email?: string;
    phone?: string;
    department?: string;
    designation?: string;
  }): Promise<EmployeeLink> {
    // Create or update link
    const link = await EmployeeLink.findOneAndUpdate(
      { employeeId: data.employeeId },
      {
        ...data,
        linkedAt: new Date()
      },
      { upsert: true, new: true }
    );

    // If customerId provided, also update merchant profile
    if (data.customerId) {
      await this.updateMerchantCustomerProfile(data);
    }

    return link;
  }

  /**
   * Get employee link by ID
   */
  async getLink(employeeId: string): Promise<EmployeeLink | null> {
    return EmployeeLink.findOne({ employeeId });
  }

  /**
   * Get all links for a corporate customer
   */
  async getCorporateLinks(corporateId: string): Promise<EmployeeLink[]> {
    return EmployeeLink.find({ corporateId });
  }

  /**
   * Get all links for a merchant
   */
  async getMerchantLinks(merchantId: string): Promise<EmployeeLink[]> {
    return EmployeeLink.find({ merchantId });
  }

  /**
   * Get customer by employee ID
   */
  async getCustomerByEmployee(employeeId: string): Promise<string | null> {
    const link = await EmployeeLink.findOne({ employeeId });
    return link?.customerId || null;
  }

  /**
   * Get employee data by customer ID
   */
  async getEmployeeByCustomer(customerId: string): Promise<EmployeeLink | null> {
    return EmployeeLink.findOne({ customerId });
  }

  /**
   * Check if customer is a corporate employee
   */
  async isCorporateCustomer(customerId: string): Promise<boolean> {
    const link = await EmployeeLink.findOne({ customerId });
    return !!link;
  }

  /**
   * Get corporate info for a customer
   */
  async getCorporateInfo(customerId: string): Promise<{
    corporateId: string;
    employeeId: string;
    department?: string;
    designation?: string;
  } | null> {
    const link = await EmployeeLink.findOne({ customerId });
    if (!link) return null;

    return {
      corporateId: link.corporateId,
      employeeId: link.employeeId,
      department: link.department,
      designation: link.designation
    };
  }

  /**
   * Apply corporate discount
   */
  async applyCorporateDiscount(
    customerId: string,
    cartTotal: number
  ): Promise<{ discount: number; corporateId: string } | null> {
    const link = await EmployeeLink.findOne({ customerId });
    if (!link) return null;

    // Get corporate discount rate from merchant service
    try {
      const response = await axios.get(
        `${MERCHANT_SERVICE_URL}/api/v1/corporates/${link.corporateId}/discount`,
        {
          headers: { 'X-Internal-Token': INTERNAL_TOKEN },
          timeout: 5000
        }
      );

      const discountRate = response.data.discountRate || 0;
      const discount = Math.round(cartTotal * discountRate) / 100;

      return {
        discount,
        corporateId: link.corporateId
      };
    } catch (error) {
      console.error('Error fetching corporate discount:', error);
      return null;
    }
  }

  /**
   * Sync bulk employees from CSV
   */
  async bulkSync(
    corporateId: string,
    merchantId: string,
    employees: Array<{
      employeeId: string;
      email?: string;
      phone?: string;
      department?: string;
      designation?: string;
    }>
  ): Promise<{ synced: number; failed: number }> {
    let synced = 0;
    let failed = 0;

    for (const emp of employees) {
      try {
        await EmployeeLink.findOneAndUpdate(
          { employeeId: emp.employeeId },
          {
            employeeId: emp.employeeId,
            corporateId,
            merchantId,
            email: emp.email,
            phone: emp.phone,
            department: emp.department,
            designation: emp.designation,
            linkedAt: new Date(),
            source: 'api'
          },
          { upsert: true }
        );
        synced++;
      } catch (error) {
        console.error(`Failed to sync employee ${emp.employeeId}:`, error);
        failed++;
      }
    }

    return { synced, failed };
  }

  /**
   * Unlink employee
   */
  async unlinkEmployee(employeeId: string): Promise<boolean> {
    const result = await EmployeeLink.deleteOne({ employeeId });
    return result.deletedCount > 0;
  }

  /**
   * Update merchant customer profile with corporate info
   */
  private async updateMerchantCustomerProfile(data: {
    customerId: string;
    merchantId: string;
    corporateId: string;
    employeeId: string;
    department?: string;
    designation?: string;
  }): Promise<void> {
    try {
      await axios.patch(
        `${MERCHANT_SERVICE_URL}/api/v1/customers/${data.customerId}`,
        {
          corporateInfo: {
            corporateId: data.corporateId,
            employeeId: data.employeeId,
            department: data.department,
            designation: data.designation,
            linkedAt: new Date()
          }
        },
        {
          headers: { 'X-Internal-Token': INTERNAL_TOKEN },
          timeout: 5000
        }
      );
    } catch (error) {
      console.error('Error updating merchant customer profile:', error);
    }
  }

  /**
   * Get analytics for corporate customers
   */
  async getCorporateAnalytics(merchantId: string): Promise<{
    totalEmployees: number;
    activeCustomers: number;
    totalSpend: number;
    averageOrderValue: number;
    topDepartments: Array<{ department: string; count: number }>;
  }> {
    const links = await EmployeeLink.find({ merchantId });
    const customerIds = links.map(l => l.customerId).filter(Boolean);

    if (customerIds.length === 0) {
      return {
        totalEmployees: links.length,
        activeCustomers: 0,
        totalSpend: 0,
        averageOrderValue: 0,
        topDepartments: []
      };
    }

    // Get order data from merchant service
    try {
      const response = await axios.post(
        `${MERCHANT_SERVICE_URL}/api/v1/analytics/corporate`,
        { customerIds, merchantId },
        {
          headers: { 'X-Internal-Token': INTERNAL_TOKEN },
          timeout: 10000
        }
      );

      const departmentCounts: Record<string, number> = {};
      for (const link of links) {
        if (link.department) {
          departmentCounts[link.department] = (departmentCounts[link.department] || 0) + 1;
        }
      }

      const topDepartments = Object.entries(departmentCounts)
        .map(([department, count]) => ({ department, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        totalEmployees: links.length,
        activeCustomers: customerIds.length,
        totalSpend: response.data.totalSpend || 0,
        averageOrderValue: response.data.averageOrderValue || 0,
        topDepartments
      };
    } catch (error) {
      console.error('Error fetching corporate analytics:', error);
      return {
        totalEmployees: links.length,
        activeCustomers: customerIds.length,
        totalSpend: 0,
        averageOrderValue: 0,
        topDepartments: []
      };
    }
  }
}

export const employeeLinker = new EmployeeLinker();
