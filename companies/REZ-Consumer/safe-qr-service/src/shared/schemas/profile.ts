import { z } from 'zod';

// ==========================================
// BASE PROFILE SCHEMAS
// ==========================================

export const EmergencyContact = z.object({
 name: z.string().min(1),
 phone: z.string().min(1),
 relationship: z.string().optional(),
 priority: z.enum(['primary', 'secondary', 'tertiary']).default('primary'),
});
export type EmergencyContact = z.infer<typeof EmergencyContact>;

export const GeoLocation = z.object({
 type: z.literal('Point').default('Point'),
 coordinates: z.tuple([z.number(), z.number()]).default([0, 0]), // [lng, lat]
 address: z.string().optional(),
});
export type GeoLocation = z.infer<typeof GeoLocation>;

// ==========================================
// PET PROFILE
// ==========================================

export const VaccinationRecord = z.object({
 vaccine: z.string().min(1),
 date: z.string(),
 vet: z.string().optional(),
 nextDue: z.string().optional(),
});
export type VaccinationRecord = z.infer<typeof VaccinationRecord>;

export const PetProfile = z.object({
 name: z.string().min(1),
 species: z.enum(['dog', 'cat', 'bird', 'rabbit', 'other']).default('dog'),
 breed: z.string().optional(),
 age: z.number().optional(),
 gender: z.enum(['male', 'female', 'unknown']).optional(),
 photo: z.string().optional(),
 photos: z.array(z.string()).default([]),
 description: z.string().optional(),
 vaccinationRecords: z.array(VaccinationRecord).default([]),
 microchipId: z.string().optional(),
 vetName: z.string().optional(),
 vetPhone: z.string().optional(),
 emergencyContacts: z.array(EmergencyContact).default([]),
 lastSeenLocation: GeoLocation.optional(),
 isNeutered: z.boolean().optional(),
});
export type PetProfile = z.infer<typeof PetProfile>;

// ==========================================
// PERSONAL PROFILE
// ==========================================

export const SocialLinks = z.object({
 instagram: z.string().optional(),
 linkedin: z.string().optional(),
 twitter: z.string().optional(),
 website: z.string().optional(),
 facebook: z.string().optional(),
});
export type SocialLinks = z.infer<typeof SocialLinks>;

export const PersonalProfile = z.object({
 displayName: z.string().min(1),
 bio: z.string().max(200).optional(),
 profession: z.string().optional(),
 company: z.string().optional(),
 socialLinks: SocialLinks.optional(),
 contactPreference: z.enum(['approve_all', 'approve_known', 'manual_review']).default('manual_review'),
 avatar: z.string().optional(),
 showSocialLinks: z.boolean().default(false),
});
export type PersonalProfile = z.infer<typeof PersonalProfile>;

// ==========================================
// DEVICE PROFILE
// ==========================================

export const DeviceProfile = z.object({
 deviceType: z.enum(['laptop', 'phone', 'tablet', 'camera', 'watch', 'other']).default('laptop'),
 brand: z.string().min(1),
 model: z.string().optional(),
 color: z.string().optional(),
 serialNumber: z.string().optional(),
 purchaseDate: z.string().optional(),
 purchaseProof: z.string().optional(), // URL to image
 photos: z.array(z.string()).default([]),
 ownershipChallenge: z.object({
   question: z.string(),
   answer: z.string(),
   hint: z.string().optional(),
 }).optional(),
 recoveryQuestion: z.string().optional(),
 recoveryAnswer: z.string().optional(),
});
export type DeviceProfile = z.infer<typeof DeviceProfile>;

// ==========================================
// MEDICAL PROFILE
// ==========================================

export const Allergy = z.object({
 allergen: z.string().min(1),
 severity: z.enum(['mild', 'moderate', 'severe', 'life-threatening']).default('moderate'),
 notes: z.string().optional(),
});
export type Allergy = z.infer<typeof Allergy>;

export const Medication = z.object({
 name: z.string().min(1),
 dosage: z.string().optional(),
 frequency: z.string().optional(),
 notes: z.string().optional(),
});
export type Medication = z.infer<typeof Medication>;

