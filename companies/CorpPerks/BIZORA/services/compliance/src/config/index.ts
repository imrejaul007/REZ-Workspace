import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4002', 10),

  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/bizora-compliance',
    options: {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    },
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'bizora-compliance-secret-key',
    expiresIn: '24h',
  },

  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  },

  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  },

  compliance: {
    // GST Configuration
    gst: {
      threshold: 4000000, // ₹40 Lakhs - threshold for mandatory GST registration
      rates: [0, 5, 12, 18, 28], // GST slabs
      nilRatedCategories: ['agriculture', 'healthcare', 'education'],
    },

    // TDS Configuration
    tds: {
      sections: {
        '192': { rate: 0.10, description: 'Salary income' },
        '192A': { rate: 0.10, description: 'Premature PF withdrawal' },
        '193': { rate: 0.10, description: 'Interest on securities' },
        '194': { rate: 0.10, description: 'Dividends' },
        '194A': { rate: 0.10, description: 'Interest other than interest on securities' },
        '194B': { rate: 0.30, description: 'Lottery/Crossword puzzles' },
        '194C': { rate: 0.02, description: 'Contractor payments' },
        '194D': { rate: 0.10, description: 'Insurance commission' },
        '194H': { rate: 0.10, description: 'Commission/Brokerage' },
        '194I': { rate: 0.02, description: 'Rent' },
        '194J': { rate: 0.10, description: 'Professional/Technical services' },
      },
      threshold: 30000, // ₹30,000 per transaction
      annualThreshold: 300000, // ₹3 Lakhs annual exemption
    },

    // Regulatory compliance settings
    regulatory: {
      pfdueDates: {
        monthly: 20, // 20th of each month
        quarterly: 30, // 30th of next month after quarter end
        annual: 31, // 31st December
      },
      tdsDueDates: {
        monthly: 7, // 7th of next month
        quarterly: 30, // 30th of next month after quarter end
      },
    },
  },

  logger: {
    level: process.env.LOG_LEVEL || 'info',
    format: 'json',
  },

  api: {
    version: 'v1',
    prefix: '/api',
  },
};

export default config;
