# CLAUDE.md - Education AI

## Project Type
Industry-specific AI system for educational institutions.

## Commands

### Start Main Server
```bash
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/hojai-ai/industry-ai/education-ai
npm install
npm start
# Runs on port 4050
```

### Start Employee Agents
```bash
# Teacher AI
cd employees/teacher-ai && npm install && npm start
# Runs on port 4052

# Student Counselor AI
cd employees/student-counselor-ai && npm install && npm start
# Runs on port 4053
```

### Start Services
```bash
# Course Service
cd services/course-service && npm install && npm start
# Runs on port 4051
```

## Key Files
- `src/index.ts` - Main server with all core APIs
- `employees/teacher-ai/src/index.ts` - Teaching agent
- `employees/student-counselor-ai/src/index.ts` - Counseling agent
- `services/course-service/src/index.ts` - Course management service

## Ports
- 4050: Education AI Main Server
- 4051: Course Service
- 4052: Teacher AI Agent
- 4053: Student Counselor AI Agent

## API Base URL
`http://localhost:4050`

## Development Notes
- Uses in-memory storage for rapid development
- All data persists only during server runtime
- For production, integrate with proper database
- TypeScript throughout for type safety
