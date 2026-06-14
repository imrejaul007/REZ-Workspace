// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import { studentService, StudentVerification, Institution } from '../../services/student/studentService';

interface Props {
  userId: string;
  onVerified?: () => void;
}

export const StudentVerifyScreen: React.FC<Props> = ({ userId, onVerified }) => {
  const [step, setStep] = useState<'search' | 'document' | 'submitting' | 'success'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(null);
  const [studentId, setStudentId] = useState('');
  const [documentType, setDocumentType] = useState('id_card');
  const [documentUri, setDocumentUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verification, setVerification] = useState<StudentVerification | null>(null);

  useEffect(() => {
    checkVerificationStatus();
  }, []);

  const checkVerificationStatus = async () => {
    try {
      const status = await studentService.getVerificationStatus(userId);
      if (status) {
        setVerification(status);
        if (status.status === 'verified') {
          setStep('success');
        }
      }
    } catch (error) {
      logger.error('Failed to check verification status', error);
    }
  };

  const searchInstitutions = async (query: string) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      try {
        const results = await studentService.searchInstitutions(query);
        setInstitutions(results);
      } catch (error) {
        logger.error('Failed to search institutions', error);
      }
    }
  };

  const selectInstitution = (institution: Institution) => {
    setSelectedInstitution(institution);
    setStep('document');
  };

  const submitVerification = async () => {
    if (!documentUri || !studentId) {
      Alert.alert('Error', 'Please fill all fields and upload document');
      return;
    }

    setStep('submitting');
    setLoading(true);

    try {
      // Convert URI to File
      const response = await fetch(documentUri);
      const blob = await response.blob();
      const file = new File([blob], 'document.jpg', { type: 'image/jpeg' });

      const result = await studentService.verifyStudent({
        userId,
        institutionId: selectedInstitution.id,
        studentIdNumber: studentId,
        documentType,
        document: file,
        // email field is optional - the service will use user's registered email if not provided
      });

      if (result.status === 'verified') {
        setStep('success');
        onVerified?.();
      } else {
        Alert.alert('Submitted', 'Your verification is being reviewed. You will be notified once approved.');
        setStep('search');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Verification failed';
      Alert.alert('Error', message);
      setStep('document');
    } finally {
      setLoading(false);
    }
  };

  if (verification?.status === 'verified') {
    return (
      <View style={styles.container}>
        <View style={styles.successCard}>
          <Text style={styles.successIcon}>✓</Text>
          <Text style={styles.successTitle}>Verified Student</Text>
          <Text style={styles.successText}>
            {verification.institutionName}
          </Text>
          <Text style={styles.tierBadge}>{verification.tier}</Text>
        </View>
      </View>
    );
  }

  if (step === 'search') {
    return (
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Verify as Student</Text>
        <Text style={styles.subtitle}>
          Get exclusive student discounts and offers
        </Text>

        <TextInput
          style={styles.searchInput}
          placeholder="Search your college or university..."
          value={searchQuery}
          onChangeText={searchInstitutions}
        />

        <View style={styles.institutionList}>
          {institutions.map((inst) => (
            <TouchableOpacity
              key={inst.id}
              style={styles.institutionCard}
              onPress={() => selectInstitution(inst)}
            >
              <View style={styles.institutionIcon}>
                <Text style={styles.institutionIconText}>
                  {inst.shortName?.charAt(0) || 'U'}
                </Text>
              </View>
              <View style={styles.institutionInfo}>
                <Text style={styles.institutionName}>{inst.name}</Text>
                <Text style={styles.institutionMeta}>
                  {inst.type} • {inst.city}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    );
  }

  if (step === 'document') {
    return (
      <ScrollView style={styles.container}>
        <TouchableOpacity
          onPress={() => setStep('search')}
          accessibilityRole="button"
          accessibilityLabel="Go back to search"
          accessibilityHint="Returns to institution search screen"
          style={styles.backButton}
        >
          <Text style={styles.backLink}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{selectedInstitution?.name}</Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Student ID Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your student ID"
            value={studentId}
            onChangeText={setStudentId}
            autoCapitalize="characters"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Document Type</Text>
          <View style={styles.documentTypes} accessibilityRole="radiogroup" accessibilityLabel="Select document type">
            {['id_card', 'admit_card', 'bonafide'].map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.documentType,
                  documentType === type && styles.documentTypeActive,
                ]}
                onPress={() => setDocumentType(type)}
                accessibilityRole="radio"
                accessibilityState={{ selected: documentType === type }}
                accessibilityLabel={type === 'id_card' ? 'ID Card' : type === 'admit_card' ? 'Admit Card' : 'Bonafide Certificate'}
                accessibilityHint="Select this document type"
              >
                <Text
                  style={[
                    styles.documentTypeText,
                    documentType === type && styles.documentTypeTextActive,
                  ]}
                >
                  {type === 'id_card' ? 'ID Card' : type === 'admit_card' ? 'Admit Card' : 'Bonafide'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Upload Document</Text>
          <TouchableOpacity
            style={styles.uploadButton}
            accessibilityRole="button"
            accessibilityLabel="Upload document"
            accessibilityHint="Tap to capture or upload a document photo"
          >
            <Text style={styles.uploadIcon}>📷</Text>
            <Text style={styles.uploadText}>Tap to capture or upload</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={submitVerification}
          disabled={!studentId || !documentUri}
          accessibilityRole="button"
          accessibilityLabel="Submit for verification"
          accessibilityHint="Submits your student verification request"
          accessibilityState={{ disabled: !studentId || !documentUri }}
        >
          <Text style={styles.submitButtonText}>Submit for Verification</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  if (step === 'submitting') {
    return (
      <View style={styles.container}>
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Submitting verification...</Text>
        </View>
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
  },
  backLink: {
    color: '#6366F1',
    marginBottom: 16,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 48,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  institutionList: {
    marginTop: 16,
  },
  institutionCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  institutionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  institutionIconText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  institutionInfo: {
    flex: 1,
  },
  institutionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  institutionMeta: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  documentTypes: {
    flexDirection: 'row',
    gap: 8,
  },
  documentType: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    minHeight: 48, // Touch target minimum
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  documentTypeActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  documentTypeText: {
    fontSize: 13,
    color: '#374151', // Fixed: Was #6B7280 (contrast improvement)
    fontWeight: '500',
  },
  documentTypeTextActive: {
    color: '#FFFFFF',
  },
  uploadButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 32,
    minHeight: 100, // Fixed: Ensure adequate touch target
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#9CA3AF', // Fixed: Was #D1D5DB (better contrast)
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  uploadText: {
    color: '#6B7280',
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    minHeight: 52, // Fixed: Minimum touch target 48px
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingCard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  successCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginTop: 40,
  },
  successIcon: {
    fontSize: 64,
    color: '#10B981',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  successText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 16,
  },
  tierBadge: {
    backgroundColor: '#EEF2FF',
    color: '#6366F1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    fontSize: 14,
    fontWeight: '600',
  },
});
