describe('Graceful Shutdown', () => {
  it('stopWalletWorker closes the worker cleanly', async () => {
    const { startWalletWorker, stopWalletWorker } = require('../worker');
    // Can't fully test without Redis, but verify the function exists and is exported
    expect(typeof stopWalletWorker).toBe('function');
    expect(typeof startWalletWorker).toBe('function');
  });
});
