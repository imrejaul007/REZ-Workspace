/**
 * StayOwn → Hojai AI Hospitality Connector
 */
export async function emitHospitalitySignals(data) {
    await axios.post(`${process.env.HOJAi_API_URL}/signals/hospitality`, {
        userId: data.userId,
        booking: data.stay,
        value: data.spend
    });
}
//# sourceMappingURL=hospitality.js.map