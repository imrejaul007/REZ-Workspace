/**
 * DEPRECATED — superseded by ./worker (startPaymentWorker).
 *
 * Sprint-1 pre-req C (DEPLOY_COORDINATION.md §Pre-req C): this file used
 * to register a second BullMQ worker on the `wallet-credit` queue, running
 * in parallel with the canonical worker in ./worker. Both were configured
 * with concurrency=1 for financial race-safety (BAK-CROSS-021), but running
 * two concurrency=1 workers on one queue effectively doubles it — a silent
 * regression.
 *
 * The canonical ./worker#startPaymentWorker additionally performs the
 * INC-4 `emitCoinsAwarded` Socket.IO emit (this worker never did), so there
 * was no functional reason to keep two.
 *
 * This module is now a stub. The file is kept only so unknown stale external
 * import doesn't hard-fail; it should be deleted in the next cleanup pass
 * once the branch lands on main and all deploy environments have caught up.
 *
 * Do NOT restore the worker registration here. Enqueueing still targets
 * the `wallet-credit` queue via rez-payment-service's own producer code —
 * that queue is consumed by ./worker. There is no second consumer needed.
 */

import { createServiceLogger } from '../config/logger';

const logger = createServiceLogger('walletCreditWorker');

/**
 * No-op. Retained for ABI compatibility only — see module-level comment.
 * @deprecated Use startPaymentWorker from ./worker.
 */
export function startWalletCreditWorker(): void {
  logger.warn(
    '[walletCreditWorker] DEPRECATED stub invoked — startWalletCreditWorker is a no-op. ' +
      'The canonical wallet-credit consumer is startPaymentWorker in ./worker. ' +
      'See DEPLOY_COORDINATION.md §Pre-req C.',
  );
}

/**
 * No-op. Retained for ABI compatibility only — see module-level comment.
 * @deprecated Use stopPaymentWorker from ./worker.
 */
export async function stopWalletCreditWorker(): Promise<void> {
  // Nothing to stop — no worker was ever started here.
}
