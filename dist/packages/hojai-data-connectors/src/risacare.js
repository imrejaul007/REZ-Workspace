/**
 * RisaCare → Hojai AI Health Connector
 * Privacy Tier 3 (Sensitive)
 * Explicit consent required
 */
import axios from 'axios';
export async function emitHealthSignals(data) {
    if (!data.consent)
        return;
    await axios.post(`${process.env.HOJAi_API_URL}/signals/health`, {
        userId: data.userId,
        source: 'risacare',
        data: data.metrics,
        privacyTier: 3
    });
}
//# sourceMappingURL=risacare.js.map