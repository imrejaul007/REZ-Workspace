// @ts-nocheck
// Habixo Checkout Screen
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { createBooking, HabixoProperty } from './api';

interface CheckoutParams {
  propertyId: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  basePrice: number;
}

// Mock property data (in production, this would come from API)
const getMockProperty = (propertyId: string): HabixoProperty => ({
  id: propertyId,
  title: 'Modern Apartment in Koramangala',
  location: 'Koramangala, Bangalore',
  city: 'Bangalore',
  price: 2500,
  rating: 4.8,
  reviews: 127,
  images: ['https://picsum.photos/800/600?random=30'],
  bedrooms: 2,
  bathrooms: 2,
  guests: 4,
  type: 'Entire Apartment',
  amenities: [],
  host: { name: 'Rahul S.', rating: 4.9, responseRate: 98 },
  brand: 'habixo_stay',
  status: 'available',
});

const PAYMENT_METHODS = [
  { id: 'wallet', label: 'Wallet', icon: '👛', balance: '₹500' },
  { id: 'upi', label: 'UPI', icon: '📱' },
  { id: 'card', label: 'Card', icon: '💳' },
];

export default function CheckoutScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();

  // Parse params with defaults
  const propertyId = params.propertyId || '1';
  const checkIn = params.checkIn || 'May 15, 2026';
  const checkOut = params.checkOut || 'May 18, 2026';
  const nights = parseInt(params.nights?.toString() || '3', 10);
  const basePrice = parseInt(params.basePrice?.toString() || '2500', 10);

  // Property state
  const [property] = useState<HabixoProperty>(getMockProperty(propertyId));

  // Guest details state
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);

  // Payment state
  const [selectedPayment, setSelectedPayment] = useState('wallet');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Loading state
  const [isProcessing, setIsProcessing] = useState(false);

  // Price calculations
  const cleaningFee = 500;
  const serviceFee = Math.round(basePrice * nights * 0.1);
  const subtotal = basePrice * nights + cleaningFee + serviceFee;
  const taxes = Math.round(subtotal * 0.18);
  const discount = appliedCoupon ? Math.round(subtotal * 0.1) : couponDiscount;
  const total = subtotal + taxes - discount;

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
      Alert.alert('Error', 'Please enter a coupon code');
      return;
    }

    // Mock coupon validation
    if (couponCode.toUpperCase() === 'HABIXO10') {
      setAppliedCoupon(couponCode.toUpperCase());
      setCouponDiscount(Math.round(subtotal * 0.1));
      Alert.alert('Success', 'Coupon applied! 10% discount');
    } else {
      Alert.alert('Invalid Code', 'This coupon code is not valid');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponCode('');
  };

  const handlePayment = async () => {
    if (!agreedToTerms) {
      Alert.alert('Terms Required', 'Please agree to the terms and conditions');
      return;
    }

    if (adults < 1) {
      Alert.alert('Guests Required', 'At least 1 adult is required');
      return;
    }

    Alert.alert(
      'Confirm Payment',
      `Pay ₹${total.toLocaleString('en-IN')} using ${PAYMENT_METHODS.find((m) => m.id === selectedPayment)?.label}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Pay Now', onPress: processPayment },
      ]
    );
  };

  const processPayment = async () => {
    setIsProcessing(true);

    try {
      const result = await createBooking({
        propertyId,
        checkIn: checkIn.replace(/,/g, '').replace(/\s+/g, '-').toLowerCase(),
        checkOut: checkOut.replace(/,/g, '').replace(/\s+/g, '-').toLowerCase(),
        guests: {
          adults,
          children: children > 0 ? children : undefined,
          infants: infants > 0 ? infants : undefined,
        },
      });

      if (result.success && result.data) {
        // Navigate to booking confirmation
        router.replace({
          pathname: '/habixo/booking/[id]',
          params: { id: result.data.id },
        });
      } else {
        Alert.alert('Booking Failed', result.error || 'Something went wrong');
      }
    } catch (error) {
      // For demo purposes, simulate successful booking
      Alert.alert(
        'Booking Confirmed!',
        'Your booking has been successfully placed.',
        [
          {
            text: 'View Booking',
            onPress: () => router.replace('/habixo/booking/b1'),
          },
        ]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const updateGuestCount = (
    type: 'adults' | 'children' | 'infants',
    delta: number
  ) => {
    const setters = {
      adults: setAdults,
      children: setChildren,
      infants: setInfants,
    };
    const currentValues = { adults, children, infants };
    const newValue = currentValues[type] + delta;

    if (type === 'adults' && (newValue < 1 || newValue > property.guests)) return;
    if (newValue < 0) return;

    setters[type](newValue);
  };

  const totalGuests = adults + children + infants;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Property Summary Card */}
          <View style={styles.propertyCard}>
            <Image
              source={{ uri: property.images[0] }}
              style={styles.propertyImage}
            />
            <View style={styles.propertyInfo}>
              <Text style={styles.propertyTitle} numberOfLines={2}>
                {property.title}
              </Text>
              <Text style={styles.propertyLocation}>📍 {property.location}</Text>

              {/* Dates */}
              <View style={styles.datesRow}>
                <View style={styles.dateItem}>
                  <Text style={styles.dateLabel}>CHECK-IN</Text>
                  <Text style={styles.dateValue}>{checkIn}</Text>
                </View>
                <View style={styles.dateArrow}>
                  <Text>→</Text>
                </View>
                <View style={styles.dateItem}>
                  <Text style={styles.dateLabel}>CHECKOUT</Text>
                  <Text style={styles.dateValue}>{checkOut}</Text>
                </View>
              </View>

              <Text style={styles.nightsText}>{nights} nights</Text>
            </View>
          </View>

          {/* Guest Details Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Guest Details</Text>

            {/* Adults */}
            <View style={styles.guestRow}>
              <View>
                <Text style={styles.guestLabel}>Adults</Text>
                <Text style={styles.guestSubLabel}>Age 13+</Text>
              </View>
              <View style={styles.counterContainer}>
                <TouchableOpacity
                  style={styles.counterButton}
                  onPress={() => updateGuestCount('adults', -1)}
                >
                  <Text style={styles.counterText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.counterValue}>{adults}</Text>
                <TouchableOpacity
                  style={styles.counterButton}
                  onPress={() => updateGuestCount('adults', 1)}
                >
                  <Text style={styles.counterText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Children */}
            <View style={styles.guestRow}>
              <View>
                <Text style={styles.guestLabel}>Children</Text>
                <Text style={styles.guestSubLabel}>Age 2-12</Text>
              </View>
              <View style={styles.counterContainer}>
                <TouchableOpacity
                  style={styles.counterButton}
                  onPress={() => updateGuestCount('children', -1)}
                >
                  <Text style={styles.counterText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.counterValue}>{children}</Text>
                <TouchableOpacity
                  style={styles.counterButton}
                  onPress={() => updateGuestCount('children', 1)}
                >
                  <Text style={styles.counterText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Infants */}
            <View style={styles.guestRow}>
              <View>
                <Text style={styles.guestLabel}>Infants</Text>
                <Text style={styles.guestSubLabel}>Under 2</Text>
              </View>
              <View style={styles.counterContainer}>
                <TouchableOpacity
                  style={styles.counterButton}
                  onPress={() => updateGuestCount('infants', -1)}
                >
                  <Text style={styles.counterText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.counterValue}>{infants}</Text>
                <TouchableOpacity
                  style={styles.counterButton}
                  onPress={() => updateGuestCount('infants', 1)}
                >
                  <Text style={styles.counterText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.guestCapacity}>
              {totalGuests} guest{totalGuests !== 1 ? 's' : ''} • Maximum {property.guests} allowed
            </Text>
          </View>

          {/* Coupon Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Coupon / Promo Code</Text>

            {appliedCoupon ? (
              <View style={styles.appliedCoupon}>
                <View style={styles.appliedCouponInfo}>
                  <Text style={styles.appliedCouponCode}>{appliedCoupon}</Text>
                  <Text style={styles.appliedCouponDiscount}>
                    -₹{discount.toLocaleString('en-IN')}
                  </Text>
                </View>
                <TouchableOpacity onPress={handleRemoveCoupon}>
                  <Text style={styles.removeCoupon}>Remove</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.couponInputRow}>
                <TextInput
                  style={styles.couponInput}
                  placeholder="Enter coupon code"
                  placeholderTextColor="#9ca3af"
                  value={couponCode}
                  onChangeText={setCouponCode}
                  autoCapitalize="characters"
                />
                <TouchableOpacity
                  style={styles.applyButton}
                  onPress={handleApplyCoupon}
                >
                  <Text style={styles.applyButtonText}>Apply</Text>
                </TouchableOpacity>
              </View>
            )}

            <Text style={styles.couponHint}>Try HABIXO10 for 10% off</Text>
          </View>

          {/* Price Breakdown Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Price Details</Text>

            <View style={styles.priceCard}>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>
                  ₹{basePrice.toLocaleString('en-IN')} x {nights} nights
                </Text>
                <Text style={styles.priceValue}>
                  ₹{(basePrice * nights).toLocaleString('en-IN')}
                </Text>
              </View>

              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Cleaning fee</Text>
                <Text style={styles.priceValue}>
                  ₹{cleaningFee.toLocaleString('en-IN')}
                </Text>
              </View>

              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Service fee</Text>
                <Text style={styles.priceValue}>
                  ₹{serviceFee.toLocaleString('en-IN')}
                </Text>
              </View>

              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Taxes & charges</Text>
                <Text style={styles.priceValue}>
                  ₹{taxes.toLocaleString('en-IN')}
                </Text>
              </View>

              {discount > 0 && (
                <View style={styles.discountRow}>
                  <Text style={styles.discountLabel}>
                    Coupon discount ({appliedCoupon})
                  </Text>
                  <Text style={styles.discountValue}>
                    -₹{discount.toLocaleString('en-IN')}
                  </Text>
                </View>
              )}

              <View style={styles.divider} />

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>
                  ₹{total.toLocaleString('en-IN')}
                </Text>
              </View>
            </View>
          </View>

          {/* Payment Method Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Method</Text>

            <View style={styles.paymentMethods}>
              {PAYMENT_METHODS.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.paymentMethod,
                    selectedPayment === method.id && styles.paymentMethodSelected,
                  ]}
                  onPress={() => setSelectedPayment(method.id)}
                >
                  <Text style={styles.paymentIcon}>{method.icon}</Text>
                  <View style={styles.paymentInfo}>
                    <Text style={styles.paymentLabel}>{method.label}</Text>
                    {method.balance && (
                      <Text style={styles.paymentBalance}>{method.balance}</Text>
                    )}
                  </View>
                  <View
                    style={[
                      styles.radioOuter,
                      selectedPayment === method.id && styles.radioOuterSelected,
                    ]}
                  >
                    {selectedPayment === method.id && (
                      <View style={styles.radioInner} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Trust Badges */}
          <View style={styles.trustBadges}>
            <View style={styles.trustBadge}>
              <Text style={styles.trustIcon}>🔒</Text>
              <View>
                <Text style={styles.trustTitle}>Secure Payment</Text>
                <Text style={styles.trustDesc}>256-bit SSL encryption</Text>
              </View>
            </View>

            <View style={styles.trustBadge}>
              <Text style={styles.trustIcon}>💰</Text>
              <View>
                <Text style={styles.trustTitle}>Free Cancellation</Text>
                <Text style={styles.trustDesc}>Up to 7 days before check-in</Text>
              </View>
            </View>
          </View>

          {/* Terms and Conditions */}
          <TouchableOpacity
            style={styles.termsRow}
            onPress={() => setAgreedToTerms(!agreedToTerms)}
          >
            <View
              style={[
                styles.checkbox,
                agreedToTerms && styles.checkboxChecked,
              ]}
            >
              {agreedToTerms && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.termsText}>
              I agree to the{' '}
              <Text style={styles.termsLink}>Terms of Service</Text>,{' '}
              <Text style={styles.termsLink}>Cancellation Policy</Text>, and{' '}
              <Text style={styles.termsLink}>House Rules</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Pay Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomBarContent}>
          <View>
            <Text style={styles.totalPrice}>
              ₹{total.toLocaleString('en-IN')}
            </Text>
            <Text style={styles.totalPriceLabel}>Total</Text>
          </View>

          <TouchableOpacity
            style={[
              styles.payButton,
              (!agreedToTerms || isProcessing) && styles.payButtonDisabled,
            ]}
            onPress={handlePayment}
            disabled={!agreedToTerms || isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.payButtonText}>
                Pay ₹{total.toLocaleString('en-IN')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Loading Overlay */}
      {isProcessing && (
        <Modal transparent visible={isProcessing}>
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color="#6366f1" />
              <Text style={styles.loadingText}>Processing Payment...</Text>
              <Text style={styles.loadingSubtext}>Please wait</Text>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  propertyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  propertyImage: {
    width: '100%',
    height: 150,
  },
  propertyInfo: {
    padding: 16,
  },
  propertyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  propertyLocation: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  datesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateItem: {
    flex: 1,
  },
  dateArrow: {
    paddingHorizontal: 8,
  },
  dateLabel: {
    fontSize: 11,
    color: '#6b7280',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
  },
  nightsText: {
    fontSize: 13,
    color: '#6366f1',
    fontWeight: '500',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  guestRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  guestLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1f2937',
  },
  guestSubLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  counterButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterText: {
    fontSize: 18,
    color: '#6366f1',
    fontWeight: '600',
  },
  counterValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    minWidth: 24,
    textAlign: 'center',
  },
  guestCapacity: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 12,
  },
  couponInputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  couponInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#1f2937',
  },
  applyButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  appliedCoupon: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    padding: 12,
    borderRadius: 8,
  },
  appliedCouponInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  appliedCouponCode: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  appliedCouponDiscount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  removeCoupon: {
    fontSize: 14,
    color: '#dc2626',
    fontWeight: '500',
  },
  couponHint: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 8,
  },
  priceCard: {
    backgroundColor: '#fafafa',
    borderRadius: 8,
    padding: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 14,
    color: '#4b5563',
  },
  priceValue: {
    fontSize: 14,
    color: '#1f2937',
  },
  discountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  discountLabel: {
    fontSize: 14,
    color: '#059669',
  },
  discountValue: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  paymentMethods: {
    gap: 12,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fafafa',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  paymentMethodSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#eef2ff',
  },
  paymentIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1f2937',
  },
  paymentBalance: {
    fontSize: 13,
    color: '#059669',
    marginTop: 2,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterSelected: {
    borderColor: '#6366f1',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#6366f1',
  },
  trustBadges: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  trustBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  trustIcon: {
    fontSize: 24,
  },
  trustTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
  },
  trustDesc: {
    fontSize: 11,
    color: '#6b7280',
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 20,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    color: '#4b5563',
    lineHeight: 20,
  },
  termsLink: {
    color: '#6366f1',
    fontWeight: '500',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 24,
  },
  bottomBarContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalPrice: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  totalPriceLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  payButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    minWidth: 160,
    alignItems: 'center',
  },
  payButtonDisabled: {
    backgroundColor: '#a5b4fc',
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    width: '80%',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
});
