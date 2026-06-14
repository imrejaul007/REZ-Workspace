// Test setup for jsdom environment
// Mock browser APIs

// Mock crypto.randomUUID
if (typeof globalThis.crypto === 'undefined') {
  (globalThis as unknown as { crypto: Crypto }).crypto = {
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substring(2, 9),
  } as Crypto;
}

// Mock document.cookie
let cookieStore: Record<string, string> = {};

Object.defineProperty(document, 'cookie', {
  get: () => {
    return Object.entries(cookieStore)
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
  },
  set: (cookie: string) => {
    const [name, ...valueParts] = cookie.split('=');
    const value = valueParts.join('=').split(';')[0];
    const expiresMatch = cookie.match(/expires=([^;]+)/);
    if (expiresMatch) {
      cookieStore[name] = value;
    } else {
      cookieStore[name] = value;
    }
  },
});

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000/test',
    search: '',
    pathname: '/test',
  },
  writable: true,
});

// Mock window.history
Object.defineProperty(window, 'history', {
  value: {
    pushState: () => {},
    replaceState: () => {},
    state: null,
  },
  writable: true,
});

// Mock navigator
Object.defineProperty(window, 'navigator', {
  value: {
    userAgent: 'Mozilla/5.0 (Test) AppleWebKit/537.36',
    language: 'en-US',
    hardwareConcurrency: 4,
    deviceMemory: 8,
  },
  writable: true,
});

// Mock screen
Object.defineProperty(window, 'screen', {
  value: {
    width: 1920,
    height: 1080,
    colorDepth: 24,
  },
  writable: true,
});

// Mock fetch
const originalFetch = globalThis.fetch;
(globalThis as unknown as { fetch: typeof fetch }).fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ success: true }),
} as Response);

export { cookieStore };
