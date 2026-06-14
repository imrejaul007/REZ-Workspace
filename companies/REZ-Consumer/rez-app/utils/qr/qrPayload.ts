/**
 * QR Payload parser (consumer-side mirror of the backend schema).
 *
 * This file mirrors the canonical @rez/qr-types package.
 * For full type definitions, see: shared/qr-types/src/index.ts
 *
 * This implementation is for consumer apps that cannot import Zod.
 * Production code should use @rez/qr-types directly.
 */

export type QrIntentKind =
  | 'store-visit'
  | 'pay-bill'
  | 'redeem-deal'
  | 'redeem-voucher'
  | 'claim-stamp'
  | 'event-checkin'
  | 'referral'
  | 'wallet-transfer'
  | 'room-hub'
  | 'menu-qr'
  | 'rez-now'
  | 'ad-campaign'      // Unified: renamed from 'ads-qr' for consistency
  | 'product-verify'
  | 'go-session'
  | 'go-product'
  | 'go-recovery'      // Added: REZ Go checkout recovery
  | 'safe-qr'         // Added: Safe QR (REZP, REZN, etc.)
  | 'rez-go';          // Added: REZ Go (session/product/recovery)

export interface StoreVisitPayload {
  intent: 'store-visit';
  v: 1;
  storeId: string;
  storeSlug?: string;
}

export interface PayBillPayload {
  intent: 'pay-bill';
  v: 1;
  storeId: string;
  billId?: string;
  amount?: number;
}

export interface RedeemDealPayload {
  intent: 'redeem-deal';
  v: 1;
  dealId: string;
  storeId?: string;
}

export interface RedeemVoucherPayload {
  intent: 'redeem-voucher';
  v: 1;
  voucherId: string;
}

export interface ClaimStampPayload {
  intent: 'claim-stamp';
  v: 1;
  stampCardId: string;
  storeId: string;
}

export interface EventCheckinPayload {
  intent: 'event-checkin';
  v: 1;
  eventId: string;
}

export interface ReferralPayload {
  intent: 'referral';
  v: 1;
  referralCode: string;
}

export interface WalletTransferPayload {
  intent: 'wallet-transfer';
  v: 1;
  toUserId: string;
  amount?: number;
}

// ─── Phase II: New QR Intent Payloads ──────────────────────────────────────────

/** Room Hub QR Intent — for hotel room service */
export interface RoomHubPayload {
  intent: 'room-hub';
  v: 1;
  hotelId: string;
  roomId: string;
  token: string;
  checkIn?: string;
  checkOut?: string;
}

/** Menu QR Intent — for restaurant/store menu scanning */
export interface MenuQrPayload {
  intent: 'menu-qr';
  v: 1;
  storeId: string;
  storeSlug: string;
  tableNumber?: string;
}

/** Rez Now Intent — Universal restaurant/venue QR */
export interface RezNowPayload {
  intent: 'rez-now';
  v: 1;
  storeId: string;
  storeSlug: string;
  page?: 'menu' | 'order' | 'services' | 'about';
}

/** Ad Campaign Intent — for promotional/advertising QR codes */
export interface AdCampaignPayload {
  intent: 'ad-campaign';
  v: 1;
  campaignId: string;
  adId?: string;
  merchantId?: string;
  rewardType: 'coins' | 'discount' | 'sample' | 'consultation' | 'contest';
}

/** Product Verify Intent — for ReZ Verify product authenticity QR codes */
export interface ProductVerifyPayload {
  intent: 'product-verify';
  v: 1;
  brandId: string;
  brandSlug: string;
  productId: string;
  serialNumber: string;
}

/** REZ Go Session Intent — for Scan & Go store entry */
export interface GoSessionPayload {
  intent: 'go-session';
  v: 1;
  storeId: string;
  action: 'start' | 'resume';
  sessionId?: string;
  storeName?: string;
}

/** REZ Go Product Intent — for individual product QR codes */
export interface GoProductPayload {
  intent: 'go-product';
  v: 1;
  storeId: string;
  sessionId: string;
  productId: string;
  barcode: string;
}

