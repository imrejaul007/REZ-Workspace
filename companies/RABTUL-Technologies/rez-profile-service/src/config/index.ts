// Profile Service Configuration

export const config = {
  // Service URLs
  AUTH_SERVICE_URL: process.env.AUTH_SERVICE_URL || 'https://rez-auth-service.onrender.com',
  WALLET_SERVICE_URL: process.env.WALLET_SERVICE_URL || 'https://rez-wallet-service-36vo.onrender.com',
  REE_SERVICE_URL: process.env.REE_SERVICE_URL || 'https://rez-ree-service.onrender.com',

  // Cache TTL (in seconds)
  CACHE: {
    TIER_TTL: 300, // 5 minutes
    KARMA_TTL: 60, // 1 minute
  },

  // Port
  PORT: parseInt(process.env.PORT || '3000'),
};

export default config;
