/**
 * QR Code Generation Service
 * Generates unique QR codes for employees
 */

const QR_API = process.env.QR_API_URL || 'https://api.qrserver.com/v1/create-qr-code/';

export interface EmployeeQR {
  employeeId: string;
  qrCode: string;
  qrImageUrl: string;
  uniqueToken: string;
  createdAt: string;
  expiresAt: string;
}

// Generate unique QR code for employee
export function generateEmployeeQR(
  employeeId: string,
  employeeName: string,
  locationId?: string
): EmployeeQR {
  const uniqueToken = generateToken();
  const qrData = JSON.stringify({
    type: 'PEOPLEOS_ATTENDANCE',
    employeeId,
    name: employeeName,
    token: uniqueToken,
    locationId: locationId || 'OFFICE',
    timestamp: Date.now(),
  });

  // URL-safe base64 encoding
  const encodedData = Buffer.from(qrData).toString('base64url');

  // Generate QR code image URL
  const qrImageUrl = `${QR_API}?size=300x300&data=${encodeURIComponent(encodedData)}`;

  return {
    employeeId,
    qrCode: encodedData,
    qrImageUrl,
    uniqueToken,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
  };
}

// Generate random token
function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Verify QR code
export function verifyQRCode(qrData: string): {
  valid: boolean;
  employeeId?: string;
  locationId?: string;
  error?: string;
} {
  try {
    const decoded = Buffer.from(qrData, 'base64url').toString('utf-8');
    const data = JSON.parse(decoded);

    if (data.type !== 'PEOPLEOS_ATTENDANCE') {
      return { valid: false, error: 'Invalid QR code type' };
    }

    if (!data.employeeId || !data.token) {
      return { valid: false, error: 'Missing required fields' };
    }

    return {
      valid: true,
      employeeId: data.employeeId,
      locationId: data.locationId,
    };
  } catch (error) {
    return { valid: false, error: 'Invalid QR code format' };
  }
}

// Generate QR codes for bulk employees
export function generateBulkQRCodes(employees: { id: string; name: string }[]): EmployeeQR[] {
  return employees.map((emp) => generateEmployeeQR(emp.id, emp.name));
}

// QR Code Types
export interface LocationQR {
  locationId: string;
  locationName: string;
  qrCode: string;
  qrImageUrl: string;
}

// Generate QR code for a location (for HR to print)
export function generateLocationQR(
  locationId: string,
  locationName: string,
  lat: number,
  lng: number,
  radius: number
): LocationQR {
  const qrData = JSON.stringify({
    type: 'PEOPLEOS_LOCATION',
    locationId,
    name: locationName,
    lat,
    lng,
    radius,
    timestamp: Date.now(),
  });

  const encodedData = Buffer.from(qrData).toString('base64url');
  const qrImageUrl = `${QR_API}?size=300x300&data=${encodeURIComponent(encodedData)}`;

  return {
    locationId,
    locationName,
    qrCode: encodedData,
    qrImageUrl,
  };
}
