import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Network from 'expo-network';
import { OfflineAction, SyncStatus, Draft, Post } from '../types';
import { api } from './api';

const OFFLINE_QUEUE_KEY = 'offline_queue';
const CACHED_DRAFTS_KEY = 'cached_drafts';
const CACHED_POSTS_KEY = 'cached_posts';

class OfflineService {
  private syncInterval: NodeJS.Timeout | null = null;

  async isOnline(): Promise<boolean> {
    try {
      const networkState = await Network.getNetworkStateAsync();
      return networkState.isConnected ?? false;
    } catch {
      return false;
    }
  }

  async getSyncStatus(): Promise<SyncStatus> {
    const pendingActions = await this.getPendingActions();
    const lastSync = await AsyncStorage.getItem('last_sync_at');
    const isOnline = await this.isOnline();

    return {
      lastSyncAt: lastSync || new Date().toISOString(),
      pendingActions: pendingActions.length,
      isOnline,
    };
  }

  // Offline Queue
  async addToQueue(action: Omit<OfflineAction, 'id' | 'timestamp' | 'synced'>): Promise<void> {
    const queue = await this.getPendingActions();
    const newAction: OfflineAction = {
      ...action,
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      synced: false,
    };
    queue.push(newAction);
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  }

  async getPendingActions(): Promise<OfflineAction[]> {
    const data = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  }

  async removeFromQueue(id: string): Promise<void> {
    const queue = await this.getPendingActions();
    const filtered = queue.filter((a) => a.id !== id);
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(filtered));
  }

  async clearQueue(): Promise<void> {
    await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
  }

  // Draft Caching
  async cacheDraft(draft: Draft): Promise<void> {
    const drafts = await this.getCachedDrafts();
    const index = drafts.findIndex((d) => d.id === draft.id);
    if (index >= 0) {
      drafts[index] = draft;
    } else {
      drafts.push(draft);
    }
    await AsyncStorage.setItem(CACHED_DRAFTS_KEY, JSON.stringify(drafts));
  }

  async getCachedDrafts(): Promise<Draft[]> {
    const data = await AsyncStorage.getItem(CACHED_DRAFTS_KEY);
    return data ? JSON.parse(data) : [];
  }

  async removeCachedDraft(id: string): Promise<void> {
    const drafts = await this.getCachedDrafts();
    const filtered = drafts.filter((d) => d.id !== id);
    await AsyncStorage.setItem(CACHED_DRAFTS_KEY, JSON.stringify(filtered));
  }

  // Post Caching
  async cachePosts(posts: Post[]): Promise<void> {
    await AsyncStorage.setItem(CACHED_POSTS_KEY, JSON.stringify(posts));
    await AsyncStorage.setItem('last_sync_at', new Date().toISOString());
  }

  async getCachedPosts(): Promise<Post[]> {
    const data = await AsyncStorage.getItem(CACHED_POSTS_KEY);
    return data ? JSON.parse(data) : [];
  }

  // Sync Logic
  async syncQueue(): Promise<{ success: number; failed: number }> {
    const isOnline = await this.isOnline();
    if (!isOnline) {
      return { success: 0, failed: 0 };
    }

    const queue = await this.getPendingActions();
    let success = 0;
    let failed = 0;

    for (const action of queue) {
      try {
        await this.executeAction(action);
        await this.removeFromQueue(action.id);
        success++;
      } catch (error) {
        logger.error(`Failed to sync action ${action.id}:`, error);
        failed++;
      }
    }

    // Update sync timestamp
    await AsyncStorage.setItem('last_sync_at', new Date().toISOString());

    return { success, failed };
  }

  private async executeAction(action: OfflineAction): Promise<void> {
    switch (action.type) {
      case 'create_post':
        await api.createPost(action.payload);
        break;
      case 'update_post':
        await api.updatePost(action.payload.id, action.payload.data);
        break;
      case 'delete_post':
        await api.deletePost(action.payload.id);
        break;
      case 'sync_media':
        await api.uploadMedia(action.payload.uri, action.payload.type);
        break;
    }
  }

  // Start background sync
  startBackgroundSync(intervalMs: number = 60000): void {
    if (this.syncInterval) return;

    this.syncInterval = setInterval(async () => {
      const isOnline = await this.isOnline();
      if (isOnline) {
        await this.syncQueue();
      }
    }, intervalMs);
  }

  stopBackgroundSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // Cache latest data for offline access
  async cacheDataForOffline(): Promise<void> {
    const isOnline = await this.isOnline();
    if (!isOnline) return;

    try {
      const [posts, drafts] = await Promise.all([
        api.getPosts(),
        api.getDrafts(),
      ]);

      await Promise.all([
        this.cachePosts(posts),
        Promise.all(drafts.map((d) => this.cacheDraft(d))),
      ]);
    } catch (error) {
      logger.error('Failed to cache data for offline:', error);
    }
  }
}

export const offline = new OfflineService();
