/**
 * Memory Engine Hook
 * Connects to REZ-memory-engine (Port 4058)
 * Conversation memory and context persistence
 */

import { useCallback } from 'react';
import { useAuthUser } from '@/stores/selectors';
import apiClient from '@/services/apiClient';

const MEMORY_URL = process.env.EXPO_PUBLIC_MEMORY_URL || 'https://REZ-memory-engine.onrender.com';

// Response types for type safety
interface MemoriesResponse {
  memories: MemoryEntry[];
}

interface ConversationResponse {
  messages: ConversationMessage[];
}

interface PreferenceResponse {
  value: unknown;
}

interface PreferencesResponse {
  preferences: Record<string, unknown>;
}

export interface MemoryEntry {
  id: string;
  type: 'conversation' | 'preference' | 'context' | 'fact';
  key: string;
  value: unknown;
  confidence: number;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, unknown>;
}

export function useMemory() {
  const user = useAuthUser();

  const storeMemory = useCallback(async (
    type: MemoryEntry['type'],
    key: string,
    value: unknown,
    options?: { confidence?: number; ttl?: number }
  ) => {
    if (!user?.id) return { success: false, error: 'No user' };

    try {
      const response = await apiClient.post(`${MEMORY_URL}/memory`, {
        userId: user.id,
        type,
        key,
        value,
        confidence: options?.confidence ?? 1.0,
        ttl: options?.ttl,
      });

      return response;
    } catch {
      return { success: false, error: 'Failed to store memory' };
    }
  }, [user?.id]);

  const getMemory = useCallback(async (key: string): Promise<MemoryEntry | null> => {
    if (!user?.id) return null;

    try {
      const response = await apiClient.get<MemoryEntry>(`${MEMORY_URL}/memory/${key}`, {
        userId: user.id,
      });

      if (response.success && response.data) {
        return response.data as MemoryEntry;
      }
      return null;
    } catch {
      return null;
    }
  }, [user?.id]);

  const getAllMemories = useCallback(async (
    type?: MemoryEntry['type']
  ): Promise<MemoryEntry[]> => {
    if (!user?.id) return [];

    try {
      const response = await apiClient.get<MemoriesResponse>(`${MEMORY_URL}/memories`, {
        userId: user.id,
        type,
      });

      if (response.success && response.data) {
        return response.data.memories || [];
      }
      return [];
    } catch {
      return [];
    }
  }, [user?.id]);

  const deleteMemory = useCallback(async (key: string) => {
    if (!user?.id) return { success: false };

    try {
      const response = await apiClient.delete(`${MEMORY_URL}/memory/${key}`, {
        userId: user.id,
      });

      return response;
    } catch {
      return { success: false, error: 'Failed to delete memory' };
    }
  }, [user?.id]);

  return {
    storeMemory,
    getMemory,
    getAllMemories,
    deleteMemory,
  };
}

export function useConversationMemory(conversationId?: string) {
  const user = useAuthUser();

  const addMessage = useCallback(async (
    role: ConversationMessage['role'],
    content: string,
    metadata?: Record<string, unknown>
  ) => {
    if (!user?.id) return { success: false };

    try {
      const response = await apiClient.post(`${MEMORY_URL}/conversation/${conversationId || 'default'}`, {
        userId: user.id,
        role,
        content,
        metadata,
      });

      return response;
    } catch {
      return { success: false, error: 'Failed to add message' };
    }
  }, [user?.id, conversationId]);

  const getConversationHistory = useCallback(async (limit = 50): Promise<ConversationMessage[]> => {
    if (!user?.id) return [];

    try {
      const response = await apiClient.get<ConversationResponse>(`${MEMORY_URL}/conversation/${conversationId || 'default'}`, {
        userId: user.id,
        limit,
      });

      if (response.success && response.data) {
        return response.data.messages || [];
      }
      return [];
    } catch {
      return [];
    }
  }, [user?.id, conversationId]);

  const clearConversation = useCallback(async () => {
    if (!user?.id) return { success: false };

    try {
      const response = await apiClient.delete(`${MEMORY_URL}/conversation/${conversationId || 'default'}`, {
        userId: user.id,
      });

      return response;
    } catch {
      return { success: false, error: 'Failed to clear conversation' };
    }
  }, [user?.id, conversationId]);

  return {
    addMessage,
    getConversationHistory,
    clearConversation,
  };
}

export function useUserPreferences() {
  const user = useAuthUser();

  const getPreference = useCallback(async <T>(key: string, defaultValue: T): Promise<T> => {
    if (!user?.id) return defaultValue;

    try {
      const response = await apiClient.get<PreferenceResponse>(`${MEMORY_URL}/preference/${key}`, {
        userId: user.id,
      });

      if (response.success && response.data) {
        return (response.data as PreferenceResponse).value as T;
      }
      return defaultValue;
    } catch {
      return defaultValue;
    }
  }, [user?.id]);

  const setPreference = useCallback(async <T>(key: string, value: T) => {
    if (!user?.id) return { success: false };

    try {
      const response = await apiClient.post(`${MEMORY_URL}/preference/${key}`, {
        userId: user.id,
        value,
      });

      return response;
    } catch {
      return { success: false, error: 'Failed to save preference' };
    }
  }, [user?.id]);

  const getAllPreferences = useCallback(async (): Promise<Record<string, unknown>> => {
    if (!user?.id) return {};

    try {
      const response = await apiClient.get<PreferencesResponse>(`${MEMORY_URL}/preferences`, {
        userId: user.id,
      });

      if (response.success && response.data) {
        return response.data.preferences || {};
      }
      return {};
    } catch {
      return {};
    }
  }, [user?.id]);

  return {
    getPreference,
    setPreference,
    getAllPreferences,
  };
}
