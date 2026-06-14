import { rezMind } from '../../integrations/rezIntelligence';

/**
 * Spam Detection Service
 * Checks messages for spam/abuse before sending
 */

// Basic spam patterns for local check (fallback)
const SPAM_PATTERNS = [
 /\b(viagra|cialis|casino|lottery|winner|congratulations)\b/i,
 /\b(click here|act now|limited time|free money)\b/i,
 /\b(earn \$|make money|work from home)\b/i,
 /https?:\/\/[^\s]+/gi, // URLs (could be legitimate)
];

const ABUSE_PATTERNS = [
 /\b(f+u+c+k+|sh*i*t+|a+s+s+h+o+l+e+)\b/i,
];

const SUSPICIOUS_PATTERNS = [
 /(.)\1{5,}/, // Repeated characters
 /^[A-Z\s]{50,}$/, // All caps long text
 /[0-9]{10,}/, // Long number sequences (phone numbers)
];

/**
 * Check if content is spam
 */
export async function checkSpam(content: string): Promise<boolean> {
 // First try REZ-Mind
 try {
   const isSpam = await rezMind.checkSpam(content);
   if (isSpam) return true;
 } catch {
   // Fall through to local check
 }

 // Local basic check
 return localSpamCheck(content);
}

/**
 * Check if content is abusive
 */
export async function checkAbuse(content: string): Promise<boolean> {
 // Check for abuse patterns
 for (const pattern of ABUSE_PATTERNS) {
   if (pattern.test(content)) {
     return true;
   }
 }
 return false;
}

/**
 * Local spam check (fallback when REZ-Mind unavailable)
 */
function localSpamCheck(content: string): boolean {
 // Check spam patterns
 for (const pattern of SPAM_PATTERNS) {
   if (pattern.test(content)) {
     // Allow URLs but flag other spam patterns
     if (!pattern.toString().includes('https?://')) {
       return true;
     }
   }
 }

 // Check suspicious patterns
 for (const pattern of SUSPICIOUS_PATTERNS) {
   if (pattern.test(content)) {
     return true;
   }
 }

 return false;
}

/**
 * Get spam confidence score
 */
export function getSpamScore(content: string): number {
 let score = 0;

 // Check spam patterns
 for (const pattern of SPAM_PATTERNS) {
   if (pattern.test(content)) score += 30;
 }

 // Check abuse patterns
 for (const pattern of ABUSE_PATTERNS) {
   if (pattern.test(content)) score += 50;
 }

 // Check suspicious patterns
 for (const pattern of SUSPICIOUS_PATTERNS) {
   if (pattern.test(content)) score += 20;
 }

 // Cap at 100
 return Math.min(100, score);
}

/**
 * Check if content contains personal contact info
 */
export function containsContactInfo(content: string): boolean {
 // Phone number patterns
 const phonePatterns = [
   /\b\d{10}\b/, // 10 digit
   /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/, // Formatted
   /\+\d{1,3}[-.\s]?\d{1,14}\b/, // International
 ];

 // Email pattern
 const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/i;

 for (const pattern of phonePatterns) {
   if (pattern.test(content)) return true;
 }

 if (emailPattern.test(content)) return true;

 return false;
}

/**
 * Sanitize content for display
 */
export function sanitizeContent(content: string): string {
 // Remove excessive whitespace
 let sanitized = content.replace(/\s+/g, ' ').trim();

 // Truncate if too long
 if (sanitized.length > 500) {
   sanitized = sanitized.substring(0, 500) + '...';
 }

 return sanitized;
}
