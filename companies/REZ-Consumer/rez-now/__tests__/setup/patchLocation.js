/**
 * setupFilesAfterEnv: patches jsdom's LocationImpl.implementation.prototype
 * to intercept href assignments without triggering navigation.
 *
 * TextEncoder is available in Node.js 18+ globally. We assign it to `global`
 * before requiring jsdom internals so that whatwg-url can load correctly.
 */

// Make TextEncoder available to Node.js require() context so jsdom modules load
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

const locationImplPath = require.resolve('jsdom/lib/jsdom/living/window/Location-impl');
const LocationImplModule = require(locationImplPath);
const proto = LocationImplModule.implementation.prototype;

let _lastHref = 'http://localhost/';

global.__getLocationHref = () => _lastHref;

// Override the href setter on LocationImpl.implementation.prototype
// The getter on the generated Location.js does: esValue[implSymbol]["href"]
// which reads proto.href via the descriptor. We only replace the setter.
const originalDescriptor = Object.getOwnPropertyDescriptor(proto, 'href');

if (originalDescriptor) {
  Object.defineProperty(proto, 'href', {
    get: originalDescriptor.get,
    set(value) {
      _lastHref = value;
      // Intentionally skip original setter to prevent navigation
    },
    configurable: true,
    enumerable: originalDescriptor.enumerable,
  });
}

beforeEach(() => {
  _lastHref = 'http://localhost/';
});
