/**
 * Insights Campus → Hojai AI Education Connector
 * Privacy Tier 2
 */
import axios from 'axios';
export async function emitEducationSignals(data) {
    await axios.post(`${process.env.HOJAi_API_URL}/signals/education`, {
        userId: data.userId,
        institution: data.institution,
        program: data.program,
        year: data.year,
        gpa: data.performance?.gpa,
        engagement: data.performance?.engagement
    });
}
//# sourceMappingURL=campus.js.map