/** REZ Go Recovery Intent — for checkout recovery QR codes */
export interface GoRecoveryPayload {
  intent: 'go-recovery';
  v: 1;
  transferId: string;
  sessionId?: string;
  storeId?: string;
}

/** Safe QR Intent — for personal/safe QR codes (REZP, REZN, etc.) */
export interface SafeQrPayload {
  intent: 'safe-qr';
  v: 1;
  type: 'safe';
  mode?: 'event' | 'pet' | 'personal' | 'business' | 'contact';
  id: string;
  shortcode: string;
}

/** REZ Go Intent — unified type for all REZ Go operations */
export interface RezGoPayload {
  intent: 'rez-go';
  v: 1;
  storeId: string;
  action: 'start' | 'resume';
  sessionId?: string;
  storeName?: string;
}

export type QrPayload =
  | StoreVisitPayload
  | PayBillPayload
  | RedeemDealPayload
  | RedeemVoucherPayload
  | ClaimStampPayload
  | EventCheckinPayload
  | ReferralPayload
  | WalletTransferPayload
  | RoomHubPayload
  | MenuQrPayload
  | RezNowPayload
  | AdCampaignPayload
  | ProductVerifyPayload
  | GoSessionPayload
  | GoProductPayload
  | GoRecoveryPayload    // Added
  | SafeQrPayload       // Added
  | RezGoPayload;       // Added

export interface ShortUrlIntent {
  intent: 'short-url';
  token: string;
}

export type ParseResult =
  | { ok: true; payload: QrPayload }
  | { ok: true; payload: ShortUrlIntent }
  | { ok: false; reason: 'empty' }
  | { ok: false; reason: 'not-json' }
  | { ok: false; reason: 'invalid-schema'; issues: string[] }
  | { ok: false; reason: 'unsupported-version'; version: unknown };

// Canonical SHORT_URL_HOSTS from @rez/qr-types
// Updated to include all known hosts for consistency
export const SHORT_URL_HOSTS: readonly string[] = [
  'rez.money',
  'www.rez.money',
  'rez.link',
  'now.rez.money',
  'www.now.rez.money',
  'reznow.app',
  'www.reznow.app',
  'menu.rez.money',
  'admin.rez.money',
];
export const SHORT_URL_PATH_PREFIX = '/q/';

// ─── String helpers ─────────────────────────────────────────────────────────

function isNonEmptyString(x: unknown): x is string {
  return typeof x === 'string' && x.trim().length > 0;
}

function isNonNegativeNumber(x: unknown): x is number {
  return typeof x === 'number' && Number.isFinite(x) && x >= 0;
}

// ─── Per-intent validators ──────────────────────────────────────────────────

function validateStoreVisit(obj: Record<string, unknown>, issues: string[]): StoreVisitPayload | null {
  if (!isNonEmptyString(obj.storeId)) {
    issues.push('storeId: required non-empty string');
    return null;
  }
  if (obj.storeSlug != null && !isNonEmptyString(obj.storeSlug)) {
    issues.push('storeSlug: must be a non-empty string if provided');
    return null;
  }
  return {
    intent: 'store-visit',
    v: 1,
    storeId: obj.storeId,
    storeSlug: isNonEmptyString(obj.storeSlug) ? obj.storeSlug : undefined,
  };
}

function validatePayBill(obj: Record<string, unknown>, issues: string[]): PayBillPayload | null {
  if (!isNonEmptyString(obj.storeId)) {
    issues.push('storeId: required non-empty string');
    return null;
  }
  if (obj.billId != null && !isNonEmptyString(obj.billId)) {
    issues.push('billId: must be a non-empty string if provided');
    return null;
  }
  if (obj.amount != null && !isNonNegativeNumber(obj.amount)) {
    issues.push('amount: must be a non-negative finite number if provided');
    return null;
  }
  return {
    intent: 'pay-bill',
    v: 1,
    storeId: obj.storeId,
    billId: isNonEmptyString(obj.billId) ? obj.billId : undefined,
    amount: isNonNegativeNumber(obj.amount) ? obj.amount : undefined,
  };
}

