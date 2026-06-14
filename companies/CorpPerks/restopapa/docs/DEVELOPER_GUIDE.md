# Developer Guide - Restaurant SaaS Platform

## Project Overview

The Restaurant SaaS Platform is a comprehensive solution for the restaurant industry, providing features for restaurant management, employee verification, job posting, vendor marketplace, and community interaction.

## Architecture

### Technology Stack

**Backend:**
- NestJS (Node.js framework)
- TypeScript
- PostgreSQL (Database)
- Prisma (ORM)
- JWT (Authentication)
- bcrypt (Password hashing)
- AWS S3 (File storage)

**Frontend:**
- Next.js 14 (React framework)
- TypeScript
- Tailwind CSS
- Framer Motion (Animations)
- React Hook Form (Form handling)
- React Query (Data fetching)
- Zustand (State management)

**Infrastructure:**
- Docker & Docker Compose
- AWS (ECS, RDS, S3)
- Nginx (Reverse proxy)
- Redis (Caching)

## Project Structure

```
restaurant-saas/
├── backend/                 # NestJS API server
│   ├── src/
│   │   ├── auth/           # Authentication module
│   │   ├── restaurants/    # Restaurant management
│   │   ├── employees/      # Employee management
│   │   ├── jobs/          # Job portal
│   │   ├── vendors/       # Vendor marketplace
│   │   ├── discussions/   # Community forum
│   │   ├── payments/      # Payment integration
│   │   └── prisma/        # Database service
│   ├── prisma/            # Database schema & migrations
│   └── Dockerfile
├── frontend/               # Next.js web application
│   ├── app/               # App router pages
│   ├── components/        # Reusable components
│   ├── lib/              # Utilities & API client
│   ├── hooks/            # Custom React hooks
│   └── Dockerfile
├── shared/                # Shared types & utilities
├── database/             # SQL schema & seeds
├── docs/                 # Documentation
└── docker-compose.yml    # Development environment
```

## Development Setup

### Prerequisites

1. **Node.js 18+**
2. **PostgreSQL 15+**
3. **Docker & Docker Compose**
4. **Git**

### Environment Setup

1. **Clone Repository**
```bash
git clone <repository-url>
cd restaurant-saas
```

2. **Install Dependencies**
```bash
npm run install:all
```

3. **Environment Configuration**
```bash
# Copy environment files
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local

# Update with your configuration values
```

4. **Database Setup**
```bash
# Start PostgreSQL with Docker
docker-compose up -d postgres

# Run migrations
cd backend
npx prisma migrate dev
npx prisma generate
```

5. **Start Development Servers**
```bash
# Option 1: Use Docker Compose (Recommended)
docker-compose up

# Option 2: Start manually
npm run dev  # Starts both backend and frontend
```

## Database Design

### Core Entities

#### Users Table
```sql
- id: UUID (Primary Key)
- email: VARCHAR (Unique)
- phone: VARCHAR (Unique)
- password_hash: VARCHAR
- role: ENUM (restaurant, employee, vendor, admin)
- is_active: BOOLEAN
- created_at: TIMESTAMP
```

#### Key Relationships
- User → Restaurant (1:1)
- User → Employee (1:1)
- User → Vendor (1:1)
- Restaurant → Jobs (1:Many)
- Employee → JobApplications (1:Many)
- Restaurant → EmploymentHistory (1:Many)

### Data Validation & Security

#### Input Validation
```typescript
// Using class-validator decorators
export class CreateRestaurantDto {
  @IsString()
  @MinLength(2)
  businessName: string;

  @IsEmail()
  email: string;

  @IsEnum(RestaurantCategory)
  category: RestaurantCategory;
}
```

#### Authentication & Authorization
```typescript
// JWT Strategy
@UseGuards(JwtAuthGuard)
@Controller('restaurants')
export class RestaurantsController {
  @Get('profile')
  getProfile(@Request() req) {
    return req.user; // Authenticated user
  }
}
```

## API Documentation

### Authentication Endpoints

#### POST /api/v1/auth/register
```typescript
{
  email: string;
  password: string;
  role: 'restaurant' | 'employee' | 'vendor';
  // Role-specific fields...
}
```

#### POST /api/v1/auth/login
```typescript
{
  email: string;
  password: string;
}

// Response
{
  user: User;
  token: string;
}
```

### Restaurant Endpoints

#### GET /api/v1/restaurants
Query Parameters:
- `page`: number (default: 1)
- `limit`: number (default: 20)
- `category`: RestaurantCategory
- `city`: string
- `search`: string

