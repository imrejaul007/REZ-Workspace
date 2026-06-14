import { SafeQR } from '../../shared/models';
import { generateShortcodeSuffix, generateQRId } from '../../shared/services/qrParser';
import { SafeQRMode } from '../../shared/schemas/safeQR';

/**
 * Child Mode Service
 * Handles child safety QR functionality
 */

export interface CreateChildQRInput {
 ownerId: string;
 profile: {
   firstName: string;
   lastName?: string;
   age: number;
   schoolName?: string;
   schoolContact?: string;
   schoolAddress?: string;
   class?: string;
   section?: string;
   rollNumber?: string;
   photo?: string;
   guardians: Array<{
     userId?: string;
     name: string;
     phone: string;
     relationship: 'parent' | 'mother' | 'father' | 'grandparent' | 'guardian' | 'school' | 'other';
     isPrimary?: boolean;
     notifyOnScan?: boolean;
   }>;
   authorizedPickups?: Array<{
     name: string;
     phone: string;
     relationship?: string;
     photo?: string;
     pin?: string;
     isAuthorized?: boolean;
   }>;
   medicalNotes?: string;
   allergies?: string[];
   busRoute?: string;
   busNumber?: string;
 };
}

export interface UpdateChildProfileInput {
 firstName?: string;
 lastName?: string;
 age?: number;
 schoolName?: string;
 schoolContact?: string;
 schoolAddress?: string;
 class?: string;
 section?: string;
 rollNumber?: string;
 photo?: string;
 medicalNotes?: string;
 allergies?: string[];
 busRoute?: string;
 busNumber?: string;
}

/**
 * Create a new Child Safe QR
 */
export async function createChildQR(input: CreateChildQRInput): Promise<SafeQR> {
 const shortcode = `REZC${generateShortcodeSuffix()}`;
 const qrId = generateQRId('child' as SafeQRMode);

 const profile = {
   mode: 'child' as const,
   firstName: input.profile.firstName,
   lastName: input.profile.lastName,
   age: input.profile.age,
   schoolName: input.profile.schoolName,
   schoolContact: input.profile.schoolContact,
   schoolAddress: input.profile.schoolAddress,
   class: input.profile.class,
   section: input.profile.section,
   rollNumber: input.profile.rollNumber,
   photo: input.profile.photo,
   guardians: input.profile.guardians.map((g, i) => ({
     ...g,
     isPrimary: g.isPrimary ?? i === 0,
     notifyOnScan: g.notifyOnScan ?? true,
   })),
   authorizedPickups: input.profile.authorizedPickups?.map(p => ({
     ...p,
     isAuthorized: p.isAuthorized ?? true,
   })) || [],
   medicalNotes: input.profile.medicalNotes,
   allergies: input.profile.allergies || [],
   busRoute: input.profile.busRoute,
   busNumber: input.profile.busNumber,
 };

 const qr = new SafeQR({
   shortcode,
   qrId,
   mode: 'child',
   ownerId: input.ownerId,
   status: 'active',
   profile,
   settings: {
     allowMessages: false,
     allowContactRequests: true,
     shareLocationOnScan: true,
     notifyOnScan: true,
     autoActivateLost: false,
     requireApproval: false, // Emergency accessible
   },
   qrPayload: {
     v: 1,
     type: 'safe',
     mode: 'child',
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
 * Get Public Child Info
 */
export async function getPublicChildInfo(shortcode: string): Promise<unknown | null> {
 const qr = await SafeQR.findByShortcode(shortcode);
 if (!qr || qr.mode !== 'child') return null;

 const profile = qr.profile as unknown;

 return {
   shortcode: qr.shortcode,
   mode: qr.mode,
   firstName: profile.firstName,
   age: profile.age,
   schoolName: profile.schoolName,
   photo: profile.photo,
   status: qr.status,
 };
}

/**
 * Get Full Child Profile (Owner Only)
 */
export async function getFullChildProfile(shortcode: string, ownerId: string): Promise<unknown | null> {
 const qr = await SafeQR.findByShortcode(shortcode);
 if (!qr || qr.mode !== 'child' || qr.ownerId !== ownerId) return null;

 return {
   ...qr.profile,
   shortcode: qr.shortcode,
   qrId: qr.qrId,
   stats: qr.stats,
   createdAt: qr.createdAt,
 };
}

/**
 * Update Child Profile
 */
export async function updateChildProfile(
 shortcode: string,
 ownerId: string,
 updates: UpdateChildProfileInput
): Promise<SafeQR | null> {
 const qr = await SafeQR.findByShortcode(shortcode);
 if (!qr || qr.mode !== 'child' || qr.ownerId !== ownerId) return null;

 qr.profile = {
   ...qr.profile,
   ...updates,
 };
 qr.updatedAt = new Date();

 await qr.save();
 return qr;
}

/**
 * Update Guardians
 */
export async function updateGuardians(
 shortcode: string,
 ownerId: string,
 guardians: Array<{
   userId?: string;
   name: string;
   phone: string;
   relationship: string;
   isPrimary?: boolean;
   notifyOnScan?: boolean;
 }>
): Promise<SafeQR | null> {
 const qr = await SafeQR.findByShortcode(shortcode);
 if (!qr || qr.mode !== 'child' || qr.ownerId !== ownerId) return null;

 (qr.profile as unknown).guardians = guardians;
 qr.updatedAt = new Date();

 await qr.save();
 return qr;
}

/**
 * Update Authorized Pickups
 */
export async function updateAuthorizedPickups(
 shortcode: string,
 ownerId: string,
 pickups: Array<{
   name: string;
   phone: string;
   relationship?: string;
   photo?: string;
   pin?: string;
   isAuthorized?: boolean;
 }>
): Promise<SafeQR | null> {
 const qr = await SafeQR.findByShortcode(shortcode);
 if (!qr || qr.mode !== 'child' || qr.ownerId !== ownerId) return null;

 (qr.profile as unknown).authorizedPickups = pickups;
 qr.updatedAt = new Date();

 await qr.save();
 return qr;
}

/**
 * Verify Pickup Authorization
 */
export async function verifyPickupAuthorization(
 shortcode: string,
 pickupPin?: string
): Promise<{ authorized: boolean; pickupName?: string }> {
 const qr = await SafeQR.findByShortcode(shortcode);
 if (!qr || qr.mode !== 'child') {
   return { authorized: false };
 }

 const profile = qr.profile as unknown;
 const pickups = profile.authorizedPickups || [];

 if (pickups.length === 0) {
   return { authorized: false };
 }

 // Find matching pickup
 const match = pickups.find((p) => {
   if (pickupPin && p.pin) {
     return p.pin === pickupPin;
   }
   return false;
 });

 if (match) {
   return { authorized: true, pickupName: match.name };
 }

 return { authorized: false };
}
