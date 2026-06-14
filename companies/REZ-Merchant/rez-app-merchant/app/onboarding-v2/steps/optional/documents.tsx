/**
 * Documents Step (Optional)
 * Upload required documents for verification
 */

import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useOnboardingStore } from '@/stores/onboarding-v2';
import StepCard from '../../components/StepCard';
import SkipButton from '../../components/SkipButton';
import { Colors } from '@/constants/Colors';

interface DocumentItem {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  required: boolean;
  uploaded: boolean;
}

const documentTypes: DocumentItem[] = [
  {
    id: 'gstin',
    title: 'GSTIN Certificate',
    description: '15-digit GST registration certificate',
    icon: 'document-text-outline',
    required: false, // Only if GST registered
    uploaded: false,
  },
  {
    id: 'pan',
    title: 'PAN Card',
    description: 'Business or individual PAN card',
    icon: 'card-outline',
    required: true,
    uploaded: false,
  },
  {
    id: 'address_proof',
    title: 'Address Proof',
    description: 'Electricity bill, rent agreement, or registry',
    icon: 'location-outline',
    required: true,
    uploaded: false,
  },
  {
    id: 'id_proof',
    title: 'ID Proof',
    description: 'Aadhaar, Passport, or Voter ID',
    icon: 'person-outline',
    required: true,
    uploaded: false,
  },
  {
    id: 'canceled_cheque',
    title: 'Cancelled Cheque',
    description: 'Or bank statement with account details',
    icon: 'card-outline',
    required: false, // Can skip if bank details added
    uploaded: false,
  },
];

export default function DocumentsStep() {
  const router = useRouter();
  const { skipDocuments, businessInfo } = useOnboardingStore();

  // Check if GST registered (would come from business info)
  const isGstRegistered = false; // Mock - check businessInfo.gstRegistered

  // Document states
  const [documents, setDocuments] = useState<Record<string, boolean>>({});

  // Track upload
  const handleUpload = (docId: string) => {
    // In real app, would open image picker
    // For demo, just toggle state
    setDocuments((prev) => ({
      ...prev,
      [docId]: !prev[docId],
    }));
  };

  // Count uploaded documents
  const uploadedCount = Object.values(documents).filter(Boolean).length;
  const requiredDocs = documentTypes.filter((d) => d.required);
  const requiredUploaded = requiredDocs.filter((d) => documents[d.id]).length;
  const allRequiredUploaded = requiredUploaded === requiredDocs.length;

  // Handle save
  const handleSave = async () => {
    // Upload documents to API
    // await onboardingV2Service.uploadDocuments(documents);

    router.back();
  };

  // Handle skip
  const handleSkip = () => {
    skipDocuments();
    router.back();
  };

  // Handle back
  const handleBack = () => {
    router.back();
  };

  return (
    <StepCard
      title="Upload Documents"
      subtitle="Required for verification and payment processing"
      onContinue={handleSave}
      continueLabel={`Save ${uploadedCount} Document${uploadedCount !== 1 ? 's' : ''}`}
      disabled={!allRequiredUploaded}
      footer={
        <SkipButton
          onSkip={handleSkip}
          label="Skip for now"
          reason="Verification can take longer"
        />
      }
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Progress */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${(requiredUploaded / requiredDocs.length) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {requiredUploaded} of {requiredDocs.length} required documents
          </Text>
        </View>

        {/* Document List */}
        <View style={styles.documentList}>
          {documentTypes.map((doc) => {
            const isUploaded = documents[doc.id];
            const isRequired = doc.required;

            // Skip GST if not registered
            if (doc.id === 'gstin' && !isGstRegistered) return null;

            return (
              <TouchableOpacity
                key={doc.id}
                style={[styles.documentCard, isUploaded && styles.documentCardUploaded]}
                onPress={() => handleUpload(doc.id)}
              >
                <View style={[styles.documentIcon, isUploaded && styles.documentIconUploaded]}>
                  <Ionicons
                    name={isUploaded ? 'checkmark-circle' : doc.icon}
                    size={24}
                    color={isUploaded ? Colors.light.success : Colors.light.primary}
                  />
                </View>

                <View style={styles.documentContent}>
                  <View style={styles.documentHeader}>
                    <Text style={styles.documentTitle}>{doc.title}</Text>
                    {isRequired && (
                      <View style={styles.requiredBadge}>
                        <Text style={styles.requiredText}>Required</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.documentDescription}>{doc.description}</Text>
                </View>

                <View style={styles.uploadAction}>
                  {isUploaded ? (
                    <View style={styles.uploadedIndicator}>
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                    </View>
                  ) : (
                    <Ionicons name="cloud-upload-outline" size={24} color={Colors.light.primary} />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>Tips for faster verification</Text>
          <View style={styles.tip}>
            <Ionicons name="checkmark-circle" size={18} color={Colors.light.success} />
            <Text style={styles.tipText}>Ensure documents are clear and readable</Text>
          </View>
          <View style={styles.tip}>
            <Ionicons name="checkmark-circle" size={18} color={Colors.light.success} />
            <Text style={styles.tipText}>Include all pages of multi-page documents</Text>
          </View>
          <View style={styles.tip}>
            <Ionicons name="checkmark-circle" size={18} color={Colors.light.success} />
            <Text style={styles.tipText}>Documents should not be expired</Text>
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoBox}>
          <Ionicons name="time-outline" size={18} color={Colors.light.textSecondary} />
          <Text style={styles.infoText}>
            Verification typically takes 1-2 business days. You'll be notified once approved.
          </Text>
        </View>
      </ScrollView>
    </StepCard>
  );
}

const styles = StyleSheet.create({
  progressContainer: {
    marginBottom: 20,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.light.borderLight,
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.light.success,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  documentList: {
    gap: 12,
    marginBottom: 24,
  },
  documentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.light.background,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.light.borderLight,
    gap: 14,
  },
  documentCardUploaded: {
    borderColor: Colors.light.success,
    backgroundColor: `${Colors.light.success}08`,
  },
  documentIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: `${Colors.light.primary}12`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  documentIconUploaded: {
    backgroundColor: `${Colors.light.success}15`,
  },
  documentContent: {
    flex: 1,
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  documentTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
  },
  requiredBadge: {
    backgroundColor: Colors.light.error,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  requiredText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  documentDescription: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  uploadAction: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadedIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.light.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipsSection: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  tipText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 10,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
});
