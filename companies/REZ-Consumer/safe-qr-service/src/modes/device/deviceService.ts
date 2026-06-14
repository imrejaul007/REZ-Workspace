import { v4 as uuidv4 } from 'uuid';
import { SafeQR } from '../../shared/models';
import { generateShortcodeSuffix, generateQRId } from '../../shared/services/qrParser';
import { SafeQRMode } from '../../shared/schemas/safeQR';
import { createFeedPost, resolveFeedPost } from '../../shared/services/karma';
import { safeQRNotifications } from '../../integrations/notifications';

/**
 * Device Mode Service
 * Handles device (laptop, phone, etc.) Safe QR functionality
 */

export interface CreateDeviceQRInput {
 ownerId: string;
 profile: {
   deviceType: 'laptop' | 'phone' | 'tablet' | 'camera' | 'watch' | 'other';
   brand: string;
   model?: string;
   color?: string;
   serialNumber?: string;
   purchaseDate?: string;
   purchaseProof?: string;
   photos?: string[];
   ownershipChallenge?: {
     question: string;
     answer: string;
     hint?: string;
   };
   recoveryQuestion?: string;
   recoveryAnswer?: string;
 };
 settings?: {
   allowMessages?: boolean;
   allowContactRequests?: boolean;
   notifyOnScan?: boolean;
 };
}

export interface UpdateDeviceProfileInput {
 deviceType?: string;
 brand?: string;
 model?: string;
 color?: string;
 serialNumber?: string;
 purchaseDate?: string;
 purchaseProof?: string;
 photos?: string[];
 ownershipChallenge?: {
   question: string;
   answer: string;
   hint?: string;
 };
 recoveryQuestion?: string;
 recoveryAnswer?: string;
}

export interface DeviceOwnershipVerify {
 shortcode: string;
 challengeAnswer: string;
}

/**
 * Create a new Device Safe QR
 */
export async function createDeviceQR(input: CreateDeviceQRInput): Promise<SafeQR> {
 const shortcode = `REZD${generateShortcodeSuffix()}`;
 const qrId = generateQRId('device' as SafeQRMode);

 const profile = {
   mode: 'device' as const,
   ...input.profile,
 };

 const qr = new SafeQR({
   shortcode,
   qrId,
   mode: 'device',
   ownerId: input.ownerId,
   status: 'active',
   profile,
   settings: {
     allowMessages: input.settings?.allowMessages ?? true,
     allowContactRequests: input.settings?.allowContactRequests ?? true,
     shareLocationOnScan: true,
     notifyOnScan: true,
     autoActivateLost: false,
     requireApproval: true,
   },
   qrPayload: {
     v: 1,
     type: 'safe',
     mode: 'device',
     id: qrId,
     shortcode,
   },
   stats: {
     totalScans: 0,
     uniqueScanners: 0,
     totalMessages: 0,
   },
   karma: {
     isRegistered: true,
   },
 });

 await qr.save();
 return qr;
}

/**
 * Get Public Device Profile
 */
export async function getPublicDeviceProfile(shortcode: string): Promise<unknown | null> {
 const qr = await SafeQR.findByShortcode(shortcode);
 if (!qr || qr.mode !== 'device') return null;

 const profile = qr.profile as unknown;

 return {
   shortcode: qr.shortcode,
   mode: qr.mode,
   status: qr.status,
   deviceType: profile.deviceType,
   brand: profile.brand,
   model: profile.model,
   color: profile.color,
   photo: profile.photos?.[0] || undefined,
   isLost: qr.status === 'lost',
   lostModeActivatedAt: qr.lostModeActivatedAt,
 };
}

/**
 * Get Full Device Profile (Owner Only)
 */
export async function getFullDeviceProfile(shortcode: string, ownerId: string): Promise<unknown | null> {
 const qr = await SafeQR.findByShortcode(shortcode);
 if (!qr || qr.mode !== 'device' || qr.ownerId !== ownerId) return null;

 return {
   ...qr.profile,
   shortcode: qr.shortcode,
   qrId: qr.qrId,
   status: qr.status,
   stats: qr.stats,
   isStolen: (qr.profile as unknown).isStolen,
   createdAt: qr.createdAt,
 };
}

/**
 * Update Device Profile
 */
export async function updateDeviceProfile(
 shortcode: string,
 ownerId: string,
 updates: UpdateDeviceProfileInput
): Promise<SafeQR | null> {
 const qr = await SafeQR.findByShortcode(shortcode);
 if (!qr || qr.mode !== 'device' || qr.ownerId !== ownerId) return null;

 qr.profile = {
   ...qr.profile,
   ...updates,
 };
 qr.updatedAt = new Date();

 await qr.save();
 return qr;
}

