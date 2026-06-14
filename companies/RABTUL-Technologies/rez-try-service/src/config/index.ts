/**
 * Configuration
 */
import dotenv from 'dotenv';
dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // MongoDB
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/rez_try',

  // JWT
  jwtSecret: process.env.JWT_SECRET || 'your-jwt-secret-change-in-production',
  internalServiceToken: process.env.INTERNAL_SERVICE_TOKEN || 'your-internal-token',

  // CORS
  corsOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,https://rez.app').split(','),

  // External Services
  walletServiceUrl: process.env.WALLET_SERVICE_URL || 'http://localhost:4004',
  authServiceUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:4002',

  // QR
  qrSecret: process.env.QR_SECRET || 'your-qr-secret-key',

  // Explorer Score Weights
  explorerScoreWeights: {
    trialsCompleted: 10,
    reviewsWritten: 5,
    campaignsJoined: 15,
    referrals: 20,
    streak: 3,
  },

  // Trial Settings
  trialSettings: {
    maxBookingsPerUser: 5,
    bookingValidityHours: 24,
    cancellationDeadlineHours: 2,
    noShowPenalty: 10,
  },

  // Coin Settings
  coinSettings: {
    trialCompletionReward: 10,
    reviewReward: 5,
    campaignReward: 15,
    referralReward: 25,
    bundleDiscount: 0.1,
  },
};
