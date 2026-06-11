/**
 * LEDGERAI - AI Accountant Agent
 * Handles transaction categorization and reconciliation
 */

import { Transaction, Account } from '../models';
import logger from '../middleware/logger';
import config from '../config';

interface CategorizationResult {
  category: string;
  subcategory?: string;
  confidence: number;
  suggestedAccounts?: string[];
  reasoning: string;
}

interface ReconciliationResult {
  transactionId: string;
  status: 'matched' | 'unmatched' | 'discrepancy';
  matchDetails?: {
    matchedTransactionId?: string;
    amount?: number;
    date?: Date;
  };
  discrepancyDetails?: {
    expected?: number;
    actual?: number;
    variance?: number;
  };
}

// Category patterns for AI-based categorization
const categoryPatterns = {
  'Revenue': {
    patterns: ['sales', 'revenue', 'income', 'interest earned', 'dividend', 'rental income'],
    accounts: ['sales_revenue', 'service_revenue', 'interest_income']
  },
  'Cost of Sales': {
    patterns: ['cogs', 'cost of goods', 'direct cost', 'materials', 'inventory sold'],
    accounts: ['cogs', 'direct_materials', 'direct_labor']
  },
  'Operating Expenses': {
    patterns: ['salary', 'wages', 'rent', 'utilities', 'office', 'supplies', 'insurance'],
    accounts: ['salary_expense', 'rent_expense', 'utilities_expense']
  },
  'Travel & Entertainment': {
    patterns: ['travel', 'meals', 'entertainment', 'client dinner', 'flight', 'hotel'],
    accounts: ['travel_expense', 'meals_expense', 'entertainment_expense']
  },
  'Marketing': {
    patterns: ['advertising', 'marketing', 'promotion', 'ads', 'campaign', 'seo', 'social media'],
    accounts: ['advertising_expense', 'marketing_expense']
  },
  'Professional Services': {
    patterns: ['legal', 'accounting', 'consulting', 'professional', 'attorney', ' CPA'],
    accounts: ['legal_expense', 'consulting_expense']
  },
  'Equipment': {
    patterns: ['equipment', 'furniture', 'computer', 'software', 'hardware'],
    accounts: ['equipment_expense', 'software_expense']
  },
  'Taxes': {
    patterns: ['tax', 'duty', 'vat', 'gst', 'payroll tax'],
    accounts: ['tax_expense', 'vat_payable']
  },
  'Insurance': {
    patterns: ['insurance', 'premium', 'coverage', 'liability'],
    accounts: ['insurance_expense']
  },
  'Utilities': {
    patterns: ['electric', 'gas', 'water', 'internet', 'phone', 'telecom'],
    accounts: ['utilities_expense']
  },
  'Bank Fees': {
    patterns: ['bank fee', 'service charge', 'atm', 'wire', 'transfer fee'],
    accounts: ['bank_fees_expense']
  }
};

export class AIAccountant {
  name = 'AI Accountant';
  role = 'Transaction categorization and reconciliation';
  status: 'idle' | 'working' | 'error' = 'idle';
  lastActivity?: Date;

  /**
   * Categorize a transaction based on description and amount
   */
  async categorizeTransaction(description: string, amount?: number): Promise<CategorizationResult> {
    this.status = 'working';
    this.lastActivity = new Date();

    try {
      const normalizedDesc = description.toLowerCase();

      let bestMatch = {
        category: 'General',
        subcategory: undefined as string | undefined,
        confidence: 0,
        reasoning: ''
      };

      // Check against known patterns
      for (const [category, config] of Object.entries(categoryPatterns)) {
        for (const pattern of config.patterns) {
          if (normalizedDesc.includes(pattern)) {
            const confidence = pattern.length / normalizedDesc.length;

            if (confidence > bestMatch.confidence) {
              bestMatch = {
                category,
                subcategory: category,
                confidence: Math.min(confidence + 0.3, 0.95),
                reasoning: `Matched keyword "${pattern}" in description`
              };
            }
          }
        }
      }

      // Special handling for amounts
      if (amount) {
        if (amount < 0 && bestMatch.category === 'General') {
          bestMatch.category = 'Revenue';
          bestMatch.confidence = 0.7;
          bestMatch.reasoning = 'Negative amount suggests income/revenue';
        }
      }

      // Fallback
      if (bestMatch.confidence < 0.3) {
        bestMatch = {
          category: 'General',
          subcategory: 'Uncategorized',
          confidence: 0.5,
          reasoning: 'No clear pattern match - manual categorization recommended'
        };
      }

      // Get suggested accounts
      const suggestedAccounts = await this.getSuggestedAccounts(bestMatch.category);

      logger.info('Transaction categorized by AI Accountant', {
        description: description.substring(0, 50),
        category: bestMatch.category,
        confidence: bestMatch.confidence
      });

      this.status = 'idle';

      return {
        ...bestMatch,
        suggestedAccounts,
        reasoning: bestMatch.reasoning
      };
    } catch (error) {
      this.status = 'error';
      logger.error('AI Accountant categorization error', { error, description });
      throw error;
    }
  }

