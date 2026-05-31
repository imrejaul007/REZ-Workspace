/**
 * Hojai Merchant AI OS
 *
 * Product Layer on top of Hojai Core Platforms
 *
 * Modules:
 * - Customers (Data Platform + Identity)
 * - Orders (Data Platform)
 * - Products (Data Platform)
 * - AI Employees (Agents Platform)
 * - Workflows (Workflows Platform)
 * - Dashboard (Analytics Platform)
 */
export interface CustomerModule {
    list(params: CustomerListParams): Promise<Customer[]>;
    get(id: string): Promise<Customer | null>;
    create(data: CustomerCreateData): Promise<Customer>;
    update(id: string, data: CustomerUpdateData): Promise<Customer | null>;
    delete(id: string): Promise<boolean>;
    search(query: string): Promise<Customer[]>;
    getSegments(id: string): Promise<Segment[]>;
    getTimeline(id: string): Promise<TimelineEvent[]>;
}
export interface Customer {
    id: string;
    merchant_id: string;
    name: string;
    phone: string;
    email?: string;
    lifetime_value: number;
    order_count: number;
    churn_risk: 'low' | 'medium' | 'high';
    engagement_score: number;
    segments: string[];
    last_order_date?: string;
    created_at: string;
}
export interface CustomerListParams {
    page?: number;
    limit?: number;
    status?: string;
    segment?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
}
export interface CustomerCreateData {
    name: string;
    phone: string;
    email?: string;
}
export interface CustomerUpdateData {
    name?: string;
    email?: string;
    tags?: string[];
}
export interface Segment {
    id: string;
    name: string;
    customer_count: number;
    description?: string;
}
export interface TimelineEvent {
    id: string;
    type: string;
    title: string;
    description?: string;
    timestamp: string;
}
declare class CustomersModule implements CustomerModule {
    private customers;
    list(params: CustomerListParams): Promise<Customer[]>;
    get(id: string): Promise<Customer | null>;
    create(data: CustomerCreateData): Promise<Customer>;
    update(id: string, data: CustomerUpdateData): Promise<Customer | null>;
    delete(id: string): Promise<boolean>;
    search(query: string): Promise<Customer[]>;
    getSegments(id: string): Promise<Segment[]>;
    getTimeline(id: string): Promise<TimelineEvent[]>;
}
export interface OrderModule {
    list(params: OrderListParams): Promise<Order[]>;
    get(id: string): Promise<Order | null>;
    create(data: OrderCreateData): Promise<Order>;
    updateStatus(id: string, status: OrderStatus): Promise<Order | null>;
    getByCustomer(customerId: string): Promise<Order[]>;
    getStats(merchantId: string): Promise<OrderStats>;
}
export interface Order {
    id: string;
    merchant_id: string;
    customer_id: string;
    order_number: string;
    items: OrderItem[];
    total: number;
    status: OrderStatus;
    payment_status: PaymentStatus;
    created_at: string;
}
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export interface OrderItem {
    product_id: string;
    name: string;
    quantity: number;
    price: number;
    total: number;
}
export interface OrderListParams {
    page?: number;
    limit?: number;
    status?: OrderStatus;
    customer_id?: string;
}
export interface OrderCreateData {
    customer_id: string;
    items: Omit<OrderItem, 'total'>[];
}
export interface OrderStats {
    total_orders: number;
    total_revenue: number;
    avg_order_value: number;
    pending_orders: number;
}
declare class OrdersModule implements OrderModule {
    private orders;
    list(params: OrderListParams): Promise<Order[]>;
    get(id: string): Promise<Order | null>;
    create(data: OrderCreateData): Promise<Order>;
    updateStatus(id: string, status: OrderStatus): Promise<Order | null>;
    getByCustomer(customerId: string): Promise<Order[]>;
    getStats(merchantId: string): Promise<OrderStats>;
}
export interface ProductModule {
    list(params?: ProductListParams): Promise<Product[]>;
    get(id: string): Promise<Product | null>;
    create(data: ProductCreateData): Promise<Product>;
    update(id: string, data: ProductUpdateData): Promise<Product | null>;
    delete(id: string): Promise<boolean>;
    search(query: string): Promise<Product[]>;
    getByCategory(category: string): Promise<Product[]>;
}
export interface Product {
    id: string;
    merchant_id: string;
    name: string;
    description?: string;
    category: string;
    price: number;
    mrp?: number;
    stock: number;
    status: 'active' | 'inactive' | 'out_of_stock';
    images?: string[];
    created_at: string;
}
export interface ProductListParams {
    page?: number;
    limit?: number;
    category?: string;
    status?: Product['status'];
}
export interface ProductCreateData {
    name: string;
    category: string;
    price: number;
    mrp?: number;
    stock?: number;
    description?: string;
    images?: string[];
}
export interface ProductUpdateData {
    name?: string;
    description?: string;
    price?: number;
    mrp?: number;
    stock?: number;
    status?: Product['status'];
}
declare class ProductsModule implements ProductModule {
    private products;
    list(params?: ProductListParams): Promise<Product[]>;
    get(id: string): Promise<Product | null>;
    create(data: ProductCreateData): Promise<Product>;
    update(id: string, data: ProductUpdateData): Promise<Product | null>;
    delete(id: string): Promise<boolean>;
    search(query: string): Promise<Product[]>;
    getByCategory(category: string): Promise<Product[]>;
}
export interface AgentModule {
    list(): Promise<AIEmployee[]>;
    get(id: string): Promise<AIEmployee | null>;
    create(data: AgentCreateData): Promise<AIEmployee>;
    update(id: string, data: AgentUpdateData): Promise<AIEmployee | null>;
    invoke(id: string, message: string, context?: Record<string, unknown>): Promise<AgentResponse>;
    getStats(id: string): Promise<AgentStats>;
}
export interface AIEmployee {
    id: string;
    merchant_id: string;
    name: string;
    type: 'support' | 'sales' | 'ordering' | 'marketing';
    status: 'active' | 'inactive' | 'training';
    conversations_handled: number;
    avg_response_time_seconds: number;
    csat_score?: number;
    created_at: string;
}
export interface AgentCreateData {
    name: string;
    type: 'support' | 'sales' | 'ordering' | 'marketing';
    greeting?: string;
    instructions?: string;
}
export interface AgentUpdateData {
    name?: string;
    status?: 'active' | 'inactive' | 'training';
    instructions?: string;
}
export interface AgentResponse {
    message: string;
    conversation_id: string;
    escalated: boolean;
    confidence: number;
}
export interface AgentStats {
    total_conversations: number;
    resolved: number;
    escalated: number;
    avg_response_time: number;
    csat?: number;
}
declare class AgentsModule implements AgentModule {
    private agents;
    list(): Promise<AIEmployee[]>;
    get(id: string): Promise<AIEmployee | null>;
    create(data: AgentCreateData): Promise<AIEmployee>;
    update(id: string, data: AgentUpdateData): Promise<AIEmployee | null>;
    invoke(id: string, message: string, context?: Record<string, unknown>): Promise<AgentResponse>;
    getStats(id: string): Promise<AgentStats>;
}
export interface WorkflowModule {
    list(): Promise<Workflow[]>;
    get(id: string): Promise<Workflow | null>;
    create(data: WorkflowCreateData): Promise<Workflow>;
    execute(id: string, context?: Record<string, unknown>): Promise<WorkflowRun>;
    getRuns(workflowId: string): Promise<WorkflowRun[]>;
}
export interface Workflow {
    id: string;
    merchant_id: string;
    name: string;
    trigger: string;
    steps: WorkflowStep[];
    status: 'active' | 'paused' | 'draft';
    runs_count: number;
    created_at: string;
}
export interface WorkflowStep {
    id: string;
    type: 'message' | 'delay' | 'condition' | 'action';
    config: Record<string, unknown>;
}
export interface WorkflowCreateData {
    name: string;
    trigger: string;
    steps: WorkflowStep[];
}
export interface WorkflowRun {
    id: string;
    workflow_id: string;
    status: 'running' | 'completed' | 'failed';
    started_at: string;
    completed_at?: string;
}
declare class WorkflowsModule implements WorkflowModule {
    private workflows;
    private runs;
    list(): Promise<Workflow[]>;
    get(id: string): Promise<Workflow | null>;
    create(data: WorkflowCreateData): Promise<Workflow>;
    execute(id: string, context?: Record<string, unknown>): Promise<WorkflowRun>;
    getRuns(workflowId: string): Promise<WorkflowRun[]>;
}
export interface AnalyticsModule {
    getDashboard(merchantId: string): Promise<Dashboard>;
    getRevenue(merchantId: string, period: Period): Promise<RevenueData[]>;
    getCustomers(merchantId: string): Promise<CustomerStats>;
    getOrders(merchantId: string, period: Period): Promise<OrderStats>;
    getTopProducts(merchantId: string, limit?: number): Promise<TopProduct[]>;
}
export interface Dashboard {
    revenue: number;
    orders: number;
    customers: number;
    avg_order_value: number;
    period: string;
}
export interface Period {
    start: string;
    end: string;
}
export interface RevenueData {
    date: string;
    revenue: number;
    orders: number;
}
export interface CustomerStats {
    total: number;
    new: number;
    returning: number;
    at_risk: number;
}
export interface TopProduct {
    id: string;
    name: string;
    quantity: number;
    revenue: number;
}
declare class AnalyticsModule {
    getDashboard(merchantId: string): Promise<Dashboard>;
    getRevenue(merchantId: string, period: Period): Promise<RevenueData[]>;
    getCustomers(merchantId: string): Promise<CustomerStats>;
    getOrders(merchantId: string, period: Period): Promise<OrderStats>;
    getTopProducts(merchantId: string, limit?: number): Promise<TopProduct[]>;
}
export declare class MerchantAIOS {
    customers: CustomersModule;
    orders: OrdersModule;
    products: ProductsModule;
    agents: AgentsModule;
    workflows: WorkflowsModule;
    analytics: AnalyticsModule;
    constructor();
}
export default MerchantAIOS;
//# sourceMappingURL=index.d.ts.map