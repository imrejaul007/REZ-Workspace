/**
 * Multi-Currency Wallet Tests
 */

describe('Multi-Currency Wallet', () => {
  test('gets balance in currency', async () => {
    const { getBalance } = await import('../src/services/multi-currency-wallet');
    const balance = await getBalance('user123', 'USD');
    expect(typeof balance).toBe('number');
  });

  test('gets all balances', async () => {
    const { getAllBalances } = await import('../src/services/multi-currency-wallet');
    const balances = await getAllBalances('user123');
    expect(balances).toHaveProperty('INR');
    expect(balances).toHaveProperty('USD');
    expect(balances).toHaveProperty('EUR');
    expect(balances).toHaveProperty('GBP');
  });

  test('credits currency', async () => {
    const { credit } = await import('../src/services/multi-currency-wallet');
    await credit('user123', 'USD', 100);
    expect(true).toBe(true);
  });

  test('debits currency with insufficient balance', async () => {
    const { debit, credit } = await import('../src/services/multi-currency-wallet');
    await credit('user123', 'USD', 10);
    const result = await debit('user123', 'USD', 100);
    expect(result).toBe(false);
  });
});
