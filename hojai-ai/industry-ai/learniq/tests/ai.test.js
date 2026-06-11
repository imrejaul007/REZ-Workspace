const mongoose = require('mongoose');
const { Student, Course } = require('../src/models');
const { tutorAgent, admissionAgent, placementAgent, graderAgent, getAllAgentStatus } = require('../src/ai');

jest.mock('../src/config/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

describe('AI Agents', () => {
  let testStudent;
  let testCourse;

  beforeAll(async () => {
    const mongoUri = process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/learniq_test';
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }

    testCourse = await new Course({
      name: 'JavaScript Fundamentals',
      description: 'Learn JavaScript from scratch',
      instructor: 'John Smith',
      duration: '8 weeks',
      price: 499,
      status: 'active'
    }).save();

    testStudent = await new Student({
      name: 'Test Student',
      email: 'test@example.com',
      phone: '1234567890',
      courseIds: [testCourse._id],
      status: 'active'
    }).save();
  });

  describe('AI Status', () => {
    it('should return status of all AI agents', async () => {
      const status = await getAllAgentStatus();

      expect(status.system).toBe('LEARNIQ Education AI');
      expect(status.agents).toHaveLength(4);
      expect(status.agents[0].agent).toBe('Tutor Agent');
      expect(status.agents[1].agent).toBe('Admission Agent');
      expect(status.agents[2].agent).toBe('Placement Agent');
      expect(status.agents[3].agent).toBe('Grader Agent');
    });
  });

  describe('Tutor Agent', () => {
    it('should return tutor agent status', async () => {
      const status = await tutorAgent.getStatus();

      expect(status.agent).toBe('Tutor Agent');
      expect(status.status).toBe('operational');
      expect(status.capabilities).toContain('personalized_learning_recommendations');
    });

    it('should generate recommendations for student', async () => {
      const result = await tutorAgent.recommend({
        studentId: testStudent._id.toString()
      });

      expect(result.success).toBe(true);
      expect(result.studentId).toBe(testStudent._id.toString());
      expect(result.recommendations).toBeDefined();
      expect(result.learningGaps).toBeDefined();
      expect(result.studyPlan).toBeDefined();
    });

    it('should handle non-existent student', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      const result = await tutorAgent.recommend({ studentId: fakeId });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Student not found');
    });
  });

  describe('Admission Agent', () => {
    it('should return admission agent status', async () => {
      const status = await admissionAgent.getStatus();

      expect(status.agent).toBe('Admission Agent');
      expect(status.status).toBe('operational');
      expect(status.capabilities).toContain('enrollment_processing');
    });

    it('should process valid enrollment', async () => {
      const result = await admissionAgent.process({
        name: 'New Student',
        email: 'newstudent@example.com',
        phone: '9876543210',
        courseId: testCourse._id.toString(),
        statementOfPurpose: 'I want to learn programming'
      });

      expect(result.success).toBe(true);
      expect(result.applicationStatus).toBe('accepted');
      expect(result.studentId).toBeDefined();
    });

    it('should reject duplicate email', async () => {
      const result = await admissionAgent.process({
        name: 'Duplicate Student',
        email: 'test@example.com',
        phone: '9876543210',
        courseId: testCourse._id.toString()
      });

      expect(result.success).toBe(false);
      expect(result.reason).toBe('duplicate_email');
    });

    it('should handle invalid course', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      const result = await admissionAgent.process({
        name: 'Student',
        email: 'student2@example.com',
        phone: '9876543210',
        courseId: fakeId
      });

      expect(result.success).toBe(false);
      expect(result.reason).toBe('invalid_course');
    });
  });

  describe('Placement Agent', () => {
    it('should return placement agent status', async () => {
      const status = await placementAgent.getStatus();

      expect(status.agent).toBe('Placement Agent');
      expect(status.status).toBe('operational');
      expect(status.capabilities).toContain('career_guidance');
    });

    it('should analyze student career profile', async () => {
      const result = await placementAgent.analyze({
        studentId: testStudent._id.toString(),
        skills: ['javascript', 'react']
      });

      expect(result.success).toBe(true);
      expect(result.profileAnalysis).toBeDefined();
      expect(result.careerRecommendations).toBeDefined();
      expect(result.skillGaps).toBeDefined();
    });

    it('should handle non-existent student', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      const result = await placementAgent.analyze({ studentId: fakeId });

      expect(result.success).toBe(false);
    });
  });

  describe('Grader Agent', () => {
    it('should return grader agent status', async () => {
      const status = await graderAgent.getStatus();

      expect(status.agent).toBe('Grader Agent');
      expect(status.status).toBe('operational');
      expect(status.capabilities).toContain('score_calculation');
    });

    it('should calculate grade with raw score', async () => {
      const result = await graderAgent.calculate({
        studentId: testStudent._id.toString(),
        courseId: testCourse._id.toString(),
        rawScore: 85
      });

      expect(result.success).toBe(true);
      expect(result.grade.letterGrade).toBe('B');
      expect(result.grade.score).toBe(85);
      expect(result.feedback).toBeDefined();
    });

    it('should calculate grade with weighted assignments', async () => {
      const result = await graderAgent.calculate({
        studentId: testStudent._id.toString(),
        courseId: testCourse._id.toString(),
        assignments: [
          { name: 'Midterm', score: 90, weight: 0.4 },
          { name: 'Final', score: 85, weight: 0.6 }
        ]
      });

      expect(result.success).toBe(true);
      expect(result.grade.breakdown).toBeDefined();
      expect(result.grade.letterGrade).toBe('B');
    });

    it('should generate class comparison', async () => {
      await graderAgent.calculate({
        studentId: testStudent._id.toString(),
        courseId: testCourse._id.toString(),
        rawScore: 90
      });

      const result = await graderAgent.calculate({
        studentId: testStudent._id.toString(),
        courseId: testCourse._id.toString(),
        rawScore: 85
      });

      expect(result.comparison).toBeDefined();
      expect(result.comparison.classAverage).toBeDefined();
    });

    it('should handle non-enrolled student', async () => {
      const fakeStudent = await new Student({
        name: 'Not Enrolled',
        email: 'notenrolled@example.com',
        phone: '1234567890'
      }).save();

      const result = await graderAgent.calculate({
        studentId: fakeStudent._id.toString(),
        courseId: testCourse._id.toString(),
        rawScore: 85
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Student is not enrolled in this course');
    });

    it('should calculate GPA', async () => {
      await graderAgent.calculate({
        studentId: testStudent._id.toString(),
        courseId: testCourse._id.toString(),
        rawScore: 90
      });

      const gpa = await graderAgent.calculateGPA(testStudent._id.toString());

      expect(gpa.totalCredits).toBeGreaterThan(0);
      expect(gpa.gpa).toBeGreaterThan(0);
    });
  });
});