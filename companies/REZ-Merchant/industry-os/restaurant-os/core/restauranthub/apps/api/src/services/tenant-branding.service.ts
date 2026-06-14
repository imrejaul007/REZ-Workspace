/**
 * Tenant Branding Service
 *
 * Provides per-tenant branding configuration management
 * including logos, colors, and custom CSS.
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient, TenantBranding } from '@prisma/client';

const prisma = new PrismaClient();
const logger = new Logger('TenantBrandingService');

export interface BrandingConfig {
  tenantId: string;
  logo?: string | null;
  logoWidth?: number;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  fonts?: {
    heading?: string;
    body?: string;
  };
  theme?: {
    id: string;
    name: string;
  };
  customCss?: string;
}

// Predefined themes
export const BRANDING_THEMES = {
  default: {
    id: 'default',
    name: 'Default',
    primaryColor: '#FF5722',
    secondaryColor: '#FFC107',
    accentColor: '#4CAF50',
    backgroundColor: '#FFFFFF',
    textColor: '#212121',
  },
  dark: {
    id: 'dark',
    name: 'Dark Mode',
    primaryColor: '#BB86FC',
    secondaryColor: '#03DAC6',
    accentColor: '#CF6679',
    backgroundColor: '#121212',
    textColor: '#E1E1E1',
  },
  ocean: {
    id: 'ocean',
    name: 'Ocean Blue',
    primaryColor: '#0077B6',
    secondaryColor: '#00B4D8',
    accentColor: '#90E0EF',
    backgroundColor: '#CAF0F8',
    textColor: '#03045E',
  },
  forest: {
    id: 'forest',
    name: 'Forest Green',
    primaryColor: '#2D6A4F',
    secondaryColor: '#40916C',
    accentColor: '#95D5B2',
    backgroundColor: '#D8F3DC',
    textColor: '#1B4332',
  },
  sunset: {
    id: 'sunset',
    name: 'Sunset',
    primaryColor: '#E85D04',
    secondaryColor: '#F48C06',
    accentColor: '#FAA307',
    backgroundColor: '#FFBA08',
    textColor: '#370617',
  },
  minimal: {
    id: 'minimal',
    name: 'Minimal',
    primaryColor: '#000000',
    secondaryColor: '#666666',
    accentColor: '#999999',
    backgroundColor: '#FFFFFF',
    textColor: '#333333',
  },
};

/**
 * Get branding configuration for a tenant
 */
export async function getTenantBranding(
  tenantId: string,
): Promise<BrandingConfig | null> {
  const branding = await prisma.tenantBranding.findUnique({
    where: { tenantId },
  });

  if (!branding) {
    return null;
  }

  return formatBrandingConfig(branding);
}

/**
 * Get or create default branding for a tenant
 */
export async function getOrCreateTenantBranding(
  tenantId: string,
  themeId?: string,
): Promise<BrandingConfig> {
  let branding = await prisma.tenantBranding.findUnique({
    where: { tenantId },
  });

  if (!branding) {
    const theme = themeId ? BRANDING_THEMES[themeId as keyof typeof BRANDING_THEMES] : BRANDING_THEMES.default;

    branding = await prisma.tenantBranding.create({
      data: {
        tenantId,
        primaryColor: theme.primaryColor,
        secondaryColor: theme.secondaryColor,
        accentColor: theme.accentColor,
        backgroundColor: theme.backgroundColor,
        textColor: theme.textColor,
        themeId: theme.id,
        themeName: theme.name,
      },
    });
  }

  return formatBrandingConfig(branding);
}

/**
 * Update branding configuration
 */
export async function updateTenantBranding(
  tenantId: string,
  data: Partial<{
    logoUrl: string;
    logoWidth: number;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    backgroundColor: string;
    textColor: string;
    headingFontFamily: string;
    bodyFontFamily: string;
    customCss: string;
    themeId: string;
    themeName: string;
  }>,
): Promise<BrandingConfig> {
  const branding = await prisma.tenantBranding.upsert({
    where: { tenantId },
    update: data,
    create: {
      tenantId,
      ...data,
    },
  });

  return formatBrandingConfig(branding);
}

