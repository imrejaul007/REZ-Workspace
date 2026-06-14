/**
 * Kitchen AI - Intelligent Kitchen Display System
 * Handles prep time prediction, firing suggestions, bottleneck detection,
 * delay alerts, and cook time tracking with historical analysis.
 */

import { EventEmitter } from 'events';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface Order {
  id: string;
  items: OrderItem[];
  priority: number; // 1-5, 1 being highest
  createdAt: Date;
  targetReadyTime?: Date;
  customerId?: string;
}

export interface OrderItem {
  id: string;
  name: string;
  station: StationType;
  prepTime: number; // base prep time in minutes
  cookTime: number; // base cook time in minutes
  quantity: number;
  modifiers?: string[];
  dependencies?: string[]; // item IDs that must complete first
}

export interface FireItem {
  itemId: string;
  orderId: string;
  fireAt: Date;
  station: StationType;
  priority: number;
  urgency: 'critical' | 'high' | 'normal' | 'low';
  reason: string;
}

export interface KitchenState {
  stations: Station[];
  orders: Order[];
  activeOrders: ActiveOrder[];
  currentTime: Date;
}

export interface Station {
  id: string;
  name: string;
  type: StationType;
  capacity: number;
  currentLoad: number;
  items: string[]; // item IDs currently being prepared
  avgCompletionTime: number; // historical average in minutes
}

export interface ActiveOrder {
  orderId: string;
  items: ActiveItem[];
  status: 'pending' | 'in-progress' | 'ready' | 'delayed';
  startedAt: Date;
  estimatedCompletion: Date;
  delays: DelayRecord[];
}

export interface ActiveItem {
  itemId: string;
  orderId: string;
  station: StationType;
  status: 'queued' | 'cooking' | 'held' | 'completed';
  startedAt?: Date;
  completedAt?: Date;
  cookProgress: number; // 0-100
  actualCookTime?: number;
}

export interface Bottleneck {
  station: StationType;
  severity: 'critical' | 'warning' | 'info';
  reason: string;
  affectedOrders: string[];
  recommendations: string[];
  estimatedDelay: number; // minutes
}

export interface DelayRecord {
  orderId: string;
  itemId: string;
  delayMinutes: number;
  reason: string;
  reportedAt: Date;
  escalated: boolean;
}

export interface CookItem {
  itemId: string;
  orderId: string;
  station: StationType;
  cookDuration: number; // actual cook time in seconds
  startTime: Date;
  endTime: Date;
  status: 'on-time' | 'late' | 'early';
}

export interface PrepTimePrediction {
  estimatedMinutes: number;
  confidence: number; // 0-1
  factors: PredictionFactor[];
  stationBreakdown: StationBreakdown[];
}

export interface PredictionFactor {
  name: string;
  impact: number; // minutes adjustment
  weight: number; // 0-1 importance
}

export interface StationBreakdown {
  station: StationType;
  estimatedMinutes: number;
  queueAhead: number;
}

export interface HistoricalDataPoint {
  orderId: string;
  itemId: string;
  station: StationType;
  prepTime: number;
  cookTime: number;
  actualTotalTime: number;
  timestamp: Date;
  dayOfWeek: number;
  hourOfDay: number;
  wasDelayed: boolean;
  delayMinutes: number;
}

export interface AlertConfig {
  delayThreshold: number; // minutes before first alert
  escalationLevels: EscalationLevel[];
  maxAlertAge: number; // minutes before auto-resolve
}

export interface EscalationLevel {
  level: number;
  delayThreshold: number; // minutes
  notificationChannels: string[];
  autoAction?: string;
}

export type StationType = 'grill' | 'fry' | 'saute' | 'pasta' | 'salad' | 'dessert' | 'beverage' | 'expo';

// ============================================================================
// Priority Queue Implementation
// ============================================================================

class PriorityQueue<T> {
  private heap: Array<{ priority: number; item: T }> = [];

  enqueue(item: T, priority: number): void {
    this.heap.push({ priority, item });
    this.bubbleUp(this.heap.length - 1);
  }

