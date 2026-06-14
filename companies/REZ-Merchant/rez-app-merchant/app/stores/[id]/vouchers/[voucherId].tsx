import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import FormInput from '@/components/forms/FormInput';
import FormSelect from '@/components/forms/FormSelect';
import {
  storeVouchersService,
  MerchantStoreVoucher,
  UpdateStoreVoucherRequest,
} from '@/services/api/storeVouchers';
import { useStore } from '@/contexts/StoreContext';
import ConfirmModal from '@/components/common/ConfirmModal';
import { Colors } from '@/constants/DesignTokens';
import { logger } from '@/utils/logger';

const voucherSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(100),
  description: z.string().max(500).optional().or(z.literal('')),
  type: z.enum(['store_visit', 'promotional']),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.string().regex(/^\d+(\.\d+)?$/, 'Must be a valid number'),
  minBillAmount: z
    .string()
    .regex(/^\d+(\.\d+)?$/, 'Must be a valid number')
    .refine((val) => parseFloat(val) >= 0, 'Must be 0 or greater'),
  maxDiscountAmount: z
    .string()
    .regex(/^\d+(\.\d+)?$/, 'Must be a valid number')
    .optional()
    .or(z.literal('')),
  validFrom: z.string().min(1, 'Start date is required'),
  validUntil: z.string().min(1, 'End date is required'),
  usageLimit: z.string().regex(/^\d+$/, 'Must be a number').default('100'),
  usageLimitPerUser: z.string().regex(/^\d+$/, 'Must be a number').default('1'),
  isOfflineOnly: z.boolean().default(false),
  notValidAboveStoreDiscount: z.boolean().default(false),
  singleVoucherPerBill: z.boolean().default(true),
  displayText: z.string().optional().or(z.literal('')),
  isActive: z.boolean().default(true),
});

type VoucherFormData = z.infer<typeof voucherSchema>;

