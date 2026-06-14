import { v4 as uuidv4 } from 'uuid';
import { SafeQR, ScanEvent } from '../../shared/models';
import { createFeedPost, addHelperToFeedPost, resolveFeedPost } from '../../shared/services/karma';
import { safeQRNotifications } from '../../integrations/notifications';
import { karmaConfig } from '../../config/karma';
import { PetProfile } from '../../shared/schemas/profile';
import { generateShortcodeSuffix, generateQRId } from '../../shared/services/qrParser';
import { SafeQRMode } from '../../shared/schemas/safeQR';

/**
 * Pet Mode Service
 * Handles pet-specific Safe QR functionality
 */

export interface CreatePetQRInput {
 ownerId: string;
 profile: {
   name: string;
   species?: 'dog' | 'cat' | 'bird' | 'rabbit' | 'other';
   breed?: string;
   age?: number;
   gender?: 'male' | 'female' | 'unknown';
   photo?: string;
   photos?: string[];
   description?: string;
   vaccinationRecords?: Array<{
     vaccine: string;
     date: string;
     vet?: string;
   }>;
   microchipId?: string;
   vetName?: string;
   vetPhone?: string;
   emergencyContacts?: Array<{
     name: string;
     phone: string;
     relationship?: string;
   }>;
 };
 settings?: {
   allowMessages?: boolean;
   allowContactRequests?: boolean;
   notifyOnScan?: boolean;
   autoActivateLost?: boolean;
 };
}

export interface UpdatePetProfileInput {
 name?: string;
 species?: string;
 breed?: string;
 age?: number;
 gender?: string;
 photo?: string;
 photos?: string[];
 description?: string;
 vaccinationRecords?: Array<{
   vaccine: string;
   date: string;
   vet?: string;
 }>;
 microchipId?: string;
 vetName?: string;
 vetPhone?: string;
 emergencyContacts?: Array<{
   name: string;
   phone: string;
   relationship?: string;
 }>;
}

export interface ActivateLostModeInput {
 shortcode: string;
 ownerId: string;
 lastSeenLocation?: {
   lat: number;
   lng: number;
   address?: string;
 };
 reward?: {
   amount: number;
   currency?: string;
   message?: string;
 };
}

/**
 * Create a new Pet Safe QR
 */
