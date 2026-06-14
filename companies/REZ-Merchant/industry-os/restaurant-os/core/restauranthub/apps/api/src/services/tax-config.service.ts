/**
 * Tax Configuration Service
 *
 * Provides per-tenant tax rate management with HSN code overrides
 * and GST compliance features.
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient, TaxConfig, HsnTaxOverride } from '@prisma/client';

const prisma = new PrismaClient();
const logger = new Logger('TaxConfigService');

export interface TaxRateResult {
  rate: number;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  cessRate: number;
  source: 'hsn_override' | 'tenant_default' | 'system_default';
}

export interface TaxCalculation {
  taxableAmount: number;
  taxAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  cessAmount: number;
  totalAmount: number;
  rate: number;
}

/**
 * Get tax rate for a tenant, optionally overridden by HSN code
 */
export async function getTaxRate(
  tenantId: string,
  hsnCode?: string,
): Promise<TaxRateResult> {
  try {
    // Default rates (18% GST)
    const defaultRates = {
      rate: 18,
      cgstRate: 9,
      sgstRate: 9,
      igstRate: 18,
      cessRate: 0,
      source: 'system_default' as const,
    };

    // Fetch tenant tax config
    const config = await prisma.taxConfig.findUnique({
      where: { tenantId },
      include: {
        hsnOverrides: {
          where: {
            isActive: true,
            ...(hsnCode && { hsnCode }),
          },
        },
      },
    });

    if (!config) {
      return defaultRates;
    }

    // Check for HSN-specific override
    if (hsnCode && config.hsnOverrides.length > 0) {
      const hsnOverride = config.hsnOverrides[0];
      return {
        rate: hsnOverride.rate,
        cgstRate: hsnOverride.cgstRate ?? config.cgstRate,
        sgstRate: hsnOverride.sgstRate ?? config.sgstRate,
        igstRate: hsnOverride.igstRate ?? config.igstRate,
        cessRate: hsnOverride.cessRate ?? config.cessRate,
        source: 'hsn_override',
      };
    }

    // Return tenant default rates
    return {
      rate: config.defaultRate,
      cgstRate: config.cgstRate,
      sgstRate: config.sgstRate,
      igstRate: config.igstRate,
      cessRate: config.cessRate,
      source: 'tenant_default',
    };
  } catch (error) {
    logger.error(`Error getting tax rate for tenant ${tenantId}:`, error);
    return {
      rate: 18,
      cgstRate: 9,
      sgstRate: 9,
      igstRate: 18,
      cessRate: 0,
      source: 'system_default',
    };
  }
}

/**
 * Calculate tax amount for a given taxable amount
 */
export async function calculateTax(
  tenantId: string,
  taxableAmount: number,
  hsnCode?: string,
  isInterstate: boolean = false,
): Promise<TaxCalculation> {
  const rates = await getTaxRate(tenantId, hsnCode);

  // Calculate individual tax components
  const cgstRate = isInterstate ? 0 : rates.cgstRate;
  const sgstRate = isInterstate ? 0 : rates.sgstRate;
  const igstRate = isInterstate ? rates.igstRate : 0;

  const cgstAmount = (taxableAmount * cgstRate) / 100;
  const sgstAmount = (taxableAmount * sgstRate) / 100;
  const igstAmount = (taxableAmount * igstRate) / 100;
  const cessAmount = (taxableAmount * rates.cessRate) / 100;

  const taxAmount = cgstAmount + sgstAmount + igstAmount + cessAmount;
  const totalAmount = taxableAmount + taxAmount;

  return {
    taxableAmount,
    taxAmount: Math.round(taxAmount * 100) / 100,
    cgstAmount: Math.round(cgstAmount * 100) / 100,
    sgstAmount: Math.round(sgstAmount * 100) / 100,
    igstAmount: Math.round(igstAmount * 100) / 100,
    cessAmount: Math.round(cessAmount * 100) / 100,
    totalAmount: Math.round(totalAmount * 100) / 100,
    rate: rates.rate,
  };
}

/**
 * Get or create tax config for a tenant
 */
