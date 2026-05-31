/**
 * Cosmic OS → Hojai AI Astrology Connector
 * Privacy Tier 1
 */
import axios from 'axios';
export async function emitCosmicSignals(data) {
    await axios.post(`${process.env.HOJAi_API_URL}/signals/cosmic`, {
        userId: data.userId,
        sunSign: data.chart.sunSign,
        moonSign: data.chart.moonSign,
        ascendant: data.chart.ascendant,
        predictions: data.predictions
    });
}
//# sourceMappingURL=cosmic.js.map