'use client';
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  CheckCircle, Clock, AlertCircle, Shield, Briefcase, GraduationCap,
  Award, Users, FileText, Plus, ChevronRight, Camera, Upload
} from 'lucide-react-native';
import { useAppStore } from '../../store/useAppStore';
import { verificationTypeLabels } from '../../utils/mockData';

export default function VerificationScreen() {
  const { verifications, initializeMockData } = useAppStore();
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'all'>('all');

  useEffect(() => {
    if (verifications.length === 0) {
      initializeMockData();
    }
  }, []);

  const filteredVerifications = verifications.filter(v => {
    if (activeTab === 'all') return true;
    return v.status === activeTab;
  });

  const getVerificationIcon = (type: string) => {
    switch (type) {
      case 'identity':
        return <Shield size={24} color="#6366f1" />;
      case 'employment':
        return <Briefcase size={24} color="#22c55e" />;
      case 'education':
        return <GraduationCap size={24} color="#f59e0b" />;
      case 'skills':
        return <Award size={24} color="#8b5cf6" />;
      case 'reference':
        return <Users size={24} color="#ec4899" />;
      default:
        return <FileText size={24} color="#6366f1" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle size={20} color="#22c55e" />;
      case 'pending':
        return <Clock size={20} color="#f59e0b" />;
      case 'rejected':
        return <AlertCircle size={20} color="#ef4444" />;
      default:
        return <Clock size={20} color="#888" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#22c55e';
      case 'pending': return '#f59e0b';
      case 'rejected': return '#ef4444';
      default: return '#888';
    }
  };

  const startVerification = (type: string) => {
    Alert.alert(
      'Start Verification',
      `Would you like to start ${verificationTypeLabels[type] || type} verification?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start',
          onPress: () => Alert.alert('Coming Soon', 'Verification flow will be available soon.'),
        },
      ]
    );
  };

  const verificationTypes = [
    { type: 'identity', label: 'Identity', icon: Shield, color: '#6366f1', description: 'Aadhaar, PAN, Passport' },
    { type: 'employment', label: 'Employment', icon: Briefcase, color: '#22c55e', description: 'Company verification' },
    { type: 'education', label: 'Education', icon: GraduationCap, color: '#f59e0b', description: 'Degree verification' },
    { type: 'skills', label: 'Skills', icon: Award, color: '#8b5cf6', description: 'Certifications' },
    { type: 'reference', label: 'Reference', icon: Users, color: '#ec4899', description: 'Professional references' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient colors={['#1a1a2e', '#0f0f23']} style={styles.header}>
          <Text style={styles.headerTitle}>Verification</Text>
          <Text style={styles.headerSubtitle}>
            Verify your credentials to increase your CI Score
          </Text>
        </LinearGradient>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(34, 197, 94, 0.2)' }]}>
              <CheckCircle size={20} color="#22c55e" />
            </View>
            <Text style={styles.statValue}>{verifications.filter(v => v.status === 'approved').length}</Text>
            <Text style={styles.statLabel}>Verified</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(245, 158, 11, 0.2)' }]}>
              <Clock size={20} color="#f59e0b" />
            </View>
            <Text style={styles.statValue}>{verifications.filter(v => v.status === 'pending').length}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(99, 102, 241, 0.2)' }]}>
              <Shield size={20} color="#6366f1" />
            </View>
            <Text style={styles.statValue}>5</Text>
            <Text style={styles.statLabel}>Types</Text>
          </View>
        </View>

        {/* Start New Verification */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Start New Verification</Text>
          <View style={styles.verificationTypes}>
            {verificationTypes.map((item) => (
              <TouchableOpacity
                key={item.type}
                style={styles.typeCard}
                onPress={() => startVerification(item.type)}
                activeOpacity={0.8}
              >
                <View style={[styles.typeIcon, { backgroundColor: `${item.color}20` }]}>
                  <item.icon size={24} color={item.color} />
                </View>
                <View style={styles.typeInfo}>
                  <Text style={styles.typeLabel}>{item.label}</Text>
                  <Text style={styles.typeDescription}>{item.description}</Text>
                </View>
                <View style={[styles.startBadge, { backgroundColor: `${item.color}20` }]}>
                  <Plus size={16} color={item.color} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Verification History */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Verification History</Text>
          </View>

          {/* Filter Tabs */}
          <View style={styles.filterTabs}>
            {['all', 'pending', 'approved'].map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.filterTab, activeTab === tab && styles.filterTabActive]}
                onPress={() => setActiveTab(tab as typeof activeTab)}
              >
                <Text style={[styles.filterTabText, activeTab === tab && styles.filterTabTextActive]}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Verification List */}
          {filteredVerifications.length > 0 ? (
            <View style={styles.verificationList}>
              {filteredVerifications.map((verification) => (
                <View key={verification.id} style={styles.verificationCard}>
                  <View style={styles.verificationHeader}>
                    <View style={styles.verificationIcon}>
                      {getVerificationIcon(verification.type)}
                    </View>
                    <View style={styles.verificationInfo}>
                      <Text style={styles.verificationType}>
                        {verificationTypeLabels[verification.type] || verification.type}
                      </Text>
                      <Text style={styles.verificationDate}>
                        Submitted {new Date(verification.submittedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </Text>
                    </View>
                    <View style={styles.statusContainer}>
                      {getStatusIcon(verification.status)}
                      <Text style={[styles.statusText, { color: getStatusColor(verification.status) }]}>
                        {verification.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  {verification.documents.length > 0 && (
                    <View style={styles.documentsContainer}>
                      <Text style={styles.documentsLabel}>Documents:</Text>
                      <View style={styles.documentTags}>
                        {verification.documents.map((doc, idx) => (
                          <View key={idx} style={styles.documentTag}>
                            <Text style={styles.documentTagText}>{doc}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                  {verification.verifiedAt && (
                    <View style={styles.verifiedInfo}>
                      <CheckCircle size={12} color="#22c55e" />
                      <Text style={styles.verifiedInfoText}>
                        Verified by {verification.verifiedBy} on {new Date(verification.verifiedAt).toLocaleDateString()}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <FileText size={48} color="#333" />
              <Text style={styles.emptyText}>No verifications found</Text>
              <Text style={styles.emptySubtext}>
                Start a new verification to see it here
              </Text>
            </View>
          )}
        </View>

        {/* Info Card */}
        <View style={[styles.section, styles.lastSection]}>
          <View style={styles.infoCard}>
            <Shield size={24} color="#6366f1" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Why Verify?</Text>
              <Text style={styles.infoText}>
                Each verification adds up to 100 points to your CI Score. Verified credentials
                build trust with employers and partners.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#888',
    fontSize: 14,
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  verificationTypes: {
    gap: 12,
  },
  typeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 14,
  },
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  typeInfo: {
    flex: 1,
  },
  typeLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  typeDescription: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  startBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  filterTabActive: {
    backgroundColor: '#6366f1',
  },
  filterTabText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  filterTabTextActive: {
    color: '#fff',
  },
  verificationList: {
    gap: 12,
  },
  verificationCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 14,
  },
  verificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verificationIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  verificationInfo: {
    flex: 1,
  },
  verificationType: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  verificationDate: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  documentsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2d2d4a',
  },
  documentsLabel: {
    color: '#888',
    fontSize: 12,
    marginBottom: 8,
  },
  documentTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  documentTag: {
    backgroundColor: '#333',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  documentTagText: {
    color: '#ccc',
    fontSize: 11,
  },
  verifiedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2d2d4a',
  },
  verifiedInfoText: {
    color: '#22c55e',
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    color: '#555',
    fontSize: 14,
    marginTop: 4,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'flex-start',
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoText: {
    color: '#888',
    fontSize: 13,
    lineHeight: 18,
  },
  lastSection: {
    paddingBottom: 32,
  },
});
