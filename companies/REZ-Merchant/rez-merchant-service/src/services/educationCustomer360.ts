// Education customer 360 extends CustomerService
import { CustomerService } from '@rez/base-services/customer-service';

export class EducationCustomerService extends CustomerService {
  /**
   * Get student learning history
   */
  async getStudentHistory(studentId: string): Promise<StudentHistory> {
    const customer = await this.getCustomer(studentId);
    return {
      studentId,
      enrolledCourses: customer.enrollments || [],
      completedCourses: customer.completions || [],
      totalHoursLearned: customer.learningHours || 0,
      achievements: customer.achievements || [],
      lastActiveDate: customer.lastActiveAt,
    };
  }

  /**
   * Get student enrollment status
   */
  async getEnrollmentStatus(studentId: string): Promise<EnrollmentStatus[]> {
    const customer = await this.getCustomer(studentId);
    return (customer.enrollments || []).map((enrollment) => ({
      courseId: enrollment.courseId,
      courseName: enrollment.courseName,
      status: enrollment.status,
      progress: enrollment.progress || 0,
      enrolledAt: enrollment.enrolledAt,
      lastAccessedAt: enrollment.lastAccessedAt,
    }));
  }

  /**
   * Get student progress reports for a specific course
   */
  async getProgressReports(studentId: string, courseId: string): Promise<ProgressReport> {
    const customer = await this.getCustomer(studentId);
    const courseEnrollment = (customer.enrollments || []).find(
      (e) => e.courseId === courseId
    );

    return {
      studentId,
      courseId,
      overallProgress: courseEnrollment?.progress || 0,
      completedModules: courseEnrollment?.completedModules || [],
      currentModule: courseEnrollment?.currentModule,
      assessments: courseEnrollment?.assessments || [],
      completionRate: courseEnrollment?.completionRate || 0,
      estimatedCompletionDate: courseEnrollment?.estimatedCompletion,
    };
  }
}

interface StudentHistory {
  studentId: string;
  enrolledCourses: CourseEnrollment[];
  completedCourses: CourseEnrollment[];
  totalHoursLearned: number;
  achievements: string[];
  lastActiveDate: Date | null;
}

interface CourseEnrollment {
  courseId: string;
  courseName?: string;
  status?: string;
  progress?: number;
  enrolledAt?: Date;
  lastAccessedAt?: Date;
  completedModules?: string[];
  currentModule?: string;
  assessments?: Assessment[];
  completionRate?: number;
  estimatedCompletion?: Date;
}

interface Assessment {
  assessmentId: string;
  score: number;
  completedAt: Date;
}

interface EnrollmentStatus {
  courseId: string;
  courseName: string;
  status: string;
  progress: number;
  enrolledAt: Date;
  lastAccessedAt: Date;
}

interface ProgressReport {
  studentId: string;
  courseId: string;
  overallProgress: number;
  completedModules: string[];
  currentModule: string | undefined;
  assessments: Assessment[];
  completionRate: number;
  estimatedCompletionDate: Date | undefined;
}
