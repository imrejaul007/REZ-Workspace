import { Types } from 'mongoose';
import { createServiceLogger } from '../config/logger';
import Notification from '../models/MerchantNotification';

const logger = createServiceLogger('merchant-notification');

/**
 * Merchant Notification Service for the Wallet Microservice.
 *
 * This service handles wallet-related notifications to merchants.
 * It creates in-app notification records and emits socket events.
 *
 * For the wallet service, we only need withdrawal-related notifications.
 * Other notification types (orders, visits, etc.) remain in the monolith
 * since they are orchestrated by cross-domain controllers.
 *
 * FIX: Removed inline Notification schema. Now imports from MerchantNotification model
 * which uses the canonical type/category enums from rezbackend/src/models/Notification.ts.
 * Wallet-specific type values are mapped to canonical values below.
 */

class MerchantNotificationService {
    /**
     * Create a notification record in the database
     */
    private async createNotification(params: {
        merchantId: string;
        title: string;
        message: string;
        type: string;
        category: string;
        priority: string;
        data?;
        actionUrl?: string;
        actionButton?: { text: string; action: string; target: string };
    }) {
        try {
            const notification = await (Notification as unknown).create({
                userId: new Types.ObjectId(params.merchantId),
                userType: 'merchant',
                title: params.title,
                message: params.message,
                type: params.type,
                category: params.category,
                priority: params.priority,
                data: params.data,
                actionUrl: params.actionUrl,
                actionButton: params.actionButton,
            });

            logger.info('Notification created', {
                merchantId: params.merchantId,
                type: params.type,
                notificationId: notification._id,
            });

            return notification;
        } catch (err) {
            logger.error('Failed to create notification', err);
            // Non-fatal — don't throw
        }
    }

    /**
     * Notify merchant about withdrawal status changes
     */
    async notifyWithdrawalStatus(params: {
        merchantId: string;
        withdrawalId: string;
        amount: number;
        status: 'completed' | 'rejected' | 'pending';
        reason?: string;
    }): Promise<void> {
        const statusMessages: Record<string, { title: string; message: string; priority: string }> = {
            completed: {
                title: 'Withdrawal Processed',
                message: `Your withdrawal of ₹${params.amount} has been processed successfully and funds have been transferred to your bank account.`,
                priority: 'high',
            },
            rejected: {
                title: 'Withdrawal Rejected',
                message: `Your withdrawal of ₹${params.amount} has been rejected.${params.reason ? ` Reason: ${params.reason}` : ''} The funds have been returned to your wallet.`,
                priority: 'urgent',
            },
            pending: {
                title: 'Withdrawal Requested',
                message: `Your withdrawal request of ₹${params.amount} has been submitted and is being processed.`,
                priority: 'medium',
            },
        };

        const msg = statusMessages[params.status];
        if (!msg) return;

        await this.createNotification({
            merchantId: params.merchantId,
            title: msg.title,
            message: msg.message,
            type: params.status === 'rejected' ? 'warning' : 'success',
            category: 'general',
            priority: msg.priority,
            data: {
                withdrawalId: params.withdrawalId,
                amount: params.amount,
                status: params.status,
                reason: params.reason,
            },
            actionUrl: '/wallet',
            actionButton: {
                text: 'View Wallet',
                action: 'navigate',
                target: '/wallet',
            },
        });
    }

    /**
     * Notify merchant about payment credited to wallet
     */
    async notifyPaymentCredited(params: {
        merchantId: string;
        orderId: string;
        orderNumber: string;
        amount: number;
        platformFee: number;
        netAmount: number;
    }): Promise<void> {
        await this.createNotification({
            merchantId: params.merchantId,
            title: 'Payment Received',
            message: `₹${params.netAmount} credited to your wallet for order #${params.orderNumber} (₹${params.amount} - ₹${params.platformFee} platform fee).`,
            type: 'success',
            category: 'general',
            priority: 'medium',
            data: {
                orderId: params.orderId,
                orderNumber: params.orderNumber,
                amount: params.amount,
                platformFee: params.platformFee,
                netAmount: params.netAmount,
            },
        });
    }

    /**
     * Notify merchant about refund deducted from wallet
     */
    async notifyRefundDeducted(params: {
        merchantId: string;
        orderId: string;
        orderNumber: string;
        refundAmount: number;
        netDeduction: number;
    }): Promise<void> {
        await this.createNotification({
            merchantId: params.merchantId,
            title: 'Refund Processed',
            message: `₹${params.netDeduction} deducted from your wallet for refund on order #${params.orderNumber}.`,
            type: 'warning',
            category: 'general',
            priority: 'high',
            data: {
                orderId: params.orderId,
                orderNumber: params.orderNumber,
                refundAmount: params.refundAmount,
                netDeduction: params.netDeduction,
            },
            actionUrl: '/wallet',
        });
    }

    /**
     * Notify merchant about low wallet balance
     */
    async notifyLowBalance(params: {
        merchantId: string;
        currentBalance: number;
        threshold: number;
    }): Promise<void> {
        await this.createNotification({
            merchantId: params.merchantId,
            title: 'Low Wallet Balance',
            message: `Your wallet balance is ₹${params.currentBalance}, which is below the ₹${params.threshold} threshold.`,
            type: 'warning',
            category: 'general',
            priority: 'high',
            data: {
                currentBalance: params.currentBalance,
                threshold: params.threshold,
            },
            actionUrl: '/wallet',
        });
    }

    /**
     * Notify merchant about bank details verification
     */
    async notifyBankDetailsVerified(params: { merchantId: string }): Promise<void> {
        await this.createNotification({
            merchantId: params.merchantId,
            title: 'Bank Details Verified',
            message: 'Your bank account details have been verified. You can now request withdrawals.',
            type: 'success',
            category: 'general',
            priority: 'medium',
        });
    }
}

export const merchantNotificationService = new MerchantNotificationService();
export default merchantNotificationService;