function validateRedeemDeal(obj: Record<string, unknown>, issues: string[]): RedeemDealPayload | null {
  if (!isNonEmptyString(obj.dealId)) {
    issues.push('dealId: required non-empty string');
    return null;
  }
  if (obj.storeId != null && !isNonEmptyString(obj.storeId)) {
    issues.push('storeId: must be a non-empty string if provided');
    return null;
  }
  return {
    intent: 'redeem-deal',
    v: 1,
    dealId: obj.dealId,
    storeId: isNonEmptyString(obj.storeId) ? obj.storeId : undefined,
  };
}

function validateRedeemVoucher(obj: Record<string, unknown>, issues: string[]): RedeemVoucherPayload | null {
  if (!isNonEmptyString(obj.voucherId)) {
    issues.push('voucherId: required non-empty string');
    return null;
  }
  return { intent: 'redeem-voucher', v: 1, voucherId: obj.voucherId };
}

function validateClaimStamp(obj: Record<string, unknown>, issues: string[]): ClaimStampPayload | null {
  if (!isNonEmptyString(obj.stampCardId)) {
    issues.push('stampCardId: required non-empty string');
    return null;
  }
  if (!isNonEmptyString(obj.storeId)) {
    issues.push('storeId: required non-empty string');
    return null;
  }
  return { intent: 'claim-stamp', v: 1, stampCardId: obj.stampCardId, storeId: obj.storeId };
}

function validateEventCheckin(obj: Record<string, unknown>, issues: string[]): EventCheckinPayload | null {
  if (!isNonEmptyString(obj.eventId)) {
    issues.push('eventId: required non-empty string');
    return null;
  }
  return { intent: 'event-checkin', v: 1, eventId: obj.eventId };
}

function validateReferral(obj: Record<string, unknown>, issues: string[]): ReferralPayload | null {
  if (!isNonEmptyString(obj.referralCode)) {
    issues.push('referralCode: required non-empty string');
    return null;
  }
  return { intent: 'referral', v: 1, referralCode: obj.referralCode };
}

function validateWalletTransfer(obj: Record<string, unknown>, issues: string[]): WalletTransferPayload | null {
  if (!isNonEmptyString(obj.toUserId)) {
    issues.push('toUserId: required non-empty string');
    return null;
  }
  if (obj.amount != null && !isNonNegativeNumber(obj.amount)) {
    issues.push('amount: must be a non-negative finite number if provided');
    return null;
  }
  return {
    intent: 'wallet-transfer',
    v: 1,
    toUserId: obj.toUserId,
    amount: isNonNegativeNumber(obj.amount) ? obj.amount : undefined,
  };
}

// ─── Phase II Validators ───────────────────────────────────────────────────────

function validateRoomHub(obj: Record<string, unknown>, issues: string[]): RoomHubPayload | null {
  if (!isNonEmptyString(obj.hotelId)) {
    issues.push('hotelId: required non-empty string');
    return null;
  }
  if (!isNonEmptyString(obj.roomId)) {
    issues.push('roomId: required non-empty string');
    return null;
  }
  if (!isNonEmptyString(obj.token)) {
    issues.push('token: required non-empty string');
    return null;
  }
  if (obj.checkIn != null && !isNonEmptyString(obj.checkIn)) {
    issues.push('checkIn: must be a non-empty string if provided');
    return null;
  }
  if (obj.checkOut != null && !isNonEmptyString(obj.checkOut)) {
    issues.push('checkOut: must be a non-empty string if provided');
    return null;
  }
  return {
    intent: 'room-hub',
    v: 1,
    hotelId: obj.hotelId,
    roomId: obj.roomId,
    token: obj.token,
    checkIn: isNonEmptyString(obj.checkIn) ? obj.checkIn : undefined,
    checkOut: isNonEmptyString(obj.checkOut) ? obj.checkOut : undefined,
  };
}

