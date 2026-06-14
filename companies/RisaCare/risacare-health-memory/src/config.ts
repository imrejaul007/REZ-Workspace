/**
 * Health Memory Platform - Configuration
 */

export const config = {
  // Service configuration
  service: {
    name: 'risacare-health-memory',
    port: parseInt(process.env.PORT || '4801'),
    env: process.env.NODE_ENV || 'development'
  },

  // Database configuration
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    name: process.env.DB_NAME || 'risacare_health_memory',
    logQueries: process.env.NODE_ENV === 'development'
  },

  // RABTUL Services (for auth and wallet)
  rabtul: {
    authService: process.env.AUTH_SERVICE_URL || 'http://localhost:4002',
    walletService: process.env.WALLET_SERVICE_URL || 'http://localhost:4004'
  },

  // HOJAI Services (for AI and memory)
  hojai: {
    memoryService: process.env.MEMORY_SERVICE_URL || 'http://localhost:4520',
    intelligenceService: process.env.INTELLIGENCE_SERVICE_URL || 'http://localhost:4530',
    agentsService: process.env.AGENTS_SERVICE_URL || 'http://localhost:4550'
  },

  // Genie Services
  genie: {
    memory: process.env.GENIE_MEMORY_URL || 'http://localhost:4703',
    relationship: process.env.GENIE_RELATIONSHIP_URL || 'http://localhost:4704',
    briefing: process.env.GENIE_BRIEFING_URL || 'http://localhost:4706'
  },

  // Shab AI (for family context)
  shab: {
    api: process.env.SHAB_API_URL || 'http://localhost:4970'
  },

  // Security
  security: {
    jwtSecret: process.env.JWT_SECRET || 'risacare-health-memory-secret',
    encryptionKey: process.env.ENCRYPTION_KEY || 'risacare-encryption-key-32ch',
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:4801']
  },

  // Feature flags
  features: {
    enableAIInsights: process.env.ENABLE_AI_INSIGHTS !== 'false',
    enableHealthTwin: process.env.ENABLE_HEALTH_TWIN !== 'false',
    enableLifeEvents: process.env.ENABLE_LIFE_EVENTS !== 'false',
    enableFamilyHealth: process.env.ENABLE_FAMILY_HEALTH !== 'false'
  }
};