import {
  Treatment,
  TreatmentCategory,
  CustomerPreferences,
  SkinType,
  BudgetLevel,
} from '../types';

// Spa Industry Knowledge Base
// This contains treatment data, skin type mappings, and business logic rules

export const TREATMENTS_DATABASE: Treatment[] = [
  // Massage Therapies
  {
    treatmentId: 'massage-swedish',
    name: 'Swedish Massage',
    category: 'swedish',
    description: 'Classic relaxation massage using long, flowing strokes to ease tension and improve circulation',
    duration: 60,
    basePrice: 80,
    benefits: ['Relaxation', 'Stress Relief', 'Improved Circulation', 'Muscle Relaxation'],
    suitableFor: ['first-time spa visitors', 'stressed individuals', 'general relaxation'],
    contraindications: ['acute inflammation', 'blood clots', 'severe osteoporosis'],
    seasonality: { peakMonths: [11, 12], lowMonths: [6, 7], priceMultiplier: 1.0 },
    popularityScore: 0.95,
  },
  {
    treatmentId: 'massage-deep-tissue',
    name: 'Deep Tissue Massage',
    category: 'deep-tissue',
    description: 'Intensive massage targeting deeper muscle layers to release chronic tension and knots',
    duration: 75,
    basePrice: 110,
    benefits: ['Chronic Pain Relief', 'Muscle Tension Release', 'Injury Recovery', 'Posture Improvement'],
    suitableFor: ['athletes', 'chronic pain sufferers', 'desk workers'],
    contraindications: ['recent surgery', 'blood clotting issues', 'osteoporosis'],
    seasonality: { peakMonths: [1, 2], lowMonths: [7, 8], priceMultiplier: 1.15 },
    popularityScore: 0.85,
  },
  {
    treatmentId: 'massage-hot-stone',
    name: 'Hot Stone Massage',
    category: 'hot-stone',
    description: 'Heated basalt stones placed on key points while massage techniques are applied',
    duration: 90,
    basePrice: 130,
    benefits: ['Deep Relaxation', 'Muscle Loosening', 'Improved Blood Flow', 'Stress Reduction'],
    suitableFor: ['cold individuals', 'muscle stiffness', 'anxiety sufferers'],
    contraindications: ['high blood pressure', 'diabetes', 'sensitive skin', 'pregnancy'],
    seasonality: { peakMonths: [11, 12, 1], lowMonths: [6, 7], priceMultiplier: 1.25 },
    popularityScore: 0.75,
  },
  {
    treatmentId: 'massage-aromatherapy',
    name: 'Aromatherapy Massage',
    category: 'aromatherapy',
    description: 'Combination of massage with essential oils selected for specific therapeutic benefits',
    duration: 60,
    basePrice: 95,
    benefits: ['Emotional Balance', 'Stress Relief', 'Mood Enhancement', 'Skin Nourishment'],
    suitableFor: ['emotional stress', 'anxiety', 'mild depression', 'sleep issues'],
    contraindications: ['essential oil allergies', 'pregnancy', 'asthma'],
    seasonality: { peakMonths: [2, 3, 9, 10], lowMonths: [6], priceMultiplier: 1.1 },
    popularityScore: 0.8,
  },
  {
    treatmentId: 'massage-thai',
    name: 'Thai Massage',
    category: 'thai',
    description: 'Ancient healing practice combining acupressure, yoga-like stretching, and energy work',
    duration: 90,
    basePrice: 100,
    benefits: ['Flexibility Improvement', 'Energy Boost', 'Stress Relief', 'Circulation Enhancement'],
    suitableFor: ['flexibility seekers', 'active individuals', 'energy boost seekers'],
    contraindications: ['heart conditions', 'high blood pressure', 'back injuries'],
    seasonality: { peakMonths: [4, 5], lowMonths: [12], priceMultiplier: 1.05 },
    popularityScore: 0.6,
  },
  {
    treatmentId: 'massage-bali',
    name: 'Bali Massage',
    category: 'bali',
    description: 'Traditional Balinese massage combining gentle stretches, acupressure, and aromatherapy',
    duration: 60,
    basePrice: 85,
    benefits: ['Deep Relaxation', 'Muscle Tension Relief', 'Mental Clarity', 'Improved Circulation'],
    suitableFor: ['relaxation seekers', 'mental fatigue', 'sensitive individuals'],
    contraindications: ['skin conditions', 'fractures', 'recent injuries'],
    seasonality: { peakMonths: [1, 2, 7, 8], lowMonths: [11], priceMultiplier: 1.0 },
    popularityScore: 0.65,
  },
  {
    treatmentId: 'massage-ayurvedic',
    name: 'Ayurvedic Massage',
    category: 'ayurvedic',
    description: 'Traditional Indian healing massage using dosha-specific oils and techniques',
    duration: 75,
    basePrice: 120,
    benefits: ['Dosha Balance', 'Detoxification', 'Energy Alignment', 'Deep Nourishment'],
    suitableFor: ['traditional wellness seekers', 'dosha imbalances', 'detoxification'],
    contraindications: ['specific dosha conditions', 'acute illness', 'pregnancy'],
    seasonality: { peakMonths: [3, 4], lowMonths: [8], priceMultiplier: 1.2 },
    popularityScore: 0.5,
  },
  // Facial Treatments
  {
    treatmentId: 'facial-hydrating',
    name: 'Hydrating Facial',
    category: 'facial',
    description: 'Intensive moisture treatment for dehydrated and dry skin types',
    duration: 60,
    basePrice: 90,
    benefits: ['Deep Hydration', 'Moisture Lock', 'Skin Plumping', 'Radiance Restoration'],
    suitableFor: ['dry skin', 'dehydrated skin', 'winter skin', 'mature skin'],
    contraindications: ['acne flare-ups', 'rosacea', 'active skin infections'],
    seasonality: { peakMonths: [10, 11, 12], lowMonths: [6, 7], priceMultiplier: 1.15 },
    popularityScore: 0.88,
  },
  {
    treatmentId: 'facial-anti-aging',
    name: 'Anti-Aging Facial',
    category: 'facial',
    description: 'Advanced treatment targeting fine lines, wrinkles, and signs of aging',
    duration: 75,
    basePrice: 140,
    benefits: ['Wrinkle Reduction', 'Skin Firming', 'Collagen Stimulation', 'Youthful Glow'],
    suitableFor: ['mature skin', 'aging concerns', 'prevention seekers'],
    contraindications: ['sensitive skin', 'active acne', 'rosacea'],
    seasonality: { peakMonths: [9, 10, 11], lowMonths: [6, 7], priceMultiplier: 1.3 },
    popularityScore: 0.82,
  },
  {
    treatmentId: 'facial-acne',
    name: 'Acne Control Facial',
    category: 'facial',
    description: 'Specialized treatment for acne-prone and problematic skin',
    duration: 60,
    basePrice: 95,
    benefits: ['Acne Reduction', 'Oil Control', 'Pore Minimizing', 'Skin Clarification'],
    suitableFor: ['acne-prone skin', 'oily skin', 'blemish-prone skin'],
    contraindications: ['severe cystic acne', 'open wounds', 'roaccutane treatment'],
    seasonality: { peakMonths: [3, 4, 9], lowMonths: [12], priceMultiplier: 1.1 },
    popularityScore: 0.7,
  },
  {
    treatmentId: 'facial-brightening',
    name: 'Brightening Facial',
    category: 'facial',
    description: 'Treatment focused on improving skin radiance and addressing dullness',
    duration: 60,
    basePrice: 100,
    benefits: ['Radiance Boost', 'Dark Spot Reduction', 'Even Skin Tone', 'Glow Enhancement'],
    suitableFor: ['dull skin', 'hyperpigmentation', 'smokers', 'tired skin'],
    contraindications: ['sensitive skin', 'rosacea', 'sunburned skin'],
    seasonality: { peakMonths: [2, 3, 4], lowMonths: [11, 12], priceMultiplier: 1.15 },
    popularityScore: 0.78,
  },
  {
    treatmentId: 'facial-sensitive',
    name: 'Sensitive Skin Facial',
    category: 'facial',
    description: 'Gentle, soothing treatment designed for sensitive and reactive skin',
    duration: 60,
    basePrice: 110,
    benefits: ['Calming', 'Redness Reduction', 'Barrier Strengthening', 'Comfort Restoration'],
    suitableFor: ['sensitive skin', 'rosacea', 'reactive skin', 'allergy-prone skin'],
    contraindications: ['active allergies', 'open wounds', 'severe eczema'],
    seasonality: { peakMonths: [5, 6, 9, 10], lowMonths: [1, 2], priceMultiplier: 1.2 },
    popularityScore: 0.65,
  },
  // Body Treatments
  {
    treatmentId: 'body-scrub-detox',
    name: 'Detox Body Scrub',
    category: 'scrub',
    description: 'Full body exfoliation treatment to remove dead skin and detoxify',
    duration: 45,
    basePrice: 75,
    benefits: ['Exfoliation', 'Detoxification', 'Skin Smoothness', 'Circulation Boost'],
    suitableFor: ['dull skin', 'pre-tanning', 'general refresh'],
    contraindications: ['sunburned skin', 'open wounds', 'sensitive skin'],
    seasonality: { peakMonths: [4, 5, 6], lowMonths: [11, 12], priceMultiplier: 1.0 },
    popularityScore: 0.6,
  },
  {
    treatmentId: 'body-wrap-detox',
    name: 'Detox Body Wrap',
    category: 'wrap',
    description: 'Wrapping treatment using mineral-rich compounds for detoxification',
    duration: 75,
    basePrice: 120,
    benefits: ['Deep Detox', 'Inch Loss', 'Skin Tightening', 'Mineral Replenishment'],
    suitableFor: ['detox seekers', 'post-weight loss', 'cellulite reduction'],
    contraindications: ['heart conditions', 'high blood pressure', 'pregnancy', 'diabetes'],
    seasonality: { peakMonths: [1, 2, 3], lowMonths: [7, 8], priceMultiplier: 1.1 },
    popularityScore: 0.55,
  },
  {
    treatmentId: 'body-wrap-slimming',
    name: 'Slimming Body Wrap',
    category: 'wrap',
    description: 'Targeted wrap treatment for body contouring and firmness',
    duration: 60,
    basePrice: 130,
    benefits: ['Firming', 'Contouring', 'Skin Tightening', 'Texture Improvement'],
    suitableFor: ['post-pregnancy', 'weight loss maintenance', 'firming needs'],
    contraindications: ['pregnancy', 'heart conditions', 'skin infections'],
    seasonality: { peakMonths: [3, 4, 5], lowMonths: [11, 12], priceMultiplier: 1.15 },
    popularityScore: 0.5,
  },
  // Hydrotherapy
  {
    treatmentId: 'hydrotherapy-thalasso',
    name: 'Thalassotherapy Bath',
    category: 'hydrotherapy',
    description: 'Therapeutic seawater bath for mineral replenishment and relaxation',
    duration: 30,
    basePrice: 65,
    benefits: ['Mineral Boost', 'Relaxation', 'Skin Nourishment', 'Circulation Improvement'],
    suitableFor: ['mineral deficiency', 'stress relief', 'skin nourishment'],
    contraindications: ['open wounds', 'infections', 'heart conditions', 'pregnancy'],
    seasonality: { peakMonths: [10, 11, 12], lowMonths: [6, 7], priceMultiplier: 1.05 },
    popularityScore: 0.45,
  },
  {
    treatmentId: 'hydrotherapy-jet',
    name: 'Hydrotherapy Jet Session',
    category: 'hydrotherapy',
    description: 'High-pressure water jets for muscle massage and relaxation',
    duration: 30,
    basePrice: 50,
    benefits: ['Muscle Massage', 'Circulation Boost', 'Tension Relief', 'Energy Boost'],
    suitableFor: ['muscle tension', 'sports recovery', 'circulation issues'],
    contraindications: ['heart conditions', 'high blood pressure', 'open wounds'],
    seasonality: { peakMonths: [1, 2, 7, 8], lowMonths: [4, 5], priceMultiplier: 1.0 },
    popularityScore: 0.4,
  },
  // Reflexology
  {
    treatmentId: 'reflexology-foot',
    name: 'Foot Reflexology',
    category: 'reflexology',
    description: 'Pressure point therapy on feet corresponding to body organs and systems',
    duration: 45,
    basePrice: 60,
    benefits: ['Organ Stimulation', 'Stress Relief', 'Energy Balance', 'Circulation Improvement'],
    suitableFor: ['stress relief', 'organ health', 'energy balancing', 'foot pain'],
    contraindications: ['foot injuries', 'gout', 'pregnancy', 'blood clotting issues'],
    seasonality: { peakMonths: [1, 2, 11, 12], lowMonths: [6, 7], priceMultiplier: 1.0 },
    popularityScore: 0.7,
  },
  {
    treatmentId: 'reflexology-hand',
    name: 'Hand Reflexology',
    category: 'reflexology',
    description: 'Targeted pressure therapy on hands for quick stress relief',
    duration: 30,
    basePrice: 45,
    benefits: ['Quick Stress Relief', 'Energy Boost', 'Focus Enhancement', 'Hand Health'],
    suitableFor: ['office workers', 'quick relaxation', 'hand fatigue'],
    contraindications: ['hand injuries', 'arthritis flare', 'open wounds'],
    seasonality: { peakMonths: [1, 2, 9, 10], lowMonths: [7, 8], priceMultiplier: 1.0 },
    popularityScore: 0.35,
  },
  // Steam & Sauna
  {
    treatmentId: 'steam-aromatherapy',
    name: 'Aromatherapy Steam Session',
    category: 'steam',
    description: 'Steam therapy with essential oil infusions for respiratory and skin benefits',
    duration: 20,
    basePrice: 35,
    benefits: ['Respiratory Relief', 'Skin Cleansing', 'Relaxation', 'Toxin Release'],
    suitableFor: ['congestion', 'skin cleansing', 'relaxation seekers'],
    contraindications: ['heart conditions', 'high blood pressure', 'asthma', 'pregnancy'],
    seasonality: { peakMonths: [11, 12, 1, 2], lowMonths: [6, 7, 8], priceMultiplier: 0.9 },
    popularityScore: 0.5,
  },
  {
    treatmentId: 'sauna-traditional',
    name: 'Traditional Finnish Sauna',
    category: 'sauna',
    description: 'Dry heat sauna session for deep relaxation and detoxification',
    duration: 30,
    basePrice: 40,
    benefits: ['Detoxification', 'Muscle Relaxation', 'Cardiovascular Health', 'Stress Relief'],
    suitableFor: ['detox seekers', 'cardiovascular health', 'muscle relaxation'],
    contraindications: ['heart conditions', 'high blood pressure', 'pregnancy', 'epilepsy'],
    seasonality: { peakMonths: [10, 11, 12, 1, 2], lowMonths: [6, 7, 8], priceMultiplier: 0.95 },
    popularityScore: 0.55,
  },
];

