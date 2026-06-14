import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import {
  socialImpactAdminService,
  UpdateEventData,
  Sponsor,
  SocialImpactEvent,
} from '@/services/api/socialImpact';
import { BRAND } from '@/constants/brand';
import { uploadsService } from '@/services/api/uploads';
import { isWeb, handleWebImageUpload } from '@/utils/platform';
import ErrorModal from '@/components/common/ErrorModal';
import SuccessModal from '@/components/common/SuccessModal';

// Event types
const EVENT_TYPES = [
  { value: 'blood-donation', label: 'Blood Donation', emoji: '🩸' },
  { value: 'tree-plantation', label: 'Tree Plantation', emoji: '🌳' },
  { value: 'beach-cleanup', label: 'Beach Cleanup', emoji: '🏖️' },
  { value: 'digital-literacy', label: 'Digital Literacy', emoji: '💻' },
  { value: 'food-drive', label: 'Food Drive', emoji: '🍛' },
  { value: 'health-camp', label: 'Health Camp', emoji: '🏥' },
  { value: 'skill-training', label: 'Skill Training', emoji: '👩‍💼' },
  { value: 'women-empowerment', label: 'Women Empowerment', emoji: '👩‍💼' },
  { value: 'education', label: 'Education', emoji: '📚' },
  { value: 'environment', label: 'Environment', emoji: '🌍' },
];

