// Addresses Management Screen
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Plus, MapPin, Trash2, Edit2 } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { useUserStore } from '@/stores';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';

interface Address {
  id: string;
  label: string;
  address: string;
  city: string;
  pincode: string;
  isDefault: boolean;
}

export default function AddressesScreen() {
  const { colors, spacing } = useTheme();
  const router = useRouter();
  const { token, profile } = useUserStore();

  const [addresses, setAddresses] = useState<Address[]>([
    // Mock addresses for demo
    {
      id: '1',
      label: 'Home',
      address: '123 MG Road, Sector 14',
      city: 'Gurugram',
      pincode: '122001',
      isDefault: true,
    },
  ]);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    label: '',
    address: '',
    city: '',
    pincode: '',
  });

  const handleSave = () => {
    if (!formData.address || !formData.city || !formData.pincode) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    if (editingAddress) {
      setAddresses((prev) =>
        prev.map((a) => (a.id === editingAddress.id ? { ...a, ...formData } : a))
      );
    } else {
      setAddresses((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          ...formData,
          isDefault: prev.length === 0,
        },
      ]);
    }

    setShowForm(false);
    setEditingAddress(null);
    setFormData({ label: '', address: '', city: '', pincode: '' });
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Address', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setAddresses((prev) => prev.filter((a) => a.id !== id));
        },
      },
    ]);
  };

  const handleEdit = (address: Address) => {
    setEditingAddress(address);
    setFormData({
      label: address.label,
      address: address.address,
      city: address.city,
      pincode: address.pincode,
    });
    setShowForm(true);
  };

  const handleSetDefault = (id: string) => {
    setAddresses((prev) =>
      prev.map((a) => ({ ...a, isDefault: a.id === id }))
    );
  };

  const renderAddress = (address: Address) => (
    <Card key={address.id} style={styles.addressCard}>
      <View style={styles.addressHeader}>
        <View style={styles.addressInfo}>
          <View style={styles.labelRow}>
            <Text style={[styles.label, { color: colors.label }]}>
              {address.label}
            </Text>
            {address.isDefault && (
              <View style={[styles.defaultBadge, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.defaultText, { color: colors.primary }]}>
                  Default
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.addressText, { color: colors.labelSecondary }]}>
            {address.address}
          </Text>
          <Text style={[styles.addressText, { color: colors.labelSecondary }]}>
            {address.city} - {address.pincode}
          </Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEdit(address)}
          >
            <Edit2 size={18} color={colors.labelSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDelete(address.id)}
          >
            <Trash2 size={18} color={colors.systemRed} />
          </TouchableOpacity>
        </View>
      </View>
      {!address.isDefault && (
        <TouchableOpacity
          style={[styles.setDefaultButton, { borderColor: colors.separator }]}
          onPress={() => handleSetDefault(address.id)}
        >
          <Text style={[styles.setDefaultText, { color: colors.primary }]}>
            Set as Default
          </Text>
        </TouchableOpacity>
      )}
    </Card>
  );

  const renderForm = () => (
    <Card style={styles.formCard}>
      <Text style={[styles.formTitle, { color: colors.label }]}>
        {editingAddress ? 'Edit Address' : 'Add New Address'}
      </Text>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: colors.labelSecondary }]}>
          Label (e.g., Home, Office)
        </Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.fill, color: colors.label }]}
          value={formData.label}
          onChangeText={(text) => setFormData((prev) => ({ ...prev, label: text }))}
          placeholder="e.g., Home, Office"
          placeholderTextColor={colors.labelTertiary}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: colors.labelSecondary }]}>
          Address *
        </Text>
        <TextInput
          style={[styles.input, styles.textArea, { backgroundColor: colors.fill, color: colors.label }]}
          value={formData.address}
          onChangeText={(text) => setFormData((prev) => ({ ...prev, address: text }))}
          placeholder="Street address"
          placeholderTextColor={colors.labelTertiary}
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={[styles.inputLabel, { color: colors.labelSecondary }]}>
            City *
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.fill, color: colors.label }]}
            value={formData.city}
            onChangeText={(text) => setFormData((prev) => ({ ...prev, city: text }))}
            placeholder="City"
            placeholderTextColor={colors.labelTertiary}
          />
        </View>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={[styles.inputLabel, { color: colors.labelSecondary }]}>
            PIN Code *
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.fill, color: colors.label }]}
            value={formData.pincode}
            onChangeText={(text) => setFormData((prev) => ({ ...prev, pincode: text }))}
            placeholder="123456"
            placeholderTextColor={colors.labelTertiary}
            keyboardType="number-pad"
            maxLength={6}
          />
        </View>
      </View>

      <View style={styles.formActions}>
        <Button
          variant="ghost"
          size="medium"
          onPress={() => {
            setShowForm(false);
            setEditingAddress(null);
            setFormData({ label: '', address: '', city: '', pincode: '' });
          }}
        >
          Cancel
        </Button>
        <Button variant="primary" size="medium" onPress={handleSave}>
          Save
        </Button>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { padding: spacing.screenPadding }]}>
        <View style={styles.headerRow}>
          <ChevronLeft
            size={24}
            color={colors.label}
            onPress={() => router.back()}
          />
          <Text style={[styles.headerTitle, { color: colors.label }]}>
            My Addresses
          </Text>
          <View style={{ width: 24 }} />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {showForm && renderForm()}

        {addresses.map(renderAddress)}

        {!showForm && (
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.fill }]}
            onPress={() => setShowForm(true)}
          >
            <Plus size={20} color={colors.primary} />
            <Text style={[styles.addButtonText, { color: colors.primary }]}>
              Add New Address
            </Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  addressCard: {
    marginBottom: 12,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  addressInfo: {
    flex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  defaultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  defaultText: {
    fontSize: 10,
    fontWeight: '600',
  },
  addressText: {
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 4,
  },
  setDefaultButton: {
    marginTop: 12,
    paddingVertical: 8,
    borderTopWidth: 0.5,
    borderColor: '#eee',
    alignItems: 'center',
  },
  setDefaultText: {
    fontSize: 13,
    fontWeight: '500',
  },
  formCard: {
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    marginBottom: 6,
  },
  input: {
    padding: 12,
    borderRadius: 8,
    fontSize: 15,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
});
