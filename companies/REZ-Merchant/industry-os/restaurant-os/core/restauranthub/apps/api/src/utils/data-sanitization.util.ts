/**
 * Data Sanitization Utility
 * Removes sensitive fields from API responses to prevent data exposure
 */

export interface SanitizedUser {
  id: string;
  role: string;
  isActive: boolean;
  isVerified: boolean;
  emailVerifiedAt?: Date;
  isAadhaarVerified: boolean;
  twoFactorEnabled: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  // Include relations but ensure they are also sanitized
  profile?;
  restaurant?;
  vendor?;
  employee?;
}

/**
 * Sensitive fields that should never be exposed in API responses
 */
const SENSITIVE_USER_FIELDS = [
  'passwordHash',
  'refreshToken',
  'twoFactorSecret',
  'aadhaarVerificationId',
  'deletedAt',
  'email',
  'phone'
];

/**
 * Recursively sanitize user objects to remove sensitive fields
 */
export function sanitizeUser(user): SanitizedUser | null {
  if (!user) return null;

  const sanitized: unknown = {};

  // Copy all fields except sensitive ones
  Object.keys(user).forEach(key => {
    if (!SENSITIVE_USER_FIELDS.includes(key)) {
      sanitized[key] = user[key];
    }
  });

  return sanitized;
}

/**
 * Sanitize restaurant data by cleaning nested user objects
 */
export function sanitizeRestaurant(restaurant): unknown {
  if (!restaurant) return null;

  const sanitized = { ...restaurant };

  // Sanitize main user object
  if (sanitized.user) {
    sanitized.user = sanitizeUser(sanitized.user);
  }

  // Sanitize employees array
  if (sanitized.employees && Array.isArray(sanitized.employees)) {
    sanitized.employees = sanitized.employees.map((employee) => ({
      ...employee,
      user: sanitizeUser(employee.user)
    }));
  }

  // Sanitize recent applications
  if (sanitized.recentApplications && Array.isArray(sanitized.recentApplications)) {
    sanitized.recentApplications = sanitized.recentApplications.map((application) => ({
      ...application,
      employee: application.employee ? {
        ...application.employee,
        user: sanitizeUser(application.employee.user)
      } : null
    }));
  }

  return sanitized;
}

/**
 * Sanitize an array of restaurants
 */
export function sanitizeRestaurants(restaurants: unknown[]): unknown[] {
  if (!restaurants || !Array.isArray(restaurants)) return [];

  return restaurants.map(restaurant => sanitizeRestaurant(restaurant));
}

/**
 * Sanitize paginated restaurant data
 */
export function sanitizeRestaurantPaginatedData(data): unknown {
  if (!data) return null;

  return {
    ...data,
    data: sanitizeRestaurants(data.data)
  };
}