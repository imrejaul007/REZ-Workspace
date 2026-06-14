/**
 * Quick Setup Step - Configure Selected Services
 * Step 3 of 4: Quick setup for enabled features
 */

import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useOnboardingStore } from '@/stores/onboarding-v2';
import StepCard from '../components/StepCard';
import FormField from '../components/FormFields';
import { Colors } from '@/constants/Colors';
import { logger } from '@/utils/logger';

export default function QuickSetupStep() {
  const router = useRouter();
  const {
    serviceSelection,
    businessInfo,
    quickSetup,
    setQuickSetup,
    generateQRCodes,
    qrCodes,
    setStep,
    nextStep,
  } = useOnboardingStore();

  // Menu items state
  const [menuItems, setMenuItems] = useState<Array<{ name: string; price: string; category: string }>>([
    { name: '', price: '', category: '' },
  ]);

  // Time slots for reservations
  const [timeSlots, setTimeSlots] = useState<string[]>(['11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '7:00 PM', '8:00 PM', '9:00 PM']);

  // QR generation state
  const [generatingQR, setGeneratingQR] = useState(false);
  const [qrGenerated, setQrGenerated] = useState(quickSetup.qrGenerated || false);

  // Check which services need setup
  const needsMenuQR = serviceSelection.menuQr;
  const needsOnlineOrdering = serviceSelection.onlineOrdering;
  const needsReservations = serviceSelection.tableReservations;
  const needsScanPay = serviceSelection.scanAndPay;

  // Add menu item
  const addMenuItem = () => {
    setMenuItems([...menuItems, { name: '', price: '', category: '' }]);
  };

  // Remove menu item
  const removeMenuItem = (index: number) => {
    if (menuItems.length > 1) {
      setMenuItems(menuItems.filter((_, i) => i !== index));
    }
  };

  // Update menu item
  const updateMenuItem = (index: number, field: string, value: string) => {
    const updated = [...menuItems];
    updated[index] = { ...updated[index], [field]: value };
    setMenuItems(updated);
  };

  // Toggle time slot
  const toggleTimeSlot = (slot: string) => {
    if (timeSlots.includes(slot)) {
      setTimeSlots(timeSlots.filter((s) => s !== slot));
    } else {
      setTimeSlots([...timeSlots, slot]);
    }
  };

  // Generate QR codes
  const handleGenerateQRCodes = async () => {
    setGeneratingQR(true);
    try {
      await generateQRCodes();
      setQrGenerated(true);
    } catch (error) {
      logger.error('Failed to generate QR codes:', error);
    } finally {
      setGeneratingQR(false);
    }
  };

  // Handle continue
  const handleContinue = () => {
    // Save menu items if provided
    if (needsOnlineOrdering && menuItems.some((item) => item.name && item.price)) {
      const validItems = menuItems
        .filter((item) => item.name && item.price)
        .map((item) => ({
          name: item.name,
          price: parseFloat(item.price) || 0,
          category: item.category || 'General',
        }));
      setQuickSetup({ menuItems: validItems });
    }

    // Save time slots
    if (needsReservations) {
      setQuickSetup({ timeSlots });
    }

    // Generate QR codes if not done
    if (!qrGenerated && (needsMenuQR || needsScanPay)) {
      generateQRCodes();
    }

    setStep(4);
    nextStep();
    router.push('/onboarding-v2/steps/complete');
  };

  // Handle skip
  const handleSkip = () => {
    setStep(4);
    nextStep();
    router.push('/onboarding-v2/steps/complete');
  };

  return (
    <StepCard
      title="Quick setup"
      subtitle="Configure your selected features. You can refine these later."
      onContinue={handleContinue}
      onSkip={handleSkip}
      skipLabel="Skip all"
      continueLabel="Generate QR & Continue"
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Menu QR Setup */}
        {needsMenuQR && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <Ionicons name="restaurant-outline" size={22} color={Colors.light.primary} />
              </View>
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionTitle}>Menu QR Code</Text>
                <Text style={styles.sectionSubtitle}>Customers scan to see your menu</Text>
              </View>
            </View>

            {/* QR Preview */}
            {qrGenerated && qrCodes.menu ? (
              <View style={styles.qrPreview}>
                <View style={styles.qrPlaceholder}>
                  <Ionicons name="qr-code" size={80} color={Colors.light.text} />
                </View>
                <Text style={styles.qrLabel}>Menu QR Ready</Text>
                <TouchableOpacity onPress={handleGenerateQRCodes} style={styles.regenerateButton}>
                  <Text style={styles.regenerateText}>Regenerate</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.generateButton}
                onPress={handleGenerateQRCodes}
                disabled={generatingQR}
              >
                <Ionicons name="qr-code-outline" size={20} color="#FFFFFF" />
                <Text style={styles.generateButtonText}>
                  {generatingQR ? 'Generating...' : 'Generate Menu QR'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Online Ordering Setup */}
        {needsOnlineOrdering && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <Ionicons name="cart-outline" size={22} color={Colors.light.primary} />
              </View>
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionTitle}>Online Ordering</Text>
                <Text style={styles.sectionSubtitle}>Add your first products</Text>
              </View>
            </View>

            <View style={styles.menuItems}>
              {menuItems.map((item, index) => (
                <View key={index} style={styles.menuItemRow}>
                  <View style={styles.menuItemFields}>
                    <View style={styles.menuItemName}>
                      <FormField
                        label={index === 0 ? 'Item Name' : undefined}
                        placeholder="e.g., Margherita Pizza"
                        value={item.name}
                        onChangeText={(text) => updateMenuItem(index, 'name', text)}
                      />
                    </View>
                    <View style={styles.menuItemPrice}>
                      <FormField
                        label={index === 0 ? 'Price' : undefined}
                        placeholder="₹ 299"
                        value={item.price}
                        onChangeText={(text) => updateMenuItem(index, 'price', text)}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                  {menuItems.length > 1 && (
                    <TouchableOpacity
                      style={styles.removeItemButton}
                      onPress={() => removeMenuItem(index)}
                    >
                      <Ionicons name="close-circle" size={24} color={Colors.light.error} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              <TouchableOpacity style={styles.addItemButton} onPress={addMenuItem}>
                <Ionicons name="add-circle-outline" size={20} color={Colors.light.primary} />
                <Text style={styles.addItemText}>Add more items</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Table Reservations Setup */}
        {needsReservations && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <Ionicons name="calendar-outline" size={22} color={Colors.light.primary} />
              </View>
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionTitle}>Reservation Slots</Text>
                <Text style={styles.sectionSubtitle}>Select available time slots</Text>
              </View>
            </View>

            <View style={styles.timeSlotsGrid}>
              {['10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM'].map((slot) => (
                <TouchableOpacity
                  key={slot}
                  style={[styles.timeSlot, timeSlots.includes(slot) && styles.timeSlotSelected]}
                  onPress={() => toggleTimeSlot(slot)}
                >
                  <Text style={[styles.timeSlotText, timeSlots.includes(slot) && styles.timeSlotTextSelected]}>
                    {slot}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Scan & Pay Setup */}
        {needsScanPay && !needsMenuQR && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <Ionicons name="qr-code-outline" size={22} color={Colors.light.primary} />
              </View>
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionTitle}>Scan & Pay</Text>
                <Text style={styles.sectionSubtitle}>Your payment QR code</Text>
              </View>
            </View>

            {qrGenerated && qrCodes.payment ? (
              <View style={styles.qrPreview}>
                <View style={styles.qrPlaceholder}>
                  <Ionicons name="qr-code" size={80} color={Colors.light.text} />
                </View>
                <Text style={styles.qrLabel}>Payment QR Ready</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.generateButton}
                onPress={handleGenerateQRCodes}
                disabled={generatingQR}
              >
                <Ionicons name="qr-code-outline" size={20} color="#FFFFFF" />
                <Text style={styles.generateButtonText}>
                  {generatingQR ? 'Generating...' : 'Generate Payment QR'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Quick Tip */}
        <View style={styles.tipBanner}>
          <Ionicons name="bulb-outline" size={20} color={Colors.light.warning} />
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>Tip: You can always add more</Text>
            <Text style={styles.tipText}>
              These are just quick starters. Add full menus, products, and settings from your dashboard.
            </Text>
          </View>
        </View>
      </ScrollView>
    </StepCard>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  sectionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: `${Colors.light.primary}12`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  qrPreview: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 12,
  },
  qrPlaceholder: {
    width: 120,
    height: 120,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
  },
  qrLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.success,
  },
  regenerateButton: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  regenerateText: {
    fontSize: 13,
    color: Colors.light.primary,
    fontWeight: '500',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
  },
  generateButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  menuItems: {
    gap: 12,
  },
  menuItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  menuItemFields: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  menuItemName: {
    flex: 2,
  },
  menuItemPrice: {
    flex: 1,
  },
  removeItemButton: {
    padding: 8,
    marginTop: 24,
  },
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.light.borderMedium,
    borderStyle: 'dashed',
  },
  addItemText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.primary,
  },
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlot: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.light.borderMedium,
    backgroundColor: Colors.light.background,
  },
  timeSlotSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primary,
  },
  timeSlotText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.light.text,
  },
  timeSlotTextSelected: {
    color: '#FFFFFF',
  },
  tipBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    backgroundColor: `${Colors.light.warning}12`,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 24,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.warning,
    marginBottom: 4,
  },
  tipText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
});
