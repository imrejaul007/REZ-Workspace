import { dashboardModel } from '../models/Dashboard';
import { ChartData, DateRange, ChartDataPoint } from '../types';
import { format, subDays, eachDayOfInterval, parseISO, differenceInDays } from 'date-fns';

interface ChartConfig {
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    danger: string;
    info: string;
    purple: string;
    pink: string;
  };
}

const CHART_COLORS: ChartConfig['colors'] = {
  primary: '#4F46E5',
  secondary: '#6B7280',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
  purple: '#8B5CF6',
  pink: '#EC4899',
};

class ChartService {
  /**
   * Generate bar chart data for revenue over time
   */
  generateRevenueBarChart(dateRange?: DateRange): ChartData {
    const revenueHistory = dashboardModel.getRevenueHistory(dateRange);

    return {
      labels: revenueHistory.map(r => {
        const date = parseISO(r.date);
        return format(date, 'MMM dd');
      }),
      datasets: [
        {
          label: 'Revenue',
          data: revenueHistory.map(r => r.revenue),
          backgroundColor: CHART_COLORS.primary,
          borderColor: CHART_COLORS.primary,
        },
        {
          label: 'Refunds',
          data: revenueHistory.map(r => r.refunds),
          backgroundColor: CHART_COLORS.danger,
          borderColor: CHART_COLORS.danger,
        },
      ],
    };
  }

  /**
   * Generate line chart data for orders over time
   */
  generateOrderLineChart(dateRange?: DateRange): ChartData {
    const revenueHistory = dashboardModel.getRevenueHistory(dateRange);

    return {
      labels: revenueHistory.map(r => {
        const date = parseISO(r.date);
        return format(date, 'MMM dd');
      }),
      datasets: [
        {
          label: 'Orders',
          data: revenueHistory.map(r => r.orders),
          borderColor: CHART_COLORS.success,
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
        },
      ],
    };
  }

  /**
   * Generate pie chart data for order status distribution
   */
  generateOrderStatusPieChart(dateRange?: DateRange): ChartData {
    const orders = dashboardModel.getOrders(dateRange);
    const statusCounts = {
      completed: 0,
      pending: 0,
      cancelled: 0,
      refunded: 0,
    };

    orders.forEach(order => {
      if (order.status in statusCounts) {
        statusCounts[order.status as keyof typeof statusCounts]++;
      }
    });

    return {
      labels: ['Completed', 'Pending', 'Cancelled', 'Refunded'],
      datasets: [
        {
          label: 'Order Status',
          data: [statusCounts.completed, statusCounts.pending, statusCounts.cancelled, statusCounts.refunded],
          backgroundColor: [
            CHART_COLORS.success,
            CHART_COLORS.warning,
            CHART_COLORS.secondary,
            CHART_COLORS.danger,
          ],
          borderColor: [
            CHART_COLORS.success,
            CHART_COLORS.warning,
            CHART_COLORS.secondary,
            CHART_COLORS.danger,
          ],
        },
      ],
    };
  }

  /**
   * Generate pie chart for revenue by category
   */
  generateRevenueByCategoryChart(): ChartData {
    const products = dashboardModel.getTopProducts(8);
    const categoryRevenue: Record<string, number> = {};

    products.forEach(p => {
      if (!categoryRevenue[p.category]) {
        categoryRevenue[p.category] = 0;
      }
      categoryRevenue[p.category] += p.revenue;
    });

    const categories = Object.keys(categoryRevenue);
    const colors = [
      CHART_COLORS.primary,
      CHART_COLORS.success,
      CHART_COLORS.warning,
      CHART_COLORS.info,
      CHART_COLORS.purple,
      CHART_COLORS.pink,
    ];

    return {
      labels: categories,
      datasets: [
        {
          label: 'Revenue by Category',
          data: categories.map(c => Math.round(categoryRevenue[c] * 100) / 100),
          backgroundColor: categories.map((_, i) => colors[i % colors.length]),
          borderColor: categories.map((_, i) => colors[i % colors.length]),
        },
      ],
    };
  }

  /**
   * Generate merchant performance bar chart
   */
  generateMerchantPerformanceChart(dateRange?: DateRange): ChartData {
    const merchants = dashboardModel.getMerchants(dateRange).slice(0, 5);

    return {
      labels: merchants.map(m => m.merchantName.length > 15
        ? m.merchantName.substring(0, 15) + '...'
        : m.merchantName
      ),
      datasets: [
        {
          label: 'Total Sales',
          data: merchants.map(m => m.totalSales),
          backgroundColor: CHART_COLORS.info,
          borderColor: CHART_COLORS.info,
        },
        {
          label: 'Order Count (x10)',
          data: merchants.map(m => m.orderCount * 10),
          backgroundColor: CHART_COLORS.success,
          borderColor: CHART_COLORS.success,
        },
      ],
    };
  }