  dequeue(): T | undefined {
    if (this.heap.length === 0) return undefined;
    const top = this.heap[0].item;
    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.bubbleDown(0);
    }
    return top;
  }

  peek(): T | undefined {
    return this.heap[0]?.item;
  }

  size(): number {
    return this.heap.length;
  }

  isEmpty(): boolean {
    return this.heap.length === 0;
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.heap[parentIndex].priority <= this.heap[index].priority) break;
      [this.heap[parentIndex], this.heap[index]] = [this.heap[index], this.heap[parentIndex]];
      index = parentIndex;
    }
  }

  private bubbleDown(index: number): void {
    const length = this.heap.length;
    while (true) {
      const leftChild = 2 * index + 1;
      const rightChild = 2 * index + 2;
      let smallest = index;

      if (leftChild < length && this.heap[leftChild].priority < this.heap[smallest].priority) {
        smallest = leftChild;
      }
      if (rightChild < length && this.heap[rightChild].priority < this.heap[smallest].priority) {
        smallest = rightChild;
      }
      if (smallest === index) break;
      [this.heap[index], this.heap[smallest]] = [this.heap[smallest], this.heap[index]];
      index = smallest;
    }
  }

  toArray(): Array<{ priority: number; item: T }> {
    return [...this.heap].sort((a, b) => a.priority - b.priority);
  }
}

// ============================================================================
// Time Series Prediction Engine
// ============================================================================

class TimeSeriesPredictor {
  private historicalData: HistoricalDataPoint[] = [];
  private readonly windowSize = 50; // number of recent data points for prediction
  private readonly decayFactor = 0.95; // exponential decay for older data

  addDataPoint(data: HistoricalDataPoint): void {
    this.historicalData.push(data);
    // Keep only recent data to prevent memory growth
    if (this.historicalData.length > 10000) {
      this.historicalData = this.historicalData.slice(-5000);
    }
  }

  /**
   * Predict prep time using weighted moving average with time-based adjustments
   */
  predictPrepTime(item: OrderItem, currentQueue: number, hourOfDay: number, dayOfWeek: number): PrepTimePrediction {
    const basePrepTime = item.prepTime;
    const baseCookTime = item.cookTime;
    const quantityMultiplier = Math.sqrt(item.quantity); // Diminishing returns for quantity

    // Get historical data for this item/station combination
    const historicalItems = this.getRecentHistoricalData(item.station, item.name);

    // Calculate weighted moving average from historical data
    let weightedAvg = basePrepTime;
    let confidence = 0.5; // Lower confidence without data

    if (historicalItems.length > 0) {
      const weights = historicalItems.map((_, i) => Math.pow(this.decayFactor, historicalItems.length - i - 1));
      const totalWeight = weights.reduce((a, b) => a + b, 0);
      weightedAvg = historicalItems.reduce((sum, item, i) => sum + item.actualTotalTime * weights[i], 0) / totalWeight;
      confidence = Math.min(0.95, 0.5 + (historicalItems.length / 100)); // More data = higher confidence
    }

    // Time-based adjustment factors
    const hourFactor = this.getHourFactor(hourOfDay);
    const dayFactor = this.getDayFactor(dayOfWeek);
    const queueFactor = 1 + (currentQueue * 0.05); // 5% increase per item in queue

    // Apply adjustments
    const adjustedTime = weightedAvg * quantityMultiplier * hourFactor * dayFactor * queueFactor;

    // Calculate factors for transparency
    const factors: PredictionFactor[] = [
      { name: 'Historical average', impact: weightedAvg - basePrepTime, weight: 0.4 },
      { name: 'Time of day', impact: (hourFactor - 1) * weightedAvg, weight: 0.2 },
      { name: 'Day of week', impact: (dayFactor - 1) * weightedAvg, weight: 0.15 },
      { name: 'Current queue', impact: (queueFactor - 1) * weightedAvg, weight: 0.25 }
    ];

    // Station breakdown
    const stationBreakdown: StationBreakdown[] = [{
      station: item.station,
      estimatedMinutes: adjustedTime,
      queueAhead: currentQueue
    }];

    return {
      estimatedMinutes: Math.round(adjustedTime * 10) / 10,
      confidence: Math.round(confidence * 100) / 100,
      factors,
      stationBreakdown
    };
  }

  /**
   * Get recent historical data filtered by station and item name
   */
  private getRecentHistoricalData(station: StationType, itemName: string): HistoricalDataPoint[] {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - 24); // Last 24 hours