/**
 * Apply a predefined theme
 */
export async function applyTheme(
  tenantId: string,
  themeId: string,
): Promise<BrandingConfig> {
  const theme = BRANDING_THEMES[themeId as keyof typeof BRANDING_THEMES];

  if (!theme) {
    throw new Error(`Unknown theme: ${themeId}. Available themes: ${Object.keys(BRANDING_THEMES).join(', ')}`);
  }

  return updateTenantBranding(tenantId, {
    primaryColor: theme.primaryColor,
    secondaryColor: theme.secondaryColor,
    accentColor: theme.accentColor,
    backgroundColor: theme.backgroundColor,
    textColor: theme.textColor,
    themeId: theme.id,
    themeName: theme.name,
  });
}

/**
 * Reset to default theme
 */
export async function resetToDefault(tenantId: string): Promise<BrandingConfig> {
  return applyTheme(tenantId, 'default');
}

/**
 * Delete branding configuration
 */
export async function deleteTenantBranding(tenantId: string): Promise<boolean> {
  const result = await prisma.tenantBranding.deleteMany({
    where: { tenantId },
  });

  return result.count > 0;
}

/**
 * Get list of available themes
 */
export function getAvailableThemes(): Array<{
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
}> {
  return Object.values(BRANDING_THEMES).map((theme) => ({
    id: theme.id,
    name: theme.name,
    colors: {
      primary: theme.primaryColor,
      secondary: theme.secondaryColor,
      accent: theme.accentColor,
      background: theme.backgroundColor,
      text: theme.textColor,
    },
  }));
}

/**
 * Validate hex color
 */
export function isValidHexColor(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}

/**
 * Validate font family name
 */
export function isValidFontFamily(font: string): boolean {
  // Basic validation - allow alphanumeric, spaces, and common font separators
  return /^[a-zA-Z0-9\s,'-]+$/.test(font);
}

/**
 * Format raw branding data to client-ready config
 */
function formatBrandingConfig(branding: TenantBranding): BrandingConfig {
  return {
    tenantId: branding.tenantId,
    logo: branding.logoUrl,
    logoWidth: branding.logoWidth ?? 150,
    colors: {
      primary: branding.primaryColor,
      secondary: branding.secondaryColor,
      accent: branding.accentColor,
      background: branding.backgroundColor,
      text: branding.textColor,
    },
    fonts: {
      heading: branding.headingFontFamily ?? undefined,
      body: branding.bodyFontFamily ?? undefined,
    },
    theme: branding.themeId
      ? { id: branding.themeId, name: branding.themeName }
      : undefined,
    customCss: branding.customCss ?? undefined,
  };
}

/**
 * Generate CSS variables from branding config
 */
export function generateCssVariables(branding: BrandingConfig): string {
  return `
    :root {
      --brand-primary: ${branding.colors.primary};
      --brand-secondary: ${branding.colors.secondary};
      --brand-accent: ${branding.colors.accent};
      --brand-background: ${branding.colors.background};
      --brand-text: ${branding.colors.text};
      ${branding.fonts?.heading ? `--brand-font-heading: ${branding.fonts.heading};` : ''}
      ${branding.fonts?.body ? `--brand-font-body: ${branding.fonts.body};` : ''}
    }
  `;
}

/**
 * Generate inline styles object for React components
 */
export function generateInlineStyles(branding: BrandingConfig): {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  primaryColorRGB: string;
  secondaryColorRGB: string;
} {
  const hexToRgb = (hex: string): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
      : '0, 0, 0';
  };

  return {
    primaryColor: branding.colors.primary,
    secondaryColor: branding.colors.secondary,
    accentColor: branding.colors.accent,
    backgroundColor: branding.colors.background,
    textColor: branding.colors.text,
    primaryColorRGB: hexToRgb(branding.colors.primary),
    secondaryColorRGB: hexToRgb(branding.colors.secondary),
  };
}
