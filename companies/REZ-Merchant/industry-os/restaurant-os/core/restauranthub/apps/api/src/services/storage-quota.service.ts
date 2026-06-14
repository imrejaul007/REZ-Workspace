/**
 * Storage Quota Service
 *
 * Provides per-tenant storage quota management with usage tracking,
 * alerts, and automatic cleanup recommendations.
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient, StorageQuota, StorageUsageHistory } from '@prisma/client';

const prisma = new PrismaClient();
const logger = new Logger('StorageQuotaService');

// Default limits
const DEFAULT_MAX_STORAGE = BigInt(10 * 1024 * 1024 * 1024); // 10 GB
const DEFAULT_MAX_FILES = 10000;

export interface StorageQuotaStatus {
  tenantId: string;
  maxBytes: bigint;
  usedBytes: bigint;
  availableBytes: bigint;
  usagePercent: number;
  maxFiles: number;
  usedFiles: number;
  availableFiles: number;
  fileUsagePercent: number;
  isOverQuota: boolean;
  isSoftLimit: boolean;
  alertThreshold: number;
  categoryBreakdown?: {
    images: bigint;
    documents: bigint;
    videos: bigint;
    other: bigint;
  };
}

export interface QuotaCheckResult {
  allowed: boolean;
  reason?: string;
  currentUsage: bigint;
  requestedBytes: bigint;
  newTotalBytes: bigint;
  percentAfter: number;
}

export interface FileUploadCheck {
  allowed: boolean;
  category: 'images' | 'documents' | 'videos' | 'audio' | 'other';
  reason?: string;
  categoryLimit?: bigint;
  categoryUsed?: bigint;
}

/**
 * Get storage quota for a tenant
 */
export async function getStorageQuota(tenantId: string): Promise<StorageQuota | null> {
  return prisma.storageQuota.findUnique({
    where: { tenantId },
    include: {
      usageHistory: {
        orderBy: { recordedAt: 'desc' },
        take: 1,
      },
    },
  });
}

/**
 * Get or create storage quota with defaults
 */
export async function getOrCreateStorageQuota(
  tenantId: string,
): Promise<StorageQuota> {
  let quota = await prisma.storageQuota.findUnique({
    where: { tenantId },
  });

  if (!quota) {
    quota = await prisma.storageQuota.create({
      data: {
        tenantId,
        maxStorageBytes: DEFAULT_MAX_STORAGE,
        maxFileCount: DEFAULT_MAX_FILES,
      },
    });
  }

  return quota;
}

/**
 * Get storage quota status with usage percentages
 */
export async function getStorageQuotaStatus(
  tenantId: string,
): Promise<StorageQuotaStatus> {
  const quota = await getOrCreateStorageQuota(tenantId);

  const maxBytes = quota.maxStorageBytes;
  const usedBytes = quota.usedStorageBytes;
  const availableBytes = maxBytes - usedBytes;
  const usagePercent = Number((usedBytes * BigInt(100)) / maxBytes);

  const maxFiles = quota.maxFileCount;
  const usedFiles = quota.usedFileCount;
  const availableFiles = maxFiles - usedFiles;
  const fileUsagePercent = (usedFiles * 100) / maxFiles;

  const softLimit = quota.softLimitPercent;
  const isOverQuota = usagePercent >= 100;
  const isSoftLimit = usagePercent >= softLimit;

  return {
    tenantId,
    maxBytes,
    usedBytes,
    availableBytes,
    usagePercent,
    maxFiles,
    usedFiles,
    availableFiles,
    fileUsagePercent,
    isOverQuota,
    isSoftLimit,
    alertThreshold: quota.alertThresholdPercent,
  };
}

/**
 * Check if upload is allowed under quota
 */
