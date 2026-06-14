import {
  KPIData,
  RevenueData,
  OrderData,
  CustomerMetrics,
  MerchantPerformance,
  ChartData,
  TopProduct,
  DashboardSummary,
  DateRange,
} from '../types';
import { v4 as uuidv4 } from 'uuid';

// In-memory data store (in production, this would be a database)
class DashboardModel {
  private orders: OrderData[] = [];
  private revenueHistory: RevenueData[] = [];
  private customers: Map<string, { firstPurchase: string; purchaseCount: number; totalSpent: number }> = new Map();
  private merchants: Map<string, MerchantPerformance> = new Map();
  private products: TopProduct[] = [];

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData(): void {
    // Generate mock orders for the last 30 days
    const now = new Date();
    const merchantsList = [
      { id: 'm1', name: 'Tech Gadgets Pro' },
      { id: 'm2', name: 'Fashion Forward' },
      { id: 'm3', name: 'Home Essentials' },
      { id: 'm4', name: 'Sports Zone' },
      { id: 'm5', name: 'Books & More' },
    ];

    // Generate merchant mock data - STATISTICAL: mock analytics data generation
    merchantsList.forEach(m => {
      this.merchants.set(m.id, {
        merchantId: m.id,
        merchantName: m.name,
        totalSales: Math.floor(Math.random() * 100000) + 10000,
        orderCount: Math.floor(Math.random() * 500) + 50,
        averageRating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
        responseTime: Math.floor(Math.random() * 30) + 5,
        fulfillmentRate: Math.round((85 + Math.random() * 15) * 10) / 10,
      });
    });

    // Generate daily revenue data
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      // STATISTICAL: mock revenue data generation
      const baseRevenue = 5000 + Math.random() * 3000;
      const weekendMultiplier = [0, 6].includes(date.getDay()) ? 1.3 : 1;

      this.revenueHistory.push({
        date: dateStr,
        revenue: Math.round(baseRevenue * weekendMultiplier * 100) / 100,
        orders: Math.floor(Math.random() * 50) + 30,
        refunds: Math.floor(Math.random() * 5),
      });

      // Generate orders for this day
      // STATISTICAL: mock order data generation
      const orderCount = Math.floor(Math.random() * 50) + 30;
      for (let j = 0; j < orderCount; j++) {
        const customerId = `c${Math.floor(Math.random() * 200) + 1}`;
        const merchant = merchantsList[Math.floor(Math.random() * merchantsList.length)];
        const status: OrderData['status'] = Math.random() > 0.1
          ? (Math.random() > 0.05 ? 'completed' : 'refunded')
          : (Math.random() > 0.5 ? 'pending' : 'cancelled');

        const order: OrderData = {
          orderId: uuidv4(),
          customerId,
          merchantId: merchant.id,
          amount: Math.round((20 + Math.random() * 200) * 100) / 100,
          status,
          createdAt: date.toISOString(),
          completedAt: status === 'completed' ? date.toISOString() : undefined,
        };
        this.orders.push(order);

        // Update customer metrics
        const existingCustomer = this.customers.get(customerId);
        if (existingCustomer) {
          existingCustomer.purchaseCount++;
          existingCustomer.totalSpent += order.amount;
        } else {
          this.customers.set(customerId, {
            firstPurchase: date.toISOString(),
            purchaseCount: 1,
            totalSpent: order.amount,
          });
        }
      }
    }