export default function EditEventScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  // Loading state
  const [initialLoading, setInitialLoading] = useState(true);
  const [event, setEvent] = useState<SocialImpactEvent | null>(null);

  // Sponsors
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loadingSponsors, setLoadingSponsors] = useState(true);

  // Form state - Basic
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState('');
  const [selectedSponsorId, setSelectedSponsorId] = useState<string | null>(null);

  // Organizer
  const [organizerName, setOrganizerName] = useState('');
  const [organizerLogo, setOrganizerLogo] = useState('');

  // Location
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');

  // Date & Time
  const [eventDate, setEventDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startTime, setStartTime] = useState('09:00 AM');
  const [endTime, setEndTime] = useState('05:00 PM');

  // Rewards
  const [rezCoins, setRezCoins] = useState('100');
  const [brandCoins, setBrandCoins] = useState('150');

  // Capacity
  const [capacityGoal, setCapacityGoal] = useState('100');

  // Impact
  const [impactDescription, setImpactDescription] = useState('');
  const [impactMetric, setImpactMetric] = useState('');
  const [impactTargetValue, setImpactTargetValue] = useState('');

  // Contact
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  // Requirements (simple string, will be split)
  const [requirementsText, setRequirementsText] = useState('');

  // Benefits (simple string, will be split)
  const [benefitsText, setBenefitsText] = useState('');

  // Options
  const [isCsrActivity, setIsCsrActivity] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);

  // Image
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Verification config
  const [verificationMethods, setVerificationMethods] = useState<string[]>(['manual']);
  const [geoFenceRadius, setGeoFenceRadius] = useState('500');
  const [requireCheckIn, setRequireCheckIn] = useState(true);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [errorModal, setErrorModal] = useState({ visible: false, title: '', message: '' });
  const [successModal, setSuccessModal] = useState({ visible: false, title: '', message: '' });

  // Load event and sponsors
  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setInitialLoading(true);
      const [eventData, sponsorsResponse] = await Promise.all([
        socialImpactAdminService.getEventById(id!),
        socialImpactAdminService.getSponsors(),
      ]);

      setEvent(eventData);
      setSponsors(sponsorsResponse.sponsors.filter((s: Sponsor) => s.isActive));
      populateForm(eventData);
    } catch (error) {
      setErrorModal({
        visible: true,
        title: 'Error',
        message: error.message || 'Failed to load event data',
      });
    } finally {
      setInitialLoading(false);
      setLoadingSponsors(false);
    }
  };

  const populateForm = (eventData: SocialImpactEvent) => {
    setName(eventData.name || '');
    setDescription(eventData.description || '');
    setEventType(eventData.eventType || '');
    setSelectedSponsorId(eventData.sponsor?._id || null);

    // Organizer
    setOrganizerName(eventData.organizer?.name || '');
    setOrganizerLogo(eventData.organizer?.logo || '');

    // Location
    setAddress(eventData.location?.address || '');
    setCity(eventData.location?.city || '');

    // Date & Time
    if (eventData.eventDate) {
      setEventDate(new Date(eventData.eventDate));
    }
    setStartTime(eventData.eventTime?.start || '09:00 AM');
    setEndTime(eventData.eventTime?.end || '05:00 PM');

    // Rewards
    setRezCoins(String(eventData.rewards?.rezCoins || 100));
    setBrandCoins(String(eventData.rewards?.brandCoins || 150));

    // Capacity
    setCapacityGoal(String(eventData.capacity?.goal || 100));

    // Impact
    setImpactDescription(eventData.impact?.description || '');
    setImpactMetric(eventData.impact?.metric || '');
    setImpactTargetValue(String(eventData.impact?.targetValue || ''));

    // Contact
    setContactPhone(eventData.contact?.phone || '');
    setContactEmail(eventData.contact?.email || '');

    // Requirements - convert array back to text
    if (eventData.eventRequirements && eventData.eventRequirements.length > 0) {
      const reqText = eventData.eventRequirements
        .map((r) => (r.isMandatory ? `*${r.text}` : r.text))
        .join('\n');
      setRequirementsText(reqText);
    }

    // Benefits - convert array back to text
    if (eventData.benefits && eventData.benefits.length > 0) {
      setBenefitsText(eventData.benefits.join('\n'));
    }

    // Options
    setIsCsrActivity(eventData.isCsrActivity !== false);
    setIsFeatured(eventData.featured === true);

    // Image
    if (eventData.image) {
      setExistingImageUrl(eventData.image);
      setImageUrl(eventData.image);
      setImageUri(eventData.image); // Show existing image
    }

    // Verification config
    if (eventData.verificationConfig) {
      setVerificationMethods(eventData.verificationConfig.methods || ['manual']);
      setGeoFenceRadius(String(eventData.verificationConfig.geoFenceRadiusMeters || 500));
      setRequireCheckIn(eventData.verificationConfig.requireCheckInBeforeComplete !== false);
    }
    if (eventData.location?.coordinates) {
      setLatitude(String(eventData.location.coordinates.lat || ''));
      setLongitude(String(eventData.location.coordinates.lng || ''));
    }
  };

  // Pick and upload image
  const pickImage = async () => {
    try {
      let result;

      if (isWeb) {
        const webImages = await handleWebImageUpload();
        if (webImages.length > 0) {
          result = {
            assets: [{ uri: webImages[0].uri, file: webImages[0].file }],
            canceled: false,
          };
        } else {
          return;
        }
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [16, 9],
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets?.[0]) {
        const uri = result.assets[0].uri;
        const file = (result.assets[0] as { file?: File }).file;
        setImageUri(uri);
        await uploadImage(uri, file);
      }
    } catch (error) {
      setErrorModal({
        visible: true,
        title: 'Error',
        message: error.message || 'Failed to pick image',
      });
    }
  };

  const uploadImage = async (uri: string, fileObject?: File) => {
    setUploadingImage(true);
    try {
      const filename = uri.split('/').pop() || `event-${Date.now()}.jpg`;
      const response = await uploadsService.uploadImage(uri, filename, 'general', fileObject);
      setImageUrl(response.url);
    } catch (error) {
      setErrorModal({
        visible: true,
        title: 'Upload Error',
        message: error.message || 'Failed to upload image',
      });
      // Restore existing image on error
      if (existingImageUrl) {
        setImageUri(existingImageUrl);
        setImageUrl(existingImageUrl);
      } else {
        setImageUri(null);
      }
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = () => {
    setImageUri(null);
    setImageUrl(null);
  };

  // Validation
  const validateForm = (): string | null => {
    if (!name.trim()) return 'Event name is required';
    if (!description.trim()) return 'Description is required';
    if (!eventType) return 'Please select an event type';
    if (!organizerName.trim()) return 'Organizer name is required';
    if (!address.trim()) return 'Address is required';
    if (!city.trim()) return 'City is required';
    if (contactEmail.trim() && !contactEmail.includes('@')) {
      return 'Please enter a valid email address';
    }
    return null;
  };

  // Submit
  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      setErrorModal({
        visible: true,
        title: 'Validation Error',
        message: validationError,
      });
      return;
    }

    setLoading(true);
    try {
      // Parse requirements
      const requirements = requirementsText
        .split('\n')
        .filter((r) => r.trim())
        .map((r) => ({
          text: r.trim().replace(/^\*/, ''),
          isMandatory: r.trim().startsWith('*'),
        }));

      // Parse benefits
      const benefits = benefitsText
        .split('\n')
        .filter((b) => b.trim())
        .map((b) => b.trim());

      const eventData: UpdateEventData = {
        name: name.trim(),
        description: description.trim(),
        eventType,
        sponsorId: selectedSponsorId || undefined,
        organizer: {
          name: organizerName.trim(),
          logo: organizerLogo.trim() || undefined,
        },
        location: {
          address: address.trim(),
          city: city.trim(),
          ...(latitude.trim() && longitude.trim()
            ? {
                coordinates: {
                  lat: parseFloat(latitude),
                  lng: parseFloat(longitude),
                },
              }
            : {}),
        },
        eventDate: eventDate.toISOString(),
        eventTime: {
          start: startTime,
          end: endTime,
        },
        rewards: {
          rezCoins: parseInt(rezCoins) || 0,
          brandCoins: parseInt(brandCoins) || 0,
        },
        capacity: {
          goal: parseInt(capacityGoal) || 100,
        },
        contact: {
          phone: contactPhone.trim() || undefined,
          email: contactEmail.trim() || undefined,
        },
        isCsrActivity,
        featured: isFeatured,
        image: imageUrl || undefined,
        verificationConfig: {
          methods: verificationMethods,
          geoFenceRadiusMeters: parseInt(geoFenceRadius) || 500,
          requireCheckInBeforeComplete: requireCheckIn,
        },
      };

      // Add impact if filled
      if (impactDescription.trim()) {
        eventData.impact = {
          description: impactDescription.trim(),
          metric: impactMetric.trim() || 'impact',
          targetValue: parseInt(impactTargetValue) || 0,
        };
      }

      // Add requirements if any
      if (requirements.length > 0) {
        eventData.eventRequirements = requirements;
      }

      // Add benefits if any
      if (benefits.length > 0) {
        eventData.benefits = benefits;
      }

      await socialImpactAdminService.updateEvent(id!, eventData);

      setSuccessModal({
        visible: true,
        title: 'Success!',
        message: 'Event updated successfully',
      });
    } catch (error) {
      setErrorModal({
        visible: true,
        title: 'Error',
        message: error.message || 'Failed to update event',
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedSponsor = sponsors.find((s) => s._id === selectedSponsorId);

  if (initialLoading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Loading event...</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <LinearGradient
          colors={['#10B981', '#059669', '#F3F4F6']}
          locations={[0, 0.3, 1]}
          style={styles.backgroundGradient}
        />
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          {/* Header */}
          <Animated.View entering={FadeIn.duration(600)} style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Edit Event</Text>
            <View style={{ width: 40 }} />
          </Animated.View>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Image Section */}
              <Animated.View entering={FadeInDown.delay(100)} style={styles.section}>
                <Text style={styles.sectionTitle}>Event Image</Text>
                <TouchableOpacity
                  style={styles.imagePickerButton}
                  onPress={pickImage}
                  disabled={uploadingImage}
                >
                  {imageUri ? (
                    <View style={styles.imagePreviewContainer}>
                      <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                      {uploadingImage && (
                        <View style={styles.uploadingOverlay}>
                          <ActivityIndicator color="#FFFFFF" />
                          <Text style={styles.uploadingText}>Uploading...</Text>
                        </View>
                      )}
                      <TouchableOpacity style={styles.removeImageButton} onPress={removeImage}>
                        <Ionicons name="close-circle" size={28} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Ionicons name="image-outline" size={48} color="#9CA3AF" />
                      <Text style={styles.imagePlaceholderText}>Tap to upload event image</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </Animated.View>

              {/* Basic Information */}
              <Animated.View entering={FadeInDown.delay(150)} style={styles.section}>
                <Text style={styles.sectionTitle}>Basic Information</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Event Name *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={name}
                    onChangeText={setName}
                    placeholder="e.g., Blood Donation Drive"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Description *</Text>
                  <TextInput
                    style={[styles.textInput, styles.textArea]}
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Describe the event..."
                    placeholderTextColor="#9CA3AF"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Event Type *</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.eventTypeGrid}>
                      {EVENT_TYPES.map((type) => (
                        <TouchableOpacity
                          key={type.value}
                          style={[
                            styles.eventTypeChip,
                            eventType === type.value && styles.eventTypeChipActive,
                          ]}
                          onPress={() => setEventType(type.value)}
                        >
                          <Text style={styles.eventTypeEmoji}>{type.emoji}</Text>
                          <Text
                            style={[
                              styles.eventTypeLabel,
                              eventType === type.value && styles.eventTypeLabelActive,
                            ]}
                          >
                            {type.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              </Animated.View>

              {/* Sponsor Selection */}
              <Animated.View entering={FadeInDown.delay(200)} style={styles.section}>
                <Text style={styles.sectionTitle}>Sponsor (Optional)</Text>
                <Text style={styles.sectionSubtitle}>Select a CSR sponsor for this event</Text>

                {loadingSponsors ? (
                  <ActivityIndicator color="#10B981" />
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.sponsorGrid}>
                      <TouchableOpacity
                        style={[styles.sponsorChip, !selectedSponsorId && styles.sponsorChipActive]}
                        onPress={() => setSelectedSponsorId(null)}
                      >
                        <Ionicons name="close-circle-outline" size={20} color="#6B7280" />
                        <Text style={styles.sponsorChipLabel}>No Sponsor</Text>
                      </TouchableOpacity>
                      {sponsors.map((sponsor) => (
                        <TouchableOpacity
                          key={sponsor._id}
                          style={[
                            styles.sponsorChip,
                            selectedSponsorId === sponsor._id && styles.sponsorChipActive,
                          ]}
                          onPress={() => setSelectedSponsorId(sponsor._id)}
                        >
                          {sponsor.logo ? (
                            <Image source={{ uri: sponsor.logo }} style={styles.sponsorLogo} />
                          ) : (
                            <Ionicons name="business" size={20} color="#8B5CF6" />
                          )}
                          <Text style={styles.sponsorChipLabel}>{sponsor.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                )}

                {selectedSponsor && (
                  <View style={styles.selectedSponsorInfo}>
                    <Ionicons name="sparkles" size={14} color="#8B5CF6" />
                    <Text style={styles.selectedSponsorText}>
                      Users will earn {selectedSponsor.brandCoinName}
                    </Text>
                  </View>
                )}
              </Animated.View>

              {/* Organizer */}
              <Animated.View entering={FadeInDown.delay(250)} style={styles.section}>
                <Text style={styles.sectionTitle}>Organizer</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Organizer Name *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={organizerName}
                    onChangeText={setOrganizerName}
                    placeholder="e.g., Red Cross Society"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Organizer Logo URL (Optional)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={organizerLogo}
                    onChangeText={setOrganizerLogo}
                    placeholder="https://..."
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="none"
                  />
                </View>
              </Animated.View>

              {/* Location */}
              <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
                <Text style={styles.sectionTitle}>Location</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Address *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={address}
                    onChangeText={setAddress}
                    placeholder="Full address"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>City *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={city}
                    onChangeText={setCity}
                    placeholder="e.g., Mumbai"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Latitude</Text>
                    <TextInput
                      style={styles.textInput}
                      value={latitude}
                      onChangeText={setLatitude}
                      placeholder="e.g. 19.0760"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <View style={{ width: 12 }} />
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Longitude</Text>
                    <TextInput
                      style={styles.textInput}
                      value={longitude}
                      onChangeText={setLongitude}
                      placeholder="e.g. 72.8777"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>
                <Text style={styles.helperText}>Required for geo-fence check-in</Text>
              </Animated.View>

              {/* Date & Time */}
              <Animated.View entering={FadeInDown.delay(350)} style={styles.section}>
                <Text style={styles.sectionTitle}>Date & Time</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Event Date</Text>
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Ionicons name="calendar-outline" size={20} color="#10B981" />
                    <Text style={styles.dateButtonText}>
                      {eventDate.toLocaleDateString('en-IN', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </Text>
                  </TouchableOpacity>
                  {showDatePicker && (
                    <DateTimePicker
                      value={eventDate}
                      mode="date"
                      display="default"
                      onChange={(event, date) => {
                        setShowDatePicker(false);
                        if (date) setEventDate(date);
                      }}
                    />
                  )}
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Start Time</Text>
                    <TextInput
                      style={styles.textInput}
                      value={startTime}
                      onChangeText={setStartTime}
                      placeholder="09:00 AM"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                  <View style={{ width: 12 }} />
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>End Time</Text>
                    <TextInput
                      style={styles.textInput}
                      value={endTime}
                      onChangeText={setEndTime}
                      placeholder="05:00 PM"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>
              </Animated.View>

              {/* Rewards */}
              <Animated.View entering={FadeInDown.delay(400)} style={styles.section}>
                <Text style={styles.sectionTitle}>Rewards</Text>

                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>{BRAND.COIN_NAME}</Text>
                    <TextInput
                      style={styles.textInput}
                      value={rezCoins}
                      onChangeText={setRezCoins}
                      placeholder="100"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="number-pad"
                    />
                  </View>
                  <View style={{ width: 12 }} />
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Brand Coins</Text>
                    <TextInput
                      style={styles.textInput}
                      value={brandCoins}
                      onChangeText={setBrandCoins}
                      placeholder="150"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="number-pad"
                    />
                  </View>
                </View>
              </Animated.View>

              {/* Capacity & Impact */}
              <Animated.View entering={FadeInDown.delay(450)} style={styles.section}>
                <Text style={styles.sectionTitle}>Capacity & Impact</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Capacity Goal</Text>
                  <TextInput
                    style={styles.textInput}
                    value={capacityGoal}
                    onChangeText={setCapacityGoal}
                    placeholder="100"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Impact Description</Text>
                  <TextInput
                    style={styles.textInput}
                    value={impactDescription}
                    onChangeText={setImpactDescription}
                    placeholder="e.g., Save 300 lives"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Impact Metric</Text>
                    <TextInput
                      style={styles.textInput}
                      value={impactMetric}
                      onChangeText={setImpactMetric}
                      placeholder="e.g., lives"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                  <View style={{ width: 12 }} />
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Target Value</Text>
                    <TextInput
                      style={styles.textInput}
                      value={impactTargetValue}
                      onChangeText={setImpactTargetValue}
                      placeholder="300"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="number-pad"
                    />
                  </View>
                </View>
              </Animated.View>

              {/* Contact */}
              <Animated.View entering={FadeInDown.delay(500)} style={styles.section}>
                <Text style={styles.sectionTitle}>Contact Information</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Phone</Text>
                  <TextInput
                    style={styles.textInput}
                    value={contactPhone}
                    onChangeText={setContactPhone}
                    placeholder="+91 XXXXX XXXXX"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="phone-pad"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <TextInput
                    style={styles.textInput}
                    value={contactEmail}
                    onChangeText={setContactEmail}
                    placeholder="contact@example.com"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </Animated.View>

              {/* Requirements & Benefits */}
              <Animated.View entering={FadeInDown.delay(550)} style={styles.section}>
                <Text style={styles.sectionTitle}>Requirements & Benefits</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    Requirements (one per line, * for mandatory)
                  </Text>
                  <TextInput
                    style={[styles.textInput, styles.textArea]}
                    value={requirementsText}
                    onChangeText={setRequirementsText}
                    placeholder="*Valid ID proof&#10;Age 18-60&#10;Good health"
                    placeholderTextColor="#9CA3AF"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Benefits (one per line)</Text>
                  <TextInput
                    style={[styles.textInput, styles.textArea]}
                    value={benefitsText}
                    onChangeText={setBenefitsText}
                    placeholder="Free health checkup&#10;Certificate&#10;Refreshments"
                    placeholderTextColor="#9CA3AF"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>
              </Animated.View>

              {/* Options */}
              <Animated.View entering={FadeInDown.delay(600)} style={styles.section}>
                <Text style={styles.sectionTitle}>Options</Text>

                <View style={styles.switchRow}>
                  <View style={styles.switchInfo}>
                    <Text style={styles.switchLabel}>CSR Activity</Text>
                    <Text style={styles.switchHint}>Mark as Corporate Social Responsibility</Text>
                  </View>
                  <Switch
                    value={isCsrActivity}
                    onValueChange={setIsCsrActivity}
                    trackColor={{ false: '#E5E7EB', true: '#10B981' }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                <View style={styles.switchRow}>
                  <View style={styles.switchInfo}>
                    <Text style={styles.switchLabel}>Featured Event</Text>
                    <Text style={styles.switchHint}>Show prominently in listings</Text>
                  </View>
                  <Switch
                    value={isFeatured}
                    onValueChange={setIsFeatured}
                    trackColor={{ false: '#E5E7EB', true: '#10B981' }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </Animated.View>

              {/* Verification Config */}
              <Animated.View entering={FadeInDown.delay(500)} style={styles.section}>
                <Text style={styles.sectionTitle}>Attendance Verification</Text>

                <Text style={styles.inputLabel}>Verification Methods</Text>
                <View style={styles.verificationMethodsGrid}>
                  {[
                    { key: 'manual', label: 'Manual', icon: 'person' },
                    { key: 'qr', label: 'QR Code', icon: 'qr-code' },
                    { key: 'otp', label: 'OTP', icon: 'key' },
                    { key: 'geo', label: 'Location', icon: 'location' },
                  ].map((method) => {
                    const isActive = verificationMethods.includes(method.key);
                    return (
                      <TouchableOpacity
                        key={method.key}
                        style={[
                          styles.verificationMethodChip,
                          isActive && styles.verificationMethodChipActive,
                        ]}
                        onPress={() => {
                          setVerificationMethods((prev) =>
                            isActive ? prev.filter((m) => m !== method.key) : [...prev, method.key]
                          );
                        }}
                      >
                        <Ionicons
                          name={method.icon as unknown as keyof typeof Ionicons.glyphMap}
                          size={16}
                          color={isActive ? '#FFFFFF' : '#6B7280'}
                        />
                        <Text
                          style={[
                            styles.verificationMethodChipText,
                            isActive && styles.verificationMethodChipTextActive,
                          ]}
                        >
                          {method.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {verificationMethods.includes('geo') && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Geo-fence Radius (meters)</Text>
                    <TextInput
                      style={styles.textInput}
                      value={geoFenceRadius}
                      onChangeText={setGeoFenceRadius}
                      placeholder="500"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="number-pad"
                    />
                  </View>
                )}

                <View style={styles.toggleRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.toggleLabel}>Require check-in before complete</Text>
                    <Text style={styles.toggleDescription}>
                      Participants must check in before being marked complete
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.toggle, requireCheckIn && styles.toggleActive]}
                    onPress={() => setRequireCheckIn(!requireCheckIn)}
                  >
                    <View style={[styles.toggleDot, requireCheckIn && styles.toggleDotActive]} />
                  </TouchableOpacity>
                </View>
              </Animated.View>

              {/* Action Button */}
              <TouchableOpacity
                style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                onPress={handleSubmit}
                disabled={loading || uploadingImage}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={{ height: 40 }} />
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>

        {/* Modals */}
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
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FE',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FE',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 280,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: -12,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1F2937',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
  },
  row: {
    flexDirection: 'row',
  },
  imagePickerButton: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
  },
  imagePreviewContainer: {
    flex: 1,
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadingText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
  },
  eventTypeGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  eventTypeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  eventTypeChipActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  eventTypeEmoji: {
    fontSize: 18,
  },
  eventTypeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  eventTypeLabelActive: {
    color: '#10B981',
  },
  sponsorGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  sponsorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  sponsorChipActive: {
    backgroundColor: '#F5F3FF',
    borderColor: '#8B5CF6',
  },
  sponsorLogo: {
    width: 24,
    height: 24,
    borderRadius: 6,
  },
  sponsorChipLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  selectedSponsorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 8,
  },
  selectedSponsorText: {
    fontSize: 12,
    color: '#8B5CF6',
    fontWeight: '600',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#1F2937',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  switchInfo: {
    flex: 1,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  switchHint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  helperText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: -4,
    marginBottom: 8,
  },
  verificationMethodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  verificationMethodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  verificationMethodChipActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  verificationMethodChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  verificationMethodChipTextActive: {
    color: '#FFFFFF',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  toggleDescription: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  toggleActive: {
    backgroundColor: '#10B981',
  },
  toggleDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
  },
  toggleDotActive: {
    alignSelf: 'flex-end',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
