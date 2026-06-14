/**
 * REZ Privacy Layer - Transaction Masking Service
 * Backend has full info, frontend shows masked/dummy data
 */

import express from 'express';
import mongoose from 'mongoose';

const app = express();
app.use(express.json());

// Privacy Settings Model
const PrivacySettings = mongoose.model('PrivacySettings', new mongoose.Schema({
  user_id: { type: String, required: true, unique: true },
  privacy_level: { type: String, enum: ['full', 'partial', 'hidden'], default: 'partial' },

  // What to hide
  hide_amounts: { type: Boolean, default: false },
  hide_merchant_names: { type: Boolean, default: false },
  hide_locations: { type: Boolean, default: false },
  hide_timestamps: { type: Boolean, default: false },
  hide_categories: { type: Boolean, default: false },

  // Custom masks
  mask_type: { type: String, enum: ['none', 'blur', 'black', 'dummy'], default: 'dummy' },

  // Whitelist (show to these users)
  show_to: [String],

  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}));

// Masking Rules
const MASKING_RULES = {
  // Amount masking
  amount: {
    full: (val: number) => val,
    partial: (val: number) => Math.round(val / 100) * 100, // Round to nearest 100
    hidden: () => 0
  },

  // Merchant name masking
  merchant: {
    full: (name: string) => name,
    partial: (name: string) => name.charAt(0) + '***',
    hidden: () => 'Hidden Merchant'
  },

  // Location masking
  location: {
    full: (loc: string) => loc,
    partial: (loc: string) => loc.split(',')[0] + ', India', // City only
    hidden: () => 'Hidden Location'
  },

  // Time masking
  time: {
    full: (date: Date) => date.toISOString(),
    partial: (date: Date) => date.toDateString(),
    hidden: () => null
  }
};

// Generate dummy data
function generateDummy(amount: number, merchant: string): { dummy_amount: number; dummy_merchant: string } {
  // Dummy merchant names
  const dummyMerchants = ['Shopping', 'Food Order', 'Online Purchase', 'Store', 'Service'];

  // Dummy amounts (rounded, different from real)
  // STATISTICAL: non-cryptographic variance for privacy masking
  const variance = Math.random() * 0.3 - 0.15; // -15% to +15%
  const dummyAmount = Math.round(amount * (1 + variance) / 50) * 50;

  return {
    dummy_amount: dummyAmount,
    dummy_merchant: dummyMerchants[Math.floor(Math.random() * dummyMerchants.length)]
  };
}

// GET /api/privacy/settings/:userId
app.get('/api/privacy/settings/:userId', async (req, res) => {
  let settings = await PrivacySettings.findOne({ user_id: req.params.userId });

  if (!settings) {
    settings = new PrivacySettings({ user_id: req.params.userId });
    await settings.save();
  }

  res.json(settings);
});

// PUT /api/privacy/settings/:userId
app.put('/api/privacy/settings/:userId', async (req, res) => {
  const { privacy_level, hide_amounts, hide_merchant_names, hide_locations, hide_timestamps, hide_categories, mask_type } = req.body;

  const settings = await PrivacySettings.findOneAndUpdate(
    { user_id: req.params.userId },
    {
      privacy_level,
      hide_amounts,
      hide_merchant_names,
      hide_locations,
      hide_timestamps,
      hide_categories,
      mask_type,
      updated_at: new Date()
    },
    { upsert: true, new: true }
  );

  res.json({ success: true, settings });
});

// POST /api/privacy/mask-transaction
app.post('/api/privacy/mask-transaction', async (req, res) => {
  const { user_id, transaction, requesting_user_id } = req.body;

  // Get user privacy settings
  const settings = await PrivacySettings.findOne({ user_id }) ||
    new PrivacySettings({ user_id });

  // Check whitelist
  if (settings.show_to.includes(requesting_user_id)) {
    return res.json({ transaction, masked: false });
  }

  // Apply masking based on settings
  const masked = { ...transaction };

  if (settings.hide_amounts || settings.privacy_level === 'hidden') {
    masked.amount = 0;
    masked.dummy_amount = generateDummy(transaction.amount, transaction.merchant).dummy_amount;
  } else if (settings.privacy_level === 'partial') {
    masked.amount = MASKING_RULES.amount.partial(transaction.amount);
  }

  if (settings.hide_merchant_names || settings.privacy_level === 'hidden') {
    masked.merchant = settings.hide_merchant_names ? 'Hidden' : MASKING_RULES.merchant.partial(transaction.merchant);
    masked.dummy_merchant = generateDummy(transaction.amount, transaction.merchant).dummy_merchant;
  }

  if (settings.hide_locations || settings.privacy_level === 'hidden') {
    masked.location = null;
  } else if (settings.privacy_level === 'partial') {
    masked.location = MASKING_RULES.location.partial(transaction.location);
  }

  if (settings.hide_timestamps || settings.privacy_level === 'hidden') {
    masked.timestamp = null;
  }

  // Add masking metadata
  masked._masked = true;
  masked._mask_level = settings.privacy_level;

  res.json({ transaction: masked, masked: true });
});

