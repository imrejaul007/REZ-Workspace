/**
 * Course Service - Course Management Backend
 * Part of LEARNIQ - Education AI
 */

import { v4 as uuidv4 } from 'uuid';

export interface Course {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  instructorId: string;
  instructorName: string;
  duration: number; // hours
  price: number;
  level: 'beginner' | 'intermediate' | 'advanced';
  status: 'draft' | 'published' | 'archived';
  modules: Module[];
  enrollmentCount: number;
  rating: number;
  createdAt: string;
  updatedAt: string;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'document' | 'quiz' | 'assignment';
  duration: number; // minutes
  content: string;
  order: number;
}

export class CourseService {
  private courses: Map<string, Course> = new Map();

  async create(data: Omit<Course, 'id' | 'createdAt' | 'updatedAt' | 'enrollmentCount' | 'rating'>): Promise<Course> {
    const course: Course = {
      ...data,
      id: uuidv4(),
      enrollmentCount: 0,
      rating: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.courses.set(course.id, course);
    return course;
  }

  async getById(id: string): Promise<Course | undefined> {
    return this.courses.get(id);
  }

  async getAll(filters?: { category?: string; level?: string; status?: string }): Promise<Course[]> {
    let result = Array.from(this.courses.values());

    if (filters?.category) result = result.filter(c => c.category === filters.category);
    if (filters?.level) result = result.filter(c => c.level === filters.level);
    if (filters?.status) result = result.filter(c => c.status === filters.status);

    return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async update(id: string, updates: Partial<Course>): Promise<Course | undefined> {
    const course = this.courses.get(id);
    if (!course) return undefined;

    Object.assign(course, updates, { updatedAt: new Date().toISOString() });
    this.courses.set(id, course);
    return course;
  }

  async publish(id: string): Promise<Course | undefined> {
    return this.update(id, { status: 'published' });
  }

  async archive(id: string): Promise<Course | undefined> {
    return this.update(id, { status: 'archived' });
  }

  async getPopularCourses(limit: number = 10): Promise<Course[]> {
    return Array.from(this.courses.values())
      .filter(c => c.status === 'published')
      .sort((a, b) => b.enrollmentCount - a.enrollmentCount)
      .slice(0, limit);
  }

  async getTopRatedCourses(limit: number = 10): Promise<Course[]> {
    return Array.from(this.courses.values())
      .filter(c => c.status === 'published' && c.rating > 0)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit);
  }

  async search(query: string): Promise<Course[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.courses.values())
      .filter(c => c.status === 'published')
      .filter(c =>
        c.name.toLowerCase().includes(lowerQuery) ||
        c.description.toLowerCase().includes(lowerQuery) ||
        c.category.toLowerCase().includes(lowerQuery)
      );
  }

  async incrementEnrollment(courseId: string): Promise<void> {
    const course = this.courses.get(courseId);
    if (course) {
      course.enrollmentCount++;
      this.courses.set(courseId, course);
    }
  }
}

export default CourseService;