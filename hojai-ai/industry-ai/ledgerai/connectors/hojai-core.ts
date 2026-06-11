/**
 * HOJAI Core Connector
 * Connects LEDGERAI to HOJAI Core AI infrastructure
 */

export interface HOJAIConfig {
  baseUrl: string;
  apiKey: string;
}

export interface IntentResult {
  intent: string;
  confidence: number;
  entities: Record<string, unknown>;
}

export interface FinancialContext {
  businessType?: string;
  fiscalYear?: string;
  taxRegime?: 'old' | 'new';
}

export class HOJAIConnector {
  private config: HOJAIConfig;

  constructor(config: HOJAIConfig) {
    this.config = config;
  }

  async analyzeIntent(text: string, context?: FinancialContext): Promise<IntentResult> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/intent/analyze`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ text, context })
        }
      );

      if (!response.ok) {
        return { intent: 'unknown', confidence: 0, entities: {} };
      }

      return await response.json();
    } catch {
      return { intent: 'unknown', confidence: 0, entities: {} };
    }
  }

  async getFinancialInsights(userId: string, reportType: 'balance_sheet' | 'income' | 'cashflow'): Promise<unknown | null> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/insights/${userId}?type=${reportType}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`
          }
        }
      );

      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  }

  async getTaxSavingSuggestions(income: number): Promise<{
    suggestions: { section: string; maxSaving: number; description: string }[];
    totalPotentialSaving: number;
  }> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/recommendations/tax-saving`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ income })
        }
      );

      if (!response.ok) {
        return {
          suggestions: [
            { section: '80C', maxSaving: 46800, description: 'Life insurance, PPF, ELSS, home loan principal' },
            { section: '80D', maxSaving: 25000, description: 'Health insurance premium' },
            { section: '80CCD(1B)', maxSaving: 50000, description: 'NPS contribution' },
            { section: 'HRA', maxSaving: Math.round(income * 0.1), description: 'House Rent Allowance' },
          ],
          totalPotentialSaving: 100000
        };
      }

      return await response.json();
    } catch {
      return {
        suggestions: [],
        totalPotentialSaving: 0
      };
    }
  }

  async generateInvoiceNarrative(invoiceData: {
    customerName: string;
    amount: number;
    items: string[];
  }): Promise<string> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/narrative/invoice`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(invoiceData)
        }
      );

      if (!response.ok) {
        return `Invoice for ${invoiceData.customerName} worth ₹${invoiceData.amount.toLocaleString('en-IN')} has been generated.`;
      }

      const data = await response.json();
      return data.narrative;
    } catch {
      return `Invoice for ${invoiceData.customerName} worth ₹${invoiceData.amount.toLocaleString('en-IN')} has been generated.`;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/health`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`
          }
        }
      );

      return response.ok;
    } catch {
      return false;
    }
  }
}

export default HOJAIConnector;