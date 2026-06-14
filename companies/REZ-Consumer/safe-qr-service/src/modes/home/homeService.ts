import { SafeQR } from '../../shared/models';
import { generateShortcodeSuffix, generateQRId } from '../../shared/services/qrParser';
import { SafeQRMode } from '../../shared/schemas/safeQR';

/**
 * Home Mode Service
 */

export interface CreateHomeQRInput {
 ownerId: string;
 profile: {
   address: {
     flatNumber?: string;
     buildingName?: string;
     street?: string;
     area?: string;
     city?: string;
     state?: string;
     pincode?: string;
     landmark?: string;
   };
   roles: Array<{
     userId: string;
     name: string;
     role?: 'owner' | 'tenant' | 'family' | 'security' | 'staff';
     canReceiveDelivery?: boolean;
     canReceiveVisitor?: boolean;
     canReceiveEmergency?: boolean;
     phone?: string;
   }>;
   preferences?: {
     deliveryInstructions?: string;
     gateCode?: string;
     preferredDeliveryTime?: string;
     leaveWithNeighbour?: string;
     safeSpotLocation?: string;
   };
 };
}

export interface UpdateHomeProfileInput {
 address?: {
   flatNumber?: string;
   buildingName?: string;
   street?: string;
   area?: string;
   city?: string;
   state?: string;
   pincode?: string;
   landmark?: string;
 };
 preferences?: {
   deliveryInstructions?: string;
   gateCode?: string;
   preferredDeliveryTime?: string;
   leaveWithNeighbour?: string;
   safeSpotLocation?: string;
 };
}

/**
 * Create a new Home Safe QR
 */
export async function createHomeQR(input: CreateHomeQRInput): Promise<SafeQR> {
 const shortcode = `REZA${generateShortcodeSuffix()}`;
 const qrId = generateQRId('home' as SafeQRMode);

 const qr = new SafeQR({
   shortcode, qrId, mode: 'home', ownerId: input.ownerId, status: 'active',
   profile: { mode: 'home', ...input.profile },
   settings: { allowMessages: true, allowContactRequests: true, notifyOnScan: true, requireApproval: false },
   qrPayload: { v: 1, type: 'safe', mode: 'home', id: qrId, shortcode },
   stats: { totalScans: 0, uniqueScanners: 0, totalMessages: 0 },
   karma: { isRegistered: true },
 });

 await qr.save();
 return qr;
}

export async function getPublicHomeProfile(shortcode: string): Promise<unknown | null> {
 const qr = await SafeQR.findByShortcode(shortcode);
 if (!qr || qr.mode !== 'home') return null;
 const p = qr.profile as unknown;
 return {
   shortcode: qr.shortcode, mode: qr.mode,
   address: { buildingName: p.address?.buildingName, flatNumber: p.address?.flatNumber },
 };
}

export async function getFullHomeProfile(shortcode: string, ownerId: string): Promise<unknown | null> {
 const qr = await SafeQR.findByShortcode(shortcode);
 if (!qr || qr.mode !== 'home' || qr.ownerId !== ownerId) return null;
 return { ...qr.profile, shortcode: qr.shortcode, qrId: qr.qrId };
}

export async function updateHomeProfile(shortcode: string, ownerId: string, updates: UpdateHomeProfileInput): Promise<SafeQR | null> {
 const qr = await SafeQR.findByShortcode(shortcode);
 if (!qr || qr.mode !== 'home' || qr.ownerId !== ownerId) return null;
 const profile = qr.profile as unknown;
 qr.profile = {
   ...profile,
   address: updates.address ? { ...profile.address, ...updates.address } : profile.address,
   preferences: updates.preferences ? { ...profile.preferences, ...updates.preferences } : profile.preferences,
 };
 qr.updatedAt = new Date();
 await qr.save();
 return qr;
}

export async function updateHomeRoles(shortcode: string, ownerId: string, roles: Array<{
 userId: string; name: string; role?: string; canReceiveDelivery?: boolean; canReceiveVisitor?: boolean; canReceiveEmergency?: boolean; phone?: string;
}>): Promise<SafeQR | null> {
 const qr = await SafeQR.findByShortcode(shortcode);
 if (!qr || qr.mode !== 'home' || qr.ownerId !== ownerId) return null;
 (qr.profile as unknown).roles = roles;
 qr.updatedAt = new Date();
 await qr.save();
 return qr;
}

export async function updateDeliveryPreferences(shortcode: string, ownerId: string, prefs: {
 deliveryInstructions?: string; gateCode?: string; preferredDeliveryTime?: string; leaveWithNeighbour?: string;
}): Promise<SafeQR | null> {
 const qr = await SafeQR.findByShortcode(shortcode);
 if (!qr || qr.mode !== 'home' || qr.ownerId !== ownerId) return null;
 const profile = qr.profile as unknown;
 profile.preferences = { ...profile.preferences, ...prefs };
 qr.profile = profile;
 qr.updatedAt = new Date();
 await qr.save();
 return qr;
}
