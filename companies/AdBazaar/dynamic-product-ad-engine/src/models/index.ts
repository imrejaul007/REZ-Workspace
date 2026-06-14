/**
 * Models Index
 * Export all MongoDB models
 */

export { ProductFeedModel, IProductFeed } from './ProductFeed';
export { DPACampaignModel, IDPACampaign } from './DPACampaign';

export default {
  ProductFeed: ProductFeedModel,
  DPACampaign: DPACampaignModel,
};