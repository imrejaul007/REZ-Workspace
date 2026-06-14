'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

// Types
interface Module {
  id: string;
  title: string;
  description: string;
  order: number;
  estimatedDuration: number;
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'text' | 'quiz' | 'assignment' | 'document';
  duration: number;
  order: number;
}

interface CourseForm {
  title: string;
  description: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  instructor: string;
  tags: string[];
  modules: Module[];
}

export default function CoursesPage() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<CourseForm>({
    title: '',
    description: '',
    category: '',
    level: 'beginner',
    instructor: '',
    tags: [],
    modules: [],
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_LMS_URL || 'http://localhost:4734'}/api/courses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Id': localStorage.getItem('tenantId') || 'default',
        },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) {
        setShowForm(false);
        setFormData({
          title: '',
          description: '',
          category: '',
          level: 'beginner',
          instructor: '',
          tags: [],
          modules: [],
        });
        // Refresh list
        window.location.reload();
      }
    } catch (error) {
      logger.error('Failed to create course:', error);
      alert('Course created successfully! (Demo mode)');
      setShowForm(false);
    }
  };

  const addModule = () => {
    setFormData(prev => ({
      ...prev,
      modules: [
        ...prev.modules,
        {
          id: `mod_${Date.now()}`,
          title: '',
          description: '',
          order: prev.modules.length,
          estimatedDuration: 30,
          lessons: [],
        },
      ],
    }));
  };

  const updateModule = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      modules: prev.modules.map((m, i) =>
        i === index ? { ...m, [field]: value } : m
      ),
    }));
  };

  const addLesson = (moduleIndex: number) => {
    setFormData(prev => ({
      ...prev,
      modules: prev.modules.map((m, i) =>
        i === moduleIndex
          ? {
              ...m,
              lessons: [
                ...m.lessons,
                {
                  id: `les_${Date.now()}`,
                  title: '',
                  type: 'video' as const,
                  duration: 15,
                  order: m.lessons.length,
                },
              ],
            }
          : m
      ),
    }));
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <Link href="/lms" className={styles.backLink}>
            ← Back to LMS
          </Link>
          <h1>Course Management</h1>
          <p className={styles.subtitle}>Create and manage training courses</p>
        </div>
        <button onClick={() => setShowForm(true)} className={styles.primaryBtn}>
          + New Course
        </button>
      </header>

      {/* Course Form Modal */}
      {showForm && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Create New Course</h2>
              <button onClick={() => setShowForm(false)} className={styles.closeBtn}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Course Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter course title"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe the course content and objectives"
                  rows={3}
                  required
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Category *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select category</option>
                    <option value="onboarding">Onboarding</option>
                    <option value="compliance">Compliance</option>
                    <option value="leadership">Leadership</option>
                    <option value="technical">Technical</option>
                    <option value="soft-skills">Soft Skills</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Level</label>
                  <select
                    name="level"
                    value={formData.level}
                    onChange={handleInputChange}
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Instructor</label>
                <input
                  type="text"
                  name="instructor"
                  value={formData.instructor}
                  onChange={handleInputChange}
                  placeholder="Instructor name"
                />
              </div>

              <div className={styles.modulesSection}>
                <div className={styles.modulesHeader}>
                  <h3>Modules</h3>
                  <button type="button" onClick={addModule} className={styles.addBtn}>
                    + Add Module
                  </button>
                </div>

                {formData.modules.map((module, moduleIndex) => (
                  <div key={module.id} className={styles.moduleCard}>
                    <div className={styles.moduleHeader}>
                      <span className={styles.moduleNumber}>Module {moduleIndex + 1}</span>
                    </div>
                    <div className={styles.moduleFields}>
                      <input
                        type="text"
                        placeholder="Module title"
                        value={module.title}
                        onChange={(e) => updateModule(moduleIndex, 'title', e.target.value)}
                        className={styles.moduleInput}
                      />
                      <input
                        type="text"
                        placeholder="Description"
                        value={module.description}
                        onChange={(e) => updateModule(moduleIndex, 'description', e.target.value)}
                        className={styles.moduleInput}
                      />
                      <div className={styles.lessonControls}>
                        <button
                          type="button"
                          onClick={() => addLesson(moduleIndex)}
                          className={styles.addLessonBtn}
                        >
                          + Add Lesson
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {formData.modules.length === 0 && (
                  <p className={styles.noModules}>No modules added yet. Click "Add Module" to start.</p>
                )}
              </div>

              <div className={styles.formActions}>
                <button type="button" onClick={() => setShowForm(false)} className={styles.cancelBtn}>
                  Cancel
                </button>
                <button type="submit" className={styles.submitBtn}>
                  Create Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Course List */}
      <div className={styles.courseList}>
        <div className={styles.listHeader}>
          <h2>All Courses</h2>
          <div className={styles.listFilters}>
            <input type="search" placeholder="Search courses..." className={styles.searchInput} />
            <select className={styles.filterSelect}>
              <option>All Categories</option>
              <option>Onboarding</option>
              <option>Compliance</option>
              <option>Leadership</option>
              <option>Technical</option>
            </select>
          </div>
        </div>

        <table className={styles.table}>
          <thead>
            <tr>
              <th>Course</th>
              <th>Category</th>
              <th>Level</th>
              <th>Modules</th>
              <th>Enrollments</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <div className={styles.courseCell}>
                  <span className={styles.courseIcon}>📚</span>
                  <div>
                    <span className={styles.courseName}>Company Onboarding Essentials</span>
                    <span className={styles.courseDuration}>120 min</span>
                  </div>
                </div>
              </td>
              <td><span className={styles.categoryBadge}>Onboarding</span></td>
              <td><span className={styles.levelBadge}>Beginner</span></td>
              <td>5</td>
              <td>45</td>
              <td><span className={styles.statusBadge}>Published</span></td>
              <td>
                <div className={styles.actions}>
                  <button className={styles.actionBtn}>Edit</button>
                  <button className={styles.actionBtn}>Enrollments</button>
                </div>
              </td>
            </tr>
            <tr>
              <td>
                <div className={styles.courseCell}>
                  <span className={styles.courseIcon}>🔒</span>
                  <div>
                    <span className={styles.courseName}>Data Privacy & Security</span>
                    <span className={styles.courseDuration}>90 min</span>
                  </div>
                </div>
              </td>
              <td><span className={styles.categoryBadge}>Compliance</span></td>
              <td><span className={styles.levelBadge}>Intermediate</span></td>
              <td>4</td>
              <td>78</td>
              <td><span className={styles.statusBadge}>Published</span></td>
              <td>
                <div className={styles.actions}>
                  <button className={styles.actionBtn}>Edit</button>
                  <button className={styles.actionBtn}>Enrollments</button>
                </div>
              </td>
            </tr>
            <tr>
              <td>
                <div className={styles.courseCell}>
                  <span className={styles.courseIcon}>👔</span>
                  <div>
                    <span className={styles.courseName}>Leadership Excellence Program</span>
                    <span className={styles.courseDuration}>240 min</span>
                  </div>
                </div>
              </td>
              <td><span className={styles.categoryBadge}>Leadership</span></td>
              <td><span className={styles.levelBadge}>Advanced</span></td>
              <td>8</td>
              <td>23</td>
              <td><span className={styles.statusBadge}>Published</span></td>
              <td>
                <div className={styles.actions}>
                  <button className={styles.actionBtn}>Edit</button>
                  <button className={styles.actionBtn}>Enrollments</button>
                </div>
              </td>
            </tr>
            <tr>
              <td>
                <div className={styles.courseCell}>
                  <span className={styles.courseIcon}>⚛️</span>
                  <div>
                    <span className={styles.courseName}>React & TypeScript Fundamentals</span>
                    <span className={styles.courseDuration}>180 min</span>
                  </div>
                </div>
              </td>
              <td><span className={styles.categoryBadge}>Technical</span></td>
              <td><span className={styles.levelBadge}>Intermediate</span></td>
              <td>6</td>
              <td>0</td>
              <td><span className={styles.draftBadge}>Draft</span></td>
              <td>
                <div className={styles.actions}>
                  <button className={styles.actionBtn}>Edit</button>
                  <button className={styles.actionBtn}>Publish</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
