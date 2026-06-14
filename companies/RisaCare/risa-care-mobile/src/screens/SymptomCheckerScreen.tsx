// RisaCare Mobile - Symptom Checker Screen

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Symptom {
  id: string;
  name: string;
  category: string;
  selected: boolean;
  severity?: 'mild' | 'moderate' | 'severe';
  duration?: string;
}

interface AssessmentResult {
  urgency: 'self_care' | 'consult_doctor' | 'urgent_care' | 'emergency';
  urgencyColor: string;
  urgencyLabel: string;
  reasoning: string;
  recommendations: string[];
  specialty?: string;
}

const commonSymptoms: Symptom[] = [
  { id: '1', name: 'Headache', category: 'Pain', selected: false },
  { id: '2', name: 'Fever', category: 'General', selected: false },
  { id: '3', name: 'Cough', category: 'Respiratory', selected: false },
  { id: '4', name: 'Fatigue', category: 'General', selected: false },
  { id: '5', name: 'Nausea', category: 'Digestive', selected: false },
  { id: '6', name: 'Chest Pain', category: 'Critical', selected: false },
  { id: '7', name: 'Shortness of Breath', category: 'Critical', selected: false },
  { id: '8', name: 'Dizziness', category: 'Neurological', selected: false },
  { id: '9', name: 'Stomach Pain', category: 'Digestive', selected: false },
  { id: '10', name: 'Back Pain', category: 'Pain', selected: false },
  { id: '11', name: 'Sore Throat', category: 'Respiratory', selected: false },
  { id: '12', name: 'Body Ache', category: 'Pain', selected: false },
  { id: '13', name: 'Runny Nose', category: 'Respiratory', selected: false },
  { id: '14', name: 'Joint Pain', category: 'Pain', selected: false },
  { id: '15', name: 'Anxiety', category: 'Mental', selected: false },
  { id: '16', name: 'Insomnia', category: 'Mental', selected: false },
  { id: '17', name: 'Bloating', category: 'Digestive', selected: false },
  { id: '18', name: 'Skin Rash', category: 'Skin', selected: false },
];

const bodyAreas = ['Head', 'Chest', 'Abdomen', 'Back', 'Arms', 'Legs', 'Full Body'];

