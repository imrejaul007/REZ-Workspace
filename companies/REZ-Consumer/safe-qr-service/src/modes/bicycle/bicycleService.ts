import { SafeQR } from '../../shared/models';
import { generateShortcodeSuffix, generateQRId } from '../../shared/services/qrParser';
import { SafeQRMode } from '../../shared/schemas/safeQR';
import { createFeedPost, resolveFeedPost } from '../../shared/services/karma';
import { safeQRNotifications } from '../../integrations/notifications';

/**
 * Bicycle Mode Service
 */

export interface CreateBicycleQRInput {
 ownerId: string;
 profile: {
   brand: string;
   model?: string;
   frameNumber?: string;
   color?: string;
   type?: 'road' | 'mountain' | 'hybrid' | 'city' | 'kids' | 'electric' | 'other';
   purchaseDate?: string;
   purchaseProof?: string;
   photos?: string[];
   accessories?: string[];
   estimatedValue?: number;
 };
}

export interface UpdateBicycleProfileInput {
 brand?: string;
 model?: string;
 frameNumber?: string;
 color?: string;
 type?: string;
 purchaseDate?: string;
 purchaseProof?: string;
 photos?: string[];
 accessories?: string[];
 estimatedValue?: number;
}

/**
 * Create a new Bicycle Safe QR
 */
export async function createBicycleQR(input: CreateBicycleQRInput): Promise<SafeQR> {
 const shortcode = `REZB${generateShortcodeSuffix()}`;
 const qrId = generateQRId('bicycle' as SafeQRMode);

 const profile = {
   mode: 'bicycle' as const,
   ...input.profile,
 };

 const qr = new SafeQR({
   shortcode,
   qrId,
   mode: 'bicycle',
   ownerId: input.ownerId,
   status: 'active',
   profile,
   settings: {
     allowMessages: true,
     allowContactRequests: true,
     shareLocationOnScan: true,
     notifyOnScan: true,
     requireApproval: true,
   },
   qrPayload: { v: 1, type: 'safe', mode: 'bicycle', id: qrId, shortcode },
   stats: { totalScans: 0, uniqueScanners: 0, totalMessages: 0 },
   karma: { isRegistered: true },
 });

 await qr.save();
 return qr;
}

export async function getPublicBicycleProfile(shortcode: string): Promise<unknown | null> {
 const qr = await SafeQR.findByShortcode(shortcode);
 if (!qr || qr.mode !== 'bicycle') return null;
 const p = qr.profile as unknown;
 return {
   shortcode: qr.shortcode, mode: qr.mode, brand: p.brand, model: p.model,
   color: p.color, type: p.type, photo: p.photos?.[0],
 };
}

export async function getFullBicycleProfile(shortcode: string, ownerId: string): Promise<unknown | null> {
 const qr = await SafeQR.findByShortcode(shortcode);
 if (!qr || qr.mode !== 'bicycle' || qr.ownerId !== ownerId) return null;
 return { ...qr.profile, shortcode: qr.shortcode, qrId: qr.qrId, stats: qr.stats };
}

export async function updateBicycleProfile(shortcode: string, ownerId: string, updates: UpdateBicycleProfileInput): Promise<SafeQR | null> {
 const qr = await SafeQR.findByShortcode(shortcode);
 if (!qr || qr.mode !== 'bicycle' || qr.ownerId !== ownerId) return null;
 qr.profile = { ...qr.profile, ...updates };
 qr.updatedAt = new Date();
 await qr.save();
 return qr;
}

export async function reportBicycleStolen(shortcode: string, ownerId: string, location?: { lat: number; lng: number; address?: string }): Promise<SafeQR | null> {
 const qr = await SafeQR.findByShortcode(shortcode);
 if (!qr || qr.mode !== 'bicycle' || qr.ownerId !== ownerId) return null;
 qr.status = 'lost';
 qr.lostModeActivatedAt = new Date();
 await qr.save();

 const p = qr.profile as unknown;
 const feedPost = await createFeedPost({
   safeQRId: qr.qrId, shortcode: qr.shortcode, mode: 'bicycle', type: 'lost_item',
   title: `STOLEN BIKE: ${p.brand} ${p.model || ''}`,
   description: `${p.color || ''} ${p.type || ''} bicycle. Frame: ${p.frameNumber || 'N/A'}`,
   location, photos: p.photos || [], ownerId: qr.ownerId, ownerName: p.brand,
 });

 qr.karma.feedPostId = feedPost.postId;
 await qr.save();
 await safeQRNotifications.onLostModeActivated(qr.qrId, qr.ownerId, 'bicycle');
 return qr;
}
