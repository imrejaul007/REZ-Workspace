// RisaCare Mobile - Pregnancy Tracking Screen

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface PregnancyRecord {
  id: string;
  dueDate: string;
  currentWeek: number;
  trimester: string;
  status: 'pregnant' | 'trying' | 'postpartum';
  checkups: Checkup[];
  ultrasounds: Ultrasound[];
}

interface Checkup {
  id: string;
  week: number;
  scheduledDate: string;
  status: 'scheduled' | 'completed' | 'missed';
  doctorName?: string;
}

interface Ultrasound {
  id: string;
  date: string;
  week: number;
  type: string;
}

const pregnancyWeekInfo: Record<number, any> = {
  4: { babySize: 'Poppy seed', milestone: 'Pregnancy confirmed!' },
  8: { babySize: 'Raspberry', milestone: 'First ultrasound' },
  12: { babySize: 'Plum', milestone: 'End of first trimester' },
  20: { babySize: 'Banana', milestone: 'Anatomy scan - Gender reveal!' },
  24: { babySize: 'Cantaloupe', milestone: 'Glucose test' },
  28: { babySize: 'Eggplant', milestone: 'Third trimester begins' },
  32: { babySize: 'Jicama', milestone: 'Growth scan' },
  36: { babySize: 'Romaine lettuce', milestone: 'Baby dropping' },
  40: { babySize: 'Pumpkin', milestone: 'Due date!' },
};