// Skin Type to Treatment Mapping
export const SKIN_TYPE_TREATMENTS: Record<SkinType, string[]> = {
  normal: ['facial-hydrating', 'facial-brightening', 'body-scrub-detox'],
  dry: ['facial-hydrating', 'facial-sensitive', 'massage-aromatherapy', 'body-wrap-detox'],
  oily: ['facial-acne', 'facial-brightening', 'body-scrub-detox', 'hydrotherapy-jet'],
  combination: ['facial-brightening', 'facial-hydrating', 'massage-swedish'],
  sensitive: ['facial-sensitive', 'massage-swedish', 'reflexology-foot'],
  'acne-prone': ['facial-acne', 'body-scrub-detox', 'steam-aromatherapy'],
  mature: ['facial-anti-aging', 'massage-hot-stone', 'body-wrap-slimming'],
};

// Budget to Price Range Mapping
export const BUDGET_PRICE_RANGES: Record<BudgetLevel, { min: number; max: number }> = {
  economy: { min: 0, max: 60 },
  'mid-range': { min: 60, max: 120 },
  premium: { min: 120, max: 200 },
  luxury: { min: 200, max: Infinity },
};

// Treatment Category Mapping
export const CATEGORY_TREATMENTS: Record<TreatmentCategory, string[]> = {
  massage: ['massage-swedish', 'massage-deep-tissue', 'massage-hot-stone', 'massage-aromatherapy', 'massage-thai', 'massage-bali', 'massage-ayurvedic'],
  facial: ['facial-hydrating', 'facial-anti-aging', 'facial-acne', 'facial-brightening', 'facial-sensitive'],
  'body-treatment': ['body-scrub-detox', 'body-wrap-detox', 'body-wrap-slimming'],
  aromatherapy: ['massage-aromatherapy', 'steam-aromatherapy'],
  hydrotherapy: ['hydrotherapy-thalasso', 'hydrotherapy-jet'],
  reflexology: ['reflexology-foot', 'reflexology-hand'],
  'hot-stone': ['massage-hot-stone'],
  swedish: ['massage-swedish'],
  'deep-tissue': ['massage-deep-tissue'],
  thai: ['massage-thai'],
  bali: ['massage-bali'],
  ayurvedic: ['massage-ayurvedic'],
  steam: ['steam-aromatherapy'],
  sauna: ['sauna-traditional'],
  wrap: ['body-wrap-detox', 'body-wrap-slimming'],
  scrub: ['body-scrub-detox'],
  manicure: [],
  pedicure: [],
  'hair-treatment': [],
  waxing: [],
  other: [],
};

