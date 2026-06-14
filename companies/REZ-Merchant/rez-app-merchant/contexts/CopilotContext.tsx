/**
 * Copilot Context
 *
 * Provides AI-powered insights from the REZ Intent Graph to the merchant app.
 * Manages connection state, data refresh, and insight acknowledgment.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { useAuth } from './AuthContext';
import { useStore } from './StoreContext';
import {
  copilotInsightsService,
  CopilotDashboardData,
  AgentStatus,
  AgentInsight,
  DemandSignalData,
  ScarcitySignalData,
  AttributionData,
  ChurnSignalData,
  MarginAlertData,
  InventoryForecastData,
  RevenueOptimizerData,
  AudienceSegment,
} from '../services/api/copilotInsights';
import {
  merchantCopilotService,
  createNotificationAlertBridge,
  OrderForCopilot,
  NotificationForCopilot,
  CopilotAlert,
} from '../services/api/copilotOrderIntegration';
import { logger } from '@/utils/logger';

interface CopilotContextType {
  // Connection state
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;

  // Agent statuses
  agentStatuses: AgentStatus[];

  // Dashboard data
  dashboardData: CopilotDashboardData | null;

  // Individual data arrays
  demandSignals: DemandSignalData[];
  scarcitySignals: ScarcitySignalData[];
  attribution: AttributionData | null;
  churnSignals: ChurnSignalData[];
  marginAlerts: MarginAlertData[];
  inventoryForecasts: InventoryForecastData[];
  revenueOptimizer: RevenueOptimizerData | null;
  audienceSegments: AudienceSegment[];

  // Insights
  insights: AgentInsight[];
  highPriorityInsights: AgentInsight[];
  opportunities: AgentInsight[];
  alerts: AgentInsight[];

  // Order & Notification alerts (REZ Mind integration)
  orderAlerts: CopilotAlert[];
  notificationAlerts: CopilotAlert[];

  // Actions
  refresh: () => Promise<void>;
  acknowledgeInsight: (insightId: string) => Promise<boolean>;
  setSelectedCategory: (category: string | null) => void;
  selectedCategory: string | null;

  // REZ Mind order & notification integration
  syncOrderForInsights: (order: OrderForCopilot) => Promise<AgentInsight[]>;
  processNotificationAlert: (notification: NotificationForCopilot) => Promise<CopilotAlert | null>;
  acknowledgeAlert: (alertId: string) => Promise<boolean>;
}

const CopilotContext = createContext<CopilotContextType | undefined>(undefined);

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

export const CopilotProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { merchant } = useAuth();
  const { activeStore } = useStore();

  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Agent statuses
  const [agentStatuses, setAgentStatuses] = useState<AgentStatus[]>([]);

  // Dashboard data
  const [dashboardData, setDashboardData] = useState<CopilotDashboardData | null>(null);

  // Individual data arrays
  const [demandSignals, setDemandSignals] = useState<DemandSignalData[]>([]);
  const [scarcitySignals, setScarcitySignals] = useState<ScarcitySignalData[]>([]);
  const [attribution, setAttribution] = useState<AttributionData | null>(null);
  const [churnSignals, setChurnSignals] = useState<ChurnSignalData[]>([]);
  const [marginAlerts, setMarginAlerts] = useState<MarginAlertData[]>([]);
  const [inventoryForecasts, setInventoryForecasts] = useState<InventoryForecastData[]>([]);
  const [revenueOptimizer, setRevenueOptimizer] = useState<RevenueOptimizerData | null>(null);
  const [audienceSegments, setAudienceSegments] = useState<AudienceSegment[]>([]);

  // Insights
  const [insights, setInsights] = useState<AgentInsight[]>([]);

  // Order & Notification alerts (REZ Mind integration)
  const [orderAlerts, setOrderAlerts] = useState<CopilotAlert[]>([]);
  const [notificationAlerts, setNotificationAlerts] = useState<CopilotAlert[]>([]);

  // Refs
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const merchantIdRef = useRef<string | null>(null);

  // Update merchant ID ref when merchant changes
  useEffect(() => {
    merchantIdRef.current = merchant?.id || null;
  }, [merchant?.id]);

  // Load all copilot data
  const loadData = useCallback(async () => {
    const currentMerchantId = merchantIdRef.current;
    if (!currentMerchantId) {
      logger.debug('[CopilotContext] No merchant ID, skipping data load');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [
        dashboardResult,
        agentsResult,
        demandResult,
        scarcityResult,
        attributionResult,
        churnResult,
        marginResult,
        inventoryResult,
        revenueResult,
        segmentsResult,
        insightsResult,
      ] = await Promise.allSettled([
        copilotInsightsService.getDashboard(activeStore?._id),
        copilotInsightsService.getAgentStatuses(),
        copilotInsightsService.getDemandSignals(currentMerchantId, selectedCategory || undefined),
        copilotInsightsService.getScarcitySignals(currentMerchantId, selectedCategory || undefined),
        copilotInsightsService.getAttributionData(currentMerchantId),
        copilotInsightsService.getChurnSignals(currentMerchantId),
        copilotInsightsService.getMarginAlerts(currentMerchantId),
        copilotInsightsService.getInventoryForecasts(currentMerchantId, selectedCategory || undefined),
        copilotInsightsService.getRevenueOptimizer(currentMerchantId),
        copilotInsightsService.getAudienceSegments(currentMerchantId),
        copilotInsightsService.getInsights(currentMerchantId, { limit: 50 }),
      ]);

      // Update state with results
      if (dashboardResult.status === 'fulfilled') {
        setDashboardData(dashboardResult.value);
      }

      if (agentsResult.status === 'fulfilled') {
        setAgentStatuses(agentsResult.value);
      }

      if (demandResult.status === 'fulfilled') {
        setDemandSignals(demandResult.value);
      }

      if (scarcityResult.status === 'fulfilled') {
        setScarcitySignals(scarcityResult.value);
      }

      if (attributionResult.status === 'fulfilled') {
        setAttribution(attributionResult.value);
      }

      if (churnResult.status === 'fulfilled') {
        setChurnSignals(churnResult.value);
      }

      if (marginResult.status === 'fulfilled') {
        setMarginAlerts(marginResult.value);
      }

      if (inventoryResult.status === 'fulfilled') {
        setInventoryForecasts(inventoryResult.value);
      }

      if (revenueResult.status === 'fulfilled') {
        setRevenueOptimizer(revenueResult.value);
      }

      if (segmentsResult.status === 'fulfilled') {
        setAudienceSegments(segmentsResult.value);
      }

      if (insightsResult.status === 'fulfilled') {
        setInsights(insightsResult.value);
      }

      setIsConnected(true);
      setLastUpdated(new Date());
    } catch (err) {
      logger.error('[CopilotContext] Failed to load data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load copilot data');
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, [activeStore?._id, selectedCategory]);

  // Refresh function
  const refresh = useCallback(async () => {
    await loadData();
  }, [loadData]);

  // Acknowledge insight
  const handleAcknowledgeInsight = useCallback(async (insightId: string): Promise<boolean> => {
    const success = await copilotInsightsService.acknowledgeInsight(insightId, true);
    if (success) {
      setInsights((prev) => prev.filter((insight) => insight.id !== insightId));
    }
    return success;
  }, []);

  // Sync order to copilot for insights (REZ Mind integration)
  const syncOrderForInsights = useCallback(async (order: OrderForCopilot): Promise<AgentInsight[]> => {
    const insights = await merchantCopilotService.getOrderInsights(merchant?.id || '', {
      status: order.status,
      limit: 5,
    });

    // Update order alerts if there are any
    const alertBridge = createNotificationAlertBridge(merchant?.id || '', {});
    const result = await alertBridge.syncOrderForInsights(order);

    // Add new insights to the state
    if (result.length > 0) {
      setInsights((prev) => [...result, ...prev].slice(0, 50));
    }

    return result;
  }, [merchant?.id]);

  // Process notification to AI alert (REZ Mind integration)
  const processNotificationAlert = useCallback(async (
    notification: NotificationForCopilot
  ): Promise<CopilotAlert | null> => {
    const alertBridge = createNotificationAlertBridge(merchant?.id || '', {});
    const alert = await alertBridge.bridgeNotification(notification);

    if (alert) {
      if (alert.source === 'order') {
        setOrderAlerts((prev) => [alert, ...prev].slice(0, 20));
      } else {
        setNotificationAlerts((prev) => [alert, ...prev].slice(0, 20));
      }
    }

    return alert;
  }, [merchant?.id]);

  // Acknowledge/dismiss an alert
  const handleAcknowledgeAlert = useCallback(async (alertId: string): Promise<boolean> => {
    const success = await merchantCopilotService.acknowledgeAlert(alertId);
    if (success) {
      setOrderAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
      setNotificationAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
    }
    return success;
  }, []);

  // Set up auto-refresh
  useEffect(() => {
    if (merchant?.id) {
      loadData();

      // Set up auto-refresh
      refreshIntervalRef.current = setInterval(() => {
        loadData();
      }, REFRESH_INTERVAL);
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [merchant?.id, loadData]);

  // Derived values
  const highPriorityInsights = insights.filter((i) => i.priority === 'high');
  const opportunities = insights.filter((i) => i.type === 'opportunity');
  const alerts = insights.filter((i) => i.type === 'alert');

  const value: CopilotContextType = {
    isConnected,
    isLoading,
    error,
    lastUpdated,
    agentStatuses,
    dashboardData,
    demandSignals,
    scarcitySignals,
    attribution,
    churnSignals,
    marginAlerts,
    inventoryForecasts,
    revenueOptimizer,
    audienceSegments,
    insights,
    highPriorityInsights,
    opportunities,
    alerts,
    orderAlerts,
    notificationAlerts,
    refresh,
    acknowledgeInsight: handleAcknowledgeInsight,
    selectedCategory,
    setSelectedCategory,
    syncOrderForInsights,
    processNotificationAlert,
    acknowledgeAlert: handleAcknowledgeAlert,
  };

  return <CopilotContext.Provider value={value}>{children}</CopilotContext.Provider>;
};

export const useCopilot = (): CopilotContextType => {
  const context = useContext(CopilotContext);
  if (!context) {
    throw new Error('useCopilot must be used within a CopilotProvider');
  }
  return context;
};

export default CopilotContext;