    return this.historicalData
      .filter(d => d.timestamp > cutoff && d.station === station)
      .slice(-this.windowSize);
  }

  /**
   * Time-of-day factor based on historical patterns
   * Rush hours typically have slower prep times
   */
  private getHourFactor(hour: number): number {
    const rushHours = [11, 12, 13, 17, 18, 19]; // Lunch and dinner rush
    if (rushHours.includes(hour)) return 1.15;
    if (hour >= 6 && hour <= 10) return 0.95; // Morning efficiency
    if (hour >= 14 && hour <= 16) return 0.9; // Afternoon lull
    return 1.0;
  }

  /**
   * Day-of-week factor based on historical patterns
   */
  private getDayFactor(day: number): number {
    // Weekend (0 = Sunday, 6 = Saturday) typically busier
    if (day === 0 || day === 6) return 1.1;
    if (day === 1 || day === 5) return 1.05; // Monday, Friday
    return 1.0;
  }

  /**
   * Simple exponential smoothing for trend detection
   */
  detectTrend(station: StationType, windowHours: number = 4): 'improving' | 'degrading' | 'stable' {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - windowHours);

    const recentData = this.historicalData
      .filter(d => d.station === station && d.timestamp > cutoff)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    if (recentData.length < 5) return 'stable';

    const midPoint = Math.floor(recentData.length / 2);
    const firstHalf = recentData.slice(0, midPoint);
    const secondHalf = recentData.slice(midPoint);

    const firstAvg = firstHalf.reduce((sum, d) => sum + d.actualTotalTime, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, d) => sum + d.actualTotalTime, 0) / secondHalf.length;

    const changePercent = (secondAvg - firstAvg) / firstAvg;

    if (changePercent > 0.1) return 'degrading';
    if (changePercent < -0.1) return 'improving';
    return 'stable';
  }

  getHistoricalData(): HistoricalDataPoint[] {
    return this.historicalData;
  }
}

// ============================================================================
// Alert Escalation System
// ============================================================================

class AlertEscalation {
  private activeAlerts: Map<string, AlertRecord> = new Map();
  private readonly defaultConfig: AlertConfig = {
    delayThreshold: 5,
    escalationLevels: [
      { level: 1, delayThreshold: 5, notificationChannels: ['station-display'] },
      { level: 2, delayThreshold: 10, notificationChannels: ['station-display', 'kitchen-manager'] },
      { level: 3, delayThreshold: 20, notificationChannels: ['station-display', 'kitchen-manager', 'expeditor'] },
      { level: 4, delayThreshold: 30, notificationChannels: ['station-display', 'kitchen-manager', 'expeditor', 'manager'], autoAction: 'notify-customer' }
    ],
    maxAlertAge: 60
  };
  private config: AlertConfig;
  private alertHistory: AlertRecord[] = [];
  private eventEmitter: EventEmitter;

  constructor(config?: Partial<AlertConfig>, eventEmitter?: EventEmitter) {
    this.config = { ...this.defaultConfig, ...config };
    this.eventEmitter = eventEmitter || new EventEmitter();
  }

  async alertDelay(orderId: string, delay: number, reason?: string): Promise<AlertRecord> {
    const existingAlert = this.activeAlerts.get(orderId);
    const currentLevel = this.getEscalationLevel(delay);
    const previousLevel = existingAlert?.level || 0;

    const alertRecord: AlertRecord = {
      orderId,
      delayMinutes: delay,
      reason: reason || 'Unknown delay reason',
      level: currentLevel,
      reportedAt: new Date(),
      escalated: currentLevel > previousLevel,
      acknowledged: false,
      resolved: false
    };

    this.activeAlerts.set(orderId, alertRecord);
    this.alertHistory.push(alertRecord);

    // Emit events for notification
    if (currentLevel > previousLevel) {
      this.eventEmitter.emit('alert:escalated', alertRecord);
    } else {
      this.eventEmitter.emit('alert:new', alertRecord);
    }

    // Emit to specific channels based on level
    const escalationConfig = this.config.escalationLevels[currentLevel - 1];
    if (escalationConfig) {
      for (const channel of escalationConfig.notificationChannels) {
        this.eventEmitter.emit(`alert:channel:${channel}`, alertRecord);
      }
    }

    // Auto-action if configured
    const autoAction = this.config.escalationLevels[currentLevel - 1]?.autoAction;
    if (autoAction) {
      await this.executeAutoAction(autoAction, alertRecord);
    }

    return alertRecord;
  }

  private async executeAutoAction(action: string, alert: AlertRecord): Promise<void> {
    switch (action) {
      case 'notify-customer':
        this.eventEmitter.emit('action:notify-customer', alert);
        break;
      case 'flag-order':
        this.eventEmitter.emit('action:flag-order', alert);
        break;
      case 'reassign-station':
        this.eventEmitter.emit('action:reassign-station', alert);
        break;
    }
  }

