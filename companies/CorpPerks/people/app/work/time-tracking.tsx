// ==========================================
// MyTalent - Time Tracking Screen
// ==========================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';

import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../../src/components/Badge';
import { Card, Button } from '../../src/components';

interface TimeEntry {
  id: string;
  projectName: string;
  taskTitle: string;
  hours: number;
  date: string;
  type: 'project' | 'meeting' | 'admin' | 'overtime';
}

// Mock data
const mockTimeEntries: TimeEntry[] = [
  { id: '1', projectName: 'CorpHR Platform', taskTitle: 'API development', hours: 4, date: '2026-05-29', type: 'project' },
  { id: '2', projectName: 'Mobile App', taskTitle: 'Bug fixes', hours: 2, date: '2026-05-29', type: 'project' },
  { id: '3', projectName: 'Meetings', taskTitle: 'Sprint planning', hours: 1, date: '2026-05-29', type: 'meeting' },
  { id: '4', projectName: 'CorpHR Platform', taskTitle: 'Code review', hours: 3, date: '2026-05-28', type: 'project' },
  { id: '5', projectName: 'Admin', taskTitle: 'Email & communications', hours: 1, date: '2026-05-28', type: 'admin' },
];

const mockProjects = ['CorpHR Platform', 'Mobile App v2.0', 'Data Analytics Dashboard', 'Security Audit'];