/**
 * Set Ownership Challenge
 */
export async function setOwnershipChallenge(
 shortcode: string,
 ownerId: string,
 challenge: {
   question: string;
   answer: string;
   hint?: string;
 }
): Promise<SafeQR | null> {
 const qr = await SafeQR.findByShortcode(shortcode);
 if (!qr || qr.mode !== 'device' || qr.ownerId !== ownerId) return null;

 (qr.profile as unknown).ownershipChallenge = {
   question: challenge.question,
   answer: challenge.answer.toLowerCase(), // Store lowercase for easier matching
   hint: challenge.hint,
 };

 qr.updatedAt = new Date();
 await qr.save();
 return qr;
}

/**
 * Verify Device Ownership
 */
export async function verifyOwnership(
 shortcode: string,
 challengeAnswer: string
): Promise<{ verified: boolean; hint?: string }> {
 const qr = await SafeQR.findByShortcode(shortcode);
 if (!qr || qr.mode !== 'device') {
   return { verified: false };
 }

 const challenge = (qr.profile as unknown).ownershipChallenge;
 if (!challenge) {
   return { verified: true }; // No challenge set
 }

 const isCorrect = challenge.answer.toLowerCase() === challengeAnswer.toLowerCase();
 return {
   verified: isCorrect,
   hint: !isCorrect ? challenge.hint : undefined,
 };
}

/**
 * Report Device as Lost
 */
export async function reportDeviceLost(
 shortcode: string,
 ownerId: string,
 lastSeenLocation?: {
   lat: number;
   lng: number;
   address?: string;
 },
 reward?: {
   amount: number;
   currency?: string;
   message?: string;
 }
): Promise<SafeQR | null> {
 const qr = await SafeQR.findByShortcode(shortcode);
 if (!qr || qr.mode !== 'device' || qr.ownerId !== ownerId) return null;

 qr.status = 'lost';
 qr.lostModeActivatedAt = new Date();
 (qr.profile as unknown).isStolen = true;
 (qr.profile as unknown).lastSeenLocation = lastSeenLocation;
 await qr.save();

 // Post to Karma Feed
 const profile = qr.profile as unknown;
 const feedPost = await createFeedPost({
   safeQRId: qr.qrId,
   shortcode: qr.shortcode,
   mode: 'device',
   type: 'lost_item',
   title: `LOST DEVICE: ${profile.brand} ${profile.model || ''}`,
   description: `Lost ${profile.deviceType}. ${profile.color ? `Color: ${profile.color}.` : ''} ${profile.serialNumber ? `S/N: ${profile.serialNumber}` : ''}`,
   location: lastSeenLocation,
   photos: profile.photos || [],
   reward,
   ownerId: qr.ownerId,
   ownerName: profile.brand || 'Device Owner',
 });

 qr.karma.feedPostId = feedPost.postId;
 await qr.save();

 await safeQRNotifications.onLostModeActivated(qr.qrId, qr.ownerId, 'device');

 return qr;
}

/**
 * Mark Device as Found
 */
export async function markDeviceFound(
 shortcode: string,
 ownerId: string,
 helperIds: string[] = []
): Promise<SafeQR | null> {
 const qr = await SafeQR.findByShortcode(shortcode);
 if (!qr || qr.mode !== 'device' || qr.ownerId !== ownerId) return null;

 qr.status = 'active';
 qr.lostModeActivatedAt = undefined;
 (qr.profile as unknown).isStolen = false;
 await qr.save();

 if (qr.karma.feedPostId) {
   await resolveFeedPost(qr.karma.feedPostId, ownerId);
   qr.karma.feedPostId = undefined;
   await qr.save();
 }

 for (const helperId of helperIds) {
   await safeQRNotifications.onSystem(
     helperId,
     'Device found!',
     'Great news! The device has been found. Thank you for your help!'
   );
 }

 return qr;
}

/**
 * Add Device Photos
 */
export async function addDevicePhotos(
 shortcode: string,
 ownerId: string,
 photos: string[]
): Promise<SafeQR | null> {
 const qr = await SafeQR.findByShortcode(shortcode);
 if (!qr || qr.mode !== 'device' || qr.ownerId !== ownerId) return null;

 const profile = qr.profile as unknown;
 profile.photos = [...(profile.photos || []), ...photos].slice(0, 10);
 qr.profile = profile;
 qr.updatedAt = new Date();

 await qr.save();
 return qr;
}
