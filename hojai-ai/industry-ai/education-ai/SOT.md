# Education AI - Statement of Truth

## Project Overview
Education AI is an intelligent system for managing educational institutions, providing tools for course management, student advising, teaching assistance, and academic planning.

## Core Beliefs
1. Every student deserves personalized attention and support
2. Technology should enhance, not replace, human educators
3. Data-driven insights lead to better educational outcomes
4. Accessibility and inclusivity are fundamental

## System Architecture

### Main Server (Port 4050)
- Express.js server handling all core API endpoints
- Student, course, enrollment, assignment, and announcement management
- In-memory database for rapid prototyping

### Employee Agents

#### Teacher AI (Port 4052)
- Lesson plan generation
- Grade management and tracking
- Quiz creation and grading
- Attendance tracking

#### Student Counselor AI (Port 4053)
- Student profile management
- Academic planning
- Career guidance and matching
- Intervention tracking

### Services

#### Course Service (Port 4051)
- Course CRUD operations
- Syllabus management
- Section management
- Material and assessment tracking

## Technology Stack
- Node.js + Express.js
- TypeScript for type safety
- Winston for logging
- In-memory storage for rapid development

## Data Models

### Student
- Personal information (name, email, grade level)
- Academic data (GPA, enrolled courses, attendance)
- Profile for counseling purposes

### Course
- Course details (code, name, description, credits)
- Schedule and capacity
- Materials and assessments
- Prerequisites and learning outcomes

### Enrollment
- Links students to courses
- Tracks enrollment status and grades

## API Design
RESTful API with JSON responses. All endpoints return appropriate HTTP status codes.

## Security Considerations
- Input validation on all endpoints
- Error handling without information leakage
- Rate limiting recommended for production

## Performance Targets
- Response time: < 100ms for CRUD operations
- Support for 1000+ concurrent students
- Real-time attendance updates

## Testing Strategy
- Unit tests for business logic
- Integration tests for API endpoints
- Load testing for scalability validation
