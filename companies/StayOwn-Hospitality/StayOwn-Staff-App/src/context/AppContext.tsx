/**
 * App Context for StayOwn Staff App
 *
 * Provides global state management with:
 * - Sync state
 * - Network status
 * - Pending operations count
 * - Active conflicts
 */

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import OfflineStorage from '../services/OfflineStorage';
import syncManager from '../services/SyncManager';
import {
  SyncState,
  SyncResult,
  Conflict,
  PendingOperation,
  Room,
  HousekeepingTask,
  MaintenanceIssue,
  ServiceRequest,
  Message,
  Priority,
} from '../types';

// Context types
interface AppContextType {
  // Sync state
  syncState: SyncState;
  sync: () => Promise<SyncResult>;
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  conflictCount: number;

  // Data
  rooms: Room[];
  housekeepingTasks: HousekeepingTask[];
  maintenanceIssues: MaintenanceIssue[];
  serviceRequests: ServiceRequest[];
  messages: Message[];

  // Room operations
  updateRoomStatus: (roomId: string, status: string, notes?: string) => Promise<void>;

  // Housekeeping operations
  updateHousekeepingTask: (taskId: string, updates: Partial<HousekeepingTask>) => Promise<void>;
  completeHousekeepingTask: (taskId: string, notes?: string) => Promise<void>;

  // Maintenance operations
  createMaintenanceIssue: (issue: Omit<MaintenanceIssue, 'id' | 'version' | 'lastModified'>) => Promise<string>;
  updateMaintenanceIssue: (issueId: string, updates: Partial<MaintenanceIssue>) => Promise<void>;
  resolveMaintenanceIssue: (issueId: string, notes?: string) => Promise<void>;

  // Service request operations
  completeServiceRequest: (requestId: string, notes?: string) => Promise<void>;

  // Messaging
  sendMessage: (content: string, guestId?: string, roomNumber?: string) => Promise<void>;

  // Conflicts
  conflicts: Conflict[];
  pendingOperations: PendingOperation[];
  resolveConflict: (conflictId: string, resolution: 'server_wins' | 'client_wins' | 'merged', data?: any) => Promise<void>;

  // Refresh data from local storage
  refreshData: () => Promise<void>;

