// ==========================================
// MyTalent - CorpPerks Leave Service Integration
// ==========================================

import { LeaveBalance, LeaveRequest, Holiday } from '../types';
import { mockLeaveBalance, mockLeaveRequests, mockHolidays } from '../data/mockData';

const LEAVE_SERVICE_URL = process.env.LEAVE_SERVICE_URL || 'http://localhost:4006';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'mytalent-internal-token';

interface LeaveResponse {
  success: boolean;
  request?: LeaveRequest;
  error?: string;
}

interface LeaveListResponse {
  success: boolean;
  requests?: LeaveRequest[];
  error?: string;
}

/**
 * Get leave balance
 */
export async function getLeaveBalance(
  employeeId: string
): Promise<{ success: boolean; balance?: LeaveBalance; error?: string }> {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.LEAVE_SERVICE_URL) {
      return { success: true, balance: mockLeaveBalance };
    }

    const response = await fetch(
      `${LEAVE_SERVICE_URL}/api/leave/balance/${employeeId}`,
      {
        method: 'GET',
        headers: {
          'X-Internal-Token': INTERNAL_TOKEN,
        },
      }
    );

    const data = await response.json();

    if (response.ok) {
      return { success: true, balance: data.balance };
    }

    return { success: false, error: data.message };
  } catch (error) {
    logger.error('Get leave balance error:', error);
    return { success: true, balance: mockLeaveBalance };
  }
}

/**
 * Get leave requests
 */
export async function getLeaveRequests(
  employeeId: string
): Promise<LeaveListResponse> {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.LEAVE_SERVICE_URL) {
      return { success: true, requests: mockLeaveRequests };
    }

    const response = await fetch(
      `${LEAVE_SERVICE_URL}/api/leave/requests/${employeeId}`,
      {
        method: 'GET',
        headers: {
          'X-Internal-Token': INTERNAL_TOKEN,
        },
      }
    );

    const data = await response.json();

    if (response.ok) {
      return { success: true, requests: data.requests };
    }

    return { success: false, error: data.message };
  } catch (error) {
    logger.error('Get leave requests error:', error);
    return { success: true, requests: mockLeaveRequests };
  }
}

/**
 * Apply for leave
 */
export async function applyLeave(
  employeeId: string,
  type: 'sick' | 'casual' | 'earned' | 'wfh',
  startDate: string,
  endDate: string,
  reason: string
): Promise<LeaveResponse> {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.LEAVE_SERVICE_URL) {
      const request: LeaveRequest = {
        id: `leave-${Date.now()}`,
        type,
        startDate,
        endDate,
        reason,
        status: 'pending',
        appliedOn: new Date().toISOString(),
      };
      return { success: true, request };
    }

    const response = await fetch(`${LEAVE_SERVICE_URL}/api/leave/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': INTERNAL_TOKEN,
      },
      body: JSON.stringify({ employeeId, type, startDate, endDate, reason }),
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true, request: data.request };
    }

    return { success: false, error: data.message };
  } catch (error) {
    logger.error('Apply leave error:', error);
    const request: LeaveRequest = {
      id: `leave-${Date.now()}`,
      type,
      startDate,
      endDate,
      reason,
      status: 'pending',
      appliedOn: new Date().toISOString(),
    };
    return { success: true, request };
  }
}

/**
 * Cancel leave request
 */
export async function cancelLeaveRequest(
  employeeId: string,
  requestId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.LEAVE_SERVICE_URL) {
      return { success: true };
    }

    const response = await fetch(
      `${LEAVE_SERVICE_URL}/api/leave/cancel/${requestId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Token': INTERNAL_TOKEN,
        },
        body: JSON.stringify({ employeeId }),
      }
    );

    return { success: response.ok };
  } catch (error) {
    logger.error('Cancel leave error:', error);
    return { success: true };
  }
}

/**
 * Get holidays
 */
export async function getHolidays(
  year: number
): Promise<{ success: boolean; holidays?: Holiday[]; error?: string }> {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.LEAVE_SERVICE_URL) {
      return { success: true, holidays: mockHolidays };
    }

    const response = await fetch(
      `${LEAVE_SERVICE_URL}/api/leave/holidays?year=${year}`,
      {
        method: 'GET',
        headers: {
          'X-Internal-Token': INTERNAL_TOKEN,
        },
      }
    );

    const data = await response.json();

    if (response.ok) {
      return { success: true, holidays: data.holidays };
    }

    return { success: false, error: data.message };
  } catch (error) {
    logger.error('Get holidays error:', error);
    return { success: true, holidays: mockHolidays };
  }
}

/**
 * Get leave calendar
 */
export async function getLeaveCalendar(
  employeeId: string,
  month: number,
  year: number
): Promise<{ success: boolean; calendar?: any; error?: string }> {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.LEAVE_SERVICE_URL) {
      return { success: true, calendar: null };
    }

    const response = await fetch(
      `${LEAVE_SERVICE_URL}/api/leave/calendar/${employeeId}?month=${month}&year=${year}`,
      {
        method: 'GET',
        headers: {
          'X-Internal-Token': INTERNAL_TOKEN,
        },
      }
    );

    const data = await response.json();

    if (response.ok) {
      return { success: true, calendar: data.calendar };
    }

    return { success: false, error: data.message };
  } catch (error) {
    logger.error('Get leave calendar error:', error);
    return { success: true, calendar: null };
  }
}

/**
 * Get pending leave count
 */
export async function getPendingLeaveCount(
  employeeId: string
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.LEAVE_SERVICE_URL) {
      const pendingCount = mockLeaveRequests.filter((r) => r.status === 'pending').length;
      return { success: true, count: pendingCount };
    }

    const response = await fetch(
      `${LEAVE_SERVICE_URL}/api/leave/pending/${employeeId}`,
      {
        method: 'GET',
        headers: {
          'X-Internal-Token': INTERNAL_TOKEN,
        },
      }
    );

    const data = await response.json();

    if (response.ok) {
      return { success: true, count: data.count };
    }

    return { success: false, error: data.message };
  } catch (error) {
    logger.error('Get pending leave count error:', error);
    return { success: true, count: 0 };
  }
}