export async function checkUploadAllowed(
  tenantId: string,
  fileSizeBytes: bigint,
  category: 'images' | 'documents' | 'videos' | 'audio' | 'other' = 'other',
): Promise<FileUploadCheck> {
  const quota = await getOrCreateStorageQuota(tenantId);

  // Check feature flags
  const featureChecks = {
    images: quota.allowImageUpload,
    documents: quota.allowDocumentUpload,
    videos: quota.allowVideoUpload,
    audio: quota.allowAudioUpload,
    other: true,
  };

  if (!featureChecks[category]) {
    return {
      allowed: false,
      category,
      reason: `${category} uploads are disabled for this tenant`,
    };
  }

  // Check category-specific limits
  const categoryLimits = {
    images: quota.maxImageStorageBytes,
    documents: quota.maxDocumentStorageBytes,
    videos: quota.maxVideoStorageBytes,
    audio: BigInt(0), // Default to 0 if not specified
    other: BigInt(0),
  };

  const categoryLimit = categoryLimits[category];
  const categoryUsed = BigInt(0); // Would need separate tracking for this
  const categoryAvailable = categoryLimit - categoryUsed;

  if (categoryUsed + fileSizeBytes > categoryLimit) {
    return {
      allowed: false,
      category,
      reason: `Upload exceeds ${category} category limit`,
      categoryLimit,
      categoryUsed,
    };
  }

  // Check total quota
  const check = await checkQuotaAllowed(tenantId, fileSizeBytes);

  return {
    allowed: check.allowed,
    category,
    reason: check.reason,
    categoryLimit,
    categoryUsed,
  };
}

/**
 * Check if storage allocation is allowed
 */
export async function checkQuotaAllowed(
  tenantId: string,
  additionalBytes: bigint,
): Promise<QuotaCheckResult> {
  const quota = await getOrCreateStorageQuota(tenantId);

  const currentUsage = quota.usedStorageBytes;
  const maxStorage = quota.maxStorageBytes;
  const newTotal = currentUsage + additionalBytes;
  const percentAfter = Number((newTotal * BigInt(100)) / maxStorage);

  const isAllowed = newTotal <= maxStorage;

  return {
    allowed: isAllowed,
    reason: isAllowed ? undefined : 'Storage quota exceeded',
    currentUsage,
    requestedBytes: additionalBytes,
    newTotalBytes: newTotal,
    percentAfter,
  };
}

/**
 * Update storage usage
 */
export async function updateStorageUsage(
  tenantId: string,
  deltaBytes: bigint,
  deltaFiles: number = 0,
): Promise<StorageQuota> {
  const quota = await getOrCreateStorageQuota(tenantId);

  const newUsedBytes = quota.usedStorageBytes + deltaBytes;
  const newUsedFiles = Math.max(0, quota.usedFileCount + deltaFiles);

  // Check if we need to send an alert
  const usagePercent = Number((newUsedBytes * BigInt(100)) / quota.maxStorageBytes);
  let lastAlertAt = quota.lastAlertAt;

  if (usagePercent >= quota.alertThresholdPercent) {
    lastAlertAt = new Date();
  }

  return prisma.storageQuota.update({
    where: { tenantId },
    data: {
      usedStorageBytes: newUsedBytes,
      usedFileCount: newUsedFiles,
      lastAlertAt,
    },
  });
}

/**
 * Record storage usage snapshot for history tracking
 */
export async function recordUsageSnapshot(
  tenantId: string,
  breakdown?: {
    imageBytes?: bigint;
    documentBytes?: bigint;
    videoBytes?: bigint;
    audioBytes?: bigint;
    otherBytes?: bigint;
  },
): Promise<StorageUsageHistory> {
  const quota = await getOrCreateStorageQuota(tenantId);

  return prisma.storageUsageHistory.create({
    data: {
      storageQuotaId: quota.id,
      totalBytes: quota.usedStorageBytes,
      fileCount: quota.usedFileCount,
      imageBytes: breakdown?.imageBytes ?? BigInt(0),
      documentBytes: breakdown?.documentBytes ?? BigInt(0),
      videoBytes: breakdown?.videoBytes ?? BigInt(0),
      audioBytes: breakdown?.audioBytes ?? BigInt(0),
      otherBytes: breakdown?.otherBytes ?? BigInt(0),
      quotaBytes: quota.maxStorageBytes,
    },
  });
}

/**
 * Update storage quota limits
 */
