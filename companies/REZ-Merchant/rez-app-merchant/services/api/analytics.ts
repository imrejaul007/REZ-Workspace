// C1 FIX: removed getApiUrl + storageService — all HTTP calls now go through
// apiClient so token refresh, interceptors, and cookie handling are centralised.
import { apiClient } from './client';
import { logger } from '../../utils/logger';
import {
  DateRangeFilter,
  SalesForecastResponse,
  InventoryStockoutResponse,
  CustomerInsights,
  SeasonalTrendResponse,
  ProductPerformance,
  ProductPerformanceResponse,
  RevenueBreakdownResponse,
  AnalyticsOverview,
  ExportRequest,
  ExportResponse,
  AnalyticsQueryOptions,
  PeriodComparison,
  RealTimeMetrics,
  AnalyticsResponse,
  DateRangePreset,
  DateRange,
  SalesByDayResponse,
  SalesByTimeResponse,
  TopSellingProductsResponse,
  CustomerSegmentsResponse,
  TopOffersResponse,
} from '../../types/analytics';

class AnalyticsService {
  // Store the active store ID for API calls
  private activeStoreId: string | null = null;

  /**
   * Set the active store ID for filtering analytics
   */
  setActiveStore(storeId: string | null) {
    this.activeStoreId = storeId;
  }

  /**
   * Get the active store ID
   */
  getActiveStore(): string | null {
    return this.activeStoreId;
  }

  /**
   * Get analytics overview for dashboard
   * @param dateRange Date range filter
   * @returns AnalyticsOverview with key metrics
   */
  async getAnalyticsOverview(dateRange?: DateRangeFilter): Promise<AnalyticsOverview> {
    // BUG-039: Migrated from raw fetch to apiClient for centralised auth handling.
    try {
      const params = this.buildQueryParams({ timeRange: dateRange });
      const storeParam = this.activeStoreId ? `&storeId=${this.activeStoreId}` : '';
      const data = await apiClient.get(`merchant/analytics/overview?${params}${storeParam}`);

      if (data.success && data.data) {
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to get analytics overview');
      }
    } catch (error) {
      if (__DEV__) console.error('Get analytics overview error:', error);
      throw new Error(error.message || 'Failed to get analytics overview');
    }
  }

  /**
   * Get sales forecast for specified period
   * @param forecastDays 7, 30, 60, or 90 days ahead
   * @param dateRange Historical date range for forecast basis
   * @returns SalesForecastResponse with forecasted sales
   */
  async getSalesForecast(
    forecastDays: 7 | 30 | 60 | 90 = 30,
    dateRange?: DateRangeFilter
  ): Promise<SalesForecastResponse> {
    try {
      const params = new URLSearchParams();
      params.append('days', forecastDays.toString());
      params.append('forecastDays', forecastDays.toString());
      if (dateRange) {
        if (dateRange.startDate) params.append('startDate', dateRange.startDate);
        if (dateRange.endDate) params.append('endDate', dateRange.endDate);
        if (dateRange.preset) params.append('preset', dateRange.preset);
      }
      if (this.activeStoreId) params.append('storeId', this.activeStoreId);

      const data = await apiClient.get<SalesForecastResponse>(
        `merchant/analytics/forecast/sales?${params}`
      );
      if (data.success && data.data) return data.data;
      throw new Error(data.message || 'Failed to get sales forecast');
    } catch (error) {
      if (__DEV__) console.error('Get sales forecast error:', error);
      throw new Error(error.message || 'Failed to get sales forecast');
    }
  }

  /**
   * Get inventory stockout predictions
   * @param dateRange Date range for analysis
   * @returns InventoryStockoutResponse with risk predictions
   */
  async getStockoutPredictions(dateRange?: DateRangeFilter): Promise<InventoryStockoutResponse> {
    try {
      const params = this.buildQueryParams({ timeRange: dateRange });
      const storeParam = this.activeStoreId ? `&storeId=${this.activeStoreId}` : '';
      const data = await apiClient.get<InventoryStockoutResponse>(
        `merchant/analytics/inventory/stockout-prediction?${params}${storeParam}`
      );
      if (data.success && data.data) return data.data;
      throw new Error(data.message || 'Failed to get stockout predictions');
    } catch (error) {
      if (__DEV__) console.error('Get stockout predictions error:', error);
      throw new Error(error.message || 'Failed to get stockout predictions');
    }
  }

  /**
   * Get customer insights including LTV, retention, and churn analysis
   * @param dateRange Date range for analysis
   * @returns CustomerInsights with comprehensive customer analytics
   */
  async getCustomerInsights(dateRange?: DateRangeFilter): Promise<CustomerInsights> {
    try {
      const params = this.buildQueryParams({ timeRange: dateRange });
      const storeParam = this.activeStoreId ? `&storeId=${this.activeStoreId}` : '';
      const data = await apiClient.get<CustomerInsights>(
        `merchant/analytics/customers/insights?${params}${storeParam}`
      );
      if (data.success && data.data) return data.data;
      throw new Error(data.message || 'Failed to get customer insights');
    } catch (error) {
      if (__DEV__) console.error('Get customer insights error:', error);
      throw new Error(error.message || 'Failed to get customer insights');
    }
  }