// Concern to Treatment Mapping
export const CONCERN_TREATMENTS: Record<string, string[]> = {
  stress: ['massage-swedish', 'massage-aromatherapy', 'massage-hot-stone', 'reflexology-foot'],
  tension: ['massage-deep-tissue', 'massage-swedish', 'hydrotherapy-jet'],
  relaxation: ['massage-swedish', 'massage-hot-stone', 'massage-aromatherapy', 'sauna-traditional'],
  pain: ['massage-deep-tissue', 'hydrotherapy-jet', 'reflexology-foot'],
  dryness: ['facial-hydrating', 'massage-aromatherapy', 'body-wrap-detox'],
  aging: ['facial-anti-aging', 'massage-hot-stone', 'body-wrap-slimming'],
  acne: ['facial-acne', 'steam-aromatherapy', 'body-scrub-detox'],
  dullness: ['facial-brightening', 'body-scrub-detox', 'hydrotherapy-thalasso'],
  fatigue: ['massage-thai', 'reflexology-foot', 'hydrotherapy-jet'],
  circulation: ['massage-deep-tissue', 'sauna-traditional', 'hydrotherapy-jet'],
  detoxification: ['body-wrap-detox', 'sauna-traditional', 'massage-ayurvedic'],
  flexibility: ['massage-thai', 'massage-bali'],
  'sleep': ['massage-swedish', 'massage-aromatherapy', 'reflexology-foot'],
  anxiety: ['massage-aromatherapy', 'massage-swedish', 'steam-aromatherapy'],
  'skin rejuvenation': ['facial-brightening', 'facial-anti-aging', 'facial-hydrating'],
  'energy boost': ['massage-thai', 'reflexology-hand', 'hydrotherapy-jet'],
};

