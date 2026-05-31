/**
 * REZ Merchant / Rabtul SaaS → Hojai AI Business Connector
 * Privacy Tier 1
 */
import axios from 'axios';
export async function emitBusinessSignals(data) {
    await axios.post(`${process.env.HOJAi_API_URL}/signals/business`, {
        userId: data.userId,
        businessType: data.businessType,
        businessName: data.business.name,
        businessCategory: data.business.category,
        businessSize: data.business.size,
        action: data.action
    });
}
//# sourceMappingURL=merchant.js.map