  /**
   * Get seasonal trend analysis
   * @param dataType Type of data to analyze (sales, orders, customers, products)
   * @param dateRange Date range for analysis
   * @returns SeasonalTrendResponse with trend patterns
   */
  async getSeasonalTrends(
    dataType: 'sales' | 'orders' | 'customers' | 'products' = 'sales',
    dateRange?: DateRangeFilter
  ): Promise<SeasonalTrendResponse> {
    try {
      const params = new URLSearchParams();
      params.append('dataType', dataType);
      if (dateRange) {
        if (dateRange.startDate) params.append('startDate', dateRange.startDate);
        if (dateRange.endDate) params.append('endDate', dateRange.endDate);
        if (dateRange.preset) params.append('preset', dateRange.preset);
      }
      if (this.activeStoreId) params.append('storeId', this.activeStoreId);

      const data = await apiClient.get<SeasonalTrendResponse>(
        `merchant/analytics/trends/seasonal?${params}`
      );
      if (data.success && data.data) return data.data;
      throw new Error(data.message || 'Failed to get seasonal trends');
    } catch (error) {
      if (__DEV__) console.error('Get seasonal trends error:', error);
      throw new Error(error.message || 'Failed to get seasonal trends');
    }
  }

  /**
   * Get product performance analytics
   * @param options Query options for filtering and sorting
   * @returns ProductPerformanceResponse with product metrics
   */
  async getProductPerformance(
    options?: AnalyticsQueryOptions
  ): Promise<ProductPerformanceResponse> {
    try {
      const params = this.buildQueryParams(options);
      const storeParam = this.activeStoreId ? `&storeId=${this.activeStoreId}` : '';
      const data = await apiClient.get<unknown>(
        `merchant/analytics/products/performance?${params}${storeParam}`
      );

      if (data.success && data.data) {
        // Transform flat array from backend into ProductPerformanceResponse structure
        const products = Array.isArray(data.data) ? data.data : [];

        // Debug: Log the raw data from backend
        if (__DEV__)
          logger.log('[Analytics] Raw product data from backend', { sampleProducts: products.slice(0, 2) });

        // Transform backend products to ProductPerformance type
        // Backend now returns: productId, productName, totalQuantity, totalRevenue, orderCount, averagePrice,
        // sku, category, currentStock, avgRating, reviewCount, imageUrl
        const transformedProducts = products.map((p, index: number) => {
          const revenue = p.totalRevenue || p.revenue || 0;
          const quantity = p.totalQuantity || p.quantity || 0;
          const growthPercent = p.growthPercent || p.trend || 0;

          // Calculate estimated profit (20% margin estimate if not provided)
          const estimatedMargin = p.profitMargin || 20;
          const estimatedNetProfit = revenue * (estimatedMargin / 100);

          // Determine health based on multiple factors
          const hasStock = p.currentStock === null || p.currentStock > 0;
          const hasGoodRating = (p.avgRating || 0) >= 3.5;
          const hasGrowth = growthPercent >= 0;

          let health: 'excellent' | 'good' | 'fair' | 'poor' = 'fair';
          if (hasStock && hasGoodRating && growthPercent > 10) health = 'excellent';
          else if (hasStock && hasGrowth) health = 'good';
          else if (!hasStock || growthPercent < -10) health = 'poor';

          return {
            productId: p.productId || p._id || `product-${index}`,
            productName: p.productName || p.name || 'Unknown Product',
            sku: p.sku || 'N/A',
            category: p.category || 'General',
            imageUrl: p.imageUrl || null,
            sales: {
              quantity: quantity,
              revenue: revenue,
              trend: growthPercent,
              avgUnitPrice: p.averagePrice || (quantity > 0 ? revenue / quantity : 0),
            },
            inventory: {
              currentStock: p.currentStock,
              isAvailable: p.isAvailable ?? true,
              stockTurnovers: p.stockTurnovers || (quantity > 0 ? 1 : 0),
              avgDaysToSell: p.avgDaysToSell || 0,
              outOfStockDays: p.outOfStockDays || 0,
            },
            customer: {
              uniqueBuyers: p.uniqueBuyers || p.orderCount || 0,
              repeatBuyerRate: p.repeatBuyerRate || 0,
              avgRating: p.avgRating || 0,
              reviewCount: p.reviewCount || 0,
            },
            profitability: {
              grossProfit: p.grossProfit || revenue * 0.3,
              netProfit: p.netProfit || estimatedNetProfit,
              marginPercentage: estimatedMargin,
              roas: p.roas || 0,
            },
            performance: {
              rank: index + 1,
              ranking:
                index < Math.ceil(products.length * 0.3)
                  ? 'top_tier'
                  : index < Math.ceil(products.length * 0.7)
                    ? 'mid_tier'
                    : 'low_tier',
              health: health,
            },
          };
        });

        // Categorize products by performance
        const totalProducts = transformedProducts.length;
        const topCount = Math.ceil(totalProducts * 0.3);
        const middleCount = Math.ceil(totalProducts * 0.4);

        const topPerformers = transformedProducts.slice(0, topCount) as ProductPerformance[];
        const middlePerformers = transformedProducts.slice(
          topCount,
          topCount + middleCount
        ) as ProductPerformance[];
        const underperformers = transformedProducts.slice(
          topCount + middleCount
        ) as ProductPerformance[];

        // Group by category
        const categoryMap = new Map<string, unknown[]>();
        transformedProducts.forEach((p) => {
          const cat = p.category || 'General';
          if (!categoryMap.has(cat)) categoryMap.set(cat, []);
          categoryMap.get(cat)!.push(p);
        });

        const byCategory = Array.from(categoryMap.entries())
          .map(([category, prods]) => ({
            category,
            productCount: prods.length,
            totalSales: prods.reduce((sum: number, p) => sum + (p.sales?.quantity || 0), 0),
            totalRevenue: prods.reduce((sum: number, p) => sum + (p.sales?.revenue || 0), 0),
            topProduct: prods.sort(
              (a, b) => (b.sales?.revenue || 0) - (a.sales?.revenue || 0)
            )[0],
          }))
          .sort((a, b) => b.totalRevenue - a.totalRevenue); // Sort by revenue descending

        // Calculate summary
        const totalRevenue = transformedProducts.reduce(
          (sum: number, p) => sum + (p.sales?.revenue || 0),
          0
        );
        const totalSalesQty = transformedProducts.reduce(
          (sum: number, p) => sum + (p.sales?.quantity || 0),
          0
        );
        const avgMargin =
          transformedProducts.length > 0
            ? transformedProducts.reduce(
                (sum: number, p) => sum + (p.profitability?.marginPercentage || 0),
                0
              ) / transformedProducts.length
            : 0;

        return {
          timeRange: {
            startDate: this.getDateNDaysAgo(30),
            endDate: this.getTodayDate(),
          },
          totalProducts,
          analyzedProducts: totalProducts,
          byPerformance: {
            topPerformers,
            middlePerformers,
            underperformers,
          },
          byCategory,
          summary: {
            totalSalesQty,
            totalRevenue,
            avgProductRevenue: totalProducts > 0 ? totalRevenue / totalProducts : 0,
            avgMargin,
            topCategory:
              byCategory.length > 0
                ? byCategory.sort((a, b) => b.totalRevenue - a.totalRevenue)[0].category
                : 'N/A',
          },
        };
      } else {
        throw new Error(data.message || 'Failed to get product performance');
      }
    } catch (error) {
      if (__DEV__) logger.error('Get product performance error', error);
      throw new Error(error.message || 'Failed to get product performance');
    }
  }

