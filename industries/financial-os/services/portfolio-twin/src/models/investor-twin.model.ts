import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================================================
// INVESTOR TWIN DOCUMENT INTERFACE
// ============================================================================

export interface IInvestorTwin extends Document {
  _id: mongoose.Types.ObjectId;

  // Identity
  investor_id: string;
  twin_id: string;

  // Profile
  profile: {
    name: {
      first: string;
      last: string;
      middle?: string;
    };
    email: string;
    phone: string;
    investor_type: 'individual' | 'institutional' | 'corporate' | 'family_office';
    accredited: boolean;
    tax_id?: string;
  };

  // KYC
  kyc: {
    status: 'pending' | 'verified' | 'expired' | 'rejected';
    verification_date?: Date;
    risk_rating: 'conservative' | 'moderate' | 'aggressive';
    aml_check: 'passed' | 'pending' | 'failed';
  };

  // Preferences
  preferences: {
    investment_goals: string[];
    risk_tolerance: 'conservative' | 'moderate' | 'aggressive';
    time_horizon: 'short_term' | 'medium_term' | 'long_term';
    liquidity_needs: 'high' | 'medium' | 'low';
    ethical_screening: string[];
    preferred_asset_classes: string[];
    geographic_focus: string[];
  };

  // Financial Profile
  financial_profile: {
    net_worth: number;
    liquid_net_worth: number;
    annual_income: number;
    investment_capacity: number;
    debt_obligations: number;
  };

  // Portfolios
  portfolios: string[];

  // Connected Accounts
  connected_accounts: Array<{
    account_id: string;
    institution: string;
    account_type: string;
    last_synced?: Date;
  }>;

  // Activity
  activity: {
    last_login?: Date;
    last_trade?: Date;
    total_trades: number;
    avg_session_duration: number;
  };

  // Permissions
  permissions: {
    can_trade: boolean;
    can_leverage: boolean;
    can_short: boolean;
    max_position_size: number;
    allowed_strategies: string[];
  };

  // Metadata
  version: number;
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// INVESTOR TWIN SCHEMA
// ============================================================================

const NameSchema = new Schema({
  first: { type: String, required: true },
  last: { type: String, required: true },
  middle: { type: String },
}, { _id: false });

const ProfileSchema = new Schema({
  name: { type: NameSchema, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  investor_type: {
    type: String,
    enum: ['individual', 'institutional', 'corporate', 'family_office'],
    default: 'individual',
  },
  accredited: { type: Boolean, default: false },
  tax_id: { type: String },
}, { _id: false });

const KYCSchema = new Schema({
  status: {
    type: String,
    enum: ['pending', 'verified', 'expired', 'rejected'],
    default: 'pending',
  },
  verification_date: { type: Date },
  risk_rating: {
    type: String,
    enum: ['conservative', 'moderate', 'aggressive'],
    default: 'moderate',
  },
  aml_check: {
    type: String,
    enum: ['passed', 'pending', 'failed'],
    default: 'pending',
  },
}, { _id: false });

const PreferencesSchema = new Schema({
  investment_goals: [{ type: String }],
  risk_tolerance: {
    type: String,
    enum: ['conservative', 'moderate', 'aggressive'],
    default: 'moderate',
  },
  time_horizon: {
    type: String,
    enum: ['short_term', 'medium_term', 'long_term'],
    default: 'medium_term',
  },
  liquidity_needs: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium',
  },
  ethical_screening: [{ type: String }],
  preferred_asset_classes: [{ type: String }],
  geographic_focus: [{ type: String }],
}, { _id: false });

const FinancialProfileSchema = new Schema({
  net_worth: { type: Number, default: 0 },
  liquid_net_worth: { type: Number, default: 0 },
  annual_income: { type: Number, default: 0 },
  investment_capacity: { type: Number, default: 0 },
  debt_obligations: { type: Number, default: 0 },
}, { _id: false });

const ConnectedAccountSchema = new Schema({
  account_id: { type: String, required: true },
  institution: { type: String, required: true },
  account_type: { type: String, required: true },
  last_synced: { type: Date },
}, { _id: false });

const ActivitySchema = new Schema({
  last_login: { type: Date },
  last_trade: { type: Date },
  total_trades: { type: Number, default: 0 },
  avg_session_duration: { type: Number, default: 0 },
}, { _id: false });

const PermissionsSchema = new Schema({
  can_trade: { type: Boolean, default: true },
  can_leverage: { type: Boolean, default: false },
  can_short: { type: Boolean, default: false },
  max_position_size: { type: Number, default: 100000 },
  allowed_strategies: [{ type: String }],
}, { _id: false });

const InvestorTwinSchema = new Schema<IInvestorTwin>({
  investor_id: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  twin_id: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },

  // Profile
  profile: { type: ProfileSchema, required: true },

  // KYC
  kyc: { type: KYCSchema, default: () => ({}) },

  // Preferences
  preferences: { type: PreferencesSchema, default: () => ({}) },

  // Financial Profile
  financial_profile: { type: FinancialProfileSchema, default: () => ({}) },

  // Portfolios
  portfolios: [{ type: String }],

  // Connected Accounts
  connected_accounts: [ConnectedAccountSchema],

  // Activity
  activity: { type: ActivitySchema, default: () => ({}) },

  // Permissions
  permissions: { type: PermissionsSchema, default: () => ({}) },

  // Metadata
  version: { type: Number, default: 1 },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// Compound indexes
InvestorTwinSchema.index({ 'profile.email': 1 });
InvestorTwinSchema.index({ 'kyc.status': 1 });
InvestorTwinSchema.index({ 'preferences.risk_tolerance': 1 });
InvestorTwinSchema.index({ 'financial_profile.net_worth': -1 });

// Virtual for id
InvestorTwinSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

InvestorTwinSchema.set('toJSON', { virtuals: true });
InvestorTwinSchema.set('toObject', { virtuals: true });

// ============================================================================
// MODEL EXPORT
// ============================================================================

export const InvestorTwinModel: Model<IInvestorTwin> = mongoose.model<IInvestorTwin>('InvestorTwin', InvestorTwinSchema);
