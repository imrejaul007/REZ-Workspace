/**
 * Duplicate Invoice Detection Service
 * Uses hash patterns to detect duplicate invoices
 */
import crypto from 'crypto';
import { Invoice, DuplicateCheckResult, LineItem } from '../types/index.js';

/**
 * Generate a hash from invoice data
 */
export function hashInvoice(invoice: Invoice): string {
  const lineItemsHash = invoice.lineItems
    .map(item => `${item.description}|${item.quantity}|${item.unitPrice}`)
    .join('||');

  const data = `${invoice.vendorId}|${invoice.amount}|${invoice.currency}|${invoice.date.toISOString()}|${lineItemsHash}`;

  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Generate a normalized hash (ignoring minor differences)
 */
export function hashInvoiceNormalized(invoice: Invoice): string {
  const normalizedLineItems = invoice.lineItems
    .map(item => ({
      descNormalized: item.description.toLowerCase().replace(/\s+/g, ' ').trim(),
      quantity: item.quantity,
      unitPrice: Math.round(item.unitPrice * 100) / 100, // Round to 2 decimals
    }))
    .sort((a, b) => a.descNormalized.localeCompare(b.descNormalized));

  const lineItemsHash = normalizedLineItems
    .map(item => `${item.descNormalized}|${item.quantity}|${item.unitPrice}`)
    .join('||');

  const data = `${invoice.vendorId}|${Math.round(invoice.amount * 100) / 100}|${invoice.currency}|${invoice.date.toISOString().split('T')[0]}|${lineItemsHash}`;

  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Compare two invoices and return match reasons
 */
export function compareInvoices(invoice1: Invoice, invoice2: Invoice): string[] {
  const reasons: string[] = [];

  // Same amount
  if (invoice1.amount === invoice2.amount) {
    reasons.push(`Identical amount: ${invoice1.amount}`);
  } else if (Math.abs(invoice1.amount - invoice2.amount) < 0.01) {
    reasons.push(`Amount difference within tolerance: ${invoice1.amount} vs ${invoice2.amount}`);
  }

  // Same vendor
  if (invoice1.vendorId === invoice2.vendorId) {
    reasons.push(`Same vendor: ${invoice1.vendorId}`);
  }

  // Same date
  const date1 = invoice1.date.toISOString().split('T')[0];
  const date2 = invoice2.date.toISOString().split('T')[0];
  if (date1 === date2) {
    reasons.push(`Same date: ${date1}`);
  } else if (Math.abs(invoice1.date.getTime() - invoice2.date.getTime()) < 24 * 60 * 60 * 1000) {
    reasons.push(`Close dates: ${date1} vs ${date2}`);
  }

  // Similar line items
  const items1Set = new Set(invoice1.lineItems.map(i => i.description.toLowerCase()));
  const items2Set = new Set(invoice2.lineItems.map(i => i.description.toLowerCase()));
  const overlap = [...items1Set].filter(x => items2Set.has(x));

  if (overlap.length > 0) {
    reasons.push(`${overlap.length} matching line item(s): ${overlap.join(', ')}`);
  }

  return reasons;
}

/**
 * Check if an invoice is a duplicate of any in the reference set
 */
export function checkDuplicate(
  invoice: Invoice,
  referenceInvoices: Invoice[],
  strictMode = false
): DuplicateCheckResult {
  if (referenceInvoices.length === 0) {
    return {
      isDuplicate: false,
      confidence: 0,
      matchReasons: [],
    };
  }

  const invoiceHash = strictMode ? hashInvoice(invoice) : hashInvoiceNormalized(invoice);
  const matchReasons: string[] = [];
  let matchedInvoice: Invoice | undefined;

  for (const ref of referenceInvoices) {
    const refHash = strictMode ? hashInvoice(ref) : hashInvoiceNormalized(ref);

    // Exact hash match
    if (invoiceHash === refHash) {
      return {
        isDuplicate: true,
        confidence: 1.0,
        matchedInvoiceId: ref.invoiceId,
        matchReasons: ['Exact hash match - identical invoice data'],
      };
    }

    // Partial comparison for fuzzy matching
    const comparisonReasons = compareInvoices(invoice, ref);
    if (comparisonReasons.length >= 3) {
      matchReasons.push(...comparisonReasons);
      matchedInvoice = ref;
    }
  }

  if (matchedInvoice && matchReasons.length > 0) {
    // Calculate confidence based on match reasons
    const confidence = Math.min(matchReasons.length * 0.25, 0.95);

    return {
      isDuplicate: confidence >= 0.7,
      confidence,
      matchedInvoiceId: matchedInvoice.invoiceId,
      matchReasons: [...new Set(matchReasons)], // Deduplicate
    };
  }

  return {
    isDuplicate: false,
    confidence: 0.1,
    matchReasons: [],
  };
}

/**
 * Find all potential duplicates in a set of invoices
 */
export function findAllDuplicates(invoices: Invoice[]): Map<string, string[]> {
  const duplicates = new Map<string, string[]>();
  const hashMap = new Map<string, string[]>();

  // Group by normalized hash
  for (const invoice of invoices) {
    const hash = hashInvoiceNormalized(invoice);
    if (!hashMap.has(hash)) {
      hashMap.set(hash, []);
    }
    hashMap.get(hash)?.push(invoice.invoiceId);
  }

  // Find groups with more than one invoice
  for (const [, invoiceIds] of hashMap) {
    if (invoiceIds.length > 1) {
      for (const id of invoiceIds) {
        if (!duplicates.has(id)) {
          duplicates.set(id, []);
        }
        duplicates.set(id, [...duplicates.get(id)!, ...invoiceIds.filter(i => i !== id)]);
      }
    }
  }

  return duplicates;
}