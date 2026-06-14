'use client';

import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import ReviewsPage from './reviews';
import GoalsPage from './goals';
import LMSPage from './lms';
import CertificatesPage from './certificates';

type Tab = 'overview' | 'reviews' | 'goals' | 'lms' | 'certificates';

export default function CareerPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const tabs = [
    { key: 'overview' as const, label: 'Overview', icon: '📊' },
    { key: 'reviews' as const, label: 'Reviews', icon: '📋' },
    { key: 'goals' as const, label: 'Goals', icon: '🎯' },
    { key: 'lms' as const, label: 'Courses', icon: '📚' },
    { key: 'certificates' as const, label: 'Certificates', icon: '🏆' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Career</Text>
        <Text style={styles.subtitle}>Track your performance, goals, and growth</Text>
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

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'overview' && (
          <OverviewContent onNavigate={setActiveTab} />
        )}
        {activeTab === 'reviews' && <ReviewsPage />}
        {activeTab === 'goals' && <GoalsPage />}
        {activeTab === 'lms' && <LMSPage />}
        {activeTab === 'certificates' && <CertificatesPage />}
      </View>
    </View>
  );
}

function OverviewContent({ onNavigate }: { onNavigate: (tab: Tab) => void }) {
  const careerProgress = {
    level: 3,
    nextLevel: 4,
    progress: 65,
    skills: [
      { name: 'Leadership', progress: 80 },
      { name: 'Technical', progress: 90 },
      { name: 'Communication', progress: 70 },
    ],
  };

  const recentActivity = [
    { type: 'review', text: 'Q1 2026 Review completed', date: 'Mar 25, 2026' },
    { type: 'goal', text: 'Completed AWS Certification', date: 'Mar 20, 2026' },
    { type: 'feedback', text: 'Received peer feedback from Rahul', date: 'Mar 18, 2026' },
  ];

  return (
    <View style={styles.overview}>
      {/* Career Progress Card */}
      <View style={styles.progressCard}>
        <View style={styles.levelHeader}>
          <View>
            <Text style={styles.levelLabel}>Current Level</Text>
            <Text style={styles.levelValue}>Level {careerProgress.level}</Text>
          </View>
          <View style={styles.nextLevel}>
            <Text style={styles.nextLabel}>Next</Text>
            <Text style={styles.nextValue}>Level {careerProgress.nextLevel}</Text>
          </View>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${careerProgress.progress}%` }]} />
        </View>
        <Text style={styles.progressText}>{careerProgress.progress}% to next level</Text>
      </View>

      {/* Skills Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Core Competencies</Text>
        {careerProgress.skills.map((skill, i) => (
          <View key={i} style={styles.skillRow}>
            <Text style={styles.skillName}>{skill.name}</Text>
            <View style={styles.skillBar}>
              <View style={[styles.skillFill, { width: `${skill.progress}%` }]} />
            </View>
            <Text style={styles.skillValue}>{skill.progress}%</Text>
          </View>
        ))}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onNavigate('reviews')}
          >
            <Text style={styles.actionIcon}>📋</Text>
            <Text style={styles.actionText}>View Reviews</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onNavigate('goals')}
          >
            <Text style={styles.actionIcon}>🎯</Text>
            <Text style={styles.actionText}>My Goals</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {recentActivity.map((item, i) => (
          <View key={i} style={styles.activityRow}>
            <View style={styles.activityDot} />
            <View style={styles.activityContent}>
              <Text style={styles.activityText}>{item.text}</Text>
              <Text style={styles.activityDate}>{item.date}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 20,
    backgroundColor: '#8b5cf6',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
  },
  subtitle: {
    fontSize: 14,
    color: '#ddd6fe',
    marginTop: 4,
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
    fontSize: 20,
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
  content: {
    flex: 1,
  },
  overview: {
    padding: 16,
  },
  progressCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  levelLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  levelValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#8b5cf6',
  },
  nextLevel: {
    alignItems: 'flex-end',
  },
  nextLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  nextValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8b5cf6',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'right',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    color: '#111827',
  },
  skillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  skillName: {
    width: 100,
    fontSize: 14,
    color: '#374151',
  },
  skillBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginHorizontal: 12,
  },
  skillFill: {
    height: '100%',
    backgroundColor: '#8b5cf6',
    borderRadius: 4,
  },
  skillValue: {
    width: 40,
    fontSize: 12,
    color: '#8b5cf6',
    fontWeight: '600',
    textAlign: 'right',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#f3e8ff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8b5cf6',
  },
  activityRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8b5cf6',
    marginTop: 6,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: '#374151',
  },
  activityDate: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
});