#### POST /api/v1/restaurants
```typescript
{
  businessName: string;
  ownerName: string;
  category: RestaurantCategory;
  addresses: RestaurantAddress[];
  // ... other fields
}
```

### Employee Endpoints

#### GET /api/v1/employees
Query Parameters:
- `page`: number
- `limit`: number
- `skills`: string[]
- `experience`: number (years)
- `city`: string

#### GET /api/v1/employees/:id
Returns complete employee profile with:
- Basic information
- Work history
- Reviews and ratings
- Verification status

### Job Portal Endpoints

#### GET /api/v1/jobs
#### POST /api/v1/jobs
#### PUT /api/v1/jobs/:id
#### DELETE /api/v1/jobs/:id

#### POST /api/v1/jobs/:id/apply
```typescript
{
  coverLetter?: string;
}
```

## Frontend Development

### Component Structure

```
components/
├── ui/                    # Basic UI components
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Modal.tsx
│   └── ...
├── forms/                 # Form components
│   ├── LoginForm.tsx
│   ├── RestaurantForm.tsx
│   └── ...
├── layout/                # Layout components
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   └── ...
└── features/              # Feature-specific components
    ├── restaurants/
    ├── jobs/
    ├── employees/
    └── ...
```

### State Management

#### Auth State (Context)
```typescript
const { user, login, logout, loading } = useAuth();
```

#### API State (React Query)
```typescript
const {
  data: restaurants,
  isLoading,
  error
} = useQuery(['restaurants', filters], 
  () => fetchRestaurants(filters)
);
```

### Form Handling

```typescript
const form = useForm<RestaurantFormData>({
  resolver: zodResolver(restaurantSchema),
  defaultValues: {
    businessName: '',
    category: 'casual_dining',
  }
});

const onSubmit = async (data: RestaurantFormData) => {
  try {
    await createRestaurant(data);
    toast.success('Restaurant created successfully!');
    router.push('/dashboard');
  } catch (error) {
    toast.error('Failed to create restaurant');
  }
};
```

### Styling Guidelines

#### Tailwind CSS Classes
```typescript
// Button variants
const buttonVariants = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700',
  secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
  danger: 'bg-red-600 text-white hover:bg-red-700',
};

// Card component
<div className="bg-white rounded-xl shadow-soft p-6 border border-gray-100">
  {/* Card content */}
</div>
```

#### Responsive Design
```typescript
// Mobile-first approach
<div className="
  grid 
  grid-cols-1 
  md:grid-cols-2 
  lg:grid-cols-3 
  gap-4
">
  {items.map(item => (
    <div key={item.id} className="card">
      {/* Item content */}
    </div>
  ))}
</div>
```

## Security Implementation

### Password Security
```typescript
// Hashing (Backend)
import * as bcrypt from 'bcryptjs';

const saltRounds = 12;
const hashedPassword = await bcrypt.hash(password, saltRounds);

// Verification
const isValid = await bcrypt.compare(password, hashedPassword);
```

### JWT Implementation
```typescript
// Token generation
const payload = {
  sub: user.id,
  email: user.email,
  role: user.role,
};

const token = this.jwtService.sign(payload, {
  expiresIn: '7d',
});

// Token verification (Middleware)
@UseGuards(JwtAuthGuard)
export class ProtectedController {
  // Protected routes
}
```

### Input Sanitization
```typescript
// Validation pipes
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
);
```

### Rate Limiting
```typescript
@UseGuards(ThrottlerGuard)
@Throttle(10, 60) // 10 requests per minute
export class AuthController {
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    // Login logic
  }
}
```

## Testing Strategy

### Backend Testing

#### Unit Tests
```typescript
describe('RestaurantsService', () => {
  let service: RestaurantsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        RestaurantsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<RestaurantsService>(RestaurantsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should create a restaurant', async () => {
    const restaurantData = {
      businessName: 'Test Restaurant',
      ownerName: 'John Doe',
      category: RestaurantCategory.casual_dining,
    };

    jest.spyOn(prisma.restaurant, 'create').mockResolvedValue(mockRestaurant);

    const result = await service.create('user-id', restaurantData);
    expect(result).toEqual(mockRestaurant);
  });
});
```

#### Integration Tests
```typescript
describe('RestaurantsController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Login and get auth token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password' });

    authToken = loginResponse.body.token;
  });

  it('/restaurants (POST)', () => {
    return request(app.getHttpServer())
      .post('/restaurants')
      .set('Authorization', `Bearer ${authToken}`)
      .send(createRestaurantDto)
      .expect(201);
  });
});
```