function validateMenuQr(obj: Record<string, unknown>, issues: string[]): MenuQrPayload | null {
  if (!isNonEmptyString(obj.storeId)) {
    issues.push('storeId: required non-empty string');
    return null;
  }
  if (!isNonEmptyString(obj.storeSlug)) {
    issues.push('storeSlug: required non-empty string');
    return null;
  }
  if (obj.tableNumber != null && !isNonEmptyString(obj.tableNumber)) {
    issues.push('tableNumber: must be a non-empty string if provided');
    return null;
  }
  return {
    intent: 'menu-qr',
    v: 1,
    storeId: obj.storeId,
    storeSlug: obj.storeSlug,
    tableNumber: isNonEmptyString(obj.tableNumber) ? obj.tableNumber : undefined,
  };
}

function validateRezNow(obj: Record<string, unknown>, issues: string[]): RezNowPayload | null {
  if (!isNonEmptyString(obj.storeId)) {
    issues.push('storeId: required non-empty string');
    return null;
  }
  if (!isNonEmptyString(obj.storeSlug)) {
    issues.push('storeSlug: required non-empty string');
    return null;
  }
  const validPages = ['menu', 'order', 'services', 'about'];
  if (obj.page != null) {
    if (typeof obj.page !== 'string' || !validPages.includes(obj.page)) {
      issues.push(`page: must be one of ${validPages.join(', ')}`);
      return null;
    }
  }
  return {
    intent: 'rez-now',
    v: 1,
    storeId: obj.storeId,
    storeSlug: obj.storeSlug,
    page: validPages.includes(obj.page as string) ? (obj.page as 'menu' | 'order' | 'services' | 'about') : undefined,
  };
}

const VALID_REWARD_TYPES = ['coins', 'discount', 'sample', 'consultation', 'contest'] as const;

function validateAdCampaign(obj: Record<string, unknown>, issues: string[]): AdCampaignPayload | null {
  if (!isNonEmptyString(obj.campaignId)) {
    issues.push('campaignId: required non-empty string');
    return null;
  }
  if (!VALID_REWARD_TYPES.includes(obj.rewardType as typeof VALID_REWARD_TYPES[number])) {
    issues.push(`rewardType: required; must be one of ${VALID_REWARD_TYPES.join(', ')}`);
    return null;
  }
  if (obj.adId != null && !isNonEmptyString(obj.adId)) {
    issues.push('adId: must be a non-empty string if provided');
    return null;
  }
  if (obj.merchantId != null && !isNonEmptyString(obj.merchantId)) {
    issues.push('merchantId: must be a non-empty string if provided');
    return null;
  }
  return {
    intent: 'ad-campaign',
    v: 1,
    campaignId: obj.campaignId,
    adId: isNonEmptyString(obj.adId) ? obj.adId : undefined,
    merchantId: isNonEmptyString(obj.merchantId) ? obj.merchantId : undefined,
    rewardType: obj.rewardType as 'coins' | 'discount' | 'sample' | 'consultation' | 'contest',
  };
}

function validateProductVerify(obj: Record<string, unknown>, issues: string[]): ProductVerifyPayload | null {
  if (!isNonEmptyString(obj.brandId)) {
    issues.push('brandId: required non-empty string');
    return null;
  }
  if (!isNonEmptyString(obj.brandSlug)) {
    issues.push('brandSlug: required non-empty string');
    return null;
  }
  if (!isNonEmptyString(obj.productId)) {
    issues.push('productId: required non-empty string');
    return null;
  }
  if (!isNonEmptyString(obj.serialNumber)) {
    issues.push('serialNumber: required non-empty string');
    return null;
  }
  return {
    intent: 'product-verify',
    v: 1,
    brandId: obj.brandId,
    brandSlug: obj.brandSlug,
    productId: obj.productId,
    serialNumber: obj.serialNumber,
  };
}