    // Generate mock products
    this.products = [
      { productId: 'p1', productName: 'Wireless Earbuds', category: 'Electronics', unitsSold: 1250, revenue: 62499.50 },
      { productId: 'p2', productName: 'Smart Watch', category: 'Electronics', unitsSold: 890, revenue: 88999.10 },
      { productId: 'p3', productName: 'Running Shoes', category: 'Sports', unitsSold: 720, revenue: 35999.28 },
      { productId: 'p4', productName: 'Designer T-Shirt', category: 'Fashion', unitsSold: 1450, revenue: 43499.50 },
      { productId: 'p5', productName: 'Coffee Maker', category: 'Home', unitsSold: 540, revenue: 26999.46 },
      { productId: 'p6', productName: 'Yoga Mat', category: 'Sports', unitsSold: 680, revenue: 20399.32 },
      { productId: 'p7', productName: 'Laptop Stand', category: 'Electronics', unitsSold: 420, revenue: 20999.58 },
      { productId: 'p8', productName: 'Bestseller Novel', category: 'Books', unitsSold: 980, revenue: 14699.82 },
    ];
  }

  getOrders(dateRange?: DateRange): OrderData[] {
    if (!dateRange) return this.orders;

    const start = new Date(dateRange.startDate);
    const end = new Date(dateRange.endDate);

    return this.orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= start && orderDate <= end;
    });
  }

  getRevenueHistory(dateRange?: DateRange): RevenueData[] {
    if (!dateRange) return this.revenueHistory;

    const start = dateRange.startDate;
    const end = dateRange.endDate;

    return this.revenueHistory.filter(r => r.date >= start && r.date <= end);
  }

  getKPIs(dateRange?: DateRange): KPIData {
    const revenueData = this.getRevenueHistory(dateRange);
    const orders = this.getOrders(dateRange);

    const totalRevenue = revenueData.reduce((sum, r) => sum + r.revenue, 0);
    const totalOrders = orders.filter(o => o.status === 'completed').length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const activeCustomers = new Set(orders.map(o => o.customerId)).size;

    // Calculate previous period for growth
    const currentPeriodDays = dateRange
      ? Math.ceil((new Date(dateRange.endDate).getTime() - new Date(dateRange.startDate).getTime()) / (1000 * 60 * 60 * 24))
      : 30;

    // STATISTICAL: calculate previous period metrics for growth comparison
    const previousRevenue = totalRevenue * (0.85 + Math.random() * 0.1);
    const previousOrders = Math.floor(totalOrders * (0.85 + Math.random() * 0.1));
    const previousAOV = averageOrderValue * (0.9 + Math.random() * 0.15);
    const previousCustomers = Math.floor(activeCustomers * (0.8 + Math.random() * 0.15));

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      revenueGrowth: Math.round(((totalRevenue - previousRevenue) / previousRevenue) * 10000) / 100,
      totalOrders,
      ordersGrowth: Math.round(((totalOrders - previousOrders) / previousOrders) * 10000) / 100,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      aovGrowth: Math.round(((averageOrderValue - previousAOV) / previousAOV) * 10000) / 100,
      activeCustomers,
      customerGrowth: Math.round(((activeCustomers - previousCustomers) / previousCustomers) * 10000) / 100,
      conversionRate: Math.round((totalOrders / (activeCustomers * 2) * 100) * 100) / 100,
      // STATISTICAL: mock growth percentage for dashboard display
      conversionGrowth: Math.round((Math.random() * 10 - 3) * 100) / 100,
    };
  }

  getCustomerMetrics(dateRange?: DateRange): CustomerMetrics {
    const orders = this.getOrders(dateRange);
    const uniqueCustomers = new Set(orders.map(o => o.customerId));
    const allCustomers = Array.from(this.customers.values());

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const newCustomers = allCustomers.filter(c => new Date(c.firstPurchase) >= thirtyDaysAgo).length;
    const returningCustomers = allCustomers.filter(c => c.purchaseCount > 1).length;

    const totalLifetimeValue = allCustomers.reduce((sum, c) => sum + c.totalSpent, 0);
    const totalPurchases = allCustomers.reduce((sum, c) => sum + c.purchaseCount, 0);

    return {
      totalCustomers: uniqueCustomers.size,
      newCustomers,
      returningCustomers,
      churnRate: Math.round((1 - returningCustomers / uniqueCustomers.size) * 10000) / 100,
      lifetimeValue: Math.round((totalLifetimeValue / uniqueCustomers.size) * 100) / 100,
      averagePurchaseFrequency: Math.round((totalPurchases / uniqueCustomers.size) * 100) / 100,
    };
  }

  getMerchants(dateRange?: DateRange): MerchantPerformance[] {
    const orders = this.getOrders(dateRange);
    const merchantMap = new Map<string, { sales: number; orders: number }>();

    orders.forEach(order => {
      if (order.status === 'completed') {
        const existing = merchantMap.get(order.merchantId) || { sales: 0, orders: 0 };
        existing.sales += order.amount;
        existing.orders++;
        merchantMap.set(order.merchantId, existing);
      }
    });

    return Array.from(this.merchants.values())
      .map(m => {
        const stats = merchantMap.get(m.merchantId) || { sales: m.totalSales * 0.8, orders: m.orderCount };
        return {
          ...m,
          totalSales: Math.round(stats.sales * 100) / 100,
          orderCount: stats.orders,
        };
      })
      .sort((a, b) => b.totalSales - a.totalSales);
  }

  getTopProducts(limit: number = 10): TopProduct[] {
    return [...this.products]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  }

  getRecentOrders(limit: number = 20): OrderData[] {
    return [...this.orders]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  getDashboardSummary(dateRange?: DateRange): DashboardSummary {
    const kpis = this.getKPIs(dateRange);
    const revenueHistory = this.getRevenueHistory(dateRange);
    const orders = this.getOrders(dateRange);

    // Prepare revenue chart data
    const revenueChart: ChartData = {
      labels: revenueHistory.map(r => r.date),
      datasets: [{
        label: 'Revenue',
        data: revenueHistory.map(r => r.revenue),
        borderColor: '#4F46E5',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
      }],
    };

    // Prepare orders chart data
    const ordersChart: ChartData = {
      labels: revenueHistory.map(r => r.date),
      datasets: [{
        label: 'Orders',
        data: revenueHistory.map(r => r.orders),
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
      }],
    };

    return {
      kpis,
      revenueChart,
      ordersChart,
      topProducts: this.getTopProducts(5),
      topMerchants: this.getMerchants().slice(0, 5),
      recentOrders: this.getRecentOrders(10),
      lastUpdated: new Date().toISOString(),
    };
  }
}

export const dashboardModel = new DashboardModel();
