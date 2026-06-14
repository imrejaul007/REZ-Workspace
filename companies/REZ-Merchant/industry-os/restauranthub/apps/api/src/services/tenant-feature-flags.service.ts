/**
 * Tenant Feature Flags Service
 *
 * Provides per-tenant feature flag management for Resturistan
 * Compatible with the standalone rez-feature-flags service
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient, TenantFeatureFlag } from '@prisma/client';

const prisma = new PrismaClient();
const logger = new Logger('TenantFeatureFlagsService');

// Default feature flags
export const DEFAULT_TENANT_FLAGS = {
  // Menu & Ordering
  digital_menu_enabled: { enabled: true, description: 'Digital menu display' },
  qr_ordering_enabled: { enabled: true, description: 'QR code based ordering' },
  table_reservations_enabled: { enabled: true, description: 'Table reservation system' },
  self_order_kiosk_enabled: { enabled: false, description: 'Self-order kiosk mode' },

  // Kitchen & Operations
  kitchen_display_system_enabled: { enabled: false, description: 'KDS integration' },
  inventory_management_enabled: { enabled: true, description: 'Inventory tracking' },
  multi_branch_enabled: { enabled: false, description: 'Multi-branch support' },

  // Payments & Financials
  online_payments_enabled: { enabled: true, description: 'Online payment processing' },
  wallet_enabled: { enabled: false, description: 'Customer wallet/credits' },
  loyalty_program_enabled: { enabled: false, description: 'Loyalty rewards program' },
  gst_invoice_enabled: { enabled: true, description: 'GST-compliant invoicing' },

  // Customer Engagement
  push_notifications_enabled: { enabled: true, description: 'Push notifications' },
  email_notifications_enabled: { enabled: true, description: 'Email notifications' },
  sms_notifications_enabled: { enabled: false, description: 'SMS notifications' },
  customer_feedback_enabled: { enabled: true, description: 'Customer feedback collection' },

  // Analytics & Insights
  analytics_dashboard_enabled: { enabled: true, description: 'Analytics dashboard' },
  sales_reports_enabled: { enabled: true, description: 'Sales reporting' },
  customer_insights_enabled: { enabled: true, description: 'Customer insights' },

  // Staff Management
  staff_app_enabled: { enabled: false, description: 'Staff mobile app' },
  staff_scheduling_enabled: { enabled: false, description: 'Staff scheduling' },
  attendance_tracking_enabled: { enabled: false, description: 'Staff attendance' },

  // Integrations
  pos_integration_enabled: { enabled: false, description: 'POS system integration' },
  delivery_integration_enabled: { enabled: false, description: 'Delivery service integration' },
  aggregator_integration_enabled: { enabled: false, description: 'Food aggregator sync' },

  // Advanced Features
  ai_recommendations_enabled: { enabled: false, description: 'AI-powered recommendations' },
  dynamic_pricing_enabled: { enabled: false, description: 'Dynamic pricing rules' },
  sentiment_analysis_enabled: { enabled: false, description: 'Review sentiment analysis' },

  // Marketplace
  marketplace_enabled: { enabled: false, description: 'Multi-vendor marketplace' },
  vendor_portal_enabled: { enabled: false, description: 'Vendor self-service portal' },

  // Security & Compliance
  two_factor_auth_enabled: { enabled: false, description: 'Two-factor authentication' },
  audit_logs_enabled: { enabled: true, description: 'Audit logging' },
  data_export_enabled: { enabled: true, description: 'Data export functionality' },

  // Beta Features
  beta_voice_orders_enabled: { enabled: false, description: 'Voice ordering (Beta)' },
  beta_ai_kitchen_assistant_enabled: { enabled: false, description: 'AI Kitchen Assistant (Beta)' },
};

export type FeatureFlagKey = keyof typeof DEFAULT_TENANT_FLAGS;

export interface TenantFlagResult {
  flagKey: string;
  enabled: boolean;
  description: string;
  source: 'override' | 'default';
}

/**
 * Get a single feature flag for a tenant
 */
export async function getTenantFlag(
  tenantId: string,
  flagKey: string,
): Promise<boolean> {
  const flag = await prisma.tenantFeatureFlag.findUnique({
    where: {
      tenantId_flagKey: {
        tenantId,
        flagKey,
      },
    },
  });

  if (flag) {
    return flag.enabled;
  }

  // Fall back to default
  return DEFAULT_TENANT_FLAGS[flagKey as FeatureFlagKey]?.enabled ?? false;
}

/**
 * Get all feature flags for a tenant
 */
