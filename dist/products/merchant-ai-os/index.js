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
import { createLogger } from '../../hojai-core/shared/utils/logger';
const logger = createLogger('merchant-ai-os');
class CustomersModule {
    customers = new Map();
    async list(params) {
        const all = Array.from(this.customers.values());
        const page = params.page || 1;
        const limit = params.limit || 20;
        const start = (page - 1) * limit;
        return all.slice(start, start + limit);
    }
    async get(id) {
        return this.customers.get(id) || null;
    }
    async create(data) {
        const customer = {
            id: `cust_${Date.now()}`,
            merchant_id: 'merchant_1',
            name: data.name,
            phone: data.phone,
            email: data.email,
            lifetime_value: 0,
            order_count: 0,
            churn_risk: 'low',
            engagement_score: 50,
            segments: [],
            created_at: new Date().toISOString()
        };
        this.customers.set(customer.id, customer);
        logger.info('customer_created', { customerId: customer.id });
        return customer;
    }
    async update(id, data) {
        const customer = this.customers.get(id);
        if (!customer)
            return null;
        Object.assign(customer, data);
        return customer;
    }
    async delete(id) {
        return this.customers.delete(id);
    }
    async search(query) {
        const lower = query.toLowerCase();
        return Array.from(this.customers.values()).filter(c => c.name.toLowerCase().includes(lower) ||
            c.phone.includes(query) ||
            c.email?.toLowerCase().includes(lower));
    }
    async getSegments(id) {
        return [
            { id: 'seg_1', name: 'VIP', customer_count: 50, description: 'High value customers' },
            { id: 'seg_2', name: 'Active', customer_count: 200, description: 'Active last 30 days' },
        ];
    }
    async getTimeline(id) {
        return [
            { id: '1', type: 'order', title: 'Order #1234', timestamp: new Date().toISOString() },
            { id: '2', type: 'support', title: 'Ticket #567', timestamp: new Date().toISOString() },
        ];
    }
}
class OrdersModule {
    orders = new Map();
    async list(params) {
        const all = Array.from(this.orders.values());
        let filtered = all;
        if (params.status) {
            filtered = filtered.filter(o => o.status === params.status);
        }
        if (params.customer_id) {
            filtered = filtered.filter(o => o.customer_id === params.customer_id);
        }
        return filtered.slice(0, params.limit || 20);
    }
    async get(id) {
        return this.orders.get(id) || null;
    }
    async create(data) {
        const items = data.items.map(item => ({
            ...item,
            total: item.price * item.quantity
        }));
        const total = items.reduce((sum, item) => sum + item.total, 0);
        const order = {
            id: `ord_${Date.now()}`,
            merchant_id: 'merchant_1',
            customer_id: data.customer_id,
            order_number: `ORD${Date.now()}`,
            items,
            total,
            status: 'pending',
            payment_status: 'pending',
            created_at: new Date().toISOString()
        };
        this.orders.set(order.id, order);
        logger.info('order_created', { orderId: order.id, total: order.total });
        return order;
    }
    async updateStatus(id, status) {
        const order = this.orders.get(id);
        if (!order)
            return null;
        order.status = status;
        return order;
    }
    async getByCustomer(customerId) {
        return Array.from(this.orders.values()).filter(o => o.customer_id === customerId);
    }
    async getStats(merchantId) {
        const orders = Array.from(this.orders.values());
        const total = orders.reduce((sum, o) => sum + o.total, 0);
        return {
            total_orders: orders.length,
            total_revenue: total,
            avg_order_value: orders.length > 0 ? total / orders.length : 0,
            pending_orders: orders.filter(o => o.status === 'pending').length
        };
    }
}
class ProductsModule {
    products = new Map();
    async list(params) {
        let all = Array.from(this.products.values());
        if (params?.category) {
            all = all.filter(p => p.category === params.category);
        }
        return all.slice(0, params?.limit || 50);
    }
    async get(id) {
        return this.products.get(id) || null;
    }
    async create(data) {
        const product = {
            id: `prod_${Date.now()}`,
            merchant_id: 'merchant_1',
            name: data.name,
            description: data.description,
            category: data.category,
            price: data.price,
            mrp: data.mrp,
            stock: data.stock || 0,
            status: data.stock === 0 ? 'out_of_stock' : 'active',
            images: data.images,
            created_at: new Date().toISOString()
        };
        this.products.set(product.id, product);
        return product;
    }
    async update(id, data) {
        const product = this.products.get(id);
        if (!product)
            return null;
        Object.assign(product, data);
        if (data.stock === 0)
            product.status = 'out_of_stock';
        return product;
    }
    async delete(id) {
        return this.products.delete(id);
    }
    async search(query) {
        const lower = query.toLowerCase();
        return Array.from(this.products.values()).filter(p => p.name.toLowerCase().includes(lower) ||
            p.description?.toLowerCase().includes(lower) ||
            p.category.toLowerCase().includes(lower));
    }
    async getByCategory(category) {
        return Array.from(this.products.values()).filter(p => p.category === category);
    }
}
class AgentsModule {
    agents = new Map();
    async list() {
        return Array.from(this.agents.values());
    }
    async get(id) {
        return this.agents.get(id) || null;
    }
    async create(data) {
        const agent = {
            id: `agent_${Date.now()}`,
            merchant_id: 'merchant_1',
            name: data.name,
            type: data.type,
            status: 'inactive',
            conversations_handled: 0,
            avg_response_time_seconds: 0,
            created_at: new Date().toISOString()
        };
        this.agents.set(agent.id, agent);
        logger.info('agent_created', { agentId: agent.id, type: agent.type });
        return agent;
    }
    async update(id, data) {
        const agent = this.agents.get(id);
        if (!agent)
            return null;
        Object.assign(agent, data);
        return agent;
    }
    async invoke(id, message, context) {
        const agent = this.agents.get(id);
        if (!agent)
            throw new Error('Agent not found');
        if (agent.status !== 'active')
            throw new Error('Agent not active');
        agent.conversations_handled++;
        return {
            message: `Response from ${agent.name} to: "${message}"`,
            conversation_id: `conv_${Date.now()}`,
            escalated: false,
            confidence: 0.85
        };
    }
    async getStats(id) {
        const agent = this.agents.get(id);
        if (!agent)
            throw new Error('Agent not found');
        return {
            total_conversations: agent.conversations_handled,
            resolved: Math.floor(agent.conversations_handled * 0.8),
            escalated: Math.floor(agent.conversations_handled * 0.1),
            avg_response_time: agent.avg_response_time_seconds,
            csat: agent.csat_score
        };
    }
}
class WorkflowsModule {
    workflows = new Map();
    runs = new Map();
    async list() {
        return Array.from(this.workflows.values());
    }
    async get(id) {
        return this.workflows.get(id) || null;
    }
    async create(data) {
        const workflow = {
            id: `wf_${Date.now()}`,
            merchant_id: 'merchant_1',
            name: data.name,
            trigger: data.trigger,
            steps: data.steps.map((s, i) => ({ ...s, id: `step_${i}` }), status, 'draft', runs_count, 0, created_at, new Date().toISOString())
        };
        this.workflows.set(workflow.id, workflow);
        return workflow;
    }
    async execute(id, context) {
        const workflow = this.workflows.get(id);
        if (!workflow)
            throw new Error('Workflow not found');
        workflow.runs_count++;
        const run = {
            id: `run_${Date.now()}`,
            workflow_id: id,
            status: 'running',
            started_at: new Date().toISOString()
        };
        const runs = this.runs.get(id) || [];
        runs.push(run);
        this.runs.set(id, runs);
        setTimeout(() => {
            run.status = 'completed';
            run.completed_at = new Date().toISOString();
        }, 1000);
        return run;
    }
    async getRuns(workflowId) {
        return this.runs.get(workflowId) || [];
    }
}
class AnalyticsModule {
    async getDashboard(merchantId) {
        return {
            revenue: 125000,
            orders: 450,
            customers: 280,
            avg_order_value: 278,
            period: '30d'
        };
    }
    async getRevenue(merchantId, period) {
        const days = 7;
        return Array.from({ length: days }, (_, i) => ({
            date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
            revenue: Math.random() * 10000 + 5000,
            orders: Math.floor(Math.random() * 50) + 20
        }).reverse());
    }
    async getCustomers(merchantId) {
        return {
            total: 280,
            new: 45,
            returning: 235,
            at_risk: 23
        };
    }
    async getOrders(merchantId, period) {
        return {
            total_orders: 450,
            total_revenue: 125000,
            avg_order_value: 278,
            pending_orders: 12
        };
    }
    async getTopProducts(merchantId, limit = 5) {
        return [
            { id: '1', name: 'Product A', quantity: 120, revenue: 24000 },
            { id: '2', name: 'Product B', quantity: 95, revenue: 19000 },
            { id: '3', name: 'Product C', quantity: 80, revenue: 16000 },
        ].slice(0, limit);
    }
}
// ============================================
// MAIN EXPORTS
// ============================================
export class MerchantAIOS {
    customers;
    orders;
    products;
    agents;
    workflows;
    analytics;
    constructor() {
        this.customers = new CustomersModule();
        this.orders = new OrdersModule();
        this.products = new ProductsModule();
        this.agents = new AgentsModule();
        this.workflows = new WorkflowsModule();
        this.analytics = new AnalyticsModule();
        logger.info('merchant_ai_os_initialized');
    }
}
export default MerchantAIOS;
//# sourceMappingURL=index.js.map