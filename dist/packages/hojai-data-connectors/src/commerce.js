/**
 * Commerce Apps → Hojai AI Commerce Connector
 * Privacy Tier 1 (Basic)
 */
import axios from 'axios';
export async function emitCommerceSignals(data) {
    await axios.post(`${process.env.HOJAi_API_URL}/signals/commerce`, data);
}
//# sourceMappingURL=commerce.js.map