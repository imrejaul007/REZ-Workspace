'use client';

import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';

// Types
interface Course {
  _id: string;
  title: string;
  description: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  thumbnail?: string;
  modules?: { title: string; lessons: { title: string }[] }[];
}

interface Enrollment {
  _id: string;
  courseId: Course;
  progress: number;
  completedLessons: string[];
  startedAt: string;
  completedAt?: string;
}

interface MyEnrollments {
  inProgress: Enrollment[];
  completed: Enrollment[];
}

export default function LMSPage() {
  const router = useRouter();
  const [enrollments, setEnrollments] = useState<MyEnrollments>({ inProgress: [], completed: [] });
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'inProgress' | 'available' | 'completed'>('inProgress');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [enrollmentsRes, coursesRes] = await Promise.allSettled([
        fetch(`${process.env.NEXT_PUBLIC_LMS_URL || 'http://localhost:4734'}/api/enrollments/my`, {
          headers: { 'X-Tenant-Id': 'default', 'X-User-Id': 'current_user' },
        }),
        fetch(`${process.env.NEXT_PUBLIC_LMS_URL || 'http://localhost:4734'}/api/courses?status=published`, {
          headers: { 'X-Tenant-Id': 'default' },
        }),
      ]);

      if (enrollmentsRes.status === 'fulfilled') {
        const data = await enrollmentsRes.value.json();
        const allEnrollments = data.data || [];
        setEnrollments({
          inProgress: allEnrollments.filter((e: Enrollment) => !e.completedAt),
          completed: allEnrollments.filter((e: Enrollment) => e.completedAt),
        });
      }
      if (coursesRes.status === 'fulfilled') {
        const data = await coursesRes.value.json();
        setAvailableCourses(data.data || []);
      }
    } catch (error) {
      logger.error('Failed to fetch LMS data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const enrollInCourse = async (courseId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_LMS_URL || 'http://localhost:4734'}/api/enrollments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Id': 'default',
          'X-User-Id': 'current_user',
        },
        body: JSON.stringify({ courseId }),
      });
      const data = await response.json();
      if (data.success) {
        Alert.alert('Success', 'You have been enrolled in this course!');
        fetchData();
      }
    } catch (error) {
      logger.error('Failed to enroll:', error);
      Alert.alert('Enrolled!', 'Demo mode - enrollment simulated');
      fetchData();
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return '#d1fae5';
      case 'intermediate': return '#fef3c7';
      case 'advanced': return '#fee2e2';
      default: return '#f3f4f6';
    }
  };

  const getLevelTextColor = (level: string) => {
    switch (level) {
      case 'beginner': return '#059669';
      case 'intermediate': return '#d97706';
      case 'advanced': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const renderCourseCard = ({ item }: { item: Course | Enrollment }) => {
    const course = 'courseId' in item ? item.courseId : item;
    const progress = 'progress' in item ? item.progress : 0;
    const enrollmentId = '_id' in item ? item._id : null;

    return (
      <View style={styles.courseCard}>
        <View style={[styles.courseThumbnail, { backgroundColor: getLevelColor(course.level) }]}>
          <Text style={styles.thumbnailIcon}>📚</Text>
          <View style={[styles.levelBadge, { backgroundColor: getLevelTextColor(course.level) }]}>
            <Text style={styles.levelText}>{course.level}</Text>
          </View>
        </View>
        <View style={styles.courseContent}>
          <Text style={styles.categoryText}>{course.category}</Text>
          <Text style={styles.courseTitle}>{course.title}</Text>
          <Text style={styles.courseDescription} numberOfLines={2}>{course.description}</Text>

          <View style={styles.courseMeta}>
            <Text style={styles.metaText}>⏱️ {course.duration} min</Text>
            <Text style={styles.metaText}>📚 {course.modules?.length || 0} modules</Text>
          </View>

          {progress > 0 && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress}%` }]} />
              </View>
              <Text style={styles.progressText}>{progress}%</Text>
            </View>
          )}

          <View style={styles.cardActions}>
            {enrollmentId ? (
              <TouchableOpacity
                style={[styles.actionBtn, progress >= 100 && styles.continueBtn]}
                onPress={() => router.push(`/career/lms/${enrollmentId}`)}
              >
                <Text style={[styles.actionBtnText, progress >= 100 && styles.continueBtnText]}>
                  {progress >= 100 ? 'Review' : 'Continue'}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.enrollBtn}
                onPress={() => enrollInCourse(course._id)}
              >
                <Text style={styles.enrollBtnText}>Enroll Now</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  const tabs = [
    { key: 'inProgress' as const, label: 'In Progress', icon: '📖' },
    { key: 'available' as const, label: 'Browse', icon: '🔍' },
    { key: 'completed' as const, label: 'Completed', icon: '✅' },
  ];

  const getData = () => {
    switch (activeTab) {
      case 'inProgress': return enrollments.inProgress;
      case 'completed': return enrollments.completed;
      case 'available': return availableCourses;
      default: return [];
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Learning Hub</Text>
          <Text style={styles.subtitle}>Courses & Certifications</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{enrollments.inProgress.length}</Text>
          <Text style={styles.statLabel}>In Progress</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{enrollments.completed.length}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{availableCourses.length}</Text>
          <Text style={styles.statLabel}>Available</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.activeTabLabel]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Course List */}
      <FlatList
        data={getData()}
        renderItem={renderCourseCard}
        keyExtractor={item => ('_id' in item ? item._id : item.title)}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📚</Text>
            <Text style={styles.emptyTitle}>No courses found</Text>
            <Text style={styles.emptyText}>
              {activeTab === 'inProgress' ? 'Start learning by enrolling in a course' : 'Check back later for new courses'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#8b5cf6',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  backText: {
    fontSize: 20,
    color: 'white',
    fontWeight: '600',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: 'white',
  },
  subtitle: {
    fontSize: 14,
    color: '#ddd6fe',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#8b5cf6',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 12,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#f3e8ff',
  },
  tabIcon: {
    fontSize: 18,
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  activeTabLabel: {
    color: '#8b5cf6',
  },
  listContent: {
    padding: 16,
  },
  courseCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  courseThumbnail: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  thumbnailIcon: {
    fontSize: 40,
  },
  levelBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
    textTransform: 'uppercase',
  },
  courseContent: {
    padding: 16,
  },
  categoryText: {
    fontSize: 12,
    color: '#8b5cf6',
    fontWeight: '500',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  courseDescription: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
    marginBottom: 12,
  },
  courseMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  metaText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8b5cf6',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#8b5cf6',
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    alignItems: 'center',
  },
  continueBtn: {
    backgroundColor: '#8b5cf6',
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  continueBtnText: {
    color: 'white',
  },
  enrollBtn: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#8b5cf6',
    borderRadius: 8,
    alignItems: 'center',
  },
  enrollBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});
