import { Model } from 'mongoose';
export interface OnboardingSession {
    id: string;
    email: string;
    phone: string;
    status: 'pending' | 'email_verified' | 'phone_verified' | 'completed';
    businessName?: string;
    businessType?: string;
    city?: string;
    emailOtp?: string;
    emailOtpExpiry?: Date;
    phoneOtp?: string;
    phoneOtpExpiry?: Date;
    steps: {
        basicInfo: boolean;
        whatsappConnected: boolean;
        knowledgeAdded: boolean;
        paymentDone: boolean;
    };
    createdAt: Date;
    updatedAt: Date;
}
export declare const OnboardingModel: Model<OnboardingSession>;
export declare class OnboardingService {
    /**
     * Start onboarding - create session
     */
    startOnboarding(params: {
        email: string;
        phone: string;
    }): Promise<{
        sessionId: string;
        nextStep: string;
    }>;
    /**
     * Verify email OTP
     */
    verifyEmailOtp(sessionId: string, otp: string): Promise<{
        verified: boolean;
        nextStep: string;
    }>;
    /**
     * Save business info
     */
    saveBusinessInfo(sessionId: string, params: {
        businessName: string;
        businessType: string;
        city: string;
    }): Promise<{
        saved: boolean;
        nextStep: string;
    }>;
    /**
     * Connect WhatsApp
     */
    connectWhatsApp(sessionId: string, params: {
        whatsappNumber: string;
    }): Promise<{
        connected: boolean;
        webhookUrl: string;
    }>;
    /**
     * Add initial knowledge base items
     */
    addInitialKnowledge(sessionId: string, items: Array<{
        question: string;
        answer: string;
        category?: string;
        keywords?: string[];
    }>): Promise<{
        added: number;
        nextStep: string;
    }>;
    /**
     * Create subscription (payment)
     */
    createSubscription(sessionId: string, plan: 'trial' | 'starter'): Promise<{
        subscriptionId: string;
        checkoutUrl?: string;
    }>;
    /**
     * Complete onboarding
     */
    completeOnboarding(sessionId: string): Promise<{
        merchantId: string;
        apiKey: string;
        webhookUrl: string;
    }>;
    /**
     * Resend email OTP
     */
    resendEmailOtp(sessionId: string): Promise<void>;
    /**
     * Send email OTP
     */
    private sendEmailOtp;
    /**
     * Get onboarding status
     */
    getStatus(sessionId: string): Promise<{
        status: string;
        steps: Record<string, boolean>;
        nextStep: string;
        progress: number;
    }>;
    /**
     * Get next step based on current state
     */
    private getNextStep;
    /**
     * Get onboarding templates by business type
     */
    getKnowledgeTemplates(businessType: string): Array<{
        category: string;
        question: string;
        answer: string;
    }>;
}
export declare const onboardingService: OnboardingService;
//# sourceMappingURL=onboardingService.d.ts.map