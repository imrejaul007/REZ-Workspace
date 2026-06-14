/**
 * lib/api/bill.ts — DEPRECATED
 *
 * NW-MED-040: getBillDetails has been consolidated into lib/api/merchantBill.ts.
 * That file returns the more complete BillDetails type.
 *
 * This file re-exports for backwards compatibility. Migrate callers to
 * import { getBillDetails } from '@/lib/api/merchantBill' and update types accordingly.
 */
export { getBillDetails } from './merchantBill';
