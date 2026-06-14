import { z } from 'zod';
export const phoneSchema = z.string().min(13).max(13);
export const objectIdSchema = z.string().length(24);
export const currencySchema = z.enum(['INR', 'COINS']);
export const geoCoordsSchema = z.object({ lat: z.number(), lng: z.number() });
export const userStatusSchema = z.enum(['active', 'inactive', 'suspended', 'deleted']);
export const userRoleSchema = z.enum(['user', 'merchant', 'admin', 'super_admin']);
export const userProfileSchema = z.object({ firstName: z.string().optional(), lastName: z.string().optional(), avatar: z.string().url().optional() });
export const userAuthSchema = z.object({ email: z.string().email().optional(), emailVerified: z.boolean(), phoneVerified: z.boolean(), twoFactorEnabled: z.boolean() });
export const userWalletSchema = z.object({ walletId: objectIdSchema, balance: z.number().min(0), currency: currencySchema, isActive: z.boolean() });
export const UserSchema = z.object({ _id: objectIdSchema, phoneNumber: phoneSchema, profile: userProfileSchema, auth: userAuthSchema, wallet: userWalletSchema, role: userRoleSchema, status: userStatusSchema, createdAt: z.string().datetime() });
export const merchantVerifStatusSchema = z.enum(['pending', 'submitted', 'under_review', 'verified', 'rejected']);
export const merchantOnboardingSchema = z.object({ bankDetailsCompleted: z.boolean(), documentsCompleted: z.boolean(), agreementSigned: z.boolean(), kycCompleted: z.boolean() });
export const merchantAddressSchema = z.object({ street: z.string().optional(), city: z.string().optional(), state: z.string().optional(), pincode: z.string().optional(), coordinates: geoCoordsSchema.optional() });
export const storeLocationSchema = z.object({ type: z.enum(['home', 'store', 'pickup_point']), address: merchantAddressSchema, isDefault: z.boolean() });
export const storeRatingsSchema = z.object({ average: z.number().min(0).max(5), count: z.number().int().min(0) });
export const storeCapabilitiesSchema = z.object({ delivery: z.boolean(), pickup: z.boolean(), dineIn: z.boolean(), catering: z.boolean() });
export const StoreSchema = z.object({ storeId: objectIdSchema, merchantId: objectIdSchema, businessName: z.string(), location: storeLocationSchema, ratings: storeRatingsSchema.optional(), serviceCapabilities: storeCapabilitiesSchema, isActive: z.boolean(), createdAt: z.string().datetime() });
export const MerchantSchema = z.object({ _id: objectIdSchema, businessName: z.string(), ownerName: z.string(), email: z.string().email(), phone: phoneSchema, businessAddress: merchantAddressSchema, verificationStatus: merchantVerifStatusSchema, isActive: z.boolean(), onboarding: merchantOnboardingSchema.optional(), createdAt: z.string().datetime() });
export const orderStatusSchema = z.enum(['placed', 'confirmed', 'preparing', 'ready', 'dispatched', 'out_for_delivery', 'delivered', 'cancelled', 'cancelling', 'returned', 'refunded']);
export const orderItemSchema = z.object({ itemId: objectIdSchema, name: z.string(), quantity: z.number().int().positive(), price: z.number().positive() });
export const orderTotalsSchema = z.object({ subtotal: z.number().min(0), tax: z.number().min(0), deliveryFee: z.number().min(0), coinDiscount: z.number().min(0), couponDiscount: z.number().min(0), total: z.number().min(0) });
export const orderPaymentSchema = z.object({ method: z.enum(['upi', 'card', 'netbanking', 'wallet', 'cod', 'coins']), amount: z.number().positive(), currency: currencySchema, status: z.enum(['pending', 'completed', 'failed', 'refunded']) });
export const OrderSchema = z.object({ _id: objectIdSchema, orderNumber: z.string(), userId: objectIdSchema, merchantId: objectIdSchema, storeId: objectIdSchema, items: z.array(orderItemSchema).min(1), totals: orderTotalsSchema, status: orderStatusSchema, payment: orderPaymentSchema, createdAt: z.string().datetime() });
export const walletBalSchema = z.object({ entityType: z.enum(['user', 'merchant']), entityId: objectIdSchema, available: z.number().min(0), locked: z.number().min(0), currency: currencySchema });
export const walletStatsSchema = z.object({ totalEarned: z.number().min(0), totalSpent: z.number().min(0), totalWithdrawn: z.number().min(0), transactionCount: z.number().int().min(0) });
export const WalletSchema = z.object({ walletId: objectIdSchema, entityType: z.enum(['user', 'merchant']), entityId: objectIdSchema, balance: z.number().min(0), currency: currencySchema, isActive: z.boolean(), balances: z.array(walletBalSchema).optional(), statistics: walletStatsSchema.optional(), createdAt: z.string().datetime() });
export const MerchantWalletSchema = z.object({ walletId: objectIdSchema, merchantId: objectIdSchema, balance: z.number().min(0), pendingBalance: z.number().min(0), currency: currencySchema, isActive: z.boolean(), bankAccount: z.object({ accountHolderName: z.string(), accountNumber: z.string(), ifsc: z.string(), bankName: z.string(), isVerified: z.boolean() }).optional(), createdAt: z.string().datetime() });
export const PaymentSchema = z.object({ paymentId: objectIdSchema, entityType: z.enum(['user', 'merchant']), entityId: objectIdSchema, amount: z.number().positive(), currency: currencySchema, type: z.enum(['credit', 'debit']), method: z.enum(['upi', 'card', 'wallet', 'netbanking']), status: z.enum(['pending', 'processing', 'completed', 'failed', 'cancelled', 'expired', 'refund_initiated', 'refund_processing', 'refunded', 'refund_failed', 'partially_refunded']), gateway: z.enum(['razorpay', 'phonepe', 'cashfree']).optional(), metadata: z.record(z.unknown()).optional(), createdAt: z.string().datetime() });
export const paginationSchema = z.object({ page: z.number().int().positive(), limit: z.number().int().positive(), total: z.number().int().min(0), totalPages: z.number().int().positive(), hasNext: z.boolean().optional(), hasPrev: z.boolean().optional() });
export const ApiResponseSchema = z.object({ success: z.boolean(), message: z.string().optional(), data: z.unknown().optional(), error: z.string().optional(), timestamp: z.string().datetime().optional(), pagination: paginationSchema.optional() });
export const PaginatedResponseSchema = z.object({ success: z.boolean(), message: z.string().optional(), data: z.object({ items: z.array(z.unknown()), pagination: paginationSchema }) });
export function validateUser(data) { return UserSchema.safeParse(data); }
export function validateMerchant(data) { return MerchantSchema.safeParse(data); }
export function validateStore(data) { return StoreSchema.safeParse(data); }
export function validateOrder(data) { return OrderSchema.safeParse(data); }
export function validateWallet(data) { return WalletSchema.safeParse(data); }
export function validateMerchantWallet(data) { return MerchantWalletSchema.safeParse(data); }
export function validatePayment(data) { return PaymentSchema.safeParse(data); }
export function validateApiResponse(data) { return ApiResponseSchema.safeParse(data); }
export function validatePaginatedResponse(data) { return PaginatedResponseSchema.safeParse(data); }
