export interface UPILinkParams {
  vpa: string;
  name: string;
  /** Amount in paise */
  amount: number;
  txnRef: string;
  note?: string;
}

export interface UPILinks {
  phonePe: string;
  gpay: string;
  paytm: string;
  generic: string;
}

/**
 * Builds UPI intent URLs for the four major entry points.
 * Amount is converted from paise to rupees for the UPI spec (am= is in rupees).
 */
export function buildUPILinks(params: UPILinkParams): UPILinks {
  const { vpa, name, amount, txnRef, note } = params;

  const amountRupees = (amount / 100).toFixed(2);
  const encodedName = encodeURIComponent(name);
  const encodedNote = encodeURIComponent(note ?? `Payment to ${name}`);
  const encodedTxnRef = encodeURIComponent(txnRef);
  const encodedVpa = encodeURIComponent(vpa);

  const queryString =
    `pa=${encodedVpa}` +
    `&pn=${encodedName}` +
    `&am=${amountRupees}` +
    `&cu=INR` +
    `&tn=${encodedNote}` +
    `&tr=${encodedTxnRef}`;

  return {
    generic: `upi://pay?${queryString}`,
    phonePe: `phonepe://pay?${queryString}`,
    gpay: `tez://upi/pay?${queryString}`,
    paytm: `paytmmp://pay?${queryString}`,
  };
}

/**
 * Returns true when the user agent looks like a mobile device.
 * UPI intent URLs only work on Android/iOS; on desktop they are silently ignored
 * by browsers, so callers should use this to decide whether to surface UPI options.
 */
export function isUPIAvailable(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /android|iphone|ipad|ipod/i.test(navigator.userAgent);
}

/**
 * Attempts to open a UPI intent URL.  After `timeoutMs` milliseconds, if the
 * page is still visible (i.e. the OS did not hand off to a UPI app), the user is
 * redirected to `fallbackUrl` instead.
 *
 * @param url         UPI intent URL (e.g. phonepe://pay?...)
 * @param fallbackUrl URL to navigate to when no UPI app responds (e.g. Razorpay checkout)
 * @param timeoutMs   How long to wait before triggering the fallback (default 2000 ms)
 */
export function openUPIApp(
  url: string,
  fallbackUrl: string,
  timeoutMs = 15000, // NW-MED-014: Real UPI payments take 5–15s. Old 2s caused false timeouts.
): void {
  if (typeof window === 'undefined') return;

  window.location.href = url;

  const timer = setTimeout(() => {
    // If the document is still visible the OS didn't open a native app.
    if (!document.hidden) {
      window.location.href = fallbackUrl;
    }
  }, timeoutMs);

  // If the page becomes hidden the app launched — cancel the fallback.
  const handleVisibilityChange = () => {
    if (document.hidden) {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    }
  };
  document.addEventListener('visibilitychange', handleVisibilityChange);
}
