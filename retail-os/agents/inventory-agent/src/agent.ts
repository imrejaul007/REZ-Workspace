import express from 'express';
import { inventorySkills, skillDescriptions } from './skills/inventory.skills';
import { InventoryTools, inventoryTools } from './tools/inventory.tools';
import { InventoryActions } from './actions/inventory.actions';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()],
});

export interface AgentMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface AgentRequest {
  message: string;
  context?: {
    shopperId?: string;
    storeId?: string;
    productId?: string;
  };
}

export interface AgentResponse {
  message: string;
  actions?: string[];
  data?: any;
  confidence: number;
}

export class InventoryAgent {
  private tools: InventoryTools;
  private actions: InventoryActions;
  private conversationHistory: AgentMessage[] = [];

  constructor() {
    this.tools = new InventoryTools();
    this.actions = new InventoryActions();
  }

  async processMessage(request: AgentRequest): Promise<AgentResponse> {
    const { message, context } = request;
    logger.info(`Processing message: ${message}`);

    this.conversationHistory.push({
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    });

    const intent = this.identifyIntent(message);
    let response: AgentResponse;

    switch (intent) {
      case 'check_stock':
        response = await this.handleCheckStock(message, context);
        break;
      case 'reorder':
        response = await this.handleReorder(message, context);
        break;
      case 'metrics':
        response = await this.handleMetrics(message);
        break;
      case 'optimize':
        response = await this.handleOptimization(message);
        break;
      case 'forecast':
        response = await this.handleForecast(message, context);
        break;
      default:
        response = await this.handleGeneralQuery(message);
    }

    this.conversationHistory.push({
      role: 'assistant',
      content: response.message,
      timestamp: new Date().toISOString(),
    });

    return response;
  }

  private identifyIntent(message: string): string {
    const lower = message.toLowerCase();

    if (lower.includes('stock level') || lower.includes('quantity') || lower.includes('in stock')) {
      return 'check_stock';
    }
    if (lower.includes('reorder') || lower.includes('purchase order') || lower.includes('supplier')) {
      return 'reorder';
    }
    if (lower.includes('metric') || lower.includes('kpi') || lower.includes('report')) {
      return 'metrics';
    }
    if (lower.includes('optimize') || lower.includes('reduce') || lower.includes('excess')) {
      return 'optimize';
    }
    if (lower.includes('forecast') || lower.includes('predict') || lower.includes('demand')) {
      return 'forecast';
    }
    return 'general';
  }

  private async handleCheckStock(message: string, context?: any): Promise<AgentResponse> {
    const lower = message.toLowerCase();

    if (lower.includes('low stock') || lower.includes('running low')) {
      const lowStock = await this.tools.executeTool('identify_low_stock', {});
      return {
        message: `I found ${lowStock.length} products with low stock levels. ${this.formatStockList(lowStock)}`,
        actions: ['identify_low_stock'],
        data: lowStock,
        confidence: 0.95,
      };
    }

    if (lower.includes('out of stock')) {
      const outOfStock = await this.tools.executeTool('identify_out_of_stock', {});
      return {
        message: `I found ${outOfStock.length} products that are out of stock. ${this.formatStockList(outOfStock)}`,
        actions: ['identify_out_of_stock'],
        data: outOfStock,
        confidence: 0.95,
      };
    }

    if (context?.productId) {
      const stock = await this.tools.executeTool('check_stock_levels', { productIds: [context.productId] });
      return {
        message: `Current stock level for the product: ${stock[0]?.quantity} units (${stock[0]?.status})`,
        actions: ['check_stock_levels'],
        data: stock[0],
        confidence: 0.95,
      };
    }

    const allStock = await this.tools.executeTool('check_stock_levels', {});
    return {
      message: `I checked stock levels for ${allStock.length} products. ${this.formatStockSummary(allStock)}`,
      actions: ['check_stock_levels'],
      data: allStock,
      confidence: 0.90,
    };
  }

