import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  TextInput,
  Switch,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import {
  serviceManagementService,
  ServiceCategory,
  MerchantService,
  CreateServiceData,
  UpdateServiceData,
} from '@/services/api/services';
import { uploadsService } from '@/services/api/uploads';
import { apiClient } from '@/services/api/client';
import { useStore } from '@/contexts/StoreContext';
import { Colors } from '@/constants/Colors';
import { isWeb, handleWebImageUpload } from '@/utils/platform';
import ErrorModal from '@/components/common/ErrorModal';
import SuccessModal from '@/components/common/SuccessModal';

const ACCENT = '#0EA5E9';

// Travel category slugs that show extra fields
const TRAVEL_SLUGS = ['flights', 'hotels', 'trains', 'bus', 'cab', 'packages'];
const ROUTE_SLUGS = ['flights', 'trains', 'bus']; // Categories that have from/to routes

const SERVICE_TYPE_OPTIONS: {
  label: string;
  value: 'store' | 'home' | 'online';
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { label: 'At Store', value: 'store', icon: 'storefront-outline' },
  { label: 'At Home', value: 'home', icon: 'home-outline' },
  { label: 'Online', value: 'online', icon: 'globe-outline' },
];

// ── Searchable Picker Modal ───────────────────────────────────────────────
interface PickerItem {
  id: string;
  label: string;
  subtitle?: string;
  badge?: string;
}

function SearchPickerModal({
  visible,
  title,
  items,
  selectedId,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  items: PickerItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (i) => i.label.toLowerCase().includes(q) || i.subtitle?.toLowerCase().includes(q)
    );
  }, [items, search]);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={pk.overlay}>
        <View style={pk.sheet}>
          <View style={pk.sheetHeader}>
            <Text style={pk.sheetTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={pk.closeBtn}>
              <Ionicons name="close" size={22} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <View style={pk.searchWrap}>
            <Ionicons name="search-outline" size={18} color="#9CA3AF" />
            <TextInput
              style={pk.searchInput}
              placeholder={`Search ${title.toLowerCase()}...`}
              placeholderTextColor="#9CA3AF"
              value={search}
              onChangeText={setSearch}
              autoFocus
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
          <FlatList
            data={filtered}
            keyExtractor={(i) => i.id}
            style={pk.list}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <View style={pk.empty}>
                <Ionicons name="search" size={32} color="#D1D5DB" />
                <Text style={pk.emptyText}>No results found</Text>
              </View>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[pk.item, selectedId === item.id && pk.itemActive]}
                onPress={() => {
                  onSelect(item.id);
                  onClose();
                  setSearch('');
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[pk.itemLabel, selectedId === item.id && pk.itemLabelActive]}>
                    {item.label}
                  </Text>
                  {item.subtitle && <Text style={pk.itemSub}>{item.subtitle}</Text>}
                </View>
                {item.badge && (
                  <View style={pk.badge}>
                    <Text style={pk.badgeText}>{item.badge}</Text>
                  </View>
                )}
                {selectedId === item.id && (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={ACCENT}
                    style={{ marginLeft: 8 }}
                  />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );
}

const pk = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.backgroundTertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: Colors.light.backgroundTertiary,
    borderRadius: 10,
    gap: 8,
    marginBottom: 8,
  },
  searchInput: { flex: 1, fontSize: 15, color: '#111827', padding: 0 },
  list: { maxHeight: 350 },
  empty: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyText: { fontSize: 14, color: '#9CA3AF' },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemActive: { backgroundColor: '#F0F9FF' },
  itemLabel: { fontSize: 15, color: Colors.light.textTertiary, fontWeight: '500' },
  itemLabelActive: { color: ACCENT, fontWeight: '600' },
  itemSub: { fontSize: 12, color: Colors.light.textMuted, marginTop: 2 },
  badge: { backgroundColor: '#F0F9FF', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontSize: 11, color: ACCENT, fontWeight: '600' },
});

// ── Main Component ────────────────────────────────────────────────────────

