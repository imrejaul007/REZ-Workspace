/**
 * REZ Expense - Smart Receipt Matching Service
 * Auto-matches receipts to transactions with confidence scoring
 */

import {
  Receipt,
  ReceiptMatchResult,
  ReceiptMatchCandidate,
  ReceiptMatchStatus,
  ExpenseBase,
  MatchFactor,
  MatchSuggestion,
  MATCH_CONFIDENCE_THRESHOLDS,
} from '../types';

interface MatchConfig {
  autoMatchThreshold: number;
  suggestMatchThreshold: number;
  dateToleranceDays: number;
  amountTolerancePercent: number;
}

export class ReceiptMatchingService {
  private config: MatchConfig;

  constructor() {
    this.config = {
      autoMatchThreshold: MATCH_CONFIDENCE_THRESHOLDS.AUTO_MATCH,
      suggestMatchThreshold: MATCH_CONFIDENCE_THRESHOLDS.SUGGEST_MATCH,
      dateToleranceDays: 3,
      amountTolerancePercent: 5,
    };
  }

  /**
   * Match receipts to expenses
   */
  async matchReceipts(
    receipts: Receipt[],
    expenses: ExpenseBase[]
  ): Promise<ReceiptMatchResult[]> {
    const results: ReceiptMatchResult[] = [];

    for (const receipt of receipts) {
      const result = await this.matchSingleReceipt(receipt, expenses);
      results.push(result);
    }

    return results;
  }

  /**
   * Match a single receipt to expenses
   */
  async matchSingleReceipt(
    receipt: Receipt,
    expenses: ExpenseBase[]
  ): Promise<ReceiptMatchResult> {
    const candidates = await this.findMatchCandidates(receipt, expenses);
    const sortedCandidates = candidates.sort((a, b) => b.match_score - a.match_score);

    // Determine best match
    const bestMatch = sortedCandidates[0];
    let status: ReceiptMatchStatus = 'unmatched';
    let autoMatchConfidence = 0;

    if (bestMatch && bestMatch.match_score >= this.config.autoMatchThreshold) {
      status = 'matched';
      autoMatchConfidence = bestMatch.match_score;
    } else if (bestMatch && bestMatch.match_score >= this.config.suggestMatchThreshold) {
      status = 'pending';
      autoMatchConfidence = bestMatch.match_score;
    } else if (receipt.ocr_data?.amount && receipt.ocr_data?.merchant_name) {
      // Receipt has data but no good match
      status = 'flagged';
    }

    // Generate suggestions
    const suggestions = this.generateSuggestions(receipt, sortedCandidates, status);

    return {
      receipt_id: receipt.receipt_id,
      status,
      matched_expense: status === 'matched' && bestMatch ? {
        expense_id: bestMatch.expense_id,
        merchant_name: bestMatch.merchant_name,
        amount: bestMatch.amount,
        date: bestMatch.date,
        match_score: bestMatch.match_score,
      } : undefined,
      candidates: sortedCandidates.slice(0, 5),
      suggestions,
      auto_match_confidence: autoMatchConfidence,
    };
  }

  /**
   * Find potential match candidates
   */
  private async findMatchCandidates(
    receipt: Receipt,
    expenses: ExpenseBase[]
  ): Promise<ReceiptMatchCandidate[]> {
    const candidates: ReceiptMatchCandidate[] = [];
    const receiptMerchant = (receipt.merchant_name || receipt.ocr_data?.merchant_name || '').toLowerCase();
    const receiptAmount = receipt.amount || receipt.ocr_data?.amount;
    const receiptDate = receipt.date || receipt.ocr_data?.date;

    for (const expense of expenses) {
      const factors = this.calculateMatchFactors(receipt, expense, receiptMerchant, receiptAmount, receiptDate);
      const totalScore = factors.reduce((sum, f) => sum + f.contribution, 0);
      const reasons = this.generateMatchReasons(factors);

      if (totalScore > 0.2) {
        candidates.push({
          expense_id: expense.expense_id,
          merchant_name: expense.merchant_name,
          amount: expense.amount,
          date: expense.date,
          match_score: totalScore,
          match_factors: factors,
          reasons,
        });
      }
    }

    return candidates;
  }