function validateGoSession(obj: Record<string, unknown>, issues: string[]): GoSessionPayload | null {
  if (!isNonEmptyString(obj.storeId)) {
    issues.push('storeId: required non-empty string');
    return null;
  }
  const validActions = ['start', 'resume'];
  if (!validActions.includes(obj.action as string)) {
    issues.push(`action: must be one of ${validActions.join(', ')}`);
    return null;
  }
  if (obj.sessionId != null && !isNonEmptyString(obj.sessionId)) {
    issues.push('sessionId: must be a non-empty string if provided');
    return null;
  }
  return {
    intent: 'go-session',
    v: 1,
    storeId: obj.storeId,
    action: obj.action as 'start' | 'resume',
    sessionId: isNonEmptyString(obj.sessionId) ? obj.sessionId : undefined,
    storeName: isNonEmptyString(obj.storeName) ? obj.storeName : undefined,
  };
}

function validateGoProduct(obj: Record<string, unknown>, issues: string[]): GoProductPayload | null {
  if (!isNonEmptyString(obj.storeId)) {
    issues.push('storeId: required non-empty string');
    return null;
  }
  if (!isNonEmptyString(obj.sessionId)) {
    issues.push('sessionId: required non-empty string');
    return null;
  }
  if (!isNonEmptyString(obj.productId)) {
    issues.push('productId: required non-empty string');
    return null;
  }
  if (!isNonEmptyString(obj.barcode)) {
    issues.push('barcode: required non-empty string');
    return null;
  }
  return {
    intent: 'go-product',
    v: 1,
    storeId: obj.storeId,
    sessionId: obj.sessionId,
    productId: obj.productId,
    barcode: obj.barcode,
  };
}

function validateGoRecovery(obj: Record<string, unknown>, issues: string[]): GoRecoveryPayload | null {
  if (!isNonEmptyString(obj.transferId)) {
    issues.push('transferId: required non-empty string');
    return null;
  }
  if (obj.sessionId != null && !isNonEmptyString(obj.sessionId)) {
    issues.push('sessionId: must be a non-empty string if provided');
    return null;
  }
  if (obj.storeId != null && !isNonEmptyString(obj.storeId)) {
    issues.push('storeId: must be a non-empty string if provided');
    return null;
  }
  return {
    intent: 'go-recovery',
    v: 1,
    transferId: obj.transferId,
    sessionId: isNonEmptyString(obj.sessionId) ? obj.sessionId : undefined,
    storeId: isNonEmptyString(obj.storeId) ? obj.storeId : undefined,
  };
}

function validateSafeQr(obj: Record<string, unknown>, issues: string[]): SafeQrPayload | null {
  if (!isNonEmptyString(obj.id)) {
    issues.push('id: required non-empty string');
    return null;
  }
  if (!isNonEmptyString(obj.shortcode)) {
    issues.push('shortcode: required non-empty string');
    return null;
  }
  const validModes = ['event', 'pet', 'personal', 'business', 'contact'];
  if (obj.mode != null && !validModes.includes(obj.mode as string)) {
    issues.push(`mode: must be one of ${validModes.join(', ')}`);
    return null;
  }
  return {
    intent: 'safe-qr',
    v: 1,
    type: 'safe',
    id: obj.id,
    shortcode: obj.shortcode,
    mode: validModes.includes(obj.mode as string) ? (obj.mode as 'event' | 'pet' | 'personal' | 'business' | 'contact') : undefined,
  };
}

function validateRezGo(obj: Record<string, unknown>, issues: string[]): RezGoPayload | null {
  if (!isNonEmptyString(obj.storeId)) {
    issues.push('storeId: required non-empty string');
    return null;
  }
  const validActions = ['start', 'resume'];
  if (!validActions.includes(obj.action as string)) {
    issues.push(`action: must be one of ${validActions.join(', ')}`);
    return null;
  }
  if (obj.sessionId != null && !isNonEmptyString(obj.sessionId)) {
    issues.push('sessionId: must be a non-empty string if provided');
    return null;
  }
  return {
    intent: 'rez-go',
    v: 1,
    storeId: obj.storeId,
    action: obj.action as 'start' | 'resume',
    sessionId: isNonEmptyString(obj.sessionId) ? obj.sessionId : undefined,
    storeName: isNonEmptyString(obj.storeName) ? obj.storeName : undefined,
  };
}

