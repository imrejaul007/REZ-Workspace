/**
 * REZ Memory Cloud - React Hooks
 * Easy React integration for memory operations
 */

import { useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { REZMemoryClient, MemoryData, SearchOptions, MemoryResponse, SearchResponse } from './index';

// Chrome extension types
interface ChromeAPI {
  tabs?: {
    query: (query: { active: boolean; currentWindow: boolean }) => Promise<Array<{ id?: number; url?: string }>>;
    sendMessage: (tabId: number, message: unknown) => Promise<unknown>;
  };
}

declare const chrome: ChromeAPI | undefined;

// Default client instance
let defaultClient: REZMemoryClient | null = null;

export function setMemoryClient(client: REZMemoryClient): void {
  defaultClient = client;
}

function getClient(client?: REZMemoryClient): REZMemoryClient {
  return client || defaultClient || new REZMemoryClient();
}

// ==================== HOOKS ====================

/**
 * useMemory - Save and retrieve memories
 */
export function useMemory(options?: { apiUrl?: string; apiKey?: string }) {
  const clientRef = useRef<REZMemoryClient | null>(null);

  if (!clientRef.current) {
    clientRef.current = options
      ? new REZMemoryClient(options)
      : getClient();
  }

  const [memories, setMemories] = useState<MemoryResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMemories = useCallback(
    async (userId: string, opts?: { limit?: number; type?: string }) => {
      setLoading(true);
      setError(null);
      try {
        const result = await clientRef.current!.listMemories(userId, opts);
        setMemories(result.memories);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load memories');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const remember = useCallback(
    async (data: MemoryData): Promise<MemoryResponse | null> => {
      setLoading(true);
      setError(null);
      try {
        const memory = await clientRef.current!.remember(data);
        setMemories((prev: MemoryResponse[]) => [memory, ...prev]);
        return memory;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save memory');
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const forget = useCallback(async (memoryId: string, userId: string) => {
    setLoading(true);
    setError(null);
    try {
      await clientRef.current!.forget(memoryId, userId);
      setMemories((prev: MemoryResponse[]) => prev.filter((m: MemoryResponse) => m.id !== memoryId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete memory');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    memories,
    loading,
    error,
    loadMemories,
    remember,
    forget,
  };
}

/**
 * useSearch - Search memories
 */
export function useSearch(_options?: { apiUrl?: string; apiKey?: string }) {
  const clientRef = useRef<REZMemoryClient | null>(null);

  if (!clientRef.current) {
    clientRef.current = getClient();
  }

  const [results, setResults] = useState<SearchResponse['results']>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const search = useCallback(
    async (opts: SearchOptions): Promise<SearchResponse | null> => {
      setLoading(true);
      setError(null);
      setQuery(opts.query);
      try {
        const response = await clientRef.current!.search(opts);
        setResults(response.results);
        return response;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed');
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const clear = useCallback(() => {
    setResults([]);
    setQuery('');
    setError(null);
  }, []);

  return {
    results,
    loading,
    error,
    query,
    search,
    clear,
  };
}

/**
 * useGraph - Knowledge graph operations
 */
export function useGraph(_options?: { apiUrl?: string; apiKey?: string }) {
  const clientRef = useRef<REZMemoryClient | null>(null);

  if (!clientRef.current) {
    clientRef.current = getClient();
  }

  const [nodes, setNodes] = useState<Array<{ id: string; name: string; type: string; memoryCount: number }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadGraph = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const graph = await clientRef.current!.getGraph(userId);
      setNodes(
        graph.nodes.map((n) => ({
          id: n.id,
          name: n.name,
          type: n.type,
          memoryCount: n.memoryCount,
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load graph');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    nodes,
    loading,
    error,
    loadGraph,
  };
}

/**
 * useMemoryStats - Memory statistics
 */
export function useMemoryStats(userId: string | null, _options?: { apiUrl?: string; apiKey?: string }) {
  const clientRef = useRef<REZMemoryClient | null>(null);

  if (!clientRef.current) {
    clientRef.current = getClient();
  }

  const [stats, setStats] = useState<{
    totalMemories: number;
    byType: Record<string, number>;
    byTag: Record<string, number>;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    clientRef.current!
      .getStats(userId)
      .then(setStats)
      .catch((err: Error) => {
        setError(err.message || 'Failed to load stats');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [userId]);

  const refresh = useCallback(async () => {
    if (!userId) return;
    try {
      const newStats = await clientRef.current!.getStats(userId);
      setStats(newStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh stats');
    }
  }, [userId]);

  return { stats, loading, error, refresh };
}

interface CapturedPageData {
  url: string;
  content: string;
  metadata?: { title?: string };
}

/**
 * useUrlCapture - Capture page content from browser extension
 */
export function useUrlCapture() {
  const [capturing, setCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const captureCurrentPage = useCallback(async (userId: string): Promise<MemoryResponse | null> => {
    setCapturing(true);
    setError(null);

    try {
      // Check if running in browser extension context
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs.length > 0 && tabs[0].id !== undefined) {
          const response = await chrome.tabs.sendMessage(tabs[0].id, { action: 'extractContent' }) as { success?: boolean; data?: CapturedPageData } | undefined;
          if (response?.success && response.data) {
            const data = response.data;
            // Save to memory cloud
            const client = getClient();
            return await client.remember({
              userId,
              content: data.content,
              title: data.metadata?.title || 'Untitled',
              url: data.url,
              type: 'page',
              metadata: data.metadata,
            });
          }
        }
      }
      throw new Error('Not in extension context or no active tab');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Capture failed');
      return null;
    } finally {
      setCapturing(false);
    }
  }, []);

  const captureSelection = useCallback(async (userId: string): Promise<MemoryResponse | null> => {
    setCapturing(true);
    setError(null);

    try {
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs.length > 0 && tabs[0].id !== undefined) {
          const response = await chrome.tabs.sendMessage(tabs[0].id, { action: 'extractSelection' }) as { success?: boolean; data?: string } | undefined;
          if (response?.success && response.data) {
            const client = getClient();
            return await client.remember({
              userId,
              content: response.data,
              url: tabs[0].url,
              type: 'highlight',
            });
          }
        }
      }
      throw new Error('No selection found');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Capture failed');
      return null;
    } finally {
      setCapturing(false);
    }
  }, []);

  return { capturing, error, captureCurrentPage, captureSelection };
}
