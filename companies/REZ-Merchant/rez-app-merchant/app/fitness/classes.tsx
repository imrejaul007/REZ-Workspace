/**
 * Fitness Classes Management
 * Schedule and manage fitness classes
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Animated, { FadeInDown, FadeInRight, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { Colors } from '@/constants/Colors';
import { Card } from '@/components/ui/DesignSystemComponents';

interface FitnessClass {
  _id: string;
  name: string;
  trainer: string;
  trainerId: string;
  type: 'yoga' | 'hiit' | 'strength' | 'cardio' | 'zumba' | 'pilates';
  duration: number; // in minutes
  startTime: string; // HH:mm format
  capacity: number;
  enrolled: number;
  day: string; // 'Monday', 'Tuesday', etc.
  room: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
}

interface DaySchedule {
  day: string;
  date: string;
  classes: FitnessClass[];
  isToday: boolean;
}

// Mock data
const MOCK_CLASSES: FitnessClass[] = [
  {
    _id: '1',
    name: 'Morning Yoga',
    trainer: 'Priya Singh',
    trainerId: 't1',
    type: 'yoga',
    duration: 60,
    startTime: '06:00',
    capacity: 20,
    enrolled: 15,
    day: 'Monday',
    room: 'Studio A',
    status: 'scheduled',
  },
  {
    _id: '2',
    name: 'HIIT Blast',
    trainer: 'Rahul Verma',
    trainerId: 't2',
    type: 'hiit',
    duration: 45,
    startTime: '07:30',
    capacity: 15,
    enrolled: 12,
    day: 'Monday',
    room: 'Cardio Zone',
    status: 'in-progress',
  },
  {
    _id: '3',
    name: 'Strength Training',
    trainer: 'Amit Kumar',
    trainerId: 't3',
    type: 'strength',
    duration: 60,
    startTime: '09:00',
    capacity: 12,
    enrolled: 10,
    day: 'Monday',
    room: 'Weight Room',
    status: 'scheduled',
  },
  {
    _id: '4',
    name: 'Zumba Party',
    trainer: 'Sofia Garcia',
    trainerId: 't4',
    type: 'zumba',
    duration: 60,
    startTime: '18:00',
    capacity: 25,
    enrolled: 22,
    day: 'Monday',
    room: 'Studio B',
    status: 'scheduled',
  },
  {
    _id: '5',
    name: 'Pilates Core',
    trainer: 'Priya Singh',
    trainerId: 't1',
    type: 'pilates',
    duration: 50,
    startTime: '10:30',
    capacity: 18,
    enrolled: 14,
    day: 'Tuesday',
    room: 'Studio A',
    status: 'scheduled',
  },
  {
    _id: '6',
    name: 'Cardio Kick',
    trainer: 'Rahul Verma',
    trainerId: 't2',
    type: 'cardio',
    duration: 45,
    startTime: '17:00',
    capacity: 20,
    enrolled: 18,
    day: 'Tuesday',
    room: 'Cardio Zone',
    status: 'scheduled',
  },
];

const TYPE_COLORS: Record<FitnessClass['type'], string> = {
  yoga: '#10B981',
  hiit: '#EF4444',
  strength: '#3B82F6',
  cardio: '#F59E0B',
  zumba: '#EC4899',
  pilates: '#8B5CF6',
};

const TYPE_ICONS: Record<FitnessClass['type'], keyof typeof Ionicons.glyphMap> = {
  yoga: 'leaf-outline',
  hiit: 'flame-outline',
  strength: 'barbell-outline',
  cardio: 'heart-outline',
  zumba: 'musical-notes-outline',
  pilates: 'body-outline',
};

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const ClassCard: React.FC<{
  classItem: FitnessClass;
  index: number;
  onPress: () => void;
}> = ({ classItem, index, onPress }) => {
  const typeColor = TYPE_COLORS[classItem.type];

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getStatusBadge = () => {
    switch (classItem.status) {
      case 'in-progress':
        return (
          <View style={[styles.statusBadge, { backgroundColor: Colors.light.success }]}>
            <Text style={styles.statusBadgeText}>Live</Text>
          </View>
        );
      case 'completed':
        return (
          <View style={[styles.statusBadge, { backgroundColor: Colors.light.textMuted }]}>
            <Text style={[styles.statusBadgeText, { color: '#fff' }]}>Completed</Text>
          </View>
        );
      case 'cancelled':
        return (
          <View style={[styles.statusBadge, { backgroundColor: Colors.light.error }]}>
            <Text style={styles.statusBadgeText}>Cancelled</Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <Animated.View entering={FadeInRight.delay(index * 50).springify()}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <Card variant="elevated" padding="md" style={styles.classCard}>
          <View style={styles.classHeader}>
            <View style={[styles.typeIndicator, { backgroundColor: typeColor }]} />
            <View style={styles.classInfo}>
              <View style={styles.classTitleRow}>
                <Text style={styles.className}>{classItem.name}</Text>
                {getStatusBadge()}
              </View>
              <Text style={styles.trainerName}>with {classItem.trainer}</Text>
            </View>
            <View style={[styles.typeIconContainer, { backgroundColor: `${typeColor}15` }]}>
              <Ionicons name={TYPE_ICONS[classItem.type]} size={24} color={typeColor} />
            </View>
          </View>

          <View style={styles.classDetails}>
            <View style={styles.detailItem}>
              <Ionicons name="time-outline" size={16} color={Colors.light.textSecondary} />
              <Text style={styles.detailText}>
                {formatTime(classItem.startTime)} ({classItem.duration} min)
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="location-outline" size={16} color={Colors.light.textSecondary} />
              <Text style={styles.detailText}>{classItem.room}</Text>
            </View>
          </View>

          <View style={styles.enrollmentRow}>
            <View style={styles.enrollmentInfo}>
              <Ionicons name="people-outline" size={16} color={Colors.light.textSecondary} />
              <Text style={styles.enrollmentText}>
                {classItem.enrolled} / {classItem.capacity} enrolled
              </Text>
            </View>
            <View style={styles.capacityBar}>
              <View
                style={[
                  styles.capacityFill,
                  {
                    width: `${(classItem.enrolled / classItem.capacity) * 100}%`,
                    backgroundColor:
                      classItem.enrolled >= classItem.capacity
                        ? Colors.light.error
                        : typeColor,
                  },
                ]}
              />
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function ClassesScreen() {
  const insets = useSafeAreaInsets();
  const [classes, setClasses] = useState<FitnessClass[]>([]);
  const [selectedDay, setSelectedDay] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'today' | 'week'>('today');

  const fetchClasses = useCallback(async (isRefresh = false) => {
    if (!isRefresh) {
      setIsLoading(true);
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setClasses(MOCK_CLASSES);
    } catch (error) {
      console.error('[Classes] fetchClasses error:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchClasses(true);
  };

  const handleClassPress = (classItem: FitnessClass) => {
    Alert.alert(
      classItem.name,
      `Trainer: ${classItem.trainer}\nTime: ${classItem.startTime}\nRoom: ${classItem.room}\nEnrolled: ${classItem.enrolled}/${classItem.capacity}`,
      [{ text: 'Close', style: 'cancel' }]
    );
  };

  const filteredClasses = classes.filter(c => {
    if (viewMode === 'today') {
      return c.day.toLowerCase().startsWith(DAYS[selectedDay].toLowerCase().slice(0, 3));
    }
    return true;
  });

  // Calculate today's stats
  const todayClasses = classes.filter(
    c => c.day.toLowerCase().startsWith(DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1].toLowerCase().slice(0, 3))
  );
  const totalCapacity = todayClasses.reduce((sum, c) => sum + c.capacity, 0);
  const totalEnrolled = todayClasses.reduce((sum, c) => sum + c.enrolled, 0);
  const liveClass = classes.find(c => c.status === 'in-progress');

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <LinearGradient
        colors={[Colors.light.primary, Colors.light.primaryLight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Classes</Text>
            <TouchableOpacity style={styles.addButton}>
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Live Class Banner */}
          {liveClass && (
            <TouchableOpacity style={styles.liveBanner} activeOpacity={0.8}>
              <View style={styles.liveIndicator} />
              <Text style={styles.liveText}>
                {liveClass.name} is happening now
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* Stats Summary */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="fitness-outline" size={24} color={Colors.light.primary} />
          <Text style={styles.statValue}>{todayClasses.length}</Text>
          <Text style={styles.statLabel}>Classes Today</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="people-outline" size={24} color={Colors.light.success} />
          <Text style={styles.statValue}>{totalEnrolled}</Text>
          <Text style={styles.statLabel}>Total Enrolled</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="pie-chart-outline" size={24} color={Colors.light.info} />
          <Text style={styles.statValue}>
            {totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0}%
          </Text>
          <Text style={styles.statLabel}>Fill Rate</Text>
        </View>
      </View>

      {/* View Mode Toggle */}
      <View style={styles.viewModeContainer}>
        <TouchableOpacity
          style={[styles.viewModeButton, viewMode === 'today' && styles.viewModeButtonActive]}
          onPress={() => setViewMode('today')}
        >
          <Text
            style={[
              styles.viewModeText,
              viewMode === 'today' && styles.viewModeTextActive,
            ]}
          >
            Today
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.viewModeButton, viewMode === 'week' && styles.viewModeButtonActive]}
          onPress={() => setViewMode('week')}
        >
          <Text
            style={[
              styles.viewModeText,
              viewMode === 'week' && styles.viewModeTextActive,
            ]}
          >
            This Week
          </Text>
        </TouchableOpacity>
      </View>

      {/* Day Selector */}
      {viewMode === 'today' && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.daySelector}
        >
          {DAYS.map((day, index) => (
            <TouchableOpacity
              key={day}
              style={[
                styles.dayButton,
                selectedDay === index && styles.dayButtonActive,
              ]}
              onPress={() => setSelectedDay(index)}
            >
              <Text
                style={[
                  styles.dayButtonText,
                  selectedDay === index && styles.dayButtonTextActive,
                ]}
              >
                {day}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Classes List */}
      <FlatList
        data={filteredClasses}
        keyExtractor={item => item._id}
        renderItem={({ item, index }) => (
          <ClassCard
            classItem={item}
            index={index}
            onPress={() => handleClassPress(item)}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={64} color={Colors.light.textMuted} />
              <Text style={styles.emptyStateTitle}>No classes scheduled</Text>
              <Text style={styles.emptyStateText}>
                There are no classes for this day. Tap + to add a new class.
              </Text>
            </View>
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  headerGradient: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  headerContent: {
    paddingTop: 8,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 12,
  },
  liveIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.success,
    marginRight: 10,
  },
  liveText: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: -30,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.textHeading,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.light.textMuted,
    marginTop: 2,
  },
  viewModeContainer: {
    flexDirection: 'row',
    margin: 16,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 12,
    padding: 4,
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  viewModeButtonActive: {
    backgroundColor: Colors.light.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  viewModeText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.textSecondary,
  },
  viewModeTextActive: {
    color: Colors.light.textHeading,
  },
  daySelector: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  dayButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.light.backgroundSecondary,
    marginRight: 8,
  },
  dayButtonActive: {
    backgroundColor: Colors.light.primary,
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.textSecondary,
  },
  dayButtonTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  classCard: {
    marginBottom: 12,
  },
  classHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  typeIndicator: {
    width: 4,
    height: 48,
    borderRadius: 2,
    marginRight: 12,
  },
  classInfo: {
    flex: 1,
  },
  classTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  className: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.textHeading,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  trainerName: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  typeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  classDetails: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  enrollmentRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderLight,
  },
  enrollmentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  enrollmentText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  capacityBar: {
    height: 6,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  capacityFill: {
    height: '100%',
    borderRadius: 3,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.textHeading,
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
});