  acknowledgeAlert(orderId: string): boolean {
    const alert = this.activeAlerts.get(orderId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedAt = new Date();
      this.eventEmitter.emit('alert:acknowledged', alert);
      return true;
    }
    return false;
  }

  resolveAlert(orderId: string): boolean {
    const alert = this.activeAlerts.get(orderId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = new Date();
      this.activeAlerts.delete(orderId);
      this.eventEmitter.emit('alert:resolved', alert);
      return true;
    }
    return false;
  }

  getActiveAlerts(): AlertRecord[] {
    return Array.from(this.activeAlerts.values());
  }

  getAlertHistory(limit: number = 100): AlertRecord[] {
    return this.alertHistory.slice(-limit);
  }

  private getEscalationLevel(delay: number): number {
    for (let i = this.config.escalationLevels.length - 1; i >= 0; i--) {
      if (delay >= this.config.escalationLevels[i].delayThreshold) {
        return this.config.escalationLevels[i].level;
      }
    }
    return 1;
  }

  getConfig(): AlertConfig {
    return this.config;
  }
}

interface AlertRecord {
  orderId: string;
  delayMinutes: number;
  reason: string;
  level: number;
  reportedAt: Date;
  escalated: boolean;
  acknowledged: boolean;
  acknowledgedAt?: Date;
  resolved: boolean;
  resolvedAt?: Date;
}

// ============================================================================
// Station Router
// ============================================================================

class StationRouter {
  private stationCapacities: Map<StationType, number> = new Map();
  private stationLoads: Map<StationType, number> = new Map();

  constructor(stations: Station[]) {
    for (const station of stations) {
      this.stationCapacities.set(station.type, station.capacity);
      this.stationLoads.set(station.type, station.currentLoad);
    }
  }

  /**
   * Route items to optimal stations based on capacity and load
   */
  routeOrder(order: Order): Map<StationType, OrderItem[]> {
    const routing: Map<StationType, OrderItem[]> = new Map();

    for (const item of order.items) {
      // First, try the requested station
      let targetStation = item.station;

      // If station is overloaded, find alternative
      if (this.isOverloaded(item.station)) {
        const alternative = this.findAlternativeStation(item.station, item);
        if (alternative) {
          targetStation = alternative;
        }
      }

      // Update load tracking
      this.incrementLoad(targetStation);

      // Add to routing map
      const stationItems = routing.get(targetStation) || [];
      stationItems.push({ ...item, station: targetStation }); // Use routed station
      routing.set(targetStation, stationItems);
    }

    return routing;
  }

  /**
   * Check if station is above 80% capacity
   */
  private isOverloaded(station: StationType): boolean {
    const capacity = this.stationCapacities.get(station) || 1;
    const load = this.stationLoads.get(station) || 0;
    return load / capacity > 0.8;
  }

  /**
   * Find an alternative station that can handle the item
   */
  private findAlternativeStation(original: StationType, item: OrderItem): StationType | null {
    // Define station compatibility
    const alternatives: Record<StationType, StationType[]> = {
      'grill': ['saute'],
      'fry': ['grill', 'saute'],
      'saute': ['grill', 'fry'],
      'pasta': ['saute'],
      'salad': ['dessert'],
      'dessert': ['salad'],
      'beverage': [],
      'expo': []
    };

    const candidates = alternatives[original] || [];

    for (const candidate of candidates) {
      const capacity = this.stationCapacities.get(candidate) || 1;
      const load = this.stationLoads.get(candidate) || 0;
      if (load / capacity < 0.6) { // Only route to stations under 60% capacity
        return candidate;
      }
    }

    return null;
  }

  private incrementLoad(station: StationType): void {
    const current = this.stationLoads.get(station) || 0;
    this.stationLoads.set(station, current + 1);
  }

  updateLoad(station: StationType, delta: number): void {
    const current = this.stationLoads.get(station) || 0;
    this.stationLoads.set(station, Math.max(0, current + delta));
  }

  getLoad(station: StationType): number {
    return this.stationLoads.get(station) || 0;
  }

  getStationUtilization(): Map<StationType, number> {
    const utilization = new Map<StationType, number>();
    for (const [station, capacity] of this.stationCapacities) {
      const load = this.stationLoads.get(station) || 0;
      utilization.set(station, capacity > 0 ? load / capacity : 0);
    }
    return utilization;
  }
}

// ============================================================================
// Cook Time Tracker
// ============================================================================

class CookTimeTracker {
  private activeCooks: Map<string, CookItem> = new Map();
  private completedCooks: CookItem[] = [];
  private readonly maxHistory = 5000;