### Frontend Testing

#### Component Tests
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { LoginForm } from '@/components/auth/LoginForm';

describe('LoginForm', () => {
  it('submits form with correct data', async () => {
    const mockOnSubmit = jest.fn();
    render(<LoginForm onSubmit={mockOnSubmit} />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });

    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });
});
```

## Performance Optimization

### Database Optimization

#### Indexing Strategy
```sql
-- User lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Restaurant searches
CREATE INDEX idx_restaurants_category ON restaurants(category);
CREATE INDEX idx_restaurants_trust_score ON restaurants(trust_score DESC);

-- Job searches
CREATE INDEX idx_jobs_status_created ON jobs(status, created_at DESC);
CREATE INDEX idx_jobs_location ON jobs(location);
```

#### Query Optimization
```typescript
// Efficient pagination with cursor-based pagination
const restaurants = await prisma.restaurant.findMany({
  take: limit,
  cursor: cursor ? { id: cursor } : undefined,
  orderBy: { createdAt: 'desc' },
  include: {
    addresses: true,
    _count: {
      select: {
        jobs: { where: { status: 'open' } },
      },
    },
  },
});
```

### Frontend Optimization

#### Code Splitting
```typescript
// Route-based code splitting
import { lazy, Suspense } from 'react';

const RestaurantDashboard = lazy(() => import('./RestaurantDashboard'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <RestaurantDashboard />
    </Suspense>
  );
}
```

#### Image Optimization
```typescript
import Image from 'next/image';

<Image
  src="/restaurant-image.jpg"
  alt="Restaurant"
  width={400}
  height={300}
  priority={false}
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>
```

#### API Response Caching
```typescript
// React Query with caching
const { data } = useQuery(
  ['restaurants', filters],
  () => fetchRestaurants(filters),
  {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  }
);
```

## Error Handling

### Backend Error Handling

#### Global Exception Filter
```typescript
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = exception instanceof HttpException
      ? exception.getResponse()
      : 'Internal server error';

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}
```

### Frontend Error Handling

#### Error Boundary
```typescript
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }

    return this.props.children;
  }
}
```

## Deployment Considerations

### Environment Configuration
```typescript
// Validation schema for environment variables
const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  AWS_S3_BUCKET_NAME: z.string(),
  RAZORPAY_KEY_ID: z.string(),
});

export const config = configSchema.parse(process.env);
```

### Health Checks
```typescript
@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async checkHealth() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: 'connected',
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
      };
    }
  }
}
```

## Maintenance & Monitoring

### Logging Strategy
```typescript
import { Logger } from '@nestjs/common';

@Injectable()
export class RestaurantsService {
  private readonly logger = new Logger(RestaurantsService.name);

  async create(userId: string, data: CreateRestaurantDto) {
    this.logger.log(`Creating restaurant for user ${userId}`);
    
    try {
      const restaurant = await this.prisma.restaurant.create({
        data: { ...data, userId },
      });
      
      this.logger.log(`Restaurant created successfully: ${restaurant.id}`);
      return restaurant;
    } catch (error) {
      this.logger.error(`Failed to create restaurant: ${error.message}`);
      throw error;
    }
  }
}
```

### Performance Monitoring
```typescript
// Custom metrics collection
@Injectable()
export class MetricsService {
  private readonly metrics = new Map();

  recordApiCall(endpoint: string, duration: number, statusCode: number) {
    const key = `${endpoint}_${statusCode}`;
    const current = this.metrics.get(key) || { count: 0, totalDuration: 0 };
    
    this.metrics.set(key, {
      count: current.count + 1,
      totalDuration: current.totalDuration + duration,
      averageDuration: (current.totalDuration + duration) / (current.count + 1),
    });
  }
}
```

## Contributing Guidelines

### Code Standards
- Use TypeScript for type safety
- Follow ESLint and Prettier configurations
- Write comprehensive unit tests
- Document complex logic
- Use semantic commit messages

### Pull Request Process
1. Create feature branch from `main`
2. Implement feature with tests
3. Update documentation if needed
4. Submit PR with clear description
5. Address review feedback
6. Merge after approval

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/employee-verification

# Make commits with semantic messages
git commit -m "feat(employees): add Aadhaar verification endpoint"

# Push and create PR
git push origin feature/employee-verification
```