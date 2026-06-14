# Contributing to RestoPapa

Thank you for your interest in contributing to RestoPapa! This guide will help you get started with contributing to our restaurant management and job marketplace platform.

## 🤝 Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. Please treat all contributors with respect and create a welcoming environment for everyone.

## 🚀 Getting Started

### Prerequisites

Before contributing, ensure you have:

- **Node.js** 18.0 or higher
- **PostgreSQL** 15.0 or higher (for full database setup)
- **Redis** 6.0 or higher (optional for development)
- **Git** for version control
- **Docker** (optional, for containerized development)

### Development Setup

1. **Fork the repository**
   ```bash
   # Fork on GitHub, then clone your fork
   git clone https://github.com/your-username/restopapa.git
   cd restopapa
   ```

2. **Set up your development environment**
   ```bash
   # Install dependencies
   npm install

   # Copy environment template
   cp .env.example .env

   # Generate Prisma client
   npm run db:generate

   # Start development servers
   npm run dev
   ```

3. **Verify your setup**
   ```bash
   # Check that all services are running
   curl http://localhost:3001/api/v1/auth/health
   curl http://localhost:3000
   ```

## 📋 How to Contribute

### Types of Contributions

We welcome various types of contributions:

- **🐛 Bug fixes**: Fix issues and improve stability
- **✨ New features**: Add new functionality
- **📚 Documentation**: Improve or add documentation
- **🧪 Tests**: Add or improve test coverage
- **🎨 UI/UX improvements**: Enhance user experience
- **⚡ Performance optimizations**: Improve speed and efficiency
- **🔒 Security enhancements**: Strengthen security measures

### Contribution Workflow

1. **Check existing issues**
   - Look through [GitHub Issues](https://github.com/yourusername/restopapa/issues)
   - Check if your bug/feature is already reported
   - Comment on relevant issues to avoid duplicate work

2. **Create an issue** (for significant changes)
   - Describe the bug or feature clearly
   - Include steps to reproduce (for bugs)
   - Provide mockups or wireframes (for UI changes)
   - Wait for discussion/approval before starting work

3. **Create a feature branch**
   ```bash
   # Update main branch
   git checkout main
   git pull upstream main

   # Create feature branch
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

4. **Make your changes**
   - Follow our coding standards (see below)
   - Write tests for new functionality
   - Update documentation as needed
   - Ensure your code passes all checks

5. **Test your changes**
   ```bash
   # Run tests
   npm run test

   # Run linting
   npm run lint

   # Check TypeScript compilation
   npm run build

   # Test in development mode
   npm run dev
   ```

6. **Commit your changes**
   ```bash
   # Stage changes
   git add .

   # Commit with conventional commit message
   git commit -m "feat: add user profile management feature"
   ```

7. **Push and create Pull Request**
   ```bash
   # Push to your fork
   git push origin feature/your-feature-name

   # Create PR on GitHub
   ```

## 📝 Coding Standards

### TypeScript Guidelines

- **Use strict TypeScript**: Enable all strict mode features
- **Type everything**: Avoid `any` type, prefer specific interfaces
- **Use interfaces**: Define clear interfaces for data structures
- **Prefer const assertions**: Use `as const` for immutable data

```typescript
// ✅ Good
interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  profile: {
    firstName: string;
    lastName: string;
  };
}

// ❌ Avoid
const userData: any = getUserData();
```

### Code Style

We use **ESLint** and **Prettier** for code formatting:

```bash
# Check linting
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

### Naming Conventions

- **Files**: Use kebab-case for files (`user-profile.service.ts`)
- **Classes**: Use PascalCase (`UserProfileService`)
- **Functions/Variables**: Use camelCase (`getUserProfile`)
- **Constants**: Use UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Interfaces**: Use PascalCase with descriptive names (`CreateUserRequest`)

### Component Guidelines (Frontend)

```typescript
// ✅ Good component structure
interface UserCardProps {
  user: UserProfile;
  onEdit: (id: string) => void;
  className?: string;
}

export function UserCard({ user, onEdit, className }: UserCardProps) {
  return (
    <div className={cn("p-4 border rounded-lg", className)}>
      <h3>{user.profile.firstName} {user.profile.lastName}</h3>
      <p>{user.email}</p>
      <button onClick={() => onEdit(user.id)}>Edit</button>
    </div>
  );
}
```

### API Development Guidelines (Backend)

```typescript
// ✅ Good controller structure
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, type: UserProfileDto })
  async getProfile(@Req() req: AuthenticatedRequest): Promise<UserProfileDto> {
    return this.usersService.findById(req.user.id);
  }
}
```

## 🧪 Testing Guidelines

### Test Structure

```typescript
// ✅ Good test structure
describe('UserService', () => {
  let service: UserService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [UserService, PrismaService],
    }).compile();

    service = module.get<UserService>(UserService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      // Arrange
      const userId = 'test-id';
      const expectedUser = { id: userId, email: 'test@example.com' };
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(expectedUser);

      // Act
      const result = await service.findById(userId);

      // Assert
      expect(result).toEqual(expectedUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
    });
  });
});
```

### Test Coverage

- **Unit tests**: Test individual functions and methods
- **Integration tests**: Test API endpoints and database interactions
- **E2E tests**: Test complete user workflows

