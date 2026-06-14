// jest.polyfills.js

// Polyfill for TextEncoder/TextDecoder
import { TextEncoder, TextDecoder } from 'util'

Object.assign(global, { TextDecoder, TextEncoder })

// Polyfill for fetch
import 'whatwg-fetch'

// Polyfill for structuredClone if needed
if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = (obj) => JSON.parse(JSON.stringify(obj))
}