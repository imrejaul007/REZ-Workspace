/**
 * CorpPerks → Hojai AI Employment Connector
 * Privacy Tier 2
 */
export async function emitEmploymentSignals(data) {
    await axios.post(`${process.env.HOJAi_API_URL}/signals/employment`, data);
}
//# sourceMappingURL=employment.js.map