# Contributing to RiderCircle

Thank you for your interest in contributing to RiderCircle! 🚴

---

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Making Changes](#making-changes)
- [Submitting Changes](#submitting-changes)
- [Code Style](#code-style)
- [Testing](#testing)
- [Documentation](#documentation)

---

## Getting Started

1. **Fork the repository**
   ```bash
   git clone https://github.com/your-org/rider-circle.git
   cd rider-circle
   ```

2. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/original-org/rider-circle.git
   ```

3. **Create your branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

---

## Development Setup

### Prerequisites

- Node.js 18+
- Python 3.11+
- MongoDB 6.0+
- Docker (optional)

### Backend API

```bash
cd rider-circle-api
npm install
cp .env.example .env
# Edit .env with your values
npm run dev
```

### Mobile App

```bash
cd rider-circle-app
npm install
cp .env.example .env
# Edit .env with your values
npm start
```

### Running Tests

```bash
# API tests
cd rider-circle-api
npm test

# Mobile type check
cd rider-circle-app
npm run type-check
```

---

## Project Structure

```
rider-circle/
├── rider-circle-api/         # Express + MongoDB backend
│   ├── src/
│   │   ├── config/          # Configuration
│   │   ├── models/          # Mongoose models
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── events/          # Socket.io
│   │   ├── middleware/      # Auth, validation
│   │   └── utils/           # Helpers
│   └── tests/               # Unit tests
│
├── rider-circle-app/         # Expo mobile app
│   ├── app/                 # Screens (expo-router)
│   ├── components/          # Reusable UI
│   ├── hooks/               # Custom hooks
│   ├── services/            # API client
│   └── stores/              # Zustand stores
│
├── rider-circle-graph/       # Neo4j knowledge graph
├── rider-circle-intelligence/ # Python AI
└── rider-circle-shared/      # TypeScript SDK
```

---

## Making Changes

### 1. Create a Feature Branch

```bash
git checkout -b feature/add-some-feature
```

### 2. Make Your Changes

- Write clean, maintainable code
- Follow the code style guidelines
- Add comments for complex logic
- Update tests if needed

### 3. Test Your Changes

```bash
# Run API tests
npm test

# Run type checks
npm run type-check

# Run linter
npm run lint
```

### 4. Commit Your Changes

```bash
git add .
git commit -m "feat: add some feature"
```

#### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Refactoring
- `test`: Testing
- `chore`: Maintenance

**Example:**
```
feat(sos): add nearby rider notification

Add notification to nearby riders when SOS is triggered.
Include distance and estimated arrival time.

Closes #123
```

---

## Submitting Changes

### 1. Push Your Branch

```bash
git push origin feature/your-feature-name
```

### 2. Create Pull Request

1. Go to GitHub repository
2. Click "New Pull Request"
3. Select your branch
4. Fill in PR template
5. Submit

### PR Template

```markdown
## Description
<!-- What does this PR do? -->

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
<!-- How was this tested? -->

## Checklist
- [ ] My code follows the style guidelines
- [ ] I have performed a self-review
- [ ] I have commented my code where needed
- [ ] I have updated tests
- [ ] I have updated documentation
```

---

## Code Style

### TypeScript

- Use 2 spaces for indentation
- Use single quotes for strings
- Use semicolons
- Maximum line length: 100 characters
- Use `const` for variables that don't change

### React/React Native

- Use functional components with hooks
- Use TypeScript for all components
- Keep components small and focused
- Use meaningful variable names

### API Routes

- Use async/await
- Handle errors properly
- Return consistent response format
- Add JSDoc comments

---

## Testing

### Unit Tests

```typescript
describe('RiderService', () => {
  it('should create a rider profile', async () => {
    const rider = await createRider(validData);
    expect(rider).toBeDefined();
  });
});
```

### Integration Tests

```typescript
describe('POST /api/riders', () => {
  it('should create a rider', async () => {
    const response = await request(app)
      .post('/api/riders')
      .send(validData);

    expect(response.status).toBe(201);
  });
});
```

### Running Tests

```bash
# All tests
npm test

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

---

## Documentation

### API Documentation

Use JSDoc for all endpoints:

```typescript
/**
 * Create a new rider profile
 *
 * @param {CreateRiderRequest} data - Rider data
 * @returns {Promise<Rider>} Created rider
 *
 * @example
 * const rider = await createRider({
 *   displayName: 'John Doe',
 *   phone: '+919876543210',
 *   bloodGroup: 'O+'
 * });
 */
```

### README Updates

If you add a new feature, update the README:
- Add feature description
- Add usage example
- Add API endpoint if applicable

---

## Questions?

- Open an issue for bugs
- Join our Discord for discussions
- Email the team at support@ridercircle.app

---

**Thank you for contributing to RiderCircle!** 🚴‍♂️