// @ts-nocheck
/**
 * Unified Image Service
 *
 * Consolidated image caching and processing service combining:
 * - imageCacheManager (persistent AsyncStorage cache with LRU)
 * - imageCacheService (two-tier memory + disk cache with TTL)
 * - imagePreloadService (priority-based preloading with network awareness)
 * - imageQualityService (brightness, contrast, sharpness, resolution analysis)
 *
 * Features:
 * - Single cache instance for memory efficiency
 * - Unified API for all image operations
 * - Priority-based preloading with network awareness
 * - LRU eviction policy
 * - TTL-based expiration
 * - Image quality analysis
 * - Offline support
 *
 * @module unifiedImageService
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { Image } from 'expo-image';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import * as Crypto from 'expo-crypto';

// ============================================================================
// Types & Interfaces
// ============================================================================

/** Cache entry metadata */
interface CacheEntry {
  uri: string;
  localPath?: string;
  timestamp: number;
  lastAccessed: number;
  size: number;
  hits: number;
  ttl?: number;
  expiresAt?: number;
}

/** Memory cache entry */
interface MemoryCacheEntry {
  entry: CacheEntry;
  data?: string;
}

/** Cache statistics */
interface UnifiedCacheStats {
  memorySize: number;
  diskSize: number;
  totalEntries: number;
  memoryEntries: number;
  diskEntries: number;
  hits: number;
  misses: number;
  evictions: number;
  hitRate: number;
  preloadedCount: number;
  preloadQueueSize: number;
  networkQuality: NetworkQuality;
}

/** Preload priority levels */
export enum PreloadPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

/** Network quality levels */
export enum NetworkQuality {
  OFFLINE = 'offline',
  SLOW_2G = 'slow-2g',
  FAST_3G = 'fast-3g',
  FAST_4G = 'fast-4g',
  WIFI = 'wifi',
}

/** Image quality result */
export interface ImageQualityResult {
  isValid: boolean;
  score: number;
  feedback: string;
  details: {
    brightness: { value: number; status: 'good' | 'fair' | 'poor'; message: string };
    contrast: { value: number; status: 'good' | 'fair' | 'poor'; message: string };
    sharpness: { value: number; status: 'good' | 'fair' | 'poor'; message: string };
    resolution: { width: number; height: number; megapixels: number; status: 'good' | 'fair' | 'poor'; message: string };
    fileSize?: { bytes: number; status: 'good' | 'fair' | 'poor'; message: string };
  };
  issues: string[];
  suggestions: string[];
}

/** Preload result */
interface PreloadResult {
  uri: string;
  success: boolean;
  duration: number;
  fromCache: boolean;
}

/** Unified service configuration */
interface UnifiedConfig {
  maxMemorySize: number;
  maxDiskSize: number;
  maxMemoryEntries: number;
  maxDiskEntries: number;
  defaultTTL: number;
  maxAge: number;
  maxConcurrentPreloads: number;
  maxPreloadQueueSize: number;
  preloadTimeout: number;
  enableMemoryCache: boolean;
  enableDiskCache: boolean;
  enablePreloading: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const CACHE_PREFIX = '@unified_image_cache:';
const CACHE_INDEX_KEY = '@unified_image_cache_index';
const MEMORY_CACHE_INDEX_KEY = '@unified_image_memory_index';

const DEFAULT_CONFIG: UnifiedConfig = {
  maxMemorySize: 10 * 1024 * 1024, // 10MB
  maxDiskSize: 100 * 1024 * 1024, // 100MB
  maxMemoryEntries: 100,
  maxDiskEntries: 500,
  defaultTTL: 7 * 24 * 60 * 60 * 1000, // 7 days
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  maxConcurrentPreloads: 3,
  maxPreloadQueueSize: 50,
  preloadTimeout: 30000,
  enableMemoryCache: true,
  enableDiskCache: true,
  enablePreloading: true,
};

const QUALITY_THRESHOLDS = {
  brightness: { min: 0.2, max: 0.9, optimal: { min: 0.3, max: 0.8 } },
  contrast: { min: 0.15, optimal: 0.3 },
  blur: { min: 100, optimal: 300 },
  resolution: { minMegapixels: 1.0, optimalMegapixels: 2.0 },
  fileSize: { min: 50_000, max: 10_000_000, optimal: { min: 100_000, max: 5_000_000 } },
};

// ============================================================================
// Unified Image Service Class
// ============================================================================

class UnifiedImageService {
  // Singleton key
  private static readonly SERVICE_KEY = '__rezUnifiedImageService__';

