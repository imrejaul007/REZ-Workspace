'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

// Types
interface Course {
  _id: string;
  title: string;
  description: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  status: 'draft' | 'published' | 'archived';
  duration: number;
  totalModules: number;
  totalLessons: number;
  enrollmentCount: number;
  thumbnail?: string;
}

interface Stats {
  total: number;
  published: number;
  draft: number;
  archived: number;
  totalEnrollments: number;
}

export default function LMSPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<{ status?: string; category?: string }>({});

  useEffect(() => {
    fetchCourses();
    fetchStats();
  }, [filter]);

  const fetchCourses = async () => {
    try {
      const params = new URLSearchParams();
      if (filter.status) params.append('status', filter.status);
      if (filter.category) params.append('category', filter.category);

      const response = await fetch(`${process.env.NEXT_PUBLIC_LMS_URL || 'http://localhost:4734'}/api/courses?${params}`, {
        headers: {
          'X-Tenant-Id': localStorage.getItem('tenantId') || 'default',
        },
      });
      const data = await response.json();
      setCourses(data.data || []);
    } catch (error) {
      logger.error('Failed to fetch courses:', error);
      // Use mock data for demo
      setCourses(mockCourses);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_LMS_URL || 'http://localhost:4734'}/api/courses/stats`, {
        headers: {
          'X-Tenant-Id': localStorage.getItem('tenantId') || 'default',
        },
      });
      const data = await response.json();
      setStats(data.data);
    } catch (error) {
      logger.error('Failed to fetch stats:', error);
      setStats({
        total: 24,
        published: 18,
        draft: 4,
        archived: 2,
        totalEnrollments: 156,
      });
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return styles.levelBeginner;
      case 'intermediate': return styles.levelIntermediate;
      case 'advanced': return styles.levelAdvanced;
      default: return '';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return styles.statusPublished;
      case 'draft': return styles.statusDraft;
      case 'archived': return styles.statusArchived;
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading courses...</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Learning Management</h1>
          <p className={styles.subtitle}>Manage courses, enrollments, and track employee progress</p>
        </div>
        <Link href="/lms/courses" className={styles.primaryBtn}>
          + Create Course
        </Link>
      </header>

      {stats && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>📚</span>
            <div className={styles.statContent}>
              <span className={styles.statValue}>{stats.total}</span>
              <span className={styles.statLabel}>Total Courses</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>✅</span>
            <div className={styles.statContent}>
              <span className={styles.statValue}>{stats.published}</span>
              <span className={styles.statLabel}>Published</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>📝</span>
            <div className={styles.statContent}>
              <span className={styles.statValue}>{stats.draft}</span>
              <span className={styles.statLabel}>Drafts</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>👥</span>
            <div className={styles.statContent}>
              <span className={styles.statValue}>{stats.totalEnrollments}</span>
              <span className={styles.statLabel}>Enrollments</span>
            </div>
          </div>
        </div>
      )}

      <div className={styles.filters}>
        <select
          value={filter.status || ''}
          onChange={(e) => setFilter({ ...filter, status: e.target.value || undefined })}
          className={styles.select}
        >
          <option value="">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
        <select
          value={filter.category || ''}
          onChange={(e) => setFilter({ ...filter, category: e.target.value || undefined })}
          className={styles.select}
        >
          <option value="">All Categories</option>
          <option value="onboarding">Onboarding</option>
          <option value="compliance">Compliance</option>
          <option value="leadership">Leadership</option>
          <option value="technical">Technical</option>
          <option value="soft-skills">Soft Skills</option>
        </select>
      </div>

      <div className={styles.courseGrid}>
        {courses.map((course) => (
          <div key={course._id} className={styles.courseCard}>
            <div
              className={styles.courseThumbnail}
              style={{ backgroundColor: course.thumbnail ? undefined : '#6366f1' }}
            >
              {course.thumbnail ? (
                <img src={course.thumbnail} alt={course.title} />
              ) : (
                <span className={styles.thumbnailIcon}>📖</span>
              )}
              <span className={`${styles.levelBadge} ${getLevelColor(course.level)}`}>
                {course.level}
              </span>
            </div>
            <div className={styles.courseContent}>
              <div className={styles.courseMeta}>
                <span className={styles.category}>{course.category}</span>
                <span className={`${styles.status} ${getStatusColor(course.status)}`}>
                  {course.status}
                </span>
              </div>
              <h3 className={styles.courseTitle}>{course.title}</h3>
              <p className={styles.courseDescription}>{course.description}</p>
              <div className={styles.courseStats}>
                <span>⏱️ {course.duration} min</span>
                <span>📚 {course.totalModules} modules</span>
                <span>👥 {course.enrollmentCount}</span>
              </div>
              <div className={styles.courseActions}>
                <Link href={`/lms/courses/${course._id}`} className={styles.viewBtn}>
                  View Details
                </Link>
                <button className={styles.editBtn}>Edit</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {courses.length === 0 && (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>📚</span>
          <h3>No courses found</h3>
          <p>Create your first course to get started</p>
          <Link href="/lms/courses" className={styles.primaryBtn}>
            Create Course
          </Link>
        </div>
      )}
    </div>
  );
}

// Mock data for demonstration
const mockCourses: Course[] = [
  {
    _id: '1',
    title: 'Company Onboarding Essentials',
    description: 'Essential onboarding program for new hires covering company culture, policies, and tools.',
    category: 'onboarding',
    level: 'beginner',
    status: 'published',
    duration: 120,
    totalModules: 5,
    totalLessons: 15,
    enrollmentCount: 45,
  },
  {
    _id: '2',
    title: 'Data Privacy & Security',
    description: 'Complete compliance training on data privacy regulations and security best practices.',
    category: 'compliance',
    level: 'intermediate',
    status: 'published',
    duration: 90,
    totalModules: 4,
    totalLessons: 12,
    enrollmentCount: 78,
  },
  {
    _id: '3',
    title: 'Leadership Excellence Program',
    description: 'Advanced leadership training for managers covering team management, delegation, and coaching.',
    category: 'leadership',
    level: 'advanced',
    status: 'published',
    duration: 240,
    totalModules: 8,
    totalLessons: 24,
    enrollmentCount: 23,
  },
  {
    _id: '4',
    title: 'React & TypeScript Fundamentals',
    description: 'Technical training on modern React development with TypeScript.',
    category: 'technical',
    level: 'intermediate',
    status: 'draft',
    duration: 180,
    totalModules: 6,
    totalLessons: 18,
    enrollmentCount: 0,
  },
];
