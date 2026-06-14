import { Station, IStation } from '../models/Station';
import { StationType, ItemStationMapping } from '../config';

export interface RoutingRule {
  itemType: string;
  targetStations: StationType[];
  priority: 'primary' | 'secondary' | 'fallback';
  estimatedTime: number; // seconds
}

export interface RoutingDecision {
  itemType: string;
  assignedStations: StationType[];
  reasoning: string;
  estimatedCompletionTime: number;
}

export class StationRoutingService {
  private customRules: Map<string, RoutingRule> = new Map();

  constructor() {
    this.initializeDefaultRules();
  }

  private initializeDefaultRules() {
    // Default item to station mappings
    for (const [itemType, stations] of Object.entries(ItemStationMapping)) {
      this.customRules.set(itemType, {
        itemType,
        targetStations: stations,
        priority: 'primary',
        estimatedTime: this.getDefaultEstimatedTime(stations[0])
      });
    }
  }

  private getDefaultEstimatedTime(station: StationType): number {
    switch (station) {
      case StationType.GRILL:
        return 420; // 7 minutes
      case StationType.FRYER:
        return 240; // 4 minutes
      case StationType.SALAD:
        return 120; // 2 minutes
      case StationType.DESSERT:
        return 180; // 3 minutes
      case StationType.BEVERAGE:
        return 60; // 1 minute
      case StationType.EXPO:
        return 60; // 1 minute
      case StationType.PREP:
        return 300; // 5 minutes
      default:
        return 300;
    }
  }

  async getStations(stationType?: StationType): Promise<IStation[]> {
    const query = { isActive: true };
    if (stationType) {
      Object.assign(query, { stationType });
    }
    return Station.find(query).sort({ name: 1 });
  }

  async getStationById(stationId: string): Promise<IStation | null> {
    return Station.findOne({ stationId });
  }

  async getStationLoad(stationType: StationType): Promise<{
    stationType: StationType;
    activeStations: number;
    totalOrders: number;
    averageLoad: number;
  }> {
    const stations = await Station.find({ stationType, isActive: true });
    const totalOrders = stations.reduce((sum, s) => sum + s.currentOrderCount, 0);
    const avgLoad = stations.length > 0 ? totalOrders / stations.length : 0;

    return {
      stationType,
      activeStations: stations.length,
      totalOrders,
      averageLoad: Math.round(avgLoad * 100) / 100
    };
  }

  async getAllStationLoads(): Promise<Map<StationType, {
    stationType: StationType;
    activeStations: number;
    totalOrders: number;
    averageLoad: number;
    avgCompletionTime: number;
  }>> {
    const loads = new Map<StationType, {
      stationType: StationType;
      activeStations: number;
      totalOrders: number;
      averageLoad: number;
      avgCompletionTime: number;
    }>();

    for (const stationType of Object.values(StationType)) {
      const stations = await Station.find({ stationType, isActive: true });
      if (stations.length === 0) continue;

      const totalOrders = stations.reduce((sum, s) => sum + s.currentOrderCount, 0);
      const avgLoad = totalOrders / stations.length;
      const avgCompletionTime = stations.reduce((sum, s) => sum + s.averageTicketTime, 0) / stations.length;

      loads.set(stationType, {
        stationType,
        activeStations: stations.length,
        totalOrders,
        averageLoad: Math.round(avgLoad * 100) / 100,
        avgCompletionTime: Math.round(avgCompletionTime)
      });
    }

    return loads;
  }

  routeItem(itemType: string, quantity: number = 1): RoutingDecision {
    const normalizedType = itemType.toLowerCase().replace(/\s+/g, '_');
    const rule = this.customRules.get(normalizedType);

    if (rule) {
      return {
        itemType: normalizedType,
        assignedStations: rule.targetStations,
        reasoning: `Matched routing rule for ${itemType}`,
        estimatedCompletionTime: rule.estimatedTime * quantity
      };
    }

    // Default fallback - route to prep station
    return {
      itemType: normalizedType,
      assignedStations: [StationType.PREP],
      reasoning: `No specific rule found, routed to prep station`,
      estimatedCompletionTime: 300 * quantity
    };
  }

  routeOrder(items: Array<{
    itemType: string;
    quantity: number;
  }>): {
    stations: StationType[];
    routingDecisions: RoutingDecision[];
    estimatedTotalTime: number;
  }> {
    const routingDecisions: RoutingDecision[] = [];
    const stationSet = new Set<StationType>();
    let maxTime = 0;

    for (const item of items) {
      const decision = this.routeItem(item.itemType, item.quantity);
      routingDecisions.push(decision);

      for (const station of decision.assignedStations) {
        stationSet.add(station);
      }

      maxTime = Math.max(maxTime, decision.estimatedCompletionTime);
    }

    return {
      stations: Array.from(stationSet),
      routingDecisions,
      estimatedTotalTime: maxTime
    };
  }

  async addCustomRule(rule: RoutingRule): Promise<void> {
    this.customRules.set(rule.itemType.toLowerCase(), rule);
  }

  async removeCustomRule(itemType: string): Promise<boolean> {
    return this.customRules.delete(itemType.toLowerCase());
  }

  getRoutingRules(): RoutingRule[] {
    return Array.from(this.customRules.values());
  }

  async initializeStations(): Promise<void> {
    await Station.initializeDefaultStations();
  }

  async toggleStation(stationId: string, isActive: boolean): Promise<IStation | null> {
    return Station.findOneAndUpdate(
      { stationId },
      { isActive },
      { new: true }
    );
  }

  async updateStationConfig(
    stationId: string,
    config: Partial<IStation['config']>
  ): Promise<IStation | null> {
    const station = await Station.findOne({ stationId });
    if (!station) return null;

    station.config = { ...station.config, ...config };
    await station.save();

    return station;
  }

  async getStationMetrics(stationType: StationType): Promise<{
    stationType: StationType;
    ordersToday: number;
    avgTicketTime: number;
    currentLoad: number;
    performance: 'excellent' | 'good' | 'normal' | 'slow';
  }> {
    const stations = await Station.find({ stationType, isActive: true });
    if (stations.length === 0) {
      return {
        stationType,
        ordersToday: 0,
        avgTicketTime: 0,
        currentLoad: 0,
        performance: 'normal'
      };
    }

    const ordersToday = stations.reduce((sum, s) => sum + s.ordersCompletedToday, 0);
    const avgTicketTime = stations.reduce((sum, s) => sum + s.averageTicketTime, 0) / stations.length;
    const currentLoad = stations.reduce((sum, s) => sum + s.currentOrderCount, 0);

    // Determine performance based on current load vs historical average
    const historicalAvgLoad = avgTicketTime > 0 ? 1 : 0.5;
    const loadRatio = currentLoad / Math.max(historicalAvgLoad, 1);

    let performance: 'excellent' | 'good' | 'normal' | 'slow';
    if (loadRatio < 0.5) performance = 'excellent';
    else if (loadRatio < 0.8) performance = 'good';
    else if (loadRatio < 1.2) performance = 'normal';
    else performance = 'slow';

    return {
      stationType,
      ordersToday,
      avgTicketTime: Math.round(avgTicketTime),
      currentLoad,
      performance
    };
  }
}

export const stationRoutingService = new StationRoutingService();
