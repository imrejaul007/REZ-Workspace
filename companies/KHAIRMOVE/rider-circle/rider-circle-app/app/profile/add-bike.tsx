/**
 * Add Bike Screen
 */

import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { api } from '../../services/api';

const BIKE_BRANDS = [
  'Royal Enfield', 'KTM', 'Yamaha', 'Honda', 'Suzuki',
  'Bajaj', 'TVS', 'Harley-Davidson', 'Jawa', 'BMW', 'Kawasaki', 'Other'
];

const BIKE_MODELS: Record<string, string[]> = {
  'Royal Enfield': ['Himalayan 450', 'Continental GT', 'Interceptor', 'Thunderbird', 'Classic', 'Meteor', 'Hunter'],
  'KTM': ['Duke 390', 'Duke 250', 'Duke 200', 'RC 390', 'Adventure 390'],
  'Yamaha': ['MT-15', 'R15 V4', 'FZS-Fi', 'YZF-R3', 'FZ-25'],
  'Honda': ['CBR650R', 'Hness CB350', 'Gold Wing', 'Activa'],
  'Suzuki': ['Gixxer SF', 'Hayabusa', 'V-Strom', 'Access'],
  'Bajaj': ['Dominar 400', 'Pulsar NS200', 'Pulsar 150'],
  'TVS': ['Apache RTR 310', 'Apache RTR 160', 'Jupiter'],
  'Other': ['Other'],
};

export default function AddBikeScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form state
  const [form, setForm] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    registrationNumber: '',
    nickname: '',
    engineCC: '',
    fuelCapacity: '',
    odometer: '',
  });

  const [selectedBrand, setSelectedBrand] = useState('');

  const handleSubmit = async () => {
    if (!form.make || !form.model || !form.registrationNumber) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await api.createBike({
        make: form.make,
        model: form.model,
        year: form.year,
        registrationNumber: form.registrationNumber,
        nickname: form.nickname || `${form.make} ${form.model}`,
        engineCC: parseInt(form.engineCC) || 0,
        fuelCapacity: parseFloat(form.fuelCapacity) || 0,
        odometer: parseInt(form.odometer) || 0,
        isPrimary: true,
      });

      Alert.alert('Success', 'Bike added successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to add bike. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <>
      <Text style={styles.stepTitle}>Select Brand & Model</Text>
      <Text style={styles.stepSubtitle}>Choose your motorcycle brand</Text>

      <View style={styles.brandGrid}>
        {BIKE_BRANDS.map((brand) => (
          <TouchableOpacity
            key={brand}
            style={[
              styles.brandCard,
              selectedBrand === brand && styles.brandCardSelected,
            ]}
            onPress={() => {
              setSelectedBrand(brand);
              setForm({ ...form, make: brand, model: '' });
            }}
          >
            <Text style={styles.brandName}>{brand}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {selectedBrand && BIKE_MODELS[selectedBrand] && (
        <>
          <Text style={styles.stepSubtitle}>Select Model</Text>
          <View style={styles.modelGrid}>
            {BIKE_MODELS[selectedBrand].map((model) => (
              <TouchableOpacity
                key={model}
                style={[
                  styles.modelCard,
                  form.model === model && styles.modelCardSelected,
                ]}
                onPress={() => setForm({ ...form, model })}
              >
                <Text style={styles.modelName}>{model}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      <Button
        title="Next"
        onPress={() => setStep(2)}
        disabled={!form.make || !form.model}
        fullWidth
        style={styles.nextButton}
      />
    </>
  );

  const renderStep2 = () => (
    <>
      <Text style={styles.stepTitle}>Bike Details</Text>
      <Text style={styles.stepSubtitle}>Enter your bike details</Text>

      <Input
        label="Registration Number *"
        placeholder="KA01AB1234"
        value={form.registrationNumber}
        onChangeText={(text) => setForm({ ...form, registrationNumber: text.toUpperCase() })}
        autoCapitalize="characters"
      />

      <Input
        label="Year"
        placeholder="2024"
        value={form.year.toString()}
        onChangeText={(text) => setForm({ ...form, year: parseInt(text) || new Date().getFullYear() })}
        keyboardType="numeric"
      />

      <Input
        label="Nickname (optional)"
        placeholder="The Beast"
        value={form.nickname}
        onChangeText={(text) => setForm({ ...form, nickname: text })}
      />

      <Input
        label="Engine CC"
        placeholder="411"
        value={form.engineCC}
        onChangeText={(text) => setForm({ ...form, engineCC: text })}
        keyboardType="numeric"
      />

      <Input
        label="Fuel Capacity (liters)"
        placeholder="15"
        value={form.fuelCapacity}
        onChangeText={(text) => setForm({ ...form, fuelCapacity: text })}
        keyboardType="numeric"
      />

      <Input
        label="Current Odometer (km)"
        placeholder="10000"
        value={form.odometer}
        onChangeText={(text) => setForm({ ...form, odometer: text })}
        keyboardType="numeric"
      />

      <View style={styles.buttonRow}>
        <Button
          title="Back"
          onPress={() => setStep(1)}
          variant="outline"
          style={styles.backButton}
        />
        <Button
          title="Add Bike"
          onPress={handleSubmit}
          loading={loading}
          style={styles.submitButton}
        />
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Bike</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Progress */}
      <View style={styles.progress}>
        <View style={[styles.progressStep, step >= 1 && styles.progressStepActive]} />
        <View style={[styles.progressStep, step >= 2 && styles.progressStepActive]} />
      </View>

      {/* Form */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {step === 1 ? renderStep1() : renderStep2()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#16213e',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 48,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    fontSize: 20,
    color: '#fff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  progress: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
  },
  progressStep: {
    flex: 1,
    height: 4,
    backgroundColor: '#2a2a4e',
    borderRadius: 2,
  },
  progressStepActive: {
    backgroundColor: '#e94560',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 24,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 24,
  },
  brandGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  brandCard: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1a1a2e',
  },
  brandCardSelected: {
    borderColor: '#e94560',
    backgroundColor: 'rgba(233, 69, 96, 0.1)',
  },
  brandName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  modelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  modelCard: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1a1a2e',
  },
  modelCardSelected: {
    borderColor: '#e94560',
    backgroundColor: 'rgba(233, 69, 96, 0.1)',
  },
  modelName: {
    fontSize: 14,
    color: '#fff',
  },
  nextButton: {
    marginTop: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  backButton: {
    flex: 1,
  },
  submitButton: {
    flex: 2,
  },
});