  async trackCookTime(orderId: string, items: CookItem[]): Promise<void> {
    for (const item of items) {
      const key = `${item.orderId}:${item.itemId}`;

      if (item.endTime <= new Date()) {
        // Cook completed
        const completedItem: CookItem = {
          ...item,
          status: this.calculateStatus(item)
        };
        this.activeCooks.set(key, completedItem);
        this.completedCooks.push(completedItem);

        // Cleanup old history
        if (this.completedCooks.length > this.maxHistory) {
          this.completedCooks = this.completedCooks.slice(-this.maxHistory);
        }
      } else {
        // Cook in progress
        this.activeCooks.set(key, item);
      }
    }
  }

  private calculateStatus(item: CookItem): 'on-time' | 'late' | 'early' {
    const expectedDuration = item.cookDuration;
    const actualDuration = (item.endTime.getTime() - item.startTime.getTime()) / 1000;

    if (actualDuration > expectedDuration * 1.1) return 'late';
    if (actualDuration < expectedDuration * 0.9) return 'early';
    return 'on-time';
  }

  getActiveCooks(orderId?: string): CookItem[] {
    const cooks = Array.from(this.activeCooks.values());
    if (orderId) {
      return cooks.filter(c => c.orderId === orderId);
    }
    return cooks;
  }

  getCookHistory(station?: StationType): CookItem[] {
    if (station) {
      return this.completedCooks.filter(c => c.status !== 'late');
    }
    return this.completedCooks;
  }

  getAverageCookTime(station: StationType): number {
    const stationCooks = this.completedCooks.filter(c => c.station === station);
    if (stationCooks.length === 0) return 0;

    const totalTime = stationCooks.reduce((sum, c) => sum + c.cookDuration, 0);
    return totalTime / stationCooks.length;
  }

  getLateCookRate(station: StationType): number {
    const stationCooks = this.completedCooks.filter(c => c.station === station);
    if (stationCooks.length === 0) return 0;

    const lateCount = stationCooks.filter(c => c.status === 'late').length;
    return lateCount / stationCooks.length;
  }
}

// ============================================================================
// KitchenAI Main Class
// ============================================================================

export class KitchenAI {
  private timeSeriesPredictor: TimeSeriesPredictor;
  private alertEscalation: AlertEscalation;
  private stationRouter: StationRouter;
  private cookTimeTracker: CookTimeTracker;
  private priorityQueue: PriorityQueue<Order>;
  private eventEmitter: EventEmitter;
  private kitchenState: KitchenState;

  constructor(stations: Station[], config?: Partial<AlertConfig>) {
    this.eventEmitter = new EventEmitter();
    this.timeSeriesPredictor = new TimeSeriesPredictor();
    this.alertEscalation = new AlertEscalation(config, this.eventEmitter);
    this.stationRouter = new StationRouter(stations);
    this.cookTimeTracker = new CookTimeTracker();
    this.priorityQueue = new PriorityQueue<Order>();
    this.kitchenState = {
      stations,
      orders: [],
      activeOrders: [],
      currentTime: new Date()
    };
  }

  /**
   * Predict total prep time for an order based on items, queue, and historical data
   */
  async predictPrepTime(order: Order): Promise<PrepTimePrediction> {
    const now = new Date();
    const hourOfDay = now.getHours();
    const dayOfWeek = now.getDay();

    let totalPredictedTime = 0;
    const stationBreakdown: StationBreakdown[] = [];
    const allFactors: PredictionFactor[] = [];

    // Route items to stations
    const routing = this.stationRouter.routeOrder(order);

    for (const [station, items] of routing) {
      // Calculate station-specific predictions
      let stationPredictedTime = 0;
      let totalQueue = 0;

      for (const item of items) {
        // Get current queue for this station
        const currentQueue = this.getStationQueueLength(station);
        totalQueue += currentQueue;

        const prediction = this.timeSeriesPredictor.predictPrepTime(
          item,
          currentQueue,
          hourOfDay,
          dayOfWeek
        );

        stationPredictedTime += prediction.estimatedMinutes;
        allFactors.push(...prediction.factors);
      }

      // Account for parallel station execution (max time across stations)
      stationBreakdown.push({
        station,
        estimatedMinutes: stationPredictedTime,
        queueAhead: Math.max(...items.map(() => totalQueue))
      });

      totalPredictedTime = Math.max(totalPredictedTime, stationPredictedTime);
    }

    // Consider order priority (higher priority = slight time reduction)
    const priorityFactor = 1 - ((5 - order.priority) * 0.03); // 3% faster per priority level
    totalPredictedTime *= priorityFactor;

    // Calculate overall confidence based on available data
    const avgConfidence = 0.7; // Base confidence

    return {
      estimatedMinutes: Math.round(totalPredictedTime * 10) / 10,
      confidence: avgConfidence,
      factors: this.aggregateFactors(allFactors),
      stationBreakdown
    };
  }

