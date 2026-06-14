import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  eventService,
  CreateEventData,
  EventCategory,
  EventScheduleItem,
  EventTicketType,
} from '@/services/api/events';
import { uploadsService } from '@/services/api/uploads';
import { Colors } from '@/constants/Colors';
import { isWeb, handleWebImageUpload } from '@/utils/platform';
import { logger } from '@/utils/logger';
import ErrorModal from '@/components/common/ErrorModal';
import SuccessModal from '@/components/common/SuccessModal';

const FALLBACK_CATEGORIES: { label: string; value: string }[] = [
  { label: 'Music', value: 'Music' },
  { label: 'Technology', value: 'Technology' },
  { label: 'Wellness', value: 'Wellness' },
  { label: 'Sports', value: 'Sports' },
  { label: 'Education', value: 'Education' },
  { label: 'Business', value: 'Business' },
  { label: 'Arts', value: 'Arts' },
  { label: 'Food', value: 'Food' },
  { label: 'Entertainment', value: 'Entertainment' },
  { label: 'Other', value: 'Other' },
];

export default function AddEventScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<EventCategory>('Other');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState('10:00');
  const [endTime, setEndTime] = useState('12:00');
  const [isOnline, setIsOnline] = useState(false);
  const [meetingUrl, setMeetingUrl] = useState('');
  const [locationName, setLocationName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [isFree, setIsFree] = useState(true);
  const [priceAmount, setPriceAmount] = useState('');
  const [maxCapacity, setMaxCapacity] = useState('');
  const [organizerName, setOrganizerName] = useState('');
  const [organizerEmail, setOrganizerEmail] = useState('');
  const [organizerPhone, setOrganizerPhone] = useState('');
  const [tags, setTags] = useState('');
  const [requirements, setRequirements] = useState('');
  const [includes, setIncludes] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');

  // Schedule builder state
  const [schedule, setSchedule] = useState<EventScheduleItem[]>([]);
  // Ticket types state
  const [ticketTypes, setTicketTypes] = useState<
    Array<{ name: string; price: string; maxQuantity: string; description: string }>
  >([]);
  // Sponsors state
  const [sponsors, setSponsors] = useState<Array<{ name: string; logo: string }>>([]);

  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  // Dynamic categories from backend
  const [eventCategories, setEventCategories] = useState(FALLBACK_CATEGORIES);

  useEffect(() => {
    eventService.getEventCategories().then((cats) => {
      if (cats.length > 0) {
        setEventCategories(cats.map((c) => ({ label: c.name, value: c.name })));
      }
    });
  }, []);

  // Modal states
  const [errorModal, setErrorModal] = useState({ visible: false, title: '', message: '' });
  const [successModal, setSuccessModal] = useState({ visible: false, title: '', message: '' });

  const pickImage = async () => {
    try {
      if (isWeb) {
        // For web, use the web-specific file handler (returns array)
        const webResults = await handleWebImageUpload();
        if (webResults && webResults.length > 0 && webResults[0].uri) {
          setImageUri(webResults[0].uri);
          await uploadImage(webResults[0].uri, webResults[0].file);
        }
      } else {
        // For native (iOS/Android)
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [16, 9],
          quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
          setImageUri(result.assets[0].uri);
          await uploadImage(result.assets[0].uri);
        }
      }
    } catch (error) {
      logger.error('Error picking image:', error);
      setErrorModal({ visible: true, title: 'Error', message: 'Failed to pick image' });
    }
  };

  const uploadImage = async (uri: string, fileObject?: File) => {
    setUploadingImage(true);
    try {
      // Extract filename from URI or use default
      const filename = uri.split('/').pop() || `event-${Date.now()}.jpg`;
      const response = await uploadsService.uploadImage(uri, filename, 'general', fileObject);
      setImageUrl(response.url);
    } catch (error) {
      logger.error('Error uploading image:', error);
      setErrorModal({
        visible: true,
        title: 'Error',
        message: error.message || 'Failed to upload image',
      });
      setImageUri(null);
    } finally {
      setUploadingImage(false);
    }
  };

  const validateForm = (): string | null => {
    if (!title.trim()) return 'Event title is required';
    if (!description.trim()) return 'Description is required';
    if (!category) return 'Category is required';
    if (!organizerName.trim()) return 'Organizer name is required';
    if (!organizerEmail.trim()) return 'Organizer email is required';
    if (!isOnline && !locationName.trim()) return 'Location name is required';
    if (!isOnline && !city.trim()) return 'City is required';
    if (isOnline && !meetingUrl.trim()) return 'Meeting URL is required for online events';
    if (!isFree && (!priceAmount || parseFloat(priceAmount) < 0)) {
      return 'Price amount is required and must be positive';
    }
    // Validate end time is after start time
    if (endTime) {
      const [startHour, startMin] = time.split(':').map(Number);
      const [endHour, endMin] = endTime.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      if (endMinutes <= startMinutes) {
        return 'End time must be after start time';
      }
    }
    // Validate capacity if provided
    if (maxCapacity && (parseInt(maxCapacity) <= 0 || isNaN(parseInt(maxCapacity)))) {
      return 'Capacity must be greater than 0';
    }
    return null;
  };

  const handleSubmit = async (submitStatus: 'draft' | 'published') => {
    const validationError = validateForm();
    if (validationError) {
      setErrorModal({ visible: true, title: 'Validation Error', message: validationError });
      return;
    }

    setLoading(true);
    setStatus(submitStatus);
    try {
      const eventData: CreateEventData = {
        title: title.trim(),
        subtitle: subtitle.trim() || undefined,
        description: description.trim(),
        image: imageUrl || 'https://placehold.co/800x450?text=Event',
        price: {
          amount: isFree ? 0 : parseFloat(priceAmount),
          currency: '₹',
          isFree,
        },
        location: {
          name: isOnline ? 'Online Event' : locationName.trim(),
          address: isOnline ? 'Online' : address.trim(),
          city: isOnline ? 'Online' : city.trim(),
          isOnline,
          meetingUrl: isOnline ? meetingUrl.trim() : undefined,
        },
        date: date.toISOString(),
        time,
        endTime: endTime || undefined,
        category,
        organizer: {
          name: organizerName.trim(),
          email: organizerEmail.trim(),
          phone: organizerPhone.trim() || undefined,
        },
        isOnline,
        registrationRequired: true,
        maxCapacity: maxCapacity ? parseInt(maxCapacity) : undefined,
        tags: tags
          ? tags
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
          : undefined,
        requirements: requirements
          ? requirements
              .split('\n')
              .map((r) => r.trim())
              .filter(Boolean)
          : undefined,
        includes: includes
          ? includes
              .split('\n')
              .map((i) => i.trim())
              .filter(Boolean)
          : undefined,
        status: submitStatus,
        schedule: schedule.length > 0 ? schedule : undefined,
        ticketTypes:
          ticketTypes.length > 0
            ? ticketTypes.map((t) => ({
                name: t.name,
                price: parseFloat(t.price) || 0,
                maxQuantity: parseInt(t.maxQuantity) || 50,
                description: t.description || undefined,
              }))
            : undefined,
        sponsors:
          sponsors.filter((s) => s.name.trim()).length > 0
            ? sponsors
                .filter((s) => s.name.trim())
                .map((s) => ({ name: s.name.trim(), logo: s.logo || undefined }))
            : undefined,
      };

      await eventService.createEvent(eventData);
      setSuccessModal({
        visible: true,
        title: 'Success',
        message: `Event ${submitStatus === 'published' ? 'published' : 'saved as draft'} successfully!`,
      });
    } catch (error) {
      logger.error('Error creating event:', error);
      setErrorModal({
        visible: true,
        title: 'Error',
        message: error.message || 'Failed to create event',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d: Date) => {
    return d.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#7C3AED', '#6366F1', '#F3F4F6']}
        locations={[0, 0.2, 0.5]}
        style={styles.backgroundGradient}
      />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Event</Text>
          <View style={{ width: 40 }} />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Image Upload */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Event Image</Text>
              <TouchableOpacity
                style={styles.imageUpload}
                onPress={pickImage}
                disabled={uploadingImage}
              >
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={styles.previewImage} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="image-outline" size={48} color="#9CA3AF" />
                    <Text style={styles.imagePlaceholderText}>Tap to upload image</Text>
                  </View>
                )}
                {uploadingImage && (
                  <View style={styles.uploadingOverlay}>
                    <ActivityIndicator color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Basic Info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Basic Information</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Title *</Text>
                <TextInput
                  style={styles.input}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Enter event title"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Subtitle</Text>
                <TextInput
                  style={styles.input}
                  value={subtitle}
                  onChangeText={setSubtitle}
                  placeholder="Short description"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Detailed description of the event"
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Category *</Text>
                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={() => setShowCategoryPicker(!showCategoryPicker)}
                >
                  <Text style={styles.selectButtonText}>{category}</Text>
                  <Ionicons name="chevron-down" size={20} color="#6B7280" />
                </TouchableOpacity>
                {showCategoryPicker && (
                  <View style={styles.categoryList}>
                    {eventCategories.map((cat) => (
                      <TouchableOpacity
                        key={cat.value}
                        style={[
                          styles.categoryItem,
                          category === cat.value && styles.categoryItemActive,
                        ]}
                        onPress={() => {
                          setCategory(cat.value as EventCategory);
                          setShowCategoryPicker(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.categoryItemText,
                            category === cat.value && styles.categoryItemTextActive,
                          ]}
                        >
                          {cat.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>

            {/* Date & Time */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Date & Time</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Date *</Text>
                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                  <Text style={styles.selectButtonText}>{formatDate(date)}</Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={date}
                    mode="date"
                    display="default"
                    minimumDate={new Date()}
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate) setDate(selectedDate);
                    }}
                  />
                )}
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Start Time *</Text>
                  <TextInput
                    style={styles.input}
                    value={time}
                    onChangeText={setTime}
                    placeholder="10:00"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                  <Text style={styles.label}>End Time</Text>
                  <TextInput
                    style={styles.input}
                    value={endTime}
                    onChangeText={setEndTime}
                    placeholder="12:00"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>
            </View>

            {/* Location */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Location</Text>

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Online Event</Text>
                <Switch
                  value={isOnline}
                  onValueChange={setIsOnline}
                  trackColor={{ false: '#D1D5DB', true: '#7C3AED' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {isOnline ? (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Meeting URL *</Text>
                  <TextInput
                    style={styles.input}
                    value={meetingUrl}
                    onChangeText={setMeetingUrl}
                    placeholder="https://zoom.us/..."
                    placeholderTextColor="#9CA3AF"
                    keyboardType="url"
                    autoCapitalize="none"
                  />
                </View>
              ) : (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Venue Name *</Text>
                    <TextInput
                      style={styles.input}
                      value={locationName}
                      onChangeText={setLocationName}
                      placeholder="Enter venue name"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Address</Text>
                    <TextInput
                      style={styles.input}
                      value={address}
                      onChangeText={setAddress}
                      placeholder="Enter address"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>City *</Text>
                    <TextInput
                      style={styles.input}
                      value={city}
                      onChangeText={setCity}
                      placeholder="Enter city"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </>
              )}
            </View>

            {/* Pricing */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Pricing</Text>

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Free Event</Text>
                <Switch
                  value={isFree}
                  onValueChange={setIsFree}
                  trackColor={{ false: '#D1D5DB', true: '#10B981' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {!isFree && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Price (₹) *</Text>
                  <TextInput
                    style={styles.input}
                    value={priceAmount}
                    onChangeText={setPriceAmount}
                    placeholder="Enter price"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                  />
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Max Capacity</Text>
                <TextInput
                  style={styles.input}
                  value={maxCapacity}
                  onChangeText={setMaxCapacity}
                  placeholder="Leave empty for unlimited"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Organizer */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Organizer Details</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Name *</Text>
                <TextInput
                  style={styles.input}
                  value={organizerName}
                  onChangeText={setOrganizerName}
                  placeholder="Organizer name"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email *</Text>
                <TextInput
                  style={styles.input}
                  value={organizerEmail}
                  onChangeText={setOrganizerEmail}
                  placeholder="organizer@email.com"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone</Text>
                <TextInput
                  style={styles.input}
                  value={organizerPhone}
                  onChangeText={setOrganizerPhone}
                  placeholder="Phone number"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Additional Info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Additional Information</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Tags (comma separated)</Text>
                <TextInput
                  style={styles.input}
                  value={tags}
                  onChangeText={setTags}
                  placeholder="networking, startup, tech"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Requirements (one per line)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={requirements}
                  onChangeText={setRequirements}
                  placeholder="Bring laptop&#10;Valid ID required"
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>What's Included (one per line)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={includes}
                  onChangeText={setIncludes}
                  placeholder="Lunch&#10;Certificate&#10;Networking session"
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>

            {/* Schedule Builder */}
            <View style={styles.section}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 12,
                }}
              >
                <Text style={styles.sectionTitle}>Schedule / Agenda</Text>
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#F5F3FF',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 8,
                  }}
                  onPress={() =>
                    setSchedule([
                      ...schedule,
                      { title: '', startTime: '', endTime: '', description: '' },
                    ])
                  }
                >
                  <Ionicons name="add" size={16} color="#7C3AED" />
                  <Text
                    style={{
                      color: Colors.light.primary,
                      fontWeight: '600',
                      fontSize: 13,
                      marginLeft: 4,
                    }}
                  >
                    Add Item
                  </Text>
                </TouchableOpacity>
              </View>
              {schedule.length === 0 ? (
                <Text style={{ color: Colors.light.textMuted, fontSize: 13, fontStyle: 'italic' }}>
                  No schedule items. Add agenda items for your event.
                </Text>
              ) : (
                schedule.map((item, index) => (
                  <View
                    key={index}
                    style={{
                      backgroundColor: Colors.light.backgroundSecondary,
                      borderRadius: 12,
                      padding: 12,
                      marginBottom: 8,
                      borderWidth: 1,
                      borderColor: '#E5E7EB',
                    }}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        marginBottom: 8,
                      }}
                    >
                      <Text
                        style={{
                          fontWeight: '600',
                          color: Colors.light.textTertiary,
                          fontSize: 13,
                        }}
                      >
                        Item {index + 1}
                      </Text>
                      <TouchableOpacity
                        onPress={() => setSchedule(schedule.filter((_, i) => i !== index))}
                      >
                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                    <TextInput
                      style={[styles.input, { marginBottom: 8 }]}
                      value={item.title}
                      onChangeText={(text) => {
                        const updated = [...schedule];
                        updated[index] = { ...updated[index], title: text };
                        setSchedule(updated);
                      }}
                      placeholder="Session title"
                      placeholderTextColor="#9CA3AF"
                    />
                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                      <TextInput
                        style={[styles.input, { flex: 1 }]}
                        value={item.startTime}
                        onChangeText={(text) => {
                          const updated = [...schedule];
                          updated[index] = { ...updated[index], startTime: text };
                          setSchedule(updated);
                        }}
                        placeholder="Start (e.g. 10:00 AM)"
                        placeholderTextColor="#9CA3AF"
                      />
                      <TextInput
                        style={[styles.input, { flex: 1 }]}
                        value={item.endTime || ''}
                        onChangeText={(text) => {
                          const updated = [...schedule];
                          updated[index] = { ...updated[index], endTime: text };
                          setSchedule(updated);
                        }}
                        placeholder="End (e.g. 11:00 AM)"
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>
                    <TextInput
                      style={styles.input}
                      value={item.description || ''}
                      onChangeText={(text) => {
                        const updated = [...schedule];
                        updated[index] = { ...updated[index], description: text };
                        setSchedule(updated);
                      }}
                      placeholder="Description (optional)"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                ))
              )}
            </View>

            {/* Ticket Types */}
            <View style={styles.section}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 12,
                }}
              >
                <Text style={styles.sectionTitle}>Ticket Types</Text>
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#F5F3FF',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 8,
                  }}
                  onPress={() =>
                    setTicketTypes([
                      ...ticketTypes,
                      { name: '', price: '', maxQuantity: '', description: '' },
                    ])
                  }
                >
                  <Ionicons name="add" size={16} color="#7C3AED" />
                  <Text
                    style={{
                      color: Colors.light.primary,
                      fontWeight: '600',
                      fontSize: 13,
                      marginLeft: 4,
                    }}
                  >
                    Add Type
                  </Text>
                </TouchableOpacity>
              </View>
              {ticketTypes.length === 0 ? (
                <Text style={{ color: Colors.light.textMuted, fontSize: 13, fontStyle: 'italic' }}>
                  No ticket types. Default pricing will be used.
                </Text>
              ) : (
                ticketTypes.map((ticket, index) => (
                  <View
                    key={index}
                    style={{
                      backgroundColor: Colors.light.backgroundSecondary,
                      borderRadius: 12,
                      padding: 12,
                      marginBottom: 8,
                      borderWidth: 1,
                      borderColor: '#E5E7EB',
                    }}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        marginBottom: 8,
                      }}
                    >
                      <Text
                        style={{
                          fontWeight: '600',
                          color: Colors.light.textTertiary,
                          fontSize: 13,
                        }}
                      >
                        Ticket {index + 1}
                      </Text>
                      <TouchableOpacity
                        onPress={() => setTicketTypes(ticketTypes.filter((_, i) => i !== index))}
                      >
                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                    <TextInput
                      style={[styles.input, { marginBottom: 8 }]}
                      value={ticket.name}
                      onChangeText={(text) => {
                        const updated = [...ticketTypes];
                        updated[index] = { ...updated[index], name: text };
                        setTicketTypes(updated);
                      }}
                      placeholder="e.g. VIP, General, Early Bird"
                      placeholderTextColor="#9CA3AF"
                    />
                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                      <TextInput
                        style={[styles.input, { flex: 1 }]}
                        value={ticket.price}
                        onChangeText={(text) => {
                          const updated = [...ticketTypes];
                          updated[index] = { ...updated[index], price: text };
                          setTicketTypes(updated);
                        }}
                        placeholder="Price"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="numeric"
                      />
                      <TextInput
                        style={[styles.input, { flex: 1 }]}
                        value={ticket.maxQuantity}
                        onChangeText={(text) => {
                          const updated = [...ticketTypes];
                          updated[index] = { ...updated[index], maxQuantity: text };
                          setTicketTypes(updated);
                        }}
                        placeholder="Max qty"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                ))
              )}
            </View>

            {/* Sponsors */}
            <View style={styles.section}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 12,
                }}
              >
                <Text style={styles.sectionTitle}>Sponsors</Text>
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#F5F3FF',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 8,
                  }}
                  onPress={() => setSponsors([...sponsors, { name: '', logo: '' }])}
                >
                  <Ionicons name="add" size={16} color="#7C3AED" />
                  <Text
                    style={{
                      color: Colors.light.primary,
                      fontWeight: '600',
                      fontSize: 13,
                      marginLeft: 4,
                    }}
                  >
                    Add Sponsor
                  </Text>
                </TouchableOpacity>
              </View>
              {sponsors.map((sponsor, index) => (
                <View
                  key={index}
                  style={{ flexDirection: 'row', gap: 8, marginBottom: 8, alignItems: 'center' }}
                >
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    value={sponsor.name}
                    onChangeText={(text) => {
                      const updated = [...sponsors];
                      updated[index] = { ...updated[index], name: text };
                      setSponsors(updated);
                    }}
                    placeholder="Sponsor name"
                    placeholderTextColor="#9CA3AF"
                  />
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    value={sponsor.logo}
                    onChangeText={(text) => {
                      const updated = [...sponsors];
                      updated[index] = { ...updated[index], logo: text };
                      setSponsors(updated);
                    }}
                    placeholder="Logo URL (optional)"
                    placeholderTextColor="#9CA3AF"
                  />
                  <TouchableOpacity
                    onPress={() => setSponsors(sponsors.filter((_, i) => i !== index))}
                  >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.draftButton}
                onPress={() => handleSubmit('draft')}
                disabled={loading}
              >
                {loading && status === 'draft' ? (
                  <ActivityIndicator color="#7C3AED" />
                ) : (
                  <>
                    <Ionicons name="document-outline" size={20} color="#7C3AED" />
                    <Text style={styles.draftButtonText}>Save as Draft</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.publishButton}
                onPress={() => handleSubmit('published')}
                disabled={loading}
              >
                <LinearGradient
                  colors={['#7C3AED', '#6366F1']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.publishButtonGradient}
                >
                  {loading && status === 'published' ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="send" size={20} color="#FFFFFF" />
                      <Text style={styles.publishButtonText}>Publish Now</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
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
          router.replace('/events');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FE',
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 200,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    color: Colors.light.card,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  section: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.textDark,
    marginBottom: 16,
  },
  imageUpload: {
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.light.backgroundTertiary,
    borderWidth: 2,
    borderColor: Colors.light.border,
    borderStyle: 'dashed',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.light.textMuted,
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textTertiary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.light.textDark,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.light.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  selectButtonText: {
    fontSize: 16,
    color: Colors.light.textDark,
    flex: 1,
    marginLeft: 8,
  },
  categoryList: {
    marginTop: 8,
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: 'hidden',
  },
  categoryItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  categoryItemActive: {
    backgroundColor: '#F5F3FF',
  },
  categoryItemText: {
    fontSize: 14,
    color: Colors.light.textTertiary,
  },
  categoryItemTextActive: {
    color: Colors.light.primary,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.textTertiary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 32,
  },
  draftButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#7C3AED',
    gap: 8,
  },
  draftButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  publishButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  publishButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  publishButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.card,
  },
});