  /**
   * Calculate match factors between receipt and expense
   */
  private calculateMatchFactors(
    receipt: Receipt,
    expense: ExpenseBase,
    receiptMerchant: string,
    receiptAmount: number | undefined,
    receiptDate: Date | undefined
  ): MatchFactor[] {
    const factors: MatchFactor[] = [];

    // Merchant match factor
    const merchantScore = this.calculateMerchantScore(receiptMerchant, expense.merchant_name);
    factors.push({
      factor: 'merchant',
      weight: 0.35,
      score: merchantScore,
      contribution: merchantScore * 0.35,
    });

    // Amount match factor
    const amountScore = receiptAmount
      ? this.calculateAmountScore(receiptAmount, expense.amount)
      : 0;
    factors.push({
      factor: 'amount',
      weight: 0.35,
      score: amountScore,
      contribution: amountScore * 0.35,
    });

    // Date match factor
    const dateScore = receiptDate
      ? this.calculateDateScore(receiptDate, expense.date)
      : 0.5;
    factors.push({
      factor: 'date',
      weight: 0.2,
      score: dateScore,
      contribution: dateScore * 0.2,
    });

    // Location match factor (if available)
    if (receipt.ocr_data?.merchant_name && expense.location) {
      // In production, use geocoding to compare locations
      const locationScore = 0.5; // Neutral score
      factors.push({
        factor: 'location',
        weight: 0.1,
        score: locationScore,
        contribution: locationScore * 0.1,
      });
    }

    return factors;
  }

  /**
   * Calculate merchant name similarity
   */
  private calculateMerchantScore(receiptMerchant: string, expenseMerchant: string): number {
    const normalized1 = receiptMerchant.toLowerCase().trim();
    const normalized2 = expenseMerchant.toLowerCase().trim();

    if (normalized1 === normalized2) return 1.0;
    if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) return 0.8;

    // Calculate Levenshtein distance for fuzzy matching
    const distance = this.levenshteinDistance(normalized1, normalized2);
    const maxLength = Math.max(normalized1.length, normalized2.length);
    const similarity = 1 - distance / maxLength;

