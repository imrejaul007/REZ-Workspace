import { v4 as uuidv4 } from 'uuid';
import { Localization, ILocalization, ITranslation } from '../models/Localization';
import { Translation } from '../models/Translation';
import { LocalizationVersion } from '../models/Version';
import { Locale } from '../models/Locale';
import { logger } from 'utils/logger.js';
import { recordLocalizationOperation, recordLocaleUsage } from '../utils/metrics';

export interface CreateLocalizationInput {
  contentId: string;
  contentType: string;
  sourceLocale: string;
  targetLocale: string;
  translations?: Array<{
    field: string;
    sourceText: string;
    translatedText: string;
    machineTranslated?: boolean;
    confidence?: number;
  }>;
  createdBy: string;
}

export interface TranslateInput {
  fields: Array<{
    field: string;
    sourceText: string;
  }>;
  translator: string;
  useMachineTranslation?: boolean;
}

export class LocalizationService {
  async create(input: CreateLocalizationInput): Promise<ILocalization> {
    try {
      const localizationId = `loc-${uuidv4()}`;

      const translations = (input.translations || []).map(t => ({
        translationId: `tr-${uuidv4()}`,
        field: t.field,
        sourceText: t.sourceText,
        translatedText: t.translatedText,
        status: 'completed' as const,
        machineTranslated: t.machineTranslated || false,
        editedFromMachine: false,
        confidence: t.confidence,
        completedAt: new Date()
      }));

      const wordCount = translations.reduce((sum, t) => sum + t.sourceText.split(/\s+/).length, 0);
      const characterCount = translations.reduce((sum, t) => sum + t.translatedText.length, 0);

      const localization = new Localization({
        localizationId,
        contentId: input.contentId,
        contentType: input.contentType,
        sourceLocale: input.sourceLocale,
        targetLocale: input.targetLocale,
        translations,
        metadata: {
          wordCount,
          characterCount
        },
        createdBy: input.createdBy,
        updatedBy: input.createdBy
      });

      await localization.save();

      recordLocalizationOperation('create', 'success');
      recordLocaleUsage(input.sourceLocale, input.targetLocale);

      logger.info('Localization created', { localizationId, contentId: input.contentId });
      return localization;
    } catch (error) {
      recordLocalizationOperation('create', 'error');
      logger.error('Failed to create localization', { error, input });
      throw error;
    }
  }

  async findById(localizationId: string): Promise<ILocalization | null> {
    try {
      const localization = await Localization.findOne({ localizationId });
      recordLocalizationOperation('read', localization ? 'success' : 'not_found');
      return localization;
    } catch (error) {
      recordLocalizationOperation('read', 'error');
      throw error;
    }
  }

  async findByContentId(contentId: string): Promise<ILocalization[]> {
    try {
      return await Localization.find({ contentId }).sort({ targetLocale: 1 });
    } catch (error) {
      throw error;
    }
  }

  async update(localizationId: string, input: any): Promise<ILocalization | null> {
    try {
      const existing = await Localization.findOne({ localizationId });
      if (!existing) {
        recordLocalizationOperation('update', 'not_found');
        return null;
      }

      if (input.translations) {
        input.translations = input.translations.map((t: any) => ({
          ...t,
          translationId: t.translationId || `tr-${uuidv4()}`
        }));

        const wordCount = input.translations.reduce((sum: number, t: any) => sum + (t.sourceText?.split(/\s+/).length || 0), 0);
        const characterCount = input.translations.reduce((sum: number, t: any) => sum + (t.translatedText?.length || 0), 0);
        input.metadata = { ...existing.metadata, wordCount, characterCount };
      }

      const localization = await Localization.findOneAndUpdate(
        { localizationId },
        { $set: input },
        { new: true, runValidators: true }
      );

      if (localization) {
        recordLocalizationOperation('update', 'success');
        logger.info('Localization updated', { localizationId });
      }

      return localization;
    } catch (error) {
      recordLocalizationOperation('update', 'error');
      logger.error('Failed to update localization', { error, localizationId });
      throw error;
    }
  }

  async translate(localizationId: string, input: TranslateInput): Promise<ILocalization | null> {
    try {
      const localization = await Localization.findOne({ localizationId });
      if (!localization) {
        recordLocalizationOperation('translate', 'not_found');
        return null;
      }

      const newTranslations = input.fields.map(f => {
        // In production, integrate with translation API (Google Translate, DeepL, etc.)
        const translatedText = input.useMachineTranslation
          ? `[MT] ${f.sourceText}` // Placeholder for actual MT
          : f.sourceText;

        return {
          translationId: `tr-${uuidv4()}`,
          field: f.field,
          sourceText: f.sourceText,
          translatedText,
          status: 'in_progress' as const,
          translator: input.translator,
          machineTranslated: input.useMachineTranslation || false,
          editedFromMachine: false,
          completedAt: new Date()
        };
      });

      localization.translations.push(...newTranslations);
      localization.status = 'in_progress';
      localization.metadata.translator = input.translator;
      localization.metadata.wordCount += newTranslations.reduce((sum, t) => sum + t.sourceText.split(/\s+/).length, 0);
      localization.metadata.characterCount += newTranslations.reduce((sum, t) => sum + t.translatedText.length, 0);
      localization.updatedBy = input.translator;

      await localization.save();

      recordLocalizationOperation('translate', 'success');
      recordLocaleUsage(localization.sourceLocale, localization.targetLocale);

      logger.info('Translations added', { localizationId, count: newTranslations.length });
      return localization;
    } catch (error) {
      recordLocalizationOperation('translate', 'error');
      logger.error('Failed to translate', { error, localizationId });
      throw error;
    }
  }

  async getVersions(localizationId: string): Promise<any[]> {
    try {
      return await LocalizationVersion.find({ localizationId }).sort({ version: -1 });
    } catch (error) {
      throw error;
    }
  }

  async createVersion(localizationId: string, createdBy: string, changes?: string): Promise<any | null> {
    try {
      const localization = await Localization.findOne({ localizationId });
      if (!localization) return null;

      const versionId = `v-${uuidv4()}`;
      const version = new LocalizationVersion({
        versionId,
        localizationId,
        version: localization.version,
        translations: localization.translations.map(t => ({
          field: t.field,
          translatedText: t.translatedText
        })),
        changes,
        createdBy
      });

      await version.save();

      localization.version += 1;
      await localization.save();

      return version;
    } catch (error) {
      throw error;
    }
  }

  async findByLocale(sourceLocale?: string, targetLocale?: string): Promise<ILocalization[]> {
    try {
      const query: any = {};
      if (sourceLocale) query.sourceLocale = sourceLocale;
      if (targetLocale) query.targetLocale = targetLocale;
      return await Localization.find(query).sort({ createdAt: -1 });
    } catch (error) {
      throw error;
    }
  }

  async getLocales(): Promise<any[]> {
    try {
      return await Locale.find({ isActive: true }).sort({ isDefault: -1, name: 1 });
    } catch (error) {
      throw error;
    }
  }

  async createLocale(input: {
    code: string;
    name: string;
    nativeName: string;
    direction?: 'ltr' | 'rtl';
    region?: string;
  }): Promise<any> {
    try {
      const localeId = `locale-${uuidv4()}`;
      const locale = new Locale({
        localeId,
        ...input,
        direction: input.direction || 'ltr'
      });
      await locale.save();
      logger.info('Locale created', { localeId, code: input.code });
      return locale;
    } catch (error) {
      throw error;
    }
  }
}

export const localizationService = new LocalizationService();