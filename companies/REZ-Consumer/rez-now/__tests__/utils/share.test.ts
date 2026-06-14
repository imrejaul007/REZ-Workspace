/**
 * Tests for rez-now/lib/utils/share.ts
 *
 * shareContent() has three branches:
 *   1. navigator.share is available  → call it
 *   2. navigator.share is absent     → fallback to navigator.clipboard.writeText
 *   3. Both are absent               → fallback to shareViaWhatsApp (window.open)
 *
 * We manipulate navigator and window with Object.defineProperty / jest.fn()
 * because jsdom makes navigator properties non-writable by default.
 */

import { shareContent } from '@/lib/utils/share';

const SHARE_OPTIONS = {
  title: 'Try this store',
  text: 'Order online and earn coins',
  url: 'https://reznow.in/test-store',
};

// Helper: safely define a property on navigator (jsdom marks them non-writable)
function defineNavigatorProp(key: string, value: unknown) {
  Object.defineProperty(navigator, key, {
    configurable: true,
    writable: true,
    value,
  });
}

// Helper: delete a property from navigator
function deleteNavigatorProp(key: string) {
  // Redefine as undefined so navigator.share resolves falsy
  Object.defineProperty(navigator, key, {
    configurable: true,
    writable: true,
    value: undefined,
  });
}

// ── Branch 1: navigator.share is available ────────────────────────────────────

describe('shareContent — navigator.share available', () => {
  let shareSpy: jest.Mock;

  beforeEach(() => {
    shareSpy = jest.fn().mockResolvedValue(undefined);
    defineNavigatorProp('share', shareSpy);
  });

  afterEach(() => {
    deleteNavigatorProp('share');
  });

  it('calls navigator.share with the correct payload', async () => {
    await shareContent(SHARE_OPTIONS);
    expect(shareSpy).toHaveBeenCalledTimes(1);
    expect(shareSpy).toHaveBeenCalledWith(SHARE_OPTIONS);
  });

  it('does not call clipboard.writeText when share succeeds', async () => {
    const clipboardSpy = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      writable: true,
      value: { writeText: clipboardSpy },
    });

    await shareContent(SHARE_OPTIONS);
    expect(clipboardSpy).not.toHaveBeenCalled();
  });

  it('falls through to clipboard when share throws an AbortError', async () => {
    const abortError = new DOMException('User cancelled', 'AbortError');
    shareSpy.mockRejectedValueOnce(abortError);

    // AbortError means user cancelled — shareContent should return without clipboard
    const clipboardSpy = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      writable: true,
      value: { writeText: clipboardSpy },
    });

    await shareContent(SHARE_OPTIONS);
    // AbortError: early return, clipboard NOT called
    expect(clipboardSpy).not.toHaveBeenCalled();
  });
});

// ── Branch 2: navigator.share absent → clipboard.writeText ───────────────────

describe('shareContent — navigator.share absent, clipboard available', () => {
  let writeTextSpy: jest.Mock;

  beforeEach(() => {
    deleteNavigatorProp('share');
    writeTextSpy = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      writable: true,
      value: { writeText: writeTextSpy },
    });
  });

  it('calls navigator.clipboard.writeText with the URL', async () => {
    await shareContent(SHARE_OPTIONS);
    expect(writeTextSpy).toHaveBeenCalledTimes(1);
    expect(writeTextSpy).toHaveBeenCalledWith(SHARE_OPTIONS.url);
  });

  it('does not open a new window when clipboard write succeeds', async () => {
    const openSpy = jest.spyOn(window, 'open').mockReturnValue(null);
    await shareContent(SHARE_OPTIONS);
    expect(openSpy).not.toHaveBeenCalled();
    openSpy.mockRestore();
  });
});

// ── Branch 3: both absent → shareViaWhatsApp (window.open) ───────────────────

describe('shareContent — both navigator.share and clipboard absent', () => {
  beforeEach(() => {
    deleteNavigatorProp('share');
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      writable: true,
      value: {
        writeText: jest.fn().mockRejectedValue(new Error('Clipboard unavailable')),
      },
    });
  });

  it('opens a WhatsApp URL via window.open as last resort', async () => {
    const openSpy = jest.spyOn(window, 'open').mockReturnValue(null);
    await shareContent(SHARE_OPTIONS);
    expect(openSpy).toHaveBeenCalledTimes(1);
    expect(openSpy.mock.calls[0][0]).toContain('wa.me');
    openSpy.mockRestore();
  });
});
