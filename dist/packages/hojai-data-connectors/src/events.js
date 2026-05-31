/**
 * Z Events → Hojai AI Events Connector
 * Privacy Tier 1
 */
import axios from 'axios';
export async function emitEventSignals(data) {
    await axios.post(`${process.env.HOJAi_API_URL}/signals/events`, {
        userId: data.userId,
        action: data.action,
        eventId: data.event.id,
        eventCategory: data.event.category
    });
}
//# sourceMappingURL=events.js.map