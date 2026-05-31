/**
 * RisnaEstate → Hojai AI Real Estate Connector
 * Privacy Tier 2
 */
import axios from 'axios';
export async function emitRealEstateSignals(data) {
    await axios.post(`${process.env.HOJAi_API_URL}/signals/realestate`, {
        userId: data.userId,
        action: data.action,
        propertyType: data.property.type,
        budget: data.property.budget,
        location: data.property.location
    });
}
//# sourceMappingURL=realestate.js.map