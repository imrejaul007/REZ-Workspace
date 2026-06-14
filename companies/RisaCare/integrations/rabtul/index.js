"use strict";
// RisaCare - RABTUL Services Integration Client
Object.defineProperty(exports, "__esModule", { value: true });
exports.rabtulClient = exports.RABTUL_SERVICES = void 0;
exports.verifyUserToken = verifyUserToken;
exports.sendOTP = sendOTP;
exports.verifyOTP = verifyOTP;
exports.registerUser = registerUser;
exports.getWalletBalance = getWalletBalance;
exports.addCoins = addCoins;
exports.deductCoins = deductCoins;
exports.getTransactions = getTransactions;
exports.createPayment = createPayment;
exports.verifyPayment = verifyPayment;
exports.refundPayment = refundPayment;
exports.sendNotification = sendNotification;
exports.sendBulkNotifications = sendBulkNotifications;
exports.createBooking = createBooking;
exports.cancelBooking = cancelBooking;
exports.getUserProfile = getUserProfile;
exports.updateUserProfile = updateUserProfile;
const utils_1 = require("../../shared/utils");
// ============================================
// CONFIG
// ============================================
exports.RABTUL_SERVICES = {
    AUTH: process.env.AUTH_SERVICE_URL || 'http://localhost:4002',
    PAYMENT: process.env.PAYMENT_SERVICE_URL || 'http://localhost:4001',
    WALLET: process.env.WALLET_SERVICE_URL || 'http://localhost:4004',
    NOTIFY: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4011',
    BOOKING: process.env.BOOKING_SERVICE_URL || 'http://localhost:4020',
    PROFILE: process.env.PROFILE_SERVICE_URL || 'http://localhost:4013'
};
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'dev-internal-token';
async function verifyUserToken(token) {
    try {
        const response = await fetch(`${exports.RABTUL_SERVICES.AUTH}/api/auth/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Internal-Token': INTERNAL_TOKEN
            },
            body: JSON.stringify({ token })
        });
        if (!response.ok)
            return null;
        const data = await response.json();
        return data.user || null;
    }
    catch (error) {
        utils_1.logger.error('Failed to verify user token', error);
        return null;
    }
}
async function sendOTP(phone) {
    try {
        const response = await fetch(`${exports.RABTUL_SERVICES.AUTH}/api/auth/otp/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Internal-Token': INTERNAL_TOKEN
            },
            body: JSON.stringify({ phone })
        });
        const data = await response.json();
        return data;
    }
    catch (error) {
        utils_1.logger.error('Failed to send OTP', error);
        return { success: false };
    }
}
async function verifyOTP(phone, otp) {
    try {
        const response = await fetch(`${exports.RABTUL_SERVICES.AUTH}/api/auth/otp/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Internal-Token': INTERNAL_TOKEN
            },
            body: JSON.stringify({ phone, otp })
        });
        const data = await response.json();
        return data;
    }
    catch (error) {
        utils_1.logger.error('Failed to verify OTP', error);
        return { success: false };
    }
}
async function registerUser(email, phone, name) {
    try {
        const response = await fetch(`${exports.RABTUL_SERVICES.AUTH}/api/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Internal-Token': INTERNAL_TOKEN
            },
            body: JSON.stringify({ email, phone, name })
        });
        const data = await response.json();
        return data;
    }
    catch (error) {
        utils_1.logger.error('Failed to register user', error);
        return { success: false };
    }
}
async function getWalletBalance(userId) {
    try {
        const response = await fetch(`${exports.RABTUL_SERVICES.WALLET}/api/wallet/balance/${userId}`, {
            headers: {
                'X-Internal-Token': INTERNAL_TOKEN
            }
        });
        if (!response.ok)
            return null;
        const data = await response.json();
        return data;
    }
    catch (error) {
        utils_1.logger.error('Failed to get wallet balance', error);
        return null;
    }
}
async function addCoins(userId, amount, reason) {
    try {
        const response = await fetch(`${exports.RABTUL_SERVICES.WALLET}/api/wallet/coins/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Internal-Token': INTERNAL_TOKEN
            },
            body: JSON.stringify({ userId, amount, reason })
        });
        const data = await response.json();
        return data;
    }
    catch (error) {
        utils_1.logger.error('Failed to add coins', error);
        return null;
    }
}
async function deductCoins(userId, amount, reason) {
    try {
        const response = await fetch(`${exports.RABTUL_SERVICES.WALLET}/api/wallet/coins/deduct`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Internal-Token': INTERNAL_TOKEN
            },
            body: JSON.stringify({ userId, amount, reason })
        });
        const data = await response.json();
        return data;
    }
    catch (error) {
        utils_1.logger.error('Failed to deduct coins', error);
        return null;
    }
}
async function getTransactions(userId, limit = 50) {
    try {
        const response = await fetch(`${exports.RABTUL_SERVICES.WALLET}/api/wallet/transactions/${userId}?limit=${limit}`, {
            headers: {
                'X-Internal-Token': INTERNAL_TOKEN
            }
        });
        const data = await response.json();
        return data;
    }
    catch (error) {
        utils_1.logger.error('Failed to get transactions', error);
        return null;
    }
}
async function createPayment(userId, amount, orderId) {
    try {
        const response = await fetch(`${exports.RABTUL_SERVICES.PAYMENT}/api/payments/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Internal-Token': INTERNAL_TOKEN
            },
            body: JSON.stringify({ userId, amount, orderId })
        });
        const data = await response.json();
        return data;
    }
    catch (error) {
        utils_1.logger.error('Failed to create payment', error);
        return null;
    }
}
async function verifyPayment(paymentId) {
    try {
        const response = await fetch(`${exports.RABTUL_SERVICES.PAYMENT}/api/payments/verify/${paymentId}`, {
            headers: {
                'X-Internal-Token': INTERNAL_TOKEN
            }
        });
        const data = await response.json();
        return data;
    }
    catch (error) {
        utils_1.logger.error('Failed to verify payment', error);
        return null;
    }
}
async function refundPayment(paymentId, amount) {
    try {
        const response = await fetch(`${exports.RABTUL_SERVICES.PAYMENT}/api/payments/refund`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Internal-Token': INTERNAL_TOKEN
            },
            body: JSON.stringify({ paymentId, amount })
        });
        const data = await response.json();
        return data;
    }
    catch (error) {
        utils_1.logger.error('Failed to refund payment', error);
        return null;
    }
}
async function sendNotification(payload) {
    try {
        const response = await fetch(`${exports.RABTUL_SERVICES.NOTIFY}/api/notifications/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Internal-Token': INTERNAL_TOKEN
            },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        return data;
    }
    catch (error) {
        utils_1.logger.error('Failed to send notification', error);
        return null;
    }
}
async function sendBulkNotifications(payloads) {
    try {
        const response = await fetch(`${exports.RABTUL_SERVICES.NOTIFY}/api/notifications/bulk`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Internal-Token': INTERNAL_TOKEN
            },
            body: JSON.stringify({ notifications: payloads })
        });
        const data = await response.json();
        return data;
    }
    catch (error) {
        utils_1.logger.error('Failed to send bulk notifications', error);
        return null;
    }
}
async function createBooking(userId, providerId, providerType, scheduledAt) {
    try {
        const response = await fetch(`${exports.RABTUL_SERVICES.BOOKING}/api/bookings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Internal-Token': INTERNAL_TOKEN
            },
            body: JSON.stringify({
                bookingId: (0, utils_1.generateId)('bk'),
                userId,
                providerId,
                providerType,
                scheduledAt
            })
        });
        const data = await response.json();
        return data;
    }
    catch (error) {
        utils_1.logger.error('Failed to create booking', error);
        return null;
    }
}
async function cancelBooking(bookingId, reason) {
    try {
        const response = await fetch(`${exports.RABTUL_SERVICES.BOOKING}/api/bookings/${bookingId}/cancel`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Internal-Token': INTERNAL_TOKEN
            },
            body: JSON.stringify({ reason })
        });
        const data = await response.json();
        return data;
    }
    catch (error) {
        utils_1.logger.error('Failed to cancel booking', error);
        return null;
    }
}
async function getUserProfile(userId) {
    try {
        const response = await fetch(`${exports.RABTUL_SERVICES.PROFILE}/api/profiles/${userId}`, {
            headers: {
                'X-Internal-Token': INTERNAL_TOKEN
            }
        });
        if (!response.ok)
            return null;
        const data = await response.json();
        return data;
    }
    catch (error) {
        utils_1.logger.error('Failed to get user profile', error);
        return null;
    }
}
async function updateUserProfile(userId, updates) {
    try {
        const response = await fetch(`${exports.RABTUL_SERVICES.PROFILE}/api/profiles/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Internal-Token': INTERNAL_TOKEN
            },
            body: JSON.stringify(updates)
        });
        const data = await response.json();
        return data;
    }
    catch (error) {
        utils_1.logger.error('Failed to update user profile', error);
        return null;
    }
}
// ============================================
// EXPORTS
// ============================================
exports.rabtulClient = {
    auth: {
        verifyToken: verifyUserToken,
        sendOTP,
        verifyOTP,
        register: registerUser
    },
    wallet: {
        getBalance: getWalletBalance,
        addCoins,
        deductCoins,
        getTransactions
    },
    payment: {
        create: createPayment,
        verify: verifyPayment,
        refund: refundPayment
    },
    notification: {
        send: sendNotification,
        sendBulk: sendBulkNotifications
    },
    booking: {
        create: createBooking,
        cancel: cancelBooking
    },
    profile: {
        get: getUserProfile,
        update: updateUserProfile
    }
};
exports.default = exports.rabtulClient;
//# sourceMappingURL=index.js.map