// Time of Day Treatment Preferences
export const TIME_OF_DAY_PREFERENCES: Record<string, string[]> = {
  morning: ['reflexology-foot', 'reflexology-hand', 'facial-brightening', 'steam-aromatherapy'],
  afternoon: ['massage-swedish', 'facial-hydrating', 'body-scrub-detox'],
  evening: ['massage-swedish', 'massage-hot-stone', 'massage-aromatherapy', 'sauna-traditional'],
  any: TREATMENTS_DATABASE.map((t) => t.treatmentId),
};

// Duration-based Treatment Filtering
export const DURATION_TIERS: { max: number; treatments: string[] }[] = [
  { max: 30, treatments: ['reflexology-hand', 'steam-aromatherapy', 'hydrotherapy-jet', 'hydrotherapy-thalasso', 'sauna-traditional'] },
  { max: 45, treatments: ['reflexology-foot', 'body-scrub-detox', 'massage-swedish'] },
  { max: 60, treatments: ['massage-swedish', 'massage-aromatherapy', 'facial-hydrating', 'facial-acne', 'facial-brightening', 'facial-sensitive', 'massage-bali'] },
  { max: 75, treatments: ['massage-deep-tissue', 'facial-anti-aging', 'massage-ayurvedic', 'body-wrap-detox', 'body-wrap-slimming'] },
  { max: 90, treatments: ['massage-hot-stone', 'massage-thai'] },
];

