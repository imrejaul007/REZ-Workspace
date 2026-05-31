/**
 * HOJAI Feedback Connector - Connect HOJAI feedback → Training
 *
 * HOJAI Agents → Training Pipeline
 */
import axios from 'axios';
export class HOJAIFeedbackConnector {
    trainingUrl;
    constructor(trainingUrl = 'http://localhost:4880') {
        this.trainingUrl = trainingUrl;
    }
    // HOJAI feedback → Training
    async onFeedback(feedback) {
        if (feedback.quality > 0.7) {
            await axios.post(`${this.trainingUrl}/api/feedback`, {
                source: 'HOJAI_FEEDBACK',
                type: feedback.type,
                agentId: feedback.agentId,
                data: feedback.data,
                quality: feedback.quality
            });
        }
    }
    // Batch HOJAI corrections → Training
    async corrections(corrections) {
        const high = corrections.filter(f => f.quality < 0.5);
        if (high.length > 0) {
            await axios.post(`${this.trainingUrl}/api/corrections`, {
                source: 'HOJAI_CORRECTIONS',
                corrections: high
            });
        }
    }
}
export const hojaiFeedbackConnector = new HOJAIFeedbackConnector();
//# sourceMappingURL=index.js.map