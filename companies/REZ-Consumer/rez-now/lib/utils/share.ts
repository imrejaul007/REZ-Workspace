import { formatINR } from './currency';

const BASE_URL = 'https://reznow.in';

/** Open WhatsApp with pre-filled text. Uses the universal wa.me link which works on both mobile and desktop. */
export function shareViaWhatsApp(text: string): void {
  const encoded = encodeURIComponent(text);
  window.open(`https://wa.me/?text=${encoded}`, '_blank', 'noopener,noreferrer');
}

/**
 * Share content using the Web Share API when available, with a WhatsApp + clipboard fallback.
 * Returns a promise that resolves once sharing is initiated or the clipboard write completes.
 */
export async function shareContent(options: {
  title: string;
  text: string;
  url: string;
}): Promise<void> {
  const { title, text, url } = options;

  // Prefer the native Web Share API (Android Chrome, Safari iOS/macOS)
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, text, url });
      return;
    } catch (err) {
      // User cancelled (AbortError) or share failed — fall through to clipboard
      if (err instanceof Error && err.name === 'AbortError') return;
    }
  }

  // Fallback: copy URL to clipboard
  try {
    await navigator.clipboard.writeText(url);
    // Caller is responsible for showing the toast after this resolves
  } catch {
    // Clipboard API also unavailable; last resort — open WhatsApp
    shareViaWhatsApp(`${text}\n${url}`);
  }
}

/** Build the canonical store URL, optionally appending a referral code as a query param. */
function buildStoreUrl(storeSlug: string, referralCode?: string): string {
  const url = `${BASE_URL}/${storeSlug}`;
  return referralCode ? `${url}?ref=${referralCode}` : url;
}

/**
 * Build the WhatsApp share message for a store.
 * If a referral code is provided it is included with a "bonus coins" call to action.
 */
export function buildStoreShareMessage(
  storeName: string,
  storeSlug: string,
  referralCode?: string,
): string {
  const url = buildStoreUrl(storeSlug, referralCode);
  const base = `Check out ${storeName} on REZ Now! Order online and earn REZ coins 🪙\n${url}`;
  if (referralCode) {
    return `${base}\nUse code ${referralCode} for bonus coins on your first order!`;
  }
  return base;
}

/**
 * Build the WhatsApp share message for a completed order.
 * Amount is expected in paise (same convention as the rest of the codebase).
 */
export function buildOrderShareMessage(
  storeName: string,
  orderNumber: string,
  amount: number,
): string {
  return `I just ordered from ${storeName} on REZ Now! Order #${orderNumber} for ${formatINR(amount)} 🍽️`;
}
