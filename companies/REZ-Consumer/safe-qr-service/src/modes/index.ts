// Export all mode services
export * from './pet/petService';
export * from './personal/personalService';
export * from './device/deviceService';
export * from './medical/medicalService';
export * from './helmet/helmetService';
export * from './child/childService';
export * from './vehicle/vehicleService';
export * from './bicycle/bicycleService';
export * from './key/keyService';
export * from './luggage/luggageService';
export * from './home/homeService';
export * from './office/officeService';
export * from './event/eventService';
export * from './student/studentService';
export * from './package/packageService';

// Mode configuration
export const modeConfig = {
 pet: {
   prefix: 'REZP',
   name: 'Pet Safe QR',
   description: 'Lost pet recovery',
   supportsLostMode: true,
   requiresApproval: true,
 },
 personal: {
   prefix: 'REZN',
   name: 'Personal Safe QR',
   description: 'Contact sharing',
   supportsLostMode: false,
   requiresApproval: true,
 },
 device: {
   prefix: 'REZD',
   name: 'Device Safe QR',
   description: 'Device recovery',
   supportsLostMode: true,
   requiresApproval: true,
 },
 medical: {
   prefix: 'REZM',
   name: 'Medical Safe QR',
   description: 'Emergency medical info',
   supportsLostMode: false,
   requiresApproval: false,
 },
 helmet: {
   prefix: 'REZH',
   name: 'Helmet Safe QR',
   description: 'Rider safety',
   supportsLostMode: false,
   requiresApproval: false,
 },
 child: {
   prefix: 'REZC',
   name: 'Child Safe QR',
   description: 'Child safety',
   supportsLostMode: false,
   requiresApproval: false,
 },
 vehicle: {
   prefix: 'REZV',
   name: 'Vehicle Safe QR',
   description: 'Vehicle alerts',
   supportsLostMode: false,
   requiresApproval: false,
 },
 bicycle: {
   prefix: 'REZB',
   name: 'Bicycle Safe QR',
   description: 'Bicycle recovery',
   supportsLostMode: true,
   requiresApproval: true,
 },
 key: {
   prefix: 'REZK',
   name: 'Key Safe QR',
   description: 'Key recovery',
   supportsLostMode: false,
   requiresApproval: true,
 },
 luggage: {
   prefix: 'REZL',
   name: 'Luggage Safe QR',
   description: 'Travel recovery',
   supportsLostMode: false,
   requiresApproval: false,
 },
 home: {
   prefix: 'REZA',
   name: 'Home Safe QR',
   description: 'Home access',
   supportsLostMode: false,
   requiresApproval: false,
 },
 office: {
   prefix: 'REZO',
   name: 'Office Safe QR',
   description: 'Office access',
   supportsLostMode: false,
   requiresApproval: true,
 },
 event: {
   prefix: 'REZE',
   name: 'Event Safe QR',
   description: 'Event coordination',
   supportsLostMode: false,
   requiresApproval: false,
 },
 student: {
   prefix: 'REZS',
   name: 'Student Safe QR',
   description: 'School safety',
   supportsLostMode: false,
   requiresApproval: false,
 },
 package: {
   prefix: 'REZP',
   name: 'Package Safe QR',
   description: 'Package tracking',
   supportsLostMode: false,
   requiresApproval: false,
 },
} as const;

export type ModeType = keyof typeof modeConfig;
