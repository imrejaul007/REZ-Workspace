// @ts-nocheck
/**
 * Live Activity Hook
 * Real-time data subscription for live activities
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuthUser } from '@/stores/selectors';
import liveActivityService, {
  LiveActivity,
  LiveMerchantData,
  TrendingItem,
} from '@/services/liveActivityService';

export function useLiveActivities() {
  const user = useAuthUser();
  const [activities, setActivities] = useState<LiveActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    // Connect WebSocket
    liveActivityService.connect(user.id);

    // Subscribe to activity updates
    const unsubscribe = liveActivityService.on('activity', (data) => {
      setActivities(data as LiveActivity[]);
      setLoading(false);
    });

    // Fetch initial data
    liveActivityService.getActivities().then((data) => {
      setActivities(data);
      setLoading(false);
    });

    return () => {
      unsubscribe();
      liveActivityService.disconnect();
    };
  }, [user?.id]);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await liveActivityService.getActivities();
    setActivities(data);
    setLoading(false);
  }, []);

  return { activities, loading, refresh };
}

export function useMerchantLiveData(merchantId: string) {
  const [data, setData] = useState<LiveMerchantData | null>(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!merchantId) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      const merchantData = await liveActivityService.getMerchantLiveData(merchantId);
      setData(merchantData);
      setLoading(false);
    };

    fetchData();

    // Poll every 30 seconds for live updates
    intervalRef.current = setInterval(fetchData, 30000);

    // Subscribe to real-time updates
    const unsubscribe = liveActivityService.on('merchants', (message: unknown) => {
      const merchantUpdate = message as { merchantId: string; data: LiveMerchantData };
      if (merchantUpdate.merchantId === merchantId) {
        setData(merchantUpdate.data);
      }
    });

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      unsubscribe();
    };
  }, [merchantId]);

  return { data, loading };
}

export function useTrendingItems(city?: string) {
  const [items, setItems] = useState<TrendingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      const trending = await liveActivityService.getTrendingItems({ city });
      setItems(trending);
      setLoading(false);
    };

    fetchTrending();

    // Subscribe to trending updates
    const unsubscribe = liveActivityService.on('trending', (data) => {
      setItems(data as TrendingItem[]);
    });

    return unsubscribe;
  }, [city]);

  const refresh = useCallback(async () => {
    setLoading(true);
    const trending = await liveActivityService.getTrendingItems({ city });
    setItems(trending);
    setLoading(false);
  }, [city]);

  return { items, loading, refresh };
}

export function useFriendsActivity() {
  const user = useAuthUser();
  const [activities, setActivities] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const fetchActivity = async () => {
      const friendActivities = await liveActivityService.getFriendsActivity();
      setActivities(friendActivities);
      setLoading(false);
    };

    fetchActivity();

    // Subscribe to social updates
    const unsubscribe = liveActivityService.on('social', (data) => {
      setActivities(data as unknown[]);
    });

    return unsubscribe;
  }, [user?.id]);

  return { activities, loading };
}
