import { SafeQR } from '../models';

/**
 * Ownership Service
 * Verifies ownership of Safe QR codes
 */

export interface OwnershipResult {
 isOwner: boolean;
 qr?: unknown;
 error?: string;
}

/**
 * Verify if user is the owner of a QR
 */
export async function verifyOwnership(
 shortcode: string,
 userId: string
): Promise<OwnershipResult> {
 try {
   const qr = await SafeQR.findByShortcode(shortcode);
   if (!qr) {
     return {
       isOwner: false,
       error: 'QR not found',
     };
   }

   if (qr.ownerId !== userId) {
     return {
       isOwner: false,
       error: 'Not the owner',
     };
   }

   return {
     isOwner: true,
     qr,
   };
 } catch (error) {
   const errorMessage = error instanceof Error ? error.message : 'Unknown error';
   return {
     isOwner: false,
     error: `Verification failed: ${errorMessage}`,
   };
 }
}

/**
 * Verify if user is the owner by QR ID
 */
export async function verifyOwnershipById(
 qrId: string,
 userId: string
): Promise<OwnershipResult> {
 try {
   const qr = await SafeQR.findOne({ qrId });
   if (!qr) {
     return {
       isOwner: false,
       error: 'QR not found',
     };
   }

   if (qr.ownerId !== userId) {
     return {
       isOwner: false,
       error: 'Not the owner',
     };
   }

   return {
     isOwner: true,
     qr,
   };
 } catch (error) {
   const errorMessage = error instanceof Error ? error.message : 'Unknown error';
   return {
     isOwner: false,
     error: `Verification failed: ${errorMessage}`,
   };
 }
}

/**
 * Check if QR is accessible (owner or shared)
 */
export async function checkAccess(
 shortcode: string,
 userId: string
): Promise<{ hasAccess: boolean; role: 'owner' | 'helper' | 'none'; qr?: unknown; error?: string }> {
 try {
   const qr = await SafeQR.findByShortcode(shortcode);
   if (!qr) {
     return { hasAccess: false, role: 'none', error: 'QR not found' };
   }

   if (qr.ownerId === userId) {
     return { hasAccess: true, role: 'owner', qr };
   }

   // Add helper role check if needed
   // For now, only owner has access

   return { hasAccess: false, role: 'none' };
 } catch (error) {
   const errorMessage = error instanceof Error ? error.message : 'Unknown error';
   return { hasAccess: false, role: 'none', error: `Access check failed: ${errorMessage}` };
 }
}

/**
 * Transfer ownership of a QR
 */
export async function transferOwnership(
 shortcode: string,
 currentOwnerId: string,
 newOwnerId: string
): Promise<{ success: boolean; error?: string }> {
 const result = await verifyOwnership(shortcode, currentOwnerId);
 if (!result.isOwner) {
   return {
     success: false,
     error: result.error || 'Not authorized',
   };
 }

 try {
   const updated = await SafeQR.findOneAndUpdate(
     { shortcode },
     { ownerId: newOwnerId }
   );

   if (!updated) {
     return { success: false, error: 'Failed to update ownership - QR not found' };
   }

   return { success: true };
 } catch (error) {
   const errorMessage = error instanceof Error ? error.message : 'Unknown error';
   return { success: false, error: `Transfer failed: ${errorMessage}` };
 }
}

/**
 * Get QRs owned by user
 */
export async function getUserQRs(userId: string) {
 return SafeQR.findByOwner(userId);
}

/**
 * Count QRs owned by user
 */
export async function countUserQRs(userId: string): Promise<number> {
 return SafeQR.countDocuments({ ownerId: userId });
}

/**
 * Check if user can create more QRs (limit per user)
 */
export async function canCreateMoreQRs(
 userId: string,
 maxQrs: number = 10
): Promise<boolean> {
 const count = await countUserQRs(userId);
 return count < maxQrs;
}
