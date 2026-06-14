/**
 * Services Step - Select Services to Enable
 * Step 2 of 4: Choose features for your store
 */

import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useOnboardingStore } from '@/stores/onboarding-v2';
import StepCard from '../components/StepCard';
import { Colors } from '@/constants/Colors';

// Service definitions with icons and descriptions
interface ServiceOption {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  categoryHint?: string[]; // Which categories this is most relevant for
}

const allServices: ServiceOption[] = [
  {
    id: 'scanAndPay',
    title: 'Scan & Pay',
    description: 'Customers scan QR to pay instantly',
    icon: 'qr-code-outline',
    categoryHint: ['Food & Beverage', 'Retail', 'Services', 'Salon', 'Gym'],
  },
  {
    id: 'onlineOrdering',
    title: 'Online Ordering',
    description: 'Take orders from website & app',
    icon: 'cart-outline',
    categoryHint: ['Food & Beverage'],
  },
  {
    id: 'menuQr',
    title: 'Menu QR Code',
    description: 'Digital menu customers scan',
    icon: 'restaurant-outline',
    categoryHint: ['Food & Beverage', 'Hotel'],
  },
  {
    id: 'loyaltyStamps',
    title: 'Loyalty Stamps',
    description: 'Reward repeat customers',
    icon: 'star-outline',
    categoryHint: ['Food & Beverage', 'Retail', 'Salon'],
  },
  {
    id: 'tableReservations',
    title: 'Table Reservations',
    description: 'Let customers book tables',
    icon: 'calendar-outline',
    categoryHint: ['Food & Beverage', 'Hotel'],
  },
  {
    id: 'delivery',
    title: 'Delivery',
    description: 'Deliver orders to customers',
    icon: 'bicycle-outline',
    categoryHint: ['Food & Beverage', 'Retail'],
  },
];

export default function ServicesStep() {
  const router = useRouter();
  const {
    serviceSelection,
    setServiceSelection,
    businessInfo,
    setStep,
    nextStep,
  } = useOnboardingStore();

  // Initialize from store with smart defaults
  const [selectedServices, setSelectedServices] = useState<Record<string, boolean>>({
    scanAndPay: serviceSelection.scanAndPay ?? false,
    onlineOrdering: serviceSelection.onlineOrdering ?? false,
    menuQr: serviceSelection.menuQr ?? false,
    loyaltyStamps: serviceSelection.loyaltyStamps ?? false,
    tableReservations: serviceSelection.tableReservations ?? false,
    delivery: serviceSelection.delivery ?? false,
  });

  // Apply smart defaults based on category on mount
  useEffect(() => {
    if (businessInfo.businessCategory) {
      const category = businessInfo.businessCategory;
      const newSelection = { ...selectedServices };

      // Smart defaults based on category
      const defaults: Record<string, string[]> = {
        'Food & Beverage': ['scanAndPay', 'menuQr', 'onlineOrdering', 'loyaltyStamps'],
        'Retail': ['scanAndPay', 'loyaltyStamps'],
        'Hotel': ['menuQr', 'tableReservations'],
        'Services': ['scanAndPay', 'loyaltyStamps'],
        'Salon': ['scanAndPay', 'loyaltyStamps'],
        'Gym': ['scanAndPay'],
      };

      const categoryDefaults = defaults[category] || ['scanAndPay'];

      allServices.forEach((service) => {
        if (categoryDefaults.includes(service.id)) {
          newSelection[service.id] = true;
        }
      });

      setSelectedServices(newSelection);
    }
  }, [businessInfo.businessCategory]);

  // Toggle service selection
  const toggleService = (serviceId: string) => {
    setSelectedServices((prev) => ({
      ...prev,
      [serviceId]: !prev[serviceId],
    }));
  };

  // Count selected services
  const selectedCount = Object.values(selectedServices).filter(Boolean).length;

  // Get relevance score for a service based on category
  const getRelevance = (service: ServiceOption): 'high' | 'medium' | 'low' => {
    if (!businessInfo.businessCategory) return 'low';
    if (service.categoryHint?.includes(businessInfo.businessCategory)) return 'high';
    return 'low';
  };

  // Handle continue
  const handleContinue = () => {
    setServiceSelection(selectedServices);
    setStep(3);
    nextStep();
    router.push('/onboarding-v2/steps/quick-setup');
  };

  // Handle back
  const handleBack = () => {
    setServiceSelection(selectedServices);
    setStep(1);
    router.push('/onboarding-v2/steps/business');
  };

  return (
    <StepCard
      title="Enable features for your store"
      subtitle={`${selectedCount} feature${selectedCount !== 1 ? 's' : ''} selected. You can change these later.`}
      onContinue={handleContinue}
      onSkip={handleBack}
      skipLabel="Back"
      continueLabel={`Set Up ${selectedCount > 0 ? selectedCount + ' Features' : 'Later'}`}
    >
      {/* Services List */}
      <View style={styles.servicesList}>
        {allServices.map((service) => {
          const isSelected = selectedServices[service.id];
          const relevance = getRelevance(service);

          return (
            <TouchableOpacity
              key={service.id}
              style={[
                styles.serviceCard,
                isSelected && styles.serviceCardSelected,
                relevance === 'high' && !isSelected && styles.serviceCardRecommended,
              ]}
              onPress={() => toggleService(service.id)}
              activeOpacity={0.7}
            >
              {/* Checkbox */}
              <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                {isSelected && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
              </View>

              {/* Icon */}
              <View style={[styles.iconContainer, isSelected && styles.iconContainerSelected]}>
                <Ionicons
                  name={service.icon}
                  size={24}
                  color={isSelected ? Colors.light.primary : Colors.light.textSecondary}
                />
              </View>

              {/* Content */}
              <View style={styles.serviceContent}>
                <Text style={[styles.serviceTitle, isSelected && styles.serviceTitleSelected]}>
                  {service.title}
                </Text>
                <Text style={styles.serviceDescription}>{service.description}</Text>
              </View>

              {/* Relevance badge */}
              {relevance === 'high' && !isSelected && (
                <View style={styles.recommendedBadge}>
                  <Text style={styles.recommendedText}>Recommended</Text>
                </View>
              )}

              {/* Switch */}
              <Switch
                value={isSelected}
                onValueChange={() => toggleService(service.id)}
                trackColor={{ false: Colors.light.borderLight, true: Colors.light.primary }}
                thumbColor="#FFFFFF"
              />
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <Ionicons name="shield-checkmark" size={20} color={Colors.light.success} />
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>All features can be changed later</Text>
          <Text style={styles.infoText}>
            Go to Settings {'>'} Features to enable or disable unknown service
          </Text>
        </View>
      </View>
    </StepCard>
  );
}

const styles = StyleSheet.create({
  servicesList: {
    gap: 12,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.light.background,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.light.borderLight,
    gap: 14,
  },
  serviceCardSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: `${Colors.light.primary}08`,
  },
  serviceCardRecommended: {
    borderColor: Colors.light.primary,
    borderStyle: 'dashed',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.light.borderMedium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.light.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerSelected: {
    backgroundColor: `${Colors.light.primary}15`,
  },
  serviceContent: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 2,
  },
  serviceTitleSelected: {
    color: Colors.light.primary,
  },
  serviceDescription: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  recommendedBadge: {
    position: 'absolute',
    top: -8,
    right: 16,
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  recommendedText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    backgroundColor: `${Colors.light.success}10`,
    borderRadius: 12,
    marginTop: 24,
    borderWidth: 1,
    borderColor: `${Colors.light.success}30`,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.success,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
});
