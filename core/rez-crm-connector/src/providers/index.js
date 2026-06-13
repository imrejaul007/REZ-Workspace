/**
 * CRM Provider Registry
 * Supports multiple CRM systems: HubSpot, Zoho, Salesforce, and industry-specific
 */

const HubSpotProvider = require('./hubspot');
const ZohoProvider = require('./zoho');
const SalesforceProvider = require('./salesforce');
const IndustryProvider = require('./industry');

const providers = {
  hubspot: HubSpotProvider,
  zoho: ZohoProvider,
  salesforce: SalesforceProvider,
  salesforce_gov: IndustryProvider,
  salesforce_nonprofit: IndustryProvider,
  epic: IndustryProvider,
  cerner: IndustryProvider,
  toast: IndustryProvider,
  square: IndustryProvider,
  shopify: IndustryProvider,
  woocommerce: IndustryProvider,
  magento: IndustryProvider,
  mindbody: IndustryProvider,
  vagaro: IndustryProvider,
  glofox: IndustryProvider,
  clio: IndustryProvider,
  procore: IndustryProvider,
  sap: IndustryProvider,
  oracle: IndustryProvider,
  amadeus: IndustryProvider,
  sabre: IndustryProvider,
  travelport: IndustryProvider,
  cdk: IndustryProvider,
  reynolds: IndustryProvider,
  jobber: IndustryProvider,
  housecall: IndustryProvider,
  ticketmaster: IndustryProvider,
  stubhub: IndustryProvider,
  steam: IndustryProvider,
  epic_games: IndustryProvider,
  canvas: IndustryProvider,
  blackboard: IndustryProvider
};

module.exports = providers;
