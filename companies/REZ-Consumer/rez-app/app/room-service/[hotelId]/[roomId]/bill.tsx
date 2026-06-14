/**
 * Bill Screen
 * Route: /room-service/[hotelId]/[roomId]/bill
 *
 * Shows guest's bill with all charges and checkout option
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function BillScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ hotelId: string; roomId: string }>();
  const [loading, setLoading] = useState(false);

  // Mock bill data
  const billData = {
    roomCharges: 16500,
    services: [
      { id: '1', name: 'Breakfast (x2)', amount: 1100 },
      { id: '2', name: 'Minibar', amount: 450 },
      { id: '3', name: 'Laundry', amount: 350 },
    ],
    subtotal: 18400,
    tax: 3312,
    total: 21712,
  };

  const handlePayment = () => {
    Alert.alert(
      'Payment Options',
      'Choose your payment method',
      [
        { text: 'UPI', onPress: () => Alert.alert('UPI', 'Redirecting to UPI...') },
        { text: 'Card', onPress: () => Alert.alert('Card', 'Opening card payment...') },
        { text: 'Pay at Checkout', onPress: () => Alert.alert('Success', 'Payment will be collected at checkout.') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleCheckout = () => {
    Alert.alert(
      'Request Checkout',
      'This will send a checkout request to the front desk.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Request', onPress: () => Alert.alert('Success', 'Checkout requested!') },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient colors={['#5D8C5A', '#4A7A49']} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Bill</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView style={styles.content}>
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>Total Amount</Text>
            <Text style={styles.totalAmount}>₹{billData.total.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>₹{billData.subtotal.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Taxes (18% GST)</Text>
            <Text style={styles.summaryValue}>₹{billData.tax.toLocaleString()}</Text>
          </View>
        </View>

        {/* Room Charges */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Room Charges</Text>
          <View style={styles.chargeCard}>
            <View style={styles.chargeHeader}>
              <Text style={styles.chargeName}>Room (3 nights)</Text>
              <Text style={styles.chargeAmount}>₹{billData.roomCharges.toLocaleString()}</Text>
            </View>
            <Text style={styles.chargeDesc}>Deluxe Room</Text>
          </View>
        </View>

        {/* Service Charges */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Services</Text>
          {billData.services.map(service => (
            <View key={service.id} style={styles.chargeCard}>
              <View style={styles.chargeHeader}>
                <Text style={styles.chargeName}>{service.name}</Text>
                <Text style={styles.chargeAmount}>₹{service.amount.toLocaleString()}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Payment Methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.paymentOptions}>
            <TouchableOpacity style={styles.paymentOption}>
              <Ionicons name="qr-code" size={24} color="#5D8C5A" />
              <Text style={styles.paymentText}>UPI</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.paymentOption}>
              <Ionicons name="card" size={24} color="#5D8C5A" />
              <Text style={styles.paymentText}>Card</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.paymentOption}>
              <Ionicons name="cash" size={24} color="#5D8C5A" />
              <Text style={styles.paymentText}>Cash</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.paymentOption}>
              <Ionicons name="wallet" size={24} color="#5D8C5A" />
              <Text style={styles.paymentText}>Wallet</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.payBtn, loading && styles.payBtnDisabled]}
            onPress={handlePayment}
            disabled={loading}
          >
            <Ionicons name="card" size={20} color="#fff" />
            <Text style={styles.payBtnText}>Pay Now</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
            <Ionicons name="log-out-outline" size={20} color="#5D8C5A" />
            <Text style={styles.checkoutBtnText}>Request Checkout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 54 : 20,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: '700', color: '#fff', textAlign: 'center' },
  content: { flex: 1, padding: 16 },
  summaryCard: {
    backgroundColor: '#5D8C5A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  summaryHeader: { alignItems: 'center', marginBottom: 16 },
  summaryTitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  totalAmount: { fontSize: 36, fontWeight: '700', color: '#fff', marginTop: 4 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  summaryLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  summaryValue: { fontSize: 14, fontWeight: '600', color: '#fff' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 12 },
  chargeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  chargeHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  chargeName: { fontSize: 15, color: '#333' },
  chargeAmount: { fontSize: 15, fontWeight: '600', color: '#333' },
  chargeDesc: { fontSize: 12, color: '#888', marginTop: 4 },
  paymentOptions: { flexDirection: 'row', justifyContent: 'space-between' },
  paymentOption: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  paymentText: { fontSize: 12, fontWeight: '600', color: '#333', marginTop: 8 },
  actions: { marginTop: 20, marginBottom: 40 },
  payBtn: {
    backgroundColor: '#5D8C5A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 25,
    marginBottom: 12,
  },
  payBtnDisabled: { backgroundColor: '#AAA' },
  payBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', marginLeft: 8 },
  checkoutBtn: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#5D8C5A',
  },
  checkoutBtnText: { color: '#5D8C5A', fontSize: 16, fontWeight: '600', marginLeft: 8 },
});
