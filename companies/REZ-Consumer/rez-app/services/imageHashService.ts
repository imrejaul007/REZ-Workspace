// @ts-nocheck
/**
 * Image Hash Service
import { createHash } from 'crypto';
 *
 * Provides image duplicate detection using SHA-256 hashing.
 * Compares uploaded images against previous uploads to prevent duplicates.
 *
 * Features:
 * - SHA-256 hash generation from image files
 * - Local storage of recent upload hashes
 * - Duplicate detection with configurable time window
 * - Merchant-specific duplicate checking
 * - Amount similarity checking
 *
 * @module imageHashService
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import { BILL_UPLOAD_CONFIG } from '@/config/uploadConfig';
import { logger } from '@/utils/logger';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface ImageHashRecord {
  hash: string;
  imageUri: string;
  merchantId?: string;
  amount?: number;
  timestamp: number;
  uploadId: string;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  matchedRecord?: ImageHashRecord;
  similarity: number; // 0-100
  reason?: string;
}

export interface HashComparisonOptions {
  checkMerchant?: boolean;
  checkAmount?: boolean;
  merchantId?: string;
  amount?: number;
  amountThreshold?: number;
  timeWindow?: number; // milliseconds
}

// ============================================================================
// Constants
// ============================================================================

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

const STORAGE_KEY = '@bill_upload_hashes';
const MAX_STORED_HASHES = 100;
const DEFAULT_TIME_WINDOW = 24 * 60 * 60 * 1000; // 24 hours
const DEFAULT_AMOUNT_THRESHOLD = 10; // ₹10

// ============================================================================
// Image Hash Service Class
// ============================================================================

class ImageHashService {
  private hashCache: Map<string, ImageHashRecord> = new Map();
  private isInitialized = false;

  /**
   * Initialize the service and load stored hashes
   */
  async initialize(): Promise<void> {
    // Skip initialization during SSR
    if (!isBrowser || this.isInitialized) {
      return;
    }

    try {
      await this.loadStoredHashes();
      await this.cleanupOldHashes();
      this.isInitialized = true;
      logger.debug('[ImageHash] Service initialized with', this.hashCache.size, 'stored hashes');
    } catch (error) {
      logger.error('[ImageHash] Initialization failed:', error);
      this.hashCache.clear();
    }
  }

  /**
   * Generate SHA-256 hash from image file
   *
   * @param imageUri - Local file URI or blob URL
   * @returns Hash string
   */
  async generateImageHash(imageUri: string): Promise<string> {
    try {
      logger.debug('[ImageHash] Generating hash for:', imageUri);

      if (Platform.OS === 'web') {
        return await this.generateHashWeb(imageUri);
      } else {
        return await this.generateHashNative(imageUri);
      }
    } catch (error) {
      logger.error('[ImageHash] Hash generation failed:', error);
      throw new Error('Failed to generate image hash');
    }
  }

  /**
   * Check if image is a duplicate of a previously uploaded image
   *
   * @param imageUri - Image URI to check
   * @param options - Comparison options
   * @returns Duplicate check result
   */
  async checkDuplicate(
    imageUri: string,
    options: HashComparisonOptions = {}
  ): Promise<DuplicateCheckResult> {
    await this.ensureInitialized();

    try {
      // Generate hash for the image
      const hash = await this.generateImageHash(imageUri);

      // Default options
      const {
        checkMerchant = true,
        checkAmount = true,
        amountThreshold = DEFAULT_AMOUNT_THRESHOLD,
        timeWindow = DEFAULT_TIME_WINDOW,
      } = options;

      // Check against stored hashes
      const currentTime = Date.now();

      for (const record of this.hashCache.values()) {
        // Skip if outside time window
        if (currentTime - record.timestamp > timeWindow) {
          continue;
        }

        // Compare hashes
        const similarity = this.compareHashes(hash, record.hash);

        // Exact hash match = definite duplicate
        if (similarity === 100) {
          logger.debug('[ImageHash] Exact duplicate found:', record.uploadId);
          return {
            isDuplicate: true,
            matchedRecord: record,
            similarity: 100,
            reason: 'Exact same image already uploaded',
          };
        }

        // High similarity (> 95%) = likely duplicate
        if (similarity > 95) {
          // Additional checks if provided
          let additionalChecksPassed = true;
          let reason = 'Very similar image already uploaded';

          // Check merchant match
          if (checkMerchant && options.merchantId && record.merchantId) {
            if (options.merchantId !== record.merchantId) {
              additionalChecksPassed = false;
            } else {
              reason = 'Same image for same merchant already uploaded';
            }
          }

          // Check amount similarity
          if (checkAmount && options.amount !== undefined && record.amount !== undefined) {
            const amountDiff = Math.abs(options.amount - record.amount);
            if (amountDiff <= amountThreshold) {
              reason = 'Same image with similar amount already uploaded';
            } else {
              additionalChecksPassed = false;
            }
          }

          if (additionalChecksPassed) {
            logger.debug('[ImageHash] Likely duplicate found', { uploadId: record.uploadId, similarity });
            return {
              isDuplicate: true,
              matchedRecord: record,
              similarity,
              reason,
            };
          }
        }
      }

      // No duplicate found
      logger.debug('[ImageHash] No duplicate found');
      return {
        isDuplicate: false,
        similarity: 0,
      };
    } catch (error) {
      logger.error('[ImageHash] Duplicate check failed:', error);
      // On error, allow upload (fail open)
      return {
        isDuplicate: false,
        similarity: 0,
      };
    }
  }

  /**
   * Store hash record for future duplicate detection
   *
   * @param record - Hash record to store
   */
  async storeHash(record: ImageHashRecord): Promise<void> {
    await this.ensureInitialized();

    try {
      // Add to cache
      this.hashCache.set(record.hash, record);

      // Limit cache size
      if (this.hashCache.size > MAX_STORED_HASHES) {
        await this.pruneOldestHashes();
      }

      // Persist to storage
      await this.persistHashes();

      logger.debug('[ImageHash] Hash stored:', record.uploadId);
    } catch (error) {
      logger.error('[ImageHash] Failed to store hash:', error);
    }
  }

  /**
   * Remove a hash record
   *
   * @param hash - Hash to remove
   */
  async removeHash(hash: string): Promise<void> {
    await this.ensureInitialized();

    try {
      this.hashCache.delete(hash);
      await this.persistHashes();
      logger.debug('[ImageHash] Hash removed');
    } catch (error) {
      logger.error('[ImageHash] Failed to remove hash:', error);
    }
  }

  /**
   * Clear all stored hashes
   */
  async clearAll(): Promise<void> {
    try {
      this.hashCache.clear();
      await AsyncStorage.removeItem(STORAGE_KEY);
      logger.debug('[ImageHash] All hashes cleared');
    } catch (error) {
      logger.error('[ImageHash] Failed to clear hashes:', error);
    }
  }

  /**
   * Get all stored hash records
   */
  async getAllHashes(): Promise<ImageHashRecord[]> {
    await this.ensureInitialized();
    return Array.from(this.hashCache.values());
  }

  /**
   * Get statistics about stored hashes
   */
  async getStats(): Promise<{
    totalHashes: number;
    oldestTimestamp: number;
    newestTimestamp: number;
    storageSize: number;
  }> {
    await this.ensureInitialized();

    const records = Array.from(this.hashCache.values());
    const timestamps = records.map(r => r.timestamp).sort((a, b) => a - b);

    return {
      totalHashes: records.length,
      oldestTimestamp: timestamps[0] || 0,
      newestTimestamp: timestamps[timestamps.length - 1] || 0,
      storageSize: this.hashCache.size,
    };
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  /**
   * Generate hash on web platform
   */
  private async generateHashWeb(imageUri: string): Promise<string> {
    try {
      // Fetch the image as a blob
      const response = await fetch(imageUri);
      const blob = await response.blob();

      // Convert blob to ArrayBuffer
      const arrayBuffer = await blob.arrayBuffer();

      // Generate SHA-256 hash using Web Crypto API
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);

      // Convert hash to hex string
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      return hashHex;
    } catch (error) {
      logger.error('[ImageHash] Web hash generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate hash on native platform (iOS/Android) using SHA-256 via expo-crypto
   */
  private async generateHashNative(imageUri: string): Promise<string> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(imageUri, {});
      if (!fileInfo.exists) {
        throw new Error('Unable to read image file');
      }

      // Read file contents as base64 (works for both file:// and content:// URIs)
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Hash the base64 string with SHA-256 via expo-crypto
      const hashBase64 = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        base64,
        { encoding: Crypto.CryptoEncoding.HEX }
      );

      return hashBase64;
    } catch (error) {
      logger.error('[ImageHash] Native hash generation failed:', error);
      throw error;
    }
  }

  /**
   * Compare two hashes and return similarity score
   */
  private compareHashes(hash1: string, hash2: string): number {
    if (hash1 === hash2) {
      return 100;
    }

    // For perceptual hashing, we could use Hamming distance
    // For now, we only check exact matches
    // Future enhancement: Implement perceptual hashing for similar images

    return 0;
  }

  /**
   * Load stored hashes from AsyncStorage
   */
  private async loadStoredHashes(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const records: ImageHashRecord[] = JSON.parse(stored);
        this.hashCache.clear();

        records.forEach(record => {
          this.hashCache.set(record.hash, record);
        });

        logger.debug('[ImageHash] Loaded', records.length, 'hashes from storage');
      }
    } catch (error) {
      logger.error('[ImageHash] Failed to load stored hashes:', error);
      this.hashCache.clear();
    }
  }

  /**
   * Persist hashes to AsyncStorage
   */
  private async persistHashes(): Promise<void> {
    try {
      const records = Array.from(this.hashCache.values());
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch (error) {
      logger.error('[ImageHash] Failed to persist hashes:', error);
    }
  }

  /**
   * Remove hashes older than the configured time window
   */
  private async cleanupOldHashes(): Promise<void> {
    const currentTime = Date.now();
    const timeWindow = BILL_UPLOAD_CONFIG.BILL_SPECIFIC_CONFIG.DUPLICATE_WINDOW;

    let removedCount = 0;

    for (const [hash, record] of this.hashCache.entries()) {
      if (currentTime - record.timestamp > timeWindow) {
        this.hashCache.delete(hash);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      await this.persistHashes();
      logger.debug('[ImageHash] Cleaned up', removedCount, 'old hashes');
    }
  }

  /**
   * Remove oldest hashes when cache exceeds max size
   */
  private async pruneOldestHashes(): Promise<void> {
    const records = Array.from(this.hashCache.values());
    records.sort((a, b) => a.timestamp - b.timestamp);

    const toRemove = records.slice(0, records.length - MAX_STORED_HASHES);
    toRemove.forEach(record => {
      this.hashCache.delete(record.hash);
    });

    logger.debug('[ImageHash] Pruned', toRemove.length, 'oldest hashes');
  }

  /**
   * Ensure service is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

// Singleton pattern using globalThis to persist across SSR module re-evaluations
const IMAGE_HASH_SERVICE_KEY = '__rezImageHashService__';

function getImageHashService(): ImageHashService {
  if (typeof globalThis !== 'undefined') {
    if (!(globalThis as unknown)[IMAGE_HASH_SERVICE_KEY]) {
      const instance = new ImageHashService();
      (globalThis as unknown)[IMAGE_HASH_SERVICE_KEY] = instance;
      // Auto-initialize on first access (only in browser environment)
      if (isBrowser) {
        instance.initialize().catch(error => {
          logger.error('[ImageHash] Auto-initialization failed:', error);
        });
      }
    }
    return (globalThis as unknown)[IMAGE_HASH_SERVICE_KEY];
  }
  return new ImageHashService();
}

export const imageHashService = getImageHashService();
export default imageHashService;
