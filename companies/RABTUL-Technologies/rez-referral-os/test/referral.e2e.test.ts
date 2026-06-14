{
  "name": "referral-os-tests",
  "scripts": {
    "test": "node --test test/**/*.test.ts",
    "test:e2e": "node --test test/referral.test.ts",
    "test:unit": "node --test test/services.test.ts"
  },
  "devDependencies": {
    "@types/node": "^20.10.0"
  }
}