export async function getAllTenantFlags(
  tenantId: string,
): Promise<Record<string, TenantFlagResult>> {
  const overrides = await prisma.tenantFeatureFlag.findMany({
    where: { tenantId },
  });

  const overrideMap = new Map(
    overrides.map((o) => [o.flagKey, { enabled: o.enabled, config: o.config }]),
  );

  const result: Record<string, TenantFlagResult> = {};

  for (const [key, defaultFlag] of Object.entries(DEFAULT_TENANT_FLAGS)) {
    const override = overrideMap.get(key);
    result[key] = {
      flagKey: key,
      enabled: override?.enabled ?? defaultFlag.enabled,
      description: defaultFlag.description,
      source: override ? 'override' : 'default',
    };
  }

  return result;
}

/**
 * Set a feature flag for a tenant
 */
export async function setTenantFlag(
  tenantId: string,
  flagKey: string,
  enabled: boolean,
  config?: Record<string, unknown>,
): Promise<TenantFeatureFlag> {
  if (!(flagKey in DEFAULT_TENANT_FLAGS)) {
    throw new Error(`Unknown feature flag: ${flagKey}`);
  }

  return prisma.tenantFeatureFlag.upsert({
    where: {
      tenantId_flagKey: {
        tenantId,
        flagKey,
      },
    },
    update: {
      enabled,
      config: config ?? undefined,
    },
    create: {
      tenantId,
      flagKey,
      enabled,
      config: config ?? undefined,
    },
  });
}

/**
 * Remove a feature flag override (revert to default)
 */
export async function removeTenantFlag(
  tenantId: string,
  flagKey: string,
): Promise<boolean> {
  const result = await prisma.tenantFeatureFlag.deleteMany({
    where: {
      tenantId,
      flagKey,
    },
  });

  return result.count > 0;
}

/**
 * Bulk set feature flags
 */
export async function bulkSetTenantFlags(
  tenantId: string,
  flags: Record<string, boolean>,
): Promise<TenantFeatureFlag[]> {
  const operations = [];

  for (const [flagKey, enabled] of Object.entries(flags)) {
    if (!(flagKey in DEFAULT_TENANT_FLAGS)) {
      logger.warn(`Skipping unknown flag: ${flagKey}`);
      continue;
    }

    operations.push({
      updateOne: {
        filter: { tenantId, flagKey },
        update: {
          $set: {
            tenantId,
            flagKey,
            enabled,
            updatedAt: new Date(),
          },
          $setOnInsert: {
            createdAt: new Date(),
          },
        },
        upsert: true,
      },
    });
  }

  if (operations.length > 0) {
    await prisma.tenantFeatureFlag.createMany({
      data: Object.entries(flags)
        .filter(([key]) => key in DEFAULT_TENANT_FLAGS)
        .map(([flagKey, enabled]) => ({
          tenantId,
          flagKey,
          enabled,
        })),
      skipDuplicates: true,
    });
  }

  return prisma.tenantFeatureFlag.findMany({
    where: { tenantId },
  });
}

/**
 * Get all overrides for a tenant
 */
export async function getTenantOverrides(
  tenantId: string,
): Promise<TenantFeatureFlag[]> {
  return prisma.tenantFeatureFlag.findMany({
    where: { tenantId },
  });
}

/**
 * Check if tenant has a specific flag enabled
 */
export async function isFeatureEnabled(
  tenantId: string,
  flagKey: string,
): Promise<boolean> {
  try {
    return await getTenantFlag(tenantId, flagKey);
  } catch {
    return false;
  }
}

/**
 * Check multiple flags at once
 */
export async function checkFeatures(
  tenantId: string,
  flagKeys: string[],
): Promise<Record<string, boolean>> {
  const flags = await getAllTenantFlags(tenantId);
  const result: Record<string, boolean> = {};

  for (const key of flagKeys) {
    result[key] = flags[key]?.enabled ?? false;
  }

  return result;
}

/**
 * Get all tenants with a specific flag enabled
 */
export async function getTenantsWithFlag(
  flagKey: string,
  enabled: boolean = true,
): Promise<string[]> {
  const flags = await prisma.tenantFeatureFlag.findMany({
    where: {
      flagKey,
      enabled,
    },
    select: { tenantId: true },
  });

  return flags.map((f) => f.tenantId);
}

/**
 * Get flag statistics across all tenants
 */
export async function getFlagStatistics(
  flagKey: string,
): Promise<{
  totalOverrides: number;
  enabledCount: number;
  disabledCount: number;
  defaultEnabled: boolean;
}> {
  const overrides = await prisma.tenantFeatureFlag.findMany({
    where: { flagKey },
  });

  const defaultEnabled = DEFAULT_TENANT_FLAGS[flagKey as FeatureFlagKey]?.enabled ?? false;

  return {
    totalOverrides: overrides.length,
    enabledCount: overrides.filter((o) => o.enabled).length,
    disabledCount: overrides.filter((o) => !o.enabled).length,
    defaultEnabled,
  };
}