  /**
   * Get revenue breakdown by various dimensions
   * @param dateRange Date range for analysis
   * @returns RevenueBreakdownResponse with revenue breakdown details
   */
  async getRevenueBreakdown(dateRange?: DateRangeFilter): Promise<RevenueBreakdownResponse> {
    try {
      const params = this.buildQueryParams({ timeRange: dateRange });
      const storeParam = this.activeStoreId ? `&storeId=${this.activeStoreId}` : '';
      const data = await apiClient.get<RevenueBreakdownResponse>(
        `merchant/analytics/revenue/breakdown?${params}${storeParam}`
      );
      if (data.success && data.data) return data.data;
      throw new Error(data.message || 'Failed to get revenue breakdown');
    } catch (error) {
      if (__DEV__) logger.error('Get revenue breakdown error', error);
      throw new Error(error.message || 'Failed to get revenue breakdown');
    }
  }

  /**
   * Compare analytics metrics between two periods
   * @param currentDateRange Current period
   * @param previousDateRange Previous period for comparison
   * @returns PeriodComparison with growth metrics
   */
  async comparePeriods(
    currentDateRange: DateRange,
    previousDateRange: DateRange
  ): Promise<PeriodComparison> {
    try {
      const params = new URLSearchParams();
      params.append('currentStart', currentDateRange.startDate);
      params.append('currentEnd', currentDateRange.endDate);
      params.append('previousStart', previousDateRange.startDate);
      params.append('previousEnd', previousDateRange.endDate);
      if (this.activeStoreId) params.append('storeId', this.activeStoreId);

      const data = await apiClient.get<PeriodComparison>(`merchant/analytics/comparison?${params}`);
      if (data.success && data.data) return data.data;
      throw new Error(data.message || 'Failed to compare periods');
    } catch (error) {
      if (__DEV__) logger.error('Compare periods error', error);
      throw new Error(error.message || 'Failed to compare periods');
    }
  }

