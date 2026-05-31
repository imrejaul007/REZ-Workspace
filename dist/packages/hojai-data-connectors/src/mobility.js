/**
 * ReZ Ride → Hojai AI Mobility Connector
 */
export async function emitMobilitySignals(data) {
    await axios.post(`${process.env.HOJAi_API_URL}/signals/mobility`, {
        userId: data.userId,
        rideType: data.rideType,
        location: data.pickup
    });
}
//# sourceMappingURL=mobility.js.map