// Edit Profile Screen
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  Image,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Camera } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { useUserStore } from '@/stores';
import { Button } from '@/components/Button';
import { avatarService } from '@/services/avatarService';

export default function EditProfileScreen() {
  const { colors, spacing } = useTheme();
  const router = useRouter();
  const { profile, setProfile } = useUserStore();

  const [name, setName] = useState(profile?.name || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [avatar, setAvatar] = useState(profile?.avatar || '');
  const [saving, setSaving] = useState(false);

  const handlePickImage = async () => {
    const uri = await avatarService.pickImage();
    if (uri) {
      setAvatar(uri);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    setSaving(true);

    try {
      // Upload avatar if changed
      if (avatar && avatar !== profile?.avatar) {
        await avatarService.uploadAvatar(avatar, profile?.id || '');
      }

      // Update profile in store
      setProfile({
        name: name.trim(),
        email: email.trim() || undefined,
        bio: bio.trim() || undefined,
        avatar: avatar || undefined,
      });

      Alert.alert('Success', 'Profile updated', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

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
            Edit Profile
          </Text>
          <View style={{ width: 24 }} />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={handlePickImage}
          >
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.fill }]}>
                <Text style={styles.avatarEmoji}>👤</Text>
              </View>
            )}
            <View style={[styles.cameraButton, { backgroundColor: colors.primary }]}>
              <Camera size={16} color={colors.white} />
            </View>
          </TouchableOpacity>
          <Text style={[styles.avatarHint, { color: colors.labelSecondary }]}>
            Tap to change photo
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.labelSecondary }]}>
              Name *
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.fill, color: colors.label }]}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={colors.labelTertiary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.labelSecondary }]}>
              Email
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.fill, color: colors.label }]}
              value={email}
              onChangeText={setEmail}
              placeholder="your@email.com"
              placeholderTextColor={colors.labelTertiary}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.labelSecondary }]}>
              Bio
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                { backgroundColor: colors.fill, color: colors.label },
              ]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell us about yourself"
              placeholderTextColor={colors.labelTertiary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <Button
            variant="primary"
            size="large"
            onPress={handleSave}
            loading={saving}
            style={{ marginTop: 24 }}
          >
            Save Changes
          </Button>

          <TouchableOpacity
            style={{ marginTop: 16, alignItems: 'center' }}
            onPress={() => router.back()}
          >
            <Text style={[styles.cancelText, { color: colors.labelSecondary }]}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
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
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 40,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarHint: {
    marginTop: 8,
    fontSize: 13,
  },
  form: {
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    padding: 14,
    borderRadius: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  cancelText: {
    fontSize: 15,
  },
});