  /**
   * Generate firing suggestions based on order items and timing
   */
  async getFireSuggestions(order: Order): Promise<FireItem[]> {
    const suggestions: FireItem[] = [];
    const prepTime = await this.predictPrepTime(order);

    // Calculate target ready time
    const targetTime = order.targetReadyTime || new Date(Date.now() + prepTime.estimatedMinutes * 60000);

    // Sort items by dependencies and cook time
    const sortedItems = this.sortItemsForFiring(order.items);

    let currentFireTime = new Date(targetTime);

    for (const item of sortedItems) {
      // Calculate fire time working backwards from target
      const itemTime = (item.prepTime + item.cookTime) * 60000 / Math.sqrt(item.quantity);
      currentFireTime = new Date(currentFireTime.getTime() - itemTime);

      // Determine urgency
      const urgency = this.calculateUrgency(item, order, currentFireTime);

      // Determine station
      const station = item.station;

      suggestions.push({
        itemId: item.id,
        orderId: order.id,
        fireAt: currentFireTime,
        station,
        priority: order.priority,
        urgency,
        reason: this.generateFireReason(item, urgency)
      });

      // Next item fires after this one's prep time
      currentFireTime = new Date(currentFireTime.getTime() - item.prepTime * 60000);
    }

    // Sort by fire time
    return suggestions.sort((a, b) => a.fireAt.getTime() - b.fireAt.getTime());
  }

