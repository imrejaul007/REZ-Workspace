import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { z } from 'zod';

// ============================================================================
// Database Connection
// ============================================================================

const MONGODB_URI = process.env.MONGODB_URI || process.env.CORPPERKS_MONGODB_URI || 'mongodb://localhost:27017/corpperks';

interface MongoConnection {
  promise: Promise<typeof mongoose> | null;
}

const mongoConnection: MongoConnection = { promise: null };

async function connectToDatabase(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState >= 1) {
    return mongoose;
  }

  if (mongoConnection.promise) {
    return mongoConnection.promise;
  }

  mongoConnection.promise = mongoose.connect(MONGODB_URI, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  }).then((mongoose) => {
    logger.info('Connected to MongoDB for jobs API');
    return mongoose;
  }).catch((error) => {
    mongoConnection.promise = null;
    throw error;
  });

  return mongoConnection.promise;
}

// ============================================================================
// Job Schema (Local to avoid importing from backend)
// ============================================================================

const jobSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, index: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  skills: [{ type: String }],
  type: {
    type: String,
    enum: ['full_time', 'part_time', 'contract', 'intern', 'remote'],
    default: 'full_time',
  },
  location: {
    city: { type: String, default: 'Remote' },
    remote: { type: Boolean, default: false },
    hybrid: { type: Boolean, default: false },
  },
  salary: {
    min: { type: Number },
    max: { type: Number },
    currency: { type: String, default: 'INR' },
    period: { type: String, enum: ['year', 'month'], default: 'year' },
  },
  employer: {
    id: { type: String },
    name: { type: String, required: true },
    type: { type: String, enum: ['Startup', 'Enterprise', 'Research', 'SMB'], default: 'Startup' },
    verified: { type: Boolean, default: false },
  },
  postedAt: { type: Date, default: Date.now },
  applications: { type: Number, default: 0 },
  matchScore: { type: Number, default: 80 },
  status: {
    type: String,
    enum: ['active', 'paused', 'closed', 'draft'],
    default: 'active',
  },
  requirements: [{
    type: String,
  }],
  benefits: [{
    type: String,
  }],
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

jobSchema.index({ tenantId: 1, status: 1 });
jobSchema.index({ tenantId: 1, type: 1 });
jobSchema.index({ 'location.city': 1 });
jobSchema.index({ title: 'text', description: 'text', skills: 'text' });

const Job = mongoose.models.Job || mongoose.model('Job', jobSchema);

// ============================================================================
// Validation Schema
// ============================================================================

const createJobSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(50).max(5000),
  skills: z.array(z.string().min(1).max(50)).min(1).max(20),
  type: z.enum(['full_time', 'part_time', 'contract', 'intern', 'remote']).optional(),
  location: z.object({
    city: z.string().optional(),
    remote: z.boolean().optional(),
    hybrid: z.boolean().optional(),
  }).optional(),
  salary: z.object({
    min: z.number().positive().optional(),
    max: z.number().positive().optional(),
    currency: z.string().optional(),
    period: z.enum(['year', 'month']).optional(),
  }).optional(),
  employer: z.object({
    id: z.string().optional(),
    name: z.string().min(1),
    type: z.enum(['Startup', 'Enterprise', 'Research', 'SMB']).optional(),
    verified: z.boolean().optional(),
  }),
  requirements: z.array(z.string()).optional(),
  benefits: z.array(z.string()).optional(),
});

// ============================================================================
// API Handlers
// ============================================================================