  /**
   * Get sales trends by day of week
   * @param dateRange Date range filter
   * @returns SalesByDayResponse with daily performance data
   */
  async getSalesByDay(dateRange?: DateRangeFilter): Promise<SalesByDayResponse> {
    try {
      const params = this.buildQueryParams({ timeRange: dateRange });
      const storeParam = this.activeStoreId ? `&storeId=${this.activeStoreId}` : '';
      const result = await apiClient.get<unknown>(
        `merchant/analytics/sales/trends?${params}${storeParam}`
      );

      if (result.success) {
        // Transform backend data to frontend expected format
        const rawData = Array.isArray(result.data) ? result.data : [];
        const dayNames = [
          'Sunday',
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
        ];

        const transformedData = rawData.map((item) => {
          const date = new Date(item.date);
          return {
            date: item.date,
            dayOfWeek: dayNames[date.getDay()] || 'Unknown',
            revenue: item.revenue || 0,
            orders: item.orders || 0,
            customers: item.orders || 0, // Approximate customers by orders
          };
        });

        // Calculate summary
        const totalRevenue = transformedData.reduce((sum: number, d) => sum + d.revenue, 0);
        const totalOrders = transformedData.reduce((sum: number, d) => sum + d.orders, 0);
        const totalCustomers = transformedData.reduce(
          (sum: number, d) => sum + d.customers,
          0
        );

        // Find best and worst days
        const sortedByRevenue = [...transformedData].sort(
          (a, b) => b.revenue - a.revenue
        );
        const bestDay = sortedByRevenue[0]?.dayOfWeek || 'N/A';
        const worstDay = sortedByRevenue[sortedByRevenue.length - 1]?.dayOfWeek || 'N/A';

        return {
          timeRange: { startDate: '', endDate: '' },
          data: transformedData,
          summary: {
            totalRevenue,
            totalOrders,
            totalCustomers,
            avgDailyRevenue: transformedData.length > 0 ? totalRevenue / transformedData.length : 0,
            avgDailyOrders: transformedData.length > 0 ? totalOrders / transformedData.length : 0,
            bestDay,
            worstDay,
          },
        };
      } else {
        throw new Error(result.message || 'Failed to get sales by day');
      }
    } catch (error) {
      if (__DEV__) console.error('Get sales by day error:', error);
      throw new Error(error.message || 'Failed to get sales by day');
    }
  }

  /**
   * Get sales by time of day (hourly breakdown)
   * @param dateRange Date range filter
   * @returns SalesByTimeResponse with hourly performance data
   */
  async getSalesByTime(dateRange?: DateRangeFilter): Promise<SalesByTimeResponse> {
    try {
      const params = this.buildQueryParams({ timeRange: dateRange });
      const storeParam = this.activeStoreId ? `&storeId=${this.activeStoreId}` : '';
      const result = await apiClient.get<unknown>(
        `merchant/analytics/sales/by-time?${params}${storeParam}`
      );

      if (result.success) {
        // Transform backend data to frontend expected format
        const rawData = Array.isArray(result.data) ? result.data : [];

        const formatHour = (hour: number): string => {
          if (hour === 0) return '12 AM';
          if (hour === 12) return '12 PM';
          if (hour < 12) return `${hour} AM`;
          return `${hour - 12} PM`;
        };

        const transformedData = rawData.map((item) => ({
          hour: item.hour,
          hourLabel: formatHour(item.hour),
          revenue: item.revenue || 0,
          orders: item.orders || 0,
          avgOrderValue: item.orders > 0 ? item.revenue / item.orders : 0,
        }));

        // Calculate totals for peak hour detection
        const totalOrders = transformedData.reduce((sum: number, d) => sum + d.orders, 0);
        const totalRevenue = transformedData.reduce((sum: number, d) => sum + d.revenue, 0);

        // Find peak hours (hours with > 15% of total orders)
        const peakHours = [];
        const sortedByOrders = [...transformedData].sort((a, b) => b.orders - a.orders);
        const topHours = sortedByOrders.slice(0, 3);

        if (topHours.length > 0) {
          const peakStart = Math.min(...topHours.map((h) => h.hour));
          const peakEnd = Math.max(...topHours.map((h) => h.hour));
          const peakOrders = topHours.reduce((sum: number, h) => sum + h.orders, 0);
          const peakRevenue = topHours.reduce((sum: number, h) => sum + h.revenue, 0);

          peakHours.push({
            start: peakStart,
            end: peakEnd,
            label: `${formatHour(peakStart)} - ${formatHour(peakEnd)}`,
            ordersPercentage: totalOrders > 0 ? (peakOrders / totalOrders) * 100 : 0,
            revenuePercentage: totalRevenue > 0 ? (peakRevenue / totalRevenue) * 100 : 0,
          });
        }

        // Find busiest and quietest hours
        const busiestHour = sortedByOrders[0]?.hour || 0;
        const quietestHour = sortedByOrders[sortedByOrders.length - 1]?.hour || 0;

        return {
          timeRange: { startDate: '', endDate: '' },
          data: transformedData,
          peakHours,
          summary: {
            busiestHour,
            quietestHour,
            avgOrdersPerHour: transformedData.length > 0 ? totalOrders / transformedData.length : 0,
            avgRevenuePerHour:
              transformedData.length > 0 ? totalRevenue / transformedData.length : 0,
          },
        };
      } else {
        throw new Error(result.message || 'Failed to get sales by time');
      }
    } catch (error) {
      if (__DEV__) console.error('Get sales by time error:', error);
      throw new Error(error.message || 'Failed to get sales by time');
    }
  }

