/**
 * LEDGERAI - AI Brain Service
 * Real AI-powered accounting intelligence using Claude API
 * Features: Invoice parsing, expense categorization, report generation,
 * tax compliance, anomaly detection, cash flow forecasting
 */

import Anthropic from '@anthropic-ai/sdk';
import config from '../config';
import logger from '../middleware/logger';

// ============================================
// TYPES & INTERFACES
// ============================================

interface InvoiceParseInput {
  invoiceText: string;
}

interface InvoiceParseResult {
  vendor: string;
  vendorAddress?: string;
  customer?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  dueDate?: string;
  amount: number;
  currency: string;
  items: Array<{
    description: string;
    quantity?: number;
    unitPrice?: number;
    total: number;
    tax?: number;
  }>;
  subtotal: number;
  taxAmount: number;
  total: number;
  paymentTerms?: string;
  notes?: string;
  confidence: number;
  rawData: Record<string, any>;
}

interface ExpenseCategorizeInput {
  description: string;
  amount?: number;
  date?: string;
  merchant?: string;
}

interface ExpenseCategorizeResult {
  category: string;
  subcategory: string;
  confidence: number;
  reasoning: string;
  suggestedAccounts: string[];
  tags: string[];
}

interface ReportGenerateInput {
  type: 'monthly' | 'quarterly' | 'yearly' | 'custom';
  period: string; // e.g., "2026-06" or "2026-Q1" or "2026"
  business: 'restaurant' | 'retail' | 'service' | 'manufacturing' | 'general';
  sections?: string[];
}

interface ReportSection {
  title: string;
  content: string;
  charts: Array<{
    type: 'bar' | 'line' | 'pie' | 'table';
    data: any;
    title?: string;
  }>;
  recommendations?: string[];
}

interface ReportGenerateResult {
  reportType: string;
  period: string;
  generatedAt: string;
  sections: ReportSection[];
  summary: string;
  executiveSummary: string;
  keyMetrics: Record<string, number>;
  warnings: string[];
}

interface TaxComplianceInput {
  transactions: Array<{
    date: string;
    description: string;
    amount: number;
    category: string;
    type: 'income' | 'expense';
  }>;
  jurisdiction: 'India' | 'USA' | 'UK' | 'EU';
  taxType: 'GST' | 'TDS' | 'VAT' | 'IncomeTax' | 'SalesTax';
  period: string;
}

interface TaxComplianceResult {
  compliant: boolean;
  score: number;
  suggestions: Array<{
    type: 'warning' | 'error' | 'opportunity';
    code: string;
    message: string;
    action: string;
    potentialSavings?: number;
  }>;
  risks: Array<{
    severity: 'high' | 'medium' | 'low';
    description: string;
    potentialPenalty?: number;
    mitigation: string;
  }>;
  exemptions: Array<{
    type: string;
    amount: number;
    reason: string;
  }>;
  recommendedFilings: Array<{
    form: string;
    dueDate: string;
    estimatedAmount: number;
  }>;
}

interface AnomalyDetectInput {
  transactions: Array<{
    id: string;
    date: string;
    description: string;
    amount: number;
    category: string;
  }>;
  normalRange?: {
    minAmount?: number;
    maxAmount?: number;
    typicalCategories?: string[];
  };
  sensitivity?: number; // 0-1, default 0.7
}

interface Anomaly {
  transaction: {
    id: string;
    date: string;
    description: string;
    amount: number;
    category: string;
  };
  reason: string;
  severity: 'high' | 'medium' | 'low';
  deviation: number;
  expectedRange: { min: number; max: number };
}

interface AnomalyDetectResult {
  anomalies: Anomaly[];
  total: number;
  highSeverity: number;
  mediumSeverity: number;
  lowSeverity: number;
  summary: string;
}

interface CashFlowForecastInput {
  historicalTransactions: Array<{
    date: string;
    amount: number;
    type: 'income' | 'expense';
    category: string;
  }>;
  months: number;
  includeSeasonality: boolean;
  confidenceLevel: number;
}