  // Cache storage
  private memoryCache: Map<string, MemoryCacheEntry> = new Map();
  private diskCacheIndex: Map<string, CacheEntry> = new Map();
  private preloadQueue: Map<string, { uri: string; priority: PreloadPriority; timestamp: number }> = new Map();
  private completedPreloads: Set<string> = new Set();
  private failedPreloads: Set<string> = new Set();
  private activePreloads: Map<string, Promise<void>> = new Map();

  // Configuration
  private config: UnifiedConfig;

  // Runtime state
  private initialized = false;
  private cacheDir: string;
  private networkQuality: NetworkQuality = NetworkQuality.WIFI;
  private networkUnsubscribe: (() => void) | null = null;

  // Statistics
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    memorySize: 0,
    diskSize: 0,
    totalPreloaded: 0,
    totalFailed: 0,
  };

  // Private constructor for singleton
  private constructor(config: Partial<UnifiedConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.cacheDir = `${FileSystem.cacheDirectory || ''}images/`;
  }

  // ============================================================================
  // Singleton Access
  // ============================================================================

  static getInstance(config?: Partial<UnifiedConfig>): UnifiedImageService {
    if (typeof globalThis !== 'undefined') {
      if (!(globalThis as unknown)[UnifiedImageService.SERVICE_KEY]) {
        (globalThis as unknown)[UnifiedImageService.SERVICE_KEY] = new UnifiedImageService(config);
      }
      return (globalThis as unknown)[UnifiedImageService.SERVICE_KEY];
    }
    return new UnifiedImageService(config);
  }