  /**
   * Get top selling products
   * @param dateRange Date range filter
   * @param limit Number of products to return (default 10)
   * @returns TopSellingProductsResponse with top products
   */
  async getTopSellingProducts(
    dateRange?: DateRangeFilter,
    limit: number = 10
  ): Promise<TopSellingProductsResponse> {
    try {
      const params = this.buildQueryParams({ timeRange: dateRange, limit });
      const storeParam = this.activeStoreId ? `&storeId=${this.activeStoreId}` : '';
      const result = await apiClient.get<unknown>(
        `merchant/analytics/products/top-selling?${params}${storeParam}`
      );

      if (result.success) {
        // Transform backend data to frontend expected format
        const rawData = Array.isArray(result.data) ? result.data : [];

        const products = rawData.map((item, index: number) => ({
          productId: item.productId || item._id || `product-${index}`,
          productName: item.productName || item.name || 'Unknown Product',
          sku: item.sku || '',
          imageUrl: item.imageUrl || item.image,
          quantitySold: item.totalQuantity || item.quantitySold || 0,
          revenue: item.totalRevenue || item.revenue || 0,
          orderCount: item.orderCount || 0,
          trend: item.trend ?? 0, // Default to 0 if trend not provided
          rank: index + 1,
        }));

        const totalProductsSold = products.reduce((sum: number, p) => sum + p.quantitySold, 0);
        const totalRevenue = products.reduce((sum: number, p) => sum + p.revenue, 0);

        return {
          timeRange: { startDate: '', endDate: '' },
          products,
          summary: {
            totalProductsSold,
            totalRevenue,
            topCategoryName: 'All Products',
          },
        };
      } else {
        throw new Error(result.message || 'Failed to get top selling products');
      }
    } catch (error) {
      if (__DEV__) console.error('Get top selling products error:', error);
      throw new Error(error.message || 'Failed to get top selling products');
    }
  }

  /**
   * Get customer segments breakdown
   * @param dateRange Date range filter
   * @returns CustomerSegmentsResponse with segment data
   */
  async getCustomerSegments(dateRange?: DateRangeFilter): Promise<CustomerSegmentsResponse> {
    try {
      const params = this.buildQueryParams({ timeRange: dateRange });
      const storeParam = this.activeStoreId ? `&storeId=${this.activeStoreId}` : '';
      const data = await apiClient.get<CustomerSegmentsResponse>(
        `merchant/analytics/customers/segments?${params}${storeParam}`
      );
      if (data.success && data.data) {
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to get customer segments');
      }
    } catch (error) {
      if (__DEV__) console.error('Get customer segments error:', error);
      throw new Error(error.message || 'Failed to get customer segments');
    }
  }

  /**
   * Get top performing offers
   * @param dateRange Date range filter
   * @param limit Number of offers to return (default 5)
   * @returns TopOffersResponse with top offers
   */
  async getTopOffers(dateRange?: DateRangeFilter, limit: number = 5): Promise<TopOffersResponse> {
    try {
      const params = this.buildQueryParams({ timeRange: dateRange, limit });
      const storeParam = this.activeStoreId ? `&storeId=${this.activeStoreId}` : '';
      const data = await apiClient.get<TopOffersResponse>(
        `merchant/analytics/offers/top?${params}${storeParam}`
      );
      if (data.success && data.data) {
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to get top offers');
      }
    } catch (error) {
      if (__DEV__) console.error('Get top offers error:', error);
      throw new Error(error.message || 'Failed to get top offers');
    }
  }

