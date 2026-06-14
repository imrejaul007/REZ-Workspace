import { z } from 'zod';

// ==========================================
// MESSAGE TEMPLATE SCHEMA
// ==========================================

export const MessageTemplate = z.object({
 id: z.string(),
 label: z.string(),
 message: z.string(),
 icon: z.string().optional(),
 type: z.enum(['normal', 'sos', 'emergency']).default('normal'),
 requiresLocation: z.boolean().default(false),
});
export type MessageTemplate = z.infer<typeof MessageTemplate>;

// ==========================================
// TEMPLATES BY MODE
// ==========================================

export const templatesByMode: Record<string, MessageTemplate[]> = {
 pet: [
   {
     id: 'found_pet',
     label: 'Found your pet!',
     message: 'I found your pet. They seem safe. How should I proceed?',
     icon: '',
     type: 'normal',
   },
   {
     id: 'pet_safe',
     label: 'Pet seems safe',
     message: 'Your pet appears to be safe and unharmed.',
     icon: '',
     type: 'normal',
   },
   {
     id: 'pet_needs_help',
     label: 'Pet needs help',
     message: 'Your pet appears to need assistance. Please respond urgently.',
     icon: '',
     type: 'emergency',
     requiresLocation: true,
   },
   {
     id: 'contacting_lost',
     label: 'About your lost pet',
     message: 'I have information about your lost pet. Please respond.',
     icon: '',
     type: 'normal',
   },
 ],

 personal: [
   {
     id: 'contact_request',
     label: 'Contact request',
     message: "I'd like to connect with you. Please accept my contact request.",
     icon: '',
     type: 'normal',
   },
   {
     id: 'business_inquiry',
     label: 'Business inquiry',
     message: 'I have a business inquiry for you.',
     icon: '',
     type: 'normal',
   },
   {
     id: 'networking',
     label: 'Networking',
     message: "I'd like to connect with you for networking purposes.",
     icon: '',
     type: 'normal',
   },
 ],

 device: [
   {
     id: 'found_device',
     label: 'Found your device',
     message: 'I found this device and scanned the QR to help locate the owner.',
     icon: '',
     type: 'normal',
   },
   {
     id: 'device_location',
     label: 'Device location info',
     message: 'I have information about your device location.',
     icon: '',
     type: 'normal',
     requiresLocation: true,
   },
   {
     id: 'device_secure',
     label: 'Device is secure',
     message: "Your device appears to be secure. I'm keeping it safe.",
     icon: '',
     type: 'normal',
   },
 ],

 medical: [
   {
     id: 'emergency',
     label: 'EMERGENCY',
     message: 'EMERGENCY: I need to contact you about a medical situation. Please respond immediately.',
     icon: '',
     type: 'emergency',
     requiresLocation: true,
   },
   {
     id: 'need_info',
     label: 'Need medical info',
     message: 'I need to access the medical information on this QR.',
     icon: '',
     type: 'normal',
   },
   {
     id: 'calling_ambulance',
     label: 'Calling ambulance',
     message: 'I am calling an ambulance for this person.',
     icon: '',
     type: 'emergency',
     requiresLocation: true,
   },
 ],

 helmet: [
   {
     id: 'emergency',
     label: 'EMERGENCY',
     message: 'EMERGENCY: There has been an accident. Please respond.',
     icon: '',
     type: 'emergency',
     requiresLocation: true,
   },
   {
     id: 'need_help',
     label: 'Need help',
     message: "I've been involved in an incident and need assistance.",
     icon: '',
     type: 'emergency',
     requiresLocation: true,
   },
   {
     id: 'accident_reported',
     label: 'Accident reported',
     message: 'I have reported this accident and am waiting for help.',
     icon: '',
     type: 'emergency',
     requiresLocation: true,
   },
 ],

 child: [
   {
     id: 'contacting_child',
     label: 'Contacting about child',
     message: 'I need to contact you regarding your child.',
     icon: '',
     type: 'normal',
   },
   {
     id: 'emergency_school',
     label: 'Emergency at school',
     message: 'There is an emergency situation involving your child at school.',
     icon: '',
     type: 'emergency',
   },
   {
     id: 'pickup_issue',
     label: 'Pickup issue',
     message: 'There is an issue with picking up your child. Please contact me.',
     icon: '',
     type: 'normal',
   },
 ],

 vehicle: [
   {
     id: 'blocking',
     label: 'Blocking your car',
     message: 'Your vehicle appears to be blocking access. Could you move it?',
     icon: '',
     type: 'normal',
   },
   {
     id: 'lights_on',
     label: 'Lights are on',
     message: 'Your vehicle lights appear to be on.',
     icon: '',
     type: 'normal',
   },
   {
     id: 'minor_damage',
     label: 'Minor damage noticed',
     message: 'I noticed minor damage on your vehicle. Please check.',
     icon: '',
     type: 'normal',
   },
   {
     id: 'cant_reach',
     label: "Can't reach by phone",
     message: "I've tried calling but can't reach you regarding your vehicle.",
     icon: '',
     type: 'normal',
   },
   {
     id: 'towing',
     label: 'Towing warning',
     message: 'Your vehicle is about to be towed. Please move it immediately.',
     icon: '',
     type: 'emergency',
   },
 ],

 bicycle: [
   {
     id: 'found_bicycle',
     label: 'Found your bicycle',
     message: 'I found your bicycle and scanned the QR to help.',
     icon: '',
     type: 'normal',
   },
   {
     id: 'bicycle_secure',
     label: 'Bicycle is secure',
     message: "Your bicycle appears to be secure. I'm keeping it safe.",
     icon: '',
     type: 'normal',
   },
 ],

 key: [
   {
     id: 'found_keys',
     label: 'Found your keys',
     message: 'I found these keys and scanned the QR to help locate the owner.',
     icon: '',
     type: 'normal',
   },
   {
     id: 'keys_location',
     label: 'Keys location',
     message: 'I found these keys at this location. How should I return them?',
     icon: '',
     type: 'normal',
     requiresLocation: true,
   },
 ],

 luggage: [
   {
     id: 'found_luggage',
     label: 'Found your luggage',
     message: 'I found this luggage and scanned the QR.',
     icon: '',
     type: 'normal',
   },
   {
     id: 'luggage_location',
     label: 'Luggage location',
     message: 'Your luggage is at this location. Please collect.',
     icon: '',
     type: 'normal',
     requiresLocation: true,
   },
 ],

 home: [
   {
     id: 'delivery',
     label: 'Delivery for you',
     message: 'There is a delivery for you.',
     icon: '',
     type: 'normal',
   },
   {
     id: 'visitor',
     label: 'Visitor check-in',
     message: 'I am a visitor and would like to check in.',
     icon: '',
     type: 'normal',
   },
   {
     id: 'emergency',
     label: 'Emergency',
     message: 'There is an emergency that requires your attention.',
     icon: '',
     type: 'emergency',
   },
   {
     id: 'note',
     label: 'Leave a note',
     message: 'I have a note for you regarding your property.',
     icon: '',
     type: 'normal',
   },
 ],

 office: [
   {
     id: 'visitor_arrival',
     label: 'Visitor arrival',
     message: 'A visitor has arrived to see you.',
     icon: '',
     type: 'normal',
   },
   {
     id: 'delivery_office',
     label: 'Office delivery',
     message: 'There is a delivery for you at the office.',
     icon: '',
     type: 'normal',
   },
   {
     id: 'emergency_office',
     label: 'Office emergency',
     message: 'There is an emergency at the office.',
     icon: '',
     type: 'emergency',
   },
 ],

 event: [
   {
     id: 'lost_child_event',
     label: 'Lost child at event',
     message: 'There is a lost child at the event who scanned this QR.',
     icon: '',
     type: 'emergency',
   },
   {
     id: 'medical_event',
     label: 'Medical assistance needed',
     message: 'Medical assistance is needed at the event.',
     icon: '',
     type: 'emergency',
   },
   {
     id: 'networking_event',
     label: 'Networking',
     message: "Let's connect! I found you through the event QR.",
     icon: '',
     type: 'normal',
   },
 ],

 student: [
   {
     id: 'school_emergency',
     label: 'School emergency',
     message: 'There is an emergency involving your child at school.',
     icon: '',
     type: 'emergency',
   },
   {
     id: 'bus_issue',
     label: 'Bus related',
     message: 'There is an issue with the school bus.',
     icon: '',
     type: 'normal',
   },
 ],

 package: [
   {
     id: 'delivery_failed',
     label: 'Delivery attempt',
     message: 'I attempted to deliver your package but was unable to.',
     icon: '',
     type: 'normal',
   },
   {
     id: 'wrong_address',
     label: 'Wrong address',
     message: 'There seems to be an issue with the delivery address.',
     icon: '',
     type: 'normal',
   },
 ],

 default: [
   {
     id: 'found_item',
     label: 'Found item',
     message: 'I found this item and scanned the QR to help.',
     icon: '',
     type: 'normal',
   },
   {
     id: 'need_contact',
     label: 'Need to reach owner',
     message: 'I need to contact the owner of this item.',
     icon: '',
     type: 'normal',
   },
 ],
};

/**
 * Get templates for a specific mode
 */
export function getTemplates(mode: string): MessageTemplate[] {
 return templatesByMode[mode] || templatesByMode.default || [];
}

/**
 * Get a specific template by ID and mode
 */
export function getTemplate(mode: string, templateId: string): MessageTemplate | undefined {
 const templates = getTemplates(mode);
 return templates.find((t) => t.id === templateId);
}

/**
 * Get all templates
 */
export function getAllTemplates(): Record<string, MessageTemplate[]> {
 return templatesByMode;
}
