// Secure and reliable storage utilities for production

export interface StorageError {
  code: 'QUOTA_EXCEEDED' | 'STORAGE_UNAVAILABLE' | 'PARSING_ERROR' | 'UNKNOWN';
  message: string;
}

export class SecureStorage {
  private key: string;
  private maxSize: number; // in bytes
  
  constructor(key: string, maxSize: number = 4 * 1024 * 1024) { // 4MB default
    this.key = key;
    this.maxSize = maxSize;
  }
  
  isAvailable(): boolean {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }
  
  getSize(): number {
    try {
      const data = localStorage.getItem(this.key);
      return data ? new Blob([data]).size : 0;
    } catch {
      return 0;
    }
  }
  
  async setItem<T>(value: T): Promise<{ success: boolean; error?: StorageError }> {
    if (!this.isAvailable()) {
      return {
        success: false,
        error: {
          code: 'STORAGE_UNAVAILABLE',
          message: 'Local storage is not available'
        }
      };
    }
    
    try {
      const serialized = JSON.stringify(value);
      const size = new Blob([serialized]).size;
      
      if (size > this.maxSize) {
        return {
          success: false,
          error: {
            code: 'QUOTA_EXCEEDED',
            message: `Data size (${size} bytes) exceeds maximum allowed size (${this.maxSize} bytes)`
          }
        };
      }
      
      localStorage.setItem(this.key, serialized);
      return { success: true };
    } catch (error: any) {
      if (error.name === 'QuotaExceededError') {
        return {
          success: false,
          error: {
            code: 'QUOTA_EXCEEDED',
            message: 'Storage quota exceeded'
          }
        };
      }
      
      return {
        success: false,
        error: {
          code: 'UNKNOWN',
          message: error.message || 'Unknown storage error'
        }
      };
    }
  }
  
  getItem<T>(): { data: T | null; error?: StorageError } {
    if (!this.isAvailable()) {
      return {
        data: null,
        error: {
          code: 'STORAGE_UNAVAILABLE',
          message: 'Local storage is not available'
        }
      };
    }
    
    try {
      const stored = localStorage.getItem(this.key);
      if (!stored) return { data: null };
      
      const parsed = JSON.parse(stored) as T;
      return { data: parsed };
    } catch (error: any) {
      return {
        data: null,
        error: {
          code: 'PARSING_ERROR',
          message: 'Failed to parse stored data'
        }
      };
    }
  }
  
  removeItem(): boolean {
    try {
      localStorage.removeItem(this.key);
      return true;
    } catch {
      return false;
    }
  }
  
  clear(): boolean {
    try {
      localStorage.clear();
      return true;
    } catch {
      return false;
    }
  }
  
  // Automatic cleanup of old data
  cleanup<T extends { id: number; time: string }>(
    data: T[], 
    maxItems: number = 1000,
    maxAge: number = 30 * 24 * 60 * 60 * 1000 // 30 days
  ): T[] {
    const now = Date.now();
    
    // Remove items older than maxAge
    let filtered = data.filter(item => {
      const itemTime = new Date(item.time).getTime();
      return (now - itemTime) < maxAge;
    });
    
    // Keep only the most recent maxItems
    if (filtered.length > maxItems) {
      filtered = filtered
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        .slice(0, maxItems);
    }
    
    return filtered;
  }
}

// Export singleton instance for posts
export const postsStorage = new SecureStorage('community_posts', 5 * 1024 * 1024); // 5MB