  /**
   * Get real-time analytics metrics
   * @returns RealTimeMetrics with live data
   */
  async getRealTimeMetrics(): Promise<RealTimeMetrics> {
    try {
      const storeParam = this.activeStoreId ? `?storeId=${this.activeStoreId}` : '';
      const data = await apiClient.get<RealTimeMetrics>(`merchant/analytics/realtime${storeParam}`);
      if (data.success && data.data) {
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to get real-time metrics');
      }
    } catch (error) {
      if (__DEV__) console.error('Get real-time metrics error:', error);
      throw new Error(error.message || 'Failed to get real-time metrics');
    }
  }

  /**
   * Export analytics data in specified format
   * @param exportRequest Export configuration
   * @returns ExportResponse with download URL
   */
  async exportAnalytics(exportRequest: ExportRequest): Promise<ExportResponse> {
    try {
      const requestBody = {
        ...exportRequest,
        ...(this.activeStoreId && { storeId: this.activeStoreId }),
      };
      const data = await apiClient.post<ExportResponse>('merchant/analytics/export', requestBody);
      if (data.success && data.data) {
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to export analytics');
      }
    } catch (error) {
      if (__DEV__) console.error('Export analytics error:', error);
      throw new Error(error.message || 'Failed to export analytics');
    }
  }

  /**
   * Get export download URL (for previously generated exports)
   * @param exportId Export ID from ExportResponse
   * @returns Download URL
   */
  async getExportUrl(exportId: string): Promise<string> {
    try {
      const data = await apiClient.get<{ url: string }>(`merchant/analytics/export/${exportId}`);
      if (data.success && data.data?.url) {
        return data.data.url;
      } else {
        throw new Error(data.message || 'Failed to get export URL');
      }
    } catch (error) {
      if (__DEV__) console.error('Get export URL error:', error);
      throw new Error(error.message || 'Failed to get export URL');
    }
  }

  // ========== Helper Methods ==========

  /**
   * Build URL parameters from query options
   * @param options Query options
   * @returns URLSearchParams string
   */
  private buildQueryParams(options?: Record<string, unknown>): string {
    const params = new URLSearchParams();

    if (!options) {
      return '';
    }

    if (options.timeRange) {
      if (options.timeRange.startDate) {
        params.append('startDate', options.timeRange.startDate);
      }
      if (options.timeRange.endDate) {
        params.append('endDate', options.timeRange.endDate);
      }
      if (options.timeRange.preset) {
        params.append('preset', options.timeRange.preset);
      }
    }

    if (options.dateRangePreset) {
      params.append('preset', options.dateRangePreset);
    }

    if (options.granularity) {
      params.append('granularity', options.granularity);
    }

    if (options.limit) {
      params.append('limit', options.limit.toString());
    }

    if (options.offset) {
      params.append('offset', options.offset.toString());
    }

    if (options.sortBy) {
      params.append('sortBy', options.sortBy);
    }

    if (options.sortOrder) {
      params.append('sortOrder', options.sortOrder);
    }

    if (options.category) {
      params.append('category', options.category);
    }

    if (options.includeComparison !== undefined) {
      params.append('includeComparison', options.includeComparison.toString());
    }

    if (options.includeForecasts !== undefined) {
      params.append('includeForecasts', options.includeForecasts.toString());
    }

    return params.toString();
  }

  /**
   * Build DateRange from preset
   * @param preset Preset date range
   * @returns DateRange object
   */
  buildDateRangeFromPreset(preset: DateRangePreset): DateRange {
    const endDate = new Date();
    const startDate = new Date();

    switch (preset) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '14d':
        startDate.setDate(endDate.getDate() - 14);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      case 'custom':
        // Return current date as both start and end, caller should override
        break;
    }