export const MedicalProfile = z.object({
 displayName: z.string().min(1),
 age: z.number().optional(),
 gender: z.enum(['male', 'female', 'other', 'prefer-not-to-say']).optional(),
 bloodType: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown', 'not-sure']).optional(),
 allergies: z.array(Allergy).default([]),
 medicalConditions: z.array(z.string()).default([]),
 medications: z.array(Medication).default([]),
 organDonor: z.boolean().default(false),
 emergencyContacts: z.array(EmergencyContact).min(1),
 primaryPhysician: z.string().optional(),
 physicianPhone: z.string().optional(),
 insuranceProvider: z.string().optional(),
 insurancePolicy: z.string().optional(),
 medicalNotes: z.string().max(500).optional(),
 disclaimer: z.literal('Information is self-declared. Verify independently during emergencies.').default(
   'Information is self-declared. Verify independently during emergencies.'
 ),
 disclaimerAcceptedAt: z.date().optional(),
 lastVerifiedAt: z.date().optional(),
});
export type MedicalProfile = z.infer<typeof MedicalProfile>;

// ==========================================
// HELMET PROFILE
// ==========================================

export const HelmetProfile = z.object({
 displayName: z.string().min(1),
 bloodType: z.string().optional(),
 allergies: z.array(z.string()).default([]),
 medicalNotes: z.string().optional(),
 emergencyContacts: z.array(EmergencyContact).min(1),
 ridingExperience: z.enum(['beginner', 'intermediate', 'expert']).default('intermediate'),
 hasInsurance: z.boolean().default(false),
 insurancePolicyNumber: z.string().optional(),
 vehicleInfo: z.object({
   make: z.string().optional(),
   model: z.string().optional(),
   plateNumber: z.string().optional(),
   color: z.string().optional(),
 }).optional(),
});
export type HelmetProfile = z.infer<typeof HelmetProfile>;

// ==========================================
// CHILD PROFILE
// ==========================================

export const PickupPerson = z.object({
 name: z.string().min(1),
 phone: z.string().min(1),
 relationship: z.string().optional(),
 photo: z.string().optional(),
 pin: z.string().length(4).optional(),
 isAuthorized: z.boolean().default(true),
});
export type PickupPerson = z.infer<typeof PickupPerson>;

export const Guardian = z.object({
 userId: z.string().optional(),
 name: z.string().min(1),
 phone: z.string().min(1),
 relationship: z.enum(['parent', 'mother', 'father', 'grandparent', 'guardian', 'school', 'other']).default('parent'),
 isPrimary: z.boolean().default(false),
 notifyOnScan: z.boolean().default(true),
 email: z.string().optional(),
});
export type Guardian = z.infer<typeof Guardian>;

export const ChildProfile = z.object({
 firstName: z.string().min(1),
 lastName: z.string().optional(),
 age: z.number(),
 schoolName: z.string().optional(),
 schoolContact: z.string().optional(),
 schoolAddress: z.string().optional(),
 class: z.string().optional(),
 section: z.string().optional(),
 rollNumber: z.string().optional(),
 photo: z.string().optional(),
 guardians: z.array(Guardian).min(1),
 authorizedPickups: z.array(PickupPerson).default([]),
 medicalNotes: z.string().optional(),
 allergies: z.array(z.string()).default([]),
 busRoute: z.string().optional(),
 busNumber: z.string().optional(),
});
export type ChildProfile = z.infer<typeof ChildProfile>;

// ==========================================
// VEHICLE PROFILE
// ==========================================

export const VehicleAlertSettings = z.object({
 parkingIssue: z.boolean().default(true),
 damageAlert: z.boolean().default(true),
 lightsOn: z.boolean().default(true),
 towingWarning: z.boolean().default(true),
 emergency: z.boolean().default(true),
});
export type VehicleAlertSettings = z.infer<typeof VehicleAlertSettings>;

export const VehicleProfile = z.object({
 vehicleType: z.enum(['car', 'bike', 'truck', 'van', 'auto', 'other']).default('car'),
 make: z.string().min(1),
 model: z.string().optional(),
 year: z.number().optional(),
 color: z.string().optional(),
 plateNumber: z.string().optional(),
 plateState: z.string().optional(),
 parkingNotes: z.string().optional(),
 preferredContact: z.enum(['message', 'call', 'both', 'none']).default('message'),
 alertsEnabled: VehicleAlertSettings.default({}),
 photos: z.array(z.string()).default([]),
});
export type VehicleProfile = z.infer<typeof VehicleProfile>;

