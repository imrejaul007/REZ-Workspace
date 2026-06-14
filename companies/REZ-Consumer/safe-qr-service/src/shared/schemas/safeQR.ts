import { z } from 'zod';

// ==========================================
// SAFE QR MODE TYPES
// ==========================================

export const SafeQRMode = z.enum([
 'pet',
 'personal',
 'device',
 'medical',
 'helmet',
 'child',
 'vehicle',
 'bicycle',
 'key',
 'luggage',
 'home',
 'office',
 'event',
 'student',
 'package',
]);
export type SafeQRMode = z.infer<typeof SafeQRMode>;

export const SafeQRStatus = z.enum(['active', 'lost', 'inactive']);
export type SafeQRStatus = z.infer<typeof SafeQRStatus>;

// ==========================================
// QR PAYLOAD SCHEMA (Encoded in QR code)
// ==========================================

export const SafeQRPayload = z.object({
 v: z.literal(1),
 type: z.literal('safe'),
 mode: SafeQRMode,
 id: z.string().min(1),
 shortcode: z.string().length(6),
});
export type SafeQRPayload = z.infer<typeof SafeQRPayload>;

// ==========================================
// QR SETTINGS SCHEMA
// ==========================================

export const SafeQRSettings = z.object({
 allowMessages: z.boolean().default(true),
 allowContactRequests: z.boolean().default(true),
 shareLocationOnScan: z.boolean().default(false),
 notifyOnScan: z.boolean().default(true),
 autoActivateLost: z.boolean().default(false),
 requireApproval: z.boolean().default(true),
});
export type SafeQRSettings = z.infer<typeof SafeQRSettings>;

// ==========================================
// QR STATS SCHEMA
// ==========================================

export const SafeQRStats = z.object({
 totalScans: z.number().default(0),
 uniqueScanners: z.number().default(0),
 totalMessages: z.number().default(0),
 lastScanAt: z.date().optional(),
});
export type SafeQRStats = z.infer<typeof SafeQRStats>;

// ==========================================
// FULL QR DOCUMENT SCHEMA
// ==========================================

export const SafeQRSchema = z.object({
 shortcode: z.string().length(6),
 qrId: z.string().min(1),
 mode: SafeQRMode,
 ownerId: z.string().min(1),
 status: SafeQRStatus.default('active'),
 profile: z.record(z.unknown()).default({}),
 settings: SafeQRSettings.default({}),
 qrPayload: SafeQRPayload,
 stats: SafeQRStats.default({}),
 karma: z.object({
   isRegistered: z.boolean().default(false),
   feedPostId: z.string().optional(),
 }).default({}),
 lostModeActivatedAt: z.date().optional(),
 createdAt: z.date().default(() => new Date()),
 updatedAt: z.date().default(() => new Date()),
 expiresAt: z.date().optional().nullable(),
});
export type SafeQRSchema = z.infer<typeof SafeQRSchema>;

// ==========================================
// SHORTCODE GENERATOR
// ==========================================

const MODE_PREFIXES: Record<SafeQRMode, string> = {
 pet: 'REZP',
 personal: 'REZN',
 device: 'REZD',
 medical: 'REZM',
 helmet: 'REZH',
 child: 'REZC',
 vehicle: 'REZV',
 bicycle: 'REZB',
 key: 'REZK',
 luggage: 'REZL',
 home: 'REZA',
 office: 'REZO',
 event: 'REZE',
 student: 'REZS',
 package: 'REZP',
};

/**
 * Generate a unique shortcode for a mode
 */
export function generateShortcode(mode: SafeQRMode, randomSuffix: string): string {
 const prefix = MODE_PREFIXES[mode];
 const suffix = randomSuffix.substring(0, 2).toUpperCase();
 return `${prefix}${suffix}`;
}

/**
 * Parse a shortcode to extract mode and identifier
 */
export function parseShortcode(shortcode: string): { prefix: string; suffix: string } | null {
 if (shortcode.length !== 6) return null;
 const prefix = shortcode.substring(0, 4);
 const suffix = shortcode.substring(4);
 return { prefix, suffix };
}

/**
 * Get mode from shortcode prefix
 */
export function getModeFromPrefix(prefix: string): SafeQRMode | null {
 const entry = Object.entries(MODE_PREFIXES).find(([, p]) => p === prefix);
 return entry ? (entry[0] as SafeQRMode) : null;
}
