/**
 * PeopleOS → Hojai AI Employment Connector
 * Privacy Tier 2
 */
import axios from 'axios';
export async function emitEmploymentSignals(data) {
    await axios.post(`${process.env.HOJAi_API_URL}/signals/employment`, {
        userId: data.userId,
        employer: data.employer,
        role: data.role,
        department: data.department,
        skills: data.skills
    });
}
//# sourceMappingURL=peopleos.js.map