// POST /api/privacy/mask-transactions
app.post('/api/privacy/mask-transactions', async (req, res) => {
  const { user_id, transactions, requesting_user_id } = req.body;

  const maskedTransactions = [];

  for (const tx of transactions) {
    // Process each transaction
    const result = await maskTransaction(user_id, tx, requesting_user_id);
    maskedTransactions.push(result.transaction);
  }

  res.json({ transactions: maskedTransactions, masked_count: maskedTransactions.length });
});

// Helper: Mask single transaction
async function maskTransaction(userId: string, transaction, requestingUserId?: string) {
  const settings = await PrivacySettings.findOne({ user_id: userId }) ||
    new PrivacySettings({ user_id });

  // Check whitelist
  if (requestingUserId && settings.show_to.includes(requestingUserId)) {
    return { transaction, masked: false };
  }

  const masked = { ...transaction };
  const dummy = generateDummy(transaction.amount || 0, transaction.merchant || 'Unknown');

  switch (settings.privacy_level) {
    case 'hidden':
      masked.amount = dummy.dummy_amount;
      masked.merchant = dummy.dummy_merchant;
      masked.location = null;
      masked.timestamp = null;
      break;
    case 'partial':
      masked.amount = MASKING_RULES.amount.partial(transaction.amount);
      masked.merchant = MASKING_RULES.merchant.partial(transaction.merchant);
      masked.location = MASKING_RULES.location.partial(transaction.location);
      break;
    case 'full':
    default:
      // No masking
      break;
  }

  // Apply individual settings
  if (settings.hide_amounts) masked.amount = dummy.dummy_amount;
  if (settings.hide_merchant_names) masked.merchant = 'Hidden';
  if (settings.hide_locations) masked.location = null;
  if (settings.hide_timestamps) masked.timestamp = null;

  // Add metadata
  masked._masked = true;
  masked._mask_level = settings.privacy_level;
  masked._original = {
    amount: transaction.amount,
    merchant: transaction.merchant
  };

  return { transaction: masked, masked: true };
}

// POST /api/privacy/preview
app.post('/api/privacy/preview', async (req, res) => {
  const { user_id, transaction } = req.body;

  // Return all 3 privacy levels preview
  const previews = {
    full: { ...transaction, _mask_level: 'full' },
    partial: {
      ...transaction,
      amount: MASKING_RULES.amount.partial(transaction.amount),
      merchant: MASKING_RULES.merchant.partial(transaction.merchant),
      location: MASKING_RULES.location.partial(transaction.location),
      _mask_level: 'partial'
    },
    hidden: {
      ...generateDummy(transaction.amount, transaction.merchant),
      location: null,
      timestamp: null,
      _mask_level: 'hidden'
    }
  };

  res.json(previews);
});

// POST /api/privacy/whitelist/add
app.post('/api/privacy/whitelist/add', async (req, res) => {
  const { user_id, show_to_user_id } = req.body;

  await PrivacySettings.findOneAndUpdate(
    { user_id },
    { $addToSet: { show_to: show_to_user_id } },
    { upsert: true }
  );

  res.json({ success: true });
});

// POST /api/privacy/whitelist/remove
app.post('/api/privacy/whitelist/remove', async (req, res) => {
  const { user_id, remove_user_id } = req.body;

  await PrivacySettings.findOneAndUpdate(
    { user_id },
    { $pull: { show_to: remove_user_id } }
  );

  res.json({ success: true });
});

export default app;
