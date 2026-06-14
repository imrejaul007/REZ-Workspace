import { UserTrustScore } from '../models';
import { config } from '../../config';

/**
 * Rate Limit Service
 * Manages rate limiting and abuse prevention
 */

interface RateLimitResult {
 allowed: boolean;
 remaining: number;
 resetAt: Date;
 retryAfter?: number;
}

interface RateLimitConfig {
 maxPerHour: number;
 maxPerDay: number;
 windowMs: number;
}

/**
 * Check rate limit for a user
 */
export async function checkRateLimit(
 userId: string,
 type: 'message' | 'contact' | 'scan'
): Promise<RateLimitResult> {
 const baseConfig = getBaseConfig(type);
 const trustScore = await UserTrustScore.findOrCreate(userId);

 // Adjust limits based on trust score
 const effectiveMaxPerHour = trustScore.getEffectiveRateLimit(baseConfig.maxPerHour);

 // Get current counts from Redis or DB
 const counts = await getCurrentCounts(userId, type);
 const currentHourly = counts.hourly || 0;

 if (currentHourly >= effectiveMaxPerHour) {
   return {
     allowed: false,
     remaining: 0,
     resetAt: getNextReset(),
     retryAfter: getSecondsUntilReset(),
   };
 }

 return {
   allowed: true,
   remaining: effectiveMaxPerHour - currentHourly,
   resetAt: getNextReset(),
 };
}

/**
 * Record an action for rate limiting
 */
export async function recordAction(
 userId: string,
 type: 'message' | 'contact' | 'scan'
): Promise<void> {
 // In production, use Redis for this
 // For now, we'll use in-memory storage with UserTrustScore

 const now = new Date();

 // Update rate limit counters
 const trustScore = await UserTrustScore.findOrCreate(userId);

 if (type === 'message') {
   trustScore.rateLimits.messagesPerHour += 1;
 } else if (type === 'contact') {
   trustScore.rateLimits.contactsPerDay += 1;
 }

 await trustScore.save();

 // Reset counters if window passed (simplified)
 await resetIfNeeded(userId);
}

/**
 * Check if user is blocked
 */
export async function isUserBlocked(userId: string): Promise<boolean> {
 const trustScore = await UserTrustScore.findOrCreate(userId);
 return trustScore.isBlocked();
}

/**
 * Block a user temporarily
 */
export async function blockUser(
 userId: string,
 durationMs: number = 24 * 60 * 60 * 1000
): Promise<void> {
 const trustScore = await UserTrustScore.findOrCreate(userId);
 trustScore.rateLimits.blockedUntil = new Date(Date.now() + durationMs);
 await trustScore.save();
}

/**
 * Get base rate limit config
 */
function getBaseConfig(type: 'message' | 'contact' | 'scan'): RateLimitConfig {
 switch (type) {
   case 'message':
     return {
       maxPerHour: config.rateLimits.messagesPerHour,
       maxPerDay: config.rateLimits.messagesPerDay,
       windowMs: 60 * 60 * 1000,
     };
   case 'contact':
     return {
       maxPerHour: config.rateLimits.contactsPerHour,
       maxPerDay: config.rateLimits.contactsPerHour * 24,
       windowMs: 60 * 60 * 1000,
     };
   case 'scan':
     return {
       maxPerHour: config.rateLimits.scansPerHour,
       maxPerDay: config.rateLimits.scansPerHour * 24,
       windowMs: 60 * 60 * 1000,
     };
   default:
     return {
       maxPerHour: 5,
       maxPerDay: 20,
       windowMs: 60 * 60 * 1000,
     };
 }
}

/**
 * Get current action counts (simplified - use Redis in production)
 */
async function getCurrentCounts(
 userId: string,
 type: string
): Promise<{ hourly: number; daily: number }> {
 // In production, use Redis for accurate counts
 // For now, return from UserTrustScore

 const trustScore = await UserTrustScore.findOne({ userId });
 if (!trustScore) {
   return { hourly: 0, daily: 0 };
 }

 if (type === 'message') {
   return {
     hourly: trustScore.rateLimits.messagesPerHour,
     daily: trustScore.rateLimits.messagesPerDay,
   };
 }

 return { hourly: 0, daily: 0 };
}

/**
 * Reset counters if window passed
 */
async function resetIfNeeded(userId: string): Promise<void> {
 // In production, use Redis TTL for automatic reset
 // This is a simplified version

 const trustScore = await UserTrustScore.findOne({ userId });
 if (!trustScore) return;

 const now = new Date();
 const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

 // If we've been tracking for more than an hour, reset hourly
 if (trustScore.updatedAt < hourAgo) {
   trustScore.rateLimits.messagesPerHour = 0;
   trustScore.rateLimits.contactsPerDay = 0;
   await trustScore.save();
 }
}

/**
 * Get next reset time
 */
function getNextReset(): Date {
 const now = new Date();
 const nextHour = new Date(now);
 nextHour.setMinutes(59, 59, 999);
 return nextHour;
}

/**
 * Get seconds until reset
 */
function getSecondsUntilReset(): number {
 const nextReset = getNextReset();
 return Math.max(0, Math.floor((nextReset.getTime() - Date.now()) / 1000));
}

/**
 * Check rate limit without user ID (anonymous)
 */
export async function checkAnonymousRateLimit(
 ip: string,
 type: 'scan' | 'message'
): Promise<RateLimitResult> {
 // Use IP-based limiting for anonymous users
 // In production, use Redis with IP as key

 const baseConfig = getBaseConfig(type);
 const maxPerHour = baseConfig.maxPerHour;

 // Simplified - always allow in development
 return {
   allowed: true,
   remaining: maxPerHour,
   resetAt: getNextReset(),
 };
}

/**
 * Record anonymous action
 */
export async function recordAnonymousAction(
 ip: string,
 type: 'scan' | 'message'
): Promise<void> {
 // In production, use Redis with IP-based keys
 // This is a placeholder
}
