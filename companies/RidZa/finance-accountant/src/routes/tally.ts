import { Router } from 'express';
import { LedgerEntry, Invoice } from '../models/index.js';
import { createResponse } from '../types/index.js';
import { asyncHandler, authMiddleware, AuthenticatedRequest } from '../middleware/index.js';

const router = Router();

// Export to Tally format
router.get('/export/:tenantId',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { tenantId } = req.params;

    const entries = await LedgerEntry.find({ tenantId });

    // Group by ledger
    const groupedLedgers: Record<string, { debit: number; credit: number }> = {};

    for (const entry of entries) {
      if (!groupedLedgers[entry.ledger]) {
        groupedLedgers[entry.ledger] = { debit: 0, credit: 0 };
      }
      groupedLedgers[entry.ledger].debit += entry.debit;
      groupedLedgers[entry.ledger].credit += entry.credit;
    }

    // Generate Tally XML format
    const tallyXml = `<?xml version="1.0" encoding="UTF-8"?>
<STATEMENT>
  <COMPANY>${tenantId}</COMPANY>
  <DATE>${new Date().toISOString().split('T')[0]}</DATE>
  <LEDGERS>
    ${Object.entries(groupedLedgers).map(([name, amounts]) => `
    <LEDGER>
      <NAME>${escapeXml(name)}</NAME>
      <DEBIT>${amounts.debit.toFixed(2)}</DEBIT>
      <CREDIT>${amounts.credit.toFixed(2)}</CREDIT>
      <BALANCE>${(amounts.credit - amounts.debit).toFixed(2)}</BALANCE>
    </LEDGER>`).join('')}
  </LEDGERS>
</STATEMENT>`;

    res.json(createResponse(true, {
      tallyXml,
      summary: {
        ledgerCount: Object.keys(groupedLedgers).length,
        totalDebit: Object.values(groupedLedgers).reduce((sum, a) => sum + a.debit, 0),
        totalCredit: Object.values(groupedLedgers).reduce((sum, a) => sum + a.credit, 0)
      }
    }));
  })
);

// Sync invoices to ledger
router.post('/sync/:tenantId',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { tenantId } = req.params;

    // Find unsynced invoices
    const invoices = await Invoice.find({ tenantId, tallySync: false });

    const entries: string[] = [];

    for (const invoice of invoices) {
      // Create ledger entry for each invoice
      const entry = new LedgerEntry({
        entryId: `LED-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        tenantId,
        ledger: invoice.ledger,
        debit: invoice.type === 'purchase' ? invoice.amount : 0,
        credit: invoice.type === 'sales' ? invoice.amount : 0,
        narration: `${invoice.type.toUpperCase()} Invoice ${invoice.invoiceId}`,
        reference: invoice.invoiceId,
        invoiceId: invoice.invoiceId
      });

      await entry.save();
      entries.push(entry.entryId);

      // Mark invoice as synced
      invoice.tallySync = true;
      invoice.tallySyncDate = new Date();
      await invoice.save();
    }

    res.json(createResponse(true, {
      syncedCount: invoices.length,
      entryIds: entries
    }));
  })
);

// Get sync status
router.get('/sync/:tenantId/status',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { tenantId } = req.params;

    const totalInvoices = await Invoice.countDocuments({ tenantId });
    const syncedInvoices = await Invoice.countDocuments({ tenantId, tallySync: true });

    res.json(createResponse(true, {
      total: totalInvoices,
      synced: syncedInvoices,
      pending: totalInvoices - syncedInvoices,
      syncPercentage: totalInvoices > 0 ? Math.round((syncedInvoices / totalInvoices) * 100) : 100
    }));
  })
);

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, ''');
}

export default router;
