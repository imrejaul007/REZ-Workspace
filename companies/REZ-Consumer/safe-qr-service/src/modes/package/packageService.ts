import { SafeQR } from '../../shared/models';
import { generateShortcodeSuffix, generateQRId } from '../../shared/services/qrParser';
import { SafeQRMode } from '../../shared/schemas/safeQR';

/**
 * Package Mode Service
 */

export interface CreatePackageQRInput {
 ownerId: string;
 profile: {
   trackingId?: string;
   senderName?: string;
   senderPhone?: string;
   receiverName?: string;
   receiverPhone?: string;
   packageType?: 'document' | 'parcel' | 'fragile' | 'perishable' | 'other';
   weight?: string;
   dimensions?: string;
   description?: string;
   status?: 'pending' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'failed' | 'returned';
   deliveryAttempt?: {
     attemptedAt: string;
     reason: string;
     photo?: string;
   };
   preferences?: {
     safeDropLocation?: string;
     leaveWithNeighbour?: string;
     preferredTime?: string;
     alternateAddress?: string;
   };
   communication?: {
     senderCanMessage?: boolean;
     receiverCanMessage?: boolean;
     courierCanMessage?: boolean;
   };
 };
 expiresAt?: Date;
}

export interface UpdatePackageProfileInput {
 trackingId?: string;
 senderName?: string;
 senderPhone?: string;
 receiverName?: string;
 receiverPhone?: string;
 packageType?: string;
 weight?: string;
 dimensions?: string;
 description?: string;
 status?: 'pending' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'failed' | 'returned';
 preferences?: {
   safeDropLocation?: string;
   leaveWithNeighbour?: string;
   preferredTime?: string;
   alternateAddress?: string;
 };
}

/**
 * Create a new Package Safe QR
 */
export async function createPackageQR(input: CreatePackageQRInput): Promise<SafeQR> {
 const shortcode = `REZP${generateShortcodeSuffix()}`;
 const qrId = generateQRId('package' as SafeQRMode);

 const expiresAt = input.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days default

 const qr = new SafeQR({
   shortcode, qrId, mode: 'package', ownerId: input.ownerId, status: 'active',
   profile: {
     mode: 'package',
     status: input.profile.status || 'pending',
     communication: {
       senderCanMessage: true,
       receiverCanMessage: true,
       courierCanMessage: true,
       ...input.profile.communication,
     },
     ...input.profile,
   },
   settings: { allowMessages: true, allowContactRequests: true, notifyOnScan: true, requireApproval: false },
   qrPayload: { v: 1, type: 'safe', mode: 'package', id: qrId, shortcode },
   stats: { totalScans: 0, uniqueScanners: 0, totalMessages: 0 },
   karma: { isRegistered: true },
   expiresAt,
 });

 await qr.save();
 return qr;
}

export async function getPublicPackageProfile(shortcode: string): Promise<unknown | null> {
 const qr = await SafeQR.findByShortcode(shortcode);
 if (!qr || qr.mode !== 'package') return null;
 const p = qr.profile as unknown;
 return {
   shortcode: qr.shortcode, mode: qr.mode, status: p.status,
   trackingId: p.trackingId, packageType: p.packageType,
 };
}

export async function getFullPackageProfile(shortcode: string, ownerId: string): Promise<unknown | null> {
 const qr = await SafeQR.findByShortcode(shortcode);
 if (!qr || qr.mode !== 'package' || qr.ownerId !== ownerId) return null;
 return { ...qr.profile, shortcode: qr.shortcode, qrId: qr.qrId, expiresAt: qr.expiresAt };
}

export async function updatePackageProfile(shortcode: string, ownerId: string, updates: UpdatePackageProfileInput): Promise<SafeQR | null> {
 const qr = await SafeQR.findByShortcode(shortcode);
 if (!qr || qr.mode !== 'package' || qr.ownerId !== ownerId) return null;
 const profile = qr.profile as unknown;
 qr.profile = {
   ...profile,
   ...updates,
   preferences: updates.preferences ? { ...profile.preferences, ...updates.preferences } : profile.preferences,
 };
 qr.updatedAt = new Date();
 await qr.save();
 return qr;
}

export async function updatePackageStatus(shortcode: string, ownerId: string, status: 'pending' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'failed' | 'returned'): Promise<SafeQR | null> {
 const qr = await SafeQR.findByShortcode(shortcode);
 if (!qr || qr.mode !== 'package' || qr.ownerId !== ownerId) return null;
 (qr.profile as unknown).status = status;
 qr.updatedAt = new Date();
 await qr.save();
 return qr;
}

export async function recordDeliveryAttempt(shortcode: string, ownerId: string, attempt: {
 attemptedAt: string; reason: string; photo?: string;
}): Promise<SafeQR | null> {
 const qr = await SafeQR.findByShortcode(shortcode);
 if (!qr || qr.mode !== 'package' || qr.ownerId !== ownerId) return null;
 (qr.profile as unknown).deliveryAttempt = attempt;
 (qr.profile as unknown).status = 'failed';
 qr.updatedAt = new Date();
 await qr.save();
 return qr;
}

export async function markPackageDelivered(shortcode: string, ownerId: string): Promise<SafeQR | null> {
 const qr = await SafeQR.findByShortcode(shortcode);
 if (!qr || qr.mode !== 'package' || qr.ownerId !== ownerId) return null;
 (qr.profile as unknown).status = 'delivered';
 qr.status = 'inactive'; // Package delivered, QR no longer needed
 qr.updatedAt = new Date();
 await qr.save();
 return qr;
}
