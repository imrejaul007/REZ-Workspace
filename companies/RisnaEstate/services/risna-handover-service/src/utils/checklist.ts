export type ChecklistCategory = 'interior' | 'exterior' | 'utilities' | 'documents' | 'keys' | 'other';

export interface DefaultChecklistItem {
  item: string;
  category: ChecklistCategory;
  required: boolean;
}

export const DEFAULT_CHECKLIST: DefaultChecklistItem[] = [
  // Keys
  { item: 'Main Door Keys', category: 'keys', required: true },
  { item: 'Bedroom Keys', category: 'keys', required: false },
  { item: 'Cupboard Keys', category: 'keys', required: false },
  { item: 'Parking Keys', category: 'keys', required: false },
  { item: 'Mailbox Key', category: 'keys', required: false },
  { item: 'Society Access Card', category: 'keys', required: false },

  // Documents
  { item: 'Original Title Deed', category: 'documents', required: true },
  { item: 'Registered Sale Agreement', category: 'documents', required: true },
  { item: 'NOC from Society', category: 'documents', required: true },
  { item: 'Tax Paid Receipts', category: 'documents', required: true },
  { item: 'Utility Bills (Latest)', category: 'documents', required: true },
  { item: 'Building Approval Letter', category: 'documents', required: false },
  { item: 'Insurance Documents', category: 'documents', required: false },

  // Interior
  { item: 'All Rooms Painted', category: 'interior', required: true },
  { item: 'Flooring Complete', category: 'interior', required: true },
  { item: 'Electrical Points Working', category: 'interior', required: true },
  { item: 'Bathroom Fixtures Installed', category: 'interior', required: true },
  { item: 'Kitchen Fixtures Installed', category: 'interior', required: true },
  { item: 'Windows and Doors Fitted', category: 'interior', required: true },
  { item: 'Ceiling Complete', category: 'interior', required: true },

  // Exterior
  { item: 'Building Exterior Finished', category: 'exterior', required: true },
  { item: 'Common Areas Clean', category: 'exterior', required: true },
  { item: 'Parking Area Marked', category: 'exterior', required: false },
  { item: 'Garden/Landscaping Done', category: 'exterior', required: false },

  // Utilities
  { item: 'Electricity Connection Active', category: 'utilities', required: true },
  { item: 'Water Connection Active', category: 'utilities', required: true },
  { item: 'Society Access Provided', category: 'utilities', required: true },
  { item: 'Gas Connection Setup', category: 'utilities', required: false },
  { item: 'Internet/TV Connection Ready', category: 'utilities', required: false },
];

export const getChecklistByCategory = (category: ChecklistCategory): DefaultChecklistItem[] => {
  return DEFAULT_CHECKLIST.filter(item => item.category === category);
};

export const getRequiredChecklistItems = (): DefaultChecklistItem[] => {
  return DEFAULT_CHECKLIST.filter(item => item.required);
};