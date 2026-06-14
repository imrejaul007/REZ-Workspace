/**
 * Occupancy Service
 */

export class OccupancyService {
  /**
   * Get occupancy data
   */
  async getOccupancyData(
    hotelId: string,
    startDate?: string,
    endDate?: string
  ): Promise<any> {
    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const dailyOccupancy = [];
    const currentDate = new Date(start);

    while (currentDate <= end) {
      dailyOccupancy.push({
        date: currentDate.toISOString().split('T')[0],
        occupancyRate: Math.round((65 + Math.random() * 25) * 10) / 10,
        availableRooms: Math.floor(30 + Math.random() * 20),
        occupiedRooms: Math.floor(35 + Math.random() * 30),
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const avgOccupancy =
      dailyOccupancy.reduce((sum, d) => sum + d.occupancyRate, 0) / dailyOccupancy.length;

    return {
      hotelId,
      period: { start: start.toISOString(), end: end.toISOString() },
      dailyOccupancy,
      summary: {
        avgOccupancy: Math.round(avgOccupancy * 10) / 10,
        maxOccupancy: Math.max(...dailyOccupancy.map((d) => d.occupancyRate)),
        minOccupancy: Math.min(...dailyOccupancy.map((d) => d.occupancyRate)),
        totalDays: dailyOccupancy.length,
      },
    };
  }

  /**
   * Get occupancy trend
   */
  async getOccupancyTrend(hotelId: string, days: number = 30): Promise<any[]> {
    const trend = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      trend.push({
        date: date.toISOString().split('T')[0],
        occupancyRate: Math.round((65 + Math.random() * 25) * 10) / 10,
        weekday: date.getDay(),
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
      });
    }

    return trend;
  }

  /**
   * Get occupancy forecast
   */
  async getOccupancyForecast(hotelId: string, days: number = 14): Promise<any[]> {
    const forecast = [];
    const today = new Date();

    for (let i = 1; i <= days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);

      const baseOccupancy = 65 + Math.random() * 25;
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const expectedOccupancy = isWeekend ? baseOccupancy + 10 : baseOccupancy;

      forecast.push({
        date: date.toISOString().split('T')[0],
        expectedOccupancy: Math.round(expectedOccupancy * 10) / 10,
        confidence: 0.7 + Math.random() * 0.2,
        recommendation:
          expectedOccupancy > 85
            ? 'High demand - Consider rate increase'
            : expectedOccupancy < 60
            ? 'Low demand - Consider promotions'
            : 'Normal demand',
      });
    }

    return forecast;
  }
}

export const occupancyService = new OccupancyService();
