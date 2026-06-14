// ==========================================
// MyTalent - Opportunity Hub Screen
// All Opportunities: Jobs, Gigs, Mentorship, Advisory
// ==========================================

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../../src/components/Badge';
import { Card, Button, StatusBadge } from '../../src/components';
import { mockOpportunities, mockApplications } from '../../src/data/mockData';
import { Opportunity, OpportunityType, OpportunityApplication } from '../../src/types';

const OPPORTUNITY_TYPES: { type: OpportunityType | 'all'; label: string; icon: string }[] = [
  { type: 'all', label: 'All', icon: '📋' },
  { type: 'internal_job', label: 'Jobs', icon: '💼' },
  { type: 'gig', label: 'Gigs', icon: '⚡' },
  { type: 'mentorship', label: 'Mentorship', icon: '🎓' },
  { type: 'advisory', label: 'Advisory', icon: '🏢' },
  { type: 'freelance', label: 'Freelance', icon: '💻' },
  { type: 'part_time', label: 'Part-time', icon: '⏰' },
];

const TYPE_COLORS: Record<OpportunityType, string> = {
  internal_job: Colors.primary,
  gig: Colors.success,
  mentorship: Colors.secondary,
  advisory: Colors.warning,
  freelance: '#EC4899',
  part_time: '#06B6D4',
};

const TYPE_LABELS: Record<OpportunityType, string> = {
  internal_job: 'Internal Job',
  gig: 'Gig',
  mentorship: 'Mentorship',
  advisory: 'Advisory',
  freelance: 'Freelance',
  part_time: 'Part-time',
};

const STATUS_COLORS: Record<string, string> = {
  applied: Colors.success,
  screening: Colors.warning,
  interview: Colors.secondary,
  offer: Colors.success,
  rejected: Colors.error,
  withdrawn: Colors.textMuted,
};

interface OpportunityCardProps {
  opportunity: Opportunity;
  isApplied: boolean;
  onApply: () => void;
  onSave: () => void;
}

