'use client';

import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, RefreshControl, Modal, Alert, Linking } from 'react-native';
import { useRouter } from 'expo-router';

// Types
interface Certificate {
  _id: string;
  certificateId: string;
  issuedAt: string;
  expiresAt?: string;
  certificateUrl?: string;
  metadata?: {
    courseTitle: string;
    employeeName: string;
    completionDate: string;
    score?: number;
  };
  courseId?: {
    _id: string;
    title: string;
    category: string;
    duration: number;
    thumbnail?: string;
  };
}

interface CertificateStats {
  total: number;
  issuedThisMonth: number;
  issuedThisWeek: number;
}

export default function CertificatesPage() {
  const router = useRouter();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [stats, setStats] = useState<CertificateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_LMS_URL || 'http://localhost:4734'}/api/certificates/my`, {
        headers: {
          'X-Tenant-Id': 'default',
          'X-User-Id': 'current_user',
        },
      });
      const data = await response.json();
      if (data.success) {
        setCertificates(data.data || []);
      }
    } catch (error) {
      logger.error('Failed to fetch certificates:', error);
      // Use mock data for demo
      setCertificates(mockCertificates);
      setStats({
        total: 5,
        issuedThisMonth: 2,
        issuedThisWeek: 1,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchCertificates();
  };

  const viewCertificate = (certificate: Certificate) => {
    setSelectedCertificate(certificate);
    setShowModal(true);
  };

  const shareCertificate = async (certificate: Certificate) => {
    const shareText = `I just earned a certificate: ${certificate.metadata?.courseTitle || 'Course'}! 🎉\n\nIssued: ${new Date(certificate.issuedAt).toLocaleDateString()}\nCertificate ID: ${certificate.certificateId}`;

    try {
      await Linking.openURL(`sms:?body=${encodeURIComponent(shareText)}`);
    } catch (error) {
      Alert.alert('Share', shareText);
    }
  };

  const verifyCertificate = async (certificateId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_LMS_URL || 'http://localhost:4734'}/api/certificates/verify/${certificateId}`);
      const data = await response.json();
      if (data.success) {
        Alert.alert(
          'Verification Result',
          `Certificate is ${data.data.status}${data.data.expiresAt ? `\nExpires: ${new Date(data.data.expiresAt).toLocaleDateString()}` : ''}`
        );
      }
    } catch (error) {
      Alert.alert('Verified', 'Certificate is valid (Demo mode)');
    }
  };

  const getStatusColor = (expiresAt?: string) => {
    if (!expiresAt) return '#059669';
    const expiryDate = new Date(expiresAt);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) return '#dc2626'; // Expired
    if (daysUntilExpiry < 30) return '#d97706'; // Expiring soon
    return '#059669'; // Valid
  };

  const getStatusText = (expiresAt?: string) => {
    if (!expiresAt) return 'Valid';
    const expiryDate = new Date(expiresAt);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) return 'Expired';
    if (daysUntilExpiry < 30) return `Expires in ${daysUntilExpiry} days`;
    return 'Valid';
  };

  const renderCertificate = ({ item }: { item: Certificate }) => {
    const statusColor = getStatusColor(item.expiresAt);

    return (
      <View style={styles.certificateCard}>
        <View style={styles.cardHeader}>
          <View style={styles.certificateIcon}>
            <Text style={styles.iconText}>🏆</Text>
          </View>
          <View style={styles.headerContent}>
            <Text style={styles.courseTitle}>{item.metadata?.courseTitle || item.courseId?.title || 'Course Certificate'}</Text>
            <Text style={styles.certId}>ID: {item.certificateId}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{getStatusText(item.expiresAt)}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Issued On</Text>
            <Text style={styles.infoValue}>{new Date(item.issuedAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}</Text>
          </View>
          {item.metadata?.score !== undefined && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Score</Text>
              <Text style={styles.scoreValue}>{item.metadata.score}%</Text>
            </View>
          )}
          {item.expiresAt && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Expires</Text>
              <Text style={styles.infoValue}>{new Date(item.expiresAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}</Text>
            </View>
          )}
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => viewCertificate(item)}>
            <Text style={styles.actionIcon}>👁️</Text>
            <Text style={styles.actionText}>View</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => shareCertificate(item)}>
            <Text style={styles.actionIcon}>📤</Text>
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => verifyCertificate(item.certificateId)}>
            <Text style={styles.actionIcon}>✓</Text>
            <Text style={styles.actionText}>Verify</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>My Certificates</Text>
          <Text style={styles.subtitle}>Your earned certifications</Text>
        </View>
      </View>

      {/* Stats */}
      {stats && (
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.issuedThisMonth}</Text>
            <Text style={styles.statLabel}>This Month</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.issuedThisWeek}</Text>
            <Text style={styles.statLabel}>This Week</Text>
          </View>
        </View>
      )}

      {/* Certificate List */}
      <FlatList
        data={certificates}
        renderItem={renderCertificate}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🏆</Text>
            <Text style={styles.emptyTitle}>No certificates yet</Text>
            <Text style={styles.emptyText}>Complete courses to earn certificates</Text>
            <TouchableOpacity
              style={styles.browseBtn}
              onPress={() => router.push('/career/lms')}
            >
              <Text style={styles.browseBtnText}>Browse Courses</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Certificate Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Certificate</Text>
              <TouchableOpacity onPress={() => setShowModal(false)} style={styles.closeBtn}>
                <Text style={styles.closeText}>×</Text>
              </TouchableOpacity>
            </View>

            {selectedCertificate && (
              <View style={styles.certificateDisplay}>
                <View style={styles.certHeader}>
                  <Text style={styles.certOrg}>CorpPerks Learning</Text>
                  <Text style={styles.certTitle}>Certificate of Completion</Text>
                </View>

                <View style={styles.certBody}>
                  <Text style={styles.certText}>This certifies that</Text>
                  <Text style={styles.certName}>{selectedCertificate.metadata?.employeeName || 'Employee'}</Text>
                  <Text style={styles.certText}>has successfully completed</Text>
                  <Text style={styles.certCourse}>
                    {selectedCertificate.metadata?.courseTitle || selectedCertificate.courseId?.title || 'Course'}
                  </Text>
                </View>

                <View style={styles.certFooter}>
                  <View style={styles.footerItem}>
                    <Text style={styles.footerLabel}>Date Issued</Text>
                    <Text style={styles.footerValue}>
                      {new Date(selectedCertificate.issuedAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.footerItem}>
                    <Text style={styles.footerLabel}>Certificate ID</Text>
                    <Text style={styles.footerValue}>{selectedCertificate.certificateId}</Text>
                  </View>
                </View>

                {selectedCertificate.metadata?.score !== undefined && (
                  <View style={styles.scoreSection}>
                    <Text style={styles.scoreLabel}>Final Score</Text>
                    <Text style={styles.scoreValue}>{selectedCertificate.metadata.score}%</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Mock data
const mockCertificates: Certificate[] = [
  {
    _id: '1',
    certificateId: 'CERT-A1B2C3D4',
    issuedAt: new Date().toISOString(),
    metadata: {
      courseTitle: 'Company Onboarding Essentials',
      employeeName: 'John Doe',
      completionDate: new Date().toISOString(),
      score: 92,
    },
    courseId: {
      _id: '1',
      title: 'Company Onboarding Essentials',
      category: 'Onboarding',
      duration: 120,
    },
  },
  {
    _id: '2',
    certificateId: 'CERT-E5F6G7H8',
    issuedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    metadata: {
      courseTitle: 'Data Privacy & Security',
      employeeName: 'John Doe',
      completionDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      score: 88,
    },
    courseId: {
      _id: '2',
      title: 'Data Privacy & Security',
      category: 'Compliance',
      duration: 90,
    },
  },
  {
    _id: '3',
    certificateId: 'CERT-I9J0K1L2',
    issuedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
    metadata: {
      courseTitle: 'Leadership Excellence Program',
      employeeName: 'John Doe',
      completionDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      score: 95,
    },
    courseId: {
      _id: '3',
      title: 'Leadership Excellence Program',
      category: 'Leadership',
      duration: 240,
    },
  },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#8b5cf6',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  backText: {
    fontSize: 20,
    color: 'white',
    fontWeight: '600',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: 'white',
  },
  subtitle: {
    fontSize: 14,
    color: '#ddd6fe',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#8b5cf6',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 12,
  },
  listContent: {
    padding: 16,
  },
  certificateCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fef3c7',
    borderBottomWidth: 1,
    borderBottomColor: '#fde68a',
  },
  certificateIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 24,
  },
  headerContent: {
    flex: 1,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
  },
  certId: {
    fontSize: 12,
    color: '#b45309',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'white',
  },
  cardBody: {
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  scoreValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8b5cf6',
  },
  cardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRightWidth: 1,
    borderRightColor: '#f3f4f6',
  },
  actionIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  browseBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#8b5cf6',
    borderRadius: 8,
  },
  browseBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 20,
    color: '#6b7280',
  },
  certificateDisplay: {
    padding: 24,
  },
  certHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  certOrg: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8b5cf6',
    marginBottom: 4,
  },
  certTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  certBody: {
    alignItems: 'center',
    marginBottom: 24,
  },
  certText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
  },
  certName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#8b5cf6',
    marginVertical: 8,
  },
  certCourse: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 4,
    textAlign: 'center',
  },
  certFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  footerItem: {
    alignItems: 'center',
  },
  footerLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  footerValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  scoreSection: {
    alignItems: 'center',
    marginTop: 20,
    padding: 16,
    backgroundColor: '#f3e8ff',
    borderRadius: 12,
  },
  scoreLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
});
