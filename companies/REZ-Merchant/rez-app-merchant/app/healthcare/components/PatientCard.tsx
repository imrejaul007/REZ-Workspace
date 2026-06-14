/**
 * PatientCard Component
 * Reusable card component for displaying patient information
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/constants/Colors';
import { Card, Avatar, Badge } from '@/components/ui/DesignSystemComponents';

export type PatientStatus = 'active' | 'inactive' | 'new';

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  bloodGroup?: string;
  status: PatientStatus;
  lastVisit?: Date;
  upcomingAppointment?: Date;
  medicalHistory?: string[];
  allergies?: string[];
  avatar?: string;
}

interface PatientCardProps {
  patient: Patient;
  onPress?: () => void;
  showDetails?: boolean;
  compact?: boolean;
}

const getStatusColor = (status: PatientStatus): string => {
  const colors: Record<PatientStatus, string> = {
    active: Colors.light.success,
    inactive: Colors.light.textMuted,
    new: Colors.light.info,
  };
  return colors[status];
};

const getStatusLabel = (status: PatientStatus): string => {
  const labels: Record<PatientStatus, string> = {
    active: 'Active',
    inactive: 'Inactive',
    new: 'New',
  };
  return labels[status];
};

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const getAge = (dateOfBirth: Date): number => {
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
    age--;
  }
  return age;
};

export const PatientCard: React.FC<PatientCardProps> = ({
  patient,
  onPress,
  showDetails = true,
  compact = false,
}) => {
  const content = (
    <Card variant="elevated" padding={compact ? 'sm' : 'md'} style={styles.card}>
      <View style={styles.header}>
        <Avatar
          size={compact ? 'small' : 'medium'}
          initials={`${patient.firstName[0]}${patient.lastName[0]}`}
          backgroundColor={Colors.light.primaryLight2}
          textColor={Colors.light.primary}
        />
        <View style={styles.headerInfo}>
          <Text style={styles.name}>
            {patient.firstName} {patient.lastName}
          </Text>
          <Text style={styles.meta}>
            {getAge(patient.dateOfBirth)} years,{' '}
            {patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}
          </Text>
        </View>
        <Badge
          variant={
            patient.status === 'active'
              ? 'success'
              : patient.status === 'new'
                ? 'primary'
                : 'default'
          }
          size="small"
        >
          {getStatusLabel(patient.status)}
        </Badge>
      </View>

      {showDetails && (
        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Ionicons name="call-outline" size={14} color={Colors.light.textSecondary} />
            <Text style={styles.detailText}>{patient.phone}</Text>
          </View>

          {patient.bloodGroup && (
            <View style={styles.detailRow}>
              <Ionicons name="water-outline" size={14} color={Colors.light.danger} />
              <Text style={styles.detailText}>{patient.bloodGroup}</Text>
            </View>
          )}

          {patient.lastVisit && (
            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={14} color={Colors.light.textSecondary} />
              <Text style={styles.detailText}>Last visit: {formatDate(patient.lastVisit)}</Text>
            </View>
          )}

          {patient.allergies && patient.allergies.length > 0 && (
            <View style={styles.allergyContainer}>
              <Ionicons name="warning-outline" size={14} color={Colors.light.warning} />
              <Text style={styles.allergyText}>
                Allergies: {patient.allergies.join(', ')}
              </Text>
            </View>
          )}
        </View>
      )}

      {patient.upcomingAppointment && (
        <View style={styles.appointmentBanner}>
          <Ionicons name="calendar" size={14} color={Colors.light.info} />
          <Text style={styles.appointmentText}>
            Next appointment: {formatDate(patient.upcomingAppointment)}
          </Text>
        </View>
      )}
    </Card>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.textHeading,
  },
  meta: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  details: {
    marginTop: 12,
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  allergyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    padding: 8,
    backgroundColor: Colors.light.warningLight,
    borderRadius: 8,
  },
  allergyText: {
    fontSize: 12,
    color: Colors.light.warning,
    fontWeight: '500',
    flex: 1,
  },
  appointmentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 10,
    backgroundColor: Colors.light.infoLight,
    borderRadius: 8,
  },
  appointmentText: {
    fontSize: 13,
    color: Colors.light.info,
    fontWeight: '500',
  },
});

export default PatientCard;
