import { v4 as uuidv4 } from 'uuid';
import { ServiceEndpoint, Message, EventSubscription, ServiceHealth, CrossServiceTransaction } from '../models/connector';

class ConnectorService {
  private endpoints: Map<string, ServiceEndpoint> = new Map();
  private subscriptions: Map<string, EventSubscription> = new Map();
  private messages: Map<string, Message> = new Map();
  private transactions: Map<string, CrossServiceTransaction> = new Map();
  private messageHistory: Message[] = [];
  private readonly MAX_HISTORY = 1000;

  // Service Registration
  registerService(data: Omit<ServiceEndpoint, 'id' | 'registeredAt'>): ServiceEndpoint {
    const endpoint: ServiceEndpoint = {
      ...data,
      id: uuidv4(),
      registeredAt: new Date().toISOString()
    };
    this.endpoints.set(endpoint.id, endpoint);
    return endpoint;
  }

  getService(id: string): ServiceEndpoint | undefined {
    return this.endpoints.get(id);
  }

  getServiceByName(name: string): ServiceEndpoint | undefined {
    return Array.from(this.endpoints.values()).find(e => e.serviceName === name);
  }

  getAllServices(filters?: { status?: string; type?: string }): ServiceEndpoint[] {
    let result = Array.from(this.endpoints.values());
    if (filters?.status) result = result.filter(e => e.status === filters.status);
    if (filters?.type) result = result.filter(e => e.serviceType === filters.type);
    return result;
  }

  updateServiceStatus(id: string, status: ServiceEndpoint['status']): ServiceEndpoint | undefined {
    const endpoint = this.endpoints.get(id);
    if (!endpoint) return undefined;
    endpoint.status = status;
    endpoint.lastHeartbeat = new Date().toISOString();
    this.endpoints.set(id, endpoint);
    return endpoint;
  }

  unregisterService(id: string): boolean {
    return this.endpoints.delete(id);
  }

  heartbeat(id: string): boolean {
    const endpoint = this.endpoints.get(id);
    if (!endpoint) return false;
    endpoint.lastHeartbeat = new Date().toISOString();
    endpoint.status = 'active';
    this.endpoints.set(id, endpoint);
    return true;
  }

  // Message Operations
  sendMessage(data: Omit<Message, 'id' | 'timestamp'>): Message {
    const message: Message = {
      ...data,
      id: uuidv4(),
      timestamp: new Date().toISOString()
    };
    this.messages.set(message.id, message);
    this.messageHistory.push(message);
    if (this.messageHistory.length > this.MAX_HISTORY) {
      this.messageHistory.shift();
    }
    return message;
  }

  getMessage(id: string): Message | undefined {
    return this.messages.get(id);
  }

  getMessagesByCorrelation(correlationId: string): Message[] {
    return this.messageHistory.filter(m => m.correlationId === correlationId);
  }

  getMessagesByService(serviceName: string): Message[] {
    return this.messageHistory.filter(m =>
      m.sourceService === serviceName || m.targetService === serviceName
    );
  }

  // Event Subscriptions
  subscribe(data: Omit<EventSubscription, 'id' | 'createdAt'>): EventSubscription {
    const subscription: EventSubscription = {
      ...data,
      id: uuidv4(),
      createdAt: new Date().toISOString()
    };
    this.subscriptions.set(subscription.id, subscription);
    return subscription;
  }

  getSubscriptions(subscriberId?: string, eventType?: string): EventSubscription[] {
    let result = Array.from(this.subscriptions.values());
    if (subscriberId) result = result.filter(s => s.subscriberId === subscriberId);
    if (eventType) result = result.filter(s => s.eventType === eventType);
    return result.filter(s => s.active);
  }

  unsubscribe(id: string): boolean {
    const subscription = this.subscriptions.get(id);
    if (!subscription) return false;
    subscription.active = false;
    this.subscriptions.set(id, subscription);
    return true;
  }

  getSubscribersForEvent(eventType: string): EventSubscription[] {
    return Array.from(this.subscriptions.values()).filter(s =>
      s.eventType === eventType && s.active
    );
  }

  // Health Monitoring
  getServiceHealth(): ServiceHealth[] {
    const now = Date.now();
    return Array.from(this.endpoints.values()).map(e => ({
      serviceName: e.serviceName,
      status: e.status === 'active' ? 'healthy' as const :
              e.status === 'inactive' ? 'down' as const : 'degraded' as const,
      uptime: e.lastHeartbeat ? (now - new Date(e.lastHeartbeat).getTime()) / 1000 : 0,
      avgResponseTime: Math.random() * 100, // Simulated
      errorRate: Math.random() * 5, // Simulated
      requestsPerMinute: Math.floor(Math.random() * 1000), // Simulated
      lastChecked: new Date().toISOString()
    }));
  }

  // Transactions
  startTransaction(serviceNames: string[]): CrossServiceTransaction {
    const transaction: CrossServiceTransaction = {
      id: uuidv4(),
      transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      services: serviceNames,
      totalSteps: serviceNames.length,
      completedSteps: 0,
      status: 'pending',
      startedAt: new Date().toISOString()
    };
    this.transactions.set(transaction.id, transaction);
    return transaction;
  }

  updateTransactionStep(id: string, completed: boolean): CrossServiceTransaction | undefined {
    const txn = this.transactions.get(id);
    if (!txn) return undefined;
    txn.completedSteps++;
    txn.status = completed ? 'completed' : 'in-progress';
    if (completed) txn.completedAt = new Date().toISOString();
    this.transactions.set(id, txn);
    return txn;
  }

  rollbackTransaction(id: string): boolean {
    const txn = this.transactions.get(id);
    if (!txn) return false;
    txn.status = 'rolled-back';
    this.transactions.set(id, txn);
    return true;
  }

  // Stats
  getStats() {
    const services = Array.from(this.endpoints.values());
    return {
      totalServices: services.length,
      activeServices: services.filter(s => s.status === 'active').length,
      unhealthyServices: services.filter(s => s.status === 'unhealthy').length,
      totalMessages: this.messageHistory.length,
      totalSubscriptions: Array.from(this.subscriptions.values()).filter(s => s.active).length,
      activeTransactions: Array.from(this.transactions.values()).filter(t => t.status === 'in-progress').length
    };
  }
}

export default new ConnectorService();
