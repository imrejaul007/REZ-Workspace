import { v4 as uuidv4 } from 'uuid';
import { CourseTwin } from '../schemas/course.schema';

export class CourseModel {
  static createCourse(data: { identity: CourseTwin['identity']; metadata: CourseTwin['metadata'] }): CourseTwin {
    const now = new Date().toISOString();
    const twinId = `course_${uuidv4()}`;
    return {
      twinId,
      courseId: uuidv4(),
      createdAt: now,
      updatedAt: now,
      identity: {
        title: data.identity.title,
        description: data.identity.description || '',
        code: data.identity.code,
        category: data.identity.category || '',
        level: data.identity.level || 'beginner',
        language: data.identity.language || 'en',
        thumbnail: data.identity.thumbnail || ''
      },
      content: {
        modules: [],
        totalDuration: 0,
        lessonsCount: 0,
        assignmentsCount: 0,
        quizzesCount: 0,
        resources: []
      },
      outcomes: {
        skills: [],
        competencies: [],
        certifications: [],
        learningObjectives: []
      },
      prerequisites: {
        required: [],
        recommended: [],
        minimumAge: 0,
        priorKnowledge: []
      },
      enrollment: {
        capacity: 100,
        enrolled: 0,
        waitlist: 0,
        completionRate: 0,
        avgScore: 0,
        avgRating: 0
      },
      instructors: {
        primary: '',
        secondary: [],
        teachingAssistants: []
      },
      pricing: {
        basePrice: 0,
        currency: 'INR',
        discounts: [],
        paymentPlans: []
      },
      delivery: {
        format: 'online',
        schedule: { dayOfWeek: [], startTime: '', endTime: '' },
        duration: { weeks: 0, sessionsPerWeek: 0, minutesPerSession: 0 },
        recordings: false,
        materials: []
      },
      relationships: {
        institutionId: '',
        curriculumId: '',
        programId: '',
        linkedCourses: []
      },
      metadata: {
        status: data.metadata.status || 'draft',
        lastUpdated: now,
        tags: data.metadata.tags || []
      }
    };
  }

  static updateCourse(course: CourseTwin, updates: Partial<CourseTwin>): CourseTwin {
    return {
      ...course,
      ...updates,
      twinId: course.twinId,
      courseId: course.courseId,
      updatedAt: new Date().toISOString()
    };
  }

  static addModule(course: CourseTwin, module: CourseTwin['content']['modules'][0]): CourseTwin {
    return {
      ...course,
      content: {
        ...course.content,
        modules: [...course.content.modules, module],
        lessonsCount: course.content.lessonsCount + module.lessons.length,
        assignmentsCount: course.content.assignmentsCount + module.assignments.length,
        quizzesCount: course.content.quizzesCount + module.quizzes.length
      },
      updatedAt: new Date().toISOString()
    };
  }

  static enrollStudent(course: CourseTwin): CourseTwin {
    if (course.enrollment.enrolled >= course.enrollment.capacity) {
      return {
        ...course,
        enrollment: { ...course.enrollment, waitlist: course.enrollment.waitlist + 1 }
      };
    }
    return {
      ...course,
      enrollment: { ...course.enrollment, enrolled: course.enrollment.enrolled + 1 },
      updatedAt: new Date().toISOString()
    };
  }

  static completeEnrollment(course: CourseTwin): CourseTwin {
    return {
      ...course,
      enrollment: { ...course.enrollment, waitlist: Math.max(0, course.enrollment.waitlist - 1) }
    };
  }

  static updateEnrollmentMetrics(course: CourseTwin, metrics: { completionRate?: number; avgScore?: number; avgRating?: number }): CourseTwin {
    return {
      ...course,
      enrollment: { ...course.enrollment, ...metrics },
      updatedAt: new Date().toISOString()
    };
  }

  static setInstructor(course: CourseTwin, instructorType: 'primary' | 'secondary' | 'ta', teacherTwinId: string): CourseTwin {
    if (instructorType === 'primary') {
      return { ...course, instructors: { ...course.instructors, primary: teacherTwinId } };
    } else if (instructorType === 'secondary') {
      return { ...course, instructors: { ...course.instructors, secondary: [...course.instructors.secondary, teacherTwinId] } };
    } else {
      return { ...course, instructors: { ...course.instructors, teachingAssistants: [...course.instructors.teachingAssistants, teacherTwinId] } };
    }
  }
}