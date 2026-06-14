// Avatar Upload Screen
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Camera, Image as ImageIcon, X, Sparkles, ChevronLeft } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { useTheme } from '@/theme/ThemeProvider';
import { useUserStore } from '@/stores';
import { avatarService } from '@/services/avatarService';
import { Button } from '@/components/Button';

export default function AvatarScreen() {
  const { colors, spacing, typography, borderRadius } = useTheme();
  const router = useRouter();
  const { profile, setProfile } = useUserStore();

  const [avatarUri, setAvatarUri] = useState<string | null>(profile?.avatar || null);
  const [loading, setLoading] = useState(false);

  const handlePickImage = async () => {
    try {
      const uri = await avatarService.pickImage();
      if (uri) {
        setAvatarUri(uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const uri = await avatarService.takePhoto();
      if (uri) {
        setAvatarUri(uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handleSave = async () => {
    if (!avatarUri) {
      Alert.alert('No Avatar', 'Please select an avatar image first');
      return;
    }

    setLoading(true);
    try {
      // Upload avatar
      const result = await avatarService.uploadAvatar(avatarUri, profile?.id || '');

      if (result) {
        // Update profile with new avatar
        setProfile({
          avatar: avatarUri,
        });

        Alert.alert('Success', 'Avatar updated!', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert('Error', 'Failed to save avatar');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save avatar');
    } finally {
      setLoading(false);
    }
  };

  const suggestions = avatarService.getAvatarSuggestions(profile?.stylePreferences);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { padding: spacing.screenPadding }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.label} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.label, ...typography.titleMedium }]}>
          Set Avatar
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Avatar Preview */}
        <Animated.View entering={FadeIn} style={styles.avatarContainer}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.fill }]}>
              <Text style={styles.avatarPlaceholderEmoji}>👤</Text>
            </View>
          )}

          {/* Edit overlay */}
          {avatarUri && (
            <TouchableOpacity
              style={[styles.editOverlay, { backgroundColor: colors.primary }]}
              onPress={handlePickImage}
            >
              <Camera size={24} color={colors.white} />
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Style Suggestions */}
        {suggestions.length > 0 && (
          <Animated.View entering={FadeIn.delay(200)} style={styles.suggestionsContainer}>
            <View style={styles.suggestionsHeader}>
              <Sparkles size={18} color={colors.primary} />
              <Text style={[styles.suggestionsTitle, { color: colors.label }]}>
                Style Tips
              </Text>
            </View>
            {suggestions.map((suggestion, i) => (
              <View
                key={i}
                style={[styles.suggestionItem, { backgroundColor: colors.fill }]}
              >
                <Text style={[styles.suggestionText, { color: colors.labelSecondary }]}>
                  {suggestion}
                </Text>
              </View>
            ))}
          </Animated.View>
        )}

        {/* Action Buttons */}
        <Animated.View entering={FadeIn.delay(300)} style={styles.actions}>
          {!avatarUri ? (
            <>
              <Button
                variant="primary"
                size="large"
                onPress={handleTakePhoto}
                style={styles.actionButton}
              >
                <Camera size={20} color={colors.white} />
                <Text style={[styles.buttonText, { color: colors.white }]}>
                  Take Photo
                </Text>
              </Button>

              <Button
                variant="secondary"
                size="large"
                onPress={handlePickImage}
                style={styles.actionButton}
              >
                <ImageIcon size={20} color={colors.primary} />
                <Text style={[styles.buttonText, { color: colors.primary }]}>
                  Choose from Gallery
                </Text>
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="primary"
                size="large"
                onPress={handleSave}
                loading={loading}
                style={styles.actionButton}
              >
                Save Avatar
              </Button>

              <Button
                variant="ghost"
                size="medium"
                onPress={() => setAvatarUri(null)}
                style={styles.removeButton}
              >
                <X size={18} color={colors.systemRed} />
                <Text style={[styles.removeText, { color: colors.systemRed }]}>
                  Remove
                </Text>
              </Button>
            </>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontWeight: '600',
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  avatarContainer: {
    marginVertical: 32,
    position: 'relative',
  },
  avatar: {
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  avatarPlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderEmoji: {
    fontSize: 80,
  },
  editOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionsContainer: {
    width: '100%',
    marginBottom: 32,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  suggestionItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  suggestionText: {
    fontSize: 14,
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 12,
  },
  removeText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
