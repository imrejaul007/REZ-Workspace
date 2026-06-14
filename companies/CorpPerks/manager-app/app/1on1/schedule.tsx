// ==========================================
// CorpPerks Manager App - Schedule Meeting Screen
// ==========================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Card, Button, Avatar } from '../../src/components';
import { api } from '../../src/services/api';
import { useStore } from '../../src/store';
import {
  Colors,
  Spacing,
  FontSize,
  BorderRadius,
} from '../../src/utils/theme';
import { TeamMember } from '../../src/types';

export default function ScheduleMeetingScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { teamMembers } = useStore();

  const [selectedEmployee, setSelectedEmployee] = useState<TeamMember | null>(
    route.params?.employeeId
      ? teamMembers.find((m) => m.id === route.params.employeeId) || null
      : null
  );
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [meetingType, setMeetingType] = useState<'video' | 'audio' | 'in_person'>('video');
  const [duration, setDuration] = useState('30');
  const [loading, setLoading] = useState(false);

  const handleSchedule = async () => {
    if (!selectedEmployee) {
      Alert.alert('Error', 'Please select an employee');
      return;
    }

    setLoading(true);
    try {
      const scheduledStart = new Date();
      scheduledStart.setHours(scheduledStart.getHours() + 1);
      scheduledStart.setMinutes(0, 0, 0);

      const endTime = new Date(scheduledStart);
      endTime.setMinutes(endTime.getMinutes() + parseInt(duration));

      const result = await api.scheduleMeeting({
        title: title || `1:1 with ${selectedEmployee.name}`,
        attendeeId: selectedEmployee.id,
        attendeeName: selectedEmployee.name,
        scheduledStart: scheduledStart.toISOString(),
        scheduledEnd: endTime.toISOString(),
        duration: parseInt(duration),
        meetingType,
        description,
      });

      if (result.success) {
        Alert.alert('Success', 'Meeting scheduled successfully', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to schedule meeting');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Select Employee */}
        <Card title="Select Employee" style={styles.section}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {teamMembers.map((member) => (
              <TouchableOpacity
                key={member.id}
                style={[
                  styles.employeeCard,
                  selectedEmployee?.id === member.id && styles.employeeCardSelected,
                ]}
                onPress={() => setSelectedEmployee(member)}
              >
                <Avatar
                  uri={member.avatar}
                  name={member.name}
                  size="lg"
                />
                <Text
                  style={[
                    styles.employeeName,
                    selectedEmployee?.id === member.id && styles.employeeNameSelected,
                  ]}
                  numberOfLines={1}
                >
                  {member.name}
                </Text>
                <Text style={styles.employeeDesignation} numberOfLines={1}>
                  {member.designation}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Card>

        {/* Meeting Details */}
        <Card title="Meeting Details" style={styles.section}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Title</Text>
            <TextInput
              style={styles.input}
              placeholder="1:1 with..."
              placeholderTextColor={Colors.textMuted}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Meeting agenda..."
              placeholderTextColor={Colors.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />
          </View>
        </Card>

        {/* Meeting Type */}
        <Card title="Meeting Type" style={styles.section}>
          <View style={styles.typeOptions}>
            {(['video', 'audio', 'in_person'] as const).map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeOption,
                  meetingType === type && styles.typeOptionSelected,
                ]}
                onPress={() => setMeetingType(type)}
              >
                <Text
                  style={[
                    styles.typeOptionIcon,
                    meetingType === type && styles.typeOptionIconSelected,
                  ]}
                >
                  {type === 'video' ? 'videocam' : type === 'audio' ? 'call' : 'person'}
                </Text>
                <Text
                  style={[
                    styles.typeOptionLabel,
                    meetingType === type && styles.typeOptionLabelSelected,
                  ]}
                >
                  {type === 'video'
                    ? 'Video'
                    : type === 'audio'
                    ? 'Audio'
                    : 'In Person'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Duration */}
        <Card title="Duration" style={styles.section}>
          <View style={styles.durationOptions}>
            {['15', '30', '45', '60'].map((d) => (
              <TouchableOpacity
                key={d}
                style={[
                  styles.durationOption,
                  duration === d && styles.durationOptionSelected,
                ]}
                onPress={() => setDuration(d)}
              >
                <Text
                  style={[
                    styles.durationValue,
                    duration === d && styles.durationValueSelected,
                  ]}
                >
                  {d}
                </Text>
                <Text
                  style={[
                    styles.durationLabel,
                    duration === d && styles.durationLabelSelected,
                  ]}
                >
                  min
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title="Cancel"
            onPress={() => navigation.goBack()}
            variant="outline"
            style={styles.actionButton}
          />
          <Button
            title="Schedule"
            onPress={handleSchedule}
            loading={loading}
            style={styles.actionButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  section: {
    marginBottom: Spacing.md,
  },
  employeeCard: {
    alignItems: 'center',
    padding: Spacing.md,
    marginRight: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    minWidth: 100,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  employeeCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  employeeName: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  employeeNameSelected: {
    color: Colors.primary,
  },
  employeeDesignation: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  typeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  typeOption: {
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.background,
    minWidth: 90,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  typeOptionIcon: {
    fontSize: 24,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  typeOptionIconSelected: {
    color: Colors.primary,
  },
  typeOptionLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  typeOptionLabelSelected: {
    color: Colors.primary,
  },
  durationOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  durationOption: {
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.background,
    minWidth: 70,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  durationOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  durationValue: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  durationValueSelected: {
    color: Colors.primary,
  },
  durationLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  durationLabelSelected: {
    color: Colors.primary,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  actionButton: {
    flex: 1,
  },
});
