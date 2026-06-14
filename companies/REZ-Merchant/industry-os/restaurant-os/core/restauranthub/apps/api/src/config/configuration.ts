export default () => ({
  port: parseInt(process.env.API_PORT || '3000', 10),
  apiPrefix: process.env.API_PREFIX || 'api/v1',
  database: {
    url: process.env.DATABASE_URL,
  },
  redis: {
    enabled: process.env.REDIS_ENABLED !== 'false' && process.env.MOCK_DATABASE !== 'true',
    url: process.env.REDIS_URL,
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    mock: process.env.MOCK_DATABASE === 'true' || process.env.REDIS_ENABLED === 'false',
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1',
    s3: {
      bucketName: process.env.S3_BUCKET_NAME,
      endpoint: process.env.S3_ENDPOINT,
    },
  },
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID,
    keySecret: process.env.RAZORPAY_KEY_SECRET,
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
  },
  email: {
    smtp: {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      user: process.env.SMTP_USER,
      password: process.env.SMTP_PASSWORD,
    },
    from: process.env.SMTP_FROM || 'RestoPapa <noreply@restopapa.com>',
  },
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3001',
  },
  aadhaar: {
    apiUrl: process.env.UIDAI_API_URL || 'https://api.uidai.gov.in',
    apiKey: process.env.UIDAI_API_KEY,
    clientId: process.env.UIDAI_CLIENT_ID,
    licenseKey: process.env.UIDAI_LICENSE_KEY,
    encryptionKey: process.env.AADHAAR_ENCRYPTION_KEY,
  },
  environment: process.env.NODE_ENV || 'development',
});