interface CashFlowForecastResult {
  forecasts: Array<{
    month: string;
    predictedIncome: number;
    predictedExpenses: number;
    predictedNetCashFlow: number;
    confidence: number;
    factors: string[];
  }>;
  runway: number; // months until cash runs out
  recommendations: string[];
  riskAssessment: {
    level: 'low' | 'medium' | 'high';
    factors: string[];
  };
}

// ============================================
// AI BRAIN CLASS
// ============================================

export class AIBrain {
  name = 'AI Brain';
  role = 'Real AI-powered accounting intelligence';
  status: 'idle' | 'working' | 'error' = 'idle';
  lastActivity?: Date;
  private anthropicClient: Anthropic | null = null;

  constructor() {
    const apiKey = config.ai?.apiKey || process.env.ANTHROPIC_API_KEY || '';
    if (apiKey) {
      this.anthropicClient = new Anthropic({ apiKey });
    }
  }

  /**
   * Get agent status
   */
  getStatus() {
    return {
      name: this.name,
      role: this.role,
      status: this.status,
      lastActivity: this.lastActivity,
      aiProvider: this.anthropicClient ? 'Claude (Anthropic SDK)' : 'Fallback (Rule-based)',
      capabilities: [
        'Invoice parsing and extraction',
        'Expense categorization with AI',
        'Financial report generation',
        'Tax compliance suggestions',
        'Anomaly detection',
        'Cash flow forecasting'
      ]
    };
  }

  /**
   * Call Claude API using official SDK
   */
  private async callClaude(prompt: string, systemPrompt?: string): Promise<string> {
    if (!this.anthropicClient) {
      logger.warn('Claude API key not configured, using fallback');
      throw new Error('Claude API key not configured');
    }

    try {
      const response = await this.anthropicClient.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: systemPrompt,
        messages: [
          { role: 'user', content: prompt }
        ]
      });

