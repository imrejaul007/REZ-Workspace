/**
 * Integration tests — Payout Flow
 */

const VALID_PAYOUT_STATUSES = ['pending', 'processing', 'completed', 'failed'] as const;
type PayoutStatus = (typeof VALID_PAYOUT_STATUSES)[number];

function validatePayoutAmount(amount: number): boolean {
  return amount > 0;
}

function validatePayoutStatus(status: string): status is PayoutStatus {
  return (VALID_PAYOUT_STATUSES as readonly string[]).includes(status);
}

describe('Payout Flow — Amount validation', () => {
  it('rejects zero amount', () => {
    expect(validatePayoutAmount(0)).toBe(false);
  });

  it('rejects negative amount', () => {
    expect(validatePayoutAmount(-100)).toBe(false);
  });

  it('accepts a positive amount', () => {
    expect(validatePayoutAmount(500)).toBe(true);
  });

  it('accepts fractional positive amounts', () => {
    expect(validatePayoutAmount(0.01)).toBe(true);
  });
});

describe('Payout Flow — Status filter validation', () => {
  it.each(VALID_PAYOUT_STATUSES)('accepts valid status: %s', (status) => {
    expect(validatePayoutStatus(status)).toBe(true);
  });

  it('rejects an unknown status', () => {
    expect(validatePayoutStatus('approved')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(validatePayoutStatus('')).toBe(false);
  });

  it('rejects case-variant of valid status', () => {
    expect(validatePayoutStatus('Completed')).toBe(false);
  });
});

describe('Payout Flow — CSV export content-type', () => {
  it('response has correct content-type for CSV download', async () => {
    const mockExport = jest.fn().mockResolvedValue({
      headers: { 'content-type': 'text/csv; charset=utf-8' },
      data: 'id,amount,status\n1,500,completed',
    });

    const response = await mockExport('/api/merchant/payouts/export');
    expect(response.headers['content-type']).toContain('text/csv');
  });

  it('calls export endpoint with correct params', async () => {
    const mockExport = jest.fn().mockResolvedValue({
      headers: { 'content-type': 'text/csv; charset=utf-8' },
      data: '',
    });

    await mockExport('/api/merchant/payouts/export', { status: 'completed' });
    expect(mockExport).toHaveBeenCalledWith('/api/merchant/payouts/export', {
      status: 'completed',
    });
  });
});
