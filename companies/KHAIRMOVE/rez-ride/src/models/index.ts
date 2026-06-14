// Models Index - Export all models and types
//
// IMPORTANT: This file re-exports both TypeScript types (interfaces) and Mongoose models.
// When importing for @InjectModel() decorators, use the model directly.
// When importing for type annotations, use the interface directly.
//
// Example:
//   import { Ride, IRide } from './models';
//   import type { IRide } from './models';
//
// For @InjectModel():
//   constructor(@InjectModel(Ride.name) private rideModel: Model<Ride>) {}

export * from './ride.model';
export * from './driver.model';
export * from './user.model';
export * from './voucher.model';
export * from './campaign.model';
export * from './wallet.model';
export * from './wallet-transaction.model';
export * from './audit.model';
export * from './corporate.model';
export * from './chat.model';
export * from './notification.model';
export * from './ticket.model';
export * from './scheduled-ride.model';
