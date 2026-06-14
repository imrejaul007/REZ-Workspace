import { v4 as uuidv4 } from 'uuid';
import { SafeQR } from '../../shared/models';
import { generateShortcodeSuffix, generateQRId } from '../../shared/services/qrParser';
import { SafeQRMode } from '../../shared/schemas/safeQR';

/**
 * Personal Mode Service
 * Handles personal/business card Safe QR functionality
 */

export interface CreatePersonalQRInput {
 ownerId: string;
 profile: {
   displayName: string;
   bio?: string;
   profession?: string;
   company?: string;
   socialLinks?: {
     instagram?: string;
     linkedin?: string;
     twitter?: string;
     website?: string;
     facebook?: string;
   };
   avatar?: string;
   showSocialLinks?: boolean;
 };
 settings?: {
   allowMessages?: boolean;
   allowContactRequests?: boolean;
   requireApproval?: boolean;
 };
}

export interface UpdatePersonalProfileInput {
 displayName?: string;
 bio?: string;
 profession?: string;
 company?: string;
 socialLinks?: {
   instagram?: string;
   linkedin?: string;
   twitter?: string;
   website?: string;
   facebook?: string;
 };
 avatar?: string;
 showSocialLinks?: boolean;
 contactPreference?: 'approve_all' | 'approve_known' | 'manual_review';
}

/**
 * Create a new Personal Safe QR
 */
export async function createPersonalQR(input: CreatePersonalQRInput): Promise<SafeQR> {
 const shortcode = `REZN${generateShortcodeSuffix()}`;
 const qrId = generateQRId('personal' as SafeQRMode);

 const profile = {
   mode: 'personal' as const,
   ...input.profile,
   contactPreference: input.profile.contactPreference || 'manual_review',
 };

 const qr = new SafeQR({
   shortcode,
   qrId,
   mode: 'personal',
   ownerId: input.ownerId,
   status: 'active',
   profile,
   settings: {
     allowMessages: input.settings?.allowMessages ?? true,
     allowContactRequests: input.settings?.allowContactRequests ?? true,
     shareLocationOnScan: false,
     notifyOnScan: true,
     autoActivateLost: false,
     requireApproval: input.settings?.requireApproval ?? true,
   },
   qrPayload: {
     v: 1,
     type: 'safe',
     mode: 'personal',
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
 * Get Public Personal Profile
 */
export async function getPublicPersonalProfile(shortcode: string): Promise<unknown | null> {
 const qr = await SafeQR.findByShortcode(shortcode);
 if (!qr || qr.mode !== 'personal') return null;

 const profile = qr.profile as unknown;

 return {
   shortcode: qr.shortcode,
   mode: qr.mode,
   displayName: profile.displayName,
   bio: profile.bio,
   profession: profile.profession,
   company: profile.company,
   socialLinks: profile.showSocialLinks ? profile.socialLinks : undefined,
   avatar: profile.avatar,
 };
}

/**
 * Get Full Personal Profile (Owner Only)
 */
export async function getFullPersonalProfile(shortcode: string, ownerId: string): Promise<unknown | null> {
 const qr = await SafeQR.findByShortcode(shortcode);
 if (!qr || qr.mode !== 'personal' || qr.ownerId !== ownerId) return null;

 return {
   ...qr.profile,
   shortcode: qr.shortcode,
   qrId: qr.qrId,
   status: qr.status,
   stats: qr.stats,
   createdAt: qr.createdAt,
 };
}

/**
 * Update Personal Profile
 */
export async function updatePersonalProfile(
 shortcode: string,
 ownerId: string,
 updates: UpdatePersonalProfileInput
): Promise<SafeQR | null> {
 const qr = await SafeQR.findByShortcode(shortcode);
 if (!qr || qr.mode !== 'personal' || qr.ownerId !== ownerId) return null;

 qr.profile = {
   ...qr.profile,
   ...updates,
 };
 qr.updatedAt = new Date();

 await qr.save();
 return qr;
}

/**
 * Update Contact Preference
 */
export async function updateContactPreference(
 shortcode: string,
 ownerId: string,
 preference: 'approve_all' | 'approve_known' | 'manual_review'
): Promise<SafeQR | null> {
 const qr = await SafeQR.findByShortcode(shortcode);
 if (!qr || qr.mode !== 'personal' || qr.ownerId !== ownerId) return null;

 (qr.profile as unknown).contactPreference = preference;
 qr.updatedAt = new Date();

 await qr.save();
 return qr;
}