export async function getOrCreateTaxConfig(
  tenantId: string,
  defaults?: Partial<{
    defaultRate: number;
    cgstRate: number;
    sgstRate: number;
    igstRate: number;
    cessRate: number;
    gstin: string;
  }>,
): Promise<TaxConfig> {
  let config = await prisma.taxConfig.findUnique({
    where: { tenantId },
  });

  if (!config) {
    config = await prisma.taxConfig.create({
      data: {
        tenantId,
        defaultRate: defaults?.defaultRate ?? 18,
        cgstRate: defaults?.cgstRate ?? 9,
        sgstRate: defaults?.sgstRate ?? 9,
        igstRate: defaults?.igstRate ?? 18,
        cessRate: defaults?.cessRate ?? 0,
        gstin: defaults?.gstin,
      },
    });
  }

  return config;
}

/**
 * Update tax config for a tenant
 */
export async function updateTaxConfig(
  tenantId: string,
  data: Partial<{
    defaultRate: number;
    cgstRate: number;
    sgstRate: number;
    igstRate: number;
    cessRate: number;
    gstin: string;
    taxInclusive: boolean;
    roundOff: boolean;
    includeTaxInReports: boolean;
    generateGstr1: boolean;
  }>,
): Promise<TaxConfig> {
  return prisma.taxConfig.upsert({
    where: { tenantId },
    update: data,
    create: {
      tenantId,
      ...data,
    },
  });
}

/**
 * Add or update HSN tax override
 */
export async function setHsnOverride(
  tenantId: string,
  hsnCode: string,
  rate: number,
  options?: {
    cgstRate?: number;
    sgstRate?: number;
    igstRate?: number;
    cessRate?: number;
    description?: string;
  },
): Promise<HsnTaxOverride> {
  // Ensure tax config exists
  await getOrCreateTaxConfig(tenantId);
  const config = await prisma.taxConfig.findUnique({ where: { tenantId } });

  if (!config) {
    throw new Error('Failed to create tax config');
  }

  return prisma.hsnTaxOverride.upsert({
    where: {
      taxConfigId_hsnCode: {
        taxConfigId: config.id,
        hsnCode,
      },
    },
    update: {
      rate,
      cgstRate: options?.cgstRate,
      sgstRate: options?.sgstRate,
      igstRate: options?.igstRate,
      cessRate: options?.cessRate,
      description: options?.description,
    },
    create: {
      taxConfigId: config.id,
      hsnCode,
      rate,
      cgstRate: options?.cgstRate,
      sgstRate: options?.sgstRate,
      igstRate: options?.igstRate,
      cessRate: options?.cessRate,
      description: options?.description,
    },
  });
}

/**
 * Remove HSN override
 */
export async function removeHsnOverride(
  tenantId: string,
  hsnCode: string,
): Promise<boolean> {
  const config = await prisma.taxConfig.findUnique({ where: { tenantId } });
  if (!config) return false;

  const result = await prisma.hsnTaxOverride.deleteMany({
    where: {
      taxConfigId: config.id,
      hsnCode,
    },
  });

  return result.count > 0;
}

/**
 * Get all HSN overrides for a tenant
 */
export async function getHsnOverrides(
  tenantId: string,
): Promise<HsnTaxOverride[]> {
  const config = await prisma.taxConfig.findUnique({
    where: { tenantId },
    include: { hsnOverrides: true },
  });

  return config?.hsnOverrides ?? [];
}

/**
 * Common HSN codes for restaurants
 */
export const RESTAURANT_HSN_CODES = {
  '9963': {
    description: 'Food and beverage services',
    rate: 18,
    name: 'Restaurant Service',
  },
  '9964': {
    description: 'Accommodation services',
    rate: 12,
    name: 'Hotel/Accommodation',
  },
  '9965': {
    description: 'Passenger transport services',
    rate: 5,
    name: 'Transport',
  },
  '9966': {
    description: 'Rental services of motor vehicles',
    rate: 12,
    name: 'Vehicle Rental',
  },
  '9973': {
    description: 'Financial and related services',
    rate: 18,
    name: 'Financial Services',
  },
};