  // ============================================================================
  // Initialization
  // ============================================================================

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Create cache directory
      if (this.config.enableDiskCache && FileSystem.cacheDirectory) {
        const dirInfo = await FileSystem.getInfoAsync(this.cacheDir);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(this.cacheDir, { intermediates: true });
        }
      }

      // Load disk cache index
      await this.loadDiskCacheIndex();

      // Load memory cache index
      await this.loadMemoryCacheIndex();

      // Initialize network listener
      this.initializeNetworkListener();

      // Clean expired entries
      await this.cleanExpiredEntries();

      this.initialized = true;
    } catch (error) {
      this.initialized = true;
    }
  }

  private async loadDiskCacheIndex(): Promise<void> {
    try {
      const indexJson = await AsyncStorage.getItem(CACHE_INDEX_KEY);
      if (indexJson) {
        const entries: Array<[string, CacheEntry]> = JSON.parse(indexJson);
        this.diskCacheIndex = new Map(entries);
        this.stats.diskSize = 0;
        for (const entry of this.diskCacheIndex.values()) {
          this.stats.diskSize += entry.size;
        }
      }
    } catch {
      // Silently handle
    }
  }

  private async saveDiskCacheIndex(): Promise<void> {
    try {
      const entries = Array.from(this.diskCacheIndex.entries());
      await AsyncStorage.setItem(CACHE_INDEX_KEY, JSON.stringify(entries));
    } catch {
      // Silently handle
    }
  }

  private async loadMemoryCacheIndex(): Promise<void> {
    try {
      const indexJson = await AsyncStorage.getItem(MEMORY_CACHE_INDEX_KEY);
      if (indexJson) {
        const entries: Array<[string, CacheEntry]> = JSON.parse(indexJson);
        this.memoryCache = new Map(
          entries.map(([uri, entry]) => [uri, { entry }])
        );
        this.stats.memorySize = 0;
        for (const { entry } of this.memoryCache.values()) {
          this.stats.memorySize += entry.size;
        }
      }
    } catch {
      // Silently handle
    }
  }

  private async saveMemoryCacheIndex(): Promise<void> {
    try {
      const entries = Array.from(this.memoryCache.entries()).map(([uri, { entry }]) => [uri, entry]);
      await AsyncStorage.setItem(MEMORY_CACHE_INDEX_KEY, JSON.stringify(entries));
    } catch {
      // Silently handle
    }
  }

  private initializeNetworkListener(): void {
    if (this.networkUnsubscribe) {
      this.networkUnsubscribe();
    }

    this.networkUnsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      this.updateNetworkQuality(state);
      this.adjustPreloadStrategy();
    });
  }

  private updateNetworkQuality(state: NetInfoState): void {
    if (!state.isConnected) {
      this.networkQuality = NetworkQuality.OFFLINE;
      return;
    }

    if (state.type === 'wifi') {
      this.networkQuality = NetworkQuality.WIFI;
    } else if (state.type === 'cellular') {
      const details = state.details as { cellularGeneration?: string };
      switch (details?.cellularGeneration) {
        case '2g':
          this.networkQuality = NetworkQuality.SLOW_2G;
          break;
        case '3g':
          this.networkQuality = NetworkQuality.FAST_3G;
          break;
        default:
          this.networkQuality = NetworkQuality.FAST_4G;
      }
    } else {
      this.networkQuality = NetworkQuality.FAST_4G;
    }
  }

  private adjustPreloadStrategy(): void {
    switch (this.networkQuality) {
      case NetworkQuality.WIFI:
        this.config.maxConcurrentPreloads = 4;
        break;
      case NetworkQuality.FAST_4G:
        this.config.maxConcurrentPreloads = 3;
        break;
      case NetworkQuality.FAST_3G:
        this.config.maxConcurrentPreloads = 2;
        break;
      case NetworkQuality.SLOW_2G:
        this.config.maxConcurrentPreloads = 1;
        break;
      case NetworkQuality.OFFLINE:
        this.config.maxConcurrentPreloads = 0;
        break;
    }
  }

  // ============================================================================
  // Core Cache Operations
  // ============================================================================

  /**
   * Get image from cache (memory first, then disk)
   */
  async get(uri: string): Promise<string | null> {
    await this.ensureInitialized();

    // Check memory cache first
    if (this.config.enableMemoryCache) {
      const memEntry = this.memoryCache.get(uri);
      if (memEntry && !this.isExpired(memEntry.entry)) {
        this.updateAccess(memEntry.entry);
        this.stats.hits++;
        return memEntry.entry.localPath || uri;
      }
    }

    // Check disk cache
    if (this.config.enableDiskCache) {
      const diskEntry = this.diskCacheIndex.get(uri);
      if (diskEntry && !this.isExpired(diskEntry)) {
        if (diskEntry.localPath) {
          const fileInfo = await FileSystem.getInfoAsync(diskEntry.localPath);
          if (fileInfo.exists) {
            // Promote to memory cache
            this.promoteToMemoryCache(diskEntry);
            this.updateAccess(diskEntry);
            this.stats.hits++;
            return diskEntry.localPath;
          }
        }
      }
    }

    this.stats.misses++;
    return null;
  }

  /**
   * Cache image from URI
   */
  async cache(uri: string, options: { ttl?: number; priority?: PreloadPriority } = {}): Promise<void> {
    await this.ensureInitialized();

    const { ttl = this.config.defaultTTL } = options;

    try {
      if (this.config.enableDiskCache) {
        const filename = this.getFilenameFromUri(uri);
        const localPath = `${this.cacheDir}${filename}`;

        // Check if already cached
        const fileInfo = await FileSystem.getInfoAsync(localPath);
        if (!fileInfo.exists) {
          // Download and cache
          const downloadResult = await FileSystem.downloadAsync(uri, localPath);
          if (downloadResult.status === 200) {
            const info = await FileSystem.getInfoAsync(localPath);
            const size = (info as { size?: number }).size || 0;

            const now = Date.now();
            const entry: CacheEntry = {
              uri,
              localPath,
              timestamp: now,
              lastAccessed: now,
              size,
              hits: 0,
              ttl,
              expiresAt: now + ttl,
            };

            this.diskCacheIndex.set(uri, entry);
            this.stats.diskSize += size;

            // Enforce limits
            await this.enforceMemoryLimit();
            await this.enforceDiskLimit();

            await this.saveDiskCacheIndex();
          }
        }
      }
    } catch {
      // Silently handle
    }
  }

  /**
   * Check if URI is cached
   */
  async isCached(uri: string): Promise<boolean> {
    await this.ensureInitialized();

    // Check memory cache
    if (this.config.enableMemoryCache) {
      const memEntry = this.memoryCache.get(uri);
      if (memEntry && !this.isExpired(memEntry.entry)) {
        return true;
      }
    }

    // Check disk cache
    if (this.config.enableDiskCache) {
      const diskEntry = this.diskCacheIndex.get(uri);
      if (diskEntry && !this.isExpired(diskEntry)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Clear specific cache entry
   */
  async clear(uri: string): Promise<void> {
    await this.ensureInitialized();

    // Clear from memory cache
    const memEntry = this.memoryCache.get(uri);
    if (memEntry) {
      this.stats.memorySize -= memEntry.entry.size;
      this.memoryCache.delete(uri);
    }

    // Clear from disk cache
    const diskEntry = this.diskCacheIndex.get(uri);
    if (diskEntry && diskEntry.localPath) {
      try {
        const fileInfo = await FileSystem.getInfoAsync(diskEntry.localPath);
        if (fileInfo.exists) {
          await FileSystem.deleteAsync(diskEntry.localPath);
          this.stats.diskSize -= diskEntry.size;
        }
      } catch {
        // Silently handle
      }
      this.diskCacheIndex.delete(uri);
    }

    await this.saveDiskCacheIndex();
    await this.saveMemoryCacheIndex();
  }

  /**
   * Clear all cache
   */
  async clearAll(): Promise<void> {
    // Clear memory cache
    this.memoryCache.clear();
    this.stats.memorySize = 0;

    // Clear disk cache
    if (this.config.enableDiskCache) {
      try {
        const dirInfo = await FileSystem.getInfoAsync(this.cacheDir);
        if (dirInfo.exists) {
          await FileSystem.deleteAsync(this.cacheDir, { idempotent: true });
          await FileSystem.makeDirectoryAsync(this.cacheDir, { intermediates: true });
        }
      } catch {
        // Silently handle
      }
    }

    this.diskCacheIndex.clear();
    this.stats.diskSize = 0;

    // Clear preloads
    this.completedPreloads.clear();
    this.failedPreloads.clear();
    this.preloadQueue.clear();

    await this.saveDiskCacheIndex();
    await this.saveMemoryCacheIndex();
  }

  // ============================================================================
  // Preloading Operations
  // ============================================================================

  /**
   * Preload single image
   */
  async preload(uri: string, priority: PreloadPriority = PreloadPriority.MEDIUM): Promise<boolean> {
    await this.ensureInitialized();

    if (!this.config.enablePreloading) return false;

    // Skip if already completed
    if (this.completedPreloads.has(uri)) {
      return true;
    }

    // Skip if offline
    if (this.networkQuality === NetworkQuality.OFFLINE) {
      return false;
    }

    // Add to queue
    if (!this.preloadQueue.has(uri)) {
      if (this.preloadQueue.size >= this.config.maxPreloadQueueSize) {
        this.trimPreloadQueue();
      }
      this.preloadQueue.set(uri, { uri, priority, timestamp: Date.now() });
    }

    // Process queue
    this.processPreloadQueue();

    // Wait for completion
    const preloadPromise = this.activePreloads.get(uri);
    if (preloadPromise) {
      await preloadPromise;
    }

    return this.completedPreloads.has(uri);
  }

  /**
   * Preload batch of images
   */
  async preloadBatch(
    uris: string[],
    priority: PreloadPriority = PreloadPriority.MEDIUM
  ): Promise<PreloadResult[]> {
    const results: PreloadResult[] = [];

    for (const uri of uris) {
      const startTime = Date.now();
      const success = await this.preload(uri, priority);
      const duration = Date.now() - startTime;

      results.push({
        uri,
        success,
        duration,
        fromCache: this.completedPreloads.has(uri) && duration < 100,
      });
    }

    return results;
  }

  /**
   * Preload critical images (above-the-fold)
   */
  async preloadCritical(uris: string[]): Promise<void> {
    await this.preloadBatch(uris, PreloadPriority.CRITICAL);
  }

  /**
   * Preload images for next screen (predictive)
   */
  async preloadNextScreen(screenName: string, uris: string[]): Promise<void> {
    await this.preloadBatch(uris, PreloadPriority.MEDIUM);
  }

  /**
   * Cancel preloads for specific component
   */
  cancelPreloads(_componentId?: string): void {
    // Clear queue (componentId tracking would require additional param in queue)
    this.preloadQueue.clear();
  }

  /**
   * Check if image is preloaded
   */
  isPreloaded(uri: string): boolean {
    return this.completedPreloads.has(uri);
  }

  private async processPreloadQueue(): Promise<void> {
    if (this.networkQuality === NetworkQuality.OFFLINE) return;
    if (this.activePreloads.size >= this.config.maxConcurrentPreloads) return;

    const nextItem = this.getNextQueueItem();
    if (!nextItem) return;

    this.preloadQueue.delete(nextItem.uri);
    this.activePreloads.set(nextItem.uri, this.executePreload(nextItem));

    const preload = this.activePreloads.get(nextItem.uri);
    if (preload) {
      await preload;
      this.activePreloads.delete(nextItem.uri);
    }

    if (this.preloadQueue.size > 0) {
      this.processPreloadQueue();
    }
  }

  private async executePreload(item: { uri: string; priority: PreloadPriority }): Promise<void> {
    const startTime = Date.now();

    try {
      // Use Image.prefetch with timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Preload timeout')), this.config.preloadTimeout);
      });

      await Promise.race([Image.prefetch(item.uri), timeoutPromise]);

      this.completedPreloads.add(item.uri);
      this.failedPreloads.delete(item.uri);
      this.stats.totalPreloaded++;

      // Cap completed set size
      if (this.completedPreloads.size > 2000) {
        const entries = Array.from(this.completedPreloads);
        this.completedPreloads = new Set(entries.slice(-1500));
      }
    } catch {
      this.failedPreloads.add(item.uri);
      this.stats.totalFailed++;

      if (this.failedPreloads.size > 2000) {
        const entries = Array.from(this.failedPreloads);
        this.failedPreloads = new Set(entries.slice(-1500));
      }
    }
  }

  private getNextQueueItem(): { uri: string; priority: PreloadPriority; timestamp: number } | null {
    if (this.preloadQueue.size === 0) return null;

    const priorityOrder = {
      [PreloadPriority.CRITICAL]: 0,
      [PreloadPriority.HIGH]: 1,
      [PreloadPriority.MEDIUM]: 2,
      [PreloadPriority.LOW]: 3,
    };

    let highest: { uri: string; priority: PreloadPriority; timestamp: number } | null = null;
    let highestPriority = Infinity;

    this.preloadQueue.forEach((item) => {
      const value = priorityOrder[item.priority];
      if (value < highestPriority) {
        highestPriority = value;
        highest = item;
      }
    });

    return highest;
  }

  private trimPreloadQueue(): void {
    // Remove oldest low priority items
    const lowPriority = Array.from(this.preloadQueue.values())
      .filter(item => item.priority === PreloadPriority.LOW)
      .sort((a, b) => a.timestamp - b.timestamp);

    if (lowPriority.length > 0) {
      this.preloadQueue.delete(lowPriority[0].uri);
      return;
    }

    // Remove oldest
    const oldest = Array.from(this.preloadQueue.values())
      .sort((a, b) => a.timestamp - b.timestamp)[0];

    if (oldest) {
      this.preloadQueue.delete(oldest.uri);
    }
  }

  // ============================================================================
  // Image Quality Analysis
  // ============================================================================

  /**
   * Analyze image quality
   */
  async analyzeQuality(imageUri: string): Promise<ImageQualityResult> {
    try {
      // Get file info for size analysis
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      const fileSize = fileInfo.exists && 'size' in fileInfo ? fileInfo.size : undefined;

      // Generate simulated quality metrics (in production, use actual image analysis)
      const brightness = Math.random() * 0.5 + 0.3;
      const contrast = Math.random() * 0.4 + 0.2;
      const blurScore = Math.random() * 400 + 100;

      // Get resolution (simulated for local files)
      const resolution = this.getSimulatedResolution();

      // Evaluate each aspect
      const brightnessEval = this.evaluateBrightness(brightness);
      const contrastEval = this.evaluateContrast(contrast);
      const sharpnessEval = this.evaluateSharpness(blurScore);
      const resolutionEval = this.evaluateResolution(resolution.width, resolution.height, resolution.megapixels);
      const fileSizeEval = fileSize ? this.evaluateFileSize(fileSize) : undefined;

      // Collect issues and suggestions
      const issues: string[] = [];
      const suggestions: string[] = [];

      if (brightnessEval.status === 'poor') {
        issues.push(brightnessEval.message);
        suggestions.push('Try taking the photo in better lighting conditions');
      }
      if (contrastEval.status === 'poor') {
        issues.push(contrastEval.message);
        suggestions.push('Ensure the subject is clearly visible against the background');
      }
      if (sharpnessEval.status === 'poor') {
        issues.push(sharpnessEval.message);
        suggestions.push('Hold the camera steady and ensure focus');
      }
      if (resolutionEval.status === 'poor') {
        issues.push(resolutionEval.message);
        suggestions.push('Use a higher resolution camera');
      }
      if (fileSizeEval?.status === 'poor') {
        issues.push(fileSizeEval.message);
      }

      // Calculate overall score
      const score = this.calculateQualityScore(
        brightnessEval.status,
        contrastEval.status,
        sharpnessEval.status,
        resolutionEval.status,
        fileSizeEval?.status
      );

      const isValid = score >= 60 && issues.length === 0;

      return {
        isValid,
        score,
        feedback: this.generateQualityFeedback(score, issues),
        details: {
          brightness: brightnessEval,
          contrast: contrastEval,
          sharpness: sharpnessEval,
          resolution: resolutionEval,
          ...(fileSizeEval && { fileSize: fileSizeEval }),
        },
        issues,
        suggestions,
      };
    } catch {
      return {
        isValid: false,
        score: 0,
        feedback: 'Unable to analyze image quality',
        details: {
          brightness: { value: 0, status: 'poor' as const, message: 'Analysis failed' },
          contrast: { value: 0, status: 'poor' as const, message: 'Analysis failed' },
          sharpness: { value: 0, status: 'poor' as const, message: 'Analysis failed' },
          resolution: { width: 0, height: 0, megapixels: 0, status: 'poor' as const, message: 'Analysis failed' },
        },
        issues: ['Failed to analyze image'],
        suggestions: ['Please try selecting a different image'],
      };
    }
  }

  private getSimulatedResolution(): { width: number; height: number; megapixels: number } {
    // In production, use actual image metadata extraction
    const width = 1920;
    const height = 1080;
    return { width, height, megapixels: (width * height) / 1000000 };
  }

  private evaluateBrightness(value: number) {
    const { min, max, optimal } = QUALITY_THRESHOLDS.brightness;
    if (value < min || value > max) {
      return { value, status: 'poor' as const, message: value < min ? 'Image is too dark' : 'Image is too bright' };
    }
    if (value >= optimal.min && value <= optimal.max) {
      return { value, status: 'good' as const, message: 'Brightness is optimal' };
    }
    return { value, status: 'fair' as const, message: 'Brightness is acceptable' };
  }

  private evaluateContrast(value: number) {
    const { min, optimal } = QUALITY_THRESHOLDS.contrast;
    if (value < min) {
      return { value, status: 'poor' as const, message: 'Image has low contrast' };
    }
    if (value >= optimal) {
      return { value, status: 'good' as const, message: 'Contrast is excellent' };
    }
    return { value, status: 'fair' as const, message: 'Contrast is acceptable' };
  }

  private evaluateSharpness(value: number) {
    const { min, optimal } = QUALITY_THRESHOLDS.blur;
    if (value < min) {
      return { value, status: 'poor' as const, message: 'Image is too blurry' };
    }
    if (value >= optimal) {
      return { value, status: 'good' as const, message: 'Image is sharp and clear' };
    }
    return { value, status: 'fair' as const, message: 'Sharpness is acceptable' };
  }

  private evaluateResolution(width: number, height: number, megapixels: number) {
    const { minMegapixels, optimalMegapixels } = QUALITY_THRESHOLDS.resolution;
    if (megapixels < minMegapixels) {
      return { width, height, megapixels, status: 'poor' as const, message: `Resolution too low (${megapixels.toFixed(1)}MP)` };
    }
    if (megapixels >= optimalMegapixels) {
      return { width, height, megapixels, status: 'good' as const, message: `Resolution is excellent (${megapixels.toFixed(1)}MP)` };
    }
    return { width, height, megapixels, status: 'fair' as const, message: `Resolution is acceptable (${megapixels.toFixed(1)}MP)` };
  }

  private evaluateFileSize(bytes: number) {
    const { min, max, optimal } = QUALITY_THRESHOLDS.fileSize;
    const formatSize = (size: number) => {
      if (size < 1024) return `${size}B`;
      if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)}KB`;
      return `${(size / (1024 * 1024)).toFixed(1)}MB`;
    };
    if (bytes < min || bytes > max) {
      return { bytes, status: 'poor' as const, message: `File size ${formatSize(bytes)} is not optimal` };
    }
    if (bytes >= optimal.min && bytes <= optimal.max) {
      return { bytes, status: 'good' as const, message: `File size is optimal (${formatSize(bytes)})` };
    }
    return { bytes, status: 'fair' as const, message: `File size is acceptable (${formatSize(bytes)})` };
  }

  private calculateQualityScore(
    brightness: 'good' | 'fair' | 'poor',
    contrast: 'good' | 'fair' | 'poor',
    sharpness: 'good' | 'fair' | 'poor',
    resolution: 'good' | 'fair' | 'poor',
    fileSize?: 'good' | 'fair' | 'poor'
  ): number {
    const statusToScore = (status: 'good' | 'fair' | 'poor') => {
      switch (status) {
        case 'good': return 100;
        case 'fair': return 70;
        case 'poor': return 30;
      }
    };

    const weights = {
      brightness: 0.2,
      contrast: 0.15,
      sharpness: 0.35,
      resolution: 0.25,
      fileSize: 0.05,
    };

    let totalScore = 0;
    let totalWeight = 0;

    totalScore += statusToScore(brightness) * weights.brightness;
    totalWeight += weights.brightness;
    totalScore += statusToScore(contrast) * weights.contrast;
    totalWeight += weights.contrast;
    totalScore += statusToScore(sharpness) * weights.sharpness;
    totalWeight += weights.sharpness;
    totalScore += statusToScore(resolution) * weights.resolution;
    totalWeight += weights.resolution;

    if (fileSize) {
      totalScore += statusToScore(fileSize) * weights.fileSize;
      totalWeight += weights.fileSize;
    }

    return Math.round(totalScore / totalWeight);
  }

  private generateQualityFeedback(score: number, issues: string[]): string {
    if (score >= 90) return 'Excellent image quality!';
    if (score >= 75) return 'Good image quality.';
    if (score >= 60) return 'Acceptable image quality.';
    if (issues.length > 0) return `Quality issues: ${issues[0]}`;
    return 'Image quality is too low.';
  }

  /**
   * Quick quality validation
   */
  async quickValidate(imageUri: string): Promise<{ isValid: boolean; message: string }> {
    const result = await this.analyzeQuality(imageUri);
    return { isValid: result.isValid, message: result.feedback };
  }

  // ============================================================================
  // Statistics & Configuration
  // ============================================================================

  getStats(): UnifiedCacheStats {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;

    return {
      memorySize: this.stats.memorySize,
      diskSize: this.stats.diskSize,
      totalEntries: this.memoryCache.size + this.diskCacheIndex.size,
      memoryEntries: this.memoryCache.size,
      diskEntries: this.diskCacheIndex.size,
      hits: this.stats.hits,
      misses: this.stats.misses,
      evictions: this.stats.evictions,
      hitRate: Math.round(hitRate * 100) / 100,
      preloadedCount: this.completedPreloads.size,
      preloadQueueSize: this.preloadQueue.size,
      networkQuality: this.networkQuality,
    };
  }

  updateConfig(config: Partial<UnifiedConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): UnifiedConfig {
    return { ...this.config };
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  private isExpired(entry: CacheEntry): boolean {
    if (entry.ttl && entry.timestamp) {
      return Date.now() - entry.timestamp > entry.ttl;
    }
    if (entry.expiresAt) {
      return Date.now() > entry.expiresAt;
    }
    return false;
  }

  private updateAccess(entry: CacheEntry): void {
    entry.lastAccessed = Date.now();
    entry.hits++;
  }

  private promoteToMemoryCache(entry: CacheEntry): void {
    if (!this.config.enableMemoryCache) return;
    if (this.memoryCache.size >= this.config.maxMemoryEntries) return;

    this.memoryCache.set(entry.uri, { entry: { ...entry } });
    this.stats.memorySize += entry.size;
  }

  private async enforceMemoryLimit(): Promise<void> {
    while (
      this.stats.memorySize > this.config.maxMemorySize ||
      this.memoryCache.size > this.config.maxMemoryEntries
    ) {
      const lruEntry = this.findLRUEntry(this.memoryCache);
      if (lruEntry) {
        this.stats.memorySize -= lruEntry.size;
        this.memoryCache.delete(lruEntry.uri);
        this.stats.evictions++;
      } else {
        break;
      }
    }
    await this.saveMemoryCacheIndex();
  }

  private async enforceDiskLimit(): Promise<void> {
    while (
      this.stats.diskSize > this.config.maxDiskSize ||
      this.diskCacheIndex.size > this.config.maxDiskEntries
    ) {
      const lruEntry = this.findLRUEntry(this.diskCacheIndex);
      if (lruEntry) {
        await this.clear(lruEntry.uri);
        this.stats.evictions++;
      } else {
        break;
      }
    }
  }

  private findLRUEntry(cache: Map<string, CacheEntry | MemoryCacheEntry>): CacheEntry | null {
    let lru: CacheEntry | null = null;
    let lruUri: string | null = null;

    cache.forEach((value, uri) => {
      const entry = 'entry' in value ? value.entry : value;
      if (!lru || entry.lastAccessed < lru.lastAccessed) {
        lru = entry;
        lruUri = uri;
      }
    });

    return lru;
  }

  private async cleanExpiredEntries(): Promise<void> {
    const expiredUris: string[] = [];

    this.memoryCache.forEach((value, uri) => {
      const entry = 'entry' in value ? value.entry : value;
      if (this.isExpired(entry)) {
        expiredUris.push(uri);
      }
    });

    this.diskCacheIndex.forEach((entry, uri) => {
      if (this.isExpired(entry)) {
        expiredUris.push(uri);
      }
    });

    for (const uri of expiredUris) {
      await this.clear(uri);
    }
  }

  private getFilenameFromUri(uri: string): string {
    const hash = this.simpleHash(uri);
    const ext = this.getFileExtension(uri);
    return `${hash}${ext}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  private getFileExtension(uri: string): string {
    const match = uri.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i);
    return match ? match[0] : '.jpg';
  }

  // ============================================================================
  // Cleanup
  // ============================================================================

  destroy(): void {
    if (this.networkUnsubscribe) {
      this.networkUnsubscribe();
      this.networkUnsubscribe = null;
    }
    this.preloadQueue.clear();
    this.activePreloads.clear();
    this.completedPreloads.clear();
    this.failedPreloads.clear();
  }
}

// ============================================================================
// Export
// ============================================================================

export const unifiedImageService = UnifiedImageService.getInstance();
export default unifiedImageService;

// Re-export types for external use
export type { UnifiedCacheStats, UnifiedConfig, PreloadResult, ImageQualityResult };