export default function PregnancyScreen() {
  const [loading, setLoading] = useState(false);
  const [record, setRecord] = useState<PregnancyRecord | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    loadPregnancyRecord();
  }, []);

  const loadPregnancyRecord = async () => {
    setLoading(true);
    try {
      // Simulated API call - replace with actual API
      // const response = await fetch(`${API_URL}/pregnancy/${profileId}`);
      // const data = await response.json();

      // Mock data for development
      setRecord({
        id: 'preg_001',
        dueDate: '2026-09-15',
        currentWeek: 24,
        trimester: 'second',
        status: 'pregnant',
        checkups: [
          { id: 'chk1', week: 12, scheduledDate: '2026-05-15', status: 'completed', doctorName: 'Dr. Priya Sharma' },
          { id: 'chk2', week: 20, scheduledDate: '2026-06-12', status: 'completed', doctorName: 'Dr. Priya Sharma' },
          { id: 'chk3', week: 28, scheduledDate: '2026-07-10', status: 'scheduled', doctorName: 'Dr. Priya Sharma' },
        ],
        ultrasounds: [
          { id: 'us1', date: '2026-05-15', week: 12, type: 'Dating' },
          { id: 'us2', date: '2026-06-12', week: 20, type: 'Anatomy' },
        ],
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to load pregnancy record');
    } finally {
      setLoading(false);
    }
  };

  const calculateWeek = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    const daysUntilDue = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const weeksUntilDue = Math.floor(daysUntilDue / 7);
    return 40 - Math.abs(weeksUntilDue);
  };

  const getTrimester = (week: number) => {
    if (week <= 12) return 'First Trimester';
    if (week <= 28) return 'Second Trimester';
    return 'Third Trimester';
  };

  const getWeekInfo = (week: number) => {
    const rounded = Math.floor(week / 4) * 4;
    return pregnancyWeekInfo[rounded] || pregnancyWeekInfo[Math.max(...Object.keys(pregnancyWeekInfo).map(Number))];
  };

  const addPregnancy = async () => {
    if (!dueDate) {
      Alert.alert('Error', 'Please enter due date');
      return;
    }

    setLoading(true);
    try {
      // API call to create pregnancy record
      // await fetch(`${API_URL}/pregnancy`, { method: 'POST', body: JSON.stringify({ profileId, dueDate }) });

      Alert.alert('Success', 'Pregnancy tracking started!');
      setShowAddModal(false);
      loadPregnancyRecord();
    } catch (error) {
      Alert.alert('Error', 'Failed to start tracking');
    } finally {
      setLoading(false);
    }
  };

  if (!record) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No Pregnancy Tracking</Text>
          <Text style={styles.emptyText}>Start tracking your pregnancy journey</Text>
          <TouchableOpacity style={styles.startButton} onPress={() => setShowAddModal(true)}>
            <Text style={styles.startButtonText}>Start Tracking</Text>
          </TouchableOpacity>
        </View>

        {showAddModal && (
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Enter Due Date</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              value={dueDate}
              onChangeText={setDueDate}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowAddModal(false)}>
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={addPregnancy}>
                <Text style={styles.confirmButtonText}>Start</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </SafeAreaView>
    );
  }

  const currentWeek = calculateWeek(record.dueDate);
  const weekInfo = getWeekInfo(currentWeek);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Pregnancy Tracker</Text>
          <Text style={styles.headerSubtitle}>{getTrimester(currentWeek)}</Text>
        </View>

        {/* Week Counter */}
        <View style={styles.weekCard}>
          <Text style={styles.weekNumber}>Week {currentWeek}</Text>
          <Text style={styles.weekLabel}>of 40 weeks</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(currentWeek / 40) * 100}%` }]} />
          </View>
          <Text style={styles.dueDate}>Due: {record.dueDate}</Text>
        </View>

        {/* Baby Size */}
        <View style={styles.babyCard}>
          <Text style={styles.babySizeLabel}>Your baby is the size of a</Text>
          <Text style={styles.babySize}>{weekInfo?.babySize || 'Small fruit'}</Text>
          <Text style={styles.milestone}>{weekInfo?.milestone || 'Growing every day!'}</Text>
        </View>

        {/* Upcoming Checkup */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Checkup</Text>
          {record.checkups.filter(c => c.status === 'scheduled').length > 0 ? (
            record.checkups
              .filter(c => c.status === 'scheduled')
              .map(checkup => (
                <View key={checkup.id} style={styles.checkupCard}>
                  <View style={styles.checkupInfo}>
                    <Text style={styles.checkupWeek}>Week {checkup.week}</Text>
                    <Text style={styles.checkupDate}>{checkup.scheduledDate}</Text>
                    {checkup.doctorName && <Text style={styles.checkupDoctor}>{checkup.doctorName}</Text>}
                  </View>
                  <TouchableOpacity style={styles.checkupButton}>
                    <Text style={styles.checkupButtonText}>View</Text>
                  </TouchableOpacity>
                </View>
              ))
          ) : (
            <Text style={styles.noData}>No upcoming checkups scheduled</Text>
          )}
        </View>

        {/* Past Checkups */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Checkup History</Text>
          {record.checkups
            .filter(c => c.status === 'completed')
            .map(checkup => (
              <View key={checkup.id} style={styles.historyCard}>
                <Text style={styles.historyWeek}>Week {checkup.week}</Text>
                <Text style={styles.historyDate}>{checkup.scheduledDate}</Text>
                {checkup.doctorName && <Text style={styles.historyDoctor}>{checkup.doctorName}</Text>}
              </View>
            ))}
        </View>

        {/* Ultrasounds */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ultrasounds</Text>
          {record.ultrasounds.map(us => (
            <View key={us.id} style={styles.ultrasoundCard}>
              <Text style={styles.ultrasoundType}>{us.type} Scan</Text>
              <Text style={styles.ultrasoundDate}>Week {us.week} - {us.date}</Text>
            </View>
          ))}
        </View>

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>This Week's Tips</Text>
          <Text style={styles.tip}>• Stay hydrated - aim for 8-10 glasses of water</Text>
          <Text style={styles.tip}>• Take your prenatal vitamins</Text>
          <Text style={styles.tip}>• Gentle exercises like walking or swimming</Text>
          <Text style={styles.tip}>• Monitor kick counts daily</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  startButton: {
    backgroundColor: '#E91E63',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  startButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    padding: 20,
    backgroundColor: '#E91E63',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  weekCard: {
    backgroundColor: '#FFF',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  weekNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#E91E63',
  },
  weekLabel: {
    fontSize: 16,
    color: '#666',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#EEE',
    borderRadius: 4,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#E91E63',
    borderRadius: 4,
  },
  dueDate: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  babyCard: {
    backgroundColor: '#FFF0F5',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  babySizeLabel: {
    fontSize: 14,
    color: '#666',
  },
  babySize: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#E91E63',
    marginVertical: 8,
  },
  milestone: {
    fontSize: 16,
    color: '#333',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  checkupCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checkupInfo: {
    flex: 1,
  },
  checkupWeek: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  checkupDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  checkupDoctor: {
    fontSize: 12,
    color: '#E91E63',
    marginTop: 2,
  },
  checkupButton: {
    backgroundColor: '#E91E63',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  checkupButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  historyCard: {
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  historyWeek: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  historyDate: {
    fontSize: 12,
    color: '#666',
  },
  historyDoctor: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 2,
  },
  ultrasoundCard: {
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  ultrasoundType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  ultrasoundDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  tipsCard: {
    backgroundColor: '#E8F5E9',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 12,
  },
  tip: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    lineHeight: 20,
  },
  modal: {
    position: 'absolute',
    top: '30%',
    left: 16,
    right: 16,
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 16,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#E91E63',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  noData: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
});