export default function EditVoucherScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const storeId = params.id as string;
  const voucherId = params.voucherId as string;
  const { stores } = useStore();
  const store = stores.find((s) => s._id === storeId);

  const [voucher, setVoucher] = useState<MerchantStoreVoucher | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [alertModal, setAlertModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type?: 'default' | 'danger' | 'warning';
    onConfirm?: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'default',
  });
  const [confirmModal, setConfirmModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type?: 'default' | 'danger' | 'warning';
    onConfirm: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'default',
    onConfirm: () => {},
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<VoucherFormData>({
    resolver: zodResolver(voucherSchema),
    defaultValues: {
      name: '',
      description: '',
      type: 'store_visit',
      discountType: 'percentage',
      discountValue: '10',
      minBillAmount: '500',
      maxDiscountAmount: '',
      validFrom: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      usageLimit: '100',
      usageLimitPerUser: '1',
      isOfflineOnly: false,
      notValidAboveStoreDiscount: false,
      singleVoucherPerBill: true,
      displayText: '',
      isActive: true,
    },
  });

  const typedControl = control;

  const discountType = watch('discountType');
  const voucherType = watch('type');

  useEffect(() => {
    loadVoucher();
  }, [voucherId]);

  const loadVoucher = async () => {
    try {
      setPageLoading(true);
      const response = await storeVouchersService.getVoucherById(voucherId);
      if (response.success && response.data) {
        const v = response.data;
        setVoucher(v);
        // Reset form with voucher data
        reset({
          name: v.name,
          description: v.description || '',
          type: v.type,
          discountType: v.discountType,
          discountValue: String(v.discountValue),
          minBillAmount: String(v.minBillAmount),
          maxDiscountAmount: v.maxDiscountAmount ? String(v.maxDiscountAmount) : '',
          validFrom: new Date(v.validFrom).toISOString().split('T')[0],
          validUntil: new Date(v.validUntil).toISOString().split('T')[0],
          usageLimit: String(v.usageLimit),
          usageLimitPerUser: String(v.usageLimitPerUser || 1),
          isOfflineOnly: v.restrictions?.isOfflineOnly ?? false,
          notValidAboveStoreDiscount: v.restrictions?.notValidAboveStoreDiscount ?? false,
          singleVoucherPerBill: v.restrictions?.singleVoucherPerBill ?? true,
          displayText: v.metadata?.displayText || '',
          isActive: v.isActive,
        });
      } else {
        setAlertModal({
          visible: true,
          title: 'Error',
          message: response.message || 'Failed to load voucher',
          type: 'danger',
          onConfirm: () => router.back(),
        });
      }
    } catch (error) {
      if (__DEV__) console.error('Error loading voucher:', error);
      setAlertModal({
        visible: true,
        title: 'Error',
        message: error.message || 'Failed to load voucher',
        type: 'danger',
        onConfirm: () => router.back(),
      });
    } finally {
      setPageLoading(false);
    }
  };

  const onSubmit = async (data: VoucherFormData) => {
    try {
      setLoading(true);

      // Validate percentage value
      if (data.discountType === 'percentage') {
        const percentageValue = parseFloat(data.discountValue);
        if (percentageValue < 0 || percentageValue > 100) {
          setAlertModal({
            visible: true,
            title: 'Error',
            message: 'Percentage must be between 0 and 100',
            type: 'danger',
          });
          return;
        }
      }

      // Validate date range
      const startDate = new Date(data.validFrom);
      const endDate = new Date(data.validUntil);
      if (endDate <= startDate) {
        setAlertModal({
          visible: true,
          title: 'Error',
          message: 'End date must be after start date',
          type: 'danger',
        });
        return;
      }

      const voucherData: UpdateStoreVoucherRequest = {
        name: data.name.trim(),
        description: data.description?.trim() || undefined,
        type: data.type,
        discountType: data.discountType,
        discountValue: parseFloat(data.discountValue),
        minBillAmount: parseFloat(data.minBillAmount),
        maxDiscountAmount: data.maxDiscountAmount ? parseFloat(data.maxDiscountAmount) : undefined,
        validFrom: startDate.toISOString(),
        validUntil: endDate.toISOString(),
        usageLimit: parseInt(data.usageLimit) || 100,
        usageLimitPerUser: parseInt(data.usageLimitPerUser) || 1,
        restrictions: {
          isOfflineOnly: data.isOfflineOnly,
          notValidAboveStoreDiscount: data.notValidAboveStoreDiscount,
          singleVoucherPerBill: data.singleVoucherPerBill,
        },
        metadata: {
          displayText:
            data.displayText?.trim() ||
            (data.discountType === 'percentage'
              ? `Save ${data.discountValue}%`
              : `Save ₹${data.discountValue}`),
        },
        isActive: data.isActive,
      };

      const response = await storeVouchersService.updateVoucher(voucherId, voucherData);

      if (response.success) {
        setAlertModal({
          visible: true,
          title: 'Success',
          message: 'Voucher updated successfully',
          type: 'default',
          onConfirm: () => {
            setAlertModal({ ...alertModal, visible: false });
            router.back();
          },
        });
      } else {
        setAlertModal({
          visible: true,
          title: 'Error',
          message: response.message || 'Failed to update voucher',
          type: 'danger',
        });
      }
    } catch (error) {
      if (__DEV__) console.error('Error updating voucher:', error);
      setAlertModal({
        visible: true,
        title: 'Error',
        message: error.message || 'Failed to update voucher',
        type: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    setConfirmModal({
      visible: true,
      title: 'Delete Voucher',
      message:
        'Are you sure you want to delete this voucher? This will also remove it from all users who have claimed it. This action cannot be undone.',
      type: 'danger',
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, visible: false });
        try {
          setDeleting(true);
          const response = await storeVouchersService.deleteVoucher(voucherId);
          if (response.success) {
            setAlertModal({
              visible: true,
              title: 'Success',
              message: 'Voucher deleted successfully',
              type: 'default',
              onConfirm: () => router.back(),
            });
          } else {
            setAlertModal({
              visible: true,
              title: 'Error',
              message: response.message || 'Failed to delete voucher',
              type: 'danger',
            });
          }
        } catch (error) {
          setAlertModal({
            visible: true,
            title: 'Error',
            message: error.message || 'Failed to delete voucher',
            type: 'danger',
          });
        } finally {
          setDeleting(false);
        }
      },
    });
  };

  if (pageLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.gray[800]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Voucher</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Loading voucher...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.gray[800]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Voucher</Text>
        <TouchableOpacity onPress={handleDelete} disabled={deleting}>
          {deleting ? (
            <ActivityIndicator size="small" color={Colors.error[500]} />
          ) : (
            <Ionicons name="trash-outline" size={24} color={Colors.error[500]} />
          )}
        </TouchableOpacity>
      </View>

      {store && voucher && (
        <View style={styles.storeInfo}>
          <View style={styles.codeContainer}>
            <Ionicons name="ticket" size={16} color="#8B5CF6" />
            <Text style={styles.voucherCode}>{voucher.code}</Text>
          </View>
          <Text style={styles.storeName}>{store.name}</Text>
          <View style={styles.usageStats}>
            <Text style={styles.usageText}>
              {voucher.claimedCount || 0} claimed • {voucher.usedCount} / {voucher.usageLimit} used
            </Text>
          </View>
        </View>
      )}

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <FormInput
          name="name"
          control={typedControl}
          label="Voucher Name *"
          placeholder="e.g., Store Visit Discount"
          error={errors.name?.message}
        />

        <FormInput
          name="description"
          control={typedControl}
          label="Description"
          placeholder="Brief description of the voucher"
          multiline
          numberOfLines={3}
          error={errors.description?.message}
        />

        <FormSelect
          name="type"
          control={typedControl}
          label="Voucher Type *"
          options={[
            { label: 'Store Visit', value: 'store_visit' },
            { label: 'Promotional', value: 'promotional' },
          ]}
        />

        <View style={styles.typeInfoCard}>
          <Ionicons
            name={voucherType === 'store_visit' ? 'storefront' : 'megaphone'}
            size={24}
            color="#8B5CF6"
          />
          <View style={styles.typeInfoContent}>
            <Text style={styles.typeInfoTitle}>
              {voucherType === 'store_visit' ? 'Store Visit Voucher' : 'Promotional Voucher'}
            </Text>
            <Text style={styles.typeInfoText}>
              {voucherType === 'store_visit'
                ? 'Customers can claim and use when visiting your store.'
                : 'Promotional voucher for marketing campaigns.'}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Discount Details</Text>

        <FormSelect
          name="discountType"
          control={typedControl}
          label="Discount Type *"
          options={[
            { label: 'Percentage (%)', value: 'percentage' },
            { label: 'Fixed Amount (₹)', value: 'fixed' },
          ]}
        />

        <FormInput
          name="discountValue"
          control={typedControl}
          label={
            discountType === 'percentage' ? 'Discount Percentage (%) *' : 'Discount Amount (₹) *'
          }
          placeholder={discountType === 'percentage' ? '10' : '100'}
          keyboardType="numeric"
          error={errors.discountValue?.message}
        />

        {discountType === 'percentage' && (
          <FormInput
            name="maxDiscountAmount"
            control={typedControl}
            label="Maximum Discount Amount (₹)"
            placeholder="500"
            keyboardType="numeric"
            error={errors.maxDiscountAmount?.message}
          />
        )}

        <FormInput
          name="minBillAmount"
          control={typedControl}
          label="Minimum Bill Amount (₹) *"
          placeholder="500"
          keyboardType="numeric"
          error={errors.minBillAmount?.message}
        />

        <Text style={styles.sectionTitle}>Validity Period *</Text>
        <FormInput
          name="validFrom"
          control={typedControl}
          label="Start Date"
          placeholder="YYYY-MM-DD"
          error={errors.validFrom?.message}
        />

        <FormInput
          name="validUntil"
          control={typedControl}
          label="End Date"
          placeholder="YYYY-MM-DD"
          error={errors.validUntil?.message}
        />

        <Text style={styles.sectionTitle}>Usage Limits</Text>
        <FormInput
          name="usageLimit"
          control={typedControl}
          label="Total Usage Limit *"
          placeholder="100"
          keyboardType="numeric"
          error={errors.usageLimit?.message}
        />

        <FormInput
          name="usageLimitPerUser"
          control={typedControl}
          label="Usage Limit Per User *"
          placeholder="1"
          keyboardType="numeric"
          error={errors.usageLimitPerUser?.message}
        />

        <Text style={styles.sectionTitle}>Restrictions</Text>
        <View style={styles.switchRow}>
          <View style={styles.switchLabelContainer}>
            <Ionicons name="storefront-outline" size={20} color={Colors.gray[500]} />
            <Text style={styles.switchLabel}>Offline Only</Text>
          </View>
          <Controller
            name="isOfflineOnly"
            control={typedControl}
            render={({ field: { value, onChange } }) => (
              <TouchableOpacity
                style={[styles.switch, value && styles.switchActive]}
                onPress={() => onChange(!value)}
              >
                <View style={[styles.switchThumb, value && styles.switchThumbActive]} />
              </TouchableOpacity>
            )}
          />
        </View>

        <View style={styles.switchRow}>
          <View style={styles.switchLabelContainer}>
            <Ionicons name="ban-outline" size={20} color={Colors.gray[500]} />
            <Text style={styles.switchLabel}>Not Valid Above Store Discount</Text>
          </View>
          <Controller
            name="notValidAboveStoreDiscount"
            control={typedControl}
            render={({ field: { value, onChange } }) => (
              <TouchableOpacity
                style={[styles.switch, value && styles.switchActive]}
                onPress={() => onChange(!value)}
              >
                <View style={[styles.switchThumb, value && styles.switchThumbActive]} />
              </TouchableOpacity>
            )}
          />
        </View>

        <View style={styles.switchRow}>
          <View style={styles.switchLabelContainer}>
            <Ionicons name="document-text-outline" size={20} color={Colors.gray[500]} />
            <Text style={styles.switchLabel}>Single Voucher Per Bill</Text>
          </View>
          <Controller
            name="singleVoucherPerBill"
            control={typedControl}
            render={({ field: { value, onChange } }) => (
              <TouchableOpacity
                style={[styles.switch, value && styles.switchActive]}
                onPress={() => onChange(!value)}
              >
                <View style={[styles.switchThumb, value && styles.switchThumbActive]} />
              </TouchableOpacity>
            )}
          />
        </View>

        <View style={styles.switchRow}>
          <View style={styles.switchLabelContainer}>
            <Ionicons name="checkmark-circle-outline" size={20} color={Colors.gray[500]} />
            <Text style={styles.switchLabel}>Active</Text>
          </View>
          <Controller
            name="isActive"
            control={typedControl}
            render={({ field: { value, onChange } }) => (
              <TouchableOpacity
                style={[styles.switch, value && styles.switchActive]}
                onPress={() => onChange(!value)}
              >
                <View style={[styles.switchThumb, value && styles.switchThumbActive]} />
              </TouchableOpacity>
            )}
          />
        </View>

        <Text style={styles.sectionTitle}>Display Settings (Optional)</Text>
        <FormInput
          name="displayText"
          control={typedControl}
          label="Display Text"
          placeholder="e.g., Save 10% on your visit!"
          error={errors.displayText?.message}
        />

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit(onSubmit)}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={Colors.text.inverse} />
          ) : (
            <>
              <Ionicons name="save" size={20} color={Colors.text.inverse} />
              <Text style={styles.submitButtonText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete} disabled={deleting}>
          {deleting ? (
            <ActivityIndicator size="small" color={Colors.error[500]} />
          ) : (
            <>
              <Ionicons name="trash-outline" size={20} color={Colors.error[500]} />
              <Text style={styles.deleteButtonText}>Delete Voucher</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Alert Modal */}
      <ConfirmModal
        visible={alertModal.visible}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
        confirmText="OK"
        onConfirm={() => {
          if (alertModal.onConfirm) {
            alertModal.onConfirm();
          } else {
            setAlertModal({ ...alertModal, visible: false });
          }
        }}
        onCancel={() => setAlertModal({ ...alertModal, visible: false })}
      />

      {/* Confirmation Modal */}
      <ConfirmModal
        visible={confirmModal.visible}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ ...confirmModal, visible: false })}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.gray[800],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.gray[500],
  },
  storeInfo: {
    backgroundColor: Colors.background.primary,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  voucherCode: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8B5CF6',
    letterSpacing: 1,
  },
  storeName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray[800],
    marginBottom: 4,
  },
  usageStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  usageText: {
    fontSize: 14,
    color: Colors.gray[500],
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray[800],
    marginTop: 24,
    marginBottom: 12,
  },
  typeInfoCard: {
    flexDirection: 'row',
    backgroundColor: '#F3E8FF',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    gap: 12,
  },
  typeInfoContent: {
    flex: 1,
  },
  typeInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7C3AED',
    marginBottom: 4,
  },
  typeInfoText: {
    fontSize: 13,
    color: Colors.gray[500],
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
  },
  switchLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  switchLabel: {
    fontSize: 14,
    color: Colors.gray[700],
    flex: 1,
  },
  switch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.gray[300],
    justifyContent: 'center',
    padding: 2,
  },
  switchActive: {
    backgroundColor: '#8B5CF6',
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.background.primary,
  },
  switchThumbActive: {
    marginLeft: 22,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: Colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.error[50],
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.error[200],
  },
  deleteButtonText: {
    color: Colors.error[500],
    fontSize: 16,
    fontWeight: '600',
  },
});
