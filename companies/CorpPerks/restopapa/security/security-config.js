// Production Security Configuration
// RestaurantHub SaaS Platform

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');

// Security middleware configuration
const securityConfig = {
  // Helmet security headers
  helmet: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com",
          "https://cdn.tailwindcss.com",
        ],
        scriptSrc: [
          "'self'",
          "'unsafe-eval'", // Required for Next.js development
          "https://cdn.tailwindcss.com",
          "https://www.googletagmanager.com",
        ],
        fontSrc: [
          "'self'",
          "https://fonts.gstatic.com",
        ],
        imgSrc: [
          "'self'",
          "data:",
          "blob:",
          "https://images.unsplash.com",
          "https://via.placeholder.com",
        ],
        connectSrc: [
          "'self'",
          "https://api.restauranthub.com",
          "wss://api.restauranthub.com",
        ],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false, // Required for some API calls
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  },

  // Rate limiting configuration
  rateLimits: {
    // General API rate limit
    general: rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Limit each IP to 100 requests per windowMs
      message: {
        error: 'Too many requests, please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: 15 * 60, // 15 minutes in seconds
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        res.status(429).json({
          error: 'Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests from this IP, please try again later.',
          retryAfter: Math.round(req.rateLimit.resetTime.getTime() / 1000),
        });
      },
    }),

    // Strict rate limit for authentication endpoints
    auth: rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // Limit each IP to 5 auth requests per windowMs
      message: {
        error: 'Too many authentication attempts, please try again later.',
        code: 'AUTH_RATE_LIMIT_EXCEEDED',
        retryAfter: 15 * 60,
      },
      skipSuccessfulRequests: true, // Don't count successful requests
    }),

    // File upload rate limit
    upload: rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 10, // Limit each IP to 10 upload requests per minute
      message: {
        error: 'Too many upload requests, please try again later.',
        code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
        retryAfter: 60,
      },
    }),

    // API key based rate limit (for higher limits)
    apiKey: rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // Higher limit for API key users
      keyGenerator: (req) => {
        return req.headers['x-api-key'] || req.ip;
      },
      skip: (req) => {
        // Skip if no API key provided (will use general rate limit)
        return !req.headers['x-api-key'];
      },
    }),
  },

  // Speed limiting (slow down responses)
  speedLimits: {
    general: slowDown({
      windowMs: 15 * 60 * 1000, // 15 minutes
      delayAfter: 50, // Allow 50 requests per 15 minutes without delay
      delayMs: 500, // Add 500ms delay per request after delayAfter
      maxDelayMs: 20000, // Maximum delay of 20 seconds
    }),
  },

  // CORS configuration
  cors: {
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, etc.)
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        'https://restauranthub.com',
        'https://www.restauranthub.com',
        'https://admin.restauranthub.com',
        // Add your domain here
      ];

      // In development, allow localhost
      if (process.env.NODE_ENV === 'development') {
        allowedOrigins.push(
          'http://localhost:3000',
          'http://localhost:3001',
          'http://127.0.0.1:3000',
          'http://127.0.0.1:3001'
        );
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-API-Key',
      'X-CSRF-Token',
    ],
  },

  // Session configuration
  session: {
    name: 'restauranthub.sid',
    secret: process.env.SESSION_SECRET || 'super-secure-session-secret',
    resave: false,
    saveUninitialized: false,
    rolling: true, // Reset expiration on activity
    cookie: {
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      httpOnly: true, // Prevent XSS
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    },
  },

  // Input validation rules
  validation: {
    // File upload restrictions
    fileUpload: {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
        files: 5, // Maximum 5 files per upload
      },
      fileFilter: (req, file, callback) => {
        // Allow specific file types
        const allowedMimeTypes = [
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/webp',
          'image/gif',
          'application/pdf',
          'text/csv',
        ];

        if (allowedMimeTypes.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(
            new Error(
              `File type ${file.mimetype} is not allowed. Allowed types: ${allowedMimeTypes.join(', ')}`
            ),
            false
          );
        }
      },
    },

    // Request body size limits
    bodyLimits: {
      json: '10mb',
      urlencoded: '10mb',
      text: '10mb',
    },
  },

  // Security headers middleware
  securityHeaders: (req, res, next) => {
    // Remove powered by header
    res.removeHeader('X-Powered-By');
    
    // Add security headers
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    
    // HSTS header for HTTPS
    if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }
    
    next();
  },

  // Request sanitization
  sanitization: {
    // Remove potentially dangerous characters
    sanitizeInput: (input) => {
      if (typeof input !== 'string') return input;
      
      // Remove HTML tags
      input = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      input = input.replace(/<[^>]*>/g, '');
      
      // Remove SQL injection patterns
      const sqlPatterns = [
        /(\%27)|(\')|(\-\-)|(\%23)|(#)/gi,
        /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/gi,
        /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/gi,
      ];
      
      sqlPatterns.forEach(pattern => {
        input = input.replace(pattern, '');
      });
      
      return input.trim();
    },
  },
};

module.exports = securityConfig;