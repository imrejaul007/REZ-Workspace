import { useState, useCallback } from 'react';
import { RestoPapaApiClient } from './api-client';
import { RestoPapaSocketClient } from './socket-client';
import {
  User,
  Restaurant,
  Order,
  
  
  AuthTokens,
  
  SearchParams,
  
  
  OrderUpdate,
  NotificationData,
} from './types';

// API Client Hook
export function useApiClient() {
  const [client, setClient] = useState<RestoPapaApiClient | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const initializeClient = useCallback((config) => {
    const apiClient = new RestoPapaApiClient(config);
    setClient(apiClient);
    setIsInitialized(true);
    return apiClient;
  }, []);

  return {
    client,
    isInitialized,
    initializeClient,
  };
}

// Authentication Hook
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const signUp = useCallback(async (
    client: RestoPapaApiClient,
    userData: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      role?: string;
      phoneNumber?: string;
    }
  ) => {
    try {
      setLoading(true);
      setError(null);
      const response = await client.signUp(userData);
      setUser(response.data.user);
      setTokens(response.data.tokens);
      return response;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const signIn = useCallback(async (
    client: RestoPapaApiClient,
    credentials: { email: string; password: string }
  ) => {
    try {
      setLoading(true);
      setError(null);
      const response = await client.signIn(credentials);
      setUser(response.data.user);
      setTokens(response.data.tokens);
      return response;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async (client: RestoPapaApiClient) => {
    try {
      setLoading(true);
      await client.signOut();
      setUser(null);
      setTokens(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (
    client: RestoPapaApiClient,
    userData: Partial<User>
  ) => {
    try {
      setLoading(true);
      setError(null);
      const response = await client.updateUserProfile(userData);
      setUser(response.data);
      return response;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    user,
    tokens,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    updateProfile,
    setUser,
    setTokens,
  };
}

// Restaurant Hook
export function useRestaurants() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<unknown>(null);

  const fetchRestaurants = useCallback(async (
    client: RestoPapaApiClient,
    params?: SearchParams
  ) => {
    try {
      setLoading(true);
      setError(null);
      const response = await client.getRestaurants(params);
      setRestaurants(response.data);
      setPagination(response.pagination);
      return response;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createRestaurant = useCallback(async (
    client: RestoPapaApiClient,
    restaurantData: Partial<Restaurant>
  ) => {
    try {
      setLoading(true);
      setError(null);
      const response = await client.createRestaurant(restaurantData);
      setRestaurants(prev => [...prev, response.data]);
      return response;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateRestaurant = useCallback(async (
    client: RestoPapaApiClient,
    id: string,
    restaurantData: Partial<Restaurant>
  ) => {
    try {
      setLoading(true);
      setError(null);
      const response = await client.updateRestaurant(id, restaurantData);
      setRestaurants(prev => 
        prev.map(restaurant => 
          restaurant.id === id ? response.data : restaurant
        )
      );
      return response;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteRestaurant = useCallback(async (
    client: RestoPapaApiClient,
    id: string
  ) => {
    try {
      setLoading(true);
      setError(null);
      await client.deleteRestaurant(id);
      setRestaurants(prev => prev.filter(restaurant => restaurant.id !== id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    restaurants,
    loading,
    error,
    pagination,
    fetchRestaurants,
    createRestaurant,
    updateRestaurant,
    deleteRestaurant,
    setRestaurants,
  };
}

// Orders Hook
export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<unknown>(null);

  const fetchOrders = useCallback(async (
    client: RestoPapaApiClient,
    params?: SearchParams
  ) => {
    try {
      setLoading(true);
      setError(null);
      const response = await client.getOrders(params);
      setOrders(response.data);
      setPagination(response.pagination);
      return response;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createOrder = useCallback(async (
    client: RestoPapaApiClient,
    orderData: Partial<Order>
  ) => {
    try {
      setLoading(true);
      setError(null);
      const response = await client.createOrder(orderData);
      setOrders(prev => [...prev, response.data]);
      return response;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateOrderStatus = useCallback(async (
    client: RestoPapaApiClient,
    id: string,
    status: string
  ) => {
    try {
      setLoading(true);
      setError(null);
      const response = await client.updateOrderStatus(id, status);
      setOrders(prev => 
        prev.map(order => 
          order.id === id ? { ...order, status: status as unknown } : order
        )
      );
      return response;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    orders,
    loading,
    error,
    pagination,
    fetchOrders,
    createOrder,
    updateOrderStatus,
    setOrders,
  };
}

// Socket Hook
export function useSocket() {
  const [socket, setSocket] = useState<RestoPapaSocketClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initializeSocket = useCallback((config) => {
    const socketClient = new RestoPapaSocketClient(config);
    
    socketClient.on('connected', () => {
      setIsConnected(true);
      setError(null);
    });

    socketClient.on('disconnected', () => {
      setIsConnected(false);
    });

    socketClient.on('connectionError', (err) => {
      setError(err.message);
    });

    setSocket(socketClient);
    return socketClient;
  }, []);

  const connect = useCallback(async () => {
    if (socket) {
      try {
        await socket.connect();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err));
      }
    }
  }, [socket]);

  const disconnect = useCallback(() => {
    if (socket) {
      socket.disconnect();
    }
  }, [socket]);

  return {
    socket,
    isConnected,
    error,
    initializeSocket,
    connect,
    disconnect,
  };
}

// Real-time Order Updates Hook
export function useOrderUpdates(_orderId?: string) {
  const [orderUpdate, setOrderUpdate] = useState<OrderUpdate | null>(null);
  const [socket, setSocket] = useState<RestoPapaSocketClient | null>(null);

  const subscribeToUpdates = useCallback((socketClient: RestoPapaSocketClient, orderIdParam?: string) => {
    setSocket(socketClient);
    
    const handleOrderUpdate = (update: OrderUpdate) => {
      if (!orderIdParam || update.orderId === orderIdParam) {
        setOrderUpdate(update);
      }
    };

    socketClient.on('orderUpdate', handleOrderUpdate);
    socketClient.subscribeToOrderUpdates(orderIdParam);

    return () => {
      socketClient.off('orderUpdate', handleOrderUpdate);
      socketClient.unsubscribeFromOrderUpdates(orderIdParam);
    };
  }, []);

  return {
    orderUpdate,
    subscribeToUpdates,
  };
}

// Notifications Hook
export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const subscribeToNotifications = useCallback((socketClient: RestoPapaSocketClient) => {
    const handleNotification = (notification: NotificationData) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    };

    socketClient.on('notification', handleNotification);
    socketClient.subscribeToNotifications();

    return () => {
      socketClient.off('notification', handleNotification);
    };
  }, []);

  const markAsRead = useCallback((socketClient: RestoPapaSocketClient, notificationId: string) => {
    socketClient.markNotificationAsRead(notificationId);
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, isRead: true }
          : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback((socketClient: RestoPapaSocketClient) => {
    notifications.forEach(notification => {
      if (!notification.read) {
        socketClient.markNotificationAsRead(notification.id);
      }
    });
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
    setUnreadCount(0);
  }, [notifications]);

  return {
    notifications,
    unreadCount,
    subscribeToNotifications,
    markAsRead,
    markAllAsRead,
    setNotifications,
  };
}

// File Upload Hook
export function useFileUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = useCallback(async (
    client: RestoPapaApiClient,
    file: File,
    options?: unknown
  ) => {
    try {
      setUploading(true);
      setError(null);
      setProgress(0);

      // Note: In a real implementation, you'd want to track upload progress
      // This would require integrating with the actual upload mechanism
      const response = await client.uploadFile(file, options);
      setProgress(100);
      return response;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    } finally {
      setUploading(false);
    }
  }, []);

  return {
    uploading,
    progress,
    error,
    uploadFile,
  };
}

// Search Hook
export function useSearch<T = unknown>() {
  const [results, setResults] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const search = useCallback(async (
    client: RestoPapaApiClient,
    query: string,
    type?: string
  ) => {
    try {
      setLoading(true);
      setError(null);
      const response = await client.globalSearch(query, type);
      setResults(response.data);
      return response;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getSuggestions = useCallback(async (
    client: RestoPapaApiClient,
    query: string,
    type?: string
  ) => {
    try {
      const response = await client.getSearchSuggestions(query, type);
      setSuggestions(response.data);
      return response;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    }
  }, []);

  return {
    results,
    loading,
    error,
    suggestions,
    search,
    getSuggestions,
    setResults,
  };
}

// Pagination Hook
export function usePagination(initialPage = 1, initialLimit = 10) {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const updatePagination = useCallback((paginationData) => {
    setPage(paginationData.page);
    setLimit(paginationData.limit);
    setTotal(paginationData.total);
    setTotalPages(paginationData.totalPages);
  }, []);

  const goToPage = useCallback((newPage: number) => {
    setPage(Math.max(1, Math.min(newPage, totalPages)));
  }, [totalPages]);

  const nextPage = useCallback(() => {
    goToPage(page + 1);
  }, [page, goToPage]);

  const prevPage = useCallback(() => {
    goToPage(page - 1);
  }, [page, goToPage]);

  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext,
    hasPrev,
    setPage,
    setLimit,
    updatePagination,
    goToPage,
    nextPage,
    prevPage,
  };
}

// Local Storage Hook for tokens
export function useTokenStorage() {
  const [tokens, setTokens] = useState<AuthTokens | null>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('restopapa_tokens');
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  });

  const saveTokens = useCallback((newTokens: AuthTokens) => {
    setTokens(newTokens);
    if (typeof window !== 'undefined') {
      localStorage.setItem('restopapa_tokens', JSON.stringify(newTokens));
    }
  }, []);

  const clearTokens = useCallback(() => {
    setTokens(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('restopapa_tokens');
    }
  }, []);

  return {
    tokens,
    saveTokens,
    clearTokens,
  };
}