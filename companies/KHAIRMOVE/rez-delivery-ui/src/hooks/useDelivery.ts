import { useState, useEffect, useCallback, useRef } from 'react';

export interface Order {
  id: string;
  customer: string;
  phone: string;
  address: string;
  items: string[];
  status: OrderStatus;
  source: 'app' | 'web' | 'phone';
  time: string;
  amount: number;
  rider?: string;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'in_transit'
  | 'delivered'
  | 'cancelled';

export interface Rider {
  id: string;
  name: string;
  phone: string;
  status: 'online' | 'offline' | 'busy';
  rating: number;
  currentOrder?: string;
  location?: {
    lat: number;
    lng: number;
  };
}

export interface DeliveryStats {
  activeOrders: number;
  ridersOnline: number;
  avgDeliveryTime: number;
  successRate: number;
}

interface UseDeliveryReturn {
  orders: Order[];
  riders: Rider[];
  stats: DeliveryStats;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  assignRider: (orderId: string, riderId: string) => Promise<void>;
  updateRiderStatus: (riderId: string, status: Rider['status']) => Promise<void>;
}

export function useDelivery(): UseDeliveryReturn {
  const [orders, setOrders] = useState<Order[]>([]);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Simulate API calls
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Mock orders data
      const mockOrders: Order[] = [
        {
          id: 'ORD-7829',
          customer: 'Sarah Mitchell',
          phone: '+1 (555) 234-5678',
          address: '742 Evergreen Terrace, Springfield, IL 62701',
          items: ['2x Margherita Pizza', '1x Garlic Bread', '2x Coca Cola'],
          status: 'in_transit',
          source: 'app',
          time: new Date().toISOString(),
          amount: 34.5,
          rider: 'RID-001',
        },
        {
          id: 'ORD-7828',
          customer: 'Michael Chen',
          phone: '+1 (555) 345-6789',
          address: '221B Baker Street, London District, NY 10001',
          items: ['1x Chicken Teriyaki Bowl', '1x Miso Soup'],
          status: 'pending',
          source: 'web',
          time: new Date().toISOString(),
          amount: 28.0,
        },
        {
          id: 'ORD-7827',
          customer: 'Emma Wilson',
          phone: '+1 (555) 456-7890',
          address: '1600 Pennsylvania Avenue, Metro City, DC 20500',
          items: ['1x Classic Burger', '1x French Fries', '1x Milkshake'],
          status: 'delivered',
          source: 'app',
          time: new Date().toISOString(),
          amount: 52.75,
          rider: 'RID-003',
        },
      ];

      // Mock riders data
      const mockRiders: Rider[] = [
        {
          id: 'RID-001',
          name: 'John Davis',
          phone: '+1 (555) 111-2222',
          status: 'online',
          rating: 4.9,
          currentOrder: 'ORD-7829',
          location: { lat: 39.783, lng: -89.645 },
        },
        {
          id: 'RID-002',
          name: 'Maria Santos',
          phone: '+1 (555) 222-3333',
          status: 'online',
          rating: 4.8,
        },
        {
          id: 'RID-003',
          name: 'Alex Kim',
          phone: '+1 (555) 333-4444',
          status: 'busy',
          rating: 4.7,
          currentOrder: 'ORD-7827',
        },
        {
          id: 'RID-004',
          name: 'David Lee',
          phone: '+1 (555) 444-5555',
          status: 'offline',
          rating: 4.6,
        },
      ];

      if (mountedRef.current) {
        setOrders(mockOrders);
        setRiders(mockRiders);
        setIsLoading(false);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();

    return () => {
      mountedRef.current = false;
    };
  }, [fetchData]);

  const updateOrderStatus = useCallback(
    async (orderId: string, status: OrderStatus) => {
      // Optimistic update
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status } : order
        )
      );

      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 300));
        // In production, this would be an actual API call
      } catch (err) {
        // Rollback on error
        fetchData();
        throw err;
      }
    },
    [fetchData]
  );

  const assignRider = useCallback(
    async (orderId: string, riderId: string) => {
      const rider = riders.find((r) => r.id === riderId);

      // Optimistic updates
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId
            ? { ...order, rider: rider?.name, status: 'confirmed' as OrderStatus }
            : order
        )
      );

      setRiders((prev) =>
        prev.map((r) =>
          r.id === riderId ? { ...r, status: 'busy' as const } : r
        )
      );

      try {
        await new Promise((resolve) => setTimeout(resolve, 300));
      } catch (err) {
        fetchData();
        throw err;
      }
    },
    [riders, fetchData]
  );

  const updateRiderStatus = useCallback(
    async (riderId: string, status: Rider['status']) => {
      setRiders((prev) =>
        prev.map((rider) =>
          rider.id === riderId ? { ...rider, status } : rider
        )
      );

      try {
        await new Promise((resolve) => setTimeout(resolve, 300));
      } catch (err) {
        fetchData();
        throw err;
      }
    },
    [fetchData]
  );

  const stats: DeliveryStats = {
    activeOrders: orders.filter(
      (o) => !['delivered', 'cancelled'].includes(o.status)
    ).length,
    ridersOnline: riders.filter((r) => r.status !== 'offline').length,
    avgDeliveryTime: 28,
    successRate: 96.8,
  };

  return {
    orders,
    riders,
    stats,
    isLoading,
    error,
    refetch: fetchData,
    updateOrderStatus,
    assignRider,
    updateRiderStatus,
  };
}

// Hook for tracking rider location
export function useRiderTracking(
  riderId: string | null,
  updateInterval = 5000
) {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!riderId) {
      setLocation(null);
      return;
    }

    let isMounted = true;
    let intervalId: NodeJS.Timeout;

    const fetchLocation = async () => {
      try {
        // In production, this would fetch real location data
        // For demo, we simulate movement
        setLocation((prev) => {
          if (!prev) {
            return { lat: 39.783, lng: -89.645 };
          }
          return {
            lat: prev.lat + (Math.random() - 0.5) * 0.001,
            lng: prev.lng + (Math.random() - 0.5) * 0.001,
          };
        });
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch location');
        }
      }
    };

    fetchLocation();
    intervalId = setInterval(fetchLocation, updateInterval);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [riderId, updateInterval]);

  return { location, error };
}

// Hook for real-time order updates
export function useOrderUpdates(orderIds: string[]) {
  const [updates, setUpdates] = useState<
    Map<string, { status: OrderStatus; timestamp: Date }>
  >(new Map());
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (orderIds.length === 0) return;

    setIsConnected(true);

    // Simulate receiving updates
    const intervalId = setInterval(() => {
      orderIds.forEach((id) => {
        if (Math.random() > 0.9) {
          // 10% chance of update
          setUpdates((prev) => {
            const newMap = new Map(prev);
            newMap.set(id, {
              status: 'in_transit',
              timestamp: new Date(),
            });
            return newMap;
          });
        }
      });
    }, 3000);

    return () => {
      clearInterval(intervalId);
      setIsConnected(false);
    };
  }, [orderIds]);

  return { updates, isConnected };
}