export async function updateStorageQuota(
  tenantId: string,
  data: Partial<{
    maxStorageBytes: bigint;
    maxFileCount: number;
    maxImageStorageBytes: bigint;
    maxDocumentStorageBytes: bigint;
    maxVideoStorageBytes: bigint;
    alertThresholdPercent: number;
    softLimitPercent: number;
    gracePeriodDays: number;
    allowImageUpload: boolean;
    allowVideoUpload: boolean;
    allowDocumentUpload: boolean;
    allowAudioUpload: boolean;
    autoCompressImages: boolean;
    compressionQuality: number;
  }>,
): Promise<StorageQuota> {
  return prisma.storageQuota.upsert({
    where: { tenantId },
    update: data,
    create: {
      tenantId,
      maxStorageBytes: data.maxStorageBytes ?? DEFAULT_MAX_STORAGE,
      maxFileCount: data.maxFileCount ?? DEFAULT_MAX_FILES,
      ...data,
    },
  });
}

/**
 * Get storage usage history
 */
export async function getUsageHistory(
  tenantId: string,
  days: number = 30,
): Promise<StorageUsageHistory[]> {
  const quota = await getOrCreateStorageQuota(tenantId);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return prisma.storageUsageHistory.findMany({
    where: {
      storageQuotaId: quota.id,
      recordedAt: { gte: cutoffDate },
    },
    orderBy: { recordedAt: 'desc' },
  });
}

/**
 * Get cleanup recommendations
 */
export async function getCleanupRecommendations(
  tenantId: string,
): Promise<{
  filesToClean: number;
  estimatedSavings: bigint;
  oldestFiles: Array<{
    type: string;
    count: number;
    oldestDate: Date | null;
  }>;
  recommendations: string[];
}> {
  const quota = await getOrCreateStorageQuota(tenantId);
  const recommendations: string[] = [];
  let filesToClean = 0;
  let estimatedSavings = BigInt(0);

  // Calculate how much over quota
  const overage = quota.usedStorageBytes - quota.maxStorageBytes;
  if (overage > 0) {
    recommendations.push(
      `Storage is ${formatBytes(Number(overage))} over quota. ` +
      `Consider deleting old or unused files.`
    );
  }

  // Check if approaching soft limit
  const usagePercent = Number(
    (quota.usedStorageBytes * BigInt(100)) / quota.maxStorageBytes
  );
  if (usagePercent >= quota.softLimitPercent) {
    recommendations.push(
      `Storage usage is at ${usagePercent}%. Consider archiving old data.`
    );
  }

  // Check file count
  const fileUsagePercent = (quota.usedFileCount * 100) / quota.maxFileCount;
  if (fileUsagePercent >= 80) {
    recommendations.push(
      `File count is at ${fileUsagePercent.toFixed(0)}% of limit.`
    );
  }

  return {
    filesToClean,
    estimatedSavings,
    oldestFiles: [],
    recommendations,
  };
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number | bigint): string {
  const num = typeof bytes === 'bigint' ? Number(bytes) : bytes;
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let unitIndex = 0;
  let value = num;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }

  return `${value.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * Calculate recommended compression quality
 */
export function getRecommendedCompressionQuality(
  currentUsage: bigint,
  maxStorage: bigint,
): number {
  const usageRatio = Number(currentUsage) / Number(maxStorage);

  if (usageRatio >= 0.95) return 60; // Aggressive compression
  if (usageRatio >= 0.85) return 70;
  if (usageRatio >= 0.75) return 75;

  return 80; // Default quality
}

// Predefined storage plans
export const STORAGE_PLANS = {
  starter: {
    maxStorageBytes: BigInt(5 * 1024 * 1024 * 1024), // 5 GB
    maxFileCount: 5000,
    name: 'Starter',
  },
  basic: {
    maxStorageBytes: BigInt(10 * 1024 * 1024 * 1024), // 10 GB
    maxFileCount: 10000,
    name: 'Basic',
  },
  professional: {
    maxStorageBytes: BigInt(50 * 1024 * 1024 * 1024), // 50 GB
    maxFileCount: 50000,
    name: 'Professional',
  },
  enterprise: {
    maxStorageBytes: BigInt(200 * 1024 * 1024 * 1024), // 200 GB
    maxFileCount: 200000,
    name: 'Enterprise',
  },
};
