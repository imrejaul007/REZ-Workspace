/**
 * QR Intent Router — maps a parsed QrPayload to a consumer app route.
 *
 * Pure function: given a payload, returns a `{ pathname, params }`
 * object suitable for `router.push()`. The UnifiedQrScanner calls
 * this and does the navigation itself — keeping routing concerns out
 * of the parser and the parser concerns out of the navigator.
 *
 * Adding a new intent is a one-line change here + the corresponding
 * entry in qrPayload.ts.
 */

import type { QrPayload, ShortUrlIntent } from './qrPayload';

export interface RouteTarget {
  pathname: string;
  params?: Record<string, string>;
}

/**
 * Map a typed QR payload to an in-app route target. Paths match the
 * existing expo-router file layout.
 */
export function routeFromPayload(
  payload: QrPayload | ShortUrlIntent,
): RouteTarget | null {
  switch (payload.intent) {
    case 'store-visit':
      return {
        pathname: '/qr-checkin',
        params: {
          storeId: payload.storeId,
          ...(payload.storeSlug ? { storeSlug: payload.storeSlug } : {}),
        },
      };

    case 'pay-bill':
      return {
        pathname: '/pay-in-store',
        params: {
          storeId: payload.storeId,
          ...(payload.billId ? { billId: payload.billId } : {}),
          ...(payload.amount != null ? { amount: String(payload.amount) } : {}),
        },
      };

    case 'redeem-deal':
      return {
        pathname: '/my-vouchers',
        params: {
          dealId: payload.dealId,
          ...(payload.storeId ? { storeId: payload.storeId } : {}),
        },
      };

    case 'redeem-voucher':
      return {
        pathname: '/my-vouchers',
        params: { voucherId: payload.voucherId },
      };

    case 'claim-stamp':
      // Stamp-card claim uses the same check-in flow the merchant's POS
      // wires into; the storeId+stampCardId tuple drives that screen's
      // effect.
      return {
        pathname: '/qr-checkin',
        params: {
          storeId: payload.storeId,
          stampCardId: payload.stampCardId,
        },
      };

    case 'event-checkin':
      return {
        pathname: '/karma/scan',
        params: { eventId: payload.eventId },
      };

    case 'referral':
      return {
        pathname: '/referral',
        params: { code: payload.referralCode },
      };

    case 'wallet-transfer':
      return {
        pathname: '/wallet/transfer',
        params: {
          toUserId: payload.toUserId,
          ...(payload.amount != null ? { amount: String(payload.amount) } : {}),
        },
      };

    // Phase II route mappings
    case 'room-hub':
      return {
        pathname: '/room-service/[hotelId]/[roomId]',
        params: {
          hotelId: payload.hotelId,
          roomId: payload.roomId,
          token: payload.token,
          ...(payload.checkIn ? { checkIn: payload.checkIn } : {}),
          ...(payload.checkOut ? { checkOut: payload.checkOut } : {}),
        },
      };

    case 'menu-qr':
      return {
        pathname: '/store/[storeSlug]/menu',
        params: {
          storeSlug: payload.storeSlug,
          ...(payload.tableNumber ? { tableNumber: payload.tableNumber } : {}),
        },
      };

    case 'rez-now':
      return {
        pathname: '/store/[storeSlug]',
        params: {
          storeSlug: payload.storeSlug,
          ...(payload.page ? { page: payload.page } : {}),
        },
      };

    case 'ad-campaign':
      return {
        pathname: '/campaign/[campaignId]',
        params: {
          campaignId: payload.campaignId,
          rewardType: payload.rewardType,
          ...(payload.adId ? { adId: payload.adId } : {}),
          ...(payload.merchantId ? { merchantId: payload.merchantId } : {}),
        },
      };

    case 'product-verify':
      return {
        pathname: '/verify/[brandSlug]/[productId]',
        params: {
          brandSlug: payload.brandSlug,
          productId: payload.productId,
          serialNumber: payload.serialNumber,
          brandId: payload.brandId,
        },
      };

    // REZ Go - Scan & Go
    case 'go-session':
      return {
        pathname: '/go/store/[storeId]',
        params: {
          storeId: payload.storeId,
          action: payload.action,
          ...(payload.sessionId ? { sessionId: payload.sessionId } : {}),
          ...(payload.storeName ? { storeName: payload.storeName } : {}),
        },
      };

    case 'go-product':
      return {
        pathname: '/go/scan',
        params: {
          storeId: payload.storeId,
          sessionId: payload.sessionId,
          productId: payload.productId,
          barcode: payload.barcode,
        },
      };

    case 'go-recovery':
      return {
        pathname: '/go/recovery',
        params: {
          transferId: payload.transferId,
          ...(payload.sessionId ? { sessionId: payload.sessionId } : {}),
          ...(payload.storeId ? { storeId: payload.storeId } : {}),
        },
      };

    case 'safe-qr':
      return {
        pathname: '/safe-qr/[id]',
        params: {
          id: payload.id,
          shortcode: payload.shortcode,
          ...(payload.mode ? { mode: payload.mode } : {}),
        },
      };

    case 'rez-go':
      return {
        pathname: '/go/store/[storeId]',
        params: {
          storeId: payload.storeId,
          action: payload.action,
          ...(payload.sessionId ? { sessionId: payload.sessionId } : {}),
          ...(payload.storeName ? { storeName: payload.storeName } : {}),
        },
      };

    case 'short-url':
      // Caller fetches the inflated payload via the backend, then calls
      // routeFromPayload again. Returning null here signals "route on the
      // resolved payload, not on this marker".
      return null;
  }
}
