/**
 * RidZa Finance → Hojai AI Finance Connector
 * Privacy Tier 3
 */
export async function emitFinanceSignals(data) {
    await axios.post(`${process.env.HOJAi_API_URL}/signals/finance`, {
        userId: data.userId,
        transaction: data.transaction
    });
}
//# sourceMappingURL=finance.js.map