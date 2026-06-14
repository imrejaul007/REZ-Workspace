/**
 * Restaurant Export Service
 * Extends ExportService with restaurant-specific reporting
 */

import { ExportService } from '@rez/base-services/export';

interface KitchenPerformanceMetrics {
  date: Date;
  totalOrders: number;
  averagePrepTime: number;
  averageCookTime: number;
  onTimeCompletionRate: number;
  stationPerformance: Array<{
    station: string;
    ordersProcessed: number;
    averageTime: number;
    utilizationPercentage: number;
  }>;
  peakHoursAnalysis: Array<{
    hour: number;
    orderCount: number;
    averageWaitTime: number;
  }>;
  wasteMetrics: {
    totalWasteCost: number;
    topWastedItems: Array<{
      itemName: string;
      quantity: number;
      cost: number;
    }>;
  };
}

interface TableTurnoverReport {
  restaurantId: string;
  date: Date;
  totalTables: number;
  totalCovers: number;
  averageTurnsPerTable: number;
  averageTurnDuration: number;
  peakTurnoverHours: Array<{
    hour: number;
    turns: number;
    averageDuration: number;
  }>;
  tableAnalysis: Array<{
    tableId: string;
    tableNumber: number;
    capacity: number;
    totalTurns: number;
    averageDuration: number;
    revenue: number;
    utilizationPercentage: number;
  }>;
  revenueMetrics: {
    totalRevenue: number;
    averageRevenuePerCover: number;
    averageRevenuePerTable: number;
    revenuePerAvailableSeatHour: number;
  };
}

export class RestaurantExportService extends ExportService {
  /**
   * Get kitchen performance metrics for a specific date
   */
  async getKitchenPerformance(date: Date): Promise<KitchenPerformanceMetrics> {
    const orders = await this.getOrdersForDate(date);
    const stationData = await this.getStationPerformance(date);
    const peakHours = await this.getPeakHoursAnalysis(date);
    const wasteData = await this.getWasteMetrics(date);

    // Calculate aggregate metrics
    const completedOrders = orders.filter((o) => o.status === 'completed');
    const onTimeOrders = completedOrders.filter((o) => {
      const estimatedTime = this.calculateEstimatedPrepTime(o.items);
      const actualTime = o.completedAt.getTime() - o.startedAt.getTime();
      return actualTime <= estimatedTime * 1.2; // 20% buffer
    });

    const allPrepTimes = completedOrders.flatMap((o) =>
      o.items.map((item) => item.prepTime || 0)
    );
    const allCookTimes = completedOrders.flatMap((o) =>
      o.items.map((item) => item.cookTime || 0)
    );

    return {
      date,
      totalOrders: completedOrders.length,
      averagePrepTime: this.calculateAverage(allPrepTimes),
      averageCookTime: this.calculateAverage(allCookTimes),
      onTimeCompletionRate:
        completedOrders.length > 0
          ? onTimeOrders.length / completedOrders.length
          : 0,
      stationPerformance: stationData,
      peakHoursAnalysis: peakHours,
      wasteMetrics: wasteData,
    };
  }

  /**
   * Get table turnover report for a restaurant
   */
  async getTableTurnoverReport(restaurantId: string): Promise<TableTurnoverReport> {
    const reservations = await this.getReservations(restaurantId);
    const tableData = await this.getTableAnalytics(restaurantId);
    const revenueData = await this.getRevenueMetrics(restaurantId);

    // Calculate turnover metrics
    const tableAnalysis = tableData.map((table) => {
      const tableReservations = reservations.filter(
        (r) => r.tableId === table.id
      );
      const totalDuration = tableReservations.reduce(
        (sum, r) => sum + r.duration,
        0
      );

      return {
        tableId: table.id,
        tableNumber: table.number,
        capacity: table.capacity,
        totalTurns: tableReservations.length,
        averageDuration:
          tableReservations.length > 0
            ? totalDuration / tableReservations.length
            : 0,
        revenue: table.revenue,
        utilizationPercentage: this.calculateUtilization(
          table.capacity,
          tableReservations.length,
          table.operatingHours
        ),
      };
    });

    // Calculate hourly turnover
    const hourlyTurnover = this.calculateHourlyTurnover(reservations);

    const totalCovers = reservations.reduce(
      (sum, r) => sum + r.partySize,
      0
    );
    const totalTurns = reservations.length;
    const totalTables = tableData.length;

    return {
      restaurantId,
      date: new Date(),
      totalTables,
      totalCovers,
      averageTurnsPerTable: totalTables > 0 ? totalTurns / totalTables : 0,
      averageTurnDuration: this.calculateAverage(
        reservations.map((r) => r.duration)
      ),
      peakTurnoverHours: hourlyTurnover,
      tableAnalysis,
      revenueMetrics: revenueData,
    };
  }

