/**
 * Models Index - Export all MongoDB models
 */

export { BannerGenerationModel, BannerGenerationDocument } from './BannerGeneration';
export { BannerTemplateModel, BannerTemplateDocument } from './BannerTemplate';

export default {
  BannerGeneration: BannerGenerationModel,
  BannerTemplate: BannerTemplateModel,
};