    return Math.max(0, similarity);
  }

  /**
   * Calculate amount match score
   */
  private calculateAmountScore(receiptAmount: number, expenseAmount: number): number {
    const diff = Math.abs(receiptAmount - expenseAmount);
    const avg = (receiptAmount + expenseAmount) / 2;
    const percentDiff = (diff / avg) * 100;

    if (percentDiff === 0) return 1.0;
    if (percentDiff <= this.config.amountTolerancePercent) return 0.9;
    if (percentDiff <= 10) return 0.7;
    if (percentDiff <= 20) return 0.4;
    return 0;
  }

  /**
   * Calculate date match score
   */
  private calculateDateScore(receiptDate: Date, expenseDate: Date): number {
    const diffDays = Math.abs(
      Math.floor((receiptDate.getTime() - expenseDate.getTime()) / (1000 * 60 * 60 * 24))
    );

    if (diffDays === 0) return 1.0;
    if (diffDays <= 1) return 0.9;
    if (diffDays <= 3) return 0.7;
    if (diffDays <= 7) return 0.4;
    return 0;
  }

  /**
   * Calculate Levenshtein distance
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const m = str1.length;
    const n = str2.length;
    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
      }
    }

    return dp[m][n];
  }

  /**
   * Generate match reasons
   */
  private generateMatchReasons(factors: MatchFactor[]): string[] {
    const reasons: string[] = [];

    for (const factor of factors) {
      if (factor.score >= 0.8) {
        switch (factor.factor) {
          case 'merchant':
            reasons.push('Merchant names match');
            break;
          case 'amount':
            reasons.push('Amounts match exactly');
            break;
          case 'date':
            reasons.push('Transaction dates match');
            break;
          case 'location':
            reasons.push('Locations match');
            break;
        }
      } else if (factor.score >= 0.5) {
        switch (factor.factor) {
          case 'merchant':
            reasons.push('Merchant names are similar');
            break;
          case 'amount':
            reasons.push('Amounts are within tolerance');
            break;
          case 'date':
            reasons.push('Transaction dates are close');
            break;
        }
      }
    }

    return reasons;
  }

  /**
   * Generate match suggestions
   */
  private generateSuggestions(
    receipt: Receipt,
    candidates: ReceiptMatchCandidate[],
    status: ReceiptMatchStatus
  ): MatchSuggestion[] {
    const suggestions: MatchSuggestion[] = [];

    if (status === 'unmatched' && !receipt.matched_expense_id) {
      // Check if we should suggest creating a new expense
      if (receipt.ocr_data?.merchant_name && receipt.ocr_data?.amount) {
        suggestions.push({
          type: 'create_expense',
          description: 'Create new expense from receipt',
          action: `Create expense for ${receipt.ocr_data.merchant_name} (${receipt.ocr_data.amount} INR)`,
          priority: 'medium',
        });
      }

      suggestions.push({
        type: 'review',
        description: 'Manual review needed',
        action: 'Review receipt and find matching transaction manually',
        priority: 'low',
      });
    }

    if (status === 'flagged') {
      suggestions.push({
        type: 'review',
        description: 'Receipt needs verification',
        action: 'Review receipt data and confirm or correct the details',
        priority: 'high',
      });
    }

    if (candidates.length > 1) {
      suggestions.push({
        type: 'merge_receipts',
        description: 'Multiple possible matches found',
        action: `Review ${candidates.length} potential matching transactions`,
        priority: candidates[0].match_score > 0.7 ? 'low' : 'medium',
      });
    }

    return suggestions;
  }

  /**
   * Get unmatched receipts
   */
  async getUnmatchedReceipts(
    receipts: Receipt[],
    expenses: ExpenseBase[]
  ): Promise<Receipt[]> {
    const unmatched: Receipt[] = [];

    for (const receipt of receipts) {
      if (receipt.match_status === 'unmatched' && !receipt.matched_expense_id) {
        // Double check by trying to match
        const result = await this.matchSingleReceipt(receipt, expenses);
        if (result.status === 'unmatched') {
          unmatched.push(receipt);
        }
      }
    }

    return unmatched;
  }

  /**
   * Suggest merchant matches for a new expense
   */
  async suggestMerchantMatches(
    merchantName: string,
    recentExpenses: ExpenseBase[]
  ): Promise<string[]> {
    const normalizedMerchant = merchantName.toLowerCase();
    const suggestions: Map<string, number> = new Map();

    for (const expense of recentExpenses) {
      const similarity = this.calculateMerchantScore(normalizedMerchant, expense.merchant_name);
      if (similarity > 0.3) {
        suggestions.set(
          expense.merchant_name,
          Math.max(suggestions.get(expense.merchant_name) || 0, similarity)
        );
      }
    }

    return Array.from(suggestions.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name);
  }

  /**
   * Auto-match receipts with high confidence
   */
  async autoMatchHighConfidence(
    receipts: Receipt[],
    expenses: ExpenseBase[]
  ): Promise<{ matched: Receipt[]; unmatched: Receipt[] }> {
    const matched: Receipt[] = [];
    const unmatched: Receipt[] = [];

    for (const receipt of receipts) {
      const result = await this.matchSingleReceipt(receipt, expenses);

      if (result.status === 'matched') {
        matched.push({
          ...receipt,
          match_status: 'matched',
          matched_expense_id: result.matched_expense?.expense_id,
          match_confidence: result.auto_match_confidence,
        });
      } else {
        unmatched.push(receipt);
      }
    }

    return { matched, unmatched };
  }

  /**
   * Merge duplicate receipts
   */
  async mergeDuplicateReceipts(
    receipts: Receipt[]
  ): Promise<Receipt[]> {
    const merged: Receipt[] = [];
    const processed = new Set<string>();

    for (const receipt of receipts) {
      if (processed.has(receipt.receipt_id)) continue;

      const duplicates = receipts.filter(r =>
        r.receipt_id !== receipt.receipt_id &&
        !processed.has(r.receipt_id) &&
        this.levenshteinDistance(
          (receipt.merchant_name || '').toLowerCase(),
          (r.merchant_name || '').toLowerCase()
        ) <= 3 &&
        Math.abs((receipt.amount || 0) - (r.amount || 0)) < 10
      );

      if (duplicates.length > 0) {
        // Merge receipts - take the one with most complete data
        const mergedReceipt = this.mergeReceiptData(receipt, duplicates);
        merged.push(mergedReceipt);
        processed.add(receipt.receipt_id);
        duplicates.forEach(d => processed.add(d.receipt_id));
      } else {
        merged.push(receipt);
        processed.add(receipt.receipt_id);
      }
    }

    return merged;
  }

  /**
   * Merge receipt data from duplicates
   */
  private mergeReceiptData(primary: Receipt, duplicates: Receipt[]): Receipt {
    let merchantName = primary.merchant_name;
    let amount = primary.amount;
    let date = primary.date;
    let ocrData = primary.ocr_data;

    for (const dup of duplicates) {
      if (!merchantName && dup.merchant_name) merchantName = dup.merchant_name;
      if (!amount && dup.amount) amount = dup.amount;
      if (!date && dup.date) date = dup.date;
      if (!ocrData && dup.ocr_data) ocrData = dup.ocr_data;
    }

    return {
      ...primary,
      merchant_name: merchantName,
      amount,
      date,
      ocr_data: ocrData,
    };
  }

  /**
   * Validate receipt data
   */
  validateReceiptData(receipt: Receipt): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!receipt.image_url) {
      errors.push('Receipt image URL is required');
    }

    if (receipt.amount && receipt.amount < 0) {
      errors.push('Amount cannot be negative');
    }

    if (receipt.amount && receipt.amount > 1000000) {
      errors.push('Amount seems unusually high');
    }

    if (receipt.date && receipt.date > new Date()) {
      errors.push('Receipt date cannot be in the future');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// Export singleton instance
export const receiptMatchingService = new ReceiptMatchingService();
