import { buildUPILinks, isUPIAvailable, openUPIApp } from '@/lib/utils/upi';

// ── buildUPILinks ─────────────────────────────────────────────────────────────

describe('buildUPILinks', () => {
  const baseParams = {
    vpa: 'merchant@upi',
    name: 'Test Store',
    amount: 1500,
    txnRef: 'TXN-001',
    note: 'Test payment',
  };

  it('converts paise to rupees with two decimal places in the am= parameter', () => {
    const links = buildUPILinks(baseParams);
    // 1500 paise → 15.00 rupees
    expect(links.generic).toContain('am=15.00');
    expect(links.phonePe).toContain('am=15.00');
    expect(links.gpay).toContain('am=15.00');
    expect(links.paytm).toContain('am=15.00');
  });

  it('uses correct scheme for each payment entry point', () => {
    const links = buildUPILinks(baseParams);
    expect(links.generic).toMatch(/^upi:\/\/pay\?/);
    expect(links.phonePe).toMatch(/^phonepe:\/\/pay\?/);
    expect(links.gpay).toMatch(/^tez:\/\/upi\/pay\?/);
    expect(links.paytm).toMatch(/^paytmmp:\/\/pay\?/);
  });

  it('URL-encodes the VPA in all links', () => {
    const links = buildUPILinks({ ...baseParams, vpa: 'merchant+test@upi' });
    // + should be encoded as %2B
    expect(links.generic).toContain('pa=merchant%2Btest%40upi');
  });

  it('URL-encodes spaces and special characters in the merchant name', () => {
    const links = buildUPILinks({ ...baseParams, name: 'Raj & Sons' });
    expect(links.generic).toContain('pn=Raj%20%26%20Sons');
  });

  it('URL-encodes the note field', () => {
    const links = buildUPILinks({ ...baseParams, note: 'Order #42' });
    expect(links.generic).toContain('tn=Order%20%2342');
  });

  it('falls back to "Payment to <name>" when note is omitted', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { note: _removed, ...paramsWithoutNote } = baseParams;
    const links = buildUPILinks(paramsWithoutNote);
    expect(links.generic).toContain(encodeURIComponent('Payment to Test Store'));
  });

  it('includes the currency code INR', () => {
    const links = buildUPILinks(baseParams);
    expect(links.generic).toContain('cu=INR');
  });

  it('includes the transaction reference', () => {
    const links = buildUPILinks(baseParams);
    expect(links.generic).toContain('tr=TXN-001');
  });

  it('handles a zero-amount payment', () => {
    const links = buildUPILinks({ ...baseParams, amount: 0 });
    expect(links.generic).toContain('am=0.00');
  });

  it('handles large amounts correctly', () => {
    const links = buildUPILinks({ ...baseParams, amount: 100000 });
    // 100000 paise = 1000.00 rupees
    expect(links.generic).toContain('am=1000.00');
  });
});

// ── isUPIAvailable ────────────────────────────────────────────────────────────

describe('isUPIAvailable', () => {
  it('returns false in jsdom environment (desktop/non-mobile user agent)', () => {
    expect(isUPIAvailable()).toBe(false);
  });

  it('returns true when navigator.userAgent contains "android"', () => {
    const originalUA = navigator.userAgent;
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Linux; Android 12; Pixel 6)',
      configurable: true,
    });
    expect(isUPIAvailable()).toBe(true);
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUA,
      configurable: true,
    });
  });

  it('returns true when navigator.userAgent contains "iPhone"', () => {
    const originalUA = navigator.userAgent;
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)',
      configurable: true,
    });
    expect(isUPIAvailable()).toBe(true);
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUA,
      configurable: true,
    });
  });
});

// ── openUPIApp ────────────────────────────────────────────────────────────────

describe('openUPIApp', () => {
  // jsdom intercepts window.location.href navigation and emits a logger.error
  // for non-http(s) schemes. We capture those errors to assert which URLs
  // were attempted, which lets us test the timer-based fallback logic.

  let consoleErrorSpy: jest.SpyInstance;
  let capturedErrors: Array<{ message: string }>;

  beforeEach(() => {
    jest.useFakeTimers();
    capturedErrors = [];

    // Capture logger.error calls silently — jsdom emits the navigation error
    consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation((err: Error | string) => {
        capturedErrors.push({
          message: typeof err === 'string' ? err : err?.message ?? String(err),
        });
      });

    Object.defineProperty(document, 'hidden', {
      value: false,
      configurable: true,
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    jest.useRealTimers();
    Object.defineProperty(document, 'hidden', {
      value: false,
      configurable: true,
    });
  });

  it('attempts to navigate to the UPI URL immediately (triggers jsdom navigation)', () => {
    const upiUrl = 'upi://pay?pa=merchant@upi&am=15.00';
    const fallbackUrl = 'https://checkout.razorpay.com/fallback';

    openUPIApp(upiUrl, fallbackUrl, 2000);

    // jsdom emits one logger.error for the non-http UPI URL navigation attempt
    expect(capturedErrors).toHaveLength(1);
    expect(capturedErrors[0].message).toMatch(/not implemented/i);
  });

  it('attempts fallback navigation after timeout when document remains visible', () => {
    const upiUrl = 'upi://pay?pa=merchant@upi&am=15.00';
    const fallbackUrl = 'https://checkout.razorpay.com/fallback';

    openUPIApp(upiUrl, fallbackUrl, 2000);
    // 1 error for the initial UPI URL navigation
    expect(capturedErrors).toHaveLength(1);

    jest.advanceTimersByTime(2001);

    // 1 additional error for the fallback URL navigation (jsdom navigates for http too)
    // The fallback IS an https URL so jsdom handles it differently but still emits
    // For https URLs jsdom may or may not emit — check the total count is >1 OR
    // verify that logger.error was called a second time with ANY error:
    expect(consoleErrorSpy).toHaveBeenCalledTimes(2);
  });

  it('does NOT attempt fallback navigation when document becomes hidden before timeout', () => {
    const upiUrl = 'upi://pay?pa=merchant@upi&am=15.00';
    const fallbackUrl = 'https://checkout.razorpay.com/fallback';

    openUPIApp(upiUrl, fallbackUrl, 2000);

    // Simulate the UPI app launching — browser hides the page
    Object.defineProperty(document, 'hidden', {
      value: true,
      configurable: true,
    });
    document.dispatchEvent(new Event('visibilitychange'));

    jest.advanceTimersByTime(2001);

    // Only the initial UPI navigation error should have been emitted
    // (the fallback timer was cancelled when the page became hidden)
    expect(capturedErrors).toHaveLength(1);
  });

  it('respects a custom timeout before triggering fallback', () => {
    const upiUrl = 'upi://pay?pa=test@upi&am=5.00';
    const fallbackUrl = 'https://example.com/fallback';

    openUPIApp(upiUrl, fallbackUrl, 500);

    // Just before the custom timeout — only 1 navigation (UPI URL)
    jest.advanceTimersByTime(499);
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);

    // After the custom timeout — fallback also triggers
    jest.advanceTimersByTime(1);
    expect(consoleErrorSpy).toHaveBeenCalledTimes(2);
  });
});