    return {
      startDate: this.formatDate(startDate),
      endDate: this.formatDate(endDate),
    };
  }

  /**
   * Format date to YYYY-MM-DD string
   * @param date Date object
   * @returns Formatted date string
   */
  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Get current date in YYYY-MM-DD format
   * @returns Formatted current date
   */
  getTodayDate(): string {
    return this.formatDate(new Date());
  }

  /**
   * Get date N days ago in YYYY-MM-DD format
   * @param days Number of days ago
   * @returns Formatted date string
   */
  getDateNDaysAgo(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return this.formatDate(date);
  }

  /**
   * Parse ISO date string to Date object
   * @param dateString ISO date string (YYYY-MM-DD)
   * @returns Date object
   */
  parseDate(dateString: string): Date {
    return new Date(dateString);
  }

  /**
   * Calculate days between two dates
   * @param startDate Start date string (YYYY-MM-DD)
   * @param endDate End date string (YYYY-MM-DD)
   * @returns Number of days
   */
  getDaysDifference(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * Get previous period date range (same length as current period)
   * @param currentDateRange Current period
   * @returns Previous period date range
   */
  getPreviousPeriodDateRange(currentDateRange: DateRange): DateRange {
    const periodLength = this.getDaysDifference(
      currentDateRange.startDate,
      currentDateRange.endDate
    );

    const currentStart = new Date(currentDateRange.startDate);
    const prevStart = new Date(currentStart);
    prevStart.setDate(prevStart.getDate() - periodLength);

    const currentEnd = new Date(currentDateRange.endDate);
    const prevEnd = new Date(currentEnd);
    prevEnd.setDate(prevEnd.getDate() - periodLength);

    return {
      startDate: this.formatDate(prevStart),
      endDate: this.formatDate(prevEnd),
    };
  }

  /**
   * Format currency value
   * @param value Numeric value
   * @param currency Currency code (default: USD)
   * @returns Formatted currency string
   */
  formatCurrency(value: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(value);
  }

  /**
   * Format percentage
   * @param value Numeric value
   * @param decimalPlaces Number of decimal places (default: 2)
   * @returns Formatted percentage string
   */
  formatPercentage(value: number, decimalPlaces: number = 2): string {
    return `${(value * 100).toFixed(decimalPlaces)}%`;
  }

  /**
   * Format large numbers with K, M, B notation
   * @param value Numeric value
   * @returns Formatted string
   */
  formatCompactNumber(value: number): string {
    if (value >= 1000000000) {
      return `${(value / 1000000000).toFixed(1)}B`;
    } else if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  }

  /**
   * Get trend direction emoji
   * @param trend Trend direction
   * @returns Emoji string
   */
  getTrendEmoji(trend: 'up' | 'down' | 'stable'): string {
    switch (trend) {
      case 'up':
        return '📈';
      case 'down':
        return '📉';
      case 'stable':
        return '➡️';
      default:
        return '';
    }
  }

  /**
   * Get risk level color
   * @param riskLevel Risk level
   * @returns Color code
   */
  getRiskLevelColor(riskLevel: 'low' | 'medium' | 'high'): string {
    switch (riskLevel) {
      case 'low':
        return '#10b981'; // Green
      case 'medium':
        return '#f59e0b'; // Amber
      case 'high':
        return '#ef4444'; // Red
      default:
        return '#6b7280'; // Gray
    }
  }

  /**
   * Get health status color
   * @param health Health status
   * @returns Color code
   */
  getHealthStatusColor(health: 'excellent' | 'good' | 'fair' | 'poor'): string {
    switch (health) {
      case 'excellent':
        return '#059669'; // Dark Green
      case 'good':
        return '#10b981'; // Green
      case 'fair':
        return '#f59e0b'; // Amber
      case 'poor':
        return '#ef4444'; // Red
      default:
        return '#6b7280'; // Gray
    }
  }

  // ---------------------------------------------------------------------------
  // GAP FIX #5 — Store Performance Comparison
  // ---------------------------------------------------------------------------

  /**
   * Compare performance across ALL stores owned by the merchant.
   *
   * Calls GET /api/merchant/analytics/stores/compare
   *
   * @param options.period  – number of days to look back (default 30)
   * @param options.metric  – 'revenue' | 'orders' | 'avg_order_value' | 'customers'
   *
   * Returns an array of per-store metrics sorted by the chosen metric, plus
   * a totals row that aggregates across all stores.
   *
   * Example response shape:
   * {
   *   period: '30d',
   *   metric: 'revenue',
   *   stores: [
   *     { storeId, storeName, revenue, orderCount, avgOrderValue, newCustomers },
   *     ...
   *   ],
   *   totals: { revenue, orderCount, avgOrderValue, newCustomers }
   * }
   */
  async compareStores(options?: {
    period?: number;
    metric?: 'revenue' | 'orders' | 'avg_order_value' | 'customers';
  }): Promise<{
    period: string;
    metric: string;
    stores: Array<{
      storeId: string;
      storeName: string;
      revenue: number;
      orderCount: number;
      avgOrderValue: number;
      newCustomers: number;
    }>;
    totals: {
      revenue: number;
      orderCount: number;
      avgOrderValue: number;
      newCustomers: number;
    };
  }> {
    try {
      const params = new URLSearchParams();
      if (options?.period) params.set('period', String(options.period));
      if (options?.metric) params.set('metric', options.metric);

      const url = `merchant/analytics/stores/compare${params.toString() ? `?${params}` : ''}`;
      const json = await apiClient.get<unknown>(url);
      if (!json.success || !json.data) {
        throw new Error(json.message || 'Failed to compare stores');
      }
      return json.data;
    } catch (error) {
      if (__DEV__) console.error('compareStores error:', error);
      throw new Error(error.message || 'Failed to compare stores');
    }
  }

  // ---------------------------------------------------------------------------
  // Demand Forecasting & Dynamic Pricing
  // ---------------------------------------------------------------------------

  /**
   * Get demand forecast with predictions for the specified horizon
   * @param horizon 7 | 14 | 30 days (default 7)
   * @param historicalDays Number of historical days to analyze (default 90)
   * @returns ForecastResult with predictions, patterns, and signals
   */
  async getDemandForecast(horizon: 7 | 14 | 30 = 7, historicalDays: number = 90): Promise<unknown> {
    try {
      const params = new URLSearchParams();
      params.append('horizon', horizon.toString());
      params.append('historicalDays', historicalDays.toString());
      if (this.activeStoreId) params.append('storeId', this.activeStoreId);

      const data = await apiClient.get(`merchant/analytics/forecast?${params}`);
      if (data.success && data.data) {
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to get demand forecast');
      }
    } catch (error) {
      if (__DEV__) console.error('getDemandForecast error:', error);
      throw new Error(error.message || 'Failed to get demand forecast');
    }
  }

  /**
   * Get forecast summary for dashboard
   * @returns Quick summary metrics for next 7 days
   */
  async getForecastSummary(): Promise<unknown> {
    try {
      const storeParam = this.activeStoreId ? `?storeId=${this.activeStoreId}` : '';
      const data = await apiClient.get(`merchant/analytics/forecast/summary${storeParam}`);
      if (data.success && data.data) {
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to get forecast summary');
      }
    } catch (error) {
      if (__DEV__) console.error('getForecastSummary error:', error);
      throw new Error(error.message || 'Failed to get forecast summary');
    }
  }

  /**
   * Get demand signals and alerts
   * @param horizon 7 | 14 | 30 days (default 7)
   * @returns Demand signals with severity and recommendations
   */
  async getDemandSignals(horizon: 7 | 14 | 30 = 7): Promise<unknown> {
    try {
      const params = new URLSearchParams();
      params.append('horizon', horizon.toString());
      if (this.activeStoreId) params.append('storeId', this.activeStoreId);

      const data = await apiClient.get(`merchant/analytics/forecast/signals?${params}`);
      if (data.success && data.data) {
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to get demand signals');
      }
    } catch (error) {
      if (__DEV__) console.error('getDemandSignals error:', error);
      throw new Error(error.message || 'Failed to get demand signals');
    }
  }

  /**
   * Get historical demand analysis for a period
   * @param startDate ISO date string
   * @param endDate ISO date string
   * @returns Historical demand data with patterns
   */
  async getHistoricalDemand(startDate: string, endDate: string): Promise<unknown> {
    try {
      const params = new URLSearchParams();
      params.append('startDate', startDate);
      params.append('endDate', endDate);
      if (this.activeStoreId) params.append('storeId', this.activeStoreId);

      const data = await apiClient.get(`merchant/analytics/forecast/historical?${params}`);
      if (data.success && data.data) {
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to get historical demand');
      }
    } catch (error) {
      if (__DEV__) console.error('getHistoricalDemand error:', error);
      throw new Error(error.message || 'Failed to get historical demand');
    }
  }

  /**
   * Get dynamic pricing recommendations
   * @param horizon 7 | 14 | 30 days (default 7)
   * @returns Pricing recommendations for products
   */
  async getPricingRecommendations(horizon: 7 | 14 | 30 = 7): Promise<unknown> {
    try {
      const params = new URLSearchParams();
      params.append('horizon', horizon.toString());
      if (this.activeStoreId) params.append('storeId', this.activeStoreId);

      const data = await apiClient.get(`merchant/pricing/recommendations?${params}`);
      if (data.success && data.data) {
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to get pricing recommendations');
      }
    } catch (error) {
      if (__DEV__) console.error('getPricingRecommendations error:', error);
      throw new Error(error.message || 'Failed to get pricing recommendations');
    }
  }

  /**
   * Get pricing recommendations summary for dashboard
   * @returns Quick summary of pricing changes
   */
  async getPricingSummary(): Promise<unknown> {
    try {
      const storeParam = this.activeStoreId ? `?storeId=${this.activeStoreId}` : '';
      const data = await apiClient.get(`merchant/pricing/recommendations/summary${storeParam}`);
      if (data.success && data.data) {
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to get pricing summary');
      }
    } catch (error) {
      if (__DEV__) console.error('getPricingSummary error:', error);
      throw new Error(error.message || 'Failed to get pricing summary');
    }
  }

  /**
   * Get real-time pricing for a specific product
   * @param productId Product ID
   * @returns Current and suggested price with factors
   */
  async getProductPricing(productId: string): Promise<unknown> {
    try {
      const storeParam = this.activeStoreId ? `?storeId=${this.activeStoreId}` : '';
      const data = await apiClient.get(`merchant/pricing/product/${productId}${storeParam}`);
      if (data.success && data.data) {
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to get product pricing');
      }
    } catch (error) {
      if (__DEV__) console.error('getProductPricing error:', error);
      throw new Error(error.message || 'Failed to get product pricing');
    }
  }
}

// Create and export singleton instance
export const analyticsService = new AnalyticsService();
export default analyticsService;