  // Protected methods to be implemented with actual storage
  protected async getOrdersForDate(date: Date): Promise<Array<{
    id: string;
    status: string;
    startedAt: Date;
    completedAt: Date;
    items: Array<{
      dishId: string;
      prepTime: number;
      cookTime: number;
    }>;
  }>> {
    // TODO: Implement with actual database call
    return [];
  }

  protected async getStationPerformance(date: Date): Promise<KitchenPerformanceMetrics['stationPerformance']> {
    // TODO: Implement with actual kitchen monitoring system
    return [];
  }

  protected async getPeakHoursAnalysis(date: Date): Promise<KitchenPerformanceMetrics['peakHoursAnalysis']> {
    // TODO: Implement with actual order tracking
    return [];
  }

  protected async getWasteMetrics(date: Date): Promise<KitchenPerformanceMetrics['wasteMetrics']> {
    // TODO: Implement with actual inventory/waste tracking
    return {
      totalWasteCost: 0,
      topWastedItems: [],
    };
  }

  protected async getReservations(restaurantId: string): Promise<Array<{
    id: string;
    tableId: string;
    partySize: number;
    startTime: Date;
    endTime: Date;
    duration: number;
  }>> {
    // TODO: Implement with actual reservation system
    return [];
  }

  protected async getTableAnalytics(restaurantId: string): Promise<Array<{
    id: string;
    number: number;
    capacity: number;
    revenue: number;
    operatingHours: number;
  }>> {
    // TODO: Implement with actual table management system
    return [];
  }

  protected async getRevenueMetrics(restaurantId: string): Promise<TableTurnoverReport['revenueMetrics']> {
    // TODO: Implement with actual POS/revenue system
    return {
      totalRevenue: 0,
      averageRevenuePerCover: 0,
      averageRevenuePerTable: 0,
      revenuePerAvailableSeatHour: 0,
    };
  }

  // Helper methods
  protected calculateEstimatedPrepTime(items: Array<{ prepTime: number; cookTime: number }>): number {
    // Simple sum - could be improved with parallel prep calculation
    return items.reduce((sum, item) => sum + item.prepTime + item.cookTime, 0);
  }

  protected calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  protected calculateUtilization(
    capacity: number,
    turns: number,
    operatingHours: number
  ): number {
    if (operatingHours === 0) return 0;
    const maxCovers = turns * capacity;
    const possibleCovers = operatingHours * capacity;
    return possibleCovers > 0 ? (maxCovers / possibleCovers) * 100 : 0;
  }

  protected calculateHourlyTurnover(
    reservations: Array<{
      startTime: Date;
      duration: number;
    }>
  ): TableTurnoverReport['peakTurnoverHours'] {
    const hourlyData = new Map<number, { turns: number; totalDuration: number }>();

    for (const reservation of reservations) {
      const hour = reservation.startTime.getHours();
      const existing = hourlyData.get(hour) || { turns: 0, totalDuration: 0 };
      existing.turns += 1;
      existing.totalDuration += reservation.duration;
      hourlyData.set(hour, existing);
    }

    const result: TableTurnoverReport['peakTurnoverHours'] = [];
    hourlyData.forEach((data, hour) => {
      result.push({
        hour,
        turns: data.turns,
        averageDuration: data.turns > 0 ? data.totalDuration / data.turns : 0,
      });
    });

    return result.sort((a, b) => b.turns - a.turns);
  }
}

export default RestaurantExportService;