export async function GET(request: Request) {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();

  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const city = searchParams.get('city');
    const remote = searchParams.get('remote');
    const search = searchParams.get('search');
    const tenantId = searchParams.get('tenantId') || 'default';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    // Build query
    const query: Record<string, unknown> = {
      tenantId,
      status: 'active',
      isDeleted: { $ne: true },
    };

    if (type) {
      query.type = type;
    }

    if (city) {
      query['location.city'] = { $regex: city, $options: 'i' };
    }

    if (remote === 'true') {
      query['location.remote'] = true;
    }

    if (search) {
      query.$text = { $search: search };
    }

    // Connect to database
    await connectToDatabase();

    // Execute query with count
    const [jobs, total] = await Promise.all([
      Job.find(query)
        .sort({ postedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      Job.countDocuments(query),
    ]);

    const duration = Date.now() - startTime;
    logger.info(`[${requestId}] GET /api/jobs - Found ${jobs.length} jobs in ${duration}ms`);

    // If no jobs found, try to seed with sample data
    if (jobs.length === 0 && total === 0) {
      const sampleJobs = await seedSampleJobs(tenantId);
      return NextResponse.json({
        success: true,
        data: {
          jobs: sampleJobs,
          total: sampleJobs.length,
          page,
          limit,
          seeded: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        jobs,
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    logger.error(`[${requestId}] GET /api/jobs - Error after ${duration}ms:`, errorMessage);

    // Return error response with fallback to empty data
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch jobs',
      message: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      data: {
        jobs: [],
        total: 0,
      },
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();

  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = createJobSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: validationResult.error.issues,
      }, { status: 400 });
    }

    const validatedData = validationResult.data;

    // Connect to database
    await connectToDatabase();

    // Create job document
    const newJob = new Job({
      tenantId: 'default',
      ...validatedData,
      postedAt: new Date(),
      applications: 0,
      matchScore: 80,
      status: 'active',
    });

    const savedJob = await newJob.save();
    const duration = Date.now() - startTime;

    logger.info(`[${requestId}] POST /api/jobs - Created job ${savedJob._id} in ${duration}ms`);

    return NextResponse.json({
      success: true,
      data: savedJob,
    }, { status: 201 });

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    logger.error(`[${requestId}] POST /api/jobs - Error after ${duration}ms:`, errorMessage);

    // Handle duplicate key error
    if (error instanceof Error && error.message.includes('duplicate')) {
      return NextResponse.json({
        success: false,
        error: 'Duplicate job entry',
        message: 'A job with similar details already exists',
      }, { status: 409 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to create job',
      message: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
    }, { status: 500 });
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

async function seedSampleJobs(tenantId: string): Promise<typeof Job[]> {
  try {
    const sampleJobs = [
      {
        tenantId,
        title: 'Senior React Developer',
        description: 'Build scalable web applications using React and Next.js. Work with cutting-edge technologies in a fast-paced startup environment.',
        skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL'],
        type: 'full_time',
        location: { city: 'Bangalore', remote: false, hybrid: true },
        salary: { min: 1800000, max: 2200000, currency: 'INR', period: 'year' },
        employer: { id: '1', name: 'TechCorp', type: 'Startup', verified: true },
        requirements: ['5+ years experience', 'BS in Computer Science'],
        benefits: ['Health insurance', 'Stock options', 'Remote work'],
      },
      {
        tenantId,
        title: 'ML Engineer',
        description: 'Build and deploy machine learning models at scale. Join our research team to solve challenging problems.',
        skills: ['Python', 'TensorFlow', 'PyTorch', 'MLOps', 'AWS'],
        type: 'full_time',
        location: { city: 'Hyderabad', remote: true, hybrid: false },
        salary: { min: 2500000, max: 3500000, currency: 'INR', period: 'year' },
        employer: { id: '2', name: 'AI Labs', type: 'Research', verified: true },
        requirements: ['MS/PhD preferred', '3+ years ML experience'],
        benefits: ['Conference budget', 'Research time', 'Flexible hours'],
      },
      {
        tenantId,
        title: 'Full Stack Developer',
        description: 'Work on our core product with React and Node.js. Build features used by millions of users.',
        skills: ['React', 'Python', 'AWS', 'Docker'],
        type: 'full_time',
        location: { city: 'Remote', remote: true, hybrid: false },
        salary: { min: 1500000, max: 2000000, currency: 'INR', period: 'year' },
        employer: { id: '3', name: 'WebWorks', type: 'Startup', verified: true },
        requirements: ['3+ years full-stack experience'],
        benefits: ['Unlimited PTO', 'Home office budget', 'Learning stipend'],
      },
    ];

    // Insert sample jobs
    const insertedJobs = await Job.insertMany(sampleJobs, { ordered: false });
    logger.info(`Seeded ${insertedJobs.length} sample jobs`);

    return insertedJobs;
  } catch (error) {
    logger.error('Failed to seed sample jobs:', error);
    return [];
  }
}
