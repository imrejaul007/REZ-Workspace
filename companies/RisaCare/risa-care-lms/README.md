# RisaCare LMS

Learning Management System. Port 4744.

## Features
- Course management with modules
- User enrollments and progress tracking
- Assessments with scoring
- Certificates for course completion

## API
- POST /api/courses - Create course
- POST /api/enroll - Enroll user
- POST /api/assessments - Create assessment
- POST /api/certificates/issue - Issue certificate

## Run
```bash
npm install && npm start
```