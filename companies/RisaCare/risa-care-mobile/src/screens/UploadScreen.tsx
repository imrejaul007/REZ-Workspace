// RisaCare Mobile - Upload Screen

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { recordsApi } from '../../api';

const documentTypes = [
  { id: 'blood_report', label: 'Blood Report', icon: '🩸' },
  { id: 'urine_report', label: 'Urine Report', icon: '🧪' },
  { id: 'xray', label: 'X-Ray', icon: '📷' },
  { id: 'ct_scan', label: 'CT Scan', icon: '🧠' },
  { id: 'mri', label: 'MRI', icon: '🔬' },
  { id: 'prescription', label: 'Prescription', icon: '💊' },
  { id: 'discharge_summary', label: 'Discharge Summary', icon: '📋' },
  { id: 'other', label: 'Other', icon: '📄' }
];

export default function UploadScreen({ navigation }: any) {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [step, setStep] = useState(1);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permission');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera permission');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleUpload = async () => {
    if (!selectedType || !title || !image) {
      Alert.alert('Missing info', 'Please fill all required fields');
      return;
    }

    setUploading(true);
    try {
      // Create form data
      const formData = new FormData();
      formData.append('type', selectedType);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('profileId', 'default_profile');

      // Get filename from URI
      const filename = image.split('/').pop() || 'document.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('file', {
        uri: image,
        name: filename,
        type
      } as any);

      await recordsApi.upload(formData);

      Alert.alert('Success', 'Report uploaded successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to upload report');
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Upload Report</Text>
          <Text style={styles.subtitle}>Step {step} of 2</Text>
        </View>

        {/* Progress */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: step === 1 ? '50%' : '100%' }]} />
        </View>

        {step === 1 ? (
          <>
            {/* Document Type */}
            <Text style={styles.sectionTitle}>What type of report?</Text>
            <View style={styles.typeGrid}>
              {documentTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.typeCard,
                    selectedType === type.id && styles.typeCardSelected
                  ]}
                  onPress={() => setSelectedType(type.id)}
                >
                  <Text style={styles.typeIcon}>{type.icon}</Text>
                  <Text style={[
                    styles.typeLabel,
                    selectedType === type.id && styles.typeLabelSelected
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Details */}
            <Text style={styles.sectionTitle}>Report Details</Text>
            <TextInput
              style={styles.input}
              placeholder="Report Title (e.g., CBC - March 2026)"
              value={title}
              onChangeText={setTitle}
              placeholderTextColor="#999"
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description (optional)"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              placeholderTextColor="#999"
            />

            <TouchableOpacity
              style={styles.nextButton}
              onPress={() => step < 2 && setStep(2)}
              disabled={!selectedType || !title}
            >
              <Text style={styles.nextButtonText}>Next</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* Image Selection */}
            <Text style={styles.sectionTitle}>Upload Document</Text>

            {image ? (
              <View style={styles.imagePreview}>
                <Text style={styles.imageSelected}>📄 Document Selected</Text>
                <TouchableOpacity onPress={() => setImage(null)}>
                  <Text style={styles.changeImage}>Change</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.imageButtons}>
                <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
                  <Text style={styles.imageButtonIcon}>🖼️</Text>
                  <Text style={styles.imageButtonText}>Choose from Gallery</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.imageButton} onPress={takePhoto}>
                  <Text style={styles.imageButtonIcon}>📷</Text>
                  <Text style={styles.imageButtonText}>Take Photo</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Summary */}
            <View style={styles.summary}>
              <Text style={styles.summaryTitle}>Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Type:</Text>
                <Text style={styles.summaryValue}>
                  {documentTypes.find(t => t.id === selectedType)?.label}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Title:</Text>
                <Text style={styles.summaryValue}>{title}</Text>
              </View>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setStep(1)}
              >
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.uploadButton, (!image || uploading) && styles.uploadButtonDisabled]}
                onPress={handleUpload}
                disabled={!image || uploading}
              >
                {uploading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.uploadButtonText}>Upload Report</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { padding: 20 },
  header: { marginBottom: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333' },
  subtitle: { fontSize: 14, color: '#666', marginTop: 4 },
  progressContainer: { height: 4, backgroundColor: '#E0E0E0', borderRadius: 2, marginBottom: 24 },
  progressBar: { height: '100%', backgroundColor: '#007AFF', borderRadius: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 12 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 24 },
  typeCard: { width: '48%', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, marginRight: '4%', alignItems: 'center', borderWidth: 2, borderColor: '#E0E0E0' },
  typeCardSelected: { borderColor: '#007AFF', backgroundColor: '#007AFF10' },
  typeIcon: { fontSize: 32, marginBottom: 8 },
  typeLabel: { fontSize: 13, color: '#666', textAlign: 'center' },
  typeLabelSelected: { color: '#007AFF', fontWeight: '600' },
  input: { backgroundColor: '#fff', borderRadius: 12, padding: 16, fontSize: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E0E0E0' },
  textArea: { height: 100, textAlignVertical: 'top' },
  nextButton: { backgroundColor: '#007AFF', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 12 },
  nextButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  imageButtons: { marginBottom: 24 },
  imageButton: { backgroundColor: '#fff', borderRadius: 12, padding: 24, marginBottom: 12, alignItems: 'center', borderWidth: 2, borderColor: '#E0E0E0', borderStyle: 'dashed' },
  imageButtonIcon: { fontSize: 40, marginBottom: 8 },
  imageButtonText: { fontSize: 14, color: '#666' },
  imagePreview: { backgroundColor: '#34C75920', borderRadius: 12, padding: 20, marginBottom: 24, alignItems: 'center' },
  imageSelected: { fontSize: 16, color: '#34C759', fontWeight: '600', marginBottom: 8 },
  changeImage: { color: '#007AFF', fontSize: 14 },
  summary: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 24 },
  summaryTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { fontSize: 14, color: '#666' },
  summaryValue: { fontSize: 14, color: '#333', fontWeight: '500' },
  buttonRow: { flexDirection: 'row' },
  backButton: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center', marginRight: 8, borderWidth: 1, borderColor: '#E0E0E0' },
  backButtonText: { color: '#666', fontSize: 16, fontWeight: '600' },
  uploadButton: { flex: 2, backgroundColor: '#007AFF', borderRadius: 12, padding: 16, alignItems: 'center', marginLeft: 8 },
  uploadButtonDisabled: { backgroundColor: '#ccc' },
  uploadButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' }
});
