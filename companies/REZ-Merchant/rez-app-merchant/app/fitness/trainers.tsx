/**
 * Fitness Trainers Management
 * Manage trainers and their schedules
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';

import { Colors } from '@/constants/Colors';
import { Card } from '@/components/ui/DesignSystemComponents';

interface Trainer {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  specialties: string[];
  certifications: string[];
  experience: number; // years
  classesToday: number;
  totalClasses: number;
  rating: number;
  status: 'available' | 'busy' | 'off-duty';
  avatar?: string;
  joinDate: string;
}

interface ClassSchedule {
  id: string;
  className: string;
  time: string;
  room: string;
}

// Mock data
const MOCK_TRAINERS: Trainer[] = [
  {
    _id: 't1',
    name: 'Priya Singh',
    phone: '+91 98765 43210',
    email: 'priya.singh@example.com',
    specialties: ['Yoga', 'Pilates', 'Meditation'],
    certifications: ['RYT-500', 'PILATES Certified'],
    experience: 8,
    classesToday: 3,
    totalClasses: 1250,
    rating: 4.9,
    status: 'available',
    joinDate: '2020-03-15',
  },
  {
    _id: 't2',
    name: 'Rahul Verma',
    phone: '+91 98765 43211',
    email: 'rahul.verma@example.com',
    specialties: ['HIIT', 'Cardio', 'CrossFit'],
    certifications: ['ACE Certified', 'CrossFit Level 2'],
    experience: 6,
    classesToday: 4,
    totalClasses: 980,
    rating: 4.7,
    status: 'busy',
    joinDate: '2021-06-01',
  },
  {
    _id: 't3',
    name: 'Amit Kumar',
    phone: '+91 98765 43212',
    email: 'amit.kumar@example.com',
    specialties: ['Strength Training', 'Bodybuilding'],
    certifications: ['NSCA-CPT', 'Sports Nutrition'],
    experience: 10,
    classesToday: 2,
    totalClasses: 2100,
    rating: 4.8,
    status: 'available',
    joinDate: '2018-01-10',
  },
  {
    _id: 't4',
    name: 'Sofia Garcia',
    phone: '+91 98765 43213',
    email: 'sofia.garcia@example.com',
    specialties: ['Zumba', 'Dance Fitness', 'Aerobics'],
    certifications: ['Zumba Instructor', 'AFAA Group Fitness'],
    experience: 5,
    classesToday: 3,
    totalClasses: 750,
    rating: 4.9,
    status: 'off-duty',
    joinDate: '2022-09-20',
  },
  {
    _id: 't5',
    name: 'Neha Kapoor',
    phone: '+91 98765 43214',
    email: 'neha.kapoor@example.com',
    specialties: ['Personal Training', 'Weight Loss', 'Functional Training'],
    certifications: ['NASM-CPT', 'TRX Certified'],
    experience: 7,
    classesToday: 5,
    totalClasses: 1500,
    rating: 4.6,
    status: 'available',
    joinDate: '2019-11-05',
  },
];

const MOCK_SCHEDULES: Record<string, ClassSchedule[]> = {
  t1: [
    { id: '1', className: 'Morning Yoga', time: '06:00', room: 'Studio A' },
    { id: '2', className: 'Pilates Core', time: '10:30', room: 'Studio A' },
    { id: '3', className: 'Evening Meditation', time: '19:00', room: 'Zen Room' },
  ],
  t2: [
    { id: '4', className: 'HIIT Blast', time: '07:30', room: 'Cardio Zone' },
    { id: '5', className: 'Cardio Kick', time: '12:00', room: 'Cardio Zone' },
    { id: '6', className: 'Boxing Cardio', time: '17:00', room: 'Boxing Ring' },
    { id: '7', className: 'CrossFit WOD', time: '20:00', room: 'CrossFit Box' },
  ],
  t3: [
    { id: '8', className: 'Strength Training', time: '09:00', room: 'Weight Room' },
    { id: '9', className: 'Power Lifting', time: '18:00', room: 'Weight Room' },
  ],
  t4: [
    { id: '10', className: 'Zumba Party', time: '18:00', room: 'Studio B' },
    { id: '11', className: 'Dance Aerobics', time: '10:00', room: 'Studio B' },
    { id: '12', className: 'Hip Hop Cardio', time: '16:00', room: 'Studio B' },
  ],
  t5: [
    { id: '13', className: 'Personal Training', time: '08:00', room: 'PT Studio' },
    { id: '14', className: 'Functional Training', time: '11:00', room: 'PT Studio' },
    { id: '15', className: 'Personal Training', time: '14:00', room: 'PT Studio' },
    { id: '16', className: 'Group PT', time: '17:00', room: 'PT Studio' },
    { id: '17', className: 'HIIT Circuit', time: '19:00', room: 'PT Studio' },
  ],
};

const TrainerCard: React.FC<{
  trainer: Trainer;
  index: number;
  onPress: () => void;
}> = ({ trainer, index, onPress }) => {
  const getStatusColor = (status: Trainer['status']) => {
    switch (status) {
      case 'available':
        return Colors.light.success;
      case 'busy':
        return Colors.light.warning;
      case 'off-duty':
        return Colors.light.textMuted;
      default:
        return Colors.light.textMuted;
    }
  };

  const getStatusLabel = (status: Trainer['status']) => {
    switch (status) {
      case 'available':
        return 'Available';
      case 'busy':
        return 'In Class';
      case 'off-duty':
        return 'Off Duty';
      default:
        return status;
    }
  };

  return (
    <Animated.View entering={FadeInRight.delay(index * 50).springify()}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <Card variant="elevated" padding="md" style={styles.trainerCard}>
          <View style={styles.trainerHeader}>
            <View style={styles.avatarContainer}>
              {trainer.avatar ? (
                <View style={styles.avatarImage} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: Colors.light.primaryLight2 }]}>
                  <Text style={styles.avatarText}>
                    {trainer.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.trainerInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.trainerName}>{trainer.name}</Text>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(trainer.status) }]} />
              </View>
              <Text style={styles.statusText} style={{ color: getStatusColor(trainer.status) }}>
                {getStatusLabel(trainer.status)}
              </Text>
            </View>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color={Colors.light.warning} />
              <Text style={styles.ratingText}>{trainer.rating}</Text>
            </View>
          </View>

          <View style={styles.specialtiesRow}>
            {trainer.specialties.slice(0, 3).map((specialty, i) => (
              <View key={i} style={styles.specialtyBadge}>
                <Text style={styles.specialtyText}>{specialty}</Text>
              </View>
            ))}
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{trainer.experience}</Text>
              <Text style={styles.statLabel}>Years Exp</Text>
            </View>
            <View style={[styles.statItem, styles.statItemBorder]}>
              <Text style={styles.statValue}>{trainer.classesToday}</Text>
              <Text style={styles.statLabel}>Today</Text>
            </View>
            <View style={[styles.statItem, styles.statItemBorder]}>
              <Text style={styles.statValue}>{trainer.totalClasses}</Text>
              <Text style={styles.statLabel}>Total Classes</Text>
            </View>
          </View>

          <View style={styles.schedulePreview}>
            <Ionicons name="time-outline" size={14} color={Colors.light.textMuted} />
            <Text style={styles.scheduleText}>
              Next: {MOCK_SCHEDULES[trainer._id]?.[0]?.className || 'No classes'} at{' '}
              {MOCK_SCHEDULES[trainer._id]?.[0]?.time || '-'}
            </Text>
          </View>
        </Card>
      </TouchableOpacity>
    </Animated.View>
  );
};

const TrainerDetailModal: React.FC<{
  trainer: Trainer;
  visible: boolean;
  onClose: () => void;
}> = ({ trainer, visible, onClose }) => {
  if (!visible) return null;

  const schedules = MOCK_SCHEDULES[trainer._id] || [];

  return (
    <View style={styles.modalOverlay}>
      <TouchableOpacity style={styles.modalBackdrop} onPress={onClose} activeOpacity={1}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View style={[styles.avatarPlaceholder, styles.modalAvatar, { backgroundColor: Colors.light.primaryLight2 }]}>
              <Text style={[styles.avatarText, styles.modalAvatarText]}>
                {trainer.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={styles.modalName}>{trainer.name}</Text>
            <Text style={styles.modalSubtext}>
              {trainer.experience} years experience
            </Text>
          </View>

          <View style={styles.modalSection}>
            <Text style={styles.modalSectionTitle}>Specialties</Text>
            <View style={styles.specialtiesRow}>
              {trainer.specialties.map((specialty, i) => (
                <View key={i} style={[styles.specialtyBadge, { backgroundColor: Colors.light.primaryLight2 }]}>
                  <Text style={[styles.specialtyText, { color: Colors.light.primary }]}>{specialty}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.modalSection}>
            <Text style={styles.modalSectionTitle}>Certifications</Text>
            {trainer.certifications.map((cert, i) => (
              <View key={i} style={styles.certRow}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.light.success} />
                <Text style={styles.certText}>{cert}</Text>
              </View>
            ))}
          </View>

          <View style={styles.modalSection}>
            <Text style={styles.modalSectionTitle}>Today's Schedule</Text>
            {schedules.map((schedule) => (
              <View key={schedule.id} style={styles.scheduleRow}>
                <Text style={styles.scheduleTime}>{schedule.time}</Text>
                <Text style={styles.scheduleClass}>{schedule.className}</Text>
                <Text style={styles.scheduleRoom}>{schedule.room}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
            <Text style={styles.modalCloseText}>Close</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default function TrainersScreen() {
  const insets = useSafeAreaInsets();
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [filteredTrainers, setFilteredTrainers] = useState<Trainer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'busy' | 'off-duty'>('all');
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
  const [showModal, setShowModal] = useState(false);

  const fetchTrainers = useCallback(async (isRefresh = false) => {
    if (!isRefresh) {
      setIsLoading(true);
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setTrainers(MOCK_TRAINERS);
    } catch (error) {
      console.error('[Trainers] fetchTrainers error:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTrainers();
  }, [fetchTrainers]);

  useEffect(() => {
    let result = trainers;

    if (statusFilter !== 'all') {
      result = result.filter(t => t.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        t =>
          t.name.toLowerCase().includes(query) ||
          t.specialties.some(s => s.toLowerCase().includes(query))
      );
    }

    setFilteredTrainers(result);
  }, [trainers, searchQuery, statusFilter]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTrainers(true);
  };

  const handleTrainerPress = (trainer: Trainer) => {
    setSelectedTrainer(trainer);
    setShowModal(true);
  };

  const availableCount = trainers.filter(t => t.status === 'available').length;
  const busyCount = trainers.filter(t => t.status === 'busy').length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.light.textHeading} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Trainers</Text>
          <TouchableOpacity style={styles.addButton}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={Colors.light.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search trainers or specialties..."
            placeholderTextColor={Colors.light.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={Colors.light.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Status Filter */}
        <View style={styles.statusFilter}>
          {(['all', 'available', 'busy', 'off-duty'] as const).map(status => (
            <TouchableOpacity
              key={status}
              style={[
                styles.statusFilterTab,
                statusFilter === status && styles.statusFilterTabActive,
              ]}
              onPress={() => setStatusFilter(status)}
            >
              <Text
                style={[
                  styles.statusFilterText,
                  statusFilter === status && styles.statusFilterTextActive,
                ]}
              >
                {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Stats */}
        <View style={styles.quickStats}>
          <View style={styles.quickStatItem}>
            <View style={[styles.quickStatDot, { backgroundColor: Colors.light.success }]} />
            <Text style={styles.quickStatText}>{availableCount} Available</Text>
          </View>
          <View style={styles.quickStatItem}>
            <View style={[styles.quickStatDot, { backgroundColor: Colors.light.warning }]} />
            <Text style={styles.quickStatText}>{busyCount} In Class</Text>
          </View>
        </View>
      </View>

      {/* Trainers List */}
      <FlatList
        data={filteredTrainers}
        keyExtractor={item => item._id}
        renderItem={({ item, index }) => (
          <TrainerCard
            trainer={item}
            index={index}
            onPress={() => handleTrainerPress(item)}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyState}>
              <Ionicons name="person-outline" size={64} color={Colors.light.textMuted} />
              <Text style={styles.emptyStateTitle}>No trainers found</Text>
              <Text style={styles.emptyStateText}>
                {searchQuery
                  ? 'Try adjusting your search'
                  : 'Add trainers to manage your fitness team'}
              </Text>
            </View>
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Trainer Detail Modal */}
      {selectedTrainer && (
        <TrainerDetailModal
          trainer={selectedTrainer}
          visible={showModal}
          onClose={() => setShowModal(false)}
        />
      )}

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
  header: {
    backgroundColor: Colors.light.card,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.light.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.textHeading,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.light.text,
    marginLeft: 8,
  },
  statusFilter: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 8,
  },
  statusFilterTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  statusFilterTabActive: {
    backgroundColor: Colors.light.primary,
  },
  statusFilterText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.light.textSecondary,
  },
  statusFilterTextActive: {
    color: '#fff',
  },
  quickStats: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 16,
  },
  quickStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quickStatDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  quickStatText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  trainerCard: {
    marginBottom: 12,
  },
  trainerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  trainerInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trainerName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.textHeading,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    fontSize: 13,
    marginTop: 2,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.warningLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textHeading,
  },
  specialtiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  specialtyBadge: {
    backgroundColor: Colors.light.backgroundSecondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  specialtyText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderLight,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statItemBorder: {
    borderLeftWidth: 1,
    borderLeftColor: Colors.light.border,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.textHeading,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.light.textMuted,
    marginTop: 2,
  },
  schedulePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  scheduleText: {
    fontSize: 13,
    color: Colors.light.textMuted,
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
  // Modal styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.light.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  modalAvatarText: {
    fontSize: 32,
  },
  modalName: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.light.textHeading,
  },
  modalSubtext: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  modalSection: {
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textMuted,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  certRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  certText: {
    fontSize: 14,
    color: Colors.light.textHeading,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  scheduleTime: {
    width: 60,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  scheduleClass: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.textHeading,
  },
  scheduleRoom: {
    fontSize: 13,
    color: Colors.light.textMuted,
  },
  modalCloseButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  modalCloseText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
