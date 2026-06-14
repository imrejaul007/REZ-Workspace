import { Branding, IBranding, IBrandingColors, IBrandingFonts } from '../models';
import { logger } from 'utils/logger.js';

export interface CreateBrandingDTO {
  portalId: string;
  logo: {
    url: string;
    alt?: string;
    width?: number;
    height?: number;
  };
  favicon: {
    url: string;
    type?: string;
  };
  colors?: Partial<IBrandingColors>;
  fonts?: Partial<IBrandingFonts>;
  customCSS?: string;
  emailTemplate?: {
    headerLogo?: string;
    footerText?: string;
    socialLinks?: {
      twitter?: string;
      linkedin?: string;
      facebook?: string;
    };
  };
  updatedBy: string;
}

export interface UpdateBrandingDTO {
  logo?: {
    url: string;
    alt?: string;
    width?: number;
    height?: number;
  };
  favicon?: {
    url: string;
    type?: string;
  };
  colors?: Partial<IBrandingColors>;
  fonts?: Partial<IBrandingFonts>;
  customCSS?: string;
  emailTemplate?: {
    headerLogo?: string;
    footerText?: string;
    socialLinks?: {
      twitter?: string;
      linkedin?: string;
      facebook?: string;
    };
  };
  updatedBy: string;
}

export class BrandingService {
  /**
   * Create branding for a portal
   */
  async createBranding(data: CreateBrandingDTO): Promise<IBranding> {
    logger.info('Creating branding for portal', { portalId: data.portalId });

    // Check if branding already exists
    const existing = await Branding.findOne({ portalId: data.portalId });
    if (existing) {
      throw new Error(`Branding for portal '${data.portalId}' already exists`);
    }

    const branding = new Branding({
      portalId: data.portalId,
      logo: {
        url: data.logo.url,
        alt: data.logo.alt || 'Logo',
        width: data.logo.width || 150,
        height: data.logo.height || 50,
      },
      favicon: {
        url: data.favicon.url,
        type: data.favicon.type || 'image/png',
      },
      colors: {
        primary: data.colors?.primary || '#2563eb',
        secondary: data.colors?.secondary || '#64748b',
        accent: data.colors?.accent || '#8b5cf6',
        background: data.colors?.background || '#ffffff',
        text: data.colors?.text || '#1e293b',
        success: data.colors?.success || '#22c55e',
        warning: data.colors?.warning || '#f59e0b',
        error: data.colors?.error || '#ef4444',
      },
      fonts: {
        primary: data.fonts?.primary || 'Inter, system-ui, sans-serif',
        secondary: data.fonts?.secondary || 'Inter, system-ui, sans-serif',
        code: data.fonts?.code || 'JetBrains Mono, monospace',
      },
      customCSS: data.customCSS,
      emailTemplate: data.emailTemplate,
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        updatedBy: data.updatedBy,
        version: 1,
      },
    });

    await branding.save();
    logger.info('Branding created successfully', { portalId: data.portalId });

    return branding;
  }

  /**
   * Get branding by portal ID
   */
  async getBrandingByPortalId(portalId: string): Promise<IBranding | null> {
    return Branding.findOne({ portalId });
  }

  /**
   * Update branding
   */
  async updateBranding(portalId: string, data: UpdateBrandingDTO): Promise<IBranding | null> {
    logger.info('Updating branding for portal', { portalId });

    const updateData: Record<string, unknown> = {
      'metadata.updatedAt': new Date(),
      'metadata.updatedBy': data.updatedBy,
    };

    if (data.logo) {
      updateData.logo = data.logo;
    }
    if (data.favicon) {
      updateData.favicon = data.favicon;
    }
    if (data.colors) {
      updateData.colors = data.colors;
    }
    if (data.fonts) {
      updateData.fonts = data.fonts;
    }
    if (data.customCSS !== undefined) {
      updateData.customCSS = data.customCSS;
    }
    if (data.emailTemplate) {
      updateData.emailTemplate = data.emailTemplate;
    }

    const branding = await Branding.findOneAndUpdate(
      { portalId },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (branding) {
      logger.info('Branding updated successfully', { portalId, version: branding.metadata.version });
    }

    return branding;
  }

  /**
   * Delete branding
   */
  async deleteBranding(portalId: string): Promise<boolean> {
    logger.info('Deleting branding for portal', { portalId });

    const result = await Branding.deleteOne({ portalId });
    return result.deletedCount > 0;
  }

  /**
   * Generate CSS variables from branding
   */
  generateCSSVariables(branding: IBranding): string {
    const colors = branding.colors;
    const fonts = branding.fonts;

    return `
:root {
  /* Primary Colors */
  --color-primary: ${colors.primary};
  --color-secondary: ${colors.secondary};
  --color-accent: ${colors.accent};
  --color-background: ${colors.background};
  --color-text: ${colors.text};
  --color-success: ${colors.success};
  --color-warning: ${colors.warning};
  --color-error: ${colors.error};

  /* Typography */
  --font-primary: ${fonts.primary};
  --font-secondary: ${fonts.secondary};
  --font-code: ${fonts.code};

  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;

  /* Border Radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 1rem;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
}
    `.trim();
  }

  /**
   * Generate email template HTML
   */
  generateEmailTemplate(branding: IBranding, content: string): string {
    const logo = branding.emailTemplate?.headerLogo || branding.logo.url;
    const footerText = branding.emailTemplate?.footerText || '';
    const socialLinks = branding.emailTemplate?.socialLinks || {};
    const primaryColor = branding.colors.primary;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email</title>
  <style>
    body { font-family: ${branding.fonts.primary}; margin: 0; padding: 0; background-color: ${branding.colors.background}; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 20px 0; border-bottom: 2px solid ${primaryColor}; }
    .header img { max-width: 150px; height: auto; }
    .content { padding: 30px 20px; color: ${branding.colors.text}; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: ${branding.colors.secondary}; border-top: 1px solid #e5e7eb; }
    .social-links { margin: 15px 0; }
    .social-links a { margin: 0 10px; color: ${primaryColor}; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${logo}" alt="${branding.logo.alt}">
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      ${footerText}
      ${Object.keys(socialLinks).length > 0 ? `
      <div class="social-links">
        ${socialLinks.twitter ? `<a href="${socialLinks.twitter}">Twitter</a>` : ''}
        ${socialLinks.linkedin ? `<a href="${socialLinks.linkedin}">LinkedIn</a>` : ''}
        ${socialLinks.facebook ? `<a href="${socialLinks.facebook}">Facebook</a>` : ''}
      </div>
      ` : ''}
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Get branding history (versions)
   */
  async getBrandingHistory(portalId: string): Promise<{
    currentVersion: number;
    lastUpdated: Date;
    updatedBy: string;
  }> {
    const branding = await Branding.findOne({ portalId });
    if (!branding) {
      throw new Error('Branding not found');
    }

    return {
      currentVersion: branding.metadata.version,
      lastUpdated: branding.metadata.updatedAt,
      updatedBy: branding.metadata.updatedBy,
    };
  }

  /**
   * Validate color format
   */
  validateColor(color: string): boolean {
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return hexColorRegex.test(color);
  }

  /**
   * Validate font URL
   */
  validateFontUrl(url: string): boolean {
    const fontProviders = ['fonts.googleapis.com', 'fonts.gstatic.com', 'use.typekit.net'];
    return fontProviders.some((provider) => url.includes(provider));
  }
}

export const brandingService = new BrandingService();