/**
 * Audit Agent AI
 * LEDGERAI - Accounting AI Operating System
 * Port: 4891
 */

import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(express.json());

export interface AuditFinding {
  id: string;
  severity: 'high' | 'medium' | 'low';
  category: string;
  description: string;
  affectedAccounts: string[];
  recommendation: string;
  potentialImpact: number;
}

export interface AuditReport {
  id: string;
  period: { from: string; to: string };
  scope: string;
  findings: AuditFinding[];
  riskScore: number;
  recommendations: string[];
  generatedAt: string;
}

class AuditAgent {
  private auditLogs: Map<string, AuditReport> = new Map();

  async performAudit(
    transactions: { id: string; amount: number; date: string; type: string; category: string }[],
    accounts: { id: string; balance: number; type: string }[]
  ): Promise<AuditReport> {
    const findings: AuditFinding[] = [];

    // Check for anomalies
    const largeTransactions = transactions.filter(t => t.amount > 100000);
    for (const t of largeTransactions) {
      findings.push({
        id: uuidv4(),
        severity: 'high',
        category: 'Large Transaction',
        description: `Unusually large transaction of ₹${t.amount.toLocaleString()}`,
        affectedAccounts: [t.id],
        recommendation: 'Verify supporting documentation for this transaction',
        potentialImpact: t.amount * 0.1,
      });
    }

    // Balance verification
    for (const account of accounts) {
      if (account.type === 'asset' && account.balance < 0) {
        findings.push({
          id: uuidv4(),
          severity: 'high',
          category: 'Negative Balance',
          description: `Account has negative balance: ₹${account.balance.toLocaleString()}`,
          affectedAccounts: [account.id],
          recommendation: 'Review and reconcile this account immediately',
          potentialImpact: Math.abs(account.balance),
        });
      }
    }

    // Expense ratio analysis
    const totalExpense = accounts.filter(a => a.type === 'expense').reduce((sum, a) => sum + a.balance, 0);
    const totalRevenue = accounts.filter(a => a.type === 'revenue').reduce((sum, a) => sum + a.balance, 0);

    if (totalExpense > totalRevenue * 0.8) {
      findings.push({
        id: uuidv4(),
        severity: 'medium',
        category: 'High Expense Ratio',
        description: `Expense to revenue ratio is ${Math.round((totalExpense / totalRevenue) * 100)}%`,
        affectedAccounts: accounts.filter(a => a.type === 'expense').map(a => a.id),
        recommendation: 'Review and optimize operating expenses',
        potentialImpact: totalExpense * 0.1,
      });
    }

    // Risk score calculation
    const riskScore = Math.min(100, findings.reduce((sum, f) => {
      const weight = f.severity === 'high' ? 20 : f.severity === 'medium' ? 10 : 5;
      return sum + weight;
    }, 0));

    const report: AuditReport = {
      id: uuidv4(),
      period: {
        from: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0],
      },
      scope: 'Full Financial Audit',
      findings,
      riskScore,
      recommendations: this.generateRecommendations(findings),
      generatedAt: new Date().toISOString(),
    };

    this.auditLogs.set(report.id, report);
    return report;
  }

  private generateRecommendations(findings: AuditFinding[]): string[] {
    const recs: string[] = [];

    const highSeverity = findings.filter(f => f.severity === 'high').length;
    if (highSeverity > 0) {
      recs.push('Immediate attention required for critical findings');
      recs.push('Implement stronger internal controls');
    }

    const categories = new Set(findings.map(f => f.category));
    if (categories.has('Large Transaction')) {
      recs.push('Establish approval matrix for high-value transactions');
    }
    if (categories.has('Negative Balance')) {
      recs.push('Set up automatic alerts for negative account balances');
    }

    recs.push('Schedule quarterly internal audits');
    recs.push('Update chart of accounts based on findings');

    return recs;
  }

  async checkCompliance(transactions: unknown[]): Promise<{ compliant: boolean; issues: string[] }> {
    const issues: string[] = [];

    // GST compliance
    const gstTransactions = (transactions as { type: string; amount: number }[]).filter(t =>
      t.type === 'sale' && t.amount > 10000
    );
    if (gstTransactions.length > 0 && gstTransactions.length % 3 !== 0) {
      issues.push('GST filing may be inconsistent');
    }

    // TDS compliance
    const paymentTransactions = (transactions as { type: string }[]).filter(t => t.type === 'payment');
    if (paymentTransactions.length > 50) {
      issues.push('Ensure TDS deductions are properly documented');
    }

    return {
      compliant: issues.length === 0,
      issues,
    };
  }

  async generateChecklist(type: 'pre-audit' | 'post-audit' | 'tax'): Promise<{ task: string; completed: boolean }[]> {
    const checklists = {
      'pre-audit': [
        { task: 'Gather all bank statements', completed: false },
        { task: 'Reconcile credit card statements', completed: false },
        { task: 'Verify petty cash balance', completed: false },
        { task: 'Review outstanding invoices', completed: false },
        { task: 'Check payroll records', completed: false },
        { task: 'Review fixed asset register', completed: false },
      ],
      'post-audit': [
        { task: 'Document all findings', completed: false },
        { task: 'Prepare management letter', completed: false },
        { task: 'Track remediation actions', completed: false },
        { task: 'Update risk matrix', completed: false },
      ],
      'tax': [
        { task: 'Reconcile TDS deductions', completed: false },
        { task: 'Verify GST returns', completed: false },
        { task: 'Review tax deducted at source', completed: false },
        { task: 'Check advance tax payments', completed: false },
      ],
    };

    return checklists[type] || [];
  }
}

const auditAgent = new AuditAgent();

// Routes
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'ledgerai-audit-agent', port: 4891 });
});

app.post('/api/audit/perform', async (req: Request, res: Response) => {
  try {
    const { transactions, accounts } = req.body;
    const report = await auditAgent.performAudit(transactions, accounts);
    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ error: 'Failed to perform audit' });
  }
});

app.get('/api/audit/reports', async (req: Request, res: Response) => {
  res.json({ success: true, reports: Array.from(auditAgent.getAuditLogs?.() || []) });
});

app.post('/api/audit/compliance', async (req: Request, res: Response) => {
  try {
    const { transactions } = req.body;
    const result = await auditAgent.checkCompliance(transactions);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check compliance' });
  }
});

app.get('/api/audit/checklist', async (req: Request, res: Response) => {
  try {
    const type = (req.query.type as 'pre-audit' | 'post-audit' | 'tax') || 'pre-audit';
    const checklist = await auditAgent.generateChecklist(type);
    res.json({ success: true, checklist });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate checklist' });
  }
});

const PORT = 4891;
app.listen(PORT, () => {
  console.log(`🔍 Audit Agent running on port ${PORT}`);
  console.log(`📊 LEDGERAI - Accounting AI Operating System`);
});

export default app;