// ==========================================
// MyTalent - Daily Work Log Screen
// ==========================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';

import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../../src/components/Badge';
import { Card, Button } from '../../src/components';

// Mock tasks for today
const mockTodayTasks = [
  { taskId: 'TASK-00001', title: 'API endpoint development', status: 'in_progress' },
  { taskId: 'TASK-00005', title: 'Code review for PR #234', status: 'done' },
  { taskId: 'TASK-00006', title: 'Update documentation', status: 'in_progress' },
];

// Mock past logs
const mockPastLogs = [
  {
    date: '2026-05-28',
    completed: 'Completed API endpoint for user authentication. Fixed 3 bugs in the payment module.',
    blockers: '',
    tomorrowPlan: 'Continue with frontend integration and start testing.'
  },
  {
    date: '2026-05-27',
    completed: 'Attended sprint planning meeting. Started working on new feature.',
    blockers: 'Waiting for design specs from UI team',
    tomorrowPlan: 'Follow up on design specs and continue development.'
  }
];

export default function DailyLogScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [completed, setCompleted] = useState('');
  const [blockers, setBlockers] = useState('');
  const [tomorrowPlan, setTomorrowPlan] = useState('');
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleTaskToggle = (taskId: string) => {
    setSelectedTasks(prev =>
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleSubmit = () => {
    if (!completed.trim()) {
      Alert.alert('Required', 'Please describe what you completed today.');
      return;
    }

    Alert.alert(
      'Submit Daily Log',
      'Are you sure you want to submit your daily log?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: () => {
            setIsSubmitted(true);
            Alert.alert('Success', 'Your daily log has been submitted!');
          }
        }
      ]
    );
  };

  const formatDateDisplay = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Daily Work Log</Text>
        <Text style={styles.subtitle}>Track your daily progress and blockers</Text>
      </View>

      {/* Date Selector */}
      <Card style={styles.dateCard}>
        <Text style={styles.dateLabel}>Date</Text>
        <View style={styles.dateDisplay}>
          <Text style={styles.dateText}>{formatDateDisplay(selectedDate)}</Text>
          {isSubmitted && (
            <View style={styles.submittedBadge}>
              <Text style={styles.submittedText}>Submitted</Text>
            </View>
          )}
        </View>
      </Card>

      {/* Tasks Worked On */}
      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Tasks Worked On</Text>
        <Text style={styles.sectionHint}>Select tasks you worked on today</Text>
        {mockTodayTasks.map((task) => (
          <TouchableOpacity
            key={task.taskId}
            style={styles.taskItem}
            onPress={() => handleTaskToggle(task.taskId)}
          >
            <View style={[
              styles.checkbox,
              selectedTasks.includes(task.taskId) && styles.checkboxChecked
            ]}>
              {selectedTasks.includes(task.taskId) && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </View>
            <View style={styles.taskInfo}>
              <Text style={styles.taskTitle}>{task.title}</Text>
              <Text style={styles.taskId}>{task.taskId}</Text>
            </View>
            <View style={[
              styles.statusBadge,
              task.status === 'done' ? styles.statusDone : styles.statusProgress
            ]}>
              <Text style={styles.statusText}>
                {task.status === 'done' ? 'Done' : 'In Progress'}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </Card>

      {/* What Did You Complete */}
      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>What did you complete today?</Text>
        <Text style={styles.requiredLabel}>Required</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Describe your accomplishments..."
          placeholderTextColor={Colors.gray}
          value={completed}
          onChangeText={setCompleted}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </Card>

      {/* Any Blockers */}
      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Any blockers?</Text>
        <Text style={styles.optionalLabel}>Optional</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Describe any blockers or challenges..."
          placeholderTextColor={Colors.gray}
          value={blockers}
          onChangeText={setBlockers}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </Card>

      {/* Plan for Tomorrow */}
      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>What's your plan for tomorrow?</Text>
        <Text style={styles.optionalLabel}>Optional</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Describe your plan for tomorrow..."
          placeholderTextColor={Colors.gray}
          value={tomorrowPlan}
          onChangeText={setTomorrowPlan}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </Card>

      {/* Submit Button */}
      <Button
        title={isSubmitted ? "Update Log" : "Submit Daily Log"}
        onPress={handleSubmit}
        style={styles.submitButton}
        disabled={isSubmitted && !completed}
      />

      {/* Past Logs */}
      <View style={styles.pastLogsSection}>
        <Text style={styles.pastLogsTitle}>Past Logs</Text>
        {mockPastLogs.map((log, idx) => (
          <Card key={idx} style={styles.pastLogCard}>
            <Text style={styles.pastLogDate}>{formatDateDisplay(log.date)}</Text>
            <View style={styles.pastLogRow}>
              <Text style={styles.pastLogLabel}>Completed:</Text>
              <Text style={styles.pastLogValue}>{log.completed}</Text>
            </View>
            {log.blockers && (
              <View style={styles.pastLogRow}>
                <Text style={styles.pastLogLabel}>Blockers:</Text>
                <Text style={[styles.pastLogValue, styles.blockersText]}>{log.blockers}</Text>
              </View>
            )}
            <View style={styles.pastLogRow}>
              <Text style={styles.pastLogLabel}>Tomorrow:</Text>
              <Text style={styles.pastLogValue}>{log.tomorrowPlan}</Text>
            </View>
          </Card>
        ))}
      </View>
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
  dateCard: {
    margin: Spacing.md,
    marginBottom: 0,
  },
  dateLabel: {
    fontSize: FontSize.sm,
    color: Colors.gray,
    marginBottom: Spacing.xs,
  },
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  submittedBadge: {
    backgroundColor: Colors.success,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  submittedText: {
    color: Colors.white,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  sectionCard: {
    margin: Spacing.md,
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  requiredLabel: {
    fontSize: FontSize.xs,
    color: Colors.error,
    marginBottom: Spacing.sm,
  },
  optionalLabel: {
    fontSize: FontSize.xs,
    color: Colors.gray,
    marginBottom: Spacing.sm,
  },
  sectionHint: {
    fontSize: FontSize.sm,
    color: Colors.gray,
    marginBottom: Spacing.md,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkmark: {
    color: Colors.white,
    fontWeight: FontWeight.bold,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: FontSize.md,
    color: Colors.text,
  },
  taskId: {
    fontSize: FontSize.xs,
    color: Colors.gray,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  statusDone: {
    backgroundColor: Colors.success + '20',
  },
  statusProgress: {
    backgroundColor: Colors.primary + '20',
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  textArea: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.text,
    minHeight: 100,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  submitButton: {
    margin: Spacing.md,
    marginTop: Spacing.lg,
  },
  pastLogsSection: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  pastLogsTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  pastLogCard: {
    marginBottom: Spacing.md,
    backgroundColor: Colors.background,
  },
  pastLogDate: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  pastLogRow: {
    marginBottom: Spacing.xs,
  },
  pastLogLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.gray,
  },
  pastLogValue: {
    fontSize: FontSize.sm,
    color: Colors.text,
  },
  blockersText: {
    color: Colors.error,
  },
});
