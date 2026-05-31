export async function retry(fn, options = {}) {
    const { attempts = 3, delay = 1000, backoff = 'exponential', onError } = options;
    let lastError;
    for (let i = 0; i < attempts; i++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error;
            onError?.(lastError, i + 1);
            if (i < attempts - 1) {
                const wait = backoff === 'exponential'
                    ? delay * Math.pow(2, i)
                    : delay * (i + 1);
                await new Promise(r => setTimeout(r, wait));
            }
        }
    }
    throw lastError;
}
export async function withRetry(promise, context) {
    try {
        return await retry(() => promise, {
            attempts: 3,
            delay: 1000,
            onError: (err) => console.error(`[Retry] ${context}:`, err.message)
        });
    }
    catch {
        console.error(`[Retry] ${context} failed after 3 attempts`);
        return null;
    }
}
//# sourceMappingURL=ratelimit.js.map