export default function SymptomCheckerScreen() {
  const [symptoms, setSymptoms] = useState<Symptom[]>(commonSymptoms);
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [duration, setDuration] = useState('');

  const toggleSymptom = (id: string) => {
    setSymptoms(symptoms.map(s => s.id === id ? { ...s, selected: !s.selected } : s));
  };

  const getSelectedSymptoms = () => symptoms.filter(s => s.selected);

  const analyzeSymptoms = () => {
    const selected = getSelectedSymptoms();

    if (selected.length === 0) {
      Alert.alert('No Symptoms Selected', 'Please select at least one symptom to analyze');
      return;
    }

    // Check for emergency symptoms
    const criticalSymptoms = selected.filter(s => s.category === 'Critical');
    if (criticalSymptoms.length > 0) {
      setResult({
        urgency: 'emergency',
        urgencyColor: '#F44336',
        urgencyLabel: 'Seek Immediate Medical Attention',
        reasoning: 'You have selected symptoms that may indicate a serious condition requiring immediate medical attention.',
        recommendations: [
          'Call emergency services (108) or go to nearest hospital immediately',
          'Do not delay seeking care',
          'If possible, have someone drive you or call for help',
        ],
      });
      setShowResults(true);
      return;
    }

    // Check for urgent symptoms
    const hasFeverAndChestPain = selected.some(s => s.name === 'Fever') && selected.some(s => s.name === 'Body Ache');
    const hasShortnessOfBreath = selected.some(s => s.name === 'Shortness of Breath');
    const hasSeverePain = selected.some(s => s.name === 'Chest Pain' || s.name === 'Stomach Pain');

    if (hasFeverAndChestPain || hasShortnessOfBreath || hasSeverePain) {
      setResult({
        urgency: 'urgent_care',
        urgencyColor: '#FF9800',
        urgencyLabel: 'Visit Urgent Care',
        reasoning: 'Your symptoms suggest a condition that should be evaluated by a healthcare provider soon.',
        recommendations: [
          'Schedule an appointment with your doctor within 24-48 hours',
          'Visit an urgent care center if symptoms worsen',
          'Monitor your temperature and other symptoms',
          'Stay hydrated and rest',
        ],
        specialty: 'General Physician',
      });
      setShowResults(true);
      return;
    }

    // Common cold/flu scenario
    if (selected.some(s => s.name === 'Cough' || s.name === 'Sore Throat' || s.name === 'Runny Nose' || s.name === 'Body Ache')) {
      setResult({
        urgency: 'self_care',
        urgencyColor: '#4CAF50',
        urgencyLabel: 'Self-Care Recommended',
        reasoning: 'Your symptoms appear consistent with a common cold or mild viral infection.',
        recommendations: [
          'Rest and stay hydrated (8+ glasses of water daily)',
          'Take over-the-counter pain relievers if needed',
          'Use a humidifier to ease congestion',
          'Monitor symptoms - see a doctor if they persist beyond 7-10 days',
          'Practice good hand hygiene',
        ],
      });
      setShowResults(true);
      return;
    }

    // General case
    setResult({
      urgency: 'consult_doctor',
      urgencyColor: '#2196F3',
      urgencyLabel: 'Consult a Doctor',
      reasoning: 'Based on your symptoms, a consultation with a healthcare provider is recommended.',
      recommendations: [
        'Book an appointment for a proper evaluation',
        'Keep track of when symptoms started',
        'Note any triggers or relieving factors',
        'Prepare questions for your doctor',
      ],
      specialty: 'General Physician',
    });
    setShowResults(true);
  };

  const filteredSymptoms = symptoms.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = [...new Set(symptoms.map(s => s.category))];

  if (showResults && result) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView>
          {/* Header */}
          <View style={[styles.header, { backgroundColor: result.urgencyColor }]}>
            <Text style={styles.headerTitle}>Assessment Results</Text>
          </View>

          {/* Urgency Card */}
          <View style={[styles.urgencyCard, { borderLeftColor: result.urgencyColor }]}>
            <Text style={[styles.urgencyLabel, { color: result.urgencyColor }]}>
              {result.urgencyLabel}
            </Text>
          </View>

          {/* Reasoning */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Assessment</Text>
            <Text style={styles.reasoning}>{result.reasoning}</Text>
          </View>

          {/* Recommendations */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recommendations</Text>
            {result.recommendations.map((rec, idx) => (
              <View key={idx} style={styles.recommendationItem}>
                <Text style={styles.recommendationBullet}>•</Text>
                <Text style={styles.recommendationText}>{rec}</Text>
              </View>
            ))}
          </View>

          {/* Specialty */}
          {result.specialty && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recommended Specialist</Text>
              <TouchableOpacity style={styles.specialtyButton}>
                <Text style={styles.specialtyText}>Book {result.specialty}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Disclaimer */}
          <View style={styles.disclaimer}>
            <Text style={styles.disclaimerText}>
              ⚠️ This is not a medical diagnosis. Always consult a qualified healthcare professional for medical advice.
            </Text>
          </View>

          {/* Back Button */}
          <TouchableOpacity style={styles.backButton} onPress={() => setShowResults(false)}>
            <Text style={styles.backButtonText}>← Check Another Symptom</Text>
          </TouchableOpacity>

          {/* New Assessment */}
          <TouchableOpacity style={styles.newButton} onPress={() => {
            setSymptoms(symptoms.map(s => ({ ...s, selected: false })));
            setShowResults(false);
            setResult(null);
          }}>
            <Text style={styles.newButtonText}>Start New Assessment</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Symptom Checker</Text>
          <Text style={styles.headerSubtitle}>Select your symptoms for guidance</Text>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search symptoms..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Body Area */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Where does it hurt?</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {bodyAreas.map(area => (
              <TouchableOpacity
                key={area}
                style={[styles.areaChip, selectedArea === area && styles.areaChipSelected]}
                onPress={() => setSelectedArea(selectedArea === area ? null : area)}
              >
                <Text style={[styles.areaChipText, selectedArea === area && styles.areaChipTextSelected]}>
                  {area}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Selected Symptoms */}
        {getSelectedSymptoms().length > 0 && (
          <View style={styles.selectedSection}>
            <Text style={styles.selectedTitle}>
              Selected ({getSelectedSymptoms().length}): {getSelectedSymptoms().map(s => s.name).join(', ')}
            </Text>
          </View>
        )}

        {/* Duration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How long have you had these symptoms?</Text>
          <View style={styles.durationOptions}>
            {['Today', '1-3 days', '4-7 days', '1-2 weeks', 'More than 2 weeks'].map(d => (
              <TouchableOpacity
                key={d}
                style={[styles.durationOption, duration === d && styles.durationOptionSelected]}
                onPress={() => setDuration(d)}
              >
                <Text style={[styles.durationOptionText, duration === d && styles.durationOptionTextSelected]}>
                  {d}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Symptoms by Category */}
        {categories.map(category => {
          const categorySymptoms = filteredSymptoms.filter(s => s.category === category);
          if (categorySymptoms.length === 0) return null;

          return (
            <View key={category} style={styles.section}>
              <Text style={styles.categoryTitle}>{category}</Text>
              <View style={styles.symptomGrid}>
                {categorySymptoms.map(symptom => (
                  <TouchableOpacity
                    key={symptom.id}
                    style={[styles.symptomChip, symptom.selected && styles.symptomChipSelected]}
                    onPress={() => toggleSymptom(symptom.id)}
                  >
                    <Text style={[styles.symptomChipText, symptom.selected && styles.symptomChipTextSelected]}>
                      {symptom.selected && '✓ '}{symptom.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          );
        })}

        {/* Analyze Button */}
        <View style={styles.analyzeSection}>
          <TouchableOpacity
            style={[styles.analyzeButton, getSelectedSymptoms().length === 0 && styles.analyzeButtonDisabled]}
            onPress={analyzeSymptoms}
            disabled={getSelectedSymptoms().length === 0}
          >
            <Text style={styles.analyzeButtonText}>
              Analyze Symptoms ({getSelectedSymptoms().length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            ⚠️ This tool provides general health information, not a medical diagnosis. Always consult a doctor for medical advice.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { padding: 20, backgroundColor: '#2196F3' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  searchContainer: { padding: 16, backgroundColor: '#FFF' },
  searchInput: { backgroundColor: '#F5F5F5', padding: 12, borderRadius: 8, fontSize: 16 },
  section: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 12 },
  areaChip: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#E0E0E0', borderRadius: 20, marginRight: 8 },
  areaChipSelected: { backgroundColor: '#2196F3' },
  areaChipText: { color: '#333', fontWeight: '500' },
  areaChipTextSelected: { color: '#FFF' },
  selectedSection: { padding: 16, backgroundColor: '#E3F2FD', marginHorizontal: 16, borderRadius: 8 },
  selectedTitle: { fontSize: 14, color: '#1976D2' },
  durationOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  durationOption: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#FFF', borderRadius: 20, borderWidth: 1, borderColor: '#DDD' },
  durationOptionSelected: { backgroundColor: '#2196F3', borderColor: '#2196F3' },
  durationOptionText: { color: '#333' },
  durationOptionTextSelected: { color: '#FFF' },
  categoryTitle: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 8, textTransform: 'uppercase' },
  symptomGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  symptomChip: { paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#FFF', borderRadius: 20, borderWidth: 1, borderColor: '#DDD' },
  symptomChipSelected: { backgroundColor: '#2196F3', borderColor: '#2196F3' },
  symptomChipText: { fontSize: 14, color: '#333' },
  symptomChipTextSelected: { color: '#FFF' },
  analyzeSection: { padding: 16 },
  analyzeButton: { backgroundColor: '#4CAF50', padding: 16, borderRadius: 12, alignItems: 'center' },
  analyzeButtonDisabled: { backgroundColor: '#A5D6A7' },
  analyzeButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  urgencyCard: { margin: 16, padding: 16, backgroundColor: '#FFF', borderRadius: 12, borderLeftWidth: 4, elevation: 2 },
  urgencyLabel: { fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
  reasoning: { fontSize: 16, color: '#333', lineHeight: 24 },
  recommendationItem: { flexDirection: 'row', marginBottom: 8 },
  recommendationBullet: { color: '#4CAF50', fontWeight: 'bold', marginRight: 8 },
  recommendationText: { flex: 1, fontSize: 14, color: '#333', lineHeight: 20 },
  specialtyButton: { backgroundColor: '#2196F3', padding: 14, borderRadius: 8, alignItems: 'center' },
  specialtyText: { color: '#FFF', fontWeight: '600', fontSize: 16 },
  disclaimer: { margin: 16, padding: 12, backgroundColor: '#FFF3E0', borderRadius: 8 },
  disclaimerText: { fontSize: 12, color: '#E65100', textAlign: 'center' },
  backButton: { margin: 16, padding: 14, backgroundColor: '#FFF', borderRadius: 8, borderWidth: 1, borderColor: '#2196F3', alignItems: 'center' },
  backButtonText: { color: '#2196F3', fontSize: 16 },
  newButton: { marginHorizontal: 16, marginBottom: 16, padding: 14, backgroundColor: '#2196F3', borderRadius: 8, alignItems: 'center' },
  newButtonText: { color: '#FFF', fontWeight: '600', fontSize: 16 },
});