  // Initialize
  initialize: (deviceId: string, staffId: string, hotelId: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [syncState, setSyncState] = useState<SyncState>({
    isOnline: true,
    isSyncing: false,
    pendingOperations: 0,
    conflicts: 0,
  });

  const [rooms, setRooms] = useState<Room[]>([]);
  const [housekeepingTasks, setHousekeepingTasks] = useState<HousekeepingTask[]>([]);
  const [maintenanceIssues, setMaintenanceIssues] = useState<MaintenanceIssue[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [pendingOperations, setPendingOperations] = useState<PendingOperation[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // ----------------------------------------
  // DATA LOAD/REFRESH
  // ----------------------------------------

  const refreshData = useCallback(async () => {
    const [rooms, hk, maint, sr, msgs, queue, conflictList, state] = await Promise.all([
      OfflineStorage.getRooms(),
      OfflineStorage.getHousekeepingTasks(),
      OfflineStorage.getMaintenanceIssues(),
      OfflineStorage.getServiceRequests(),
      OfflineStorage.getMessages(),
      OfflineStorage.getOperationQueue(),
      OfflineStorage.getConflicts(),
      OfflineStorage.getSyncState(),
    ]);

    setRooms(rooms);
    setHousekeepingTasks(hk);
    setMaintenanceIssues(maint);
    setServiceRequests(sr);
    setMessages(msgs);
    setPendingOperations(queue.filter((op) => op.status === 'pending'));
    setConflicts(conflictList.filter((c) => c.resolution === 'pending'));
    setSyncState(state);
  }, []);

  // ----------------------------------------
  // INITIALIZATION
  // ----------------------------------------

  const initialize = useCallback(async (deviceId: string, staffId: string, hotelId: string) => {
    // Save device info if not exists
    const existingDevice = await OfflineStorage.getDeviceInfo();
    if (!existingDevice) {
      await OfflineStorage.saveDeviceInfo(deviceId, 'ios', '1.0.0');
    }

    // Initialize sync manager
    await syncManager.initialize(deviceId, staffId, hotelId);

    // Load data from storage
    await refreshData();

    // Load initial data from server if online
    const isOnline = await syncManager.checkOnlineStatus();
    if (isOnline) {
      await syncManager.loadInitialData();
      await refreshData();
    }

    // Start auto sync
    syncManager.startAutoSync();

    // Listen for sync events
    syncManager.addEventListener('sync-manager', (event) => {
      if (event.type === 'sync_complete' || event.type === 'sync_error') {
        refreshData();
      }
    });

    setIsInitialized(true);
  }, [refreshData]);

  // ----------------------------------------
  // APP STATE LISTENER (foreground sync)
  // ----------------------------------------

  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && isInitialized) {
        // Check network status when app comes to foreground
        await syncManager.checkOnlineStatus();
        // Trigger sync if needed
        const pending = await OfflineStorage.getPendingCount();
        if (pending > 0) {
          await syncManager.triggerSync();
          await refreshData();
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [isInitialized, refreshData]);

  // ----------------------------------------
  // SYNC
  // ----------------------------------------

  const sync = useCallback(async (): Promise<SyncResult> => {
    const result = await syncManager.triggerSync();
    await refreshData();
    return result;
  }, [refreshData]);

  // ----------------------------------------
  // ROOM OPERATIONS
  // ----------------------------------------

  const updateRoomStatus = useCallback(async (roomId: string, status: string, notes?: string) => {
    await syncManager.updateRoom(roomId, { status, notes } as Partial<Room>, 'normal');
    await refreshData();
  }, [refreshData]);

  // ----------------------------------------
  // HOUSEKEEPING OPERATIONS
  // ----------------------------------------

  const updateHousekeepingTask = useCallback(async (taskId: string, updates: Partial<HousekeepingTask>) => {
    await syncManager.updateHousekeepingTask(taskId, updates, 'normal');
    await refreshData();
  }, [refreshData]);

  const completeHousekeepingTask = useCallback(async (taskId: string, notes?: string) => {
    await syncManager.updateHousekeepingTask(taskId, {
      status: 'completed',
      completedTime: new Date().toISOString(),
      notes,
    } as Partial<HousekeepingTask>, 'normal');
    await refreshData();
  }, [refreshData]);

  // ----------------------------------------
  // MAINTENANCE OPERATIONS
  // ----------------------------------------

  const createMaintenanceIssue = useCallback(async (issue: Omit<MaintenanceIssue, 'id' | 'version' | 'lastModified'>): Promise<string> => {
    const issueId = await syncManager.createMaintenanceIssue(issue, 'high');
    await refreshData();
    return issueId;
  }, [refreshData]);

  const updateMaintenanceIssue = useCallback(async (issueId: string, updates: Partial<MaintenanceIssue>) => {
    await syncManager.updateMaintenanceIssue(issueId, updates, 'normal');
    await refreshData();
  }, [refreshData]);

  const resolveMaintenanceIssue = useCallback(async (issueId: string, notes?: string) => {
    await syncManager.updateMaintenanceIssue(issueId, {
      status: 'resolved',
      resolvedTime: new Date().toISOString(),
      notes,
    } as Partial<MaintenanceIssue>, 'normal');
    await refreshData();
  }, [refreshData]);

  // ----------------------------------------
  // SERVICE REQUEST OPERATIONS
  // ----------------------------------------

  const completeServiceRequest = useCallback(async (requestId: string, notes?: string) => {
    await syncManager.completeServiceRequest(requestId, notes, 'normal');
    await refreshData();
  }, [refreshData]);

  // ----------------------------------------
  // MESSAGING
  // ----------------------------------------

  const sendMessage = useCallback(async (content: string, guestId?: string, roomNumber?: string) => {
    await syncManager.sendMessage(content, guestId, roomNumber, 'normal');
    await refreshData();
  }, [refreshData]);

  // ----------------------------------------
  // CONFLICT RESOLUTION
  // ----------------------------------------

  const resolveConflict = useCallback(async (
    conflictId: string,
    resolution: 'server_wins' | 'client_wins' | 'merged',
    data?: any
  ) => {
    await syncManager.resolveConflict(conflictId, resolution, data);
    await refreshData();
  }, [refreshData]);

  // ----------------------------------------
  // CONTEXT VALUE
  // ----------------------------------------

  const value: AppContextType = {
    // Sync
    syncState,
    sync,
    isOnline: syncState.isOnline,
    isSyncing: syncState.isSyncing,
    pendingCount: syncState.pendingOperations,
    conflictCount: syncState.conflicts,

    // Data
    rooms,
    housekeepingTasks,
    maintenanceIssues,
    serviceRequests,
    messages,

    // Room
    updateRoomStatus,

    // Housekeeping
    updateHousekeepingTask,
    completeHousekeepingTask,

    // Maintenance
    createMaintenanceIssue,
    updateMaintenanceIssue,
    resolveMaintenanceIssue,

    // Service requests
    completeServiceRequest,

    // Messaging
    sendMessage,

    // Conflicts
    conflicts,
    pendingOperations,
    resolveConflict,

    // Utilities
    refreshData,
    initialize,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}

export default AppContext;
