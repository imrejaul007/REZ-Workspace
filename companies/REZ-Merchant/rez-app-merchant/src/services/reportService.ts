// Report Service - Report generation and analytics
// Provides sales, revenue, customer, and inventory reports with PDF/Excel export
// Enhanced with error handling, retry logic, and loading states

import {
  withRetry,
  withErrorHandling,
  showToast,
  showNetworkErrorToast,
  LoadingState,
  AppError,
  NetworkError,
  ServerError,
  ValidationError,
  NotFoundError,
} from './errors';

// ============================================
// Types & Interfaces
// ============================================

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface SalesReport {
  merchantId: string;
  period: DateRange;
  summary: {
    totalRevenue: number;
    totalOrders: number;
    avgOrderValue: number;
    totalItems: number;
    completedOrders: number;
    cancelledOrders: number;
    refundAmount: number;
  };
  dailyBreakdown: Array<{
    date: string;
    revenue: number;
    orders: number;
    items: number;
  }>;
  topProducts: Array<{
    productId: string;
    name: string;
    quantity: number;
    revenue: number;
  }>;
  paymentMethods: Array<{
    method: string;
    count: number;
    amount: number;
  }>;
  peakHours: Array<{
    hour: number;
    orders: number;
    revenue: number;
  }>;
  generatedAt: string;
}

export interface RevenueReport {
  merchantId: string;
  period: DateRange;
  summary: {
    grossRevenue: number;
    netRevenue: number;
    totalTransactions: number;
    avgTransactionValue: number;
    growthRate: number;
    projectedRevenue: number;
  };
  breakdown: {
    byPaymentMethod: Array<{
      method: string;
      amount: number;
      percentage: number;
      transactionCount: number;
    }>;
    byCategory: Array<{
      category: string;
      amount: number;
      percentage: number;
    }>;
    byTimeOfDay: Array<{
      hour: number;
      amount: number;
      orders: number;
    }>;
  };
  comparisons: {
    vsPreviousPeriod: {
      revenueChange: number;
      orderChange: number;
      avgValueChange: number;
    };
    vsLastYear: {
      revenueChange: number;
      orderChange: number;
    };
  };
  generatedAt: string;
}

export interface CustomerReport {
  merchantId: string;
  summary: {
    totalCustomers: number;
    newCustomers: number;
    returningCustomers: number;
    retentionRate: number;
    avgLifetimeValue: number;
    churnRate: number;
  };
  demographics: {
    byAgeGroup: Array<{ group: string; count: number }>;
    byLocation: Array<{ location: string; count: number }>;
  };
  behavior: {
    avgOrdersPerCustomer: number;
    avgSpendPerVisit: number;
    avgDaysBetweenVisits: number;
    topSpenders: Array<{
      customerId: string;
      name: string;
      totalSpent: number;
      orderCount: number;
    }>;
  };
  recentActivity: Array<{
    customerId: string;
    name: string;
    lastVisit: string;
    totalSpent: number;
    orderCount: number;
  }>;
  generatedAt: string;
}

export interface InventoryReport {
  merchantId: string;
  summary: {
    totalProducts: number;
    inStockProducts: number;
    lowStockProducts: number;
    outOfStockProducts: number;
    totalValue: number;
    lowStockValue: number;
  };
  stockLevels: Array<{
    productId: string;
    name: string;
    sku: string;
    currentStock: number;
    minStock: number;
    maxStock: number;
    status: 'in_stock' | 'low_stock' | 'out_of_stock';
    lastRestocked: string;
  }>;
  movements: {
    totalIn: number;
    totalOut: number;
    adjustments: number;
  };
  expiryAlerts: Array<{
    productId: string;
    name: string;
    batchNumber: string;
    expiryDate: string;
    daysUntilExpiry: number;
  }>;
  generatedAt: string;
}

export interface ReportExport {
  id: string;
  type: 'pdf' | 'excel';
  reportType: string;
  url: string;
  filename: string;
  generatedAt: string;
}

// ============================================
// Service Configuration
// ============================================

const MERCHANT_SERVICE_URL =
  process.env.EXPO_PUBLIC_MERCHANT_SERVICE_URL || 'https://rez-merchant-service.onrender.com/api/v1';

