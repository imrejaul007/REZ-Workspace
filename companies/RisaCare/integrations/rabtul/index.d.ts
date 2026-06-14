export declare const RABTUL_SERVICES: {
    readonly AUTH: string;
    readonly PAYMENT: string;
    readonly WALLET: string;
    readonly NOTIFY: string;
    readonly BOOKING: string;
    readonly PROFILE: string;
};
export interface AuthUser {
    userId: string;
    email: string;
    phone?: string;
    name?: string;
    createdAt: string;
}
export declare function verifyUserToken(token: string): Promise<AuthUser | null>;
export declare function sendOTP(phone: string): Promise<{
    success: boolean;
    messageId?: string;
}>;
export declare function verifyOTP(phone: string, otp: string): Promise<{
    success: boolean;
    token?: string;
    userId?: string;
}>;
export declare function registerUser(email: string, phone: string, name?: string): Promise<{
    success: boolean;
    userId?: string;
}>;
export interface WalletBalance {
    userId: string;
    balance: number;
    coins: number;
    currency: string;
}
export declare function getWalletBalance(userId: string): Promise<WalletBalance | null>;
export declare function addCoins(userId: string, amount: number, reason: string): Promise<{
    transactionId: string;
    newBalance: number;
} | null>;
export declare function deductCoins(userId: string, amount: number, reason: string): Promise<{
    transactionId: string;
    newBalance: number;
} | null>;
export interface Transaction {
    id: string;
    type: 'credit' | 'debit';
    amount: number;
    reason: string;
    createdAt: string;
}
export declare function getTransactions(userId: string, limit?: number): Promise<{
    transactions: Transaction[];
    total: number;
} | null>;
export interface PaymentResult {
    paymentId: string;
    amount: number;
    currency: string;
    status: 'pending' | 'completed' | 'failed';
    method: string;
}
export declare function createPayment(userId: string, amount: number, orderId: string): Promise<PaymentResult | null>;
export declare function verifyPayment(paymentId: string): Promise<{
    valid: boolean;
    amount?: number;
    status?: string;
} | null>;
export declare function refundPayment(paymentId: string, amount?: number): Promise<{
    success: boolean;
    refundId?: string;
} | null>;
export type NotificationChannel = 'push' | 'sms' | 'email' | 'whatsapp';
export interface NotificationPayload {
    userId: string;
    title: string;
    message: string;
    channel: NotificationChannel;
    data?: Record<string, unknown>;
}
export declare function sendNotification(payload: NotificationPayload): Promise<{
    messageId: string;
    channel: NotificationChannel;
}[] | null>;
export declare function sendBulkNotifications(payloads: NotificationPayload[]): Promise<{
    success: number;
    failed: number;
} | null>;
export interface BookingResponse {
    bookingId: string;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    providerType: 'doctor' | 'lab' | 'pharmacy';
    scheduledAt?: string;
}
export declare function createBooking(userId: string, providerId: string, providerType: 'doctor' | 'lab' | 'pharmacy', scheduledAt?: string): Promise<BookingResponse | null>;
export declare function cancelBooking(bookingId: string, reason?: string): Promise<{
    success: boolean;
    refundId?: string;
} | null>;
export interface UserProfile {
    userId: string;
    name: string;
    email: string;
    phone?: string;
    avatar?: string;
    createdAt: string;
    updatedAt: string;
}
export declare function getUserProfile(userId: string): Promise<UserProfile | null>;
export declare function updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null>;
export declare const rabtulClient: {
    auth: {
        verifyToken: typeof verifyUserToken;
        sendOTP: typeof sendOTP;
        verifyOTP: typeof verifyOTP;
        register: typeof registerUser;
    };
    wallet: {
        getBalance: typeof getWalletBalance;
        addCoins: typeof addCoins;
        deductCoins: typeof deductCoins;
        getTransactions: typeof getTransactions;
    };
    payment: {
        create: typeof createPayment;
        verify: typeof verifyPayment;
        refund: typeof refundPayment;
    };
    notification: {
        send: typeof sendNotification;
        sendBulk: typeof sendBulkNotifications;
    };
    booking: {
        create: typeof createBooking;
        cancel: typeof cancelBooking;
    };
    profile: {
        get: typeof getUserProfile;
        update: typeof updateUserProfile;
    };
};
export default rabtulClient;