      if (response.content && response.content[0] && response.content[0].type === 'text') {
        return response.content[0].text;
      }
      throw new Error('Unexpected response format from Claude');
    } catch (error: any) {
      logger.error('Claude API error', { error: error.message });
      throw error;
    }
  }

  /**
   * Parse invoice text and extract structured data
   */
  async parseInvoice(input: InvoiceParseInput): Promise<InvoiceParseResult> {
    this.status = 'working';
    this.lastActivity = new Date();

    try {
      const systemPrompt = `You are an expert accounting AI. Parse invoices and extract structured data.
Return JSON with this exact structure:
{
  "vendor": "string",
  "vendorAddress": "string (optional)",
  "customer": "string (optional)",
  "invoiceNumber": "string (optional)",
  "invoiceDate": "YYYY-MM-DD (optional)",
  "dueDate": "YYYY-MM-DD (optional)",
  "amount": number,
  "currency": "USD|EUR|INR|GBP (default USD)",
  "items": [{"description": "string", "quantity": number, "unitPrice": number, "total": number, "tax": number}],
  "subtotal": number,
  "taxAmount": number,
  "total": number,
  "paymentTerms": "string (optional)",
  "notes": "string (optional)",
  "confidence": 0.0-1.0,
  "rawData": {}
}`;

      const prompt = `Parse this invoice and extract all structured data:

${input.invoiceText}

Return ONLY valid JSON. No markdown, no explanation.`;

      const result = await this.callClaude(prompt, systemPrompt);
      const parsed = JSON.parse(result.trim());

      logger.info('Invoice parsed by AI Brain', {
        vendor: parsed.vendor,
        amount: parsed.total,
        confidence: parsed.confidence
      });

      this.status = 'idle';
      return parsed;

    } catch (error) {
      this.status = 'error';
      logger.error('Invoice parsing error', { error, invoiceText: input.invoiceText.substring(0, 100) });

      // Fallback to rule-based parsing
      return this.fallbackInvoiceParse(input.invoiceText);
    }
  }

  /**
   * Fallback rule-based invoice parsing
   */
  private fallbackInvoiceParse(invoiceText: string): InvoiceParseResult {
    const lines = invoiceText.split('\n').map(l => l.trim()).filter(l => l);

    // Extract amount
    const amountMatch = invoiceText.match(/(?:total|amount|sum|due)[:\s]*[$]?([\d,]+\.?\d*)/i);
    const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 0;

    // Extract vendor (first non-empty line often is vendor name)
    const vendor = lines[0] || 'Unknown Vendor';

    // Extract invoice number
    const invoiceMatch = invoiceText.match(/(?:invoice|inv|doc|doc\.)[:\s#]*([A-Z0-9-]+)/i);
    const invoiceNumber = invoiceMatch ? invoiceMatch[1] : undefined;

    return {
      vendor,
      invoiceNumber,
      amount,
      currency: 'USD',
      items: [],
      subtotal: amount,
      taxAmount: 0,
      total: amount,
      confidence: 0.5,
      rawData: { fallback: true, originalLines: lines.length }
    };
  }

  /**
   * Categorize expense with AI
   */
  async categorizeExpense(input: ExpenseCategorizeInput): Promise<ExpenseCategorizeResult> {
    this.status = 'working';
    this.lastActivity = new Date();

    try {
      const systemPrompt = `You are an expert accounting AI. Categorize expenses into standard accounting categories.
Return JSON with this exact structure:
{
  "category": "Revenue|Cost of Sales|Operating Expenses|Travel & Entertainment|Marketing|Professional Services|Equipment|Taxes|Insurance|Utilities|Bank Fees|General",
  "subcategory": "string (more specific)",
  "confidence": 0.0-1.0,
  "reasoning": "string (brief explanation)",
  "suggestedAccounts": ["account_code_1", "account_code_2"],
  "tags": ["tag1", "tag2"]
}`;

      const prompt = `Categorize this expense:

Description: ${input.description}
Amount: ${input.amount || 'N/A'}
Date: ${input.date || 'N/A'}
Merchant: ${input.merchant || 'N/A'}

Return ONLY valid JSON. No markdown, no explanation.`;

      const result = await this.callClaude(prompt, systemPrompt);
      const parsed = JSON.parse(result.trim());

      logger.info('Expense categorized by AI Brain', {
        description: input.description.substring(0, 50),
        category: parsed.category,
        confidence: parsed.confidence
      });

      this.status = 'idle';
      return parsed;

    } catch (error) {
      this.status = 'error';
      logger.error('Expense categorization error', { error });

      // Fallback to rule-based categorization
      return this.fallbackExpenseCategorize(input);
    }
  }

  /**
   * Fallback rule-based expense categorization
   */
  private fallbackExpenseCategorize(input: ExpenseCategorizeInput): ExpenseCategorizeResult {
    const desc = input.description.toLowerCase();

    const patterns: Record<string, { keywords: string[]; category: string; subcategory: string; accounts: string[] }> = {
      'Travel & Entertainment': {
        keywords: ['uber', 'lyft', 'taxi', 'flight', 'hotel', 'travel', 'meals', 'dinner', 'lunch', 'client'],
        category: 'Travel & Entertainment',
        subcategory: 'Transportation',
        accounts: ['travel_expense', 'meals_expense']
      },
      'Marketing': {
        keywords: ['google ads', 'facebook', 'meta', 'advertising', 'marketing', 'seo', 'promotion'],
        category: 'Marketing',
        subcategory: 'Digital Marketing',
        accounts: ['advertising_expense', 'marketing_expense']
      },
      'Professional Services': {
        keywords: ['legal', 'attorney', 'cpa', 'accountant', 'consulting', 'professional'],
        category: 'Professional Services',
        subcategory: 'Legal & Accounting',
        accounts: ['legal_expense', 'consulting_expense']
      },
      'Utilities': {
        keywords: ['electric', 'gas', 'water', 'internet', 'phone', 'utility', 'comcast', 'verizon'],
        category: 'Utilities',
        subcategory: 'Communications',
        accounts: ['utilities_expense', 'telecom_expense']
      },
      'Office Supplies': {
        keywords: ['amazon', 'staples', 'office', 'supplies', 'paper', 'ink'],
        category: 'Operating Expenses',
        subcategory: 'Office Supplies',
        accounts: ['office_supplies_expense']
      },
      'Software': {
        keywords: ['software', 'saas', 'subscription', 'github', 'aws', 'azure', 'cloud'],
        category: 'Equipment',
        subcategory: 'Software & Subscriptions',
        accounts: ['software_expense', 'subscription_expense']
      }
    };

    for (const [category, config] of Object.entries(patterns)) {
      if (config.keywords.some((p: string) => desc.includes(p))) {
        return {
          category: config.category,
          subcategory: config.subcategory,
          confidence: 0.7,
          reasoning: `Matched keyword pattern for ${category}`,
          suggestedAccounts: config.accounts,
          tags: [category.toLowerCase().replace(/\s+/g, '_')]
        };
      }
    }

    return {
      category: 'General',
      subcategory: 'Uncategorized',
      confidence: 0.3,
      reasoning: 'No clear pattern match - manual review recommended',
      suggestedAccounts: ['misc_expense'],
      tags: ['uncategorized']
    };
  }

  /**
   * Generate financial report with AI
   */
  async generateReport(input: ReportGenerateInput): Promise<ReportGenerateResult> {
    this.status = 'working';
    this.lastActivity = new Date();

    try {
      const systemPrompt = `You are an expert CFO AI. Generate comprehensive financial reports.
Return JSON with this exact structure:
{
  "reportType": "string",
  "period": "string",
  "generatedAt": "ISO date string",
  "sections": [
    {
      "title": "string",
      "content": "string (detailed analysis)",
      "charts": [{"type": "bar|line|pie|table", "data": {}, "title": "string (optional)"}],
      "recommendations": ["string"]
    }
  ],
  "summary": "string (overall summary)",
  "executiveSummary": "string (2-3 sentence overview)",
  "keyMetrics": {"metric_name": number},
  "warnings": ["string"]
}`;

      const prompt = `Generate a ${input.type} financial report for ${input.period} for a ${input.business} business.

Include these sections: ${input.sections?.join(', ') || 'all sections (Revenue, Expenses, Profitability, Cash Flow, Recommendations)'}

Return ONLY valid JSON. No markdown, no explanation.`;

      const result = await this.callClaude(prompt, systemPrompt);
      const parsed = JSON.parse(result.trim());

      logger.info('Report generated by AI Brain', {
        reportType: input.type,
        period: input.period,
        sections: parsed.sections?.length || 0
      });

      this.status = 'idle';
      return parsed;

    } catch (error) {
      this.status = 'error';
      logger.error('Report generation error', { error });

      // Fallback to template report
      return this.fallbackReportGenerate(input);
    }
  }

  /**
   * Fallback template-based report generation
   */
  private fallbackReportGenerate(input: ReportGenerateInput): ReportGenerateResult {
    return {
      reportType: input.type,
      period: input.period,
      generatedAt: new Date().toISOString(),
      sections: [
        {
          title: 'Executive Summary',
          content: `Financial report for ${input.period}. This is a ${input.type} report for a ${input.business} business.`,
          charts: [],
          recommendations: [
            'Review revenue trends monthly',
            'Monitor expense ratios',
            'Track cash flow regularly'
          ]
        },
        {
          title: 'Revenue Analysis',
          content: 'Revenue analysis section - connect to transaction data for actual metrics.',
          charts: [{ type: 'bar', data: {}, title: 'Monthly Revenue' }],
          recommendations: []
        },
        {
          title: 'Expense Summary',
          content: 'Expense breakdown by category.',
          charts: [{ type: 'pie', data: {}, title: 'Expense Distribution' }],
          recommendations: []
        },
        {
          title: 'Recommendations',
          content: 'AI-powered recommendations based on financial health.',
          charts: [],
          recommendations: [
            'Consider cost reduction in high-spend categories',
            'Review underperforming revenue streams',
            'Optimize working capital management'
          ]
        }
      ],
      summary: `${input.type} financial report for ${input.period}`,
      executiveSummary: `This ${input.type} report provides an overview of financial performance for ${input.period}. Connect actual transaction data for detailed metrics.`,
      keyMetrics: {
        totalRevenue: 0,
        totalExpenses: 0,
        netProfit: 0,
        profitMargin: 0
      },
      warnings: ['Connect transaction data for actual metrics']
    };
  }

  /**
   * Check tax compliance with AI
   */
  async checkTaxCompliance(input: TaxComplianceInput): Promise<TaxComplianceResult> {
    this.status = 'working';
    this.lastActivity = new Date();

    try {
      const systemPrompt = `You are an expert tax compliance AI for ${input.jurisdiction}.
Analyze transactions for ${input.taxType} compliance.
Return JSON with this exact structure:
{
  "compliant": boolean,
  "score": 0-100,
  "suggestions": [{"type": "warning|error|opportunity", "code": "string", "message": "string", "action": "string", "potentialSavings": number}],
  "risks": [{"severity": "high|medium|low", "description": "string", "potentialPenalty": number, "mitigation": "string"}],
  "exemptions": [{"type": "string", "amount": number, "reason": "string"}],
  "recommendedFilings": [{"form": "string", "dueDate": "YYYY-MM-DD", "estimatedAmount": number}]
}`;

      const prompt = `Analyze these transactions for ${input.taxType} compliance in ${input.jurisdiction}:

Transactions (${input.transactions.length} total):
${JSON.stringify(input.transactions.slice(0, 50), null, 2)}

Period: ${input.period}

Return ONLY valid JSON. No markdown, no explanation.`;

      const result = await this.callClaude(prompt, systemPrompt);
      const parsed = JSON.parse(result.trim());

      logger.info('Tax compliance checked by AI Brain', {
        jurisdiction: input.jurisdiction,
        taxType: input.taxType,
        compliant: parsed.compliant,
        score: parsed.score
      });

      this.status = 'idle';
      return parsed;

    } catch (error) {
      this.status = 'error';
      logger.error('Tax compliance check error', { error });

      // Fallback to basic compliance check
      return this.fallbackTaxCompliance(input);
    }
  }

  /**
   * Fallback rule-based tax compliance
   */
  private fallbackTaxCompliance(input: TaxComplianceInput): TaxComplianceResult {
    const incomeTransactions = input.transactions.filter(t => t.type === 'income');
    const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = input.transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

    const suggestions: Array<{
      type: 'warning' | 'error' | 'opportunity';
      code: string;
      message: string;
      action: string;
      potentialSavings?: number;
    }> = [];
    const risks: Array<{
      severity: 'high' | 'medium' | 'low';
      description: string;
      potentialPenalty?: number;
      mitigation: string;
    }> = [];

    // Basic threshold checks
    if (totalIncome > 1000000) {
      suggestions.push({
        type: 'opportunity' as const,
        code: 'PREP_BIZ',
        message: 'Income exceeds threshold for preliminary tax estimation',
        action: 'Consider quarterly estimated tax payments',
        potentialSavings: totalIncome * 0.01
      });
    }

    // GST-specific checks for India
    if (input.taxType === 'GST' && input.jurisdiction === 'India') {
      if (totalExpenses > 0) {
        suggestions.push({
          type: 'opportunity' as const,
          code: 'INPUT_TAX',
          message: 'Input tax credit opportunity',
          action: 'Ensure all eligible expenses have GST invoices for ITC',
          potentialSavings: totalExpenses * 0.18 * 0.1
        });
      }
    }

    return {
      compliant: risks.filter(r => r.severity === 'high').length === 0,
      score: 70,
      suggestions,
      risks,
      exemptions: [],
      recommendedFilings: [
        {
          form: input.taxType === 'GST' ? 'GSTR-1' : 'Form 1040',
          dueDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 20).toISOString().split('T')[0],
          estimatedAmount: totalIncome * 0.18
        }
      ]
    };
  }

  /**
   * Detect anomalies in transactions
   */
  async detectAnomalies(input: AnomalyDetectInput): Promise<AnomalyDetectResult> {
    this.status = 'working';
    this.lastActivity = new Date();

    try {
      const systemPrompt = `You are an expert fraud detection AI. Analyze transactions for anomalies.
Return JSON with this exact structure:
{
  "anomalies": [
    {
      "transaction": {"id": "string", "date": "string", "description": "string", "amount": number, "category": "string"},
      "reason": "string",
      "severity": "high|medium|low",
      "deviation": number,
      "expectedRange": {"min": number, "max": number}
    }
  ],
  "total": number,
  "highSeverity": number,
  "mediumSeverity": number,
  "lowSeverity": number,
  "summary": "string"
}`;

      const prompt = `Analyze these transactions for anomalies:

${JSON.stringify(input.transactions, null, 2)}

Normal range: ${JSON.stringify(input.normalRange || {})}
Sensitivity: ${input.sensitivity || 0.7}

Return ONLY valid JSON. No markdown, no explanation.`;

      const result = await this.callClaude(prompt, systemPrompt);
      const parsed = JSON.parse(result.trim());

      logger.info('Anomalies detected by AI Brain', {
        totalTransactions: input.transactions.length,
        anomaliesFound: parsed.total,
        highSeverity: parsed.highSeverity
      });

      this.status = 'idle';
      return parsed;

    } catch (error) {
      this.status = 'error';
      logger.error('Anomaly detection error', { error });

      // Fallback to statistical anomaly detection
      return this.fallbackAnomalyDetect(input);
    }
  }

  /**
   * Fallback statistical anomaly detection
   */
  private fallbackAnomalyDetect(input: AnomalyDetectInput): AnomalyDetectResult {
    const amounts = input.transactions.map(t => t.amount);
    const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const stdDev = Math.sqrt(amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / amounts.length);

    const sensitivity = input.sensitivity || 0.7;
    const threshold = stdDev * (2 - sensitivity); // Higher sensitivity = lower threshold

    const anomalies: Anomaly[] = [];

    for (const tx of input.transactions) {
      const deviation = Math.abs(tx.amount - mean);

      if (deviation > threshold) {
        const severity = deviation > threshold * 2 ? 'high' : deviation > threshold ? 'medium' : 'low';

        anomalies.push({
          transaction: tx,
          reason: `Amount ${tx.amount} deviates ${Math.round(deviation / stdDev * 10) / 10} standard deviations from mean ${Math.round(mean * 100) / 100}`,
          severity,
          deviation: Math.round(deviation * 100) / 100,
          expectedRange: {
            min: Math.round((mean - threshold) * 100) / 100,
            max: Math.round((mean + threshold) * 100) / 100
          }
        });
      }
    }

    return {
      anomalies,
      total: anomalies.length,
      highSeverity: anomalies.filter(a => a.severity === 'high').length,
      mediumSeverity: anomalies.filter(a => a.severity === 'medium').length,
      lowSeverity: anomalies.filter(a => a.severity === 'low').length,
      summary: `Found ${anomalies.length} anomalies out of ${input.transactions.length} transactions`
    };
  }

  /**
   * Forecast cash flow with AI
   */
  async forecastCashFlow(input: CashFlowForecastInput): Promise<CashFlowForecastResult> {
    this.status = 'working';
    this.lastActivity = new Date();

    try {
      const systemPrompt = `You are an expert CFO AI. Forecast cash flow based on historical data.
Return JSON with this exact structure:
{
  "forecasts": [
    {
      "month": "YYYY-MM",
      "predictedIncome": number,
      "predictedExpenses": number,
      "predictedNetCashFlow": number,
      "confidence": 0.0-1.0,
      "factors": ["string"]
    }
  ],
  "runway": number,
  "recommendations": ["string"],
  "riskAssessment": {
    "level": "low|medium|high",
    "factors": ["string"]
  }
}`;

      const prompt = `Forecast cash flow for the next ${input.months} months based on historical data:

Historical transactions (${input.historicalTransactions.length} total):
${JSON.stringify(input.historicalTransactions.slice(0, 100), null, 2)}

Include seasonality: ${input.includeSeasonality}
Confidence level: ${input.confidenceLevel}

Return ONLY valid JSON. No markdown, no explanation.`;

      const result = await this.callClaude(prompt, systemPrompt);
      const parsed = JSON.parse(result.trim());

      logger.info('Cash flow forecast by AI Brain', {
        months: input.months,
        forecasts: parsed.forecasts?.length || 0,
        runway: parsed.runway
      });

      this.status = 'idle';
      return parsed;

    } catch (error) {
      this.status = 'error';
      logger.error('Cash flow forecast error', { error });

      // Fallback to statistical forecasting
      return this.fallbackCashFlowForecast(input);
    }
  }

  /**
   * Fallback statistical cash flow forecasting
   */
  private fallbackCashFlowForecast(input: CashFlowForecastInput): CashFlowForecastResult {
    const incomeTx = input.historicalTransactions.filter(t => t.type === 'income');
    const expenseTx = input.historicalTransactions.filter(t => t.type === 'expense');

    const avgIncome = incomeTx.length > 0 ? incomeTx.reduce((sum, t) => sum + t.amount, 0) / incomeTx.length : 0;
    const avgExpenses = expenseTx.length > 0 ? expenseTx.reduce((sum, t) => sum + t.amount, 0) / expenseTx.length : 0;

    const forecasts = [];
    const currentDate = new Date();

    for (let i = 1; i <= input.months; i++) {
      const forecastDate = new Date(currentDate);
      forecastDate.setMonth(forecastDate.getMonth() + i);

      // Simple growth projection
      const growthFactor = 1 + (0.02 * i); // 2% monthly growth
      const seasonalFactor = input.includeSeasonality ?
        [0.9, 0.9, 1.0, 1.0, 1.0, 1.0, 0.9, 0.95, 1.05, 1.1, 1.15, 1.2][forecastDate.getMonth()] : 1;

      const predictedIncome = Math.round(avgIncome * growthFactor * seasonalFactor);
      const predictedExpenses = Math.round(avgExpenses * growthFactor);
      const predictedNetCashFlow = predictedIncome - predictedExpenses;

      forecasts.push({
        month: `${forecastDate.getFullYear()}-${String(forecastDate.getMonth() + 1).padStart(2, '0')}`,
        predictedIncome,
        predictedExpenses,
        predictedNetCashFlow,
        confidence: Math.max(0.5, 0.9 - (i * 0.1)),
        factors: [
          'Based on historical average',
          input.includeSeasonality ? 'Seasonal adjustment applied' : 'No seasonality',
          `Projected ${i} month(s) forward`
        ]
      });
    }

    // Calculate runway
    const currentCash = 10000; // Placeholder - would come from actual balance
    const netMonthlyFlow = avgIncome - avgExpenses;
    const runway = netMonthlyFlow > 0 ? Math.round(currentCash / netMonthlyFlow) : 0;

    return {
      forecasts,
      runway,
      recommendations: [
        netMonthlyFlow < 0 ? 'Warning: Expenses exceed income. Consider cost reduction.' : 'Positive cash flow trend.',
        runway< 3 ? 'Critical: Low runway. Immediate action required.' : 'Runway is healthy.',
        'Monitor actual vs projected monthly'
      ],
      riskAssessment: {
        level: netMonthlyFlow < 0 || runway < 3 ? 'high' : netMonthlyFlow < avgIncome * 0.2 ? 'medium' : 'low',
        factors: [
          `Average monthly income: ${Math.round(avgIncome)}`,
          `Average monthly expenses: ${Math.round(avgExpenses)}`,
          `Net monthly flow: ${Math.round(netMonthlyFlow)}`
        ]
      }
    };
  }
}

export default new AIBrain();
