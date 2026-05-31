/**
 * Rendez → Hojai AI Relationships Connector
 * Privacy Tier 3 (Sensitive) - Explicit consent required
 */
import axios from 'axios';
export async function emitRelationshipSignals(data) {
    await axios.post(`${process.env.HOJAi_API_URL}/signals/relationships`, {
        userId: data.userId,
        connectionType: data.connectionType,
        sharedInterests: data.sharedInterests,
        engagement: data.engagement,
        privacyTier: 3
    });
}
//# sourceMappingURL=rendez.js.map