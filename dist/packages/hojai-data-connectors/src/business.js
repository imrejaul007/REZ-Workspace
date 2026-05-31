/**
 * BuzzLocal → Hojai AI Local Intelligence Connector
 */
export async function emitLocalSignals(data) {
    await axios.post(`${process.env.HOJAi_API_URL}/signals/local`, {
        userId: data.userId,
        venue: data.venue
    });
}
//# sourceMappingURL=business.js.map