// Seasonal Treatment Boost Mapping
export const SEASONAL_BOOSTS: Record<number, string[]> = {
  1: ['massage-hot-stone', 'facial-anti-aging', 'sauna-traditional', 'body-wrap-detox'], // January - Winter wellness
  2: ['facial-brightening', 'body-wrap-detox', 'massage-aromatherapy'], // February - Pre-spring detox
  3: ['body-wrap-slimming', 'facial-brightening', 'body-scrub-detox'], // March - Spring prep
  4: ['body-scrub-detox', 'massage-thai', 'facial-brightening'], // April - Spring renewal
  5: ['body-scrub-detox', 'facial-sensitive', 'massage-aromatherapy'], // May - Summer prep
  6: ['facial-hydrating', 'facial-acne', 'hydrotherapy-jet'], // June - Summer skin care
  7: ['hydrotherapy-jet', 'hydrotherapy-thalasso', 'facial-acne', 'facial-hydrating'], // July - Summer cool down
  8: ['hydrotherapy-jet', 'facial-acne', 'steam-aromatherapy'], // August - Summer end
  9: ['facial-sensitive', 'facial-acne', 'massage-aromatherapy', 'facial-anti-aging'], // September - Back to routine
  10: ['facial-sensitive', 'facial-anti-aging', 'massage-aromatherapy', 'reflexology-foot'], // October - Fall wellness
  11: ['facial-anti-aging', 'massage-hot-stone', 'facial-hydrating', 'sauna-traditional'], // November - Pre-holiday prep
  12: ['massage-hot-stone', 'facial-hydrating', 'facial-anti-aging', 'sauna-traditional', 'steam-aromatherapy'], // December - Holiday relaxation
};

