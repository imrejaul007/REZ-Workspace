import { PlatformConfig, getPlatformConfig } from './platformConfig.js';

export interface AdaptationResult {
  title: string;
  description: string;
  hashtags: string[];
  aspectRatio: string;
  mediaFormat: string;
  warnings: string[];
}

export class ContentAdaptationService {
  /**
   * Adapt content for a target platform
   */
  adaptContent(
    content: {
      title: string;
      description: string;
      hashtags?: string[];
      aspectRatio?: string;
    },
    targetPlatform: string
  ): AdaptationResult {
    const platform = getPlatformConfig(targetPlatform);

    if (!platform) {
      throw new Error(`Unknown platform: ${targetPlatform}`);
    }

    const warnings: string[] = [];

    // Adapt title
    const adaptedTitle = this.adaptTitle(content.title, platform);
    if (content.title.length > platform.maxTitleLength) {
      warnings.push(`Title truncated from ${content.title.length} to ${platform.maxTitleLength} characters`);
    }

    // Adapt description
    const adaptedDescription = this.adaptDescription(content.description, platform);
    if (content.description.length > platform.maxDescriptionLength) {
      warnings.push(`Description truncated from ${content.description.length} to ${platform.maxDescriptionLength} characters`);
    }

    // Adapt hashtags
    const adaptedHashtags = this.adaptHashtags(content.hashtags || [], platform);
    if ((content.hashtags?.length || 0) > platform.maxHashtags) {
      warnings.push(`Hashtags reduced from ${content.hashtags?.length} to ${platform.maxHashtags}`);
    }

    // Determine aspect ratio
    const aspectRatio = this.determineAspectRatio(content.aspectRatio, platform);

    // Format emojis based on platform settings
    const formattedDescription = this.formatEmojis(adaptedDescription, platform.formatting.emojiStyle);

    return {
      title: adaptedTitle,
      description: formattedDescription,
      hashtags: adaptedHashtags,
      aspectRatio,
      mediaFormat: platform.type === 'video' ? 'mp4' : 'jpg',
      warnings,
    };
  }

  /**
   * Adapt title for platform constraints
   */
  private adaptTitle(title: string, platform: PlatformConfig): string {
    if (title.length <= platform.maxTitleLength) {
      return title;
    }

    // Truncate with ellipsis
    return title.substring(0, platform.maxTitleLength - 3).trim() + '...';
  }

  /**
   * Adapt description for platform constraints
   */
  private adaptDescription(description: string, platform: PlatformConfig): string {
    if (description.length <= platform.maxDescriptionLength) {
      return description;
    }

    // Truncate with ellipsis
    return description.substring(0, platform.maxDescriptionLength - 3).trim() + '...';
  }

  /**
   * Adapt hashtags for platform constraints
   */
  private adaptHashtags(hashtags: string[], platform: PlatformConfig): string[] {
    // Take only the allowed number of hashtags
    const limitedHashtags = hashtags.slice(0, platform.maxHashtags);

    // Remove duplicate hashtags
    const seen = new Set<string>();
    return limitedHashtags.filter((tag) => {
      const normalized = tag.toLowerCase();
      if (seen.has(normalized)) {
        return false;
      }
      seen.add(normalized);
      return true;
    });
  }

  /**
   * Determine the best aspect ratio for the target platform
   */
  private determineAspectRatio(
    sourceAspectRatio: string | undefined,
    platform: PlatformConfig
  ): string {
    if (!sourceAspectRatio) {
      return platform.defaultAspectRatio;
    }

    // Check if the source aspect ratio is supported
    if (platform.supportedAspectRatios.includes(sourceAspectRatio)) {
      return sourceAspectRatio;
    }

    // Find the closest supported aspect ratio
    return platform.defaultAspectRatio;
  }

  /**
   * Format emojis based on platform settings
   */
  private formatEmojis(text: string, style: 'native' | 'shortcode' | 'remove'): string {
    switch (style) {
      case 'remove':
        // Remove all emojis
        return text.replace(/[\p{Emoji_Presentation}\p{Emoji}‍]+/gu, '').trim();
      case 'shortcode':
        // Convert to shortcodes (simplified - in production use a proper emoji library)
        return text;
      case 'native':
      default:
        // Keep native emojis
        return text;
    }
  }

  /**
   * Generate hashtags from content
   */
  generateHashtags(content: string, count = 5): string[] {
    // Simple hashtag extraction - in production use NLP
    const words = content.toLowerCase().split(/\s+/);
    const candidates = words
      .filter((word) => word.length > 3 && /^[a-z0-9]+$/i.test(word))
      .slice(0, count * 2);

    return candidates.slice(0, count).map((word) => `#${word}`);
  }

  /**
   * Add call-to-action to content
   */
  addCTA(content: string, platform: string): string {
    const ctas: Record<string, string> = {
      youtube: '🔗 Subscribe for more content!\n\n#shorts #viral #trending',
      tiktok: 'Follow for more! 🔥\n\n#fyp #viral #trending',
      instagram: 'Follow for more! ❤️\n\n#explore #viral #reels',
      facebook: 'Like and share if you enjoyed this! 👇',
      twitter: 'Let me know your thoughts! 👇',
      linkedin: 'What are your thoughts? Share in the comments.',
    };

    const cta = ctas[platform.toLowerCase()] || 'Check out our profile for more!';
    return `${content}\n\n${cta}`;
  }
}

export const contentAdaptationService = new ContentAdaptationService();