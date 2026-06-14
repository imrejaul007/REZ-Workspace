// Platform configurations for content adaptation
export interface PlatformConfig {
  id: string;
  name: string;
  type: 'video' | 'image' | 'text' | 'social';
  maxTitleLength: number;
  maxDescriptionLength: number;
  maxHashtags: number;
  supportedAspectRatios: string[];
  defaultAspectRatio: string;
  features: {
    supportsVerticalVideo: boolean;
    supportsMusic: boolean;
    supportsCaptions: boolean;
    supportsCTA: boolean;
  };
  formatting: {
    addNewlines: boolean;
    emojiStyle: 'native' | 'shortcode' | 'remove';
    hashtagPrefix: string;
  };
}

export const platformConfigs: Record<string, PlatformConfig> = {
  youtube: {
    id: 'youtube',
    name: 'YouTube',
    type: 'video',
    maxTitleLength: 100,
    maxDescriptionLength: 5000,
    maxHashtags: 15,
    supportedAspectRatios: ['16:9', '9:16', '1:1', '4:3'],
    defaultAspectRatio: '16:9',
    features: {
      supportsVerticalVideo: true,
      supportsMusic: true,
      supportsCaptions: true,
      supportsCTA: true,
    },
    formatting: {
      addNewlines: true,
      emojiStyle: 'native',
      hashtagPrefix: '#',
    },
  },
  tiktok: {
    id: 'tiktok',
    name: 'TikTok',
    type: 'video',
    maxTitleLength: 150,
    maxDescriptionLength: 2200,
    maxHashtags: 30,
    supportedAspectRatios: ['9:16'],
    defaultAspectRatio: '9:16',
    features: {
      supportsVerticalVideo: true,
      supportsMusic: true,
      supportsCaptions: true,
      supportsCTA: true,
    },
    formatting: {
      addNewlines: false,
      emojiStyle: 'native',
      hashtagPrefix: '#',
    },
  },
  instagram: {
    id: 'instagram',
    name: 'Instagram',
    type: 'video',
    maxTitleLength: 125,
    maxDescriptionLength: 2200,
    maxHashtags: 30,
    supportedAspectRatios: ['1:1', '4:5', '9:16', '16:9'],
    defaultAspectRatio: '1:1',
    features: {
      supportsVerticalVideo: true,
      supportsMusic: true,
      supportsCaptions: true,
      supportsCTA: true,
    },
    formatting: {
      addNewlines: false,
      emojiStyle: 'native',
      hashtagPrefix: '#',
    },
  },
  facebook: {
    id: 'facebook',
    name: 'Facebook',
    type: 'video',
    maxTitleLength: 255,
    maxDescriptionLength: 5000,
    maxHashtags: 20,
    supportedAspectRatios: ['16:9', '1:1', '9:16'],
    defaultAspectRatio: '16:9',
    features: {
      supportsVerticalVideo: true,
      supportsMusic: true,
      supportsCaptions: true,
      supportsCTA: true,
    },
    formatting: {
      addNewlines: true,
      emojiStyle: 'native',
      hashtagPrefix: '#',
    },
  },
  twitter: {
    id: 'twitter',
    name: 'Twitter/X',
    type: 'video',
    maxTitleLength: 70,
    maxDescriptionLength: 280,
    maxHashtags: 10,
    supportedAspectRatios: ['16:9', '1:1'],
    defaultAspectRatio: '16:9',
    features: {
      supportsVerticalVideo: true,
      supportsMusic: false,
      supportsCaptions: true,
      supportsCTA: true,
    },
    formatting: {
      addNewlines: false,
      emojiStyle: 'native',
      hashtagPrefix: '#',
    },
  },
  linkedin: {
    id: 'linkedin',
    name: 'LinkedIn',
    type: 'video',
    maxTitleLength: 200,
    maxDescriptionLength: 3000,
    maxHashtags: 15,
    supportedAspectRatios: ['16:9', '1:1', '4:3'],
    defaultAspectRatio: '16:9',
    features: {
      supportsVerticalVideo: false,
      supportsMusic: false,
      supportsCaptions: true,
      supportsCTA: true,
    },
    formatting: {
      addNewlines: true,
      emojiStyle: 'native',
      hashtagPrefix: '',
    },
  },
  snapchat: {
    id: 'snapchat',
    name: 'Snapchat',
    type: 'video',
    maxTitleLength: 100,
    maxDescriptionLength: 500,
    maxHashtags: 10,
    supportedAspectRatios: ['9:16'],
    defaultAspectRatio: '9:16',
    features: {
      supportsVerticalVideo: true,
      supportsMusic: true,
      supportsCaptions: true,
      supportsCTA: false,
    },
    formatting: {
      addNewlines: false,
      emojiStyle: 'native',
      hashtagPrefix: '#',
    },
  },
  pinterest: {
    id: 'pinterest',
    name: 'Pinterest',
    type: 'image',
    maxTitleLength: 100,
    maxDescriptionLength: 500,
    maxHashtags: 20,
    supportedAspectRatios: ['1:1', '2:3', '9:16'],
    defaultAspectRatio: '1:1',
    features: {
      supportsVerticalVideo: false,
      supportsMusic: false,
      supportsCaptions: false,
      supportsCTA: true,
    },
    formatting: {
      addNewlines: true,
      emojiStyle: 'remove',
      hashtagPrefix: '',
    },
  },
};

export function getPlatformConfig(platformId: string): PlatformConfig | undefined {
  return platformConfigs[platformId.toLowerCase()];
}

export function getSupportedPlatforms(): PlatformConfig[] {
  return Object.values(platformConfigs);
}

export function isValidPlatform(platformId: string): boolean {
  return platformId.toLowerCase() in platformConfigs;
}