// Wellness Package Templates
export const WELLNESS_PACKAGES = [
  {
    packageId: 'package-relaxation-essentials',
    name: 'Relaxation Essentials',
    description: 'A complete relaxation journey for stress relief',
    treatments: ['massage-swedish', 'reflexology-foot'],
    originalPrice: 140,
    packagePrice: 115,
    recommendedFor: ['stress relief', 'first-time spa visitors', 'general relaxation'],
    validity: 90,
  },
  {
    packageId: 'package-detox-revival',
    name: 'Detox & Revival',
    description: 'Full body detox and revitalization package',
    treatments: ['body-scrub-detox', 'body-wrap-detox', 'hydrotherapy-thalasso'],
    originalPrice: 260,
    packagePrice: 199,
    recommendedFor: ['detox seekers', 'post-weight loss', 'seasonal refresh'],
    validity: 60,
  },
  {
    packageId: 'package-anti-aging-luxury',
    name: 'Anti-Aging Luxury',
    description: 'Premium anti-aging treatment for mature skin',
    treatments: ['facial-anti-aging', 'massage-hot-stone', 'hydrotherapy-thalasso'],
    originalPrice: 335,
    packagePrice: 275,
    recommendedFor: ['mature skin', 'aging concerns', 'special occasions'],
    validity: 90,
  },
  {
    packageId: 'package-energizing-morning',
    name: 'Energizing Morning',
    description: 'Start your day with energy and vitality',
    treatments: ['reflexology-hand', 'massage-thai', 'steam-aromatherapy'],
    originalPrice: 180,
    packagePrice: 145,
    recommendedFor: ['energy seekers', 'morning people', 'pre-event preparation'],
    validity: 30,
  },
  {
    packageId: 'package-bridal-glow',
    name: 'Bridal Glow',
    description: 'Complete bridal preparation package for your special day',
    treatments: ['facial-brightening', 'facial-hydrating', 'body-scrub-detox', 'massage-aromatherapy'],
    originalPrice: 415,
    packagePrice: 329,
    recommendedFor: ['brides', 'special events', 'pre-wedding preparation'],
    validity: 180,
  },
  {
    packageId: 'package-stress-relief-monthly',
    name: 'Monthly Stress Relief',
    description: 'Subscribe to monthly stress relief sessions',
    treatments: ['massage-swedish', 'massage-aromatherapy'],
    originalPrice: 175,
    packagePrice: 135,
    recommendedFor: ['chronic stress', 'monthly subscribers', 'corporate wellness'],
    validity: 30,
  },
];

