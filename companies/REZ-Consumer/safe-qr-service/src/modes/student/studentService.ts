import { SafeQR } from '../../shared/models';
import { generateShortcodeSuffix, generateQRId } from '../../shared/services/qrParser';
import { SafeQRMode } from '../../shared/schemas/safeQR';

/**
 * Student Mode Service
 */

export interface CreateStudentQRInput {
 ownerId: string;
 profile: {
   studentId?: string;
   firstName: string;
   lastName?: string;
   schoolName: string;
   schoolId?: string;
   class: string;
   section?: string;
   rollNumber?: string;
   busRoute?: string;
   busNumber?: string;
   pickupPersons?: Array<{
     name: string;
     phone: string;
     relationship?: string;
     photo?: string;
     pin?: string;
     isAuthorized?: boolean;
   }>;
   parents?: Array<{
     userId?: string;
     name: string;
     phone: string;
     relationship?: string;
   }>;
   medicalInfo?: {
     allergies?: string[];
     conditions?: string[];
     medications?: string[];
   };
   photo?: string;
 };
}

export interface UpdateStudentProfileInput {
 firstName?: string;
 lastName?: string;
 schoolName?: string;
 schoolId?: string;
 class?: string;
 section?: string;
 rollNumber?: string;
 busRoute?: string;
 busNumber?: string;
 medicalInfo?: { allergies?: string[]; conditions?: string[]; medications?: string[] };
 photo?: string;
}

/**
 * Create a new Student Safe QR
 */
export async function createStudentQR(input: CreateStudentQRInput): Promise<SafeQR> {
 const shortcode = `REZS${generateShortcodeSuffix()}`;
 const qrId = generateQRId('student' as SafeQRMode);

 const qr = new SafeQR({
   shortcode, qrId, mode: 'student', ownerId: input.ownerId, status: 'active',
   profile: { mode: 'student', ...input.profile },
   settings: { allowMessages: false, allowContactRequests: true, notifyOnScan: true, requireApproval: false },
   qrPayload: { v: 1, type: 'safe', mode: 'student', id: qrId, shortcode },
   stats: { totalScans: 0, uniqueScanners: 0, totalMessages: 0 },
   karma: { isRegistered: true },
 });

 await qr.save();
 return qr;
}

export async function getPublicStudentProfile(shortcode: string): Promise<unknown | null> {
 const qr = await SafeQR.findByShortcode(shortcode);
 if (!qr || qr.mode !== 'student') return null;
 const p = qr.profile as unknown;
 return {
   shortcode: qr.shortcode, mode: qr.mode, firstName: p.firstName,
   schoolName: p.schoolName, class: p.class,
 };
}

export async function getFullStudentProfile(shortcode: string, ownerId: string): Promise<unknown | null> {
 const qr = await SafeQR.findByShortcode(shortcode);
 if (!qr || qr.mode !== 'student' || qr.ownerId !== ownerId) return null;
 return { ...qr.profile, shortcode: qr.shortcode, qrId: qr.qrId, stats: qr.stats };
}

export async function updateStudentProfile(shortcode: string, ownerId: string, updates: UpdateStudentProfileInput): Promise<SafeQR | null> {
 const qr = await SafeQR.findByShortcode(shortcode);
 if (!qr || qr.mode !== 'student' || qr.ownerId !== ownerId) return null;
 const profile = qr.profile as unknown;
 qr.profile = {
   ...profile,
   ...updates,
   medicalInfo: updates.medicalInfo ? { ...profile.medicalInfo, ...updates.medicalInfo } : profile.medicalInfo,
 };
 qr.updatedAt = new Date();
 await qr.save();
 return qr;
}

export async function updateParents(shortcode: string, ownerId: string, parents: Array<{
 userId?: string; name: string; phone: string; relationship?: string;
}>): Promise<SafeQR | null> {
 const qr = await SafeQR.findByShortcode(shortcode);
 if (!qr || qr.mode !== 'student' || qr.ownerId !== ownerId) return null;
 (qr.profile as unknown).parents = parents;
 qr.updatedAt = new Date();
 await qr.save();
 return qr;
}

export async function updatePickupPersons(shortcode: string, ownerId: string, pickups: Array<{
 name: string; phone: string; relationship?: string; photo?: string; pin?: string; isAuthorized?: boolean;
}>): Promise<SafeQR | null> {
 const qr = await SafeQR.findByShortcode(shortcode);
 if (!qr || qr.mode !== 'student' || qr.ownerId !== ownerId) return null;
 (qr.profile as unknown).pickupPersons = pickups;
 qr.updatedAt = new Date();
 await qr.save();
 return qr;
}
