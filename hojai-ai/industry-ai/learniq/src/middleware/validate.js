const { z } = require('zod');
const { ValidationError } = require('./errorHandler');

const studentCreateSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters'),
  email: z.string()
    .email('Invalid email format'),
  phone: z.string()
    .min(10, 'Phone must be at least 10 digits')
    .regex(/^[\d\s\-+()]+$/, 'Invalid phone number format'),
  courseIds: z.array(z.string()).optional().default([]),
  grade: z.enum(['A', 'B', 'C', 'D', 'F', 'I', 'W']).optional(),
  status: z.enum(['active', 'inactive', 'graduated', 'suspended', 'alumni']).optional()
});

const studentUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(10).regex(/^[\d\s\-+()]+$/).optional(),
  courseIds: z.array(z.string()).optional(),
  grade: z.enum(['A', 'B', 'C', 'D', 'F', 'I', 'W']).nullable().optional(),
  status: z.enum(['active', 'inactive', 'graduated', 'suspended', 'alumni']).optional()
});

const courseCreateSchema = z.object({
  name: z.string()
    .min(3, 'Course name must be at least 3 characters')
    .max(200, 'Course name cannot exceed 200 characters'),
  description: z.string().max(2000).optional(),
  instructor: z.string().min(1, 'Instructor is required'),
  duration: z.string().min(1, 'Duration is required'),
  price: z.number().min(0, 'Price cannot be negative'),
  maxStudents: z.number().min(1).optional().default(50),
  status: z.enum(['active', 'inactive', 'completed', 'archived']).optional()
});

const attendanceCreateSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  courseId: z.string().min(1, 'Course ID is required'),
  date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  present: z.boolean().default(false),
  notes: z.string().max(500).optional()
});

const gradeCreateSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  courseId: z.string().min(1, 'Course ID is required'),
  score: z.number().min(0).max(100, 'Score must be between 0 and 100'),
  feedback: z.string().max(1000).optional()
});

const aiTutorRecommendSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  courseIds: z.array(z.string()).optional()
});

const aiAdmissionProcessSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  courseId: z.string().min(1, 'Course ID is required'),
  previousQualification: z.string().optional(),
  statementOfPurpose: z.string().max(2000).optional()
});

const aiPlacementAnalyzeSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  skills: z.array(z.string()).optional(),
  preferences: z.object({
    location: z.string().optional(),
    salaryRange: z.string().optional(),
    industry: z.string().optional()
  }).optional()
});

const aiGraderCalculateSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  courseId: z.string().min(1, 'Course ID is required'),
  assignments: z.array(z.object({
    name: z.string(),
    score: z.number().min(0).max(100),
    weight: z.number().min(0).max(1).optional()
  })).optional(),
  rawScore: z.number().min(0).max(100).optional()
});

const validate = (schema) => {
  return (req, res, next) => {
    try {
      const dataToValidate = ['POST', 'PUT', 'PATCH'].includes(req.method)
        ? req.body
        : req.query;

      const result = schema.safeParse(dataToValidate);

      if (!result.success) {
        const errors = result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));

        throw new ValidationError('Validation failed', errors);
      }

      if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        req.body = result.data;
      } else {
        req.query = result.data;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  validate,
  schemas: {
    studentCreate: studentCreateSchema,
    studentUpdate: studentUpdateSchema,
    courseCreate: courseCreateSchema,
    attendanceCreate: attendanceCreateSchema,
    gradeCreate: gradeCreateSchema,
    aiTutorRecommend: aiTutorRecommendSchema,
    aiAdmissionProcess: aiAdmissionProcessSchema,
    aiPlacementAnalyze: aiPlacementAnalyzeSchema,
    aiGraderCalculate: aiGraderCalculateSchema
  }
};