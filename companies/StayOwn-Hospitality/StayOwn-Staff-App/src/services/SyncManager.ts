import { logger } from '../../shared/logger';
/**
 * Sync Manager for StayOwn Staff App
 *
 * Orchestrates offline data synchronization with:
 * - Automatic sync when online
 * - Manual sync trigger
 * - Conflict resolution
 * - Background sync
 * - Sync status notifications
 */

import { v4 as uuidv4 } from 'uuid';
import OfflineStorage from './OfflineStorage';
import apiService from './ApiService';
import {
  SyncOperation,
  PendingOperation,
  Conflict,
  SyncState,
  SyncResult,
  OperationType,
  EntityType,
  ConflictStrategy,
  Priority,
  Room,
  HousekeepingTask,
  MaintenanceIssue,
  ServiceRequest,
  Message,
} from '../types';

// Sync events for listeners
type SyncEventType = 'sync_start' | 'sync_complete' | 'sync_error' | 'conflict_detected' | 'online_status_change';

interface SyncEvent {
  type: SyncEventType;
  data?: any;
  timestamp: string;
}

class SyncManager {
  private listeners: Map<string, (event: SyncEvent) => void> = new Map();
  private isOnline: boolean = true;
  private isSyncing: boolean = false;
  private autoSyncInterval: NodeJS.Timeout | null = null;
  private syncDebounceTimer: NodeJS.Timeout | null = null;
  private deviceId: string | null = null;
  private staffId: string | null = null;
  private hotelId: string | null = null;

  // ----------------------------------------
  // INITIALIZATION
  // ----------------------------------------

  async initialize(deviceId: string, staffId: string, hotelId: string): Promise<void> {
    this.deviceId = deviceId;
    this.staffId = staffId;
    this.hotelId = hotelId;

    // Configure API service
    apiService.setDevice(deviceId);
    apiService.setStaff(staffId);

    // Register device with server
    await this.registerDevice();

    // Check initial online status
    await this.checkOnlineStatus();

    // Start auto-sync
    this.startAutoSync();
  }

  private async registerDevice(): Promise<void> {
    try {
      const deviceInfo = await OfflineStorage.getDeviceInfo();
      if (deviceInfo) {
        await apiService.registerDevice({
          deviceId: deviceInfo.deviceId,
          staffId: this.staffId!,
          deviceType: deviceInfo.deviceType,
          appVersion: deviceInfo.appVersion,
        });
      }
    } catch (error) {
      logger.error('[SyncManager] Failed to register device:', error);
    }
  }

  // ----------------------------------------
  // EVENT LISTENERS
  // ----------------------------------------

  addEventListener(id: string, callback: (event: SyncEvent) => void): void {
    this.listeners.set(id, callback);
  }

  removeEventListener(id: string): void {
    this.listeners.delete(id);
  }

  private emit(type: SyncEventType, data?: any): void {
    const event: SyncEvent = {
      type,
      data,
      timestamp: new Date().toISOString(),
    };
    this.listeners.forEach((callback) => callback(event));
  }

  // ----------------------------------------
  // NETWORK STATUS
  // ----------------------------------------

  async checkOnlineStatus(): Promise<boolean> {
    const wasOnline = this.isOnline;
    this.isOnline = await apiService.isOnline();

    if (wasOnline !== this.isOnline) {
      this.emit('online_status_change', { isOnline: this.isOnline });

      if (this.isOnline) {
        // Came back online - trigger sync
        await this.scheduleSync();
      }
    }

    await OfflineStorage.updateSyncState({ isOnline: this.isOnline });
    return this.isOnline;
  }

  isNetworkOnline(): boolean {
    return this.isOnline;
  }

  // ----------------------------------------
  // AUTO SYNC
  // ----------------------------------------

  startAutoSync(intervalMs: number = 30000): void {
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
    }

    // Auto sync every interval
    this.autoSyncInterval = setInterval(async () => {
      if (this.isOnline && !this.isSyncing) {
        const pendingCount = await OfflineStorage.getPendingCount();
        if (pendingCount > 0) {
          logger.info('[SyncManager] Auto-sync: pushing pending operations');
          await this.pushChanges();
        }
      }
    }, intervalMs);

