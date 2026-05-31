/**
 * Hojai Data Models - Merchant Repository
 * Version: 1.0.0 | Date: May 30, 2026
 */
import { z } from 'zod';
import { Merchant, MerchantCreateSchema, MerchantUpdateSchema, MerchantAddressSchema } from '../entities/merchant';
/**
 * Merchant Repository
 */
export declare class MerchantRepository {
    private merchants;
    create(tenantId: string, data: z.infer<typeof MerchantCreateSchema>): Promise<Merchant>;
    findById(id: string): Promise<Merchant | null>;
    findBySlug(slug: string): Promise<Merchant | null>;
    findByGstin(gstin: string): Promise<Merchant | null>;
    findByPhone(phone: string): Promise<Merchant | null>;
    findByEmail(email: string): Promise<Merchant | null>;
    update(id: string, data: z.infer<typeof MerchantUpdateSchema>): Promise<Merchant | null>;
    delete(id: string): Promise<boolean>;
    addAddress(merchantId: string, addressData: z.infer<typeof MerchantAddressSchema>): Promise<Merchant | null>;
    removeAddress(merchantId: string, addressId: string): Promise<Merchant | null>;
    verify(merchantId: string, verifiedBy: string): Promise<Merchant | null>;
    suspend(merchantId: string): Promise<Merchant | null>;
    reactivate(merchantId: string): Promise<Merchant | null>;
    updateMetrics(merchantId: string, metrics: {
        total_revenue?: number;
        total_orders?: number;
        total_customers?: number;
        rating?: number;
    }): Promise<Merchant | null>;
    findAll(options?: {
        status?: Merchant['status'];
        business_category?: Merchant['business_category'];
        city?: string;
        limit?: number;
        offset?: number;
    }): Promise<Merchant[]>;
    search(query: string): Promise<Merchant[]>;
    getSummary(merchantId: string): Promise<import("..").MerchantSummary | null>;
    getHealth(merchantId: string): Promise<{
        score: number;
        grade: "A" | "B" | "C" | "D" | "F";
        factors: {
            factor: string;
            impact: number;
            description: string;
        }[];
    } | null>;
    count(): Promise<{
        total: number;
        active: number;
        pending: number;
        suspended: number;
    }>;
}
//# sourceMappingURL=merchant-repository.d.ts.map