  private async handleReorder(message: string, context?: any): Promise<AgentResponse> {
    const recommendations = await this.tools.executeTool('generate_reorder_recommendations', {});

    const critical = recommendations.filter((r: any) => r.priority === 'critical');
    const high = recommendations.filter((r: any) => r.priority === 'high');

    let messageText = `I found ${recommendations.length} items that need reordering. `;
    if (critical.length > 0) {
      messageText += `${critical.length} are critical (out of stock). `;
    }
    if (high.length > 0) {
      messageText += `${high.length} are high priority. `;
    }

    return {
      message: messageText,
      actions: ['generate_reorder_recommendations'],
      data: recommendations,
      confidence: 0.90,
    };
  }

  private async handleMetrics(message: string): Promise<AgentResponse> {
    const metrics = await this.tools.executeTool('get_inventory_metrics', {});

    return {
      message: `Here are your current inventory metrics: ${metrics.totalProducts} total products, ${metrics.inStockProducts} in stock, ${metrics.lowStockProducts} low stock, ${metrics.outOfStockProducts} out of stock. Total stock value: $${metrics.totalStockValue.toLocaleString()}.`,
      actions: ['get_inventory_metrics'],
      data: metrics,
      confidence: 0.95,
    };
  }

  private async handleOptimization(message: string): Promise<AgentResponse> {
    const slowMovers = await this.tools.executeTool('identify_slow_movers', { threshold: 30 });

    return {
      message: `I identified ${slowMovers.length} slow-moving products that may benefit from inventory optimization. Consider promotions or reducing reorder frequency for these items.`,
      actions: ['identify_slow_movers'],
      data: slowMovers,
      confidence: 0.85,
    };
  }

  private async handleForecast(message: string, context?: any): Promise<AgentResponse> {
    if (!context?.productId) {
      return {
        message: 'Please specify a product ID to analyze demand patterns.',
        actions: [],
        data: null,
        confidence: 0.5,
      };
    }

    const analysis = await this.tools.executeTool('analyze_demand', {
      productId: context.productId,
      days: 30,
    });

    return {
      message: `Demand analysis for this product: Average ${analysis.averageDailySales.toFixed(1)} units/day. Peak day: ${analysis.peakDay}. Trend: ${analysis.trend}. Seasonal factor: ${analysis.seasonalFactor}x.`,
      actions: ['analyze_demand'],
      data: analysis,
      confidence: 0.82,
    };
  }

  private async handleGeneralQuery(message: string): Promise<AgentResponse> {
    const lower = message.toLowerCase();

    if (lower.includes('help') || lower.includes('what can you do')) {
      return {
        message: `I can help you with inventory management. Here's what I can do:\n${Object.entries(skillDescriptions).map(([skill, desc]) => `- ${desc}`).join('\n')}`,
        actions: [],
        data: inventorySkills,
        confidence: 1.0,
      };
    }

    return {
      message: 'I\'m an inventory management assistant. I can help you check stock levels, generate reorder recommendations, analyze demand patterns, and optimize your inventory. How can I help you today?',
      actions: [],
      data: null,
      confidence: 0.7,
    };
  }

  private formatStockList(stock: any[]): string {
    if (stock.length === 0) return 'No items found.';
    const items = stock.slice(0, 5).map((s: any) => `${s.name} (${s.sku}): ${s.quantity} units`).join(', ');
    return stock.length > 5 ? `${items}, and ${stock.length - 5} more...` : items;
  }

  private formatStockSummary(stock: any[]): string {
    const inStock = stock.filter((s: any) => s.status === 'in_stock').length;
    const lowStock = stock.filter((s: any) => s.status === 'low_stock').length;
    const outOfStock = stock.filter((s: any) => s.status === 'out_of_stock').length;
    return `${inStock} in stock, ${lowStock} low stock, ${outOfStock} out of stock.`;
  }

  getSkills() {
    return inventorySkills;
  }

  getTools() {
    return this.tools.getToolDefinitions();
  }

  getConversationHistory() {
    return this.conversationHistory;
  }
}