  /**
   * Detect bottlenecks in the kitchen based on current state
   */
  async detectBottlenecks(kitchen: KitchenState): Promise<Bottleneck[]> {
    const bottlenecks: Bottleneck[] = [];
    const utilization = this.stationRouter.getStationUtilization();

    for (const [station, util] of utilization) {
      if (util > 0.9) {
        const severity = util > 0.95 ? 'critical' : 'warning';
        const affectedOrders = this.getOrdersAtStation(station, kitchen);

        // Get trend analysis
        const trend = this.timeSeriesPredictor.detectTrend(station);

        bottlenecks.push({
          station,
          severity,
          reason: `${station.toUpperCase()} station at ${Math.round(util * 100)}% capacity${trend !== 'stable' ? ` (${trend})` : ''}`,
          affectedOrders,
          recommendations: this.generateBottleneckRecommendations(station, util, trend),
          estimatedDelay: Math.round((util - 0.8) * 30) // Estimate 0-30 min delay based on overload
        });
      }
    }

    // Check for item dependencies causing delays
    const dependencyDelays = this.checkDependencyDelays(kitchen);
    bottlenecks.push(...dependencyDelays);

    return bottlenecks.sort((a, b) => {
      const severityOrder = { critical: 0, warning: 1, info: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }

  /**
   * Alert on delays with automatic escalation
   */
  async alertDelay(orderId: string, delay: number): Promise<void> {
    const delayRecord: DelayRecord = {
      orderId,
      itemId: '', // Will be populated by the alert system
      delayMinutes: delay,
      reason: 'Order delay detected',
      reportedAt: new Date(),
      escalated: false
    };

    await this.alertEscalation.alertDelay(orderId, delay, delayRecord.reason);

    // Emit event for external listeners
    this.eventEmitter.emit('delay:detected', delayRecord);
  }

  /**
   * Track cook times for items
   */
  async trackCookTime(orderId: string, items: CookItem[]): Promise<void> {
    await this.cookTimeTracker.trackCookTime(orderId, items);

    // Update historical data
    for (const item of items) {
      if (item.status !== 'on-time') {
        this.timeSeriesPredictor.addDataPoint({
          orderId: item.orderId,
          itemId: item.itemId,
          station: item.station,
          prepTime: 0, // Would be calculated from actual data
          cookTime: item.cookDuration,
          actualTotalTime: (item.endTime.getTime() - item.startTime.getTime()) / 60000,
          timestamp: new Date(),
          dayOfWeek: new Date().getDay(),
          hourOfDay: new Date().getHours(),
          wasDelayed: item.status === 'late',
          delayMinutes: item.status === 'late' ? 5 : 0 // Would be calculated
        });
      }
    }
  }

  // ============================================================================
  // Priority Queue Management
  // ============================================================================

  /**
   * Add order to priority queue
   */
  enqueueOrder(order: Order): void {
    // Lower priority number = higher priority
    const queuePriority = order.priority + (order.createdAt.getTime() / 1000000000000);
    this.priorityQueue.enqueue(order, queuePriority);
    this.kitchenState.orders.push(order);
  }

  /**
   * Get next order from priority queue
   */
  dequeueOrder(): Order | undefined {
    const order = this.priorityQueue.dequeue();
    if (order) {
      const index = this.kitchenState.orders.findIndex(o => o.id === order.id);
      if (index !== -1) {
        this.kitchenState.orders.splice(index, 1);
      }
    }
    return order;
  }

  /**
   * Peek at next order without removing it
   */
  peekNextOrder(): Order | undefined {
    return this.priorityQueue.peek();
  }

  /**
   * Get orders sorted by priority
   */
  getOrdersByPriority(): Order[] {
    return this.priorityQueue.toArray().map(entry => entry.item);
  }

  /**
   * Reorder queue based on updated priorities
   */
  reorderQueue(): void {
    const orders = this.kitchenState.orders;
    this.kitchenState.orders = [];
    for (const order of orders) {
      this.enqueueOrder(order);
    }
  }

  // ============================================================================
  // Historical Analysis
  // ============================================================================

  /**
   * Get performance metrics for a time period
   */
  getPerformanceMetrics(hours: number = 24): PerformanceMetrics {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - hours);

    const historicalData = this.timeSeriesPredictor.getHistoricalData()
      .filter(d => d.timestamp > cutoff);

    const totalOrders = historicalData.length;
    const delayedOrders = historicalData.filter(d => d.wasDelayed).length;
    const avgPrepTime = totalOrders > 0
      ? historicalData.reduce((sum, d) => sum + d.actualTotalTime, 0) / totalOrders
      : 0;

    // Calculate station metrics
    const stationMetrics: Record<StationType, StationMetric> = {} as any;
    for (const station of Object.values<StationType>({'grill': 'grill', 'fry': 'fry', 'saute': 'saute', 'pasta': 'pasta', 'salad': 'salad', 'dessert': 'dessert', 'beverage': 'beverage', 'expo': 'expo'})) {
      const stationData = historicalData.filter(d => d.station === station);
      if (stationData.length > 0) {
        stationMetrics[station] = {
          avgCookTime: stationData.reduce((sum, d) => sum + d.cookTime, 0) / stationData.length,
          lateRate: stationData.filter(d => d.wasDelayed).length / stationData.length,
          throughput: stationData.length / hours
        };
      }
    }

    return {
      totalOrders,
      delayedOrders,
      onTimeRate: totalOrders > 0 ? (totalOrders - delayedOrders) / totalOrders : 1,
      avgPrepTime,
      stationMetrics,
      periodHours: hours
    };
  }

  /**
   * Generate actionable insights from historical data
   */
  getInsights(): string[] {
    const insights: string[] = [];
    const metrics = this.getPerformanceMetrics(24);

    if (metrics.onTimeRate < 0.85) {
      insights.push(`On-time rate is below target (${Math.round(metrics.onTimeRate * 100)}%). Consider staffing review.`);
    }

    // Check for problematic stations
    for (const [station, metric] of Object.entries(metrics.stationMetrics)) {
      if (metric.lateRate > 0.2) {
        insights.push(`${station} station has ${Math.round(metric.lateRate * 100)}% late rate. Review procedures.`);
      }
    }

    // Check trends
    for (const station of Object.values<StationType>({'grill': 'grill', 'fry': 'fry', 'saute': 'saute', 'pasta': 'pasta', 'salad': 'salad', 'dessert': 'dessert', 'beverage': 'beverage', 'expo': 'expo'})) {
      const trend = this.timeSeriesPredictor.detectTrend(station);
      if (trend === 'degrading') {
        insights.push(`${station} station performance is degrading. Investigate root cause.`);
      }
    }

    return insights;
  }

  // ============================================================================
  // Event Handling
  // ============================================================================

  on(event: string, handler: (...args: any[]) => void): void {
    this.eventEmitter.on(event, handler);
  }

  off(event: string, handler: (...args: any[]) => void): void {
    this.eventEmitter.off(event, handler);
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private getStationQueueLength(station: StationType): number {
    return this.kitchenState.activeOrders
      .filter(o => o.items.some(i => i.station === station && i.status === 'queued'))
      .reduce((sum, o) => sum + o.items.filter(i => i.station === station).length, 0);
  }

  private getOrdersAtStation(station: StationType, kitchen: KitchenState): string[] {
    return kitchen.activeOrders
      .filter(o => o.items.some(i => i.station === station))
      .map(o => o.orderId);
  }

  private sortItemsForFiring(items: OrderItem[]): OrderItem[] {
    return [...items].sort((a, b) => {
      // Items with dependencies should fire later
      const aHasDeps = (a.dependencies?.length || 0) > 0;
      const bHasDeps = (b.dependencies?.length || 0) > 0;
      if (aHasDeps && !bHasDeps) return 1;
      if (!aHasDeps && bHasDeps) return -1;

      // Longer cook times fire first
      return (b.cookTime + b.prepTime) - (a.cookTime + a.prepTime);
    });
  }

  private calculateUrgency(item: OrderItem, order: Order, fireTime: Date): 'critical' | 'high' | 'normal' | 'low' {
    const timeUntilFire = fireTime.getTime() - Date.now();

    if (order.priority <= 2) return 'critical';
    if (timeUntilFire < 0) return 'critical';
    if (timeUntilFire < 300000) return 'high'; // Less than 5 minutes
    if (item.modifiers?.length) return 'normal';
    return 'low';
  }

  private generateFireReason(item: OrderItem, urgency: string): string {
    switch (urgency) {
      case 'critical':
        return `${item.name} requires immediate attention (priority order)`;
      case 'high':
        return `${item.name} fires in under 5 minutes`;
      case 'normal':
        return `${item.name} (${item.modifiers?.join(', ') || 'standard'})`;
      default:
        return `${item.name} scheduled for optimal timing`;
    }
  }

  private checkDependencyDelays(kitchen: KitchenState): Bottleneck[] {
    const bottlenecks: Bottleneck[] = [];

    for (const activeOrder of kitchen.activeOrders) {
      const pendingItems = activeOrder.items.filter(i => i.status === 'queued');
      const delayedItems = pendingItems.filter(i => {
        // Check if dependencies are completed
        const item = activeOrder.items.find(ai => ai.itemId === i.itemId);
        return item?.dependencies?.every(depId => {
          const depItem = activeOrder.items.find(ai => ai.itemId === depId);
          return depItem?.status === 'completed';
        });
      });

      if (delayedItems.length > 0) {
        bottlenecks.push({
          station: delayedItems[0].station,
          severity: 'info',
          reason: 'Dependency wait for items: ' + delayedItems.map(i => i.itemId).join(', '),
          affectedOrders: [activeOrder.orderId],
          recommendations: ['Review dependency chain', 'Check prerequisite item status'],
          estimatedDelay: 2
        });
      }
    }

    return bottlenecks;
  }

  private generateBottleneckRecommendations(station: StationType, utilization: number, trend: string): string[] {
    const recommendations: string[] = [];

    if (utilization > 0.95) {
      recommendations.push('Consider redistributing orders to other stations');
      recommendations.push('Request additional cook support');
    }

    if (trend === 'degrading') {
      recommendations.push('Investigate equipment or staffing issues');
      recommendations.push('Review recent changes to station procedures');
    }

    recommendations.push('Monitor queue length and adjust as needed');

    return recommendations;
  }

  private aggregateFactors(factors: PredictionFactor[]): PredictionFactor[] {
    const aggregated = new Map<string, PredictionFactor>();

    for (const factor of factors) {
      const existing = aggregated.get(factor.name);
      if (existing) {
        existing.impact = (existing.impact + factor.impact) / 2;
        existing.weight = Math.max(existing.weight, factor.weight);
      } else {
        aggregated.set(factor.name, { ...factor });
      }
    }

    return Array.from(aggregated.values());
  }
}

// ============================================================================
// Supporting Types for Metrics
// ============================================================================

export interface PerformanceMetrics {
  totalOrders: number;
  delayedOrders: number;
  onTimeRate: number;
  avgPrepTime: number;
  stationMetrics: Record<StationType, StationMetric>;
  periodHours: number;
}

export interface StationMetric {
  avgCookTime: number;
  lateRate: number;
  throughput: number; // orders per hour
}

// ============================================================================
// Factory Function
// ============================================================================

export function createKitchenAI(stations: Station[], config?: Partial<AlertConfig>): KitchenAI {
  return new KitchenAI(stations, config);
}
