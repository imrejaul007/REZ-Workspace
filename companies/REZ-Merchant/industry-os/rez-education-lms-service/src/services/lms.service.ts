import { LessonModel } from '../models/Lesson';
import { EnrollmentModel } from '../models/Enrollment';
import { Lesson, Enrollment, LessonType } from '../types';

export class LMSService {
  async createLesson(data: Partial<Lesson>): Promise<Lesson> {
    const lesson = new LessonModel(data);
    await lesson.save();
    return lesson.toJSON();
  }

  async getLessonById(id: string): Promise<Lesson | null> {
    const lesson = await LessonModel.findById(id);
    return lesson?.toJSON() || null;
  }

  async getLessons(filters: {
    courseId?: string;
    type?: LessonType;
    page?: number;
    limit?: number;
  }): Promise<{ lessons: Lesson[]; total: number }> {
    const { courseId, type, page = 1, limit = 20 } = filters;

    const query: Record<string, unknown> = {};
    if (courseId) query.courseId = courseId;
    if (type) query.type = type;

    const [lessons, total] = await Promise.all([
      LessonModel.find(query)
        .sort({ courseId: 1, order: 1 })
        .skip((page - 1) * limit)
        .limit(limit),
      LessonModel.countDocuments(query)
    ]);

    return {
      lessons: lessons.map(l => l.toJSON()),
      total
    };
  }

  async getLessonsByCourse(courseId: string): Promise<Lesson[]> {
    const lessons = await LessonModel.findByCourse(courseId);
    return lessons.map(l => l.toJSON());
  }

  async updateLesson(id: string, data: Partial<Lesson>): Promise<Lesson | null> {
    const lesson = await LessonModel.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    );
    return lesson?.toJSON() || null;
  }

  async deleteLesson(id: string): Promise<boolean> {
    const result = await LessonModel.findByIdAndDelete(id);
    return !!result;
  }

  async reorderLesson(id: string, newOrder: number): Promise<Lesson | null> {
    const lesson = await LessonModel.findByIdAndUpdate(
      id,
      { $set: { order: newOrder } },
      { new: true }
    );
    return lesson?.toJSON() || null;
  }

  async createEnrollment(data: { studentId: string; courseId: string; batchId: string }): Promise<Enrollment> {
    const enrollment = new EnrollmentModel({
      ...data,
      enrolledAt: new Date(),
      progress: 0,
      status: 'active',
      completedLessons: [],
      lastAccessedAt: new Date()
    });
    await enrollment.save();
    return enrollment.toJSON();
  }

  async getEnrollmentById(id: string): Promise<Enrollment | null> {
    const enrollment = await EnrollmentModel.findById(id);
    return enrollment?.toJSON() || null;
  }

  async getEnrollments(filters: {
    studentId?: string;
    courseId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ enrollments: Enrollment[]; total: number }> {
    const { studentId, courseId, status, page = 1, limit = 20 } = filters;

    const query: Record<string, unknown> = {};
    if (studentId) query.studentId = studentId;
    if (courseId) query.courseId = courseId;
    if (status) query.status = status;

    const [enrollments, total] = await Promise.all([
      EnrollmentModel.find(query)
        .sort({ enrolledAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      EnrollmentModel.countDocuments(query)
    ]);

    return {
      enrollments: enrollments.map(e => e.toJSON()),
      total
    };
  }

  async getEnrollmentsByStudent(studentId: string): Promise<Enrollment[]> {
    const enrollments = await EnrollmentModel.findByStudent(studentId);
    return enrollments.map(e => e.toJSON());
  }

  async getEnrollmentsByCourse(courseId: string): Promise<Enrollment[]> {
    const enrollments = await EnrollmentModel.findByCourse(courseId);
    return enrollments.map(e => e.toJSON());
  }

  async updateProgress(enrollmentId: string, lessonId: string, completed: boolean): Promise<Enrollment | null> {
    const enrollment = await EnrollmentModel.findById(enrollmentId);
    if (!enrollment) return null;

    if (completed && !enrollment.completedLessons.includes(lessonId)) {
      enrollment.completedLessons.push(lessonId);
    } else if (!completed && enrollment.completedLessons.includes(lessonId)) {
      enrollment.completedLessons = enrollment.completedLessons.filter(id => id !== lessonId);
    }

    enrollment.progress = await enrollment.calculateProgress(10);
    enrollment.lastAccessedAt = new Date();

    if (enrollment.progress === 100) {
      enrollment.status = 'completed';
      enrollment.completedAt = new Date();
    }

    await enrollment.save();
    return enrollment.toJSON();
  }

  async updateEnrollmentStatus(id: string, status: string): Promise<Enrollment | null> {
    const enrollment = await EnrollmentModel.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true }
    );
    return enrollment?.toJSON() || null;
  }

  async cancelEnrollment(id: string): Promise<Enrollment | null> {
    return this.updateEnrollmentStatus(id, 'dropped');
  }

  async getCourseStats(courseId: string): Promise<{
    totalEnrollments: number;
    activeEnrollments: number;
    completedEnrollments: number;
    averageProgress: number;
  }> {
    const enrollments = await EnrollmentModel.find({ courseId });

    const activeEnrollments = enrollments.filter(e => e.status === 'active').length;
    const completedEnrollments = enrollments.filter(e => e.status === 'completed').length;
    const averageProgress = enrollments.length > 0
      ? Math.round(enrollments.reduce((sum, e) => sum + e.progress, 0) / enrollments.length)
      : 0;

    return {
      totalEnrollments: enrollments.length,
      activeEnrollments,
      completedEnrollments,
      averageProgress
    };
  }
}

export const lmsService = new LMSService();