    // Also sync when app comes to foreground
    // This would be triggered by AppState listener in the app
  }

  stopAutoSync(): void {
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
      this.autoSyncInterval = null;
    }
  }

  // ----------------------------------------
  // SYNC TRIGGERS
  // ----------------------------------------

  async triggerSync(): Promise<SyncResult> {
    if (this.isSyncing) {
      return { success: false, pushed: 0, pulled: 0, conflicts: 0, errors: ['Sync already in progress'] };
    }

    return this.performFullSync();
  }

  private scheduleSync(debounceMs: number = 1000): void {
    if (this.syncDebounceTimer) {
      clearTimeout(this.syncDebounceTimer);
    }

    this.syncDebounceTimer = setTimeout(() => {
      this.triggerSync();
    }, debounceMs);
  }

  // ----------------------------------------
  // FULL SYNC
  // ----------------------------------------

  async performFullSync(): Promise<SyncResult> {
    if (!this.isOnline) {
      return { success: false, pushed: 0, pulled: 0, conflicts: 0, errors: ['Device is offline'] };
    }

    this.isSyncing = true;
    this.emit('sync_start', {});
    await OfflineStorage.updateSyncState({ isSyncing: true });

    const result: SyncResult = {
      success: true,
      pushed: 0,
      pulled: 0,
      conflicts: 0,
      errors: [],
    };

    try {
      // Step 1: Push local changes
      const pushResult = await this.pushChanges();
      result.pushed = pushResult.pushed;
      result.conflicts = pushResult.conflicts;
      result.errors.push(...pushResult.errors);

      // Step 2: Pull server changes
      const pullResult = await this.pullChanges();
      result.pulled = pullResult.pulled;
      result.errors.push(...pullResult.errors);

      // Update sync state
      await OfflineStorage.setLastSync(new Date().toISOString());
      await OfflineStorage.updateSyncState({
        lastSync: new Date().toISOString(),
        isSyncing: false,
        pendingOperations: await OfflineStorage.getPendingCount(),
        conflicts: (await OfflineStorage.getPendingConflicts()).length,
      });

      this.emit('sync_complete', result);
    } catch (error: any) {
      result.success = false;
      result.errors.push(error.message);
      this.emit('sync_error', { error: error.message });
    } finally {
      this.isSyncing = false;
      await OfflineStorage.updateSyncState({ isSyncing: false });
    }

    return result;
  }

  // ----------------------------------------
  // PUSH CHANGES
  // ----------------------------------------

  async pushChanges(): Promise<{ pushed: number; conflicts: number; errors: string[] }> {
    const result = { pushed: 0, conflicts: 0, errors: [] as string[] };

    if (!this.isOnline || !this.deviceId || !this.staffId) {
      return { ...result, errors: ['Not ready for sync'] };
    }

    // Get pending operations
    const queue = await OfflineStorage.getOperationQueue();
    const pendingOps = queue.filter((op) => op.status === 'pending');

    if (pendingOps.length === 0) {
      return result;
    }

    // Convert to sync operations
    const operations: SyncOperation[] = pendingOps.map((op) => ({
      id: op.id,
      staffId: this.staffId!,
      deviceId: this.deviceId!,
      operationType: op.operationType,
      entityType: op.entityType,
      entityId: op.entityId,
      data: op.data,
      priority: op.priority,
      conflictStrategy: 'SERVER_WINS',
      timestamp: op.timestamp,
      clientVersion: await OfflineStorage.getDataVersion(op.entityType, op.entityId),
      status: 'pending',
      createdAt: op.timestamp,
    }));

    try {
      const response = await apiService.pushOperations(operations);

      if (response.success && response.data) {
        const { results, conflicts } = response.data;

        // Process results
        for (const res of results || []) {
          if (res.status === 'completed') {
            await OfflineStorage.removeFromQueue(res.id);
            result.pushed++;

            // Update local version
            if (res.serverVersion) {
              const op = pendingOps.find((o) => o.id === res.id);
              if (op) {
                await OfflineStorage.setDataVersion(op.entityType, op.entityId, res.serverVersion);
              }
            }
          } else if (res.status === 'conflict') {
            await OfflineStorage.updateQueueOperation(res.id, { status: 'conflict' });
            result.conflicts++;
            this.emit('conflict_detected', { operationId: res.id, conflictId: res.conflictId });
          } else if (res.status === 'failed') {
            const error = res.error || 'Unknown error';
            await OfflineStorage.updateQueueOperation(res.id, {
              status: 'failed',
              error,
              retryCount: (pendingOps.find((o) => o.id === res.id)?.retryCount || 0) + 1,
            });
            result.errors.push(`${res.id}: ${error}`);
          }
        }

        // Handle conflicts
        for (const conflict of conflicts || []) {
          await OfflineStorage.addConflict({
            id: conflict.conflictId,
            operationId: conflict.operationId,
            entityType: pendingOps.find((o) => o.id === conflict.operationId)?.entityType || 'room',
            entityId: pendingOps.find((o) => o.id === conflict.operationId)?.entityId || '',
            serverData: conflict.serverData || {},
            clientData: {},
            resolution: 'pending',
            createdAt: new Date().toISOString(),
          });
        }
      } else {
        result.errors.push(response.error?.message || 'Push failed');
      }
    } catch (error: any) {
      result.errors.push(error.message);
    }

    return result;
  }

  // ----------------------------------------
  // PULL CHANGES
  // ----------------------------------------

  async pullChanges(): Promise<{ pulled: number; errors: string[] }> {
    const result = { pulled: 0, errors: [] as string[] };

    if (!this.isOnline || !this.staffId) {
      return { ...result, errors: ['Not ready for sync'] };
    }

    try {
      const lastSync = await OfflineStorage.getLastSync();
      const response = await apiService.pullChanges(lastSync, undefined);

      if (response.success && response.data) {
        const { changes } = response.data;

        // Apply changes to local storage
        for (const [entityType, entities] of Object.entries(changes || {})) {
          const entityList = entities as any[];
          for (const entity of entityList) {
            await this.applyServerChange(entityType as EntityType, entity);
            result.pulled++;
          }
        }
      } else {
        result.errors.push(response.error?.message || 'Pull failed');
      }
    } catch (error: any) {
      result.errors.push(error.message);
    }

    return result;
  }

  private async applyServerChange(entityType: EntityType, entity: any): Promise<void> {
    const { entityId, data, version, isDeleted } = entity;

    if (isDeleted) {
      // Handle deletion based on entity type
      switch (entityType) {
        case 'room':
          await this.deleteRoom(entityId);
          break;
        case 'housekeeping':
          await this.deleteHousekeepingTask(entityId);
          break;
        case 'maintenance':
          await this.deleteMaintenanceIssue(entityId);
          break;
        case 'service_request':
          await this.deleteServiceRequest(entityId);
          break;
      }
    } else {
      // Apply update
      switch (entityType) {
        case 'room':
          await OfflineStorage.saveRoom({ ...data, version, lastModified: new Date().toISOString() } as Room);
          break;
        case 'housekeeping':
          await OfflineStorage.saveHousekeepingTask({ ...data, version, lastModified: new Date().toISOString() } as HousekeepingTask);
          break;
        case 'maintenance':
          await OfflineStorage.saveMaintenanceIssue({ ...data, version, lastModified: new Date().toISOString() } as MaintenanceIssue);
          break;
        case 'service_request':
          await OfflineStorage.saveServiceRequest({ ...data, version, lastModified: new Date().toISOString() } as ServiceRequest);
          break;
      }
    }

    // Update version tracking
    await OfflineStorage.setDataVersion(entityType, entityId, version);
  }

  // ----------------------------------------
  // ENTITY OPERATIONS (with offline support)
  // ----------------------------------------

  async updateRoom(roomId: string, updates: Partial<Room>, priority: Priority = 'normal'): Promise<void> {
    // Get current version
    const currentVersion = await OfflineStorage.getDataVersion('room', roomId);

    // Apply locally first (optimistic update)
    await OfflineStorage.updateRoom(roomId, updates);

    // Queue sync operation
    await OfflineStorage.addToQueue(
      'ROOM_STATUS_UPDATE',
      'room',
      roomId,
      { ...updates, version: currentVersion + 1 },
      priority,
      'SERVER_WINS'
    );

    // Increment local version
    await OfflineStorage.incrementDataVersion('room', roomId);

    // Schedule sync
    if (this.isOnline) {
      this.scheduleSync();
    }
  }

  async updateHousekeepingTask(
    taskId: string,
    updates: Partial<HousekeepingTask>,
    priority: Priority = 'normal'
  ): Promise<void> {
    const currentVersion = await OfflineStorage.getDataVersion('housekeeping', taskId);

    await OfflineStorage.updateHousekeepingTask(taskId, updates);

    await OfflineStorage.addToQueue(
      'HOUSEKEEPING_TASK_UPDATE',
      'housekeeping',
      taskId,
      { ...updates, version: currentVersion + 1 },
      priority,
      'SERVER_WINS'
    );

    await OfflineStorage.incrementDataVersion('housekeeping', taskId);

    if (this.isOnline) {
      this.scheduleSync();
    }
  }

  async createMaintenanceIssue(
    issue: Omit<MaintenanceIssue, 'id' | 'version' | 'lastModified'>,
    priority: Priority = 'high'
  ): Promise<string> {
    const issueId = uuidv4();
    const now = new Date().toISOString();

    const fullIssue: MaintenanceIssue = {
      ...issue,
      id: issueId,
      version: 1,
      lastModified: now,
    };

    await OfflineStorage.saveMaintenanceIssue(fullIssue);

    await OfflineStorage.addToQueue(
      'MAINTENANCE_ISSUE_CREATE',
      'maintenance',
      issueId,
      fullIssue,
      priority,
      'CLIENT_WINS' // Client-created data should generally win
    );

    await OfflineStorage.setDataVersion('maintenance', issueId, 1);

    if (this.isOnline) {
      this.scheduleSync();
    }

    return issueId;
  }

  async updateMaintenanceIssue(
    issueId: string,
    updates: Partial<MaintenanceIssue>,
    priority: Priority = 'normal'
  ): Promise<void> {
    const currentVersion = await OfflineStorage.getDataVersion('maintenance', issueId);

    await OfflineStorage.updateMaintenanceIssue(issueId, updates);

    await OfflineStorage.addToQueue(
      'MAINTENANCE_ISSUE_UPDATE',
      'maintenance',
      issueId,
      { ...updates, version: currentVersion + 1 },
      priority,
      'SERVER_WINS'
    );

    await OfflineStorage.incrementDataVersion('maintenance', issueId);

    if (this.isOnline) {
      this.scheduleSync();
    }
  }

  async completeServiceRequest(
    requestId: string,
    notes?: string,
    priority: Priority = 'normal'
  ): Promise<void> {
    const updates = {
      status: 'completed' as const,
      completedAt: new Date().toISOString(),
      notes,
    };

    await OfflineStorage.updateServiceRequest(requestId, updates);

    await OfflineStorage.addToQueue(
      'TASK_COMPLETE',
      'service_request',
      requestId,
      updates,
      priority,
      'SERVER_WINS'
    );

    await OfflineStorage.incrementDataVersion('service_request', requestId);

    if (this.isOnline) {
      this.scheduleSync();
    }
  }

  async sendMessage(
    content: string,
    guestId?: string,
    roomNumber?: string,
    priority: Priority = 'normal'
  ): Promise<string> {
    const messageId = uuidv4();
    const now = new Date().toISOString();
    const staffInfo = await OfflineStorage.getStaffInfo();

    const message: Message = {
      id: messageId,
      guestId,
      roomNumber,
      senderType: 'staff',
      senderId: staffInfo?.id || 'unknown',
      senderName: staffInfo?.name || 'Staff',
      content,
      timestamp: now,
      read: true,
    };

    await OfflineStorage.addMessage(message);

    await OfflineStorage.addToQueue(
      'MESSAGE_SEND',
      'message',
      messageId,
      message,
      priority,
      'CLIENT_WINS'
    );

    if (this.isOnline) {
      this.scheduleSync();
    }

    return messageId;
  }

  // ----------------------------------------
  // CONFLICT RESOLUTION
  // ----------------------------------------

  async getPendingConflicts(): Promise<Conflict[]> {
    return OfflineStorage.getPendingConflicts();
  }

  async resolveConflict(
    conflictId: string,
    resolution: 'server_wins' | 'client_wins' | 'merged',
    mergedData?: any
  ): Promise<void> {
    // Update local storage
    await OfflineStorage.resolveConflict(conflictId, resolution, mergedData);

    // Also notify server
    if (this.isOnline) {
      try {
        await apiService.resolveConflict(conflictId, resolution, mergedData);
      } catch (error) {
        logger.error('[SyncManager] Failed to resolve conflict on server:', error);
      }
    }
  }

  // ----------------------------------------
  // INITIAL DATA LOAD
  // ----------------------------------------

  async loadInitialData(): Promise<void> {
    if (!this.isOnline || !this.hotelId) {
      logger.info('[SyncManager] Skipping initial load - offline or no hotel ID');
      return;
    }

    try {
      // Load rooms
      const roomsResponse = await apiService.getRooms(this.hotelId);
      if (roomsResponse.success && roomsResponse.data) {
        await OfflineStorage.saveRooms(roomsResponse.data);
        for (const room of roomsResponse.data) {
          await OfflineStorage.setDataVersion('room', room.id, room.version);
        }
      }

      // Load housekeeping tasks
      const hkResponse = await apiService.getHousekeepingTasks(this.hotelId);
      if (hkResponse.success && hkResponse.data) {
        await OfflineStorage.saveHousekeepingTasks(hkResponse.data);
        for (const task of hkResponse.data) {
          await OfflineStorage.setDataVersion('housekeeping', task.id, task.version);
        }
      }

      // Load maintenance issues
      const maintResponse = await apiService.getMaintenanceIssues(this.hotelId);
      if (maintResponse.success && maintResponse.data) {
        await OfflineStorage.saveMaintenanceIssues(maintResponse.data);
        for (const issue of maintResponse.data) {
          await OfflineStorage.setDataVersion('maintenance', issue.id, issue.version);
        }
      }

      // Load service requests
      const srResponse = await apiService.getServiceRequests(this.hotelId);
      if (srResponse.success && srResponse.data) {
        await OfflineStorage.saveServiceRequests(srResponse.data);
        for (const req of srResponse.data) {
          await OfflineStorage.setDataVersion('service_request', req.id, req.version);
        }
      }

      // Load messages
      const msgResponse = await apiService.getMessages(this.hotelId);
      if (msgResponse.success && msgResponse.data) {
        await OfflineStorage.saveMessages(msgResponse.data);
      }

      await OfflineStorage.setLastSync(new Date().toISOString());
      logger.info('[SyncManager] Initial data loaded successfully');
    } catch (error) {
      logger.error('[SyncManager] Failed to load initial data:', error);
    }
  }

  // ----------------------------------------
  // DELETE HELPERS
  // ----------------------------------------

  private async deleteRoom(roomId: string): Promise<void> {
    const rooms = await OfflineStorage.getRooms();
    const filtered = rooms.filter((r) => r.id !== roomId);
    await OfflineStorage.saveRooms(filtered);
  }

  private async deleteHousekeepingTask(taskId: string): Promise<void> {
    const tasks = await OfflineStorage.getHousekeepingTasks();
    const filtered = tasks.filter((t) => t.id !== taskId);
    await OfflineStorage.saveHousekeepingTasks(filtered);
  }

  private async deleteMaintenanceIssue(issueId: string): Promise<void> {
    const issues = await OfflineStorage.getMaintenanceIssues();
    const filtered = issues.filter((i) => i.id !== issueId);
    await OfflineStorage.saveMaintenanceIssues(filtered);
  }

  private async deleteServiceRequest(requestId: string): Promise<void> {
    const requests = await OfflineStorage.getServiceRequests();
    const filtered = requests.filter((r) => r.id !== requestId);
    await OfflineStorage.saveServiceRequests(filtered);
  }

  // ----------------------------------------
  // STATUS
  // ----------------------------------------

  getSyncState(): Promise<SyncState> {
    return OfflineStorage.getSyncState();
  }

  getPendingOperations(): Promise<PendingOperation[]> {
    return OfflineStorage.getOperationQueue();
  }

  isCurrentlySyncing(): boolean {
    return this.isSyncing;
  }

  // ----------------------------------------
  // CLEANUP
  // ----------------------------------------

  async cleanup(): Promise<void> {
    this.stopAutoSync();
    if (this.syncDebounceTimer) {
      clearTimeout(this.syncDebounceTimer);
    }
    await OfflineStorage.clearCompletedOperations();
  }
}

// Export singleton
export const syncManager = new SyncManager();

export default syncManager;
