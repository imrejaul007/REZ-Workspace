/**
 * Avatar Service
 * Handles avatar image upload and basic style analysis
 */

import * as ImagePicker from 'expo-image-picker';
import { rezApi } from './rezApi';

export interface StyleProfile {
  faceShape?: string;
  bodyType?: string;
  skinTone?: string;
  stylePreferences: string[];
  colorPalette: string[];
}

export interface AvatarData {
  uri: string;
  styleProfile?: StyleProfile;
  uploadedAt: string;
}

// Default style profiles based on common preferences
const STYLE_PROFILES: Record<string, string[]> = {
  'casual': ['relaxed', 'comfortable', 'everyday'],
  'formal': ['professional', 'elegant', 'polished'],
  'trendy': ['modern', 'stylish', 'fashion-forward'],
  'minimal': ['clean', 'simple', 'understated'],
  'bold': ['statement', 'vibrant', 'eye-catching'],
  'classic': ['timeless', 'traditional', 'sophisticated'],
};

const COLOR_PALETTES: Record<string, string[]> = {
  'warm': ['#FF6B6B', '#FFA07A', '#FFD93D'],
  'cool': ['#6BCB77', '#4D96FF', '#9B59B6'],
  'neutral': ['#F5F5F5', '#C0C0C0', '#808080'],
  'earth': ['#8B4513', '#A0522D', '#D2691E'],
};

class AvatarService {
  /**
   * Pick image from gallery
   */
  async pickImage(): Promise<string | null> {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      logger.error('Media library permission not granted');
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      return result.assets[0].uri;
    }

    return null;
  }

  /**
   * Take photo with camera
   */
  async takePhoto(): Promise<string | null> {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== 'granted') {
      logger.error('Camera permission not granted');
      return null;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      return result.assets[0].uri;
    }

    return null;
  }

  /**
   * Analyze style preferences from user profile
   * (In production, this would use AI/ML)
   */
  analyzeStyleFromProfile(stylePrefs?: {
    vibes?: string[];
    occasions?: string[];
    cuisines?: string[];
  }): StyleProfile {
    const stylePreferences: string[] = [];
    const colorPalette: string[] = [];

    // Map vibes to style preferences
    if (stylePrefs?.vibes) {
      stylePrefs.vibes.forEach((vibe) => {
        const prefs = STYLE_PROFILES[vibe] || [];
        stylePreferences.push(...prefs);
      });
    }

    // Determine color palette based on vibes
    if (stylePrefs?.vibes?.includes('bold')) {
      colorPalette.push(...COLOR_PALETTES['warm'], ...COLOR_PALETTES['cool']);
    } else if (stylePrefs?.vibes?.includes('minimal')) {
      colorPalette.push(...COLOR_PALETTES['neutral']);
    } else if (stylePrefs?.vibes?.includes('classic')) {
      colorPalette.push(...COLOR_PALETTES['earth']);
    } else {
      // Default mixed palette
      colorPalette.push(...COLOR_PALETTES['warm'], ...COLOR_PALETTES['cool']);
    }

    return {
      stylePreferences: [...new Set(stylePreferences)],
      colorPalette: [...new Set(colorPalette)],
    };
  }

  /**
   * Upload avatar to backend
   */
  async uploadAvatar(imageUri: string, userId: string): Promise<AvatarData | null> {
    try {
      // In production, this would upload to cloud storage
      // For now, we'll just return the local URI

      const styleProfile = this.analyzeStyleFromProfile();

      return {
        uri: imageUri,
        styleProfile,
        uploadedAt: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Avatar upload failed:', error);
      return null;
    }
  }

  /**
   * Get avatar suggestions based on style profile
   */
  getAvatarSuggestions(stylePrefs?: {
    vibes?: string[];
    occasions?: string[];
  }): string[] {
    const suggestions: string[] = [];

    if (stylePrefs?.occasions?.includes('date')) {
      suggestions.push('Romantic dinner look');
    }
    if (stylePrefs?.occasions?.includes('party')) {
      suggestions.push('Party outfit');
    }
    if (stylePrefs?.occasions?.includes('office')) {
      suggestions.push('Professional style');
    }
    if (stylePrefs?.vibes?.includes('trendy')) {
      suggestions.push('Latest trends');
    }

    return suggestions.length > 0
      ? suggestions
      : ['Share your style with friends'];
  }
}

export const avatarService = new AvatarService();
export default avatarService;