  /**
   * Generate customer growth line chart
   */
  generateCustomerGrowthChart(dateRange?: DateRange): ChartData {
    const orders = dashboardModel.getOrders(dateRange);
    const days = dateRange
      ? differenceInDays(parseISO(dateRange.endDate), parseISO(dateRange.startDate)) + 1
      : 30;

    const startDate = dateRange ? parseISO(dateRange.startDate) : subDays(new Date(), days);
    const dateArray = eachDayOfInterval({ start: startDate, end: new Date() });

    let cumulativeCustomers = new Set<string>();
    const dailyNewCustomers: number[] = [];
    const dates: string[] = [];

    dateArray.forEach(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      dates.push(format(date, 'MMM dd'));

      const dayOrders = orders.filter(o => {
        const orderDate = format(parseISO(o.createdAt), 'yyyy-MM-dd');
        return orderDate === dateStr;
      });

      const newCustomers = new Set(dayOrders.map(o => o.customerId));
      const trulyNew = new Set<string>();

      newCustomers.forEach(c => {
        if (!cumulativeCustomers.has(c)) {
          trulyNew.add(c);
          cumulativeCustomers.add(c);
        }
      });

      dailyNewCustomers.push(trulyNew.size);
    });

    return {
      labels: dates,
      datasets: [
        {
          label: 'New Customers',
          data: dailyNewCustomers,
          borderColor: CHART_COLORS.purple,
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
        },
      ],
    };
  }

  /**
   * Generate top products horizontal bar chart
   */
  generateTopProductsChart(dateRange?: DateRange): ChartData {
    const products = dashboardModel.getTopProducts(10);

    return {
      labels: products.map(p => p.productName.length > 20
        ? p.productName.substring(0, 20) + '...'
        : p.productName
      ),
      datasets: [
        {
          label: 'Revenue',
          data: products.map(p => p.revenue),
          backgroundColor: CHART_COLORS.primary,
          borderColor: CHART_COLORS.primary,
        },
      ],
    };
  }

  /**
   * Generate comparison chart (current vs previous period)
   */
  generateComparisonChart(dateRange?: DateRange): ChartData {
    const revenueHistory = dashboardModel.getRevenueHistory(dateRange);
    const totalRevenue = revenueHistory.reduce((sum, r) => sum + r.revenue, 0);
    const totalOrders = revenueHistory.reduce((sum, r) => sum + r.orders, 0);

    // STATISTICAL: simulate previous period data for comparison charts
    const previousRevenue = totalRevenue * (0.85 + Math.random() * 0.1);
    const previousOrders = totalOrders * (0.8 + Math.random() * 0.15);

    return {
      labels: ['Revenue', 'Orders', 'AOV', 'Customers'],
      datasets: [
        {
          label: 'Current Period',
          data: [totalRevenue, totalOrders, totalRevenue / totalOrders, 150],
          backgroundColor: CHART_COLORS.primary,
          borderColor: CHART_COLORS.primary,
        },
        {
          label: 'Previous Period',
          data: [previousRevenue, previousOrders, previousRevenue / previousOrders, 120],
          backgroundColor: CHART_COLORS.secondary,
          borderColor: CHART_COLORS.secondary,
        },
      ],
    };
  }

  /**
   * Generate funnel chart for conversion
   */
  generateConversionFunnel(dateRange?: DateRange): ChartData {
    const orders = dashboardModel.getOrders(dateRange);
    const totalVisitors = orders.length * 3; // Simulate visitors
    const cartAdds = Math.floor(totalVisitors * 0.4);
    const checkouts = Math.floor(cartAdds * 0.6);
    const completed = orders.filter(o => o.status === 'completed').length;

    return {
      labels: ['Visitors', 'Cart Adds', 'Checkouts', 'Completed Orders'],
      datasets: [
        {
          label: 'Conversion Funnel',
          data: [totalVisitors, cartAdds, checkouts, completed],
          backgroundColor: [
            CHART_COLORS.primary,
            CHART_COLORS.info,
            CHART_COLORS.success,
            CHART_COLORS.purple,
          ],
          borderColor: [
            CHART_COLORS.primary,
            CHART_COLORS.info,
            CHART_COLORS.success,
            CHART_COLORS.purple,
          ],
        },
      ],
    };
  }

  /**
   * Generate gauge chart data for KPIs
   */
  generateKPIGaugeChart(value: number, max: number, label: string): ChartData {
    const percentage = Math.min((value / max) * 100, 100);

    return {
      labels: [label],
      datasets: [
        {
          label: 'Value',
          data: [percentage],
          backgroundColor: [percentage > 80 ? CHART_COLORS.success : percentage > 50 ? CHART_COLORS.warning : CHART_COLORS.danger],
          borderColor: [percentage > 80 ? CHART_COLORS.success : percentage > 50 ? CHART_COLORS.warning : CHART_COLORS.danger],
        },
      ],
    };
  }

  /**
   * Get all chart configurations for dashboard
   */
  getAllCharts(dateRange?: DateRange): Record<string, ChartData> {
    return {
      revenueBar: this.generateRevenueBarChart(dateRange),
      orderLine: this.generateOrderLineChart(dateRange),
      orderStatusPie: this.generateOrderStatusPieChart(dateRange),
      revenueByCategory: this.generateRevenueByCategoryChart(),
      merchantPerformance: this.generateMerchantPerformanceChart(dateRange),
      customerGrowth: this.generateCustomerGrowthChart(dateRange),
      topProducts: this.generateTopProductsChart(dateRange),
      comparison: this.generateComparisonChart(dateRange),
      conversionFunnel: this.generateConversionFunnel(dateRange),
    };
  }
}

export const chartService = new ChartService();
