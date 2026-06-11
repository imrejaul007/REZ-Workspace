const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const mongoose = require('mongoose');
require('express-async-errors');

const config = require('./config');
const logger = require('./config/logger');
const { connectDB } = require('./config/database');
const { standardLimiter } = require('./middleware/rateLimiter');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const {
  studentRoutes,
  courseRoutes,
  attendanceRoutes,
  gradeRoutes,
  aiRoutes,
  analyticsRoutes
} = require('./routes');

const app = express();

app.use(helmet());

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(compression());

app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(standardLimiter);

app.get('/health', (req, res) => {
  const healthcheck = {
    uptime: process.uptime(),
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
    }
  };

  try {
    res.status(200).json(healthcheck);
  } catch (error) {
    healthcheck.status = 'unhealthy';
    healthcheck.error = error.message;
    res.status(503).json(healthcheck);
  }
});

app.get('/ready', (req, res) => {
  if (mongoose.connection.readyState === 1) {
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString()
    });
  }
});

app.use('/api/students', studentRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/', (req, res) => {
  res.json({
    name: 'LEARNIQ - Education AI Operating System',
    version: '1.0.0',
    description: 'AI-powered education management platform',
    endpoints: {
      health: '/health',
      ai: {
        status: 'GET /api/ai/status',
        tutor: 'POST /api/ai/tutor/recommend',
        admission: 'POST /api/ai/admission/process',
        placement: 'POST /api/ai/placement/analyze',
        grader: 'POST /api/ai/grader/calculate'
      },
      students: {
        list: 'GET /api/students',
        create: 'POST /api/students',
        get: 'GET /api/students/:id',
        update: 'PUT /api/students/:id',
        delete: 'DELETE /api/students/:id'
      },
      courses: {
        list: 'GET /api/courses',
        create: 'POST /api/courses',
        get: 'GET /api/courses/:id',
        update: 'PUT /api/courses/:id',
        delete: 'DELETE /api/courses/:id'
      },
      attendance: {
        mark: 'POST /api/attendance',
        byCourse: 'GET /api/attendance/:courseId',
        byStudent: 'GET /api/attendance/student/:studentId'
      },
      grades: {
        create: 'POST /api/grades',
        byStudent: 'GET /api/grades/:studentId',
        byCourse: 'GET /api/grades/course/:courseId',
        gpa: 'GET /api/grades/gpa/:studentId'
      },
      analytics: {
        dashboard: 'GET /api/analytics/dashboard',
        student: 'GET /api/analytics/student/:studentId',
        course: 'GET /api/analytics/course/:courseId'
      }
    }
  });
});

app.use(notFoundHandler);

app.use(errorHandler);

module.exports = app;