/**
 * Minimal WalletConfig model for rez-wallet-service.
 *
 * Only the fields consumed by this service are declared here.
 * The canonical schema lives in rezbackend/src/models/WalletConfig.ts.
 * Both models point at the same MongoDB collection ("walletconfigs") so unknown
 * change made via the admin panel is immediately visible to this service.
 */
import mongoose, { Schema, Document } from 'mongoose';

interface IWalletConfigMinimal extends Document {
  singleton: boolean;
  coinConversion: {
    rezToInr: number;
  };
}

const WalletConfigSchema = new Schema<IWalletConfigMinimal>(
  {
    singleton: { type: Boolean, default: true },
    coinConversion: {
      rezToInr: { type: Number, default: 1 },
    },
  },
  {
    // Do not declare timestamps here — the monolith schema owns them.
    strict: false, // allow extra fields from the full monolith document
    collection: 'walletconfigs',
  },
);

// Reuse the model if already registered (hot-reload / test safety)
export const WalletConfig =
  (mongoose.models['WalletConfig'] as mongoose.Model<IWalletConfigMinimal>) ||
  mongoose.model<IWalletConfigMinimal>('WalletConfig', WalletConfigSchema);
