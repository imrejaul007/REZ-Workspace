/**
 * REZ Unified Identity - Configuration
 * Cross-company identity resolution
 */

export const config = {
  port: parseInt(process.env.PORT || '4060'),
  host: process.env.HOST || '0.0.0.0',

  // Identity providers
  providers: {
    rabtul: { enabled: true },
    merchant: { enabled: true },
    khaimove: { enabled: true },
    axom: { enabled: true },
    adbazaar: { enabled: true },
  },

  // Matching rules
  matching: {
    exactMatch: ['email', 'phone'],
    probabilisticMatch: ['name', 'address', 'dob'],
    behavioralMatch: ['deviceFingerprint', 'ipPattern'],
  },
};