export async function createPetQR(input: CreatePetQRInput): Promise<SafeQR> {
 const shortcode = `REZP${generateShortcodeSuffix()}`;
 const qrId = generateQRId('pet' as SafeQRMode);

 const profile = {
   mode: 'pet' as const,
   ...input.profile,
 };

 const qr = new SafeQR({
   shortcode,
   qrId,
   mode: 'pet',
   ownerId: input.ownerId,
   status: 'active',
   profile,
   settings: {
     allowMessages: input.settings?.allowMessages ?? true,
     allowContactRequests: input.settings?.allowContactRequests ?? true,
     shareLocationOnScan: input.settings?.shareLocationOnScan ?? false,
     notifyOnScan: input.settings?.notifyOnScan ?? true,
     autoActivateLost: input.settings?.autoActivateLost ?? false,
     requireApproval: true,
   },
   qrPayload: {
     v: 1,
     type: 'safe',
     mode: 'pet',
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
 * Get Pet QR by shortcode
 */
export async function getPetQR(shortcode: string): Promise<SafeQR | null> {
 return SafeQR.findByShortcode(shortcode);
}

/**
 * Get Pet profile (public fields)
 */
export async function getPublicPetProfile(shortcode: string): Promise<unknown | null> {
 const qr = await SafeQR.findByShortcode(shortcode);
 if (!qr || qr.mode !== 'pet') return null;

 const profile = qr.profile as PetProfile;

 return {
   shortcode: qr.shortcode,
   mode: qr.mode,
   status: qr.status,
   name: profile.name,
   species: profile.species,
   breed: profile.breed,
   photo: profile.photo || profile.photos?.[0],
   description: profile.description,
   isLost: qr.status === 'lost',
   lostModeActivatedAt: qr.lostModeActivatedAt,
 };
}

/**
 * Get full Pet profile (owner only)
 */
export async function getFullPetProfile(shortcode: string, ownerId: string): Promise<unknown | null> {
 const qr = await SafeQR.findByShortcode(shortcode);
 if (!qr || qr.mode !== 'pet' || qr.ownerId !== ownerId) return null;

 return {
   ...qr.profile,
   shortcode: qr.shortcode,
   qrId: qr.qrId,
   status: qr.status,
   settings: qr.settings,
   stats: qr.stats,
   lostModeActivatedAt: qr.lostModeActivatedAt,
   createdAt: qr.createdAt,
 };
}

/**
 * Update Pet profile
 */
export async function updatePetProfile(
 shortcode: string,
 ownerId: string,
 updates: UpdatePetProfileInput
): Promise<SafeQR | null> {
 const qr = await SafeQR.findByShortcode(shortcode);
 if (!qr || qr.mode !== 'pet' || qr.ownerId !== ownerId) return null;

 // Merge updates with existing profile
 qr.profile = {
   ...qr.profile,
   ...updates,
 };
 qr.updatedAt = new Date();

 await qr.save();
 return qr;
}

/**
 * Activate lost mode for a pet
 */
export async function activateLostMode(input: ActivateLostModeInput): Promise<SafeQR | null> {
 const qr = await SafeQR.findByShortcode(input.shortcode);
 if (!qr || qr.mode !== 'pet' || qr.ownerId !== input.ownerId) return null;

 // Update QR status
 qr.status = 'lost';
 qr.lostModeActivatedAt = new Date();
 qr.profile = {
   ...qr.profile,
   lastSeenLocation: input.lastSeenLocation
     ? {
         type: 'Point',
         coordinates: [input.lastSeenLocation.lng, input.lastSeenLocation.lat],
         address: input.lastSeenLocation.address,
       }
     : undefined,
 };
 await qr.save();

 // Post to Karma Feed
 const profile = qr.profile as PetProfile;
 const feedPost = await createFeedPost({
   safeQRId: qr.qrId,
   shortcode: qr.shortcode,
   mode: 'pet',
   type: 'lost_item',
   title: `LOST PET: ${profile.name}`,
   description: profile.description || `Lost ${profile.species || 'pet'}${profile.breed ? ` (${profile.breed})` : ''}`,
   location: input.lastSeenLocation,
   photos: profile.photos || (profile.photo ? [profile.photo] : []),
   reward: input.reward,
   ownerId: qr.ownerId,
   ownerName: profile.name || 'Pet Owner',
 });

 // Update QR with feed post ID
 qr.karma.feedPostId = feedPost.postId;
 await qr.save();

 // Notify owner
 await safeQRNotifications.onLostModeActivated(qr.qrId, qr.ownerId, 'pet');

 return qr;
}

/**
 * Mark pet as found
 */
export async function markAsFound(
 shortcode: string,
 ownerId: string,
 helperIds: string[] = []
): Promise<SafeQR | null> {
 const qr = await SafeQR.findByShortcode(shortcode);
 if (!qr || qr.mode !== 'pet' || qr.ownerId !== ownerId) return null;

 // Update QR status
 qr.status = 'active';
 qr.lostModeActivatedAt = undefined;
 await qr.save();

 // Resolve karma feed post
 if (qr.karma.feedPostId) {
   await resolveFeedPost(qr.karma.feedPostId, ownerId);
   qr.karma.feedPostId = undefined;
   await qr.save();
 }

 // Notify helpers
 for (const helperId of helperIds) {
   await safeQRNotifications.onSystem(
     helperId,
     'Pet found!',
     'Great news! The pet has been found. Thank you for your help!'
   );
 }

 return qr;
}

/**
 * Update vaccination records
 */
export async function updateVaccination(
 shortcode: string,
 ownerId: string,
 records: Array<{
   vaccine: string;
   date: string;
   vet?: string;
 }>
): Promise<SafeQR | null> {
 const qr = await SafeQR.findByShortcode(shortcode);
 if (!qr || qr.mode !== 'pet' || qr.ownerId !== ownerId) return null;

 (qr.profile as unknown).vaccinationRecords = records;
 qr.updatedAt = new Date();

 await qr.save();
 return qr;
}

/**
 * Get emergency contacts for a pet (public when lost)
 */
export async function getEmergencyContacts(
 shortcode: string
): Promise<Array<{ name: string; phone: string; relationship?: string }> | null> {
 const qr = await SafeQR.findByShortcode(shortcode);
 if (!qr || qr.mode !== 'pet') return null;

 const profile = qr.profile as PetProfile;
 return profile.emergencyContacts || [];
}

/**
 * Add helper to lost pet search
 */
export async function joinAsHelper(
 shortcode: string,
 helper: {
   userId: string;
   name: string;
   avatar?: string;
   karmaLevel?: string;
 }
): Promise<void> {
 const qr = await SafeQR.findByShortcode(shortcode);
 if (!qr || qr.mode !== 'pet' || qr.status !== 'lost') return;

 // Add helper to feed post
 if (qr.karma.feedPostId) {
   await addHelperToFeedPost(qr.karma.feedPostId, helper);

   // Notify owner
   await safeQRNotifications.onHelperJoined(qr.qrId, qr.ownerId, helper.name);
 }
}