export default function AddEditServiceScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditMode = !!id;
  const { stores } = useStore();

  const [loading, setLoading] = useState(false);
  const [loadingService, setLoadingService] = useState(false);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Basic form
  const [name, setName] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [cashbackPercentage, setCashbackPercentage] = useState('');
  const [duration, setDuration] = useState('60');
  const [bufferTimeAfter, setBufferTimeAfter] = useState('0');
  const [serviceType, setServiceType] = useState<'store' | 'home' | 'online'>('store');
  const [maxBookingsPerSlot, setMaxBookingsPerSlot] = useState('1');
  const [requiresPaymentUpfront, setRequiresPaymentUpfront] = useState(true);
  const [freeCancellationHours, setFreeCancellationHours] = useState<number>(24);
  const [lateCancellationFee, setLateCancellationFee] = useState<'none' | 'partial' | 'full'>(
    'none'
  );
  const [tags, setTags] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [consultationFormId, setConsultationFormId] = useState('');
  const [consultationForms, setConsultationForms] = useState<{ _id: string; name: string }[]>([]);

  // Travel-specific fields
  const [routeFrom, setRouteFrom] = useState('');
  const [routeTo, setRouteTo] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [arrivalTime, setArrivalTime] = useState('');
  const [baggageCabin, setBaggageCabin] = useState('');
  const [baggageChecked, setBaggageChecked] = useState('');
  const [providerName, setProviderName] = useState('');
  const [classOptions, setClassOptions] = useState('');

  // Hotel-specific fields
  const [checkInTime, setCheckInTime] = useState('14:00');
  const [checkOutTime, setCheckOutTime] = useState('11:00');
  const [starRating, setStarRating] = useState('');
  const [roomTypes, setRoomTypes] = useState('');
  const [beds, setBeds] = useState('');
  const [roomSize, setRoomSize] = useState('');

  // Train-specific fields
  const [trainType, setTrainType] = useState('');
  const [trainNumber, setTrainNumber] = useState('');

  // Bus-specific fields
  const [busType, setBusType] = useState('');

  // Cab-specific fields
  const [cabType, setCabType] = useState('');
  const [vehicleOptions, setVehicleOptions] = useState('');

  // Package-specific fields
  const [destination, setDestination] = useState('');
  const [nights, setNights] = useState('');
  const [days, setDays] = useState('');
  const [inclusions, setInclusions] = useState('');
  const [mealPlan, setMealPlan] = useState('');

  // Staff pricing
  const [staffPricingEnabled, setStaffPricingEnabled] = useState(false);
  const [staffMembers, setStaffMembers] = useState<Array<{ _id: string; name: string }>>([]);
  const [staffPricing, setStaffPricing] = useState<
    Array<{ staffId: string; staffName: string; price: string }>
  >([]);
  const [loadingStaff, setLoadingStaff] = useState(false);

  // UI state
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showStorePicker, setShowStorePicker] = useState(false);
  const [showConsultationFormPicker, setShowConsultationFormPicker] = useState(false);
  const [errorModal, setErrorModal] = useState({ visible: false, title: '', message: '' });
  const [successModal, setSuccessModal] = useState({ visible: false, title: '', message: '' });

  // Derived state
  const selectedCategory = categories.find((c) => c._id === selectedCategoryId);
  const selectedCategorySlug = selectedCategory?.slug || '';
  const isTravelCategory = TRAVEL_SLUGS.includes(selectedCategorySlug);
  const isRouteCategory = ROUTE_SLUGS.includes(selectedCategorySlug);

  // Picker data
  const categoryPickerItems: PickerItem[] = categories.map((c) => ({
    id: c._id,
    label: `${c.icon || ''} ${c.name}`.trim(),
    subtitle: c.slug,
    badge: c.cashbackPercentage > 0 ? `${c.cashbackPercentage}% CB` : undefined,
  }));

  const storePickerItems: PickerItem[] = stores.map((s) => ({
    id: s._id,
    label: s.name,
    subtitle: (s as any).location?.city || (s as any).location?.area || undefined,
  }));

  const consultationFormPickerItems: PickerItem[] = consultationForms.map((f) => ({
    id: f._id,
    label: f.name,
  }));

  useEffect(() => {
    loadCategories();
    loadConsultationForms();
  }, []);
  useEffect(() => {
    if (isEditMode && id) loadService(id);
  }, [id]);
  useEffect(() => {
    if (stores.length === 1 && !selectedStoreId) setSelectedStoreId(stores[0]._id);
  }, [stores]);
  useEffect(() => {
    if (selectedCategoryId && categories.length > 0) {
      const cat = categories.find((c) => c._id === selectedCategoryId);
      if (cat && !cashbackPercentage) setCashbackPercentage(cat.cashbackPercentage.toString());
    }
  }, [selectedCategoryId, categories]);

  const loadCategories = async () => {
    try {
      setCategories(await serviceManagementService.getCategories());
    } catch (e) {
      if (__DEV__) console.error('Failed to load categories:', e);
    }
  };

  const loadConsultationForms = async () => {
    try {
      const response = await apiClient.get<any>('merchant/consultation-forms');
      if (response.success && response.data) {
        setConsultationForms(response.data.forms || response.data);
      }
    } catch (e) {
      if (__DEV__) console.error('Failed to load consultation forms:', e);
    }
  };

  const loadTeamForPricing = async () => {
    if (staffMembers.length > 0) return; // already loaded
    try {
      setLoadingStaff(true);
      const storeId = selectedStoreId || stores[0]?._id;
      const res = await apiClient.get<any>(`merchant/team?storeId=${storeId}&limit=50`);
      const members: Array<{ _id: string; name: string }> = res.data?.members || res.data || [];
      setStaffMembers(members);
      // Init pricing rows pre-filled with base price
      setStaffPricing(
        members.map((m) => ({ staffId: m._id, staffName: m.name, price: price || '' }))
      );
    } catch (e) {
      if (__DEV__) console.error('Failed to load team:', e);
    } finally {
      setLoadingStaff(false);
    }
  };

  const loadService = async (serviceId: string) => {
    setLoadingService(true);
    try {
      populateForm(await serviceManagementService.getServiceById(serviceId));
    } catch (e: any) {
      setErrorModal({
        visible: true,
        title: 'Error',
        message: e.message || 'Failed to load service',
      });
    } finally {
      setLoadingService(false);
    }
  };

  const populateForm = (service: MerchantService) => {
    setName(service.name || '');
    setShortDescription(service.shortDescription || '');
    setDescription(service.description || '');
    setSelectedCategoryId(
      typeof service.serviceCategory === 'string'
        ? service.serviceCategory
        : service.serviceCategory?._id || ''
    );
    setSelectedStoreId(
      typeof service.store === 'string' ? service.store : service.store?._id || ''
    );
    setPrice(service.pricing?.selling?.toString() || '');
    setOriginalPrice(service.pricing?.original?.toString() || '');
    setCashbackPercentage(service.cashback?.percentage?.toString() || '');
    setDuration(service.serviceDetails?.duration?.toString() || '60');
    setBufferTimeAfter((service.serviceDetails as any)?.bufferTimeAfter?.toString() || '0');
    setServiceType(service.serviceDetails?.serviceType || 'store');
    setMaxBookingsPerSlot(service.serviceDetails?.maxBookingsPerSlot?.toString() || '1');
    setRequiresPaymentUpfront(service.serviceDetails?.requiresPaymentUpfront ?? true);
    setFreeCancellationHours((service as any).cancellationPolicy?.freeCancellationHours || 24);
    setLateCancellationFee((service as any).cancellationPolicy?.lateCancellationFee || 'none');
    setTags(service.tags?.join(', ') || '');
    setIsFeatured(service.isFeatured || false);
    if (service.images?.length) {
      setImages(service.images);
      setImageUrls(service.images);
    }

    // Populate travel-specific fields from specifications
    const specs = (service as any).specifications || [];
    const getSpec = (key: string) => specs.find((s: any) => s.key === key)?.value || '';
    setRouteFrom(getSpec('routeFrom'));
    if (!getSpec('routeFrom') && getSpec('location')) setRouteFrom(getSpec('location'));
    setRouteTo(getSpec('routeTo'));
    setDepartureTime(getSpec('departureTime'));
    setArrivalTime(getSpec('arrivalTime'));
    setBaggageCabin(getSpec('baggageCabin'));
    setBaggageChecked(getSpec('baggageChecked'));
    setProviderName(getSpec('providerName'));
    setClassOptions(getSpec('classOptions'));
    // Hotel fields
    setCheckInTime(getSpec('checkInTime') || '14:00');
    setCheckOutTime(getSpec('checkOutTime') || '11:00');
    setStarRating(getSpec('starRating'));
    setRoomTypes(getSpec('roomTypes'));
    setBeds(getSpec('beds'));
    setRoomSize(getSpec('roomSize'));
    // Train fields
    setTrainType(getSpec('trainType'));
    setTrainNumber(getSpec('trainNumber'));
    // Bus fields
    setBusType(getSpec('busType'));
    // Cab fields
    setCabType(getSpec('cabType'));
    setVehicleOptions(getSpec('vehicleOptions'));
    // Package fields
    setDestination(getSpec('destination'));
    setNights(getSpec('nights'));
    setDays(getSpec('days'));
    setInclusions(getSpec('inclusions'));
    setMealPlan(getSpec('mealPlan'));
  };

  const pickImage = async () => {
    try {
      if (isWeb) {
        const webResults = await handleWebImageUpload();
        if (webResults?.[0]?.uri) {
          setImages((prev) => [...prev, webResults[0].uri]);
          await uploadImage(webResults[0].uri, webResults[0].file);
        }
      } else {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
        if (!result.canceled && result.assets[0]) {
          setImages((prev) => [...prev, result.assets[0].uri]);
          await uploadImage(result.assets[0].uri);
        }
      }
    } catch (e) {
      if (__DEV__) console.error('Error picking image:', e);
      setErrorModal({ visible: true, title: 'Error', message: 'Failed to pick image' });
    }
  };

  const uploadImage = async (uri: string, fileObject?: File) => {
    setUploadingImage(true);
    try {
      const filename = uri.split('/').pop() || `service-${Date.now()}.jpg`;
      const response = await uploadsService.uploadImage(uri, filename, 'general', fileObject);
      setImageUrls((prev) => [...prev, response.url]);
    } catch (e: any) {
      if (__DEV__) console.error('Error uploading image:', e);
      setErrorModal({
        visible: true,
        title: 'Error',
        message: e.message || 'Failed to upload image',
      });
      setImages((prev) => prev.filter((img) => img !== uri));
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const buildSpecifications = () => {
    const specs: Array<{ key: string; value: string }> = [];
    // Common travel fields (flights, trains, bus)
    if (routeFrom.trim()) specs.push({ key: 'routeFrom', value: routeFrom.trim() });
    if (selectedCategorySlug === 'hotels' && routeFrom.trim())
      specs.push({ key: 'location', value: routeFrom.trim() });
    if (routeTo.trim()) specs.push({ key: 'routeTo', value: routeTo.trim() });
    if (departureTime.trim()) specs.push({ key: 'departureTime', value: departureTime.trim() });
    if (arrivalTime.trim()) specs.push({ key: 'arrivalTime', value: arrivalTime.trim() });
    if (providerName.trim()) specs.push({ key: 'providerName', value: providerName.trim() });
    if (classOptions.trim()) specs.push({ key: 'classOptions', value: classOptions.trim() });
    // Flight-specific
    if (baggageCabin.trim()) specs.push({ key: 'baggageCabin', value: baggageCabin.trim() });
    if (baggageChecked.trim()) specs.push({ key: 'baggageChecked', value: baggageChecked.trim() });
    // Hotel-specific
    if (checkInTime.trim() && checkInTime !== '14:00')
      specs.push({ key: 'checkInTime', value: checkInTime.trim() });
    if (checkOutTime.trim() && checkOutTime !== '11:00')
      specs.push({ key: 'checkOutTime', value: checkOutTime.trim() });
    if (starRating.trim()) specs.push({ key: 'starRating', value: starRating.trim() });
    if (roomTypes.trim()) specs.push({ key: 'roomTypes', value: roomTypes.trim() });
    if (beds.trim()) specs.push({ key: 'beds', value: beds.trim() });
    if (roomSize.trim()) specs.push({ key: 'roomSize', value: roomSize.trim() });
    // Train-specific
    if (trainType.trim()) specs.push({ key: 'trainType', value: trainType.trim() });
    if (trainNumber.trim()) specs.push({ key: 'trainNumber', value: trainNumber.trim() });
    // Bus-specific
    if (busType.trim()) specs.push({ key: 'busType', value: busType.trim() });
    // Cab-specific
    if (cabType.trim()) specs.push({ key: 'cabType', value: cabType.trim() });
    if (vehicleOptions.trim()) specs.push({ key: 'vehicleOptions', value: vehicleOptions.trim() });
    // Package-specific
    if (destination.trim()) specs.push({ key: 'destination', value: destination.trim() });
    if (nights.trim()) specs.push({ key: 'nights', value: nights.trim() });
    if (days.trim()) specs.push({ key: 'days', value: days.trim() });
    if (inclusions.trim()) specs.push({ key: 'inclusions', value: inclusions.trim() });
    if (mealPlan.trim()) specs.push({ key: 'mealPlan', value: mealPlan.trim() });
    return specs;
  };

  const validateForm = (): string | null => {
    if (!name.trim()) return 'Service name is required';
    if (!selectedCategoryId) return 'Please select a category';
    if (!selectedStoreId) return 'Please select a store';
    if (!price || parseFloat(price) <= 0) return 'Price must be greater than 0';
    return null;
  };

  const handleSubmit = async () => {
    const err = validateForm();
    if (err) {
      setErrorModal({ visible: true, title: 'Validation Error', message: err });
      return;
    }

    setLoading(true);
    try {
      const serviceData: CreateServiceData = {
        name: name.trim(),
        description: description.trim() || undefined,
        shortDescription: shortDescription.trim() || undefined,
        serviceCategoryId: selectedCategoryId,
        storeId: selectedStoreId,
        price: parseFloat(price),
        originalPrice: originalPrice ? parseFloat(originalPrice) : undefined,
        duration: duration ? parseInt(duration) : 60,
        bufferTimeAfter: bufferTimeAfter ? parseInt(bufferTimeAfter) : 0,
        serviceType,
        maxBookingsPerSlot: maxBookingsPerSlot ? parseInt(maxBookingsPerSlot) : 1,
        requiresPaymentUpfront,
        cashbackPercentage: cashbackPercentage ? parseFloat(cashbackPercentage) : undefined,
        consultationFormId: consultationFormId || undefined,
        images: imageUrls.length > 0 ? imageUrls : undefined,
        tags: tags
          ? tags
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
          : undefined,
        isFeatured,
        specifications: buildSpecifications(),
        cancellationPolicy: {
          freeCancellationHours,
          lateCancellationFee,
          feePercentage:
            lateCancellationFee === 'partial' ? 50 : lateCancellationFee === 'full' ? 100 : 0,
        },
        staffPricing:
          staffPricingEnabled && staffPricing.length > 0
            ? staffPricing
                .filter((sp) => sp.price.trim() !== '')
                .map((sp) => ({
                  staffId: sp.staffId,
                  staffName: sp.staffName,
                  price: parseFloat(sp.price),
                }))
            : undefined,
      } as any;

      if (isEditMode && id) {
        await serviceManagementService.updateService(id, serviceData as UpdateServiceData);
        setSuccessModal({
          visible: true,
          title: 'Service Updated',
          message: 'Your service has been updated successfully.',
        });
      } else {
        await serviceManagementService.createService(serviceData);
        setSuccessModal({
          visible: true,
          title: 'Service Created',
          message: 'Your service has been created successfully.',
        });
      }
    } catch (e: any) {
      if (__DEV__) console.error('Error saving service:', e);
      setErrorModal({
        visible: true,
        title: 'Error',
        message: e.message || 'Failed to save service',
      });
    } finally {
      setLoading(false);
    }
  };

  const getSelectedCategoryName = () => {
    const cat = categories.find((c) => c._id === selectedCategoryId);
    return cat ? `${cat.icon || ''} ${cat.name}`.trim() : 'Select category';
  };

  const getSelectedStoreName = () =>
    stores.find((s) => s._id === selectedStoreId)?.name || 'Select store';

  if (loadingService) {
    return (
      <View style={[st.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={ACCENT} />
        <Text style={{ marginTop: 12, color: '#6B7280' }}>Loading service...</Text>
      </View>
    );
  }

  return (
    <View style={st.container}>
      <LinearGradient
        colors={[ACCENT, '#0284C7', '#F3F4F6']}
        locations={[0, 0.2, 0.5]}
        style={st.bgGrad}
      />
      <SafeAreaView style={st.safe} edges={['top']}>
        {/* Header */}
        <View style={st.header}>
          <TouchableOpacity onPress={() => router.back()} style={st.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={st.headerTitle}>{isEditMode ? 'Edit Service' : 'New Service'}</Text>
          <View style={{ width: 40 }} />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={st.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* ── Basic Info ───────────────────────────────── */}
            <View style={st.section}>
              <Text style={st.secTitle}>Basic Information</Text>
              <Field
                label="Service Name *"
                value={name}
                onChange={setName}
                placeholder="e.g. Delhi to Mumbai Flight"
              />
              <Field
                label="Short Description"
                value={shortDescription}
                onChange={setShortDescription}
                placeholder="Brief summary"
              />
              <Field
                label="Description"
                value={description}
                onChange={setDescription}
                placeholder="Detailed description..."
                multiline
              />
            </View>

            {/* ── Category & Store ─────────────────────────── */}
            <View style={st.section}>
              <Text style={st.secTitle}>Category & Store</Text>

              <View style={st.inputGroup}>
                <Text style={st.label}>Service Category *</Text>
                <TouchableOpacity style={st.selectBtn} onPress={() => setShowCategoryPicker(true)}>
                  <Text style={[st.selectText, !selectedCategoryId && { color: '#9CA3AF' }]}>
                    {getSelectedCategoryName()}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <View style={st.inputGroup}>
                <Text style={st.label}>Store *</Text>
                <TouchableOpacity style={st.selectBtn} onPress={() => setShowStorePicker(true)}>
                  <Text style={[st.selectText, !selectedStoreId && { color: '#9CA3AF' }]}>
                    {getSelectedStoreName()}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>

            {/* ── Pricing ──────────────────────────────────── */}
            <View style={st.section}>
              <Text style={st.secTitle}>Pricing</Text>
              <View style={st.row}>
                <View style={[st.inputGroup, { flex: 1 }]}>
                  <Text style={st.label}>Selling Price *</Text>
                  <TextInput
                    style={st.input}
                    value={price}
                    onChangeText={setPrice}
                    placeholder="0"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                  />
                </View>
                <View style={[st.inputGroup, { flex: 1, marginLeft: 12 }]}>
                  <Text style={st.label}>Original Price</Text>
                  <TextInput
                    style={st.input}
                    value={originalPrice}
                    onChangeText={setOriginalPrice}
                    placeholder="Optional"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                  />
                </View>
              </View>
              <View style={st.inputGroup}>
                <Text style={st.label}>Cashback %</Text>
                <TextInput
                  style={st.input}
                  value={cashbackPercentage}
                  onChangeText={setCashbackPercentage}
                  placeholder="Auto-filled from category"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
                {selectedCategory && (
                  <Text style={st.hint}>
                    Category default: {selectedCategory.cashbackPercentage}%
                  </Text>
                )}
              </View>
            </View>

            {/* ── Staff Pricing ─────────────────────────────── */}
            <View style={st.section}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 4,
                }}
              >
                <Text style={st.secTitle}>Staff Pricing</Text>
                <Switch
                  value={staffPricingEnabled}
                  onValueChange={(v) => {
                    setStaffPricingEnabled(v);
                    if (v) loadTeamForPricing();
                  }}
                  trackColor={{ false: '#d1d5db', true: ACCENT }}
                  thumbColor={staffPricingEnabled ? '#fff' : '#f4f4f4'}
                />
              </View>
              {staffPricingEnabled && (
                <>
                  <Text style={st.hint}>Leave blank to use base price</Text>
                  {loadingStaff ? (
                    <ActivityIndicator size="small" color={ACCENT} style={{ marginTop: 8 }} />
                  ) : staffMembers.length === 0 ? (
                    <Text style={st.hint}>No team members found. Add staff in Team settings.</Text>
                  ) : (
                    staffPricing.map((sp, idx) => (
                      <View
                        key={sp.staffId}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 10,
                          marginTop: 8,
                        }}
                      >
                        <Text style={[st.label, { flex: 1, marginBottom: 0 }]}>{sp.staffName}</Text>
                        <TextInput
                          style={[st.input, { width: 100 }]}
                          placeholder={price || 'Base price'}
                          placeholderTextColor="#9CA3AF"
                          keyboardType="numeric"
                          value={sp.price}
                          onChangeText={(v) =>
                            setStaffPricing((prev) => {
                              const copy = [...prev];
                              copy[idx] = { ...copy[idx], price: v };
                              return copy;
                            })
                          }
                        />
                      </View>
                    ))
                  )}
                </>
              )}
            </View>

            {/* ── Travel Details (conditional) ─────────────── */}
            {isTravelCategory && (
              <View style={st.section}>
                <View style={st.secTitleRow}>
                  <Ionicons
                    name={
                      selectedCategorySlug === 'flights'
                        ? 'airplane'
                        : selectedCategorySlug === 'hotels'
                          ? 'bed'
                          : selectedCategorySlug === 'trains'
                            ? 'train'
                            : selectedCategorySlug === 'bus'
                              ? 'bus'
                              : selectedCategorySlug === 'cab'
                                ? 'car'
                                : 'map'
                    }
                    size={20}
                    color={ACCENT}
                  />
                  <Text style={st.secTitle}>
                    {selectedCategorySlug === 'hotels'
                      ? 'Hotel Details'
                      : selectedCategorySlug === 'packages'
                        ? 'Package Details'
                        : 'Travel Details'}
                  </Text>
                </View>

                {/* Route fields - flights, trains, bus */}
                {isRouteCategory && (
                  <>
                    <View style={st.row}>
                      <View style={[st.inputGroup, { flex: 1 }]}>
                        <Text style={st.label}>From City *</Text>
                        <TextInput
                          style={st.input}
                          value={routeFrom}
                          onChangeText={setRouteFrom}
                          placeholder="e.g. Delhi"
                          placeholderTextColor="#9CA3AF"
                        />
                      </View>
                      <View style={[st.inputGroup, { flex: 1, marginLeft: 12 }]}>
                        <Text style={st.label}>To City *</Text>
                        <TextInput
                          style={st.input}
                          value={routeTo}
                          onChangeText={setRouteTo}
                          placeholder="e.g. Mumbai"
                          placeholderTextColor="#9CA3AF"
                        />
                      </View>
                    </View>
                    <View style={st.row}>
                      <View style={[st.inputGroup, { flex: 1 }]}>
                        <Text style={st.label}>Departure Time</Text>
                        <TextInput
                          style={st.input}
                          value={departureTime}
                          onChangeText={setDepartureTime}
                          placeholder="e.g. 09:00"
                          placeholderTextColor="#9CA3AF"
                        />
                      </View>
                      <View style={[st.inputGroup, { flex: 1, marginLeft: 12 }]}>
                        <Text style={st.label}>Arrival Time</Text>
                        <TextInput
                          style={st.input}
                          value={arrivalTime}
                          onChangeText={setArrivalTime}
                          placeholder="e.g. 11:30"
                          placeholderTextColor="#9CA3AF"
                        />
                      </View>
                    </View>
                  </>
                )}

                {/* Cab route fields */}
                {selectedCategorySlug === 'cab' && (
                  <>
                    <View style={st.row}>
                      <View style={[st.inputGroup, { flex: 1 }]}>
                        <Text style={st.label}>Pickup Location</Text>
                        <TextInput
                          style={st.input}
                          value={routeFrom}
                          onChangeText={setRouteFrom}
                          placeholder="e.g. Airport"
                          placeholderTextColor="#9CA3AF"
                        />
                      </View>
                      <View style={[st.inputGroup, { flex: 1, marginLeft: 12 }]}>
                        <Text style={st.label}>Drop Location</Text>
                        <TextInput
                          style={st.input}
                          value={routeTo}
                          onChangeText={setRouteTo}
                          placeholder="e.g. City Center"
                          placeholderTextColor="#9CA3AF"
                        />
                      </View>
                    </View>
                    <Field
                      label="Cab Type"
                      value={cabType}
                      onChange={setCabType}
                      placeholder="e.g. Outstation, Airport Transfer, City Ride"
                    />
                    <Field
                      label="Vehicle Options"
                      value={vehicleOptions}
                      onChange={setVehicleOptions}
                      placeholder="e.g. Sedan, SUV, Premium"
                    />
                  </>
                )}

                {/* Common provider field for all travel categories */}
                <Field
                  label="Provider / Brand Name"
                  value={providerName}
                  onChange={setProviderName}
                  placeholder={
                    selectedCategorySlug === 'flights'
                      ? 'e.g. IndiGo, Vistara'
                      : selectedCategorySlug === 'hotels'
                        ? 'e.g. Taj Hotels, OYO'
                        : selectedCategorySlug === 'trains'
                          ? 'e.g. Indian Railways'
                          : selectedCategorySlug === 'cab'
                            ? 'e.g. Uber, Ola'
                            : 'e.g. MakeMyTrip'
                  }
                />

                {/* Flight-specific fields */}
                {selectedCategorySlug === 'flights' && (
                  <>
                    <View style={st.row}>
                      <View style={[st.inputGroup, { flex: 1 }]}>
                        <Text style={st.label}>Cabin Baggage</Text>
                        <TextInput
                          style={st.input}
                          value={baggageCabin}
                          onChangeText={setBaggageCabin}
                          placeholder="e.g. 7 kg"
                          placeholderTextColor="#9CA3AF"
                        />
                      </View>
                      <View style={[st.inputGroup, { flex: 1, marginLeft: 12 }]}>
                        <Text style={st.label}>Check-in Baggage</Text>
                        <TextInput
                          style={st.input}
                          value={baggageChecked}
                          onChangeText={setBaggageChecked}
                          placeholder="e.g. 15 kg"
                          placeholderTextColor="#9CA3AF"
                        />
                      </View>
                    </View>
                    <Field
                      label="Class Options"
                      value={classOptions}
                      onChange={setClassOptions}
                      placeholder="e.g. Economy, Business, First"
                    />
                  </>
                )}

                {/* Hotel-specific fields */}
                {selectedCategorySlug === 'hotels' && (
                  <>
                    <Field
                      label="Location / City"
                      value={routeFrom}
                      onChange={setRouteFrom}
                      placeholder="e.g. Goa, Mumbai"
                    />
                    <View style={st.row}>
                      <View style={[st.inputGroup, { flex: 1 }]}>
                        <Text style={st.label}>Check-in Time</Text>
                        <TextInput
                          style={st.input}
                          value={checkInTime}
                          onChangeText={setCheckInTime}
                          placeholder="14:00"
                          placeholderTextColor="#9CA3AF"
                        />
                      </View>
                      <View style={[st.inputGroup, { flex: 1, marginLeft: 12 }]}>
                        <Text style={st.label}>Check-out Time</Text>
                        <TextInput
                          style={st.input}
                          value={checkOutTime}
                          onChangeText={setCheckOutTime}
                          placeholder="11:00"
                          placeholderTextColor="#9CA3AF"
                        />
                      </View>
                    </View>
                    <View style={st.row}>
                      <View style={[st.inputGroup, { flex: 1 }]}>
                        <Text style={st.label}>Star Rating</Text>
                        <TextInput
                          style={st.input}
                          value={starRating}
                          onChangeText={setStarRating}
                          placeholder="e.g. 3, 4, 5"
                          placeholderTextColor="#9CA3AF"
                          keyboardType="numeric"
                        />
                      </View>
                      <View style={[st.inputGroup, { flex: 1, marginLeft: 12 }]}>
                        <Text style={st.label}>Room Size</Text>
                        <TextInput
                          style={st.input}
                          value={roomSize}
                          onChangeText={setRoomSize}
                          placeholder="e.g. 25 sqm"
                          placeholderTextColor="#9CA3AF"
                        />
                      </View>
                    </View>
                    <Field
                      label="Bed Type"
                      value={beds}
                      onChange={setBeds}
                      placeholder="e.g. 1 King Bed, 2 Single Beds"
                    />
                    <Field
                      label="Room Types"
                      value={roomTypes}
                      onChange={setRoomTypes}
                      placeholder="e.g. Standard, Deluxe, Suite"
                    />
                  </>
                )}

                {/* Train-specific fields */}
                {selectedCategorySlug === 'trains' && (
                  <>
                    <View style={st.row}>
                      <View style={[st.inputGroup, { flex: 1 }]}>
                        <Text style={st.label}>Train Type</Text>
                        <TextInput
                          style={st.input}
                          value={trainType}
                          onChangeText={setTrainType}
                          placeholder="e.g. Rajdhani, Shatabdi"
                          placeholderTextColor="#9CA3AF"
                        />
                      </View>
                      <View style={[st.inputGroup, { flex: 1, marginLeft: 12 }]}>
                        <Text style={st.label}>Train Number</Text>
                        <TextInput
                          style={st.input}
                          value={trainNumber}
                          onChangeText={setTrainNumber}
                          placeholder="e.g. 12952"
                          placeholderTextColor="#9CA3AF"
                        />
                      </View>
                    </View>
                    <Field
                      label="Class Options"
                      value={classOptions}
                      onChange={setClassOptions}
                      placeholder="e.g. Sleeper, AC3, AC2, AC1"
                    />
                  </>
                )}

                {/* Bus-specific fields */}
                {selectedCategorySlug === 'bus' && (
                  <>
                    <Field
                      label="Bus Type"
                      value={busType}
                      onChange={setBusType}
                      placeholder="e.g. Volvo AC Sleeper, Seater, Semi-Sleeper"
                    />
                    <Field
                      label="Class Options"
                      value={classOptions}
                      onChange={setClassOptions}
                      placeholder="e.g. Seater, Sleeper, Semi-Sleeper, AC"
                    />
                  </>
                )}

                {/* Package-specific fields */}
                {selectedCategorySlug === 'packages' && (
                  <>
                    <Field
                      label="Destination"
                      value={destination}
                      onChange={setDestination}
                      placeholder="e.g. Goa, Kerala, Rajasthan"
                    />
                    <View style={st.row}>
                      <View style={[st.inputGroup, { flex: 1 }]}>
                        <Text style={st.label}>Nights</Text>
                        <TextInput
                          style={st.input}
                          value={nights}
                          onChangeText={setNights}
                          placeholder="e.g. 3"
                          placeholderTextColor="#9CA3AF"
                          keyboardType="numeric"
                        />
                      </View>
                      <View style={[st.inputGroup, { flex: 1, marginLeft: 12 }]}>
                        <Text style={st.label}>Days</Text>
                        <TextInput
                          style={st.input}
                          value={days}
                          onChangeText={setDays}
                          placeholder="e.g. 4"
                          placeholderTextColor="#9CA3AF"
                          keyboardType="numeric"
                        />
                      </View>
                    </View>
                    <Field
                      label="Inclusions"
                      value={inclusions}
                      onChange={setInclusions}
                      placeholder="e.g. Hotel, Meals, Transport, Sightseeing"
                    />
                    <Field
                      label="Meal Plan"
                      value={mealPlan}
                      onChange={setMealPlan}
                      placeholder="e.g. Breakfast, Half Board, Full Board"
                    />
                    <Field
                      label="Accommodation Types"
                      value={roomTypes}
                      onChange={setRoomTypes}
                      placeholder="e.g. Standard, Deluxe, Luxury"
                    />
                  </>
                )}

                {/* Travel tip */}
                <View style={st.travelTip}>
                  <Ionicons name="information-circle" size={16} color="#0EA5E9" />
                  <Text style={st.travelTipText}>
                    {selectedCategorySlug === 'flights'
                      ? 'Include route in the service name (e.g. "Delhi to Mumbai Flight") for best results on the consumer app.'
                      : selectedCategorySlug === 'hotels'
                        ? 'Add location, star rating, and room details for better visibility.'
                        : selectedCategorySlug === 'trains'
                          ? 'Include train name and route (e.g. "Delhi to Mumbai Rajdhani Express").'
                          : selectedCategorySlug === 'bus'
                            ? 'Include route and bus type (e.g. "Delhi to Jaipur Volvo AC Sleeper").'
                            : selectedCategorySlug === 'cab'
                              ? 'Specify cab type and route for better discoverability.'
                              : selectedCategorySlug === 'packages'
                                ? 'Include destination and duration (e.g. "Goa 3N/4D Package").'
                                : 'Add relevant travel details to help customers find your service.'}
                  </Text>
                </View>
              </View>
            )}

            {/* ── Service Details ──────────────────────────── */}
            <View style={st.section}>
              <Text style={st.secTitle}>Service Details</Text>

              <View style={st.inputGroup}>
                <Text style={st.label}>Service Type</Text>
                <View style={st.chipRow}>
                  {SERVICE_TYPE_OPTIONS.map((opt) => (
                    <TouchableOpacity
                      key={opt.value}
                      style={[st.chip, serviceType === opt.value && st.chipActive]}
                      onPress={() => setServiceType(opt.value)}
                    >
                      <Ionicons
                        name={opt.icon}
                        size={16}
                        color={serviceType === opt.value ? '#FFF' : '#6B7280'}
                      />
                      <Text style={[st.chipText, serviceType === opt.value && st.chipTextActive]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={st.row}>
                <View style={[st.inputGroup, { flex: 1 }]}>
                  <Text style={st.label}>Duration (mins)</Text>
                  <TextInput
                    style={st.input}
                    value={duration}
                    onChangeText={setDuration}
                    placeholder="60"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                  />
                </View>
                <View style={[st.inputGroup, { flex: 1, marginLeft: 12 }]}>
                  <Text style={st.label}>Max Bookings/Slot</Text>
                  <TextInput
                    style={st.input}
                    value={maxBookingsPerSlot}
                    onChangeText={setMaxBookingsPerSlot}
                    placeholder="1"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={st.inputGroup}>
                <Text style={st.label}>Buffer / Cleanup Time (mins)</Text>
                <Text style={st.hint}>
                  Time after the appointment for cleanup or processing (e.g. hair dye processing)
                </Text>
                <View style={st.chipGroup}>
                  {[0, 5, 10, 15, 20, 30, 45, 60].map((mins) => (
                    <TouchableOpacity
                      key={mins}
                      style={[st.chip, bufferTimeAfter === String(mins) && st.chipActive]}
                      onPress={() => setBufferTimeAfter(String(mins))}
                    >
                      <Text
                        style={[st.chipText, bufferTimeAfter === String(mins) && st.chipTextActive]}
                      >
                        {mins === 0 ? 'None' : `${mins}m`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={st.inputGroup}>
                <Text style={st.label}>Consultation Form</Text>
                <TouchableOpacity
                  style={st.pickerBtn}
                  onPress={() => setShowConsultationFormPicker(true)}
                >
                  <Text style={[st.pickerBtnText, !consultationFormId && st.pickerBtnPlaceholder]}>
                    {consultationForms.find((f) => f._id === consultationFormId)?.name ||
                      'Select consultation form...'}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              </View>

              <View style={st.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={st.switchLabel}>Requires Payment Upfront</Text>
                  <Text style={st.switchHint}>Recommended for travel bookings</Text>
                </View>
                <Switch
                  value={requiresPaymentUpfront}
                  onValueChange={setRequiresPaymentUpfront}
                  trackColor={{ false: '#D1D5DB', true: ACCENT }}
                  thumbColor="#FFF"
                />
              </View>

              {/* Cancellation Policy */}
              <View style={{ height: 12 }} />
              <Text style={st.secTitle}>Cancellation Policy</Text>

              <View style={st.fieldRow}>
                <Text style={st.label}>Free cancellation window</Text>
                <View style={st.radioGroup}>
                  {[0, 2, 12, 24, 48].map((hours) => (
                    <TouchableOpacity
                      key={hours}
                      style={[st.radioBtn, freeCancellationHours === hours && st.radioBtnActive]}
                      onPress={() => setFreeCancellationHours(hours)}
                    >
                      <Text
                        style={freeCancellationHours === hours ? st.radioTextActive : st.radioText}
                      >
                        {hours === 0 ? 'No refund' : `${hours}h`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={st.fieldRow}>
                <Text style={st.label}>Late cancellation fee</Text>
                <View style={st.radioGroup}>
                  {(['none', 'partial', 'full'] as const).map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[st.radioBtn, lateCancellationFee === type && st.radioBtnActive]}
                      onPress={() => setLateCancellationFee(type)}
                    >
                      <Text
                        style={lateCancellationFee === type ? st.radioTextActive : st.radioText}
                      >
                        {type === 'none' ? 'None' : type === 'partial' ? '50%' : 'Full'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={st.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={st.switchLabel}>Featured Service</Text>
                  <Text style={st.switchHint}>Highlight in search results</Text>
                </View>
                <Switch
                  value={isFeatured}
                  onValueChange={setIsFeatured}
                  trackColor={{ false: '#D1D5DB', true: ACCENT }}
                  thumbColor="#FFF"
                />
              </View>
            </View>

            {/* ── Images ───────────────────────────────────── */}
            <View style={st.section}>
              <Text style={st.secTitle}>Images</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ flexDirection: 'row' }}
              >
                {images.map((uri, i) => (
                  <View key={i} style={st.imgWrap}>
                    <Image source={{ uri }} style={st.imgPreview} />
                    <TouchableOpacity style={st.imgRemove} onPress={() => removeImage(i)}>
                      <Ionicons name="close-circle" size={24} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity style={st.imgAdd} onPress={pickImage} disabled={uploadingImage}>
                  {uploadingImage ? (
                    <ActivityIndicator color={ACCENT} />
                  ) : (
                    <>
                      <Ionicons name="add-circle-outline" size={32} color={ACCENT} />
                      <Text style={st.imgAddText}>Add Image</Text>
                    </>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>

            {/* ── Tags ─────────────────────────────────────── */}
            <View style={st.section}>
              <Text style={st.secTitle}>Tags</Text>
              <Field
                label=""
                value={tags}
                onChange={setTags}
                placeholder="flight, travel, domestic (comma separated)"
              />
            </View>

            {/* ── Action Buttons ────────────────────────────── */}
            <View style={st.actions}>
              <TouchableOpacity
                style={st.cancelBtn}
                onPress={() => router.back()}
                disabled={loading}
              >
                <Text style={st.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={st.submitBtn} onPress={handleSubmit} disabled={loading}>
                <LinearGradient
                  colors={[ACCENT, '#0284C7']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={st.submitBtnGrad}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <>
                      <Ionicons
                        name={isEditMode ? 'checkmark-circle' : 'add-circle'}
                        size={20}
                        color="#FFF"
                      />
                      <Text style={st.submitBtnText}>
                        {isEditMode ? 'Update Service' : 'Create Service'}
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Picker Modals */}
      <SearchPickerModal
        visible={showCategoryPicker}
        title="Select Category"
        items={categoryPickerItems}
        selectedId={selectedCategoryId}
        onSelect={setSelectedCategoryId}
        onClose={() => setShowCategoryPicker(false)}
      />
      <SearchPickerModal
        visible={showStorePicker}
        title="Select Store"
        items={storePickerItems}
        selectedId={selectedStoreId}
        onSelect={setSelectedStoreId}
        onClose={() => setShowStorePicker(false)}
      />
      <SearchPickerModal
        visible={showConsultationFormPicker}
        title="Select Consultation Form"
        items={consultationFormPickerItems}
        selectedId={consultationFormId}
        onSelect={setConsultationFormId}
        onClose={() => setShowConsultationFormPicker(false)}
      />

      <ErrorModal
        visible={errorModal.visible}
        title={errorModal.title}
        message={errorModal.message}
        onClose={() => setErrorModal({ visible: false, title: '', message: '' })}
      />
      <SuccessModal
        visible={successModal.visible}
        title={successModal.title}
        message={successModal.message}
        onClose={() => {
          setSuccessModal({ visible: false, title: '', message: '' });
          router.back();
        }}
      />
    </View>
  );
}

// ── Reusable Field ────────────────────────────────────────────────────────
function Field({
  label,
  value,
  onChange,
  placeholder,
  multiline,
  keyboardType,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: 'numeric' | 'default';
}) {
  return (
    <View style={st.inputGroup}>
      {label ? <Text style={st.label}>{label}</Text> : null}
      <TextInput
        style={[st.input, multiline && st.textArea]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        keyboardType={keyboardType}
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FE' },
  bgGrad: { position: 'absolute', left: 0, right: 0, top: 0, height: 200 },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#FFF' },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 100 },
  section: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  secTitle: { fontSize: 18, fontWeight: '700', color: Colors.light.textDark, marginBottom: 16 },
  secTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.light.textTertiary, marginBottom: 8 },
  input: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  hint: { fontSize: 12, color: Colors.light.textMuted, marginTop: 4 },
  selectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.light.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  selectText: { fontSize: 16, color: Colors.light.textDark, flex: 1 },
  row: { flexDirection: 'row' },
  chipRow: { flexDirection: 'row', gap: 10 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.backgroundSecondary,
    gap: 6,
  },
  chipGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  chipActive: { backgroundColor: ACCENT, borderColor: ACCENT },
  chipText: { fontSize: 14, color: Colors.light.textSecondary, fontWeight: '500' },
  chipTextActive: { color: '#FFF' },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  switchLabel: { fontSize: 16, fontWeight: '500', color: '#374151' },
  switchHint: { fontSize: 12, color: Colors.light.textMuted, marginTop: 2 },
  fieldRow: { marginBottom: 16 },
  radioGroup: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  radioBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F3F4F6',
  },
  radioBtnActive: { backgroundColor: ACCENT, borderColor: ACCENT },
  radioText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  radioTextActive: { color: '#FFF', fontWeight: '600' },
  imgWrap: { width: 100, height: 100, borderRadius: 12, marginRight: 10, overflow: 'hidden' },
  imgPreview: { width: '100%', height: '100%', resizeMode: 'cover' },
  imgRemove: { position: 'absolute', top: 2, right: 2, backgroundColor: '#FFF', borderRadius: 12 },
  imgAdd: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.light.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imgAddText: { fontSize: 12, color: ACCENT, marginTop: 4, fontWeight: '500' },
  travelTip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F0F9FF',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0F2FE',
  },
  travelTipText: { flex: 1, fontSize: 12, color: '#0369A1', lineHeight: 18 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 8, marginBottom: 32 },
  cancelBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFF',
  },
  cancelBtnText: { fontSize: 16, fontWeight: '600', color: '#6B7280' },
  submitBtn: { flex: 2, borderRadius: 12, overflow: 'hidden' },
  submitBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  submitBtnText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.light.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  pickerBtnText: { fontSize: 16, color: Colors.light.textDark, flex: 1 },
  pickerBtnPlaceholder: { color: '#9CA3AF' },
});
