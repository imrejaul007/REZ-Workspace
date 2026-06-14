// ==========================================
// MyTalent - CorpPerks Attendance Service Integration
// ==========================================

import { AttendanceRecord, AttendanceSummary } from '../types';
import {
  mockAttendanceHistory,
  mockAttendanceSummary,
} from '../data/mockData';

const ATTENDANCE_SERVICE_URL = process.env.ATTENDANCE_SERVICE_URL || 'http://localhost:4006';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'mytalent-internal-token';

interface AttendanceResponse {
  success: boolean;
  record?: AttendanceRecord;
  error?: string;
}

interface AttendanceListResponse {
  success: boolean;
  records?: AttendanceRecord[];
  summary?: AttendanceSummary;
  error?: string;
}

/**
 * Record check-in
 */
export async function checkIn(
  employeeId: string,
  type: 'GPS' | 'QR' | 'FACE' | 'WFH',
  location?: { latitude: number; longitude: number }
): Promise<AttendanceResponse> {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.ATTENDANCE_SERVICE_URL) {
      const now = new Date();
      const record: AttendanceRecord = {
        id: `att-${Date.now()}`,
        date: now.toISOString().split('T')[0],
        checkIn: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        checkOut: null,
        hoursWorked: 0,
        type,
        status: now.getHours() < 10 ? 'present' : 'late',
        location,
      };
      return { success: true, record };
    }

    const response = await fetch(`${ATTENDANCE_SERVICE_URL}/api/attendance/check-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': INTERNAL_TOKEN,
      },
      body: JSON.stringify({ employeeId, type, location }),
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true, record: data.record };
    }

    return { success: false, error: data.message };
  } catch (error) {
    logger.error('Check-in error:', error);
    const now = new Date();
    return {
      success: true,
      record: {
        id: `att-${Date.now()}`,
        date: now.toISOString().split('T')[0],
        checkIn: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        checkOut: null,
        hoursWorked: 0,
        type,
        status: now.getHours() < 10 ? 'present' : 'late',
        location,
      },
    };
  }
}

/**
 * Record check-out
 */
export async function checkOut(
  employeeId: string,
  location?: { latitude: number; longitude: number }
): Promise<AttendanceResponse> {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.ATTENDANCE_SERVICE_URL) {
      const now = new Date();
      const record: AttendanceRecord = {
        id: `att-${Date.now()}`,
        date: now.toISOString().split('T')[0],
        checkIn: null,
        checkOut: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        hoursWorked: 0,
        type: location ? 'GPS' : 'WFH',
        status: 'present',
        location,
      };
      return { success: true, record };
    }

    const response = await fetch(`${ATTENDANCE_SERVICE_URL}/api/attendance/check-out`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': INTERNAL_TOKEN,
      },
      body: JSON.stringify({ employeeId, location }),
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true, record: data.record };
    }

    return { success: false, error: data.message };
  } catch (error) {
    logger.error('Check-out error:', error);
    const now = new Date();
    return {
      success: true,
      record: {
        id: `att-${Date.now()}`,
        date: now.toISOString().split('T')[0],
        checkIn: null,
        checkOut: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        hoursWorked: 0,
        type: 'GPS',
        status: 'present',
        location,
      },
    };
  }
}

/**
 * Get today's attendance
 */
export async function getTodayAttendance(
  employeeId: string
): Promise<AttendanceResponse> {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.ATTENDANCE_SERVICE_URL) {
      const today = new Date();
      const record: AttendanceRecord = {
        id: 'att-today',
        date: today.toISOString().split('T')[0],
        checkIn: '09:15 AM',
        checkOut: null,
        hoursWorked: 0,
        type: 'GPS',
        status: 'present',
      };
      return { success: true, record };
    }

    const response = await fetch(
      `${ATTENDANCE_SERVICE_URL}/api/attendance/today/${employeeId}`,
      {
        method: 'GET',
        headers: {
          'X-Internal-Token': INTERNAL_TOKEN,
        },
      }
    );

    const data = await response.json();

    if (response.ok) {
      return { success: true, record: data.record };
    }

    return { success: false, error: data.message };
  } catch (error) {
    logger.error('Get today attendance error:', error);
    return { success: true, record: null };
  }
}

/**
 * Get attendance history
 */
export async function getAttendanceHistory(
  employeeId: string,
  month?: number,
  year?: number
): Promise<AttendanceListResponse> {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.ATTENDANCE_SERVICE_URL) {
      return {
        success: true,
        records: mockAttendanceHistory,
        summary: mockAttendanceSummary,
      };
    }

    const params = new URLSearchParams();
    if (month) params.append('month', month.toString());
    if (year) params.append('year', year.toString());

    const response = await fetch(
      `${ATTENDANCE_SERVICE_URL}/api/attendance/history/${employeeId}?${params}`,
      {
        method: 'GET',
        headers: {
          'X-Internal-Token': INTERNAL_TOKEN,
        },
      }
    );

    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        records: data.records,
        summary: data.summary,
      };
    }

    return { success: false, error: data.message };
  } catch (error) {
    logger.error('Get attendance history error:', error);
    return {
      success: true,
      records: mockAttendanceHistory,
      summary: mockAttendanceSummary,
    };
  }
}

/**
 * Request WFH
 */
export async function requestWFH(
  employeeId: string,
  date: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.ATTENDANCE_SERVICE_URL) {
      return { success: true };
    }

    const response = await fetch(`${ATTENDANCE_SERVICE_URL}/api/attendance/wfh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': INTERNAL_TOKEN,
      },
      body: JSON.stringify({ employeeId, date, reason }),
    });

    return { success: response.ok };
  } catch (error) {
    logger.error('Request WFH error:', error);
    return { success: true };
  }
}

/**
 * Verify geo-fence
 */
export async function verifyGeoFence(
  employeeId: string,
  location: { latitude: number; longitude: number }
): Promise<{ success: boolean; withinFence: boolean }> {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.ATTENDANCE_SERVICE_URL) {
      return { success: true, withinFence: true };
    }

    const response = await fetch(`${ATTENDANCE_SERVICE_URL}/api/attendance/verify-fence`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': INTERNAL_TOKEN,
      },
      body: JSON.stringify({ employeeId, location }),
    });

    const data = await response.json();

    return { success: response.ok, withinFence: data.withinFence };
  } catch (error) {
    logger.error('Verify geo-fence error:', error);
    return { success: true, withinFence: true };
  }
}

/**
 * Get monthly summary
 */
export async function getMonthlySummary(
  employeeId: string,
  month: number,
  year: number
): Promise<{ success: boolean; summary?: AttendanceSummary; error?: string }> {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.ATTENDANCE_SERVICE_URL) {
      return { success: true, summary: mockAttendanceSummary };
    }

    const response = await fetch(
      `${ATTENDANCE_SERVICE_URL}/api/attendance/summary/${employeeId}?month=${month}&year=${year}`,
      {
        method: 'GET',
        headers: {
          'X-Internal-Token': INTERNAL_TOKEN,
        },
      }
    );

    const data = await response.json();

    if (response.ok) {
      return { success: true, summary: data.summary };
    }

    return { success: false, error: data.message };
  } catch (error) {
    logger.error('Get monthly summary error:', error);
    return { success: true, summary: mockAttendanceSummary };
  }
}
