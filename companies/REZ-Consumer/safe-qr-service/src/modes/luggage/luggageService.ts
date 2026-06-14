import { SafeQR } from '../../shared/models';
import { generateShortcodeSuffix, generateQRId } from '../../shared/services/qrParser';
import { SafeQRMode } from '../../shared/schemas/safeQR';

/**
 * Luggage Mode Service
 */

export interface CreateLuggageQRInput {
 ownerId: string;
 profile: {
   luggageType?: 'suitcase' | 'backpack' | 'duffel' | 'bag' | 'other';
   brand?: string;
   color?: string;
   distinguishingFeatures?: string;
   tags?: string[];
   travelMode?: boolean;
   flightNumber?: string;
   origin?: string;
   destination?: string;
   returnDate?: string;
   multilingual?: {
     enabled?: boolean;
     languages?: string[];
     message?: Record<string, string>;
   };
   rewardOffer?: {
     amount: number;
     currency?: string;
     message?: string;
   };
 };
}

export interface UpdateLuggageProfileInput {
 luggageType?: string;
 brand?: string;
 color?: string;
 distinguishingFeatures?: string;
 tags?: string[];
 travelMode?: boolean;
 flightNumber?: string;
 origin?: string;
 destination?: string;
 returnDate?: string;
}

/**
 * Create a new Luggage Safe QR
 */
export async function createLuggageQR(input: CreateLuggageQRInput): Promise<SafeQR> {
 const shortcode = `REZL${generateShortcodeSuffix()}`;
 const qrId = generateQRId('luggage' as SafeQRMode);

 const qr = new SafeQR({
   shortcode, qrId, mode: 'luggage', ownerId: input.ownerId, status: 'active',
   profile: { mode: 'luggage', ...input.profile },
   settings: { allowMessages: true, allowContactRequests: true, notifyOnScan: true, requireApproval: false },
   qrPayload: { v: 1, type: 'safe', mode: 'luggage', id: qrId, shortcode },
   stats: { totalScans: 0, uniqueScanners: 0, totalMessages: 0 },
   karma: { isRegistered: true },
 });

 await qr.save();
 return qr;
}

export async function getPublicLuggageProfile(shortcode: string): Promise<unknown | null> {
 const qr = await SafeQR.findByShortcode(shortcode);
 if (!qr || qr.mode !== 'luggage') return null;
 const p = qr.profile as unknown;
 return {
   shortcode: qr.shortcode, mode: qr.mode, luggageType: p.luggageType,
   brand: p.brand, color: p.color, distinguishingFeatures: p.distinguishingFeatures,
   travelMode: p.travelMode,
 };
}

export async function getFullLuggageProfile(shortcode: string, ownerId: string): Promise<unknown | null> {
 const qr = await SafeQR.findByShortcode(shortcode);
 if (!qr || qr.mode !== 'luggage' || qr.ownerId !== ownerId) return null;
 return { ...qr.profile, shortcode: qr.shortcode, qrId: qr.qrId, stats: qr.stats };
}

export async function updateLuggageProfile(shortcode: string, ownerId: string, updates: UpdateLuggageProfileInput): Promise<SafeQR | null> {
 const qr = await SafeQR.findByShortcode(shortcode);
 if (!qr || qr.mode !== 'luggage' || qr.ownerId !== ownerId) return null;
 qr.profile = { ...qr.profile, ...updates };
 qr.updatedAt = new Date();
 await qr.save();
 return qr;
}

export async function setTravelMode(shortcode: string, ownerId: string, travelInfo: {
 flightNumber?: string; origin?: string; destination?: string; returnDate?: string;
}): Promise<SafeQR | null> {
 const qr = await SafeQR.findByShortcode(shortcode);
 if (!qr || qr.mode !== 'luggage' || qr.ownerId !== ownerId) return null;
 const profile = qr.profile as unknown;
 profile.travelMode = true;
 profile.flightNumber = travelInfo.flightNumber;
 profile.origin = travelInfo.origin;
 profile.destination = travelInfo.destination;
 profile.returnDate = travelInfo.returnDate;
 qr.profile = profile;
 qr.updatedAt = new Date();
 await qr.save();
 return qr;
}

export async function setRewardOffer(shortcode: string, ownerId: string, reward: {
 amount: number; currency?: string; message?: string;
}): Promise<SafeQR | null> {
 const qr = await SafeQR.findByShortcode(shortcode);
 if (!qr || qr.mode !== 'luggage' || qr.ownerId !== ownerId) return null;
 const profile = qr.profile as unknown;
 profile.rewardOffer = { amount: reward.amount, currency: reward.currency || 'INR', message: reward.message };
 qr.profile = profile;
 qr.updatedAt = new Date();
 await qr.save();
 return qr;
}