// ============================================
// Report Service Class
// ============================================

class ReportService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = MERCHANT_SERVICE_URL;
  }

  /**
   * Get sales report for a merchant
   */
  async getSalesReport(
    merchantId: string,
    dateRange: DateRange
  ): Promise<SalesReport> {
    return withRetry(async () => {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });

      const response = await fetch(
        `${this.baseUrl}/reports/sales/${merchantId}?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new NotFoundError('Sales report');
        }
        throw new ServerError('Failed to fetch sales report', response.status);
      }

      return response.json();
    }, 3);
  }

  /**
   * Get revenue report for a merchant
   */
  async getRevenueReport(
    merchantId: string,
    dateRange: DateRange
  ): Promise<RevenueReport> {
    return withRetry(async () => {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });

      const response = await fetch(
        `${this.baseUrl}/reports/revenue/${merchantId}?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new NotFoundError('Revenue report');
        }
        throw new ServerError('Failed to fetch revenue report', response.status);
      }

      return response.json();
    }, 3);
  }

  /**
   * Get customer report for a merchant
   */
  async getCustomerReport(merchantId: string): Promise<CustomerReport> {
    return withRetry(async () => {
      const response = await fetch(
        `${this.baseUrl}/reports/customers/${merchantId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new NotFoundError('Customer report');
        }
        throw new ServerError('Failed to fetch customer report', response.status);
      }

      return response.json();
    }, 3);
  }

  /**
   * Get inventory report for a merchant
   */
  async getInventoryReport(merchantId: string): Promise<InventoryReport> {
    return withRetry(async () => {
      const response = await fetch(
        `${this.baseUrl}/reports/inventory/${merchantId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new NotFoundError('Inventory report');
        }
        throw new ServerError('Failed to fetch inventory report', response.status);
      }

      return response.json();
    }, 3);
  }

  /**
   * Export report to PDF
   */
  async exportToPDF(
    reportType: string,
    merchantId: string,
    dateRange?: DateRange
  ): Promise<ReportExport> {
    return withRetry(async () => {
      const params = new URLSearchParams({
        reportType,
        merchantId,
      });

      if (dateRange) {
        params.append('startDate', dateRange.startDate);
        params.append('endDate', dateRange.endDate);
      }

      const response = await fetch(
        `${this.baseUrl}/reports/${reportType}/export/pdf?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new ServerError('Failed to export PDF report', response.status);
      }

      return response.json();
    }, 2);
  }

  /**
   * Export report to Excel
   */
  async exportToExcel(
    reportType: string,
    merchantId: string,
    dateRange?: DateRange
  ): Promise<ReportExport> {
    return withRetry(async () => {
      const params = new URLSearchParams({
        reportType,
        merchantId,
      });

      if (dateRange) {
        params.append('startDate', dateRange.startDate);
        params.append('endDate', dateRange.endDate);
      }

      const response = await fetch(
        `${this.baseUrl}/reports/${reportType}/export/excel?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new ServerError('Failed to export Excel report', response.status);
      }

      return response.json();
    }, 2);
  }

  /**
   * Get report as downloadable blob (for direct file download)
   */
  async downloadReport(
    reportType: 'sales' | 'revenue' | 'customers' | 'inventory',
    merchantId: string,
    format: 'pdf' | 'excel',
    dateRange?: DateRange
  ): Promise<{ blob: Blob; filename: string }> {
    const params = new URLSearchParams({
      merchantId,
      format,
    });

    if (dateRange) {
      params.append('startDate', dateRange.startDate);
      params.append('endDate', dateRange.endDate);
    }

    const response = await fetch(
      `${this.baseUrl}/reports/${reportType}/download?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      }
    );

    if (!response.ok) {
      throw new ServerError('Failed to download report', response.status);
    }

    const blob = await response.blob();
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = `${reportType}_report_${new Date().toISOString().split('T')[0]}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;

    if (contentDisposition) {
      const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (match && match[1]) {
        filename = match[1].replace(/['"]/g, '');
      }
    }

    return { blob, filename };
  }
}

// ============================================
// Export singleton instance
// ============================================

export const reportService = new ReportService();
export default reportService;
