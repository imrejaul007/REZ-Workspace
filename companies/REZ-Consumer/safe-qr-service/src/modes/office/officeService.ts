import { SafeQR } from '../../shared/models';
import { generateShortcodeSuffix, generateQRId } from '../../shared/services/qrParser';
import { SafeQRMode } from '../../shared/schemas/safeQR';

/**
 * Office Mode Service
 */

export interface CreateOfficeQRInput {
 ownerId: string;
 profile: {
   type?: 'employee' | 'visitor' | 'desk' | 'equipment' | 'meeting_room';
   employeeId?: string;
   name: string;
   department?: string;
   designation?: string;
   deskLocation?: string;
   floor?: string;
   building?: string;
   emergencyContactName?: string;
   emergencyContactPhone?: string;
   accessLevel?: 'public' | 'staff' | 'restricted';
   photo?: string;
 };
}

export interface UpdateOfficeProfileInput {
 name?: string;
 department?: string;
 designation?: string;
 deskLocation?: string;
 floor?: string;
 building?: string;
 emergencyContactName?: string;
 emergencyContactPhone?: string;
 accessLevel?: 'public' | 'staff' | 'restricted';
 photo?: string;
}

/**
 * Create a new Office Safe QR
 */
export async function createOfficeQR(input: CreateOfficeQRInput): Promise<SafeQR> {
 const shortcode = `REZO${generateShortcodeSuffix()}`;
 const qrId = generateQRId('office' as SafeQRMode);

 const qr = new SafeQR({
   shortcode, qrId, mode: 'office', ownerId: input.ownerId, status: 'active',
   profile: { mode: 'office', ...input.profile },
   settings: { allowMessages: true, allowContactRequests: true, notifyOnScan: true, requireApproval: true },
   qrPayload: { v: 1, type: 'safe', mode: 'office', id: qrId, shortcode },
   stats: { totalScans: 0, uniqueScanners: 0, totalMessages: 0 },
   karma: { isRegistered: true },
 });

 await qr.save();
 return qr;
}

export async function getPublicOfficeProfile(shortcode: string): Promise<unknown | null> {
 const qr = await SafeQR.findByShortcode(shortcode);
 if (!qr || qr.mode !== 'office') return null;
 const p = qr.profile as unknown;
 return {
   shortcode: qr.shortcode, mode: qr.mode, name: p.name, department: p.department,
   designation: p.designation, deskLocation: p.deskLocation,
 };
}

export async function getFullOfficeProfile(shortcode: string, ownerId: string): Promise<unknown | null> {
 const qr = await SafeQR.findByShortcode(shortcode);
 if (!qr || qr.mode !== 'office' || qr.ownerId !== ownerId) return null;
 return { ...qr.profile, shortcode: qr.shortcode, qrId: qr.qrId, stats: qr.stats };
}

export async function updateOfficeProfile(shortcode: string, ownerId: string, updates: UpdateOfficeProfileInput): Promise<SafeQR | null> {
 const qr = await SafeQR.findByShortcode(shortcode);
 if (!qr || qr.mode !== 'office' || qr.ownerId !== ownerId) return null;
 qr.profile = { ...qr.profile, ...updates };
 qr.updatedAt = new Date();
 await qr.save();
 return qr;
}
