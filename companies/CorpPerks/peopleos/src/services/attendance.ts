/**
 * Attendance Service for PeopleOS
 * GPS, QR code, WhatsApp attendance
 */

export interface AttendanceRecord {
  employeeId: string;
  timestamp: string;
  type: 'clock_in' | 'clock_out';
  location?: { lat: number; lng: number };
  merchantId: string;
}

export interface AttendanceResponse {
  success: boolean;
  attendance?: AttendanceRecord;
  error?: string;
}

const ATTENDANCE_API = process.env.ATTENDANCE_URL || 'http://localhost:4022';

// Request timeout in milliseconds
const REQUEST_TIMEOUT = 10000;

// ─── Utility: Fetch with Timeout ─────────────────────────────────────────────────

async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return response;
  } catch (error) {
    clearTimeout(timeout);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${REQUEST_TIMEOUT}ms for ${url}`);
    }
    throw error;
  }
}

export async function clockIn(data: {
  employeeId: string;
  merchantId: string;
  location?: { lat: number; lng: number };
}): Promise<AttendanceResponse> {
  try {
    const response = await fetchWithTimeout(`${ATTENDANCE_API}/attendance/clock-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (!response.ok) {
      logger.error(`[Attendance] clockIn failed: HTTP ${response.status}`);
      return { success: false, error: result.error || `HTTP ${response.status}` };
    }
    return { success: result.success, attendance: result.data };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Attendance] clockIn failed:', message);
    return { success: false, error: message };
  }
}

export async function clockOut(data: {
  employeeId: string;
  merchantId: string;
  location?: { lat: number; lng: number };
}): Promise<AttendanceResponse> {
  try {
    const response = await fetchWithTimeout(`${ATTENDANCE_API}/attendance/clock-out`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (!response.ok) {
      logger.error(`[Attendance] clockOut failed: HTTP ${response.status}`);
      return { success: false, error: result.error || `HTTP ${response.status}` };
    }
    return { success: result.success, attendance: result.data };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Attendance] clockOut failed:', message);
    return { success: false, error: message };
  }
}

export async function getAttendanceHistory(employeeId: string): Promise<AttendanceRecord[]> {
  try {
    const response = await fetchWithTimeout(`${ATTENDANCE_API}/attendance/${employeeId}/history`);
    if (!response.ok) {
      logger.error(`[Attendance] getAttendanceHistory failed: HTTP ${response.status}`);
      return [];
    }
    const data = await response.json();
    return data.records || [];
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Attendance] getAttendanceHistory failed:', message);
    return [];
  }
}