  /**
   * Get suggested accounts for a category
   */
  private async getSuggestedAccounts(category: string): Promise<string[]> {
    try {
      const accounts = await Account.find({
        type: this.getAccountTypeForCategory(category),
        isActive: true
      }).limit(5).select('code name');

      return accounts.map(a => `${a.code} - ${a.name}`);
    } catch {
      return [];
    }
  }

  /**
   * Map category to account type
   */
  private getAccountTypeForCategory(category: string): string {
    const mapping: Record<string, string[]> = {
      'Revenue': ['revenue'],
      'Cost of Sales': ['expense'],
      'Operating Expenses': ['expense'],
      'Travel & Entertainment': ['expense'],
      'Marketing': ['expense'],
      'Professional Services': ['expense'],
      'Equipment': ['asset', 'expense'],
      'Taxes': ['liability', 'expense'],
      'Insurance': ['expense'],
      'Utilities': ['expense'],
      'Bank Fees': ['expense']
    };

    return mapping[category]?.[0] || 'expense';
  }

  /**
   * Reconcile transactions
   */
  async reconcileTransactions(transactionIds: string[]): Promise<ReconciliationResult[]> {
    this.status = 'working';
    this.lastActivity = new Date();

    try {
      const results: ReconciliationResult[] = [];

      for (const transactionId of transactionIds) {
        const transaction = await Transaction.findById(transactionId);

        if (!transaction) {
          results.push({
            transactionId,
            status: 'unmatched',
            matchDetails: {
              matchedTransactionId: undefined
            }
          });
          continue;
        }

        // Check if already reconciled
        if (transaction.reconciled) {
          results.push({
            transactionId,
            status: 'matched',
            matchDetails: {
              amount: transaction.amount,
              date: transaction.date
            }
          });
          continue;
        }

        // Find potential matches
        const potentialMatches = await this.findMatchingTransactions(transaction);

        if (potentialMatches.length > 0) {
          const bestMatch = potentialMatches[0];
          const variance = Math.abs(transaction.amount - bestMatch.amount);

          if (variance < 0.01) {
            // Mark as reconciled
            await Transaction.findByIdAndUpdate(transactionId, {
              reconciled: true,
              reconciledAt: new Date()
            });

            results.push({
              transactionId,
              status: 'matched',
              matchDetails: {
                matchedTransactionId: bestMatch._id.toString(),
                amount: bestMatch.amount,
                date: bestMatch.date
              }
            });
          } else {
            results.push({
              transactionId,
              status: 'discrepancy',
              discrepancyDetails: {
                expected: bestMatch.amount,
                actual: transaction.amount,
                variance
              }
            });
          }
        } else {
          results.push({
            transactionId,
            status: 'unmatched'
          });
        }
      }

      logger.info('Reconciliation completed', {
        totalTransactions: transactionIds.length,
        matched: results.filter(r => r.status === 'matched').length,
        unmatched: results.filter(r => r.status === 'unmatched').length,
        discrepancies: results.filter(r => r.status === 'discrepancy').length
      });

      this.status = 'idle';

      return results;
    } catch (error) {
      this.status = 'error';
      logger.error('AI Accountant reconciliation error', { error, transactionIds });
      throw error;
    }
  }

  /**
   * Find matching transactions for reconciliation
   */
  private async findMatchingTransactions(transaction: any) {
    const startDate = new Date(transaction.date);
    startDate.setDate(startDate.getDate() - 3);

    const endDate = new Date(transaction.date);
    endDate.setDate(endDate.getDate() + 3);

    return Transaction.find({
      _id: { $ne: transaction._id },
      amount: transaction.amount,
      date: { $gte: startDate, $lte: endDate },
      reconciled: false
    }).limit(1);
  }

  /**
   * Bulk categorize transactions
   */
  async bulkCategorize(transactions: Array<{ id: string; description: string; amount?: number }>): Promise<{
    transactionId: string;
    category: string;
    confidence: number;
  }[]> {
    this.status = 'working';
    this.lastActivity = new Date();

    try {
      const results = [];

      for (const tx of transactions) {
        const result = await this.categorizeTransaction(tx.description, tx.amount);

        // Update transaction with suggested category
        if (result.confidence > 0.6) {
          await Transaction.findByIdAndUpdate(tx.id, {
            category: result.category,
            subcategory: result.subcategory
          });
        }

        results.push({
          transactionId: tx.id,
          category: result.category,
          confidence: result.confidence
        });
      }

      this.status = 'idle';

      return results;
    } catch (error) {
      this.status = 'error';
      logger.error('AI Accountant bulk categorization error', { error });
      throw error;
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
      capabilities: [
        'Transaction categorization',
        'Transaction reconciliation',
        'Bulk categorization',
        'Category suggestions'
      ]
    };
  }
}

export default new AIAccountant();