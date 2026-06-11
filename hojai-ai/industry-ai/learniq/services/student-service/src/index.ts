/**
 * Student Service - Student Management Backend
 * Part of LEARNIQ - Education AI
 */

import { v4 as uuidv4 } from 'uuid';

export interface Student {
  id: string;
  studentId: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  educationLevel?: string;
  enrolledCourses: string[];
  completedCourses: string[];
  progress: Record<string, number>; // courseId -> progress percentage
  certificates: string[];
  createdAt: string;
  lastActive?: string;
}

export interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  enrolledAt: string;
  completedAt?: string;
  progress: number;
  status: 'active' | 'completed' | 'dropped';
  certificateId?: string;
}

export class StudentService {
  private students: Map<string, Student> = new Map();
  private enrollments: Map<string, Enrollment> = new Map();

  async create(data: Omit<Student, 'id' | 'createdAt'>): Promise<Student> {
    const student: Student = {
      ...data,
      id: uuidv4(),
      createdAt: new Date().toISOString()
    };

    this.students.set(student.id, student);
    return student;
  }

  async getById(id: string): Promise<Student | undefined> {
    return this.students.get(id);
  }

  async getAll(): Promise<Student[]> {
    return Array.from(this.students.values());
  }

  async update(id: string, updates: Partial<Student>): Promise<Student | undefined> {
    const student = this.students.get(id);
    if (!student) return undefined;

    Object.assign(student, updates);
    this.students.set(id, student);
    return student;
  }

  async enroll(studentId: string, courseId: string): Promise<Enrollment> {
    const enrollment: Enrollment = {
      id: uuidv4(),
      studentId,
      courseId,
      enrolledAt: new Date().toISOString(),
      progress: 0,
      status: 'active'
    };

    this.enrollments.set(enrollment.id, enrollment);

    const student = this.students.get(studentId);
    if (student) {
      student.enrolledCourses.push(courseId);
      student.progress[courseId] = 0;
      this.students.set(studentId, student);
    }

    return enrollment;
  }

  async updateProgress(enrollmentId: string, progress: number): Promise<Enrollment | undefined> {
    const enrollment = this.enrollments.get(enrollmentId);
    if (!enrollment) return undefined;

    enrollment.progress = Math.min(100, progress);
    this.enrollments.set(enrollmentId, enrollment);

    if (progress >= 100) {
      enrollment.status = 'completed';
      enrollment.completedAt = new Date().toISOString();
    }

    const student = this.students.get(enrollment.studentId);
    if (student) {
      student.progress[enrollment.courseId] = progress;
      if (progress >= 100 && !student.completedCourses.includes(enrollment.courseId)) {
        student.completedCourses.push(enrollment.courseId);
      }
      this.students.set(student.id, student);
    }

    return enrollment;
  }

  async getEnrollments(studentId: string): Promise<Enrollment[]> {
    return Array.from(this.enrollments.values())
      .filter(e => e.studentId === studentId)
      .sort((a, b) => new Date(b.enrolledAt).getTime() - new Date(a.enrolledAt).getTime());
  }

  async getStats(): Promise<{
    totalStudents: number;
    activeEnrollments: number;
    completedEnrollments: number;
    avgProgress: number;
    topPerformers: { id: string; name: string; completedCourses: number }[];
  }> {
    const students = Array.from(this.students.values());
    const enrollments = Array.from(this.enrollments.values());

    const avgProgress = enrollments.length > 0
      ? enrollments.reduce((sum, e) => sum + e.progress, 0) / enrollments.length
      : 0;

    const topPerformers = students
      .sort((a, b) => b.completedCourses.length - a.completedCourses.length)
      .slice(0, 5)
      .map(s => ({ id: s.id, name: s.name, completedCourses: s.completedCourses.length }));

    return {
      totalStudents: students.length,
      activeEnrollments: enrollments.filter(e => e.status === 'active').length,
      completedEnrollments: enrollments.filter(e => e.status === 'completed').length,
      avgProgress: Math.round(avgProgress),
      topPerformers
    };
  }
}

export default StudentService;