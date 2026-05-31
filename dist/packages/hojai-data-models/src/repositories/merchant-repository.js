/**
 * Hojai Data Models - Merchant Repository
 * Version: 1.0.0 | Date: May 30, 2026
 */
import { createMerchant, addMerchantAddress, updateMerchantMetrics, verifyMerchant, suspendMerchant, reactivateMerchant, getMerchantSummary, calculateMerchantHealth, } from '../entities/merchant';
/**
 * Merchant Repository
 */
export class MerchantRepository {
    merchants = new Map();
    // ========== CRUD ==========
    async create(tenantId, data) {
        const merchant = createMerchant(tenantId, data);
        this.merchants.set(merchant.id, merchant);
        return merchant;
    }
    async findById(id) {
        return this.merchants.get(id) || null;
    }
    async findBySlug(slug) {
        for (const merchant of this.merchants.values()) {
            if (merchant.slug === slug)
                return merchant;
        }
        return null;
    }
    async findByGstin(gstin) {
        for (const merchant of this.merchants.values()) {
            if (merchant.gstin === gstin)
                return merchant;
        }
        return null;
    }
    async findByPhone(phone) {
        for (const merchant of this.merchants.values()) {
            if (merchant.phone === phone)
                return merchant;
        }
        return null;
    }
    async findByEmail(email) {
        for (const merchant of this.merchants.values()) {
            if (merchant.email === email)
                return merchant;
        }
        return null;
    }
    async update(id, data) {
        const merchant = this.merchants.get(id);
        if (!merchant)
            return null;
        const updated = {
            ...merchant,
            ...data,
            updated_at: new Date().toISOString(),
        };
        this.merchants.set(id, updated);
        return updated;
    }
    async delete(id) {
        return this.merchants.delete(id);
    }
    // ========== ADDRESSES ==========
    async addAddress(merchantId, addressData) {
        const merchant = this.merchants.get(merchantId);
        if (!merchant)
            return null;
        const updated = addMerchantAddress(merchant, addressData);
        this.merchants.set(merchantId, updated);
        return updated;
    }
    async removeAddress(merchantId, addressId) {
        const merchant = this.merchants.get(merchantId);
        if (!merchant)
            return null;
        merchant.addresses = merchant.addresses.filter(a => a.id !== addressId);
        merchant.updated_at = new Date().toISOString();
        this.merchants.set(merchantId, merchant);
        return merchant;
    }
    // ========== STATUS ==========
    async verify(merchantId, verifiedBy) {
        const merchant = this.merchants.get(merchantId);
        if (!merchant)
            return null;
        const verified = verifyMerchant(merchant, verifiedBy);
        this.merchants.set(merchantId, verified);
        return verified;
    }
    async suspend(merchantId) {
        const merchant = this.merchants.get(merchantId);
        if (!merchant)
            return null;
        const suspended = suspendMerchant(merchant);
        this.merchants.set(merchantId, suspended);
        return suspended;
    }
    async reactivate(merchantId) {
        const merchant = this.merchants.get(merchantId);
        if (!merchant)
            return null;
        const reactivated = reactivateMerchant(merchant);
        this.merchants.set(merchantId, reactivated);
        return reactivated;
    }
    // ========== METRICS ==========
    async updateMetrics(merchantId, metrics) {
        const merchant = this.merchants.get(merchantId);
        if (!merchant)
            return null;
        const updated = updateMerchantMetrics(merchant, metrics);
        this.merchants.set(merchantId, updated);
        return updated;
    }
    // ========== QUERIES ==========
    async findAll(options) {
        let results = Array.from(this.merchants.values());
        if (options?.status) {
            results = results.filter(m => m.status === options.status);
        }
        if (options?.business_category) {
            results = results.filter(m => m.business_category === options.business_category);
        }
        if (options?.city) {
            results = results.filter(m => m.addresses.some(a => a.city.toLowerCase().includes(options.city.toLowerCase())));
        }
        // Sort by created_at desc
        results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        const offset = options?.offset || 0;
        const limit = options?.limit || 100;
        return results.slice(offset, offset + limit);
    }
    async search(query) {
        const lowerQuery = query.toLowerCase();
        const results = Array.from(this.merchants.values()).filter(m => m.name.toLowerCase().includes(lowerQuery) ||
            m.email.toLowerCase().includes(lowerQuery) ||
            m.phone.includes(query) ||
            m.slug.includes(lowerQuery) ||
            m.gstin?.includes(query) ||
            m.tags.some(t => t.toLowerCase().includes(lowerQuery)) ||
            m.categories.some(c => c.toLowerCase().includes(lowerQuery)));
        return results;
    }
    // ========== SUMMARY ==========
    async getSummary(merchantId) {
        const merchant = this.merchants.get(merchantId);
        if (!merchant)
            return null;
        return getMerchantSummary(merchant);
    }
    async getHealth(merchantId) {
        const merchant = this.merchants.get(merchantId);
        if (!merchant)
            return null;
        return calculateMerchantHealth(merchant);
    }
    // ========== STATS ==========
    async count() {
        const all = Array.from(this.merchants.values());
        return {
            total: all.length,
            active: all.filter(m => m.status === 'active').length,
            pending: all.filter(m => m.status === 'pending').length,
            suspended: all.filter(m => m.status === 'suspended').length,
        };
    }
}
//# sourceMappingURL=merchant-repository.js.map