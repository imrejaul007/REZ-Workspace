import logger from './utils/logger';

/**
 * Seed Script - Creates test data for development
 */

import mongoose from 'mongoose';
import { SafeQR, ScanEvent, KarmaState, KarmaFeedPost } from '../src/shared/models';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-safe-qr';

async function seed() {
 logger.info('Connecting to MongoDB...');
 await mongoose.connect(MONGODB_URI);
 logger.info('Connected!');

 // Clear existing data
 logger.info('Clearing existing data...');
 await Promise.all([
   SafeQR.deleteMany({}),
   ScanEvent.deleteMany({}),
   KarmaState.deleteMany({}),
   KarmaFeedPost.deleteMany({}),
 ]);

 logger.info('Creating test Safe QR codes...');

 // Pet QR
 const petQR = new SafeQR({
   shortcode: 'REZP01',
   qrId: 'pet_test001',
   mode: 'pet',
   ownerId: 'user_test001',
   status: 'active',
   profile: {
     mode: 'pet',
     name: 'Bruno',
     species: 'dog',
     breed: 'Golden Retriever',
     age: 3,
     gender: 'male',
     description: 'Friendly golden retriever, loves to play fetch',
     emergencyContacts: [
       { name: 'John Doe', phone: '9876543210', relationship: 'Owner' },
     ],
   },
   settings: {
     allowMessages: true,
     allowContactRequests: true,
     notifyOnScan: true,
   },
   qrPayload: { v: 1, type: 'safe', mode: 'pet', id: 'pet_test001', shortcode: 'REZP01' },
   stats: { totalScans: 42, uniqueScanners: 15, totalMessages: 5 },
   karma: { isRegistered: true },
 });
 await petQR.save();

 // Device QR
 const deviceQR = new SafeQR({
   shortcode: 'REZD01',
   qrId: 'dev_test001',
   mode: 'device',
   ownerId: 'user_test002',
   status: 'active',
   profile: {
     mode: 'device',
     deviceType: 'laptop',
     brand: 'Apple',
     model: 'MacBook Pro 14"',
     color: 'Space Gray',
     serialNumber: 'C02X1234ABCD',
   },
   settings: {
     allowMessages: true,
     allowContactRequests: true,
     notifyOnScan: true,
   },
   qrPayload: { v: 1, type: 'safe', mode: 'device', id: 'dev_test001', shortcode: 'REZD01' },
   stats: { totalScans: 8, uniqueScanners: 5, totalMessages: 2 },
   karma: { isRegistered: true },
 });
 await deviceQR.save();

 // Medical QR
 const medicalQR = new SafeQR({
   shortcode: 'REZM01',
   qrId: 'med_test001',
   mode: 'medical',
   ownerId: 'user_test001',
   status: 'active',
   profile: {
     mode: 'medical',
     displayName: 'Jane Smith',
     age: 32,
     bloodType: 'O+',
     allergies: [
       { allergen: 'Penicillin', severity: 'severe' },
       { allergen: 'Peanuts', severity: 'life-threatening' },
     ],
     medicalConditions: ['Asthma'],
     medications: [{ name: 'Inhaler', dosage: 'As needed' }],
     emergencyContacts: [
       { name: 'John Doe', phone: '9876543210', relationship: 'Husband' },
     ],
     disclaimer: 'Information is self-declared. Verify independently during emergencies.',
   },
   settings: {
     allowMessages: false,
     allowContactRequests: true,
     notifyOnScan: true,
   },
   qrPayload: { v: 1, type: 'safe', mode: 'medical', id: 'med_test001', shortcode: 'REZM01' },
   stats: { totalScans: 12, uniqueScanners: 8, totalMessages: 0 },
   karma: { isRegistered: true },
 });
 await medicalQR.save();

 // Vehicle QR
 const vehicleQR = new SafeQR({
   shortcode: 'REZV01',
   qrId: 'veh_test001',
   mode: 'vehicle',
   ownerId: 'user_test003',
   status: 'active',
   profile: {
     mode: 'vehicle',
     vehicleType: 'car',
     make: 'Maruti',
     model: 'Swift',
     color: 'White',
     plateNumber: 'KA01AB1234',
     parkingNotes: 'Visitor parking, back by 6pm',
     preferredContact: 'message',
   },
   settings: {
     allowMessages: true,
     allowContactRequests: true,
     notifyOnScan: true,
   },
   qrPayload: { v: 1, type: 'safe', mode: 'vehicle', id: 'veh_test001', shortcode: 'REZV01' },
   stats: { totalScans: 25, uniqueScanners: 20, totalMessages: 8 },
   karma: { isRegistered: true },
 });
 await vehicleQR.save();

 // Create karma states
 const karmaStates = [
   { userId: 'user_test001', totalPoints: 150, helpCount: 12, level: 'Helper' },
   { userId: 'user_test002', totalPoints: 75, helpCount: 5, level: 'Contributor' },
   { userId: 'user_test003', totalPoints: 25, helpCount: 2, level: 'Active' },
   { userId: 'user_test004', totalPoints: 500, helpCount: 45, level: 'Guardian' },
   { userId: 'user_test005', totalPoints: 1200, helpCount: 100, level: 'Hero' },
 ];

 for (const state of karmaStates) {
   const karma = new KarmaState(state);
   await karma.save();
 }

 // Create lost item feed post
 const lostPost = new KarmaFeedPost({
   postId: 'feed_test001',
   safeQRId: 'pet_test999',
   shortcode: 'REZP99',
   mode: 'pet',
   type: 'lost_item',
   title: 'LOST DOG: Max',
   description: 'Golden retriever, male, 3 years old. Last seen near City Park.',
   location: {
     type: 'Point',
     coordinates: [77.5946, 12.9716],
     address: 'City Park, MG Road',
   },
   photos: ['https://example.com/max1.jpg'],
   reward: { amount: 5000, currency: 'INR', message: 'No questions asked' },
   owner: { id: 'user_test001', name: 'John Doe', karmaLevel: 'Helper' },
   helpers: [
     { userId: 'user_test002', name: 'Jane', joinedAt: new Date() },
   ],
   status: 'active',
   expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
 });
 await lostPost.save();

 logger.info('Seed data created successfully!');
 logger.info('\nTest QR Codes:');
 logger.info('- REZP01: Pet (user_test001)');
 logger.info('- REZD01: Device (user_test002)');
 logger.info('- REZM01: Medical (user_test001)');
 logger.info('- REZV01: Vehicle (user_test003)');

 await mongoose.disconnect();
 logger.info('\nDone!');
}

seed().catch((err) => {
 logger.error('Seed failed:', err);
 process.exit(1);
});