// ─── Short URL handling ─────────────────────────────────────────────────────

function tryParseShortUrl(raw: string): ShortUrlIntent | null {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (!SHORT_URL_HOSTS.includes(url.hostname.toLowerCase())) return null;
    if (!url.pathname.startsWith(SHORT_URL_PATH_PREFIX)) return null;
    const token = url.pathname.slice(SHORT_URL_PATH_PREFIX.length).replace(/\/$/, '');
    if (!token) return null;
    return { intent: 'short-url', token };
  } catch {
    return null;
  }
}

// ─── Parser ─────────────────────────────────────────────────────────────────

export function parseQrPayload(raw: string | null | undefined): ParseResult {
  if (!raw || typeof raw !== 'string') return { ok: false, reason: 'empty' };
  const trimmed = raw.trim();
  if (trimmed.length === 0) return { ok: false, reason: 'empty' };

  const short = tryParseShortUrl(trimmed);
  if (short) return { ok: true, payload: short };

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return { ok: false, reason: 'not-json' };
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, reason: 'invalid-schema', issues: ['root: must be an object'] };
  }

  const obj = parsed as Record<string, unknown>;

  // Version check first.
  if (!('v' in obj)) {
    return { ok: false, reason: 'invalid-schema', issues: ['v: required; must be 1'] };
  }
  if (obj.v === 0 || typeof obj.v !== 'number') {
    return { ok: false, reason: 'invalid-schema', issues: ['v: must be 1'] };
  }
  if (obj.v !== 1) {
    return { ok: false, reason: 'unsupported-version', version: obj.v };
  }

  const intent = obj.intent;
  if (!isNonEmptyString(intent)) {
    return { ok: false, reason: 'invalid-schema', issues: ['intent: required non-empty string'] };
  }

  const issues: string[] = [];
  let payload: QrPayload | null = null;
  switch (intent) {
    case 'store-visit':
      payload = validateStoreVisit(obj, issues);
      break;
    case 'pay-bill':
      payload = validatePayBill(obj, issues);
      break;
    case 'redeem-deal':
      payload = validateRedeemDeal(obj, issues);
      break;
    case 'redeem-voucher':
      payload = validateRedeemVoucher(obj, issues);
      break;
    case 'claim-stamp':
      payload = validateClaimStamp(obj, issues);
      break;
    case 'event-checkin':
      payload = validateEventCheckin(obj, issues);
      break;
    case 'referral':
      payload = validateReferral(obj, issues);
      break;
    case 'wallet-transfer':
      payload = validateWalletTransfer(obj, issues);
      break;
    // Phase II intents
    case 'room-hub':
      payload = validateRoomHub(obj, issues);
      break;
    case 'menu-qr':
      payload = validateMenuQr(obj, issues);
      break;
    case 'rez-now':
      payload = validateRezNow(obj, issues);
      break;
    case 'ad-campaign':
      payload = validateAdCampaign(obj, issues);
      break;
    case 'product-verify':
      payload = validateProductVerify(obj, issues);
      break;
    // REZ Go intents
    case 'go-session':
      payload = validateGoSession(obj, issues);
      break;
    case 'go-product':
      payload = validateGoProduct(obj, issues);
      break;
    case 'go-recovery':
      payload = validateGoRecovery(obj, issues);
      break;
    case 'safe-qr':
      payload = validateSafeQr(obj, issues);
      break;
    case 'rez-go':
      payload = validateRezGo(obj, issues);
      break;
    default:
      return { ok: false, reason: 'invalid-schema', issues: [`intent: unknown value "${intent}"`] };
  }

  if (!payload) return { ok: false, reason: 'invalid-schema', issues };
  return { ok: true, payload };
}