// ==========================================
// BICYCLE PROFILE
// ==========================================

export const BicycleProfile = z.object({
 brand: z.string().min(1),
 model: z.string().optional(),
 frameNumber: z.string().optional(),
 color: z.string().optional(),
 type: z.enum(['road', 'mountain', 'hybrid', 'city', 'kids', 'electric', 'other']).optional(),
 purchaseDate: z.string().optional(),
 purchaseProof: z.string().optional(),
 photos: z.array(z.string()).default([]),
 accessories: z.array(z.string()).default([]),
 estimatedValue: z.number().optional(),
});
export type BicycleProfile = z.infer<typeof BicycleProfile>;

// ==========================================
// KEY PROFILE
// ==========================================

export const KeyProfile = z.object({
 description: z.string().min(1),
 location: z.string().optional(), // Where keys belong
 keyType: z.enum(['home', 'office', 'locker', 'vehicle', 'other']).default('home'),
 recoveryQuestion: z.string().optional(),
 recoveryAnswer: z.string().optional(),
});
export type KeyProfile = z.infer<typeof KeyProfile>;

// ==========================================
// LUGGAGE PROFILE
// ==========================================

export const LuggageProfile = z.object({
 luggageType: z.enum(['suitcase', 'backpack', 'duffel', 'bag', 'other']).default('suitcase'),
 brand: z.string().optional(),
 color: z.string().optional(),
 distinguishingFeatures: z.string().optional(),
 tags: z.array(z.string()).default([]),
 travelMode: z.boolean().default(false),
 flightNumber: z.string().optional(),
 origin: z.string().optional(),
 destination: z.string().optional(),
 returnDate: z.string().optional(),
 multilingual: z.object({
   enabled: z.boolean().default(true),
   languages: z.array(z.string()).default(['en']),
   message: z.record(z.string(), z.string()).optional(), // language -> message
 }).default({}),
 rewardOffer: z.object({
   amount: z.number(),
   currency: z.string().default('INR'),
   message: z.string().optional(),
 }).optional(),
});
export type LuggageProfile = z.infer<typeof LuggageProfile>;

// ==========================================
// HOME PROFILE
// ==========================================

export const HomeRole = z.object({
 userId: z.string(),
 name: z.string(),
 role: z.enum(['owner', 'tenant', 'family', 'security', 'staff']).default('family'),
 canReceiveDelivery: z.boolean().default(true),
 canReceiveVisitor: z.boolean().default(true),
 canReceiveEmergency: z.boolean().default(true),
 phone: z.string().optional(),
});
export type HomeRole = z.infer<typeof HomeRole>;

export const HomeProfile = z.object({
 address: z.object({
   flatNumber: z.string().optional(),
   buildingName: z.string().optional(),
   street: z.string().optional(),
   area: z.string().optional(),
   city: z.string().optional(),
   state: z.string().optional(),
   pincode: z.string().optional(),
   landmark: z.string().optional(),
 }),
 roles: z.array(HomeRole).min(1),
 preferences: z.object({
   deliveryInstructions: z.string().optional(),
   gateCode: z.string().optional(),
   preferredDeliveryTime: z.string().optional(),
   leaveWithNeighbour: z.string().optional(),
   safeSpotLocation: z.string().optional(),
 }).default({}),
 integrations: z.object({
   smartLock: z.string().optional(),
   intercom: z.string().optional(),
 }).optional(),
});
export type HomeProfile = z.infer<typeof HomeProfile>;

// ==========================================
// OFFICE PROFILE
// ==========================================

export const OfficeProfile = z.object({
 type: z.enum(['employee', 'visitor', 'desk', 'equipment', 'meeting_room']).default('employee'),
 employeeId: z.string().optional(),
 name: z.string().min(1),
 department: z.string().optional(),
 designation: z.string().optional(),
 deskLocation: z.string().optional(),
 floor: z.string().optional(),
 building: z.string().optional(),
 emergencyContactName: z.string().optional(),
 emergencyContactPhone: z.string().optional(),
 accessLevel: z.enum(['public', 'staff', 'restricted']).default('public'),
 photo: z.string().optional(),
});
export type OfficeProfile = z.infer<typeof OfficeProfile>;

// ==========================================
// EVENT PROFILE
// ==========================================

