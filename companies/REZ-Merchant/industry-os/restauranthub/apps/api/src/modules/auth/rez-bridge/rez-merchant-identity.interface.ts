/**
 * RezMerchantIdentity — the canonical shape for a REZ merchant
 * that has authenticated into RestoPapa via the auth bridge.
 *
 * IMPORTANT: Agent A3 imports this interface directly from this file.
 * Do NOT rename or move the export without coordinating with A3.
 */
export interface RezMerchantIdentity {
  /** REZ user UUID — from the REZ JWT payload `userId` field */
  rezUserId: string;

  /** REZ merchant profile ID — from the REZ merchant profile API response */
  rezMerchantId: string;

  /** REZ store ID — present when merchant is scoped to a single store */
  rezStoreId?: string;

  /** Merchant's email address from REZ profile */
  email: string;

  /** Merchant's display name from REZ profile */
  name: string;

  /** Role as declared in the REZ JWT. Only merchant roles are accepted. */
  role: 'merchant' | 'merchant_admin';

  /** The RestoPapa user UUID created or matched during upsert */
  restopapaUserId: string;

  /**
   * True once the REZ JWT signature has been verified and the profile
   * has been fetched from the REZ backend. Always true on this response
   * object — a false would indicate an incomplete bridge flow.
   */
  rezVerified: boolean;
}
