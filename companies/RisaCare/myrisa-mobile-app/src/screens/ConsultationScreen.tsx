import { logger } from '../../shared/logger';
/**
 * MyRisa Consultation Screen
 * Upcoming consultations, history, preparation
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Card, Button, Chip, SegmentedButtons } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../services/ApiService';

const COLORS = {
  consultation: '#4DB6AC',
  upcoming: '#FF9800',
  completed: '#4CAF50',
  cancelled: '#9E9E9E',
};

export default function ConsultationScreen({ navigation }: any) {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [consultations, setConsultations] = useState<any>(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const stored = await AsyncStorage.getItem('userId');
      if (stored) {
        setUserId(stored);
        loadData(stored);
      } else {
        const newId = `user_${Date.now()}`;
        await AsyncStorage.setItem('userId', newId);
        setUserId(newId);
        loadData(newId);
      }
    } catch (error) {
      logger.error('Error loading user:', error);
      setLoading(false);
    }
  };

  const loadData = async (uid: string) => {
    try {
      const data = await apiService.getUpcomingConsultations(uid);
      setConsultations(data);
    } catch (error) {
      logger.error('Error loading consultations:', error);
      setConsultations(getMockData());
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (userId) {
      await loadData(userId);
    }
    setRefreshing(false);
  };

  const getMockData = () => ({
    upcoming: [
      {
        id: '1',
        providerName: 'Dr. Priya Sharma',
        providerType: 'Gynecologist',
        specialty: "Women's Health",
        date: '2026-06-14',
        time: '10:00 AM',
        duration: 30,
        location: 'Mumbai Clinic',
        mode: 'in_person',
        status: 'confirmed',
        reason: 'Annual checkup and cycle consultation',
        preparation: [
          'Track your cycle for 3 months',
          'Note any symptoms',
          'Bring medical history',
        ],
        notes: 'Prepare questions about PCOS',
      },
      {
        id: '2',
        providerName: 'Dr. Amit Kumar',
        providerType: 'General Physician',
        specialty: 'General Health',
        date: '2026-06-20',
        time: '02:30 PM',
        duration: 20,
        location: 'Video Call',
        mode: 'video',
        status: 'confirmed',
        reason: 'Follow-up on blood tests',
        preparation: [
          'Review blood test results',
          'Prepare current medications list',
        ],
        notes: '',
      },
    ],
    past: [
      {
        id: '3',
        providerName: 'Dr. Sneha Patel',
        providerType: 'Dermatologist',
        specialty: 'Skin Care',
        date: '2026-05-28',
        time: '11:00 AM',
        duration: 30,
        location: 'Mumbai Clinic',
        mode: 'in_person',
        status: 'completed',
        reason: 'Skin rash consultation',
        summary: 'Prescribed medication for eczema. Follow-up in 2 weeks.',
        prescriptions: [
          { name: 'Hydrocortisone Cream', dosage: 'Apply twice daily' },
        ],
      },
      {
        id: '4',
        providerName: 'Dr. Rajesh Gupta',
        providerType: 'Psychiatrist',
        specialty: 'Mental Health',
        date: '2026-05-15',
        time: '03:00 PM',
        duration: 45,
        location: 'Video Call',
        mode: 'video',
        status: 'completed',
        reason: 'Stress management',
        summary: 'Discussed anxiety management techniques. Recommended therapy sessions.',
      },
    ],
    providers: [
      { name: 'Dr. Priya Sharma', type: 'Gynecologist', rating: 4.8, nextAvailable: '2026-06-14' },
      { name: 'Dr. Amit Kumar', type: 'General Physician', rating: 4.9, nextAvailable: '2026-06-20' },
      { name: 'Dr. Sneha Patel', type: 'Dermatologist', rating: 4.7, nextAvailable: '2026-06-25' },
      { name: 'Dr. Rajesh Gupta', type: 'Psychiatrist', rating: 4.9, nextAvailable: '2026-06-18' },
    ],
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return COLORS.consultation;
      case 'completed': return COLORS.completed;
      case 'cancelled': return COLORS.cancelled;
      default: return COLORS.upcoming;
    }
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'video': return '📹';
      case 'in_person': return '🏥';
      case 'phone': return '📞';
      default: return '📍';
    }
  };

  const getDaysUntil = (date: string) => {
    const today = new Date();
    const appointmentDate = new Date(date);
    const diff = Math.ceil((appointmentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff < 0) return 'Past';
    return `${diff} days`;
  };

  const handleSchedule = () => {
    navigation.navigate('Home');
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: COLORS.consultation }]}>
        <Text style={styles.headerEmoji}>📅</Text>
        <Text style={styles.greeting}>Consultations</Text>
        <Text style={styles.subtitle}>Manage your healthcare visits</Text>
      </View>

      {/* Stats */}
      <Card style={styles.statsCard}>
        <Card.Content>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{consultations?.upcoming?.length || 0}</Text>
              <Text style={styles.statLabel}>Upcoming</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{consultations?.past?.length || 0}</Text>
              <Text style={styles.statLabel}>Past Visits</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {consultations?.providers?.length || 0}
              </Text>
              <Text style={styles.statLabel}>Providers</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Tab Selector */}
      <SegmentedButtons
        value={activeTab}
        onValueChange={setActiveTab}
        buttons={[
          { value: 'upcoming', label: 'Upcoming' },
          { value: 'past', label: 'Past' },
          { value: 'providers', label: 'Providers' },
        ]}
        style={styles.segmentedButtons}
      />

      {/* Upcoming Tab */}
      {activeTab === 'upcoming' && (
        <View style={styles.tabContent}>
          {consultations?.upcoming?.length > 0 ? (
            consultations?.upcoming?.map((consultation: any) => (
              <Card key={consultation.id} style={styles.consultationCard}>
                <Card.Content>
                  {/* Countdown */}
                  <View style={styles.countdownContainer}>
                    <Chip
                      style={[styles.countdownChip, { backgroundColor: COLORS.upcoming + '20' }]}
                      textStyle={{ color: COLORS.upcoming }}
                    >
                      {getDaysUntil(consultation.date)}
                    </Chip>
                    <Chip
                      style={[styles.statusChip, { backgroundColor: getStatusColor(consultation.status) + '20' }]}
                      textStyle={{ color: getStatusColor(consultation.status), fontSize: 10 }}
                    >
                      {consultation.status}
                    </Chip>
                  </View>

                  {/* Provider Info */}
                  <View style={styles.providerHeader}>
                    <View style={styles.providerAvatar}>
                      <Text style={styles.providerInitial}>
                        {consultation.providerName.charAt(0)}
                      </Text>
                    </View>
                    <View style={styles.providerInfo}>
                      <Text style={styles.providerName}>{consultation.providerName}</Text>
                      <Text style={styles.providerType}>{consultation.providerType}</Text>
                      <Text style={styles.specialty}>{consultation.specialty}</Text>
                    </View>
                  </View>

                  {/* Date & Time */}
                  <View style={styles.dateTimeContainer}>
                    <View style={styles.dateTimeItem}>
                      <Text style={styles.dateTimeIcon}>📅</Text>
                      <Text style={styles.dateTimeValue}>{consultation.date}</Text>
                    </View>
                    <View style={styles.dateTimeItem}>
                      <Text style={styles.dateTimeIcon}>⏰</Text>
                      <Text style={styles.dateTimeValue}>{consultation.time}</Text>
                    </View>
                    <View style={styles.dateTimeItem}>
                      <Text style={styles.dateTimeIcon}>⏱️</Text>
                      <Text style={styles.dateTimeValue}>{consultation.duration} min</Text>
                    </View>
                  </View>

                  {/* Mode & Location */}
                  <View style={styles.locationContainer}>
                    <Text style={styles.locationIcon}>{getModeIcon(consultation.mode)}</Text>
                    <Text style={styles.locationText}>{consultation.location}</Text>
                  </View>

                  {/* Reason */}
                  <View style={styles.reasonContainer}>
                    <Text style={styles.reasonLabel}>Reason:</Text>
                    <Text style={styles.reasonText}>{consultation.reason}</Text>
                  </View>

                  {/* Preparation */}
                  {consultation.preparation && consultation.preparation.length > 0 && (
                    <View style={styles.preparationContainer}>
                      <Text style={styles.preparationTitle}>📋 Preparation</Text>
                      {consultation.preparation.map((item: string, index: number) => (
                        <Text key={index} style={styles.preparationItem}>• {item}</Text>
                      ))}
                    </View>
                  )}

                  {/* Notes */}
                  {consultation.notes && (
                    <View style={styles.notesContainer}>
                      <Text style={styles.notesText}>📝 {consultation.notes}</Text>
                    </View>
                  )}

                  {/* Actions */}
                  <View style={styles.actionsContainer}>
                    <TouchableOpacity style={styles.joinButton}>
                      <Text style={styles.joinButtonText}>
                        {consultation.mode === 'video' ? '📹 Join Video Call' : '📍 Get Directions'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.cancelButton}>
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </Card.Content>
              </Card>
            ))
          ) : (
            <Card style={styles.emptyCard}>
              <Card.Content>
                <Text style={styles.emptyEmoji}>📅</Text>
                <Text style={styles.emptyTitle}>No Upcoming Consultations</Text>
                <Text style={styles.emptyText}>Schedule an appointment with a healthcare provider.</Text>
                <TouchableOpacity style={styles.scheduleButton} onPress={handleSchedule}>
                  <Text style={styles.scheduleButtonText}>Schedule Consultation</Text>
                </TouchableOpacity>
              </Card.Content>
            </Card>
          )}
        </View>
      )}

      {/* Past Tab */}
      {activeTab === 'past' && (
        <View style={styles.tabContent}>
          {consultations?.past?.map((consultation: any) => (
            <Card key={consultation.id} style={styles.consultationCard}>
              <Card.Content>
                <View style={styles.pastHeader}>
                  <View>
                    <Text style={styles.pastProvider}>{consultation.providerName}</Text>
                    <Text style={styles.pastType}>{consultation.providerType}</Text>
                  </View>
                  <Chip
                    style={[styles.completedChip, { backgroundColor: COLORS.completed + '20' }]}
                    textStyle={{ color: COLORS.completed, fontSize: 10 }}
                  >
                    Completed
                  </Chip>
                </View>

                <View style={styles.dateTimeContainer}>
                  <View style={styles.dateTimeItem}>
                    <Text style={styles.dateTimeIcon}>📅</Text>
                    <Text style={styles.dateTimeValue}>{consultation.date}</Text>
                  </View>
                  <View style={styles.dateTimeItem}>
                    <Text style={styles.dateTimeIcon}>⏰</Text>
                    <Text style={styles.dateTimeValue}>{consultation.time}</Text>
                  </View>
                </View>

                <View style={styles.reasonContainer}>
                  <Text style={styles.reasonLabel}>Reason:</Text>
                  <Text style={styles.reasonText}>{consultation.reason}</Text>
                </View>

                {consultation.summary && (
                  <View style={styles.summaryContainer}>
                    <Text style={styles.summaryTitle}>Visit Summary</Text>
                    <Text style={styles.summaryText}>{consultation.summary}</Text>
                  </View>
                )}

                {consultation.prescriptions && consultation.prescriptions.length > 0 && (
                  <View style={styles.prescriptionsContainer}>
                    <Text style={styles.prescriptionsTitle}>💊 Prescriptions</Text>
                    {consultation.prescriptions.map((rx: any, index: number) => (
                      <View key={index} style={styles.prescriptionItem}>
                        <Text style={styles.prescriptionName}>{rx.name}</Text>
                        <Text style={styles.prescriptionDosage}>{rx.dosage}</Text>
                      </View>
                    ))}
                  </View>
                )}

                <TouchableOpacity style={styles.bookAgainButton}>
                  <Text style={styles.bookAgainText}>Book Again</Text>
                </TouchableOpacity>
              </Card.Content>
            </Card>
          ))}
        </View>
      )}

      {/* Providers Tab */}
      {activeTab === 'providers' && (
        <View style={styles.tabContent}>
          <Text style={styles.providersTitle}>Your Healthcare Providers</Text>
          {consultations?.providers?.map((provider: any, index: number) => (
            <Card key={index} style={styles.providerCard}>
              <Card.Content>
                <View style={styles.providerListItem}>
                  <View style={styles.providerListAvatar}>
                    <Text style={styles.providerListInitial}>{provider.name.charAt(0)}</Text>
                  </View>
                  <View style={styles.providerListInfo}>
                    <Text style={styles.providerListName}>{provider.name}</Text>
                    <Text style={styles.providerListType}>{provider.type}</Text>
                    <View style={styles.ratingContainer}>
                      <Text style={styles.ratingText}>⭐ {provider.rating}</Text>
                      <Text style={styles.availabilityText}>
                        Next: {provider.nextAvailable}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.bookProviderButton}>
                    <Text style={styles.bookProviderText}>Book</Text>
                  </TouchableOpacity>
                </View>
              </Card.Content>
            </Card>
          ))}

          <TouchableOpacity style={styles.findMoreButton}>
            <Text style={styles.findMoreText}>🔍 Find More Providers</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickAction}>
          <Text style={styles.quickActionIcon}>📞</Text>
          <Text style={styles.quickActionText}>Call Support</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction}>
          <Text style={styles.quickActionIcon}>💬</Text>
          <Text style={styles.quickActionText}>Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction}>
          <Text style={styles.quickActionIcon}>📋</Text>
          <Text style={styles.quickActionText}>Health Report</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
  header: {
    padding: 20,
    paddingTop: 50,
    alignItems: 'center',
  },
  headerEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  statsCard: {
    margin: 16,
    marginTop: -10,
    borderRadius: 16,
    elevation: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.consultation,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e0e0e0',
  },
  segmentedButtons: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  tabContent: {
    padding: 16,
  },
  consultationCard: {
    borderRadius: 16,
    marginBottom: 16,
  },
  countdownContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  countdownChip: {
    height: 28,
  },
  statusChip: {
    height: 28,
  },
  providerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  providerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.consultation,
    justifyContent: 'center',
    alignItems: 'center',
  },
  providerInitial: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  providerInfo: {
    marginLeft: 12,
    flex: 1,
  },
  providerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  providerType: {
    fontSize: 12,
    color: '#666',
  },
  specialty: {
    fontSize: 12,
    color: COLORS.consultation,
    fontWeight: '500',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  dateTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  dateTimeIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  dateTimeValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  locationIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#333',
  },
  reasonContainer: {
    marginBottom: 12,
  },
  reasonLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 14,
    color: '#333',
  },
  preparationContainer: {
    backgroundColor: '#FFF8E1',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  preparationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F57C00',
    marginBottom: 8,
  },
  preparationItem: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  notesContainer: {
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  notesText: {
    fontSize: 12,
    color: '#1976D2',
  },
  actionsContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  joinButton: {
    flex: 1,
    backgroundColor: COLORS.consultation,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  joinButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  cancelButton: {
    paddingHorizontal: 20,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F44336',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#F44336',
    fontWeight: '500',
  },
  emptyCard: {
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  scheduleButton: {
    backgroundColor: COLORS.consultation,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  scheduleButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  pastHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pastProvider: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  pastType: {
    fontSize: 12,
    color: '#666',
  },
  completedChip: {
    height: 24,
  },
  summaryContainer: {
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#333',
  },
  prescriptionsContainer: {
    backgroundColor: '#F3E5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  prescriptionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7B1FA2',
    marginBottom: 8,
  },
  prescriptionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  prescriptionName: {
    fontSize: 14,
    color: '#333',
  },
  prescriptionDosage: {
    fontSize: 12,
    color: '#666',
  },
  bookAgainButton: {
    backgroundColor: COLORS.consultation + '20',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  bookAgainText: {
    color: COLORS.consultation,
    fontWeight: '600',
  },
  providersTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  providerCard: {
    borderRadius: 16,
    marginBottom: 12,
  },
  providerListItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  providerListAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.consultation,
    justifyContent: 'center',
    alignItems: 'center',
  },
  providerListInitial: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  providerListInfo: {
    flex: 1,
    marginLeft: 12,
  },
  providerListName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  providerListType: {
    fontSize: 12,
    color: '#666',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingText: {
    fontSize: 12,
    color: '#333',
    marginRight: 12,
  },
  availabilityText: {
    fontSize: 12,
    color: '#666',
  },
  bookProviderButton: {
    backgroundColor: COLORS.consultation,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  bookProviderText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  findMoreButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: COLORS.consultation,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  findMoreText: {
    color: COLORS.consultation,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 16,
    marginTop: 20,
    marginBottom: 12,
    color: '#333',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  quickAction: {
    flex: 1,
    backgroundColor: '#fff',
    marginHorizontal: 4,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  quickActionText: {
    fontSize: 11,
    color: '#666',
  },
  bottomPadding: {
    height: 100,
  },
});