```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm run test -- user.service.spec.ts
```

## 📚 Documentation Standards

### Code Documentation

```typescript
/**
 * Creates a new job posting for a restaurant
 * @param restaurantId - The ID of the restaurant posting the job
 * @param jobData - The job posting data
 * @returns Promise containing the created job
 * @throws {ForbiddenException} When user doesn't have permission
 * @throws {NotFoundException} When restaurant doesn't exist
 */
async createJob(restaurantId: string, jobData: CreateJobDto): Promise<Job> {
  // Implementation
}
```

### API Documentation

Use Swagger/OpenAPI decorators:

```typescript
@ApiOperation({ summary: 'Create a new job posting' })
@ApiResponse({ status: 201, description: 'Job created successfully', type: JobDto })
@ApiResponse({ status: 403, description: 'Forbidden' })
@ApiResponse({ status: 404, description: 'Restaurant not found' })
```

### README Updates

When adding new features:
- Update the main README.md
- Add feature-specific documentation
- Update API endpoint lists
- Include usage examples

## 🔀 Git Workflow

### Branch Naming

- **Features**: `feature/add-user-management`
- **Bug fixes**: `fix/auth-token-expiry`
- **Documentation**: `docs/update-contributing-guide`
- **Refactoring**: `refactor/user-service-cleanup`

### Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Types: feat, fix, docs, style, refactor, test, chore
feat: add user profile management feature
fix: resolve JWT token expiry issue
docs: update API documentation
test: add unit tests for user service
refactor: improve error handling in auth module
```

### Pull Request Guidelines

**PR Title**: Use conventional commit format
```
feat: add restaurant dashboard analytics
```

**PR Description Template**:
```markdown
## 📋 Description
Brief description of changes

## 🔄 Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring
- [ ] Performance improvement

## 🧪 Testing
- [ ] Tests pass locally
- [ ] New tests added for new functionality
- [ ] Manual testing completed

## 📚 Documentation
- [ ] Documentation updated
- [ ] API documentation updated
- [ ] README updated (if needed)

## ⚠️ Breaking Changes
None / List any breaking changes

## 📸 Screenshots (if applicable)
Add screenshots for UI changes
```

## 🚨 Common Issues and Solutions

### Development Issues

**Node.js Version Conflicts**
```bash
# Use Node Version Manager
nvm use 18
nvm install 18.0.0
```

**Database Connection Issues**
```bash
# Check PostgreSQL status
brew services list | grep postgresql

# Restart PostgreSQL
brew services restart postgresql
```

**Port Already in Use**
```bash
# Find and kill process using port 3001
lsof -ti:3001 | xargs kill -9
```

### Testing Issues

**Test Database Setup**
```bash
# Create test database
createdb restopapa_test

# Run migrations for test DB
DATABASE_URL="postgresql://localhost:5432/restopapa_test" npm run db:migrate
```

## 📋 Checklist for Contributors

Before submitting a PR, ensure:

### Code Quality
- [ ] Code follows project conventions
- [ ] TypeScript types are properly defined
- [ ] No console.log statements in production code
- [ ] Error handling is implemented
- [ ] Code is properly commented

### Testing
- [ ] All existing tests pass
- [ ] New tests added for new functionality
- [ ] Test coverage maintained or improved
- [ ] Manual testing completed

### Documentation
- [ ] Code is properly documented
- [ ] API documentation updated
- [ ] README updated if needed
- [ ] Migration guide provided for breaking changes

### Security
- [ ] No sensitive data in code
- [ ] Input validation implemented
- [ ] Authorization checks in place
- [ ] No SQL injection vulnerabilities

## 🎯 Areas for Contribution

### High Priority
- **Performance optimizations**: Database queries, caching
- **Security enhancements**: Additional security measures
- **Test coverage**: Increase test coverage to 90%+
- **Mobile responsiveness**: Improve mobile user experience

### Medium Priority
- **Feature enhancements**: Additional job portal features
- **Analytics improvements**: More detailed reporting
- **UI/UX improvements**: Better user interface design
- **Documentation**: More comprehensive guides

### Nice to Have
- **Internationalization**: Multi-language support
- **Theme system**: Dark/light mode
- **Advanced search**: Enhanced search capabilities
- **Integration tests**: More comprehensive E2E testing

## 🏆 Recognition

Contributors are recognized in:
- README.md contributor section
- Release notes for major contributions
- GitHub contributor graphs
- Special recognition for significant contributions

## 📞 Getting Help

### Communication Channels

- **GitHub Issues**: For bug reports and feature requests
- **GitHub Discussions**: For questions and general discussion
- **Email**: development@restopapa.com for sensitive issues

### Development Support

- **Code review**: Maintainers provide detailed feedback
- **Mentoring**: Help for new contributors
- **Technical guidance**: Architecture and design decisions

## 📖 Additional Resources

### Learning Resources
- [NestJS Documentation](https://docs.nestjs.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Project Resources
- [Architecture Documentation](./ARCHITECTURE.md)
- [Database Schema](./DATABASE.md)
- [API Documentation](../api/openapi.yaml)
- [Deployment Guide](../deployment/README.md)

---

Thank you for contributing to RestoPapa! Your efforts help make the restaurant industry more connected and efficient. 🍽️✨