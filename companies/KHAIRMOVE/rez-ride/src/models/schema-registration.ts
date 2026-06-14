// Schema Registration - Explicitly registers all Mongoose schemas
// This file must be imported BEFORE any service that uses these models

import mongoose from 'mongoose';
import { RideWalletSchema } from './wallet.model';
import { WalletTransactionSchema } from './wallet-transaction.model';
import { RentalBookingSchema } from './rental.model';

// Register all schemas explicitly
if (!mongoose.models.RideWallet) {
  mongoose.model('RideWallet', RideWalletSchema);
}

if (!mongoose.models.WalletTransaction) {
  mongoose.model('WalletTransaction', WalletTransactionSchema);
}

if (!mongoose.models.RentalBooking) {
  mongoose.model('RentalBooking', RentalBookingSchema);
}

export const registerSchemas = () => {
  // Ensure all schemas are registered
  if (!mongoose.models.RideWallet) {
    mongoose.model('RideWallet', RideWalletSchema);
  }
  if (!mongoose.models.WalletTransaction) {
    mongoose.model('WalletTransaction', WalletTransactionSchema);
  }
  if (!mongoose.models.RentalBooking) {
    mongoose.model('RentalBooking', RentalBookingSchema);
  }
};
