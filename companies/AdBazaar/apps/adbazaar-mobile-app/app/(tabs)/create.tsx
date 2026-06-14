import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAppStore } from '../../src/store/appStore';
import { usePosts } from '../../src/hooks/usePosts';
import { Button } from '../../src/components';
import { Platform as PlatformType } from '../../src/types';

const PLATFORMS: { id: PlatformType['id']; name: string; icon: string }[] = [
  { id: 'twitter', name: 'Twitter', icon: '🐦' },
  { id: 'linkedin', name: 'LinkedIn', icon: '💼' },
  { id: 'instagram', name: 'Instagram', icon: '📷' },
  { id: 'facebook', name: 'Facebook', icon: '👥' },
  { id: 'tiktok', name: 'TikTok', icon: '🎵' },
  { id: 'reddit', name: 'Reddit', icon: '🤖' },
];

const MAX_CHARS = 280;

export default function CreateScreen() {
  const router = useRouter();
  const { currentDraft, setCurrentDraft, clearDraft } = useAppStore();
  const { createPost, schedulePost } = usePosts();

  const [content, setContent] = useState(currentDraft.content || '');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(
    currentDraft.platforms?.map((p) => p.id) || []
  );
  const [showScheduler, setShowScheduler] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const charCount = content.length;
  const isOverLimit = charCount > MAX_CHARS;

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId)
        ? prev.filter((id) => id !== platformId)
        : [...prev, platformId]
    );
  };

  const handlePublish = async () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Please enter some content');
      return;
    }
    if (selectedPlatforms.length === 0) {
      Alert.alert('Error', 'Please select at least one platform');
      return;
    }
    if (isOverLimit) {
      Alert.alert('Error', `Content exceeds ${MAX_CHARS} characters`);
      return;
    }

    setIsSubmitting(true);
    try {
      const post = await createPost({
        content,
        platforms: selectedPlatforms.map((id) => ({
          id,
          name: PLATFORMS.find((p) => p.id === id)?.name as any,
          connected: true,
        })),
        status: 'draft',
      });

      if (post) {
        clearDraft();
        Alert.alert('Success', 'Post created successfully', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSchedule = async () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Please enter some content');
      return;
    }
    if (selectedPlatforms.length === 0) {
      Alert.alert('Error', 'Please select at least one platform');
      return;
    }

    setIsSubmitting(true);
    try {
      const post = await createPost({
        content,
        platforms: selectedPlatforms.map((id) => ({
          id,
          name: PLATFORMS.find((p) => p.id === id)?.name as any,
          connected: true,
        })),
        status: 'draft',
      });

      if (post) {
        await schedulePost(post.id, scheduledDate.toISOString());
        clearDraft();
        Alert.alert('Success', 'Post scheduled successfully', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to schedule post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const newDate = new Date(scheduledDate);
      newDate.setFullYear(selectedDate.getFullYear());
      newDate.setMonth(selectedDate.getMonth());
      newDate.setDate(selectedDate.getDate());
      setScheduledDate(newDate);
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const newDate = new Date(scheduledDate);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      setScheduledDate(newDate);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Header */}
        <View className="px-4 py-4 border-b border-gray-100">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity onPress={() => router.back()}>
              <Text className="text-indigo-600 text-lg">Cancel</Text>
            </TouchableOpacity>
            <Text className="text-lg font-semibold text-gray-900">Create Post</Text>
            <View className="w-16" />
          </View>
        </View>

        <ScrollView className="flex-1 p-4">
          {/* Content Input */}
          <View className="mb-4">
            <TextInput
              className={`text-base text-gray-800 min-h-40 p-4 rounded-2xl border ${
                isOverLimit ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'
              }`}
              placeholder="What's on your mind?"
              placeholderTextColor="#9ca3af"
              multiline
              value={content}
              onChangeText={setContent}
              textAlignVertical="top"
            />
            <View className="flex-row justify-end mt-2">
              <Text
                className={`text-sm ${
                  isOverLimit ? 'text-red-500' : 'text-gray-500'
                }`}
              >
                {charCount}/{MAX_CHARS}
              </Text>
            </View>
          </View>

          {/* Platform Selection */}
          <View className="mb-6">
            <Text className="text-base font-semibold text-gray-900 mb-3">
              Select Platforms
            </Text>
            <View className="flex-row flex-wrap -mx-1">
              {PLATFORMS.map((platform) => (
                <TouchableOpacity
                  key={platform.id}
                  onPress={() => togglePlatform(platform.id)}
                  className={`w-1/3 p-2`}
                >
                  <View
                    className={`p-3 rounded-xl items-center ${
                      selectedPlatforms.includes(platform.id)
                        ? 'bg-indigo-100 border-2 border-indigo-500'
                        : 'bg-gray-50 border-2 border-transparent'
                    }`}
                  >
                    <Text className="text-2xl mb-1">{platform.icon}</Text>
                    <Text
                      className={`text-sm font-medium ${
                        selectedPlatforms.includes(platform.id)
                          ? 'text-indigo-600'
                          : 'text-gray-600'
                      }`}
                    >
                      {platform.name}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Media (placeholder) */}
          <View className="mb-6">
            <Text className="text-base font-semibold text-gray-900 mb-3">
              Add Media
            </Text>
            <TouchableOpacity className="border-2 border-dashed border-gray-300 rounded-2xl p-6 items-center">
              <Text className="text-3xl mb-2">📷</Text>
              <Text className="text-gray-500">Tap to add images or videos</Text>
            </TouchableOpacity>
          </View>

          {/* Schedule Toggle */}
          <TouchableOpacity
            className="flex-row items-center justify-between p-4 bg-gray-50 rounded-xl mb-6"
            onPress={() => setShowScheduler(!showScheduler)}
          >
            <View className="flex-row items-center">
              <Text className="text-xl mr-3">📅</Text>
              <Text className="text-base font-medium text-gray-900">
                Schedule Post
              </Text>
            </View>
            <View
              className={`w-12 h-7 rounded-full p-1 ${
                showScheduler ? 'bg-indigo-600' : 'bg-gray-300'
              }`}
            >
              <View
                className={`w-5 h-5 rounded-full bg-white ${
                  showScheduler ? 'ml-5' : 'ml-0'
                }`}
              />
            </View>
          </TouchableOpacity>

          {/* Date/Time Selection */}
          {showScheduler && (
            <View className="mb-6 p-4 bg-indigo-50 rounded-xl">
              <TouchableOpacity
                className="flex-row items-center justify-between mb-3"
                onPress={() => setShowDatePicker(true)}
              >
                <Text className="text-gray-600">Date</Text>
                <Text className="text-gray-900 font-medium">
                  {scheduledDate.toLocaleDateString()}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-row items-center justify-between"
                onPress={() => setShowTimePicker(true)}
              >
                <Text className="text-gray-600">Time</Text>
                <Text className="text-gray-900 font-medium">
                  {scheduledDate.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {/* Action Buttons */}
        <View className="p-4 border-t border-gray-100">
          {showScheduler ? (
            <Button
              title="Schedule Post"
              onPress={handleSchedule}
              loading={isSubmitting}
              disabled={isOverLimit}
            />
          ) : (
            <Button
              title="Publish Now"
              onPress={handlePublish}
              loading={isSubmitting}
              disabled={isOverLimit}
            />
          )}
        </View>

        {/* Date Picker */}
        {showDatePicker && (
          <DateTimePicker
            value={scheduledDate}
            mode="date"
            display="default"
            onChange={onDateChange}
            minimumDate={new Date()}
          />
        )}

        {showTimePicker && (
          <DateTimePicker
            value={scheduledDate}
            mode="time"
            display="default"
            onChange={onTimeChange}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
