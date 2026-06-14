import { logger } from '../../shared/logger';
/**
 * Offline Storage Service for StayOwn Staff App
 *
 * Handles local data persistence with:
 * - Indexed data stores by entity type
 * - Operation queue for offline changes
 * - Conflict tracking
 * - Network-aware sync
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import {
  SyncOperation,
  PendingOperation,
  Conflict,
  Room,
  HousekeepingTask,
  MaintenanceIssue,
  ServiceRequest,
  Message,
  SyncState,
  OperationType,
  EntityType,
  ConflictStrategy,
  Priority,
} from '../types';

// Storage keys
const KEYS = {
  ROOMS: '@stayown:rooms',
  HOUSEKEEPING: '@stayown:housekeeping',
  MAINTENANCE: '@stayown:maintenance',
  SERVICE_REQUESTS: '@stayown:service_requests',
  MESSAGES: '@stayown:messages',
  OPERATION_QUEUE: '@stayown:operation_queue',
  CONFLICTS: '@stayown:conflicts',
  SYNC_STATE: '@stayown:sync_state',
  DEVICE_INFO: '@stayown:device_info',
  STAFF_INFO: '@stayown:staff_info',
  DATA_VERSIONS: '@stayown:data_versions',
  LAST_SYNC: '@stayown:last_sync',
  PENDING_BATCH: '@stayown:pending_batch',
};

const ENTITY_KEYS: Record<EntityType, string> = {
  room: KEYS.ROOMS,
  housekeeping: KEYS.HOUSEKEEPING,
  maintenance: KEYS.MAINTENANCE,
  service_request: KEYS.SERVICE_REQUESTS,
  message: KEYS.MESSAGES,
  guest: KEYS.ROOMS, // Guests stored with room context
  inventory: KEYS.ROOMS,
  task: KEYS.HOUSEKEEPING,
  note: KEYS.ROOMS,
};

// Generic storage helpers
async function getItem<T>(key: string): Promise<T | null> {
  try {
    const value = await AsyncStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    logger.error(`[OfflineStorage] Error getting ${key}:`, error);
    return null;
  }
}

async function setItem<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    logger.error(`[OfflineStorage] Error setting ${key}:`, error);
    throw error;
  }
}

async function removeItem(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    logger.error(`[OfflineStorage] Error removing ${key}:`, error);
    throw error;
  }
}

// ============================================
// DATA STORES
// ============================================

export class OfflineStorage {
  // ----------------------------------------
  // DEVICE & STAFF INFO
  // ----------------------------------------

  static async saveDeviceInfo(deviceId: string, deviceType: 'ios' | 'android' | 'tablet', appVersion: string): Promise<void> {
    await setItem(KEYS.DEVICE_INFO, { deviceId, deviceType, appVersion, registeredAt: new Date().toISOString() });
  }

  static async getDeviceInfo(): Promise<{ deviceId: string; deviceType: string; appVersion: string } | null> {
    return getItem(KEYS.DEVICE_INFO);
  }

  static async saveStaffInfo(staff: { id: string; name: string; role: string; department: string }): Promise<void> {
    await setItem(KEYS.STAFF_INFO, { ...staff, savedAt: new Date().toISOString() });
  }

  static async getStaffInfo(): Promise<{ id: string; name: string; role: string; department: string } | null> {
    return getItem(KEYS.STAFF_INFO);
  }

  // ----------------------------------------
  // SYNC STATE
  // ----------------------------------------

  static async getSyncState(): Promise<SyncState> {
    const state = await getItem<SyncState>(KEYS.SYNC_STATE);
    return state || {
      isOnline: true,
      isSyncing: false,
      pendingOperations: 0,
      conflicts: 0,
    };
  }

  static async updateSyncState(updates: Partial<SyncState>): Promise<void> {
    const current = await this.getSyncState();
    await setItem(KEYS.SYNC_STATE, { ...current, ...updates });
  }

  static async getLastSync(): Promise<string | null> {
    return getItem<string>(KEYS.LAST_SYNC);
  }

  static async setLastSync(timestamp: string): Promise<void> {
    await setItem(KEYS.LAST_SYNC, timestamp);
  }

  // ----------------------------------------
  // ROOMS
  // ----------------------------------------

  static async getRooms(): Promise<Room[]> {
    return (await getItem<Room[]>(KEYS.ROOMS)) || [];
  }

  static async getRoom(roomId: string): Promise<Room | null> {
    const rooms = await this.getRooms();
    return rooms.find((r) => r.id === roomId) || null;
  }

  static async saveRooms(rooms: Room[]): Promise<void> {
    await setItem(KEYS.ROOMS, rooms);
  }

  static async saveRoom(room: Room): Promise<void> {
    const rooms = await this.getRooms();
    const index = rooms.findIndex((r) => r.id === room.id);
    if (index >= 0) {
      rooms[index] = room;
    } else {
      rooms.push(room);
    }
    await setItem(KEYS.ROOMS, rooms);
  }

  static async updateRoom(roomId: string, updates: Partial<Room>): Promise<Room | null> {
    const rooms = await this.getRooms();
    const index = rooms.findIndex((r) => r.id === roomId);
    if (index >= 0) {
      rooms[index] = { ...rooms[index], ...updates, lastModified: new Date().toISOString() };
      await setItem(KEYS.ROOMS, rooms);
      return rooms[index];
    }
    return null;
  }

  // ----------------------------------------
  // HOUSEKEEPING TASKS
  // ----------------------------------------

  static async getHousekeepingTasks(): Promise<HousekeepingTask[]> {
    return (await getItem<HousekeepingTask[]>(KEYS.HOUSEKEEPING)) || [];
  }

  static async getHousekeepingTask(taskId: string): Promise<HousekeepingTask | null> {
    const tasks = await this.getHousekeepingTasks();
    return tasks.find((t) => t.id === taskId) || null;
  }

  static async saveHousekeepingTasks(tasks: HousekeepingTask[]): Promise<void> {
    await setItem(KEYS.HOUSEKEEPING, tasks);
  }

  static async saveHousekeepingTask(task: HousekeepingTask): Promise<void> {
    const tasks = await this.getHousekeepingTasks();
    const index = tasks.findIndex((t) => t.id === task.id);
    if (index >= 0) {
      tasks[index] = task;
    } else {
      tasks.push(task);
    }
    await setItem(KEYS.HOUSEKEEPING, tasks);
  }

  static async updateHousekeepingTask(taskId: string, updates: Partial<HousekeepingTask>): Promise<HousekeepingTask | null> {
    const tasks = await this.getHousekeepingTasks();
    const index = tasks.findIndex((t) => t.id === taskId);
    if (index >= 0) {
      tasks[index] = { ...tasks[index], ...updates, lastModified: new Date().toISOString() };
      await setItem(KEYS.HOUSEKEEPING, tasks);
      return tasks[index];
    }
    return null;
  }

  // ----------------------------------------
  // MAINTENANCE ISSUES
  // ----------------------------------------

  static async getMaintenanceIssues(): Promise<MaintenanceIssue[]> {
    return (await getItem<MaintenanceIssue[]>(KEYS.MAINTENANCE)) || [];
  }

  static async getMaintenanceIssue(issueId: string): Promise<MaintenanceIssue | null> {
    const issues = await this.getMaintenanceIssues();
    return issues.find((i) => i.id === issueId) || null;
  }

  static async saveMaintenanceIssues(issues: MaintenanceIssue[]): Promise<void> {
    await setItem(KEYS.MAINTENANCE, issues);
  }

  static async saveMaintenanceIssue(issue: MaintenanceIssue): Promise<void> {
    const issues = await this.getMaintenanceIssues();
    const index = issues.findIndex((i) => i.id === issue.id);
    if (index >= 0) {
      issues[index] = issue;
    } else {
      issues.push(issue);
    }
    await setItem(KEYS.MAINTENANCE, issues);
  }

  static async updateMaintenanceIssue(issueId: string, updates: Partial<MaintenanceIssue>): Promise<MaintenanceIssue | null> {
    const issues = await this.getMaintenanceIssues();
    const index = issues.findIndex((i) => i.id === issueId);
    if (index >= 0) {
      issues[index] = { ...issues[index], ...updates, lastModified: new Date().toISOString() };
      await setItem(KEYS.MAINTENANCE, issues);
      return issues[index];
    }
    return null;
  }

  // ----------------------------------------
  // SERVICE REQUESTS
  // ----------------------------------------

  static async getServiceRequests(): Promise<ServiceRequest[]> {
    return (await getItem<ServiceRequest[]>(KEYS.SERVICE_REQUESTS)) || [];
  }

  static async saveServiceRequests(requests: ServiceRequest[]): Promise<void> {
    await setItem(KEYS.SERVICE_REQUESTS, requests);
  }

  static async saveServiceRequest(request: ServiceRequest): Promise<void> {
    const requests = await this.getServiceRequests();
    const index = requests.findIndex((r) => r.id === request.id);
    if (index >= 0) {
      requests[index] = request;
    } else {
      requests.push(request);
    }
    await setItem(KEYS.SERVICE_REQUESTS, requests);
  }

  static async updateServiceRequest(requestId: string, updates: Partial<ServiceRequest>): Promise<ServiceRequest | null> {
    const requests = await this.getServiceRequests();
    const index = requests.findIndex((r) => r.id === requestId);
    if (index >= 0) {
      requests[index] = { ...requests[index], ...updates, lastModified: new Date().toISOString() };
      await setItem(KEYS.SERVICE_REQUESTS, requests);
      return requests[index];
    }
    return null;
  }

  // ----------------------------------------
  // MESSAGES
  // ----------------------------------------

  static async getMessages(): Promise<Message[]> {
    return (await getItem<Message[]>(KEYS.MESSAGES)) || [];
  }

  static async saveMessages(messages: Message[]): Promise<void> {
    await setItem(KEYS.MESSAGES, messages);
  }

  static async addMessage(message: Message): Promise<void> {
    const messages = await this.getMessages();
    messages.unshift(message); // Add to beginning
    // Keep only last 500 messages
    if (messages.length > 500) {
      messages.pop();
    }
    await setItem(KEYS.MESSAGES, messages);
  }

  static async markMessageRead(messageId: string): Promise<void> {
    const messages = await this.getMessages();
    const index = messages.findIndex((m) => m.id === messageId);
    if (index >= 0) {
      messages[index].read = true;
      await setItem(KEYS.MESSAGES, messages);
    }
  }

  // ----------------------------------------
  // DATA VERSIONS (for optimistic locking)
  // ----------------------------------------

  static async getDataVersions(): Promise<Record<string, number>> {
    return (await getItem<Record<string, number>>(KEYS.DATA_VERSIONS)) || {};
  }

  static async getDataVersion(entityType: EntityType, entityId: string): Promise<number> {
    const versions = await this.getDataVersions();
    const key = `${entityType}:${entityId}`;
    return versions[key] || 0;
  }

  static async setDataVersion(entityType: EntityType, entityId: string, version: number): Promise<void> {
    const versions = await this.getDataVersions();
    const key = `${entityType}:${entityId}`;
    versions[key] = version;
    await setItem(KEYS.DATA_VERSIONS, versions);
  }

  static async incrementDataVersion(entityType: EntityType, entityId: string): Promise<number> {
    const current = await this.getDataVersion(entityType, entityId);
    const newVersion = current + 1;
    await this.setDataVersion(entityType, entityId, newVersion);
    return newVersion;
  }

  // ----------------------------------------
  // OPERATION QUEUE
  // ----------------------------------------

  static async getOperationQueue(): Promise<PendingOperation[]> {
    return (await getItem<PendingOperation[]>(KEYS.OPERATION_QUEUE)) || [];
  }

  static async addToQueue(
    operationType: OperationType,
    entityType: EntityType,
    entityId: string,
    data: any,
    priority: Priority = 'normal',
    conflictStrategy: ConflictStrategy = 'SERVER_WINS'
  ): Promise<string> {
    const queue = await this.getOperationQueue();
    const operation: PendingOperation = {
      id: uuidv4(),
      operationType,
      entityType,
      entityId,
      data,
      priority,
      status: 'pending',
      timestamp: new Date().toISOString(),
      retryCount: 0,
    };
    queue.push(operation);
    // Sort by priority and timestamp
    queue.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });
    await setItem(KEYS.OPERATION_QUEUE, queue);
    await this.updateSyncState({ pendingOperations: queue.length });
    return operation.id;
  }

  static async removeFromQueue(operationId: string): Promise<void> {
    const queue = await this.getOperationQueue();
    const filtered = queue.filter((op) => op.id !== operationId);
    await setItem(KEYS.OPERATION_QUEUE, filtered);
    await this.updateSyncState({ pendingOperations: filtered.length });
  }

  static async updateQueueOperation(operationId: string, updates: Partial<PendingOperation>): Promise<void> {
    const queue = await this.getOperationQueue();
    const index = queue.findIndex((op) => op.id === operationId);
    if (index >= 0) {
      queue[index] = { ...queue[index], ...updates };
      await setItem(KEYS.OPERATION_QUEUE, queue);
    }
  }

  static async clearCompletedOperations(): Promise<void> {
    const queue = await this.getOperationQueue();
    const pending = queue.filter((op) => op.status === 'pending' || op.status === 'processing');
    await setItem(KEYS.OPERATION_QUEUE, pending);
    await this.updateSyncState({ pendingOperations: pending.length });
  }

  static async getPendingCount(): Promise<number> {
    const queue = await this.getOperationQueue();
    return queue.filter((op) => op.status === 'pending').length;
  }

  // ----------------------------------------
  // CONFLICTS
  // ----------------------------------------

  static async getConflicts(): Promise<Conflict[]> {
    return (await getItem<Conflict[]>(KEYS.CONFLICTS)) || [];
  }

  static async addConflict(conflict: Conflict): Promise<void> {
    const conflicts = await this.getConflicts();
    conflicts.unshift(conflict);
    await setItem(KEYS.CONFLICTS, conflicts);
    await this.updateSyncState({ conflicts: conflicts.length });
  }

  static async resolveConflict(conflictId: string, resolution: 'server_wins' | 'client_wins' | 'merged', mergedData?: any): Promise<void> {
    const conflicts = await this.getConflicts();
    const index = conflicts.findIndex((c) => c.id === conflictId);
    if (index >= 0) {
      conflicts[index].resolution = resolution;
      if (resolution === 'merged' && mergedData) {
        conflicts[index].serverData = mergedData; // Store merged result
      }
      await setItem(KEYS.CONFLICTS, conflicts);
      await this.updateSyncState({ conflicts: conflicts.filter((c) => c.resolution === 'pending').length });
    }
  }

  static async getPendingConflicts(): Promise<Conflict[]> {
    const conflicts = await this.getConflicts();
    return conflicts.filter((c) => c.resolution === 'pending');
  }

  // ----------------------------------------
  // BULK OPERATIONS
  // ----------------------------------------

  static async replaceAllData(data: {
    rooms?: Room[];
    housekeeping?: HousekeepingTask[];
    maintenance?: MaintenanceIssue[];
    serviceRequests?: ServiceRequest[];
    messages?: Message[];
  }): Promise<void> {
    const promises: Promise<void>[] = [];
    if (data.rooms) promises.push(this.saveRooms(data.rooms));
    if (data.housekeeping) promises.push(this.saveHousekeepingTasks(data.housekeeping));
    if (data.maintenance) promises.push(this.saveMaintenanceIssues(data.maintenance));
    if (data.serviceRequests) promises.push(this.saveServiceRequests(data.serviceRequests));
    if (data.messages) promises.push(this.saveMessages(data.messages));
    await Promise.all(promises);
  }

  static async getAllData(): Promise<{
    rooms: Room[];
    housekeeping: HousekeepingTask[];
    maintenance: MaintenanceIssue[];
    serviceRequests: ServiceRequest[];
    messages: Message[];
  }> {
    const [rooms, housekeeping, maintenance, serviceRequests, messages] = await Promise.all([
      this.getRooms(),
      this.getHousekeepingTasks(),
      this.getMaintenanceIssues(),
      this.getServiceRequests(),
      this.getMessages(),
    ]);
    return { rooms, housekeeping, maintenance, serviceRequests, messages };
  }

  // ----------------------------------------
  // CLEAR ALL DATA
  // ----------------------------------------

  static async clearAllData(): Promise<void> {
    const keys = Object.values(KEYS);
    await AsyncStorage.multiRemove(keys);
    await this.updateSyncState({
      isOnline: true,
      isSyncing: false,
      pendingOperations: 0,
      conflicts: 0,
    });
  }

  // ----------------------------------------
  // STORAGE INFO
  // ----------------------------------------

  static async getStorageSize(): Promise<{ used: number; keys: number }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      let totalSize = 0;
      for (const key of keys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          totalSize += value.length + key.length;
        }
      }
      return { used: totalSize, keys: keys.length };
    } catch (error) {
      logger.error('[OfflineStorage] Error getting storage size:', error);
      return { used: 0, keys: 0 };
    }
  }
}

export default OfflineStorage;
