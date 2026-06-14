# REZ Education LMS Service

**Port: 4501**

Learning Management System for educational institutions.

## Features

- Course content management
- Lesson and module organization
- Student enrollment tracking
- Progress tracking
- Quiz and assessment management

## API Endpoints

### Lessons
- `GET /api/lessons` - List all lessons
- `GET /api/lessons/:id` - Get lesson by ID
- `POST /api/lessons` - Create lesson
- `PUT /api/lessons/:id` - Update lesson
- `DELETE /api/lessons/:id` - Delete lesson
- `GET /api/lessons/course/:courseId` - Get lessons by course

### Enrollments
- `GET /api/enrollments` - List enrollments
- `GET /api/enrollments/:id` - Get enrollment by ID
- `POST /api/enrollments` - Enroll student
- `PATCH /api/enrollments/:id/progress` - Update progress
- `DELETE /api/enrollments/:id` - Cancel enrollment

## Environment Variables

```
PORT=4501
MONGODB_URI=mongodb://localhost:27017/rez_education_lms
```
