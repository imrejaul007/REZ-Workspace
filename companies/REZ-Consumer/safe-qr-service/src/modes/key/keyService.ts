import { SafeQR } from '../../shared/models';
import { generateShortcodeSuffix, generateQRId } from '../../shared/services/qrParser';
import { SafeQRMode } from '../../shared/schemas/safeQR';

/**
 * Key Mode Service
 */

export interface CreateKeyQRInput {
 ownerId: string;
 profile: {
   description: string;
   location?: string;
   keyType?: 'home' | 'office' | 'locker' | 'vehicle' | 'other';
   recoveryQuestion?: string;
   recoveryAnswer?: string;
 };
}

export interface UpdateKeyProfileInput {
 description?: string;
 location?: string;
 keyType?: string;
 recoveryQuestion?: string;
 recoveryAnswer?: string;
}

/**
 * Create a new Key Safe QR
 */
export async function createKeyQR(input: CreateKeyQRInput): Promise<SafeQR> {
 const shortcode = `REZK${generateShortcodeSuffix()}`;
 const qrId = generateQRId('key' as SafeQRMode);

 const qr = new SafeQR({
   shortcode, qrId, mode: 'key', ownerId: input.ownerId, status: 'active',
   profile: { mode: 'key', ...input.profile },
   settings: { allowMessages: true, allowContactRequests: true, notifyOnScan: true, requireApproval: true },
   qrPayload: { v: 1, type: 'safe', mode: 'key', id: qrId, shortcode },
   stats: { totalScans: 0, uniqueScanners: 0, totalMessages: 0 },
   karma: { isRegistered: true },
 });

 await qr.save();
 return qr;
}

export async function getPublicKeyProfile(shortcode: string): Promise<unknown | null> {
 const qr = await SafeQR.findByShortcode(shortcode);
 if (!qr || qr.mode !== 'key') return null;
 const p = qr.profile as unknown;
 return { shortcode: qr.shortcode, mode: qr.mode, description: p.description, keyType: p.keyType };
}

export async function getFullKeyProfile(shortcode: string, ownerId: string): Promise<unknown | null> {
 const qr = await SafeQR.findByShortcode(shortcode);
 if (!qr || qr.mode !== 'key' || qr.ownerId !== ownerId) return null;
 return { ...qr.profile, shortcode: qr.shortcode, qrId: qr.qrId };
}

export async function updateKeyProfile(shortcode: string, ownerId: string, updates: UpdateKeyProfileInput): Promise<SafeQR | null> {
 const qr = await SafeQR.findByShortcode(shortcode);
 if (!qr || qr.mode !== 'key' || qr.ownerId !== ownerId) return null;
 qr.profile = { ...qr.profile, ...updates };
 qr.updatedAt = new Date();
 await qr.save();
 return qr;
}

export async function verifyKeyRecovery(shortcode: string, answer: string): Promise<{ verified: boolean }> {
 const qr = await SafeQR.findByShortcode(shortcode);
 if (!qr || qr.mode !== 'key') return { verified: false };
 const p = qr.profile as unknown;
 if (!p.recoveryAnswer) return { verified: true };
 return { verified: p.recoveryAnswer.toLowerCase() === answer.toLowerCase() };
}
