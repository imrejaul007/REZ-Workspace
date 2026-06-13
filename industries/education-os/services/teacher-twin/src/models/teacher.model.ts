import { v4 as uuidv4 } from 'uuid';
import { TeacherTwin } from '../schemas/teacher.schema';

export class TeacherModel {
  static createTeacher(data: {
    identity: TeacherTwin['identity'];
    metadata: TeacherTwin['metadata'];
    employeeId?: string;
  }): TeacherTwin {
    const now = new Date().toISOString();
    const twinId = `teacher_${uuidv4()}`;

    return {
      twinId,
      employeeId: data.employeeId || uuidv4(),
      createdAt: now,
      updatedAt: now,
      identity: {
        name: {
          first: data.identity.name.first,
          last: data.identity.name.last,
          display: data.identity.name.display || `${data.identity.name.first} ${data.identity.name.last}`
        },
        contact: {
          email: data.identity.contact.email,
          phone: data.identity.contact.phone
        },
        credentials: data.identity.credentials || { degrees: [], certifications: [], awards: [] },
        verified: data.identity.verified || false,
        trustScore: data.identity.trustScore || 50
      },
      expertise: {
        subjects: [],
        methodologies: [],
        languages: ['English'],
        tools: [],
        specializations: []
      },
      teaching: {
        style: {
          approach: 'lecture',
          communication: 'formal',
          assessment: 'continuous'
        },
        metrics: {
          avgRating: 0,
          totalStudents: 0,
          completionRate: 0,
          avgClassSize: 0,
          yearsExperience: 0
        },
        availability: {
          schedule: {},
          timezone: 'UTC',
          preferredSlots: []
        }
      },
      performance: {
        studentOutcomes: { avgScore: 0, improvementRate: 0, passRate: 0 },
        engagement: { avgAttendance: 0, studentSatisfaction: 0, parentFeedback: 0 },
        professional: { workshopsAttended: 0, certificationsEarned: 0, peerReviews: 0 }
      },
      relationships: {
        institutionId: '',
        courses: [],
        students: [],
        colleagues: [],
        department: ''
      },
      financial: {
        walletBalance: 0,
        salary: [],
        pendingPayments: 0,
        rating: 0
      },
      metadata: {
        hireDate: data.metadata.hireDate,
        status: data.metadata.status,
        type: data.metadata.type
      }
    };
  }

  static updateTeacher(teacher: TeacherTwin, updates: Partial<TeacherTwin>): TeacherTwin {
    return {
      ...teacher,
      ...updates,
      twinId: teacher.twinId,
      employeeId: teacher.employeeId,
      createdAt: teacher.createdAt,
      updatedAt: new Date().toISOString()
    };
  }

  static addSubjectExpertise(teacher: TeacherTwin, subject: TeacherTwin['expertise']['subjects'][0]): TeacherTwin {
    const subjects = [...teacher.expertise.subjects];
    const existingIndex = subjects.findIndex(s => s.subjectId === subject.subjectId);
    if (existingIndex >= 0) {
      subjects[existingIndex] = subject;
    } else {
      subjects.push(subject);
    }
    return {
      ...teacher,
      expertise: { ...teacher.expertise, subjects },
      updatedAt: new Date().toISOString()
    };
  }

  static updateMetrics(teacher: TeacherTwin, metrics: Partial<TeacherTwin['teaching']['metrics']>): TeacherTwin {
    return {
      ...teacher,
      teaching: {
        ...teacher.teaching,
        metrics: { ...teacher.teaching.metrics, ...metrics }
      },
      updatedAt: new Date().toISOString()
    };
  }

  static addStudent(teacher: TeacherTwin, studentTwinId: string): TeacherTwin {
    if (teacher.relationships.students.includes(studentTwinId)) {
      return teacher;
    }
    return {
      ...teacher,
      relationships: {
        ...teacher.relationships,
        students: [...teacher.relationships.students, studentTwinId]
      },
      updatedAt: new Date().toISOString()
    };
  }

  static addCourse(teacher: TeacherTwin, courseTwinId: string): TeacherTwin {
    if (teacher.relationships.courses.includes(courseTwinId)) {
      return teacher;
    }
    return {
      ...teacher,
      relationships: {
        ...teacher.relationships,
        courses: [...teacher.relationships.courses, courseTwinId]
      },
      updatedAt: new Date().toISOString()
    };
  }

  static updatePerformance(teacher: TeacherTwin, performance: Partial<TeacherTwin['performance']>): TeacherTwin {
    return {
      ...teacher,
      performance: {
        studentOutcomes: { ...teacher.performance.studentOutcomes, ...performance.studentOutcomes },
        engagement: { ...teacher.performance.engagement, ...performance.engagement },
        professional: { ...teacher.performance.professional, ...performance.professional }
      },
      updatedAt: new Date().toISOString()
    };
  }
}