function OpportunityCard({ opportunity, isApplied, onApply, onSave }: OpportunityCardProps) {
  const typeColor = TYPE_COLORS[opportunity.type];
  const daysUntilDeadline = Math.ceil(
    (new Date(opportunity.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <Card style={styles.oppCard}>
      {/* Header */}
      <View style={styles.oppHeader}>
        <View style={[styles.typeBadge, { backgroundColor: `${typeColor}20` }]}>
          <Text style={[styles.typeText, { color: typeColor }]}>
            {TYPE_LABELS[opportunity.type]}
          </Text>
        </View>
        {opportunity.matchScore && (
          <View style={styles.matchBadge}>
            <Text style={styles.matchScore}>{opportunity.matchScore}%</Text>
            <Text style={styles.matchLabel}>match</Text>
          </View>
        )}
      </View>

      {/* Title */}
      <Text style={styles.oppTitle}>{opportunity.title}</Text>
      <Text style={styles.oppCompany}>
        {opportunity.company}
        {opportunity.department && ` • ${opportunity.department}`}
      </Text>

      {/* Details */}
      <View style={styles.oppDetails}>
        <View style={styles.detailItem}>
          <Text style={styles.detailIcon}>📍</Text>
          <Text style={styles.detailText}>{opportunity.location}</Text>
        </View>
        {opportunity.salary && (
          <View style={styles.detailItem}>
            <Text style={styles.detailIcon}>💰</Text>
            <Text style={[styles.detailText, styles.salaryText]}>{opportunity.salary}</Text>
          </View>
        )}
        {opportunity.pay && (
          <View style={styles.detailItem}>
            <Text style={styles.detailIcon}>💰</Text>
            <Text style={[styles.detailText, styles.salaryText]}>{opportunity.pay}</Text>
          </View>
        )}
        {opportunity.equity && (
          <View style={styles.detailItem}>
            <Text style={styles.detailIcon}>📊</Text>
            <Text style={[styles.detailText, styles.equityText]}>{opportunity.equity} equity</Text>
          </View>
        )}
        {opportunity.duration && (
          <View style={styles.detailItem}>
            <Text style={styles.detailIcon}>⏱️</Text>
            <Text style={styles.detailText}>{opportunity.duration}</Text>
          </View>
        )}
        {opportunity.commitment && (
          <View style={styles.detailItem}>
            <Text style={styles.detailIcon}>📅</Text>
            <Text style={styles.detailText}>{opportunity.commitment}</Text>
          </View>
        )}
        {opportunity.mentor && (
          <View style={styles.detailItem}>
            <Text style={styles.detailIcon}>👤</Text>
            <Text style={styles.detailText}>Mentor: {opportunity.mentor}</Text>
          </View>
        )}
      </View>

      {/* Description */}
      <Text style={styles.oppDescription} numberOfLines={2}>
        {opportunity.description}
      </Text>

      {/* Footer */}
      <View style={styles.oppFooter}>
        <Text style={styles.deadline}>
          {daysUntilDeadline > 0 ? `${daysUntilDeadline} days left` : 'Deadline passed'}
        </Text>
        <View style={styles.oppActions}>
          <TouchableOpacity style={styles.saveBtn} onPress={onSave}>
            <Text style={styles.saveIcon}>♡</Text>
          </TouchableOpacity>
          <Button
            title={isApplied ? 'Applied' : 'Apply'}
            variant={isApplied ? 'secondary' : 'primary'}
            size="sm"
            disabled={isApplied}
            onPress={onApply}
          />
        </View>
      </View>
    </Card>
  );
}

interface ApplicationCardProps {
  application: OpportunityApplication;
}

function ApplicationCard({ application }: ApplicationCardProps) {
  const typeColor = TYPE_COLORS[application.opportunityType];
  const statusColor = STATUS_COLORS[application.status] || Colors.textMuted;

  return (
    <Card style={styles.applicationCard}>
      <View style={styles.appHeader}>
        <View style={[styles.typeBadge, { backgroundColor: `${typeColor}20` }]}>
          <Text style={[styles.typeText, { color: typeColor }]}>
            {TYPE_LABELS[application.opportunityType]}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
          </Text>
        </View>
      </View>
      <Text style={styles.appTitle}>{application.opportunityTitle}</Text>
      <Text style={styles.appDate}>Applied on {application.appliedOn}</Text>
      {application.notes && (
        <Text style={styles.appNotes}>{application.notes}</Text>
      )}
    </Card>
  );
}

export default function OpportunitiesScreen() {
  const [selectedType, setSelectedType] = useState<OpportunityType | 'all'>('all');
  const [applications, setApplications] = useState<Set<string>>(
    new Set(mockApplications.map(a => a.opportunityId))
  );
  const [showApplications, setShowApplications] = useState(false);
  const [savedOpportunities, setSavedOpportunities] = useState<Set<string>>(new Set());

  const filteredOpportunities = useMemo(() => {
    if (selectedType === 'all') return mockOpportunities;
    return mockOpportunities.filter(opp => opp.type === selectedType);
  }, [selectedType]);

  const handleApply = (opportunityId: string) => {
    setApplications(prev => new Set([...prev, opportunityId]));
  };

  const handleSave = (opportunityId: string) => {
    setSavedOpportunities(prev => {
      const newSet = new Set(prev);
      if (newSet.has(opportunityId)) {
        newSet.delete(opportunityId);
      } else {
        newSet.add(opportunityId);
      }
      return newSet;
    });
  };

  const appliedApplications = mockApplications.filter(app => applications.has(app.opportunityId));

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Opportunity Hub</Text>
        <TouchableOpacity
          style={styles.myApplicationsBtn}
          onPress={() => setShowApplications(!showApplications)}
        >
          <Text style={styles.myApplicationsText}>
            My Applications ({appliedApplications.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* My Applications Panel */}
      {showApplications && appliedApplications.length > 0 && (
        <View style={styles.applicationsPanel}>
          <Text style={styles.sectionTitle}>My Applications</Text>
          {appliedApplications.map(app => (
            <ApplicationCard key={app.id} application={app} />
          ))}
        </View>
      )}

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {OPPORTUNITY_TYPES.map(({ type, label, icon }) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.filterTab,
              selectedType === type && styles.filterTabActive,
            ]}
            onPress={() => setSelectedType(type)}
          >
            <Text style={styles.filterIcon}>{icon}</Text>
            <Text
              style={[
                styles.filterLabel,
                selectedType === type && styles.filterLabelActive,
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Opportunities List */}
      <FlatList
        data={filteredOpportunities}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <OpportunityCard
            opportunity={item}
            isApplied={applications.has(item.id)}
            onApply={() => handleApply(item.id)}
            onSave={() => handleSave(item.id)}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyText}>No opportunities found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  myApplicationsBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primaryLight + '20',
    borderRadius: BorderRadius.full,
  },
  myApplicationsText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
  },
  applicationsPanel: {
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadow.md,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  applicationCard: {
    marginBottom: Spacing.sm,
    backgroundColor: Colors.backgroundDark,
  },
  appHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  appTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  appDate: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  appNotes: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    fontStyle: 'italic',
  },
  filterContainer: {
    maxHeight: 50,
  },
  filterContent: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
    ...Shadow.sm,
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
  },
  filterIcon: {
    fontSize: FontSize.md,
    marginRight: 4,
  },
  filterLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
  },
  filterLabelActive: {
    color: Colors.textInverse,
  },
  listContent: {
    padding: Spacing.md,
    paddingTop: Spacing.sm,
  },
  oppCard: {
    marginBottom: Spacing.md,
  },
  oppHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  typeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  typeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  matchBadge: {
    alignItems: 'center',
  },
  matchScore: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.success,
  },
  matchLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  oppTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  oppCompany: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  oppDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.sm,
    gap: Spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    fontSize: FontSize.sm,
    marginRight: 4,
  },
  detailText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  salaryText: {
    color: Colors.success,
    fontWeight: FontWeight.semibold,
  },
  equityText: {
    color: Colors.warning,
    fontWeight: FontWeight.semibold,
  },
  oppDescription: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    lineHeight: 20,
  },
  oppFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  deadline: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  oppActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  saveBtn: {
    padding: Spacing.sm,
  },
  saveIcon: {
    fontSize: 24,
    color: Colors.error,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
});
