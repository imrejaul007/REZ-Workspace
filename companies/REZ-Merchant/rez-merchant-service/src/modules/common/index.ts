/**
 * ReZ Merchant - Common Modules
 * Shared across all industries
 */

export * from './auth/auth';
export * from './notifications/notifications';
export * from './payments/payments';
export * from './analytics/analytics';
export * from './users/users';
export * from './staff/staff';
export * from './inventory/inventory';
export * from './compliance/compliance';

// Instances
import { commonAuth } from './auth/auth';
import { commonNotifications } from './notifications/notifications';
import { commonPayments } from './payments/payments';
import { commonAnalytics } from './analytics/analytics';
import { commonUsers } from './users/users';
import { commonStaff } from './staff/staff';
import { commonInventory } from './inventory/inventory';
import { commonCompliance } from './compliance/compliance';

export const commonModules = {
  auth: commonAuth,
  notifications: commonNotifications,
  payments: commonPayments,
  analytics: commonAnalytics,
  users: commonUsers,
  staff: commonStaff,
  inventory: commonInventory,
  compliance: commonCompliance
};