// Helper function to get treatments by IDs
export function getTreatmentsByIds(treatmentIds: string[]): Treatment[] {
  return TREATMENTS_DATABASE.filter((t) => treatmentIds.includes(t.treatmentId));
}

// Helper function to get current season
export function getCurrentSeason(): { season: 'spring' | 'summer' | 'autumn' | 'winter'; multiplier: number } {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return { season: 'spring', multiplier: 1.0 };
  if (month >= 6 && month <= 8) return { season: 'summer', multiplier: 0.95 };
  if (month >= 9 && month <= 11) return { season: 'autumn', multiplier: 1.05 };
  return { season: 'winter', multiplier: 1.15 };
}

// Helper function to get seasonal boosts for current month
export function getSeasonalBoostTreatments(): string[] {
  const month = new Date().getMonth() + 1;
  return SEASONAL_BOOSTS[month] || [];
}

// Calculate treatment score based on preferences
export function calculateTreatmentScore(
  treatment: Treatment,
  preferences: CustomerPreferences,
  pastVisits?: { treatmentId: string; satisfaction: number }[]
): number {
  let score = 50; // Base score

  // Skin type match
  if (preferences.skinType && treatment.suitableFor) {
    const skinMatch = preferences.skinType === 'sensitive' && treatment.category === 'facial' && treatment.treatmentId.includes('sensitive');
    const skinTypeMatch = SKIN_TYPE_TREATMENTS[preferences.skinType]?.includes(treatment.treatmentId);
    if (skinTypeMatch) score += 20;
    if (skinMatch) score += 10;
  }

  // Budget match
  if (preferences.budget) {
    const range = BUDGET_PRICE_RANGES[preferences.budget];
    if (treatment.basePrice >= range.min && treatment.basePrice <= range.max) {
      score += 15;
    } else if (treatment.basePrice < range.min) {
      score += 5; // Under budget is okay
    } else {
      score -= 10; // Over budget penalty
    }
  }

  // Duration match
  if (preferences.duration) {
    const durationDiff = Math.abs(treatment.duration - preferences.duration);
    if (durationDiff <= 15) score += 10;
    else if (durationDiff <= 30) score += 5;
    else score -= 5;
  }

  // Time preference match
  if (preferences.preferredTime) {
    const timeMatch = TIME_OF_DAY_PREFERENCES[preferences.preferredTime]?.includes(treatment.treatmentId);
    if (timeMatch) score += 5;
  }

  // Seasonal boost
  const seasonalBoosts = getSeasonalBoostTreatments();
  if (seasonalBoosts.includes(treatment.treatmentId)) {
    score += 10;
  }

  // Past satisfaction bonus
  if (pastVisits) {
    const pastVisit = pastVisits.find((v) => v.treatmentId === treatment.treatmentId);
    if (pastVisit) {
      score += pastVisit.satisfaction * 5; // 0-5 satisfaction -> 0-25 bonus
    }
  }

  // Popularity bonus
  if (treatment.popularityScore) {
    score += treatment.popularityScore * 10;
  }

  return Math.min(100, Math.max(0, score));
}