export default function TimeTrackingScreen() {
  const [activeTab, setActiveTab] = useState<'today' | 'week' | 'log'>('today');
  const [showLogForm, setShowLogForm] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [hours, setHours] = useState('');
  const [description, setDescription] = useState('');
  const [entryType, setEntryType] = useState<'project' | 'meeting' | 'admin' | 'overtime'>('project');
  const [entries, setEntries] = useState<TimeEntry[]>(mockTimeEntries);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [activeTimerProject, setActiveTimerProject] = useState('');

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTimer = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const todayEntries = entries.filter(e => e.date === '2026-05-29');
  const todayTotal = todayEntries.reduce((sum, e) => sum + e.hours, 0);

  const weekEntries = entries.filter(e => {
    const date = new Date(e.date);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return date >= weekAgo;
  });

  const weekTotal = weekEntries.reduce((sum, e) => sum + e.hours, 0);
  const overtimeHours = weekTotal > 40 ? weekTotal - 40 : 0;

  const handleStartTimer = () => {
    if (!projectName) {
      Alert.alert('Select Project', 'Please select a project first.');
      return;
    }
    setActiveTimerProject(projectName);
    setIsTimerRunning(true);
  };

  const handleStopTimer = () => {
    setIsTimerRunning(false);
    const loggedHours = (timerSeconds / 3600).toFixed(1);
    Alert.alert(
      'Log Time',
      `You worked for ${formatTimer(timerSeconds)}. Would you like to log ${loggedHours} hours?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Discard',
          onPress: () => {
            setTimerSeconds(0);
            setActiveTimerProject('');
          }
        },
        {
          text: 'Log Time',
          onPress: () => {
            const newEntry: TimeEntry = {
              id: Date.now().toString(),
              projectName: activeTimerProject,
              taskTitle: taskTitle || 'Timer session',
              hours: parseFloat(loggedHours),
              date: new Date().toISOString().split('T')[0],
              type: entryType
            };
            setEntries(prev => [newEntry, ...prev]);
            setTimerSeconds(0);
            setActiveTimerProject('');
            Alert.alert('Success', 'Time logged successfully!');
          }
        }
      ]
    );
  };

  const handleSubmitEntry = () => {
    if (!projectName || !hours) {
      Alert.alert('Required', 'Please fill in project and hours.');
      return;
    }

    const newEntry: TimeEntry = {
      id: Date.now().toString(),
      projectName,
      taskTitle,
      hours: parseFloat(hours),
      date: new Date().toISOString().split('T')[0],
      type: entryType
    };

    setEntries(prev => [newEntry, ...prev]);
    setShowLogForm(false);
    setProjectName('');
    setTaskTitle('');
    setHours('');
    setDescription('');
    Alert.alert('Success', 'Time entry added!');
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'project': return Colors.primary;
      case 'meeting': return Colors.warning;
      case 'admin': return Colors.gray;
      case 'overtime': return Colors.error;
      default: return Colors.primary;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'project': return 'Project';
      case 'meeting': return 'Meeting';
      case 'admin': return 'Admin';
      case 'overtime': return 'OT';
      default: return type;
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Time Tracking</Text>
        <Text style={styles.subtitle}>Log and manage your work hours</Text>
      </View>

      {/* Timer Card */}
      <Card style={styles.timerCard}>
        <Text style={styles.timerLabel}>
          {isTimerRunning ? 'Timer Running' : 'Quick Timer'}
        </Text>
        <Text style={styles.timerDisplay}>{formatTimer(timerSeconds)}</Text>
        {isTimerRunning && (
          <Text style={styles.timerProject}>Working on: {activeTimerProject}</Text>
        )}
        <View style={styles.timerButtons}>
          {!isTimerRunning ? (
            <Button
              title="Start Timer"
              onPress={handleStartTimer}
              style={styles.timerBtn}
            />
          ) : (
            <Button
              title="Stop & Log"
              onPress={handleStopTimer}
              style={[styles.timerBtn, styles.stopBtn]}
              variant="danger"
            />
          )}
        </View>
      </Card>

      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{todayTotal.toFixed(1)}h</Text>
          <Text style={styles.summaryLabel}>Today</Text>
        </Card>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{weekTotal.toFixed(1)}h</Text>
          <Text style={styles.summaryLabel}>This Week</Text>
        </Card>
        <Card style={[styles.summaryCard, overtimeHours > 0 && styles.overtimeCard]}>
          <Text style={[styles.summaryValue, overtimeHours > 0 && styles.overtimeValue]}>
            {overtimeHours.toFixed(1)}h
          </Text>
          <Text style={styles.summaryLabel}>Overtime</Text>
        </Card>
      </View>

      {/* OT Alert */}
      {overtimeHours > 10 && (
        <View style={styles.alertBanner}>
          <Text style={styles.alertIcon}>⚠️</Text>
          <Text style={styles.alertText}>
            You've logged {overtimeHours.toFixed(1)} hours of overtime this week.
            Consider taking time off or redistributing workload.
          </Text>
        </View>
      )}

      {/* Tab Buttons */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'today' && styles.tabActive]}
          onPress={() => setActiveTab('today')}
        >
          <Text style={[styles.tabText, activeTab === 'today' && styles.tabTextActive]}>
            Today
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'week' && styles.tabActive]}
          onPress={() => setActiveTab('week')}
        >
          <Text style={[styles.tabText, activeTab === 'week' && styles.tabTextActive]}>
            This Week
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'log' && styles.tabActive]}
          onPress={() => setActiveTab('log')}
        >
          <Text style={[styles.tabText, activeTab === 'log' && styles.tabTextActive]}>
            Log Entry
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'today' && (
        <View style={styles.entriesSection}>
          <Text style={styles.sectionTitle}>Today's Entries</Text>
          {todayEntries.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyText}>No entries logged today</Text>
            </Card>
          ) : (
            todayEntries.map((entry) => (
              <Card key={entry.id} style={styles.entryCard}>
                <View style={styles.entryHeader}>
                  <View style={[styles.typeBadge, { backgroundColor: getTypeColor(entry.type) + '20' }]}>
                    <Text style={[styles.typeText, { color: getTypeColor(entry.type) }]}>
                      {getTypeLabel(entry.type)}
                    </Text>
                  </View>
                  <Text style={styles.entryHours}>{entry.hours}h</Text>
                </View>
                <Text style={styles.entryProject}>{entry.projectName}</Text>
                <Text style={styles.entryTask}>{entry.taskTitle}</Text>
              </Card>
            ))
          )}
        </View>
      )}

      {activeTab === 'week' && (
        <View style={styles.entriesSection}>
          <Text style={styles.sectionTitle}>This Week's Entries</Text>
          {weekEntries.map((entry) => (
            <Card key={entry.id} style={styles.entryCard}>
              <View style={styles.entryHeader}>
                <Text style={styles.entryDate}>{new Date(entry.date).toLocaleDateString('en-IN', {
                  weekday: 'short', month: 'short', day: 'numeric'
                })}</Text>
                <View style={[styles.typeBadge, { backgroundColor: getTypeColor(entry.type) + '20' }]}>
                  <Text style={[styles.typeText, { color: getTypeColor(entry.type) }]}>
                    {getTypeLabel(entry.type)}
                  </Text>
                </View>
                <Text style={styles.entryHours}>{entry.hours}h</Text>
              </View>
              <Text style={styles.entryProject}>{entry.projectName}</Text>
              <Text style={styles.entryTask}>{entry.taskTitle}</Text>
            </Card>
          ))}

          {/* Weekly Summary */}
          <Card style={styles.weekSummary}>
            <Text style={styles.weekSummaryTitle}>Weekly Summary</Text>
            <View style={styles.weekSummaryRow}>
              <Text style={styles.weekSummaryLabel}>Total Hours</Text>
              <Text style={styles.weekSummaryValue}>{weekTotal.toFixed(1)}h</Text>
            </View>
            <View style={styles.weekSummaryRow}>
              <Text style={styles.weekSummaryLabel}>Standard Hours</Text>
              <Text style={styles.weekSummaryValue}>40h</Text>
            </View>
            <View style={styles.weekSummaryRow}>
              <Text style={styles.weekSummaryLabel}>Overtime</Text>
              <Text style={[styles.weekSummaryValue, overtimeHours > 0 && styles.overtimeValue]}>
                {overtimeHours > 0 ? `+${overtimeHours.toFixed(1)}h` : '0h'}
              </Text>
            </View>
          </Card>
        </View>
      )}

      {activeTab === 'log' && (
        <View style={styles.logSection}>
          <Text style={styles.sectionTitle}>Log Time Entry</Text>

          <Card style={styles.formCard}>
            <Text style={styles.inputLabel}>Project *</Text>
            <View style={styles.projectPicker}>
              {mockProjects.map((project) => (
                <TouchableOpacity
                  key={project}
                  style={[
                    styles.projectOption,
                    projectName === project && styles.projectOptionSelected
                  ]}
                  onPress={() => setProjectName(project)}
                >
                  <Text style={[
                    styles.projectOptionText,
                    projectName === project && styles.projectOptionTextSelected
                  ]}>
                    {project}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Task Description</Text>
            <TextInput
              style={styles.input}
              placeholder="What did you work on?"
              placeholderTextColor={Colors.gray}
              value={taskTitle}
              onChangeText={setTaskTitle}
            />

            <Text style={styles.inputLabel}>Hours *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 2.5"
              placeholderTextColor={Colors.gray}
              value={hours}
              onChangeText={setHours}
              keyboardType="decimal-pad"
            />

            <Text style={styles.inputLabel}>Type</Text>
            <View style={styles.typePicker}>
              {(['project', 'meeting', 'admin', 'overtime'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeOption,
                    entryType === type && { backgroundColor: getTypeColor(type) }
                  ]}
                  onPress={() => setEntryType(type)}
                >
                  <Text style={[
                    styles.typeOptionText,
                    entryType === type && styles.typeOptionTextSelected
                  ]}>
                    {getTypeLabel(type)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Additional notes..."
              placeholderTextColor={Colors.gray}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />

            <Button
              title="Submit Entry"
              onPress={handleSubmitEntry}
              style={styles.submitBtn}
            />
          </Card>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: Spacing.lg,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.gray,
    marginTop: Spacing.xs,
  },
  timerCard: {
    margin: Spacing.md,
    alignItems: 'center',
    backgroundColor: Colors.primary + '10',
  },
  timerLabel: {
    fontSize: FontSize.sm,
    color: Colors.gray,
    marginBottom: Spacing.xs,
  },
  timerDisplay: {
    fontSize: 48,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
    fontVariant: ['tabular-nums'],
  },
  timerProject: {
    fontSize: FontSize.sm,
    color: Colors.gray,
    marginTop: Spacing.xs,
  },
  timerButtons: {
    marginTop: Spacing.md,
    width: '100%',
  },
  timerBtn: {
    width: '100%',
  },
  stopBtn: {
    backgroundColor: Colors.error,
  },
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  overtimeCard: {
    backgroundColor: Colors.error + '10',
  },
  summaryValue: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  overtimeValue: {
    color: Colors.error,
  },
  summaryLabel: {
    fontSize: FontSize.xs,
    color: Colors.gray,
    marginTop: Spacing.xs,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.warning + '20',
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  alertIcon: {
    fontSize: 20,
  },
  alertText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.warning,
  },
  tabs: {
    flexDirection: 'row',
    margin: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.gray,
  },
  tabTextActive: {
    color: Colors.white,
  },
  entriesSection: {
    padding: Spacing.md,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.gray,
  },
  entryCard: {
    marginBottom: Spacing.sm,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  typeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  typeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  entryDate: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.gray,
  },
  entryHours: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  entryProject: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  entryTask: {
    fontSize: FontSize.sm,
    color: Colors.gray,
  },
  weekSummary: {
    marginTop: Spacing.md,
    backgroundColor: Colors.primary + '10',
  },
  weekSummaryTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
    marginBottom: Spacing.md,
  },
  weekSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  weekSummaryLabel: {
    fontSize: FontSize.sm,
    color: Colors.gray,
  },
  weekSummaryValue: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  logSection: {
    padding: Spacing.md,
    paddingTop: 0,
  },
  formCard: {
    padding: 0,
  },
  inputLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.text,
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  projectPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  projectOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  projectOptionSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  projectOptionText: {
    fontSize: FontSize.sm,
    color: Colors.gray,
  },
  projectOptionTextSelected: {
    color: Colors.white,
  },
  input: {
    marginHorizontal: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    fontSize: FontSize.md,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  typePicker: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  typeOption: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typeOptionText: {
    fontSize: FontSize.sm,
    color: Colors.gray,
  },
  typeOptionTextSelected: {
    color: Colors.white,
    fontWeight: FontWeight.semibold,
  },
  submitBtn: {
    margin: Spacing.md,
    marginTop: Spacing.lg,
  },
});
