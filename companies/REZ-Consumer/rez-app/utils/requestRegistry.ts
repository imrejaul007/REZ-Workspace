/**
 * requestRegistry — OG-D005 FIX
 *
 * A lightweight in-process registry that lets payment hooks register their
 * AbortController instances so that the app-level AppState listener can abort
 * all in-flight payment requests when the app moves to the background.
 *
 * This closes the race where:
 *   1. User taps Pay
 *   2. App is backgrounded by the OS (incoming call, home button)
 *   3. OS kills the app a few seconds later
 *   4. The in-flight fetch has no AbortSignal from the caller side, so the
 *      JS engine never cancels it — the underlying TCP connection stays open
 *      in kernel space, and on some RN versions this prevents the JS bundle
 *      from being GC-ed, leaking the entire payment state.
 *
 * Usage:
 * ```ts
 * // In a payment hook:
 * const controller = new AbortController();
 * const id = requestRegistry.register(controller, 'checkout-wallet');
 * try {
 *   await fetch(url, { signal: controller.signal });
 * } finally {
 *   requestRegistry.unregister(id);
 * }
 *
 * // In useAppServices (AppState 'background' handler):
 * import { requestRegistry } from '@/utils/requestRegistry';
 * requestRegistry.abortAll('app-backgrounded');
 * ```
 */

import { logger } from '@/utils/logger';

interface RegistryEntry {
  controller: AbortController;
  label: string;
  registeredAt: number;
}

class RequestRegistry {
  private entries = new Map<string, RegistryEntry>();
  private counter = 0;

  /**
   * Register an AbortController.
   * @param controller AbortController to register.
   * @param label      Human-readable label (for debug logging).
   * @returns          Unique ID to pass to unregister().
   */
  register(controller: AbortController, label = 'request'): string {
    const id = `req-${++this.counter}-${Date.now()}`;
    this.entries.set(id, { controller, label, registeredAt: Date.now() });
    return id;
  }

  /**
   * Unregister a controller (call in finally blocks after fetch resolves).
   */
  unregister(id: string): void {
    this.entries.delete(id);
  }

  /**
   * Abort all registered in-flight requests.
   * @param reason Reason string forwarded to AbortController.abort().
   */
  abortAll(reason = 'app-backgrounded'): void {
    let count = 0;
    this.entries.forEach(({ controller, label }) => {
      if (!controller.signal.aborted) {
        controller.abort(reason);
        count++;
        if (__DEV__) {
          logger.info('[RequestRegistry] Aborted:', { label, reason });
        }
      }
    });
    this.entries.clear();
    if (__DEV__ && count > 0) {
      logger.info(`[RequestRegistry] Aborted ${count} in-flight request(s).`);
    }
  }

  /** Count of currently registered (potentially in-flight) controllers. */
  get size(): number {
    return this.entries.size;
  }
}

export const requestRegistry = new RequestRegistry();