export const EventAttendee = z.object({
 userId: z.string(),
 name: z.string().min(1),
 ticketType: z.string().optional(),
 ticketId: z.string().optional(),
 emergencyContact: z.string().optional(),
 medicalNotes: z.string().optional(),
 isMinor: z.boolean().default(false),
 parentContact: z.string().optional(),
 checkedIn: z.boolean().default(false),
 checkedInAt: z.date().optional(),
});
export type EventAttendee = z.infer<typeof EventAttendee>;

export const EventProfile = z.object({
 eventName: z.string().min(1),
 eventDate: z.string(),
 eventEndDate: z.string().optional(),
 venue: z.string().min(1),
 organizerName: z.string().optional(),
 organizerContact: z.string().optional(),
 lostChildStation: z.string().optional(),
 medicalTent: z.string().optional(),
 securityContact: z.string().optional(),
 parkingInfo: z.string().optional(),
 attendees: z.array(EventAttendee).default([]),
 maxAttendees: z.number().optional(),
});
export type EventProfile = z.infer<typeof EventProfile>;

// ==========================================
// STUDENT PROFILE
// ==========================================

export const StudentProfile = z.object({
 studentId: z.string().optional(),
 firstName: z.string().min(1),
 lastName: z.string().optional(),
 schoolName: z.string().min(1),
 schoolId: z.string().optional(),
 class: z.string().min(1),
 section: z.string().optional(),
 rollNumber: z.string().optional(),
 busRoute: z.string().optional(),
 busNumber: z.string().optional(),
 pickupPersons: z.array(PickupPerson).default([]),
 parents: z.array(Guardian).min(1),
 medicalInfo: z.object({
   allergies: z.array(z.string()).default([]),
   conditions: z.array(z.string()).default([]),
   medications: z.array(z.string()).default([]),
 }).default({}),
 photo: z.string().optional(),
});
export type StudentProfile = z.infer<typeof StudentProfile>;

// ==========================================
// PACKAGE PROFILE
// ==========================================

export const PackageProfile = z.object({
 trackingId: z.string().optional(),
 senderName: z.string().optional(),
 senderPhone: z.string().optional(),
 receiverName: z.string().optional(),
 receiverPhone: z.string().optional(),
 packageType: z.enum(['document', 'parcel', 'fragile', 'perishable', 'other']).default('parcel'),
 weight: z.string().optional(),
 dimensions: z.string().optional(),
 description: z.string().optional(),
 status: z.enum(['pending', 'in_transit', 'out_for_delivery', 'delivered', 'failed', 'returned']).default('pending'),
 deliveryAttempt: z.object({
   attemptedAt: z.string(),
   reason: z.string(),
   photo: z.string().optional(),
 }).optional(),
 preferences: z.object({
   safeDropLocation: z.string().optional(),
   leaveWithNeighbour: z.string().optional(),
   preferredTime: z.string().optional(),
   alternateAddress: z.string().optional(),
 }).default({}),
 communication: z.object({
   senderCanMessage: z.boolean().default(true),
   receiverCanMessage: z.boolean().default(true),
   courierCanMessage: z.boolean().default(true),
 }).default({}),
});
export type PackageProfile = z.infer<typeof PackageProfile>;

// ==========================================
// UNION SCHEMA FOR ALL PROFILES
// ==========================================

export const ModeProfile = z.discriminatedUnion('mode', [
 PetProfile.extend({ mode: z.literal('pet') }),
 PersonalProfile.extend({ mode: z.literal('personal') }),
 DeviceProfile.extend({ mode: z.literal('device') }),
 MedicalProfile.extend({ mode: z.literal('medical') }),
 HelmetProfile.extend({ mode: z.literal('helmet') }),
 ChildProfile.extend({ mode: z.literal('child') }),
 VehicleProfile.extend({ mode: z.literal('vehicle') }),
 BicycleProfile.extend({ mode: z.literal('bicycle') }),
 KeyProfile.extend({ mode: z.literal('key') }),
 LuggageProfile.extend({ mode: z.literal('luggage') }),
 HomeProfile.extend({ mode: z.literal('home') }),
 OfficeProfile.extend({ mode: z.literal('office') }),
 EventProfile.extend({ mode: z.literal('event') }),
 StudentProfile.extend({ mode: z.literal('student') }),
 PackageProfile.extend({ mode: z.literal('package') }),
]);
export type ModeProfile = z.infer<typeof ModeProfile>;
