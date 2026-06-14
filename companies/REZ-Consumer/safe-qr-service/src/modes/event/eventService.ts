import { SafeQR } from '../../shared/models';
import { generateShortcodeSuffix, generateQRId } from '../../shared/services/qrParser';
import { SafeQRMode } from '../../shared/schemas/safeQR';

/**
 * Event Mode Service
 */

export interface CreateEventQRInput {
 ownerId: string;
 profile: {
   eventName: string;
   eventDate: string;
   eventEndDate?: string;
   venue: string;
   organizerName?: string;
   organizerContact?: string;
   lostChildStation?: string;
   medicalTent?: string;
   securityContact?: string;
   parkingInfo?: string;
   attendees?: Array<{
     userId?: string;
     name: string;
     ticketType?: string;
     ticketId?: string;
     emergencyContact?: string;
     medicalNotes?: string;
     isMinor?: boolean;
     parentContact?: string;
   }>;
   maxAttendees?: number;
 };
 expiresAt?: Date;
}

export interface UpdateEventProfileInput {
 eventName?: string;
 eventDate?: string;
 eventEndDate?: string;
 venue?: string;
 organizerName?: string;
 organizerContact?: string;
 lostChildStation?: string;
 medicalTent?: string;
 securityContact?: string;
 parkingInfo?: string;
 maxAttendees?: number;
}

/**
 * Create a new Event Safe QR
 */
export async function createEventQR(input: CreateEventQRInput): Promise<SafeQR> {
 const shortcode = `REZE${generateShortcodeSuffix()}`;
 const qrId = generateQRId('event' as SafeQRMode);

 const expiresAt = input.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

 const qr = new SafeQR({
   shortcode, qrId, mode: 'event', ownerId: input.ownerId, status: 'active',
   profile: { mode: 'event', ...input.profile },
   settings: { allowMessages: true, allowContactRequests: true, notifyOnScan: true, requireApproval: false },
   qrPayload: { v: 1, type: 'safe', mode: 'event', id: qrId, shortcode },
   stats: { totalScans: 0, uniqueScanners: 0, totalMessages: 0 },
   karma: { isRegistered: true },
   expiresAt,
 });

 await qr.save();
 return qr;
}

export async function getPublicEventProfile(shortcode: string): Promise<unknown | null> {
 const qr = await SafeQR.findByShortcode(shortcode);
 if (!qr || qr.mode !== 'event') return null;
 const p = qr.profile as unknown;
 return {
   shortcode: qr.shortcode, mode: qr.mode, eventName: p.eventName, venue: p.venue,
   eventDate: p.eventDate, lostChildStation: p.lostChildStation, medicalTent: p.medicalTent,
 };
}

export async function getFullEventProfile(shortcode: string, ownerId: string): Promise<unknown | null> {
 const qr = await SafeQR.findByShortcode(shortcode);
 if (!qr || qr.mode !== 'event' || qr.ownerId !== ownerId) return null;
 return { ...qr.profile, shortcode: qr.shortcode, qrId: qr.qrId, stats: qr.stats, expiresAt: qr.expiresAt };
}

export async function updateEventProfile(shortcode: string, ownerId: string, updates: UpdateEventProfileInput): Promise<SafeQR | null> {
 const qr = await SafeQR.findByShortcode(shortcode);
 if (!qr || qr.mode !== 'event' || qr.ownerId !== ownerId) return null;
 qr.profile = { ...qr.profile, ...updates };
 qr.updatedAt = new Date();
 await qr.save();
 return qr;
}

export async function addEventAttendee(shortcode: string, ownerId: string, attendee: {
 name: string; ticketType?: string; ticketId?: string; emergencyContact?: string; isMinor?: boolean;
}): Promise<SafeQR | null> {
 const qr = await SafeQR.findByShortcode(shortcode);
 if (!qr || qr.mode !== 'event' || qr.ownerId !== ownerId) return null;
 const profile = qr.profile as unknown;
 if (!profile.attendees) profile.attendees = [];
 profile.attendees.push({ ...attendee, checkedIn: false });
 qr.profile = profile;
 qr.updatedAt = new Date();
 await qr.save();
 return qr;
}

export async function checkInAttendee(shortcode: string, ownerId: string, ticketId: string): Promise<SafeQR | null> {
 const qr = await SafeQR.findByShortcode(shortcode);
 if (!qr || qr.mode !== 'event' || qr.ownerId !== ownerId) return null;
 const profile = qr.profile as unknown;
 const attendee = profile.attendees?.find((a) => a.ticketId === ticketId);
 if (attendee) {
   attendee.checkedIn = true;
   attendee.checkedInAt = new Date();
 }
 qr.profile = profile;
 qr.updatedAt = new Date();
 await qr.save();
 return qr;
}
