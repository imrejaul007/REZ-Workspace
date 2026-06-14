/**
 * Dashboard Service - Analytics and statistics
 */

import { guestService } from './GuestService';
import { serviceRequestService } from './ServiceRequestService';
import { bookingService } from './BookingService';
import { logger } from '../config/logger';
import { DashboardStats } from '../types';

export class DashboardService {
  /**
   * Get dashboard statistics
   */
  async getStats(): Promise<DashboardStats> {
    try {
      const now = new Date();
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Get counts in parallel
      const [activeGuests, pendingRequests, requestsByType, todayCheckOuts] = await Promise.all([
        guestService.getActiveGuestsCount(),
        serviceRequestService.getPendingRequestsCount(),
        serviceRequestService.getRequestsByType(),
        guestService.getTodayCheckOuts(),
      ]);

      // Calculate occupancy rate (assuming 50 rooms total)
      const totalRooms = 50;
      const occupancyRate = `${Math.round((activeGuests / totalRooms) * 100)}%`;

      logger.info('Dashboard stats fetched', {
        activeGuests,
        pendingRequests,
        todayCheckOuts: todayCheckOuts.length,
        occupancyRate,
      });

      return {
        activeGuests,
        pendingRequests,
        todayCheckOuts: todayCheckOuts.length,
        occupancyRate,
        requestsByType,
      };
    } catch (error) {
      logger.error('Failed to get dashboard stats', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Get service request statistics
   */
  async getServiceRequestStats(): Promise<{
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    byType: Record<string, number>;
  }> {
    try {
      const pending = await serviceRequestService.getPendingRequestsCount();
      const byType = await serviceRequestService.getRequestsByType();

      // Get total and in-progress counts
      const allRequests = await serviceRequestService.getActiveRequests();
      const inProgress = allRequests.filter((r) => r.status === 'in_progress').length;
      const completed = byType ? Object.values(byType).reduce((a, b) => a + b, 0) - pending - inProgress : 0;

      return {
        total: pending + inProgress + Math.max(0, completed),
        pending,
        inProgress,
        completed: Math.max(0, completed),
        byType,
      };
    } catch (error) {
      logger.error('Failed to get service request stats', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Get booking statistics
   */
  async getBookingStats(): Promise<{
    todayCheckIns: number;
    todayCheckOuts: number;
    upcoming: number;
    current: number;
  }> {
    try {
      const today = new Date();
      const now = new Date();

      const [todayCheckIns, todayCheckOuts, upcoming, current] = await Promise.all([
        bookingService.getBookingsForDate(today),
        guestService.getTodayCheckOuts(),
        bookingService.getUpcomingBookings(5),
        bookingService.getCurrentBookings(),
      ]);

      return {
        todayCheckIns: todayCheckIns.length,
        todayCheckOuts: todayCheckOuts.length,
        upcoming: upcoming.length,
        current: current.length,
      };
    } catch (error) {
      logger.error('Failed to get booking stats', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Get real-time activity feed
   */
  async getRecentActivity(limit = 20): Promise<{
    recentRequests: Array<{ type: string; roomNumber: string; createdAt: Date }>;
    recentBookings: Array<{ checkIn: Date; checkOut: Date; status: string }>;
  }> {
    try {
      const activeRequests = await serviceRequestService.getActiveRequests();
      const currentBookings = await bookingService.getCurrentBookings();

      return {
        recentRequests: activeRequests.slice(0, limit).map((r) => ({
          type: r.type,
          roomNumber: r.roomNumber,
          createdAt: r.createdAt,
        })),
        recentBookings: currentBookings.slice(0, limit).map((b) => ({
          checkIn: b.checkIn,
          checkOut: b.checkOut,
          status: b.status,
        })),
      };
    } catch (error) {
      logger.error('Failed to get recent activity', { error: (error as Error).message });
      throw error;
    }
  }
}

export const dashboardService = new DashboardService();
export default dashboardService;